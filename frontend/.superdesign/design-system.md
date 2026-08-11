# Lucas Studio Design System

Lucas Studio is an AI-engineering portfolio presented as a transparent conversation workspace. It combines editorial warmth with technical precision and exposes grounded sources and tool state without becoming an observability dashboard.

## Palette

- Newsprint `#F6F0DF`: primary canvas.
- Fresh paper `#FFFDF7`: cards, composer, context rail.
- Ink `#1E241F`: primary text and strong controls.
- Faded ink `#545B53`: readable secondary text; 6.15:1 against newsprint.
- Editorial blue `#246B85`: links, section identity, active technical detail; 5.25:1 against newsprint.
- Press green `#356F58`: grounded and passed states; 5.22:1 against fresh paper.
- Clay red `#B6533D`: warnings, focus, and a warm editorial counterpoint; 4.81:1 against fresh paper.
- Golden yellow `#F0D34A`: cheerful highlight surfaces paired with ink text.
- Ochre `#B08A00`: yellow-family structural marks where 3:1 boundary contrast is needed.
- Rule grey `#8A8F84`: newspaper rules, dividers, and inactive boundaries; 3.25:1 against fresh paper.

Use color like a newspaper uses section inks: sparingly but visibly. Blue identifies knowledge and technical context, green communicates grounded/passed states, clay communicates caution or voice, and yellow highlights active steps and calls to action. Never use bright yellow as text or an unoutlined essential indicator.

## Typography and layout

DM Serif Display is reserved for identity and assistant leads. Inter is body copy. IBM Plex Mono is used for metadata, controls, receipts, and system state. Preserve the 72px header, centered 820px conversation column, persistent 24px-radius composer, and 340px context rail. A compact full-width newsprint veil sits behind the docked composer: 220px on desktop and 200px on mobile, reaching solid paper within the first 28%, so transcript content fades briefly before the input and is fully hidden behind and below it. Transcript bottom padding remains larger than the veil so the newest response stays visible above that boundary. Mobile turns the rail into a drawer and keeps the composer docked.

## Interaction

Use golden yellow surfaces with ink text; use ochre for thin yellow-family rules. Focus uses a 2px clay outline. Motion is restrained and reduced-motion safe. The desktop context rail reflows the conversation with a 340ms width-and-slide transition; its reopening tab glides in separately. On mobile, the rail becomes a 280ms overlay drawer with a fading backdrop. Reduced-motion preferences collapse these transitions to near-instant state changes. Maintain the current component geometry, spacing, typography, and content hierarchy when applying the newspaper color system.

Assistant responses use a compact, expandable processing trace instead of separate Sources, Run, or Safety buttons. The trace follows six observable stages: tokenization, prompt security, context assembly, knowledge retrieval, tool use, and response synthesis. Completed stages use their editorial section ink, the active stage uses golden yellow with an ochre boundary, and future stages use rule grey. Show counts, decisions, named resources, permissions, and timings, but never expose chain-of-thought, hidden prompts, secrets, raw embeddings, or private paths. Newly submitted prompts keep the trace expanded while stages advance; completed historical turns may remain collapsed.
