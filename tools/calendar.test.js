/* Tests for the dynamic calendar helpers in ../script.js.
   Run with: node tools/calendar.test.js
   No test framework — exits non-zero on the first failed assertion. */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Load script.js inside a minimal browser-ish sandbox so the IIFE can run
// and expose window.__room38Calendar for us to exercise.
const scriptPath = path.join(__dirname, "..", "script.js");
const source = fs.readFileSync(scriptPath, "utf8");

const fakeDoc = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
};
const sandbox = {
  window: {},
  document: fakeDoc,
  Intl,
  URL,
  URLSearchParams,
  Blob: typeof Blob !== "undefined" ? Blob : function () {},
  Date,
  setTimeout,
  clearTimeout,
};
sandbox.window.addEventListener = () => {};
sandbox.window.scrollY = 0;
sandbox.window.innerWidth = 1024;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const cal = sandbox.window.__room38Calendar;
if (!cal) {
  console.error("FAIL: window.__room38Calendar was not exposed");
  process.exit(1);
}

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log("  ok  " + msg);
  } else {
    failed++;
    console.error("  FAIL " + msg);
  }
}

// ---------- nextMondayPhoenix ----------
console.log("nextMondayPhoenix");

// Tue 2026-05-26 -> Mon 2026-06-01. Pick mid-day UTC; Phoenix is UTC-7, so
// 18:00Z on Tue is 11:00 Phoenix Tue.
{
  const ymd = cal.nextMondayPhoenix(new Date(Date.UTC(2026, 4, 26, 18, 0, 0)));
  assert(
    ymd.year === 2026 && ymd.month === 6 && ymd.day === 1,
    "Tue 2026-05-26 -> Mon 2026-06-01 (got " + JSON.stringify(ymd) + ")"
  );
}

// Mon 2026-06-01 at 19:00 Phoenix (= 02:00Z Tue 2026-06-02) -> next Mon 2026-06-08
{
  const ymd = cal.nextMondayPhoenix(new Date(Date.UTC(2026, 5, 2, 2, 0, 0)));
  assert(
    ymd.year === 2026 && ymd.month === 6 && ymd.day === 8,
    "Mon 19:00 Phoenix -> +7 days = 2026-06-08 (got " + JSON.stringify(ymd) + ")"
  );
}

// Mon 2026-06-01 at 18:59 Phoenix (= 01:59Z Tue 2026-06-02) -> same Monday
{
  const ymd = cal.nextMondayPhoenix(new Date(Date.UTC(2026, 5, 2, 1, 59, 0)));
  assert(
    ymd.year === 2026 && ymd.month === 6 && ymd.day === 1,
    "Mon 18:59 Phoenix -> same day 2026-06-01 (got " + JSON.stringify(ymd) + ")"
  );
}

// Sunday rolls forward one day
{
  // Sun 2026-05-31 at noon Phoenix = 19:00Z
  const ymd = cal.nextMondayPhoenix(new Date(Date.UTC(2026, 4, 31, 19, 0, 0)));
  assert(
    ymd.year === 2026 && ymd.month === 6 && ymd.day === 1,
    "Sun 2026-05-31 -> Mon 2026-06-01 (got " + JSON.stringify(ymd) + ")"
  );
}

// ---------- buildIcs ----------
console.log("buildIcs");

// Helper: unfold RFC 5545 line folding so we can grep cleanly.
function unfold(ics) {
  return ics.replace(/\r\n[ \t]/g, "");
}

{
  const ics = cal.buildIcs({ year: 2026, month: 6, day: 1 });
  const unfolded = unfold(ics);

  // Phoenix 7 PM on Mon 2026-06-01 in UTC = 02:00 Tue 2026-06-02.
  assert(
    unfolded.indexOf("DTSTART:20260602T020000Z") !== -1,
    "ICS DTSTART is UTC: 20260602T020000Z (7pm Phoenix Mon 06-01)"
  );
  assert(
    unfolded.indexOf("DTEND:20260602T040000Z") !== -1,
    "ICS DTEND is UTC: 20260602T040000Z (9pm Phoenix Mon 06-01)"
  );
  assert(
    unfolded.indexOf("RRULE:FREQ=WEEKLY;INTERVAL=1;WKST=SU") !== -1,
    "ICS contains weekly RRULE (no BYDAY — repeats every 7 days from DTSTART)"
  );
  assert(
    /\r\nRRULE:[^\r\n]*\r\n/.test(unfolded) && !/\r\nRRULE:[^\r\n]*BYDAY/.test(unfolded),
    "ICS RRULE has no BYDAY (would conflict with UTC DTSTART on Tuesday)"
  );
  assert(
    unfolded.indexOf("UID:the-table-weekly@officialroom38.com") !== -1,
    "ICS contains stable UID"
  );
  assert(
    /\r\nDTSTAMP:\d{8}T\d{6}Z/.test(unfolded),
    "ICS DTSTAMP is present and UTC"
  );
  assert(
    unfolded.indexOf("BEGIN:VCALENDAR") === 0,
    "ICS starts with BEGIN:VCALENDAR"
  );
  assert(
    /END:VCALENDAR\r\n$/.test(ics),
    "ICS ends with END:VCALENDAR followed by CRLF"
  );
  assert(
    !/(^|[^\r])\n/.test(ics) && ics.indexOf("\r\n") !== -1,
    "ICS uses CRLF line endings (no lone LF)"
  );
}

