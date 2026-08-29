---
version: "superdesign-alpha"
name: "Monochrome Peak Orchid"
description: "A black-and-white photographic hero desaturated to grayscale, giving way to a near-black editorial body with a single rationed orchid-pink accent carrying every link, rule, and CTA."
colors:
  background: "#161616"
  surface: "#F8F9FA"
  surface-inverse: "#000000"
  text-primary: "#FFFFFF"
  text-on-light: "#212529"
  accent: "#D371C0"
  accent-hover: "#B975AC"
typography:
  display-lg:
    fontFamily: "Varela Round"
    fontSize: "104px"
    fontWeight: 500
    lineHeight: "1"
    letterSpacing: "12.8px"
  headline-md:
    fontFamily: "Nunito"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: "1.2"
    letterSpacing: "1px"
  body-md:
    fontFamily: "Nunito"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.5"
  label-md:
    fontFamily: "Nunito"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: "1.2"
    letterSpacing: "1px"
  icon-accent:
    fontFamily: "Font Awesome 5 Free"
    fontWeight: 400
    lineHeight: "1"
spacing:
  base: "8px"
  small: "3px"
  gap: "16px"
  gap-lg: "24px"
  block: "20px"
  section-padding: "80px"
rounded:
  control: "4px"
  card: "4px"
  circle: "100px"
  soft: "10px"
components:
  button-primary:
    background: "#D371C0"
    text-color: "#FFFFFF"
    radius: "4px"
    height: "59px"
    padding: "20px 32px"
    shadow: "rgba(0, 0, 0, 0.1) 0px 3px 3px 0px"
    hover-background: "#B875AB"
  button-ghost:
    background: "transparent"
    text-color: "#D371C0"
    radius: "4px"
    height: "57px"
    padding: "20px 32px"
    shadow: "rgba(0, 0, 0, 0.1) 0px 3px 3px 0px"
    hover-text-color: "#B875AB"
  button-outline-nav:
    background: "transparent"
    text-color: "#D371C0"
    border: "1px solid #D371C0"
    radius: "4px"
    height: "38px"
  card-project-media:
    background: "transparent"
    radius: "0px"
    padding: "0px"
  card-experience:
    background: "#161616"
    radius: "0px"
    padding: "0px"
  card-contact:
    background: "#FFFFFF"
    radius: "0px"
    padding: "0px 15px"
    border-bottom: "3px solid #D371C0"
    text-color: "#212529"
---
# Monochrome Peak Orchid
Source: https://madelinez820.github.io/

