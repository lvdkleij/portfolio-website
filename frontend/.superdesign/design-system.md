# Asterra Bank — Portfolio Case Study Design System

## 1. Product context

Asterra Bank is a fictional European bank used in a Lucas van der Kleij portfolio case study. The experience demonstrates a customer-facing AI banking assistant that uses permissioned customer data and approved internal knowledge to help customers understand and act across everyday banking and considered financial decisions. The deep investment journey remains one example inside a broader experience.

The deliverable is design-only. It must never imply that a trade has been executed or that the fictional products, projections, fees, performance, or customer records are real.

### Audience

- Banking product, innovation, customer-experience, and AI leaders.
- Secondary audience: responsible-AI, compliance, and design-system practitioners.

### Primary job to be done

Help a customer ask naturally for what they need—view accounts and balances, understand transactions, compare approved fictional products, explore saving, borrowing, investing, or insurance options, and begin a subscription or adviser-supported journey with the right permissions, disclosures, and confirmations. The assistant provides contextual guidance and clear next steps; it is not centered on producing a plan.

### Authorship

- The case study remains visibly authored by Lucas van der Kleij.
- Landing-page navigation and footer must include “A case study by Lucas van der Kleij.”
- Asterra Bank is the demonstrated product; Lucas is the author, not an Asterra employee.

## 2. Information architecture and states

### Case-study landing page

Desktop uses a split-screen composition:

- Left, exactly 35%: a restrained markdown-style explanation of the demo and a compact CRM-style fictional customer profile. This is editorial context, not a marketing landing page or dashboard.
- Right, exactly 65%: the Asterra assistant conversation start, with the integrated toolbar at the top, one opening message from the named assistant, generous empty conversation space, and the composer anchored at the bottom.
- Do not add a third column, evidence rail, journey navigation, hero illustration, or floating side panel.

The left-pane customer section should resemble a readable CRM record expressed through markdown-style definition rows, not a card grid. Keep these fictional fields grouped under quiet labels such as “Relationship,” “Financial picture,” and “Preferences & permissions”:

- Name: Lucas De Smet.
- Customer ID: AST-10482.
- Residency: Brussels, Belgium.
- Customer since: 2019.
- Relationship: Personal Banking.
- Products: Current account · Savings account.
- Employment: Salaried · Permanent contract.
- Savings: €20,000.
- Monthly income: €3,450.
- Essential spending: €2,050 / month.
- Risk tolerance: Medium.
- Horizon: 10+ years.
- Primary goal: Long-term growth.
- Liquidity preference: Keep six months accessible.
- Preferred channel: Mobile app.
- AI data consent: Not yet requested.
- KYC profile: Verified · Reviewed 18 Jul 2026.
- CRM refreshed: 22 Aug 2026 · 09:04 CET.

Keep the record visibly labelled “Fictional customer.” Preserve the closing note that all customer data, products, fees, and projections are fictional and illustrative.

Mobile stacks the narrative and assistant preview without horizontal overflow.

### Dedicated assistant demo

The shell supports these linked states:

1. Conversation start with the integrated Asterra toolbar, one opening message from Alex—the named Asterra assistant—and a bottom-anchored composer. Do not show a customer message, recommendation, task-card grid, or additional transcript before the customer starts.
2. Permission request with clear data categories, purpose, decline path, and analysis/loading state.
3. Suitability questions using compact selectable answers for goal, horizon, liquidity, and risk.
4. Recommendation anchor with financial snapshot, emergency buffer, investable amount, product/portfolio comparison, projections, fees, risks, and inline citations.
5. Prepared plan with review summary, assumptions, disclosures, adviser handoff, and no trade execution.

### Required system and exception states

- Loading/analysis in progress.
- Source temporarily unavailable with a plain-language fallback.
- Insufficient emergency buffer, with investment amount reduced to €0.
- Human escalation for uncertain suitability or sensitive needs.
- Declined data permission with a general-guidance path.
- Prepared-plan success state that explicitly stops before trade confirmation.

## 3. Design direction

### North star

Contemporary-trust with more energy: premium European banking expressed through calm typography, exact alignment, cool luminous surfaces, a confident cobalt brand color, and precise flat financial visuals. The page should feel current and customer-friendly while retaining the discipline of a regulated product.

### Chosen style source

Use the broad visual cues of modern European finance products—bright primary color, cool white surfaces, high-contrast controls, generous whitespace, and crisp mobile-first cards—without reproducing Revolut's identity, exact palette, imagery, logo, or layouts.

