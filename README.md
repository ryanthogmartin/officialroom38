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
- **Details** section: the "Time" and "Location" cards.
- **What to expect**: replace "The full flow of the night is coming soon."
- **JSON-LD** in the `<head>`: add the time to `startDate` (for example
  `2027-01-16T18:00:00-07:00`) and the venue address under `location`.
- Optional: add a map link (only if the address is public) and Add to Calendar
  links once the time is set.

The share card is `assets/images/og-werebuilding.png` (1200×630). If you replace
it, give the new file a new name and update the `og:image` / `twitter:image`
tags, because images are cached for a year.

## RSVP form

RSVPs post to a Google Apps Script web app that writes
`Timestamp | Name | Email | Guests` rows into the We're Building RSVP Google Sheet.
The script lives in that Sheet (Extensions → Apps Script), not in this repo.

Until the web app URL is pasted in, the RSVP section shows a
"DM @officialroom38" button instead of the form, so no RSVPs are lost.

To connect it:

1. Open the RSVP Sheet → **Extensions → Apps Script**, paste in the `Code.gs`
   script from the We're Building developer handoff, save.
2. **Deploy → New deployment → Web app**. Execute as **Me**, access **Anyone**.
3. Authorize (on "Google hasn't verified this app": Advanced → Go to project → Allow).
4. Copy the **Web app URL** (ends in `/exec`).
5. In `index.html`, set `const RSVP_URL = '…/exec';` and push to `main`.
6. Submit a test RSVP on the live site and check that a row appears in the Sheet.

If the script changes later: **Deploy → Manage deployments → Edit → New version**,
or the live URL keeps running the old code.

The form uses `fetch(..., { mode: 'no-cors' })` because Apps Script doesn't send
CORS headers, so the page shows "You're in" whenever the request goes out. A hidden
`company` field is a honeypot for spam bots.

Guests are told they'll get the time and location by email, so someone needs to
send that from the Sheet's email list once details are set.

## Previous site

The earlier Room 38 · The Table site (homepage, Worship songs page, Week One recap)
was replaced on November 13, 2026. Its old URLs redirect to the homepage. The full
previous site is in Git history at commit `7c780fa`.

## Local preview

```bash
python3 -m http.server 8080
# → http://localhost:8080
```
