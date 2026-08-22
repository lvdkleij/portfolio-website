# Extractable components

The catalog reflects the current site. For the requested Asterra redesign, these may be used as structural references, but their visual language should not be carried forward because the user explicitly requested a fresh design system.

## AppHeader

- Source: `frontend/app/components/AppHeader.vue`
- Category: layout
- Description: Persistent header with Lucas authorship, agent availability, portfolio links, and context control.
- Extractable props: `contextOpen` (boolean), `agentState` (connecting | ready | stopped).
- Hardcoded: Lucas identity, location, nav labels, status labels, CSS classes.

## ConversationWorkspace

- Source: `frontend/app/components/ConversationWorkspace.vue`
- Category: layout
- Description: Primary transcript workspace and fixed composer region.
- Extractable props: none; current behavior is internal.
- Hardcoded: empty-state copy, transcript labels, loading/error/cancelled copy, child component structure.

## SystemContextRail

- Source: `frontend/app/components/SystemContextRail.vue`
- Category: layout
- Description: Right-side evidence and execution-metadata rail with responsive overlay behavior.
- Extractable props: `open` (boolean), `runtime` (ChatRuntimeContext | null).
- Hardcoded: section labels, empty state, model grid labels, source/tool row structure.

## ConversationTurn

- Source: `frontend/app/components/ConversationTurn.vue`
- Category: basic
- Description: Reusable prompt/answer pair with named slots.
- Extractable props: `label` (string).
- Hardcoded: assistant identity label, DOM structure, CSS classes.

## PromptTrace

- Source: `frontend/app/components/PromptTrace.vue`
- Category: basic
- Description: Expandable request-state and execution-metadata disclosure.
- Extractable props: `state`, `steps`, `durationMs`, `sourceCount`, `usage`.
- Hardcoded: status language, disclosure language, icons, tone classes.

## StudioComposer

- Source: `frontend/app/components/StudioComposer.vue`
- Category: basic
- Description: Chat input with attachment, privacy, voice, send, and stop controls.
- Extractable props: `state` (ChatState).
- Hardcoded: prompt and privacy copy, icons, 4,000-character limit behavior, nested attachment sheet.

## JobAttachmentSheet

- Source: `frontend/app/components/JobAttachmentSheet.vue`
- Category: basic
- Description: Add-context menu and paste form.
- Extractable props: none; open state is controlled by mounting.
- Hardcoded: menu items, validation copy, limits, icons, CSS classes.