- Make vivid cobalt the unmistakable Asterra primary.
- Use violet and aqua only as secondary data accents, never as competing brand colors.
- Keep the flat, 2D precision and quiet structural hairlines.
- Use saturation to clarify actions, selections, and financial visuals rather than as decoration.
- Do not use decorative bento mosaics as background noise. Grid structure must clarify hierarchy and calculations.

### Visual constraints

- No gradients.
- No glassmorphism.
- No heavy shadows; default is no shadow.
- No 3D objects, abstract AI blobs, glowing orbs, neon, or stock photography.
- Do not imitate Revolut's logo, photography, type treatments, component compositions, or exact blue palette.
- Use soft oval geometry for compact controls, prompt chips, and action buttons. Keep the large composer and content cards generously rounded but not pill-shaped.
- Do not make the interface look like a trading terminal.
- Prefer hairlines, measured spacing, flat fills, and typographic hierarchy.

## 4. Foundations

### Color tokens

| Token | Value | Role |
|---|---:|---|
| `canvas` | `#F5F7FF` | Cool page and product-shell background |
| `surface` | `#FFFFFF` | Primary cards and assistant canvas |
| `surface-subtle` | `#EEF1FF` | Secondary panels and data rows |
| `ink-950` | `#111629` | Primary text and high-contrast controls |
| `ink-700` | `#35405C` | Secondary text |
| `ink-500` | `#65708B` | Metadata text; use only at accessible sizes |
| `cobalt-700` | `#2F43D8` | Primary buttons, active controls, links, and key chart segments |
| `cobalt-600` | `#5267FF` | Brand accent and emphasis on non-text surfaces |
| `cobalt-100` | `#E7EBFF` | Selected rows, customer messages, and soft brand surfaces |
| `violet-600` | `#7447E8` | Secondary portfolio and projection accent |
| `violet-100` | `#F0E9FF` | Soft violet data surface |
| `aqua-700` | `#087F91` | Accessible secondary data text and status |
| `aqua-400` | `#27C4D4` | Chart-only secondary accent |
| `aqua-100` | `#DCF7FA` | Soft aqua data surface |
| `line` | `#D8DEEE` | Default 1px divider and card border |
| `line-strong` | `#AAB4D2` | Active table and chart axes |
| `amber-700` | `#8B5C12` | Caution text and risk emphasis |
| `amber-100` | `#F8EED8` | Caution surface |
| `red-700` | `#8B342F` | Error and blocking risk text |
| `red-100` | `#F7E7E5` | Error surface |

Color never carries meaning alone. Pair status colors with text labels and simple icons.

### Typography

- Display and section headings: Space Grotesk, 600–700.
- Body, controls, and financial data: Inter, 400–700.
- Small evidence labels, timestamps, and calculation notation: JetBrains Mono, 500.
- Do not introduce serif or decorative fonts.
- Use tabular numerals for euro values, percentages, dates, and projections.

Desktop scale:

- Display: 56px / 1.0, letter-spacing -0.04em.
- H1 in product shell: 36px / 1.1.
- H2: 28px / 1.15.
- H3/card title: 18px / 1.3.
- Body large: 18px / 1.55.
- Body: 15px / 1.55.
- Small: 13px / 1.45.
- Metadata: 11px / 1.4, 0.05em tracking.

Mobile display: 38px / 1.04. Mobile H1: 30px / 1.1.

### Spacing and sizing

- Base spacing unit: 4px.
- Core rhythm: 8, 12, 16, 20, 24, 32, 40, 48, 64, 80px.
- Desktop content max width: 1440px.
- Landing split: exactly 35% markdown narrative / 65% assistant. Do not draw a vertical divider at the seam; distinguish the panes through background, spacing, and alignment.
- Assistant conversation column: 720–820px readable width.
- Touch targets: minimum 44×44px.
- Card padding: 20px mobile, 24px compact desktop, 32px feature cards.

### Shape and borders

- Default border: 1px solid `line`.
- Strong dividers and selected controls: 1px solid `cobalt-700`.
- Large workspace and content-card radius: 24px.
- Large multi-line composer radius: 24px.
- Compact inputs, buttons, prompt chips, and status controls: 999px for an oval silhouette.
- Status pill radius: 999px, used sparingly.
- The assistant workspace may use one restrained outer shadow for separation: `0 8px 28px rgba(17,22,41,.08)`. Keep all other surfaces flat. If an overlay requires stronger separation, use `0 12px 40px rgba(17,22,41,.12)` only.

### Motion

- 160–220ms ease-out for hover, selection, and accordion changes.
- Analysis state uses a quiet left-to-right progress line and text updates, not a looping AI animation.
- Charts reveal once with reduced vertical motion.
- Respect `prefers-reduced-motion`; replace transforms with immediate state changes.

## 5. Shell and navigation

### Asterra product shell

