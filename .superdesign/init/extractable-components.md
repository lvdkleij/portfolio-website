# Extractable Components

## Layout components

## AppHeader
- Source: `frontend/app/components/AppHeader.vue`
- Category: layout
- Description: Shared top navigation and portfolio identity bar.
- Extractable props: `contextOpen` (boolean, default: true)
- Hardcoded: Identity text, Work and Résumé links, grounded badge, CSS classes

## SystemContextRail
- Source: `frontend/app/components/SystemContextRail.vue`
- Category: layout
- Description: Collapsible runtime metadata rail at the right side of the app.
- Extractable props: `open` (boolean, default: true)
- Hardcoded: Section labels, metadata structure, status colors, CSS classes

## Basic components

## ConversationTurn
- Source: `frontend/app/components/ConversationTurn.vue`
- Category: basic
- Description: Reusable chat turn with user prompt followed by assistant response.
- Extractable props: `label` (string, default: "YOU / 01")
- Hardcoded: `LUCAS / AI` assistant identity and CSS classes

## PromptTrace
- Source: `frontend/app/components/PromptTrace.vue`
- Category: basic
- Description: Collapsible server-reported execution status and stage list.
- Extractable props: `state`, `durationMs`, `sourceCount`
- Hardcoded: Status wording, activity bars, CSS classes

