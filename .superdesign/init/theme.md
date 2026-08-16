# Theme

## Compact token summary

- Paper/background: `#f6f0df`
- Fresh/card: `#fffdf7`
- Ink: `#1e241f`
- Faded text: `#545b53`
- Accent yellow: `#f0d34a`
- Clay: `#b6533d`
- Sage/borders: `#8a8f84`
- Blue: `#246b85`; blue soft: `#e5f0f4`
- Green: `#356f58`; green soft: `#e5f1e9`
- Gold: `#b08a00`; yellow soft: `#fff4b8`; clay soft: `#f6e3dc`
- Fonts: Inter for body/UI, IBM Plex Mono for metadata, DM Serif Display for identity and editorial headings
- Header: `72px` desktop, `64px` mobile
- Context rail: `340px`, `312px` below 1180px, overlay below 900px
- Main transcript/composer width: `820px` desktop, `760px` below 1180px
- Breakpoints: 1180px, 900px, 640px
- Radius: 24px composer; 14–18px sheets/clouds; status/artifact surfaces mostly square
- Shadows are restrained and editorial: composer `0 10px 40px -10px rgba(23,26,23,.12)`
- Motion: 160–340ms ease/cubic-bezier; animations disabled for reduced motion

## Raw source excerpts

Path: `frontend/app/assets/css/main.css`. This is the complete token definition and the complete current turn layout styling used by the target.

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;700&display=swap');
:root{--paper:#f6f0df;--fresh:#fffdf7;--ink:#1e241f;--faded:#545b53;--acid:#f0d34a;--clay:#b6533d;--sage:#8a8f84;--blue:#246b85;--blue-soft:#e5f0f4;--green:#356f58;--green-soft:#e5f1e9;--gold:#b08a00;--yellow-soft:#fff4b8;--clay-soft:#f6e3dc;--header:72px;--rail:340px;--content:820px;font-synthesis:none}
.transcript{width:min(var(--content),calc(100% - 48px));margin:auto;padding:48px 0 96px;display:flex;flex-direction:column;gap:96px}
.turn{display:flex;flex-direction:column;gap:32px}
.question,.answer,.answer-body{display:flex;flex-direction:column}.question{gap:8px}
.question small,.answer-label{color:var(--faded);font-size:10px;letter-spacing:.13em;text-transform:uppercase}
.question p,.answer-copy{max-width:64ch;margin:0;font-size:18px;line-height:1.55}
.answer{gap:24px}.answer-label{gap:8px}.rule{width:24px;height:1px;background:var(--sage)}
.answer-body{gap:24px}
.guest-messages{display:flex;flex-direction:column;gap:96px}.guest-turn{scroll-margin-bottom:250px}
.guest-answer{max-width:64ch;margin:0;color:var(--faded);font-size:18px;line-height:1.6;overflow-wrap:anywhere;word-break:break-word;white-space:normal}
.turn,.question{min-width:0;max-width:100%}.question p{width:100%;max-width:100%;overflow-wrap:anywhere;word-break:break-word;white-space:normal}
@media(max-width:640px){:root{--header:64px}.transcript{width:calc(100% - 32px);padding-top:32px;gap:72px}.question p,.answer-copy{font-size:16px}.guest-messages{gap:72px}.guest-answer{font-size:16px}}
```

There is no Tailwind configuration or theme provider; the complete stylesheet remains the runtime source of truth.