- The Asterra toolbar lives inside the rounded white assistant workspace at its top edge. It is not a separate full-width header band.
- The integrated toolbar includes a simple abstract compass/star mark plus “Asterra Bank” wordmark and “Illustrative demo” status on the left, with compact Help and Close controls on the right.
- Use whitespace and alignment for separation. Do not add a horizontal rule beneath the toolbar, a vertical rule at the split seam, or a visible outline around the assistant workspace.
- Keep the toolbar close to the workspace top edge with approximately 16px top inset on desktop and mobile.
- The demo mark may be a simple geometric inline SVG; no existing brand asset is available.
- Desktop toolbar target height: 56–60px. Mobile: 52–56px, wrapping or simplifying controls without leaving the workspace.
- Product shell background is `canvas`; conversation content is `surface`.

### Lucas case-study shell

- Small top bar includes Lucas name, “Case study,” and an understated “Let’s talk” link.
- On the landing page, the author bar is distinct from the fictional banking shell.
- Do not merge Lucas’s identity into the Asterra logo area.

## 6. Conversational UI patterns

### Assistant message

- Left-aligned, no speech bubble for long guidance.
- The assistant is named **Alex**. Use the identity label “Alex · Asterra assistant” and a small Asterra compass/star avatar before the opening message.
- Paragraph width max 64 characters.
- Rich components align to the same message column but may expand wider on desktop.

### Customer message

- Compact right-aligned `cobalt-100` surface with readable `ink-950` text and an explicit “You” label when context requires.

### Opening conversation state

- Within the right pane, use a soft `canvas` inset around one generous `surface` workspace with a 24px radius and the restrained workspace shadow token. The integrated Asterra toolbar sits inside this same white surface. Use compact internal padding: 16px vertical and 16px mobile / 24px tablet / 32px desktop horizontal. Separate the toolbar from the conversation with whitespace, not a band, border, or rule.
- Start the conversation with one left-aligned message from Alex near the top of the available chat area. Use the exact opening copy: “Good morning, Lucas. I’m Alex, your Asterra assistant. What can I help you with today?”
- Precede the message with the Asterra compass/star avatar and the identity label “Alex · Asterra assistant”. The message should feel warm and personal without an oversized hero treatment or decorative AI motif.
- Leave the middle of the conversation intentionally empty and anchor the composer to the bottom of the white workspace.
- Do not show the previous centered greeting, “How can Asterra help today?” hero heading, circular hero mark, “Suggested for you” label, task cards, quick-action pills, customer message, recommendation, financial chart, or detailed product information before the customer starts.
- Apply the supplied named-assistant screenshot only to the opening-message hierarchy; do not reproduce its bank identity, assistant name, black theme, language, colors, quick actions, or exact layout.
- Selected state uses a check icon plus border and background change.
- Focus state uses a 2px `cobalt-700` outline with 2px offset.

### Composer

- Use a wide rounded composer anchored at the bottom of the chat workspace. Keep it compact enough to feel like a persistent messaging control rather than a content card.
- Placeholder: “Message Alex”.
- Include a compact oval context chip, attachment/action affordance, and cobalt send control with accessible labels and 44px minimum targets.
- The Alex opening message, generous empty chat space, and bottom composer are the only inner conversation content in the untouched state.

### Primary actions

- Primary: `cobalt-700` fill, white text, min height 48px.
- Secondary: surface fill, `cobalt-700` border/text.
- Tertiary: text link with visible underline offset.
- Destructive/decline actions remain visually available without appearing punitive.

## 7. Financial components

### Financial snapshot

A 2×2 responsive data grid:

- Savings: €20,000.
- Monthly income: €3,450.
- Essential spending: €2,050/month.
- Profile: Medium risk · 10+ years.

Always label records “Fictional customer data.” Include freshness metadata.

### Emergency-fund visualization

- Show one horizontal segmented allocation bar, never a gauge.
- Protected buffer: €12,300, derived as €2,050 × 6 months.
- Potentially investable: up to €7,700.
- Pair the bar with exact values, formula, assumption, and explanatory sentence.
- Segments use text labels and a pattern/marker so they remain interpretable without color.

### Portfolio/product cards

The recommendation is illustrative and may compare three fictional, bank-approved building blocks:

1. Asterra Global Index Portfolio — diversified equity-focused fund, medium-high volatility, illustrative ongoing fee 0.38%/year.
2. Asterra Balanced Horizon Fund — multi-asset fund, medium volatility, illustrative ongoing fee 0.62%/year.
3. Asterra Euro Liquidity Fund — short-duration cash-management fund, low volatility, illustrative ongoing fee 0.25%/year.

