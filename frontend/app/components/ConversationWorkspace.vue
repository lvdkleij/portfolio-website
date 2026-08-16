<script setup lang="ts">
import type {
  ChatClientError,
  ChatMessage,
  ChatRequest,
  ChatRuntimeContext,
  ChatSource,
  ChatState,
  ChatSubmission,
  ChatTraceStage,
  ChatUsage,
  JobAttachment,
  PastedJobAttachment,
} from '~/types/chat';
import { limitChatHistory } from '~/utils/chatHistory';
import { MAX_CHAT_PROMPT_LENGTH } from '~/utils/chatLimits';
import { renderSafeMarkdown } from '~/utils/markdown';
import { resolveMessageAnchor } from '~/utils/chatScroll';

const emit = defineEmits<{ runtimeChange: [runtime: ChatRuntimeContext] }>();

type GuestTurn = {
  id: string;
  user: ChatMessage;
  response: string;
  state: ChatState;
  trace: ChatTraceStage[];
  sources: ChatSource[];
  usage?: ChatUsage;
  error?: ChatClientError;
  requestId?: string;
  model?: string;
  durationMs?: number;
  attachment?: JobAttachment;
};

const scrollArea = ref<HTMLElement>();
const guestTurns = ref<GuestTurn[]>([]);
const activeTurnId = ref<string | null>(null);
const followStream = ref(false);

const {
  state: streamState,
  active,
  responseText,
  trace,
  sources,
  usage,
  error,
  requestId,
  model,
  durationMs,
  coldStart,
  start,
  stop,
} = useChatStream();

function createId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pastedAttachment(attachment?: JobAttachment): PastedJobAttachment | undefined {
  if (attachment?.source !== 'paste' || !attachment.textExcerpt) return undefined;
  return {
    type: 'pasted_job',
    label: attachment.label,
    content: attachment.textExcerpt.slice(0, 4000),
  };
}

function requestMessagesThrough(turnId: string) {
  const messages: ChatMessage[] = [];

  for (const turn of guestTurns.value) {
    if (turn.id === turnId) {
      messages.push(turn.user);
      break;
    }

    if (turn.state === 'complete' && turn.response.trim()) {
      messages.push(turn.user, {
        id: createId('assistant'),
        role: 'assistant',
        content: turn.response,
      });
    }
  }

  return limitChatHistory(messages);
}

function activeTurn() {
  return guestTurns.value.find((turn) => turn.id === activeTurnId.value);
}

function syncActiveTurn() {
  const turn = activeTurn();
  if (!turn) return;

  turn.response = responseText.value;
  turn.state = streamState.value;
  turn.trace = [...trace.value];
  turn.sources = [...sources.value];
  turn.usage = usage.value ? { ...usage.value } : undefined;
  turn.error = error.value ? { ...error.value } : undefined;
  turn.requestId = requestId.value;
  turn.model = model.value;
  turn.durationMs = durationMs.value;

  emit('runtimeChange', {
    state: turn.state,
    requestId: turn.requestId,
    model: turn.model,
    durationMs: turn.durationMs,
    trace: [...turn.trace],
    sources: [...turn.sources],
    usage: turn.usage ? { ...turn.usage } : undefined,
  });
}

watch([streamState, responseText, trace, sources, usage, error, requestId, model, durationMs], syncActiveTurn, {
  deep: true,
  flush: 'sync',
});

watch(
  () => guestTurns.value[guestTurns.value.length - 1]?.response.length ?? 0,
  (length, previousLength) => {
    if (length === previousLength || !followStream.value || !activeTurnId.value) return;
    scrollToMessage(activeTurnId.value, 'response', 'smooth');
  },
  { flush: 'post' },
);

async function scrollToMessage(messageId: string, target: 'prompt' | 'response', behavior: ScrollBehavior = 'smooth') {
  await nextTick();
  const scroller = scrollArea.value;
  if (!scroller) return;

  const anchor = resolveMessageAnchor(scroller, messageId, target);
  if (!anchor) return;

  const scrollerRect = scroller.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  const composerClearance = window.innerWidth <= 640 ? 220 : 260;
  const viewportTop = scrollerRect.top + 28;
  const viewportBottom = scrollerRect.bottom - composerClearance;
  const currentTop = scroller.scrollTop;

  const aboveViewport = anchorRect.top < viewportTop;
  const belowViewport = anchorRect.bottom > viewportBottom;

  if (aboveViewport) {
    scroller.scrollTo({
      top: Math.max(0, currentTop + (anchorRect.top - viewportTop) - 18),
      behavior,
    });
    return;
  }

  if (belowViewport) {
    scroller.scrollTo({
      top: Math.max(0, currentTop + (anchorRect.bottom - viewportBottom) - 18),
      behavior,
    });
  }
}

function pauseStreamFollow() {
  if (active.value) followStream.value = false;
}

