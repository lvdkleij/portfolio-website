# Page Dependency Trees

## / — Asterra Bank AI Assistant Case Study

Entry: `frontend/app/app.vue`

Dependencies:

- `frontend/app/app.vue`
  - `frontend/app/components/CaseStudyPanel.vue`
  - `frontend/app/components/AppHeader.vue`
    - `frontend/app/composables/useBackendHeartbeat.ts`
  - `frontend/app/components/ConversationWorkspace.vue`
    - `frontend/app/components/ConversationTurn.vue`
    - `frontend/app/components/PromptTrace.vue`
      - `frontend/app/types/chat.ts`
    - `frontend/app/components/StudioComposer.vue`
      - `frontend/app/components/JobAttachmentSheet.vue`
        - `frontend/app/types/chat.ts`
      - `frontend/app/types/chat.ts`
      - `frontend/app/utils/chatLimits.ts`
    - `frontend/app/composables/useChatStream.ts`
      - `frontend/app/types/chat.ts`
      - `frontend/app/utils/sse.ts`
    - `frontend/app/types/chat.ts`
    - `frontend/app/utils/chatHistory.ts`
    - `frontend/app/utils/chatLimits.ts`
    - `frontend/app/utils/chatScroll.ts`
    - `frontend/app/utils/markdown.ts`
  - `frontend/app/composables/useBackendHeartbeat.ts`
- Global styling: `frontend/app/assets/css/main.css`
- Nuxt configuration: `frontend/nuxt.config.ts`

Rendered desktop structure:

1. Slim cobalt authorship strip.
2. Independently scrollable 35% case-study document.
3. 65% assistant stage containing a rounded white workspace.
4. Integrated Asterra toolbar with visible backend status.
5. Scrollable Alex conversation and fixed bottom composer.

Below 1024px the document and assistant stack vertically.