All names, risk levels, and fees must be marked fictional and illustrative. One recommended mix may show 70% Global Index Portfolio and 30% Balanced Horizon Fund for a medium-risk, 10+ year example; it is guidance for review, not an order.

Product cards contain: allocation, role in portfolio, risk label and 1–7 indicator, fee, liquidity, minimum horizon, and a “Why this fits” explanation.

### Projected outcomes

- Show low/base/high illustrative ranges, not a single deterministic line.
- Use a band chart or three clearly labeled vertical outcomes at 10 years.
- Example assumptions may use annual net return scenarios of 1.5%, 4.0%, and 6.0% solely for illustration.
- State that projections are estimates, not guaranteed outcomes, and may result in loss.
- Attach the assumptions disclosure directly below the visual.

### Fee and risk comparison

- Mobile uses stacked comparison rows/cards, never a clipped table.
- Desktop may use a 3-column comparison table.
- Include ongoing fee, risk level, horizon, liquidity, and what could go wrong.
- Provide non-color risk indicators and short language such as Low / Medium / Medium-high.

### Citations

- Use numbered source chips attached to the exact statement or calculation they support.
- Source chips are buttons with title, source type, and freshness when expanded.
- Example fictional sources: “Asterra Emergency Savings Policy,” “EU Retail Investment Risk Guide,” and each product’s “Illustrative Key Information Sheet.”

## 8. Prepared plan and handoff

- Summarize the protected €12,300 buffer and the reviewable €7,700 illustrative allocation.
- Include goals, horizon, risk, liquidity needs, fees, key risks, sources, and assumptions.
- Primary CTA: “Review with an adviser.”
- Secondary CTA: “Download illustrative plan.”
- Include a prominent stop condition: “No investment has been placed.”
- Do not include Buy, Invest now, Confirm trade, or payment controls.

## 9. Landing-page content system

### Hero

- Eyebrow: “AI banking experience · Customer guidance.”
- Outcome-led title: “A banking assistant that starts with what the customer needs.”
- Supporting copy explains natural-language banking, permissioned customer context, approved knowledge, safeguards, and clear next steps across everyday and considered financial tasks.
- The embedded assistant opens on the quiet starter-prompt state so the experience feels available for many banking needs, not pre-scripted around one investment outcome.

### Conventional FAQ comparison

Use a two-column “Typical FAQ bot / Asterra assistant” comparison with exact capability differences:

- generic article retrieval vs permissioned customer context;
- static text vs generated financial components;
- unsupported answer vs attached sources/assumptions;
- dead end vs prepared adviser handoff.

### Measurement areas

Do not invent performance claims. Label target measurement areas only:

- permission comprehension and consent/decline completion;
- task completion and abandonment by customer intent;
- suitability-question clarity;
- source and assumption comprehension;
- product-comparison, subscription, and adviser-handoff completion;
- customer confidence and explanation comprehension.

### Future journey teasers

Mortgage affordability and insurance coverage are shown as quiet next-journey cards using the same permission, evidence, and handoff shell. They are teasers, not complete demos.

## 10. Accessibility and responsive requirements

- WCAG AA contrast for text and interactive controls.
- Visible keyboard focus on every control.
- 44px minimum touch targets.
- Status never relies on color alone.
- Charts have adjacent text summaries and exact data labels.
- Tables convert to labeled stacked rows on mobile.
- No horizontal overflow at 320px viewport width.
- All loading states expose text status through a polite live region.
- Interactive mockups use real-looking controls, while the left case-study explanation makes the fictional and illustrative nature of the experience clear.

## 11. Content rules and disclaimers

Use concise, reassuring language. Avoid hype words such as revolutionary, magical, autonomous, effortless, or guaranteed.

Required recurring labels:

- “Fictional customer data.”
- “Illustrative product.”
- “Estimates, not guaranteed outcomes.”
- “Capital is at risk.”
- “No investment has been placed.”

All calculations must show their formula or assumption. Sources and assumptions remain attached to the content they support. Do not expose chain-of-thought, hidden reasoning, internal prompts, or technical logs.

## 12. Generation fidelity constraint

Use only the fonts, colors, spacing, shapes, and component styles defined in this design system. Keep Space Grotesk for headings, Inter for body and financial data, and JetBrains Mono for evidence metadata. Use `canvas`, `surface`, and `ink` as the foundation; `cobalt-700` is the dominant Asterra action and brand color. Apply violet and aqua sparingly to charts, allocations, and secondary data states, with restrained amber and red reserved for semantics. Do not introduce gradients, serif fonts, glass effects, neon colors, oversized decorative graphics, or visual styles outside this system. Do not reproduce Revolut branding, imagery, layouts, or exact color values.
