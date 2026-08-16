# Page dependency trees

## `/` — Portfolio chat studio

Entry: `frontend/app/app.vue`

Dependencies:

- `frontend/app/app.vue`
  - `frontend/app/types/chat.ts`
  - `frontend/app/components/AppHeader.vue`
  - `frontend/app/components/ConversationWorkspace.vue`
    - `frontend/app/types/chat.ts`
    - `frontend/app/utils/chatHistory.ts`
      - `frontend/app/types/chat.ts`
    - `frontend/app/utils/chatLimits.ts`
    - `frontend/app/utils/markdown.ts`
    - `frontend/app/composables/useChatStream.ts`
      - `frontend/app/types/chat.ts`
      - `frontend/app/utils/sse.ts`
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
  - `frontend/app/assets/css/main.css` (global via `frontend/nuxt.config.ts`)

The actual desktop render branch is the template in `ConversationWorkspace.vue`: empty-state mark when no turns exist; otherwise repeated `ConversationTurn` components in a centered transcript, with the composer dock anchored over the lower edge. The app shell adds a header above and context rail to the right.