## Overview
This is a minimalist personal-portfolio system built on a single stark contrast: a full-bleed black-and-white photographic hero versus a near-black (#161616) editorial body below it. The aesthetic borrows from Swiss/International poster logic — desaturated photography, wide-tracked all-caps display type, a single rule-thin accent color — but softens it with rounded control corners (4px), a circular avatar frame, and a rounded-pill "chip" underline motif. The identity is carried by exactly one hue, an orchid-pink (#D371C0), rationed to links, button fills/outlines, thin decorative underline rules, and icon glyphs — never used as a background fill of any size.

## Composition
The first screen is a dead-centered hero: a circular portrait medallion (holographic-gradient ringed) sits above two stacked oversized display words in wide-spaced uppercase, a smaller subdued subtitle line beneath, then one solid pill-cornered button. A transparent 88px navbar floats over the photograph with a single outlined utility button at the far right. Below the fold, the palette inverts to near-black for a centered narrative paragraph block (headline with two inline accent-colored terms), then a left-aligned "Selected Work Experience" list of logo-plus-text rows, then a "Projects" section built from alternating full-bleed-media/text halves, and finally a light-surface three-card contact grid before a black footer. Density is high in the projects zone (media occupies roughly half of each row) and airy elsewhere — deliberately trading a marketing "features grid" for a chronological, editorial scroll: the alternative rejected is a dense card-grid dashboard layout in favor of narrative pacing.

## Colors
Background reads overwhelmingly dark: the pixel field is ~40% near-black (#181818-family, matching the declared #161616 surface) plus ~10-13% deeper blacks and grays, confirming the body is dark-mode-default. The light surfaces (#F0F0F0/#FFFFFF-family, ~35-41%) are the hero's photographic top strip and the contact-card band — genuine light insets, not the dominant field. #FFFFFF is primary text-on-dark ink; #212529 is the ink used on the light contact cards and as secondary/muted tone. #D371C0 is the sole accent, rationed to: the primary hero CTA fill, all ghost-button and link text, thin 3-4px underline rules beneath project headings, social icons, and a bottom accent border on the contact cards. Nothing else in the system carries color — no secondary hue is used, keeping the author-token palette (blue/indigo/purple/pink/red/orange/yellow/green swatches) present only as unused raw primitives, never surfaced.

## Typography
Display type is Varela Round at 104px/500, line-height 1, with extreme +12.8px letter-spacing — an all-caps geometric-rounded display used only for the hero name, stacked two words tall. Headline-md (Nunito 20px/500, +1px tracking) governs section intros and narrative headline lines; label-md (Nunito 24px/500, +1px tracking) sizes project and card titles. Body copy is Nunito 16px/400 at 1.5 line-height for paragraphs, dropping to a tighter ~14.4px weighted average in dense narrative blocks. Two inline words within the narrative paragraph are styled in the accent pink as a signature clause — an emphasis device parallel to an italic accent, covering just those two short terms against an otherwise white sentence. Font Awesome (Free + Brands) supplies all glyph icons at body-adjacent sizing.

## Layout
Content is constrained to a 1140px max-width, centered, with 80px section padding and an 8px-rooted spacing scale (8/16/20/24px) governing internal gaps. The project showcase is a strict two-column (roughly 50/50) alternating grid: each row pairs one text/CTA half with one image-bleed half, alternating which side carries the media — reconciling to a "6 rows of [1 text | 1 media]" composition rather than a multi-column card grid; this reads as an alternating layout, not bento or masonry. The experience list is single-column, logo-left/text-right rows stacked vertically (measured row heights of 86% container width repeating six times for its icon rows). The closing contact band is a uniform 3-up card grid, equal width, no span variation. The corner radius across nearly all containers is 0px — square, unbeveled blocks — with roundness reserved for controls (4px), the avatar circle, and pill-shaped decorative rules (100px/9999px).

## Components
- **Navbar**: edge-to-edge, transparent, square-cornered bar (0px radius all corners), 88px tall, full 1920px viewport width, sticky, holding one visible item — an outlined utility button ("Resume"-type CTA), transparent fill, #D371C0 text and border, ~4px radius.
- **Button — hero primary**: the solid pill beneath the hero headline is the true primary CTA — observed as a filled orchid block, off-white/uppercase label, corners ~4-8px (slightly-rounded), sitting centered under the subtitle; this is distinct from the measured ghost/outline variants below it.
- **Button — solid measured** (#D371C0 fill, white text, 4px radius, 59px height, 20px/32px padding, shadow `rgba(0,0,0,0.1) 0px 3px 3px 0px`, hover fill #B875AB): used for in-body action CTAs (e.g., a "get started" style control), slightly-rounded corners.
- **Button — ghost/link** (transparent fill, #D371C0 text, 4px radius, 57px height, same padding/shadow, hover text #B875AB): the repeated project-CTA pairs ("play/source"-style link buttons), ×12 across the projects section, slightly-rounded.
- **Button — outline nav utility**: transparent fill, #D371C0 border and text, compact height, sits alone top-right of the navbar only.
- **Card family — project media/text split** (transparent, 0px radius, no padding): alternating rows, each with a heading, one to two lines of body text, one or two ghost-button links, and a thin accent underline rule beneath the heading; media half carries a full-bleed screenshot or illustration covering its entire half.
- **Card family — experience row** (#161616 fill, 0px radius, inverted white-on-dark text): a leading circular company-logo mark, a two-line title/role stack, a small date label, and a bulleted checklist of 1-2 responsibility lines; six rows stacked, each spanning ~86% of the container width.
- **Card family — contact** (#FFFFFF fill, 0px radius, 0px/15px padding, bottom border in accent pink): icon glyph, short label heading, thin accent rule, and one line of contact detail text; three equal-width cards in a single row.
- **Footer**: solid #161616 band, centered small copyright line, no link list.

## Graphics & Effects
The hero photograph is desaturated to full grayscale — mountains and river — with no color cast, establishing the monochrome frame before any pink appears. Layered atop section transitions are dark linear scrims: `linear-gradient(rgba(22,22,22,0.1) 0px, rgba(22,22,22,0.5) 75%, rgb(22,22,22) 100%)` covering roughly 12.6% of total page height at the hero-to-body seam, and a near-inverse `linear-gradient(rgb(22,22,22) 0px, rgba(22,22,22,0.9) 75%, rgba(22,22,22,0.8) 100%)` (11.2% of page) plus its upward variant (5.6%) bracketing the narrative block — these are seam-blending scrims, not full-frame gradient backgrounds. A small light gradient `-webkit-linear-gradient(top, rgba(255,255,255,0.9), rgba(255,255,255,0.733))` (1.4% of page) washes a compact light element, likely the contact-card band's top edge. The avatar medallion carries a holographic/rainbow-refraction ring texture as its sole ornamental flourish. Shadows are restrained: a soft ambient card/button shadow `rgba(0,0,0,0.1) 0px 3px 3px 0px`, and an isolated bright glow `rgba(255,255,255,0.2) 0px 0px 10px 5px` for a highlighted focal element.

## Motion
Interactive color/background/border/shadow properties transition on a uniform `0.15s ease-in-out`, giving hover and focus state changes on buttons and links a quick, crisp snap rather than a lingering fade. Background-only shifts (larger surface fills) ease over `0.3s ease-in-out`, slightly slower to avoid flashing across bigger areas. Utility keyframe animations (progress-bar-stripes, fa-spin) exist for loader/progress iconography but are not part of the primary page rhythm — motion here is functional and restrained, never decorative or scroll-linked.

## Guardrails
- Never saturate the hero photograph — it must stay full grayscale; pink is introduced only after the scroll into the dark body.
- Never give #D371C0 a large fill area — it is a line/text/small-button accent only, never a section background.
- Keep all card and section corners at 0px; reserve rounding for controls (4px), the pill rule (9999px), and the circular avatar.
- Do not merge the alternating project rows into a uniform multi-column grid — preserve the 50/50 alternating media/text rhythm row by row.
- Preserve the two-tier button system: solid #D371C0/white for primary actions, transparent/#D371C0-text for secondary link-style actions — do not collapse them into one variant.