// Line folding: no raw line in the ICS exceeds 75 octets.
{
  const ics = cal.buildIcs({ year: 2026, month: 6, day: 1 });
  const rawLines = ics.split("\r\n");
  const tooLong = rawLines.filter((l) => Buffer.byteLength(l, "utf8") > 75);
  assert(
    tooLong.length === 0,
    "Every ICS line is <= 75 octets (folded) — offenders: " +
      JSON.stringify(tooLong)
  );
}

// 2026-06-01 at 19:00 Phoenix -> ICS DTSTART rolls to 2026-06-08 / 02:00Z 06-09
{
  const ymd = cal.nextMondayPhoenix(new Date(Date.UTC(2026, 5, 2, 2, 0, 0)));
  const ics = unfold(cal.buildIcs(ymd));
  assert(
    ics.indexOf("DTSTART:20260609T020000Z") !== -1,
    "ICS rolls DTSTART to Tue 2026-06-09 02:00Z (= Mon 06-08 7pm Phoenix)"
  );
  assert(
    ics.indexOf("RRULE:FREQ=WEEKLY;INTERVAL=1;WKST=SU") !== -1,
    "ICS still weekly recurring on rollover"
  );
}

// ---------- Static ICS file ----------
console.log("static assets/room38-the-table.ics");
{
  const icsPath = path.join(__dirname, "..", "assets", "room38-the-table.ics");
  const raw = fs.readFileSync(icsPath, "utf8");
  const unfolded = unfold(raw);

  assert(raw.indexOf("\r\n") !== -1, "static ICS uses CRLF");
  assert(
    unfolded.indexOf("RRULE:FREQ=WEEKLY;INTERVAL=1;WKST=SU") !== -1,
    "static ICS contains weekly RRULE (no BYDAY — repeats every 7 days from DTSTART)"
  );
  assert(
    !/\r\nRRULE:[^\r\n]*BYDAY/.test(unfolded),
    "static ICS RRULE has no BYDAY"
  );
  assert(
    /\r\nDTSTART:\d{8}T\d{6}Z\r\n/.test(unfolded),
    "static ICS DTSTART is a UTC timestamp"
  );
  assert(
    /\r\nDTEND:\d{8}T\d{6}Z\r\n/.test(unfolded),
    "static ICS DTEND is a UTC timestamp"
  );
  assert(
    unfolded.indexOf("UID:the-table-weekly@officialroom38.com") !== -1,
    "static ICS UID matches dynamic UID"
  );

  // No raw line exceeds 75 octets.
  const tooLong = raw.split("\r\n").filter((l) => Buffer.byteLength(l, "utf8") > 75);
  assert(
    tooLong.length === 0,
    "static ICS every line <= 75 octets — offenders: " + JSON.stringify(tooLong)
  );
}

// ---------- HTML wiring ----------
// Both Apple AND Google buttons must carry data-calendar-* attributes and
// point at the ICS asset so script.js can hand them the recurring Blob.
console.log("HTML calendar buttons");
{
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

  assert(
    html.indexOf("data-calendar-ics") !== -1,
    "index.html has at least one [data-calendar-ics] anchor"
  );
  assert(
    html.indexOf("data-calendar-google") !== -1,
    "index.html has at least one [data-calendar-google] anchor"
  );
  assert(
    html.indexOf("calendar/render") === -1,
    "index.html no longer points anything at Google calendar/render (which loses recurrence)"
  );

  // The Google button's initial href must be the ICS file too — so even
  // before script.js runs, it downloads the recurring invite.
  const googleAnchorMatch = html.match(/<a[^>]*data-calendar-google[^>]*>/);
  assert(
    googleAnchorMatch && /href="[^"]*room38-the-table\.ics"/.test(googleAnchorMatch[0]),
    "Google button href fallback is the ICS file (got: " +
      (googleAnchorMatch ? googleAnchorMatch[0] : "no match") +
      ")"
  );
  assert(
    googleAnchorMatch && /download="[^"]*\.ics"/.test(googleAnchorMatch[0]),
    "Google button has download attribute so it saves as .ics"
  );
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
