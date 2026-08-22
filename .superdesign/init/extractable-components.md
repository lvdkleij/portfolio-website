# Extractable Components

## AppHeader

- Source: `frontend/app/components/AppHeader.vue`
- Category: layout
- Description: Integrated Asterra brand toolbar and heartbeat state.
- Extractable props: `agentState` (connecting/ready/stopped)
- Hardcoded: Asterra mark, brand, demo label, Help and Close controls

## CaseStudyPanel

- Source: `frontend/app/components/CaseStudyPanel.vue`
- Category: layout
- Description: Editorial product explanation and fictional customer record.
- Extractable props: none
- Hardcoded: all case-study and fictional customer copy

## StudioComposer

- Source: `frontend/app/components/StudioComposer.vue`
- Category: basic
- Description: Persistent Asterra message composer with context attachment and streaming controls.
- Extractable props: `state` (chat state)
- Hardcoded: Alex labels, paperclip/send/stop icons, character-limit presentation

## ConversationTurn

- Source: `frontend/app/components/ConversationTurn.vue`
- Category: basic
- Description: Customer prompt and Asterra response presentation shell.
- Extractable props: `label` (string)
- Hardcoded: Alex identity, Asterra avatar, slot structure

## PromptTrace

- Source: `frontend/app/components/PromptTrace.vue`
- Category: basic
- Description: Expandable server execution metadata.
- Extractable props: `state`, `steps`, `durationMs`, `sourceCount`, `usage`
- Hardcoded: summary vocabulary and disclosure text
