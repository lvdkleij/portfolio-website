# Quiet desk — design review

Canvas: https://superdesign.dev/teams/102da295-6915-4104-b18b-bd583bdafa0f/projects/b9b9538d-b4a6-4d1e-847a-e5ad5461b56f
Preview: https://p.superdesign.dev/draft/8ffe89d2-c521-4b3b-b6a6-bc42944c4e9f

## Version history
- v1: exact approved image-only landing page imported from the current Nuxt route.
- v2: one GPT-5.6 Sol refinement, 64.5 credits, left-side identity/menu/AI composer.
- v3: direct corrections, no generation: short-phone composer overlap, visible composer focus, modal Tab containment, replies finish when closed without stealing focus, short-landscape panel height.

## Review
- Desktop 1440x900: unchanged photo URL, 3344x1882 loaded pixels, original frame dimensions, image cover at 68% 100%; no page overflow. Quiet left stack does not cover the subject.
- Mobile 390x844: viewport-height frame with 8px margin. Menu and composer in empty upper backdrop. Open chat is a dismissible inset sheet.
- Short mobile 320x568: hide resting input, retain AI Chat entry. Resting UI bottom 190px stays above cap; full image panel remains viewport-height. Open chat input visible, internal transcript scrolling.
- Welcome, thinking, ordinary text response, multi-turn capability overview and unsupported-question fallback tested in preview.
- Closing while thinking completes the answer in background; reopening reveals answer, no stuck indicator or focus theft.
- Escape closes the panel and restores AI Chat focus. Contact links checked against the supplied LinkedIn/GitHub destinations, without navigating externally.
- Focus styles and reduced-motion rules inspected. Modal Tab loop included. Mobile virtual keyboard and actual reduced-motion OS setting not simulated.
- Source contains no chat fetch/XHR/WebSocket/model calls; only mocked local responses. External font/icon/image resources are still loaded by the design.
- Refetched v3 HTML matches the direct-edited document. No import warnings returned.

## Scope
No application, backend, image, deployment or Asterra changes. Only Superdesign project content, local design context/resume metadata and temporary-export ignore rule changed.

## v4 — Brussels clock
- Added the requested black, rounded, top-centred badge with a static green decorative dot and system-monospaced BRUSSELS / weekday / 24-hour time. This is local time, not availability.
- Live Intl formatting uses Europe/Brussels with no hardcoded offset; updates on minute changes and tab visibility return. Seven checks cover winter/summer, both DST transitions and midnight weekday rollover.
- Desktop 1440x900: badge centre x720, y33, height40. Photograph, menu and chat styling unchanged.
- Phone 390x844: badge y20–50, menu starts y60; no collision, no overflow, photo remains viewport height minus 8px margin. Mobile menu spacing tightened to keep controls above face.
- Short phone 320x568: smaller identity and AI Chat trigger instead of resting composer, retaining full chat on open. Badge centred. No document overflow.
- Saved and refetched v4 HTML match; no import warnings. Direct edit, no generation credits. Website remains unchanged.
