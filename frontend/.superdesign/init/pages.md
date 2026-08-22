# Pages and dependency trees

## / — Portfolio conversation studio

Entry: `frontend/app/app.vue`

Dependencies:
- `frontend/app/app.vue`
  - `frontend/app/types/chat.ts`
  - `frontend/app/composables/useBackendHeartbeat.ts`
  - `frontend/app/components/AppHeader.vue`
    - `frontend/app/composables/useBackendHeartbeat.ts`
  - `frontend/app/components/ConversationWorkspace.vue`
    - `frontend/app/types/chat.ts`
    - `frontend/app/composables/useChatStream.ts`
      - `frontend/app/types/chat.ts`
      - `frontend/app/utils/sse.ts`
        - `frontend/app/types/chat.ts`
    - `frontend/app/utils/chatHistory.ts`
      - `frontend/app/types/chat.ts`
    - `frontend/app/utils/chatLimits.ts`
    - `frontend/app/utils/markdown.ts`
    - `frontend/app/utils/chatScroll.ts`
    - `frontend/app/components/ConversationTurn.vue`
    - `frontend/app/components/PromptTrace.vue`
      - `frontend/app/types/chat.ts`
    - `frontend/app/components/StudioComposer.vue`
      - `frontend/app/types/chat.ts`
      - `frontend/app/utils/chatLimits.ts`
      - `frontend/app/components/JobAttachmentSheet.vue`
        - `frontend/app/types/chat.ts`
  - `frontend/app/components/SystemContextRail.vue`
    - `frontend/app/types/chat.ts`
- `frontend/app/assets/css/main.css`
- `frontend/nuxt.config.ts`

The route is a single-screen shell with conditional chat states. It includes empty/welcome, connecting, streaming, complete, error, cancelled, attachment, voice, privacy, trace, source, tool, and responsive context-rail states.