async function runTurn(turn: GuestTurn) {
  activeTurnId.value = turn.id;
  followStream.value = true;
  turn.response = '';
  turn.state = 'connecting';
  turn.trace = [];
  turn.sources = [];
  turn.usage = undefined;
  turn.error = undefined;
  turn.requestId = undefined;
  turn.model = undefined;
  turn.durationMs = undefined;

  const request: ChatRequest = {
    clientRequestId: createId('request'),
    messages: requestMessagesThrough(turn.id),
  };

  await start(request);

  if (followStream.value) {
    await nextTick();
    scrollToMessage(turn.id, 'response', 'smooth');
  }
}

function sendMessage(submission: ChatSubmission) {
  if (active.value) return;

  followStream.value = true;

  const attachment = pastedAttachment(submission.attachment);
  const id = createId('turn');
  const turn = reactive<GuestTurn>({
    id,
    user: {
      id: createId('user'),
      role: 'user',
      content: submission.prompt.slice(0, MAX_CHAT_PROMPT_LENGTH),
      attachment,
    },
    response: '',
    state: 'connecting',
    trace: [],
    sources: [],
    attachment: submission.attachment?.source === 'paste' ? submission.attachment : undefined,
  });

  guestTurns.value.push(turn);
  nextTick(() => scrollToMessage(turn.id, 'prompt', 'smooth'));
  void runTurn(turn);
}

function retryTurn(turn: GuestTurn) {
  if (active.value || turn !== guestTurns.value[guestTurns.value.length - 1]) return;
  followStream.value = true;
  void runTurn(turn);
}

function stopStream() {
  stop();
}

onMounted(() => {
  emit('runtimeChange', { state: 'idle', trace: [], sources: [] });
});

onBeforeUnmount(stop);
</script>

<template>
  <div id="top" class="conversation-workspace">
    <main
      ref="scrollArea"
      class="transcript-scroll"
      aria-label="Conversation with Lucas AI"
      @wheel.passive="pauseStreamFollow"
      @touchstart.passive="pauseStreamFollow"
      @pointerdown="pauseStreamFollow"
    >
      <div v-if="guestTurns.length === 0" class="empty-chat">
        <div class="empty-chat-mark" aria-hidden="true">
          <i class="empty-chat-edge edge-one" />
          <i class="empty-chat-edge edge-two" />
          <i class="empty-chat-edge edge-three" />
          <i class="empty-chat-node node-blue" />
          <i class="empty-chat-node node-green" />
          <i class="empty-chat-node node-gold" />
        </div>
        <h1>Ask about Lucas’s work, experience, or approach.</h1>
      </div>

      <div class="transcript">
        <div class="guest-messages" aria-live="polite" aria-relevant="additions text">
          <ConversationTurn
            v-for="(turn, index) in guestTurns"
            :key="turn.id"
            class="guest-turn"
            :data-message-id="turn.id"
            :label="`YOU / ${String(index + 1).padStart(2, '0')}`"
          >
            <template #prompt>
              <span>{{ turn.user.content }}</span>
              <span v-if="turn.attachment" class="turn-attachment"> <b>TXT</b>{{ turn.attachment.label }} </span>
            </template>

            <template #answer>
              <div v-if="turn.state === 'connecting' && !turn.response" class="thinking" role="status">
                <span class="thinking-dots" aria-hidden="true"><i /><i /><i /></span>
                <span>{{
                  coldStart && activeTurnId === turn.id ? 'Starting the assistant' : 'Connecting to the assistant'
                }}</span>
              </div>

              <div
                v-if="turn.response"
                class="guest-answer markdown-answer"
                :class="{ 'is-streaming': turn.state === 'streaming' }"
                :aria-busy="turn.state === 'streaming'"
                v-html="renderSafeMarkdown(turn.response)"
              />

              <div v-if="turn.state === 'error' && turn.error" class="chat-response-state error" role="alert">
                <span>{{ turn.error.message }}</span>
                <small v-if="turn.error.retryAfterSeconds"
                  >Try again in about {{ turn.error.retryAfterSeconds }} seconds.</small
                >
                <button v-if="turn.error.retryable" type="button" @click="retryTurn(turn)">Retry</button>
              </div>

              <div v-else-if="turn.state === 'cancelled'" class="chat-response-state cancelled" role="status">
                <span>Response stopped.</span>
                <button type="button" @click="retryTurn(turn)">Retry</button>
              </div>

              <PromptTrace
                v-if="turn.state !== 'idle'"
                :state="turn.state"
                :steps="turn.trace"
                :duration-ms="turn.durationMs"
                :source-count="turn.sources.length"
                :usage="turn.usage"
              />
            </template>
          </ConversationTurn>
        </div>
      </div>
    </main>

    <StudioComposer :state="streamState" @send="sendMessage" @stop="stopStream" />
  </div>
</template>
