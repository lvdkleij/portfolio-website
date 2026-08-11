<script setup lang="ts">
import type { ChatRuntimeContext } from '~/types/chat'

const contextOpen = ref(true)
const chatRuntime = ref<ChatRuntimeContext | null>(null)
const conversationSession = ref(0)
const showConversationExamples = ref(true)
const newChatAnnouncement = ref('')

function startNewChat() {
  chatRuntime.value = null
  showConversationExamples.value = false
  conversationSession.value += 1
  newChatAnnouncement.value = ''

  nextTick(() => {
    newChatAnnouncement.value = 'New ephemeral chat started'
    document.querySelector<HTMLTextAreaElement>('#prompt')?.focus()
  })
}

onMounted(() => { if (window.innerWidth <= 900) contextOpen.value = false })
</script>

<template>
  <div class="studio-shell">
    <NuxtRouteAnnouncer />
    <span class="sr-only" aria-live="polite">{{ newChatAnnouncement }}</span>
    <AppHeader
      :context-open="contextOpen"
      @new-chat="startNewChat"
      @toggle-context="contextOpen = !contextOpen"
    />
    <div class="studio-body">
      <ConversationWorkspace
        :key="conversationSession"
        :show-examples="showConversationExamples"
        @runtime-change="chatRuntime = $event"
      />
      <SystemContextRail :open="contextOpen" :runtime="chatRuntime" @close="contextOpen = false" />
      <Transition name="context-tab">
        <button v-if="!contextOpen" class="context-tab" type="button" @click="contextOpen = true">
          <i class="dot" /> Context
        </button>
      </Transition>
    </div>
  </div>
</template>
