# Extractable Components

## AppHeader
- Source: `app/components/AppHeader.vue`
- Category: layout
- Description: Identity header with grounded status, navigation, résumé action, and context toggle.
- Extractable props: `contextOpen` (boolean)
- Hardcoded: Identity, role, labels, CSS classes.

## SystemContextRail
- Source: `app/components/SystemContextRail.vue`
- Category: layout
- Description: Desktop context rail and responsive drawer containing model, knowledge, and tool state.
- Extractable props: `open` (boolean)
- Hardcoded: Resource/tool fixtures and CSS classes.

## ConversationTurn
- Source: `app/components/ConversationTurn.vue`
- Category: basic
- Description: Reusable user/assistant transcript pair.
- Extractable props: `label` (string), `muted` (boolean)
- Hardcoded: Assistant label and slot structure.
