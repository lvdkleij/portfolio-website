# Lucas AI Portfolio Design System

## Product and experience

A single-page, ephemeral portfolio chat for visitors exploring Lucas van der Kleij’s engineering work and approach. The chat transcript is the primary reading surface. A fixed composer sits above the lower edge; a collapsible system-context rail explains model, sources, tools, and execution metadata. User prompts must read immediately as user-authored, while assistant answers retain the editorial document style.

## Visual direction

Keep the existing calm newspaper/editorial character. The surface is warm paper, not a generic white SaaS dashboard. Use restrained blue, green, gold, and clay accents. Chat conventions may inform placement and shape, but should be translated into this portfolio’s warm, quiet visual language.

## Tokens

- Background `--paper: #f6f0df`
- Surface `--fresh: #fffdf7`
- Primary text `--ink: #1e241f`
- Secondary text `--faded: #545b53`
- Border `--sage: #8a8f84`
- Primary accent `--blue: #246b85`; tint `--blue-soft: #e5f0f4`
- Success `--green: #356f58`; tint `--green-soft: #e5f1e9`
- Highlight `--acid: #f0d34a`; dark gold `--gold: #b08a00`
- Warning `--clay: #b6533d`; tint `--clay-soft: #f6e3dc`

## Typography

- Inter: prompts, body content, controls
- IBM Plex Mono: compact labels, metadata, counters
- DM Serif Display: portfolio identity and editorial assistant headings
- Desktop chat copy: 18px with roughly 1.55–1.6 line height; mobile: 16px

## Layout and components

- Desktop transcript max width 820px; 760px below 1180px; 16px side gutters on mobile.
- User prompts should be right-aligned as compact content-sized bubbles, maximum 70–75% of transcript width. Use a subtle warm neutral or pale blue surface, dark ink text, and 18–22px rounding. Avoid loud borders or shadows.
- The `YOU / NN` label belongs with the bubble and aligns to its right edge; keep it legible but subordinate.
- Assistant identity and answers remain left aligned, full reading width, unboxed, and editorial.
- Preserve 32px separation inside a turn and 72–96px between turns.
- Attachments remain visually attached to the user bubble and must not overflow.
- On mobile, user bubbles may grow to roughly 88% width; prompts and metadata must wrap safely.
- Preserve accessible focus rings, contrast, semantic order, and reduced-motion behavior.

## Motion

Use the current 160–340ms transitions and restrained easing. No new decorative animation is needed for prompt alignment.

