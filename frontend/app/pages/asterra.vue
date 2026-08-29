<script setup lang="ts">
const conversationSession = ref(0)
const newChatAnnouncement = ref('')

const { state: agentState } = useBackendHeartbeat()

useSeoMeta({
  title: 'Asterra Bank AI Assistant — A Case Study by Lucas van der Kleij',
  description: 'A fictional European AI banking assistant case study by Lucas van der Kleij.',
  ogTitle: 'Asterra Bank AI Assistant — A Case Study by Lucas van der Kleij',
  ogDescription: 'A fictional European AI banking assistant case study by Lucas van der Kleij.'
})

useHead({
  link: [{ rel: 'canonical', href: 'https://lucasvanderkleij.dev/asterra' }],
  meta: [{ name: 'theme-color', content: '#F5F7FF' }]
})

function startNewChat() {
  conversationSession.value += 1
  newChatAnnouncement.value = ''

  nextTick(() => {
    newChatAnnouncement.value = 'New ephemeral chat started'
    document.querySelector<HTMLTextAreaElement>('#asterra-question')?.focus()
  })
}
</script>

<template>
  <div class="asterra-app">
    <span class="sr-only" aria-live="polite">{{ newChatAnnouncement }}</span>
    <div class="case-study-strip">A case study by Lucas van der Kleij</div>
    <div class="asterra-layout">
      <CaseStudyPanel />
      <section class="assistant-pane" aria-label="Asterra Bank assistant">
        <main class="assistant-stage" aria-label="Asterra banking assistant workspace">
          <div class="assistant-workspace">
            <AppHeader :agent-state="agentState" @new-chat="startNewChat" />
            <ConversationWorkspace :key="conversationSession" />
          </div>
        </main>
      </section>
    </div>
  </div>
</template>
