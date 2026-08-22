# Asterra Bank AI Case Study — Design System

## Product context

A fictional European banking assistant case study by Lucas van der Kleij. The interface demonstrates customer-aware guidance while making it explicit that customer data, products, fees, projections, and actions are illustrative.

The single route uses a desktop 35%/65% split:

- Left: independently scrollable case-study document and fictional CRM-style customer record.
- Right: premium customer-facing banking chat with an integrated Asterra toolbar, an opening Alex message, an intentionally spacious transcript, and a bottom composer.
- Mobile: the document and assistant stack vertically without horizontal overflow.

## Visual direction

Calm, contemporary European banking. Use cool canvas surfaces, vivid cobalt for brand and action, restrained violet/aqua for data and process states, precise hairlines, generous whitespace, compact oval controls, and rounded white structural surfaces. Avoid gradients, glassmorphism, neon, stock photography, ornamental AI imagery, trading-terminal density, and heavy shadows.

## Tokens

### Colors

- Canvas / paper: #F5F7FF
- Surface: #FFFFFF
- Subtle surface: #EEF1FF
- Primary ink: #111629
- Secondary ink: #35405C
- Muted ink: #65708B
- Cobalt action: #2F43D8
- Bright cobalt: #5267FF
- Soft cobalt: #E7EBFF
- Violet: #7447E8; soft violet: #F0E9FF
- Aqua: #087F91; bright aqua: #27C4D4; soft aqua: #DCF7FA
- Hairline: #D8DEEE; strong hairline: #AAB4D2
- Warning: #8B5C12 on #F8EED8
- Error: #8B342F on #F7E7E5

### Typography

- Display/headings/brand: Space Grotesk, 600–700
- Body and financial values: Inter, 400–700
- Metadata and evidence labels: JetBrains Mono, 500
- Use tabular numerals for financial and timestamp values.

### Shape and elevation

- Main assistant workspace: 24px radius, restrained 0 8px 28px rgba(17,22,41,.08) shadow.
- Composer: 24px radius.
- Compact controls and status chips: fully rounded.
- Assistant identity: tight 20px transparent circle with a 0.75px black hairline and a 15px monochrome cobalt compass mark; vertically center the 15px “Alex” label in the same 20px alignment box using a 1.0 line-height and 6px gap.
- Customer messages: show only the right-aligned message bubble, without numbered “You” metadata.
- Supporting sheets/panels: 12–18px radius.
- Use 1px hairlines and no decorative borders or divider at the 35%/65% seam.

### Interaction and accessibility

- Minimum interactive target: 44px.
- Visible 2px cobalt focus ring with offset.
- Status meaning must include text, not color alone.
- Motion is limited to 160–200ms state transitions and subtle activity pulses.
- Disable effective animation for prefers-reduced-motion.
- Preserve semantic headings, labels, live regions, cancellation, retry, and keyboard submission.
