# Room 38 · officialroom38.com

The site is a single event page for **We're Building**, a Room 38 night on
Saturday, January 16, 2027 in the Phoenix / Scottsdale area.

Stack: one self-contained `index.html` (all CSS and JS inline, fonts from Google
Fonts). No build step. Netlify publishes the `main` branch automatically.

## Files

```
index.html     ← the We're Building page (homepage)
404.html       ← branded "page not found"
netlify.toml   ← redirects (old pages → homepage) and headers
robots.txt, sitemap.xml
assets/images/ ← door mark, share card, Week One photos, favicon
```

## Updating event details

When the time or venue is set, update these spots in `index.html`:

- **Hero** (`.meta` block): the "Time" and "Where" values. Remove the `soon` class
  from a value once it is real so it stops showing in gray.
- **Details** section: "Full schedule coming soon" under What to expect.
- **JSON-LD** in the `<head>`: add the time to `startDate` (for example
  `2027-01-16T18:00:00-07:00`) and the venue address under `location`.
- Optional: add a map link (only if the address is public) and Add to Calendar
  links once the time is set.

The share card is `assets/images/og-werebuilding.png` (1200×630). If you replace
it, give the new file a new name and update the `og:image` / `twitter:image`
tags, because images are cached for a year.

## RSVP form

Every "RSVP" / "Save your seat" button opens a popup form (`<dialog id="rsvp">`)
with first name, last name, email, mobile number, and how many people (1 to 10).
Linking to `officialroom38.com/#rsvp` opens the popup directly.

Each RSVP is saved two ways:

1. **Netlify Forms** (form name `rsvp`): always on. Submissions appear in the
   Netlify project under **Forms**. This is the backup copy and what confirms
   the save to the guest.
2. **Google Sheet** ("We're Building RSVPs", columns FIRST, LAST, EMAIL, MOBILE,
   GUESTS): through a Google Apps Script web app, once its URL is set as
   `RSVP_URL` near the bottom of `index.html`. The script lives in the Sheet
   (Extensions → Apps Script), not in this repo. It matches columns by header
   name and fills a TIMESTAMP column if one is added.

To connect the Sheet:

1. Open the Sheet → **Extensions → Apps Script**, paste in `Code.gs`, save.
2. **Deploy → New deployment → Web app**. Execute as **Me**, access **Anyone**.
3. Authorize (on "Google hasn't verified this app": Advanced → Go to project → Allow).
4. Copy the **Web app URL** (ends in `/exec`), set `const RSVP_URL = '…/exec';`
   in `index.html`, and push to `main`.
5. Submit a test RSVP on the live site and check that a row appears in the Sheet.
   Copy any RSVPs that came in before this step from Netlify into the Sheet.

If the script changes later: **Deploy → Manage deployments → Edit → New version**,
or the live URL keeps running the old code.

The Sheet request uses `fetch(..., { mode: 'no-cors' })` because Apps Script
doesn't send CORS headers. A hidden `company` field is a honeypot for spam bots
(Netlify's `netlify-honeypot` and the script both ignore filled-in submissions).

Guests are told they'll get the time and location by email, so someone needs to
send that from the RSVP list once details are set.

## Previous site

The earlier Room 38 · The Table site (homepage, Worship songs page, Week One recap)
was replaced on November 13, 2026. Its old URLs redirect to the homepage. The full
previous site is in Git history at commit `7c780fa`.

## Local preview

```bash
python3 -m http.server 8080
# → http://localhost:8080
```
