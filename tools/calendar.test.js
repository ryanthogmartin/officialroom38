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

// Tue 2026-05-26 -> Mon 2026-06-01. Pick mid-day UTC; Phoenix is UTC-7, so
// 18:00Z on Tue is 11:00 Phoenix Tue.
console.log("nextMondayPhoenix");
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

// ---------- buildGoogleUrl ----------
console.log("buildGoogleUrl");
{
  const url = cal.buildGoogleUrl({ year: 2026, month: 6, day: 1 });
  const parsed = new URL(url);
  const params = parsed.searchParams;

  assert(parsed.origin + parsed.pathname === "https://www.google.com/calendar/render", "URL points to Google Calendar render");
  assert(params.get("action") === "TEMPLATE", "action=TEMPLATE present");
  assert(params.get("dates") === "20260601T190000/20260601T210000", "dates spans 7-9 PM on 2026-06-01");
  assert(params.get("ctz") === "America/Phoenix", "ctz is America/Phoenix");
  assert(params.get("recur") === "RRULE:FREQ=WEEKLY;WKST=SU;BYDAY=MO", "recur parses back to full RRULE with WKST=SU");

  // The RRULE must survive as a single param. After encoding, the ';' must
  // be '%3B' so it doesn't split the query string into orphan params.
  assert(/[?&]recur=RRULE%3AFREQ%3DWEEKLY%3BWKST%3DSU%3BBYDAY%3DMO(?:&|$)/.test(url), "recur appears once with semicolons encoded as %3B");
  assert(!/[?&]BYDAY=MO/.test(url), "BYDAY=MO is NOT a separate query param");
  assert(!/[?&]WKST=SU/.test(url), "WKST=SU is NOT a separate query param");
}

{
  // 2026-05-26 dynamic example -> Mon 2026-06-01 starting date in URL
  const ymd = cal.nextMondayPhoenix(new Date(Date.UTC(2026, 4, 26, 18, 0, 0)));
  const url = cal.buildGoogleUrl(ymd);
  assert(url.indexOf("dates=20260601T190000%2F20260601T210000") !== -1 || url.indexOf("dates=20260601T190000/20260601T210000") !== -1, "Google URL for 2026-05-26 input uses dates=2026-06-01 7-9pm");
  assert(url.indexOf("recur=RRULE%3AFREQ%3DWEEKLY%3BWKST%3DSU%3BBYDAY%3DMO") !== -1, "Google URL contains encoded weekly recur");
}

{
  // 2026-06-01 at 19:00 Phoenix -> next Mon 2026-06-08
  const ymd = cal.nextMondayPhoenix(new Date(Date.UTC(2026, 5, 2, 2, 0, 0)));
  const url = cal.buildGoogleUrl(ymd);
  assert(url.indexOf("20260608T190000") !== -1, "Google URL for Mon 19:00 input uses dates=2026-06-08");
  assert(url.indexOf("recur=RRULE%3AFREQ%3DWEEKLY%3BWKST%3DSU%3BBYDAY%3DMO") !== -1, "Google URL still recurring weekly on rollover");
}

// ---------- buildIcs ----------
console.log("buildIcs");
{
  const ics = cal.buildIcs({ year: 2026, month: 6, day: 1 });
  assert(ics.indexOf("DTSTART;TZID=America/Phoenix:20260601T190000") !== -1, "ICS DTSTART uses Phoenix TZ at 7pm on 2026-06-01");
  assert(ics.indexOf("DTEND;TZID=America/Phoenix:20260601T210000") !== -1, "ICS DTEND uses Phoenix TZ at 9pm on 2026-06-01");
  assert(ics.indexOf("RRULE:FREQ=WEEKLY;WKST=SU;BYDAY=MO") !== -1, "ICS contains weekly RRULE on Mondays");
  assert(ics.indexOf("BEGIN:VTIMEZONE") !== -1 && ics.indexOf("TZID:America/Phoenix") !== -1, "ICS embeds the Phoenix VTIMEZONE block");
}

{
  // 2026-06-01 at 19:00 Phoenix -> ICS DTSTART = 20260608T190000
  const ymd = cal.nextMondayPhoenix(new Date(Date.UTC(2026, 5, 2, 2, 0, 0)));
  const ics = cal.buildIcs(ymd);
  assert(ics.indexOf("DTSTART;TZID=America/Phoenix:20260608T190000") !== -1, "ICS rolls DTSTART to 2026-06-08 at the 7pm boundary");
  assert(ics.indexOf("RRULE:FREQ=WEEKLY;WKST=SU;BYDAY=MO") !== -1, "ICS still weekly recurring on rollover");
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
