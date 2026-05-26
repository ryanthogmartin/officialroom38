# Room 38 — The Table · Landing Site

Static, single-page landing site for [officialroom38.com](https://officialroom38.com).

Stack: plain HTML + CSS + a tiny JS file. No build step. No framework. Ready to drag into Netlify, Cloudflare Pages, S3, or any static host.

## Files

```
room38/
├── index.html        ← Homepage copy + structure
├── worship.html      ← Worship songs & lyrics index (data-driven cards)
├── styles.css        ← All design tokens & layout (shared by both pages)
├── script.js         ← Year stamp + sticky-header polish (tiny)
├── netlify.toml      ← Netlify config (caching headers, security)
├── robots.txt        ← SEO
├── sitemap.xml       ← SEO
├── README.md         ← This file
└── assets/
    └── images/
        ├── lockup-black.jpg         ← Master door + ROOM 38 lockup (light bg)
        ├── lockup-black-trans.png   ← Same, white made transparent
        ├── lockup-white.jpg         ← Faint cream wordmark (mostly empty)
        ├── lockup-white-trans.png   ← Inverted door + ROOM 38, transparent (dark bg)
        ├── specimen-display.jpg     ← Bold "ROOM 38" specimen
        ├── specimen-medium.jpg
        ├── specimen-smallcaps.jpg
        ├── tagline.jpg              ← "THE OIL CAME FROM THE CRUSHING…" lockup
        ├── tagline-trans.png        ← Same, white made transparent
        └── tagline-white-trans.png  ← Inverted (white on transparent) for dark bg
```

The hero uses `lockup-black-trans.png` (the door) and `tagline-trans.png` (the bold uppercase tagline). All other display copy is set in HTML/CSS so it can be edited without graphics software.

## How to update copy

All copy lives in `index.html`. The most-likely-to-change fields are tagged with `data-edit="…"` attributes — search the file for `data-edit` to find them:

```html
<p data-edit="when">Mondays at 7:00 PM</p>
<p data-edit="where">Address shared with confirmed guests after RSVP.</p>
<p data-edit="format">Worship, teaching from the Word, and time around the table together.</p>
<p data-edit="bring">A Bible (any translation) and the season you're in. That's enough.</p>
```

To update any of these, just edit the text inside the `<p>` tag. No build or restart needed.

Section anchors (also used by the nav):

- `#top` — hero
- `#vision` — §01 The Vision (welcome note from Kihryn)
- `#for` — §02 Who it's for
- `#table` — §03 Psalm 23:5 + why a table
- `#values` — §04 Table Values
- `#worship` — §05 Worship sessions (Spotify embed + link to /worship.html)
- `#details` — §06 When / Where / Format / Bring
- `#join` — §07 Typeform RSVP
- `#instagram` — §08 Follow on Instagram

## How to update the worship section / page

The Room 38 worship sessions Spotify playlist is embedded in two places:

1. **`index.html`** — the homepage `#worship` section (compact embed + CTA buttons).
2. **`worship.html`** — the dedicated songs & lyrics page (larger embed at the top).

### Swap the playlist

If the playlist ID changes, replace it in **three** places:

1. In `index.html`, inside the `<section class="section-worship">` block — both the
   iframe `src` AND the "Open in Spotify" link's `href`.
2. In `worship.html`, inside the top `<section class="worship-page-hero">` block —
   the iframe `src`.
3. In `worship.html` footer's "Spotify playlist" link (under "Elsewhere").

The current playlist ID is **`01vM88ofRGwsxR3VKUVhxp`**. Spotify's share URL is
`https://open.spotify.com/playlist/<ID>?si=…` — the ID is the long string between
`/playlist/` and `?`. The embed URL pattern is
`https://open.spotify.com/embed/playlist/<ID>?utm_source=generator&theme=0`.

### Add a song to the index on `/worship.html`

Inside `worship.html`, find the `<ol class="songs-grid">` block. Each song is one
`<li class="song-card">` — copy any existing card and fill in:

```html
<li class="song-card">
  <span class="song-num">06</span>
  <h3 class="song-title">Song Title Here</h3>
  <p class="song-artist">Artist Name</p>
  <p class="song-theme">Optional one-line note about the theme or moment.</p>
  <div class="song-links">
    <a href="https://open.spotify.com/track/<TRACK_ID>" target="_blank" rel="noopener">Listen ↗</a>
    <a href="https://genius.com/<artist-song-lyrics-slug>" target="_blank" rel="noopener">Lyrics ↗</a>
  </div>
</li>
```

**Fields:**

- `song-num` — visual only, renumber if you reorder.
- `song-title` — the track title (rendered uppercase).
- `song-artist` — the primary artist(s).
- `song-theme` — optional one-liner about why this song matters or what moment it
  carries. Omit the `<p class="song-theme">` line entirely if you don't want one.
- `Listen ↗` link — paste the Spotify song URL. Open the song in Spotify → click
  the ⋯ menu → Share → "Copy Song Link".
- `Lyrics ↗` link — link to a legal lyrics source (Genius, Hymnary, the artist's
  official site, or the publisher's lyrics page). If a lyrics link isn't ready
  yet, swap the `<a>` for `<a aria-disabled="true" href="#">Lyrics ↗</a>` and it
  will render greyed out and unclickable.

**Important — do NOT paste copyrighted lyric text into the page.** Only link out.
This keeps Room 38 in good standing with songwriters and publishers.

The page comment block at the top of the `<section class="section-songs">` repeats
these instructions inline so editors don't have to leave the file.

## How to update the Typeform embed

The form is embedded twice: as an iframe (loads immediately) and via Typeform's `embed.js` (progressive enhancement). Both reference the same form ID.

Find this block in `index.html`:

```html
<div
  data-tf-live="01HSZJSHEU"
  data-tf-src="https://form.typeform.com/to/msZJsheu"
  class="typeform-frame"
>
  <iframe
    title="Room 38 — RSVP form"
    src="https://form.typeform.com/to/msZJsheu?typeform-embed=embed-widget"
    ...
  ></iframe>
</div>
```

To swap the form, change `msZJsheu` → your new form ID in **both** the `data-tf-src` and `src` attributes. The `data-tf-live` ID is optional and only used by the Typeform script for analytics.

There's also a "Form not loading?" fallback link directly below the embed pointing to the same form — update its `href` if you change the form ID.

The footer's "RSVP form" link in the "Elsewhere" column also points at `https://form.typeform.com/to/msZJsheu`.

## How to update the Instagram link

Anywhere you see `https://instagram.com/officialroom38` in `index.html` — there are 4 spots (nav-less section CTA, card link, footer link, and the `@officialroom38` handle text). The handle in the body text is set in two places:

- the inline `<span class="handle">@officialroom38</span>`
- the `<div class="ig-handle">@officialroom38</div>` inside the IG card

## How to update the brand mark / lockup

The hero door illustration is `assets/images/lockup-black-trans.png`. To swap it, drop a replacement PNG with the same name (transparent background recommended). The SVG door icon used in the nav and Instagram card avatar is inline in `index.html` — search for `<svg class="brand-mark"` and `class="ig-avatar"`.

## Design tokens

All colors, font sizes, spacing, and tracking are CSS variables at the top of `styles.css` under `:root`. Adjust there to retheme the whole site at once.

The palette is deliberately monochrome to match the brand specimens:

- `--ink: #0a0a0a` (true black)
- `--paper: #ffffff` (true white)
- `--paper-2: #f4f2ed` (warm cream — used sparingly)
- single muted gray for secondary text

Typography is Inter + Inter Tight (loaded from Google Fonts) — Inter Tight Black approximates the heavy geometric grotesque used in the official ROOM 38 wordmark specimens, so display copy in HTML matches the lockup feel without needing a custom face.

## Local preview

Open `index.html` directly in a browser, or for a clean local server:

```bash
cd room38
python3 -m http.server 8080
# → http://localhost:8080
```

## Netlify deploy notes

This folder is drop-deploy-ready for Netlify.

1. Drag the `room38/` folder into the Netlify dashboard, or push it to a Git repo and connect.
2. `netlify.toml` is already configured with:
   - `publish = "."` (no build step)
   - Long-cache headers for static assets
   - Basic security headers
3. Add your custom domain `officialroom38.com` in **Site settings → Domain management**. Netlify will issue a Let's Encrypt cert automatically.
4. Recommended DNS: set the apex `A`/`ALIAS` to Netlify's load balancer and the `www` `CNAME` to `<your-site>.netlify.app` — then set the canonical hostname to `officialroom38.com` in Netlify.

(Per the original task, this deploy was NOT pushed to Netlify by the build agent — the user will publish it themselves.)

## SEO checklist

- [x] `<title>` and `<meta description>`
- [x] Open Graph (title, description, image, url, site_name)
- [x] Twitter card
- [x] Canonical URL (`<link rel="canonical">`)
- [x] JSON-LD Organization schema
- [x] Semantic HTML (`<main>`, `<section>`, `<nav>`, `<header>`, `<footer>`, `<h1>` once)
- [x] `robots.txt` + `sitemap.xml`
- [x] Alt text on all `<img>` tags

To-do before launch:

- [ ] Replace the OG image URL — currently points at `https://officialroom38.com/assets/images/lockup-black.jpg`. Either upload a proper 1200×630 OG card, or accept the lockup (it will be auto-cropped by social platforms).

## Accessibility checklist

- [x] Single `<h1>` per page (visually hidden — the hero uses the tagline image, but the page identity is in the H1)
- [x] All interactive elements keyboard-reachable
- [x] Skip-to-content link
- [x] Focus-visible outlines on all links and buttons
- [x] `prefers-reduced-motion` disables marquee + smooth scroll
- [x] Color contrast: pure black on pure white (21:1), exceeds WCAG AAA
- [x] Alt text on lockup and tagline images
- [x] Form iframe has `title`

## Assumptions

While building, the following assumptions were made — flag any that are wrong:

1. **Meeting time**: "Monday @ 7" from the PDF → rendered as "Mondays at 7:00 PM" (assumed evening, weekly cadence). Update via `data-edit="when"`.
2. **Address**: Not in the PDF → placeholder "Address shared with confirmed guests after RSVP." Update via `data-edit="where"`.
3. **Welcome signature**: PDF was signed by **Kihryn**, not Ryan Thogmartin. The site honors the signature as it appears in the guide. If Ryan should be named instead, edit the `<figcaption>` inside `.welcome-note` and the `<meta name="author">`.
4. **Year**: Footer renders the current year via JS. Hardcoded fallback is `2026`.
5. **Typeform ID `01HSZJSHEU`**: Inferred from the form URL `msZJsheu`. If the live form ID differs, update `data-tf-live` (this only affects Typeform analytics; the iframe still works).
6. **Branding**: Used the provided lockup + tagline JPGs at full size in the hero. Created transparent PNG versions for crisp display on both light and dark backgrounds. The "white" lockup file provided was mostly empty (just a faint wordmark, no door), so an **inverted** PNG was generated from the black lockup for use on dark sections.
