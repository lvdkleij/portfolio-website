# Lucas — quiet desk scene
## Scope and truth
Design-only exploration for the existing Nuxt portfolio at /. The approved baseline is exactly one upscaled 3344x1882 desk photograph in a near-viewport frame. The banking product and older visual identities are excluded. Use image unchanged: never redraw, replace portrait, mirror, add props, overlay tint, zoom or parallax it.

## Fixed canvas
Outer matte #e8e6e1. Studio fallback #c5b09a. Frame fills 100dvh (100vh fallback) minus safe-area-aware gap clamp(8px,.65vw,14px), radius clamp(20px,1.8vw,32px). Image cover; object-position 68% 100%. Mobile also viewport-height; NEVER cap panel height to width. Desktop subject stays right, empty space stays left. No scrolling on resting scene, no added sections.

## Restrained left-side UI — exploration only
Keep the photo dominant. One quiet stack in its open left area: Lucas van der Kleij, Software engineer, About / Approach / Contact, then a distinct AI Chat entry. No large headline, slogan, résumé filler, badges, stats, coming-soon projects, floating objects, sparkle icons, neon, colored gradients or recreated LOLO logo.
Type: Inter only, normal sentence case. Name 32–40px regular with slightly tight tracking; nav 16–18px; body 14–16px; labels 12–13px. Weight 400/500/600 only. Palette: text #292722, muted #62584c, paper #e8e6e1, panel #f1eade, borders #b9aa98, focus #6b482f. All colors may use opacity. Do not inherit old banking cobalt/violet/blue.
Spacing steps: 4,8,12,16,24,32,48,64; left gutter clamp(24px,6vw,96px). Stack about 300–360px wide. Minimal hairlines; rounded composer/panel at 16–24px. No chunky pill menu, oversized card or opaque sidebar. Keep most left space empty.
Chat is clearly AI, not Lucas live. Default a restrained composer/entry, not a transcript wall. Opening it uses the same left-hand space: calm readable transcript and persistent composer, back/close affordance, brief thinking state. Must support normal text conversation, with an optional compact capability component only when relevant; not generated UI only. Short welcome, typing, multi-turn and fallback states; mock local interactions, zero backend/model/network calls.
About / Approach / Contact reveal compact in-place panels, not new routes or unrelated pages. Contact has real LinkedIn/GitHub links. Essential identity/contact must remain available without asking chat.

## Mobile
Keep viewport-height photograph. Position minimal identity/menu/chat entry in upper empty backdrop; do not cover face/hands/desk with resting controls. Open chat as an intentional dismissible inset sheet with fixed header/footer and internally scrolling transcript, not document overflow. Safe areas and keyboard considered; comfortable 44px interaction targets. Escape closes, focus returns to trigger, all inputs labelled. Visible focus. Reduced-motion: disable transition/animation. Resting screen remains exceptionally spare.

## Brussels local-time badge — user-requested exception
Small black (#000) rounded rectangle centred at the top of the frame, off-white (#f5f5f5) uppercase monospace text and a static green (#30d68b) decorative dot, following the supplied clock screenshot only. Text is BRUSSELS plus current abbreviated weekday and HH:mm in Europe/Brussels, 24-hour, daylight-saving aware; no hardcoded UTC offset. System monospace is permitted ONLY in this badge; all other UI stays Inter. Desktop: 11px/16px text, 8px 11px padding, radius8, 24px inset top (32px badge height). Phones: 10px/16px text, 4px 8px padding, radius6, 12px inset top (24px badge height), centred. Both use a 5px dot and 7px gaps. This is a location clock, not an online/availability claim. Static dot, no pulse. Reserve space below it on phones and collapse the resting composer to AI Chat on short screens so controls stay off the face. Keep the exact image and all other styling unchanged.

## Permitted personal facts
Lucas van der Kleij is a software engineer: mainly backend and architecture, some frontend experience, now exploring AI. No employers, years, experience metrics, qualifications or projects to invent.
LinkedIn: https://www.linkedin.com/in/lucas-van-der-kleij
GitHub: https://github.com/lvdkleij
No supplied email or résumé link: do not invent either.
