# Regal Group International — Website

A new, elegant/premium, credibility-first marketing site for **Regal Group International**, the Coral Gables real estate lending consultancy led by Juan Ayala.

Static, dependency-free (HTML/CSS/vanilla JS) — fast, easy to host anywhere, easy to hand to any developer later.

## Run locally

```bash
cd ~/CODE
python3 -m http.server 8080
# open http://localhost:8080
```

Or just double-click `index.html`.

## Structure

```
index.html              # single-page site (Firm · Capital Solutions · Process · Clients · Contact)
assets/css/styles.css   # navy + champagne-gold premium theme, fully responsive (Fraunces + Manrope)
assets/css/graphics.css # refined graphics layer: crest, grain, duotone photo plates, art-deco, asset line-art
assets/js/main.js       # sticky nav, mobile menu, scroll reveal, count-up, form handler
assets/img/             # drop real photography here (see "Adding photos" below)
```

## Adding photos (the elegant-luxury way)

The design uses a **duotone photo-plate** system so any photo you add is auto-toned to the
navy + gold palette and never looks "loud." To place a real photo, drop the file in
`assets/img/` and point a plate at it with one inline style. **Use a root-absolute path**
(leading slash) — a relative path inside the CSS variable resolves against the stylesheet
folder, not the page:

```html
<div class="about__portrait plate framed" style="--img:url('/assets/img/juan-ayala.jpg')" ...>
```

The grayscale + navy/gold wash, grain, and gold corner-brackets are applied automatically.
(Juan's portrait, `juan-ayala.jpg`, uses a deliberately *lighter* treatment via
`.about__portrait--photo` so his face stays natural and warm rather than navy-washed.)

**Images already in place** (`assets/img/`):
- `regal-logo.png` / `regal-mark.png` — the **real Regal Group International logo + monogram**
  (white, for dark backgrounds), pulled from regalgroupintl.com. Logo shows prominently in the
  nav (monogram), hero (full lockup) and footer (full lockup).
- `miami.jpg` — Brickell/Miami night skyline → full-width duotone band before the Contact
  section ("Rooted in Miami. Active across borders.").
- `realestate.jpg` — modern luxury home → wide banner in the **Real Estate Capital** group
- `aircraft.jpg` — private jet → photo header on the **Aircraft Financing** card
- `maritime.jpg` — luxury yacht → photo header on the **Maritime Financing** card

- `hero-bg.jpg` / `stats-bg.jpg` / `process-bg.jpg` / `clients-bg.jpg` — toned section
  backgrounds (glass tower, glass grid, blueprint desk, handshake). Applied via the reusable
  `.secbg` system in `graphics.css` (`secbg--dark` for navy sections, `secbg--light` for paper
  sections; hero uses `.hero__photo`). All heavily toned so they read as quiet texture.

Photos (skyline + asset classes + section backgrounds) sourced from Pexels — free for
commercial use, no attribution required. Logo is Regal's own asset.

## Financing checklist PDFs (one per program)

`assets/docs/*-checklist.pdf` — a separate branded (logo + navy/gold) single-page document
of document requirements for each financing program. Each is linked individually from its
card in the Capital Solutions section (the gold "Document checklist" link):
- `commercial-lending-checklist.pdf`
- `residential-lending-checklist.pdf`
- `construction-financing-checklist.pdf`
- `private-equity-bridge-checklist.pdf`
- `cre-lines-of-credit-checklist.pdf`
- `aircraft-financing-checklist.pdf`
- `maritime-financing-checklist.pdf`

Regenerate all of them after editing content/branding:
```
cd ~/CODE && python3 build_checklists.py
```
Requires `reportlab` + `Pillow`. Content lives in the `CHECKLISTS` list in `build_checklists.py`;
filenames are auto-slugged from the program title (edit a title → the filename changes, so
update the matching `href` in `index.html`). `build_combined()` still exists in the script if a
single bundled PDF is ever wanted. The checklist items are general templates — **Juan should
review/adjust** them per program; each footer carries a "general guidance / not a commitment to
lend / Equal Opportunity Lender" disclaimer.

Swap any of these by replacing the file (keep the name) or pointing the inline `--img` at a new
one. Still open for real photography: **Juan's headshot** (the Firm plate currently shows a gold
skyline motif as its default).

**Why graphics-first, not stock photos:** quiet-luxury brands (private banks, top law firms)
lean on restraint — fine linework, a crest, a couple of *authentic* photos — rather than
generic stock. Your own photography of real deals/assets will always outperform stock here.

## What's grounded vs. what to replace

Content is built from the verified facts on the current regalgroupintl.com:
commercial / residential / construction / private-equity-bridge / CRE lines of credit, plus
**aircraft financing** and **maritime financing** (added per Juan); almost three decades in
business; principal **Juan Ayala**; Coral Gables office; (786) 248-1173;
info@regalgroupintl.com; long-term (8–15 yr) client relationships.

**Before going live, replace these placeholders:**

1. **Testimonials** (`index.html`, `#clients`) — currently representative quotes tagged
   "Replace with attributed quote." Swap in real, attributable client quotes.
2. **Founder photo** (`.about__portrait`) — currently a gold "JA" monogram tile. Drop a
   real headshot of Juan into `assets/img/` and set it as the `background-image`.
3. **Contact form endpoint** (`assets/js/main.js`, marked `TODO`) — wire the form to a real
   handler (Formspree, Netlify Forms, or a mailto/CRM endpoint). Right now it only shows a
   success message client-side; submissions are **not** sent anywhere yet.
4. **Stats** — "almost 3 decades", "8–15 yr relationships", "7 verticals" are accurate. If you
   want a dollar-volume or deals-closed figure, add it as another `.stat` once you have a number
   you're comfortable publishing.

## Positioning note ("where the business is headed")

The copy leans the brand from "mortgage broker" toward **private real estate capital** —
emphasizing structuring, private-equity/bridge capital, and **cross-border / international
investors** (consistent with the "International" name and the private-equity lending you
already do). Dial that up or down to taste in the Hero, Firm, and Capital Solutions sections.

## Deploy

Any static host works: Netlify, Vercel, Cloudflare Pages, GitHub Pages, or your current host.
Drag-and-drop the folder, or connect a git repo.
