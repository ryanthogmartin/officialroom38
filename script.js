/* Room 38 — minimal progressive enhancement.
   Keep this file tiny. Anything visual lives in styles.css. */

(function () {
  // Year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Header shadow on scroll
  var header = document.getElementById("site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 4) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mobile navigation
  var menuToggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("primary-navigation");
  if (header && menuToggle && nav) {
    var menuLabel = menuToggle.querySelector(".menu-toggle-label");
    var closeMenu = function () {
      header.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      if (menuLabel) menuLabel.textContent = "Menu";
    };
    var openMenu = function () {
      header.classList.add("menu-open");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close navigation menu");
      if (menuLabel) menuLabel.textContent = "Close";
    };

    menuToggle.addEventListener("click", function () {
      if (header.classList.contains("menu-open")) closeMenu();
      else openMenu();
    });

    nav.addEventListener("click", function (event) {
      if (event.target && event.target.tagName === "A") closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 820) closeMenu();
    });
  }

  // ============================================================
  // Calendar CTAs.
  //
  // Apple/iCal: download a recurring weekly RFC 5545 .ics file.
  // Google: open the Google Calendar template URL in a new tab with
  // a weekly RRULE prefilled — no download, no import step.
  //
  // "Next Monday" rule: upcoming Monday at 7 PM Phoenix. If today is
  // Monday and Phoenix time is before 19:00, today qualifies. At/after
  // 19:00 on Monday, roll to the following Monday.
  // ============================================================

  function phoenixParts(date) {
    // Phoenix is MST year-round (no DST), UTC-7.
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Phoenix",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      weekday: "short",
    });
    var parts = {};
    fmt.formatToParts(date).forEach(function (p) {
      parts[p.type] = p.value;
    });
    var weekdayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    return {
      year: parseInt(parts.year, 10),
      month: parseInt(parts.month, 10),
      day: parseInt(parts.day, 10),
      hour: parseInt(parts.hour === "24" ? "0" : parts.hour, 10),
      minute: parseInt(parts.minute, 10),
      weekday: weekdayMap[parts.weekday] || 0,
    };
  }

  function nextMondayPhoenix(now) {
    var p = phoenixParts(now || new Date());
    var offset;
    if (p.weekday === 1) {
      offset = p.hour < 19 ? 0 : 7;
    } else {
      offset = 8 - p.weekday;
    }
    // Phoenix has no DST so day-length is constant — shift by 24h slices.
    var baseUtcMs = Date.UTC(p.year, p.month - 1, p.day);
    var shifted = new Date(baseUtcMs + offset * 86400000);
    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
    };
  }

  function pad2(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  // Convert a Phoenix local Y/M/D + H:M into a UTC YYYYMMDDTHHMMSSZ stamp.
  // Phoenix is UTC-7 year-round, so add 7h to local clock time.
  function phoenixLocalToUtcStamp(ymd, hour, minute) {
    var utcMs = Date.UTC(ymd.year, ymd.month - 1, ymd.day, hour + 7, minute, 0);
    var d = new Date(utcMs);
    return (
      d.getUTCFullYear() +
      pad2(d.getUTCMonth() + 1) +
      pad2(d.getUTCDate()) +
      "T" +
      pad2(d.getUTCHours()) +
      pad2(d.getUTCMinutes()) +
      pad2(d.getUTCSeconds()) +
      "Z"
    );
  }

  function nowUtcStamp() {
    var d = new Date();
    return (
      d.getUTCFullYear() +
      pad2(d.getUTCMonth() + 1) +
      pad2(d.getUTCDate()) +
      "T" +
      pad2(d.getUTCHours()) +
      pad2(d.getUTCMinutes()) +
      pad2(d.getUTCSeconds()) +
      "Z"
    );
  }

  var EVENT = {
    title: "Room 38 · The Table",
    details:
      "A Bible study gathering called The Table. Worship, teaching from the Word, and time around the table together. Bring a Bible and the season you're in.\n\nRSVP: https://officialroom38.com/#join",
    location: "Address shared with confirmed guests after RSVP",
    url: "https://officialroom38.com/",
    uid: "the-table-weekly@officialroom38.com",
  };

  // RFC 5545 text escape for SUMMARY/DESCRIPTION/LOCATION values.
  function icsEscape(text) {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r\n|\r|\n/g, "\\n");
  }

  // RFC 5545 §3.1 line folding: no line may exceed 75 octets. Continuation
  // lines start with a single space. We fold by character count (close
  // enough — ICS content here is ASCII except for the middle dot in the
  // title, and conservative folding leaves headroom for the 2-byte UTF-8).
  function foldLine(line) {
    if (line.length <= 75) return line;
    var out = line.substring(0, 75);
    var rest = line.substring(75);
    while (rest.length > 74) {
      out += "\r\n " + rest.substring(0, 74);
      rest = rest.substring(74);
    }
    if (rest.length) out += "\r\n " + rest;
    return out;
  }

  function buildIcs(ymd) {
    var dtstart = phoenixLocalToUtcStamp(ymd, 19, 0);
    var dtend = phoenixLocalToUtcStamp(ymd, 21, 0);
    var dtstamp = nowUtcStamp();
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Room 38//The Table//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + EVENT.uid,
      "DTSTAMP:" + dtstamp,
      "DTSTART:" + dtstart,
      "DTEND:" + dtend,
      "RRULE:FREQ=WEEKLY;INTERVAL=1;WKST=SU",
      "SUMMARY:" + icsEscape(EVENT.title),
      "DESCRIPTION:" + icsEscape(EVENT.details),
      "LOCATION:" + icsEscape(EVENT.location),
      "URL:" + EVENT.url,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ];
    return lines.map(foldLine).join("\r\n");
  }

  // Build a Google Calendar template URL that prefills the weekly event.
  // Google reads `dates` as UTC stamps and applies `recur` (an RRULE) in
  // the event's local timezone — we use `ctz=America/Phoenix` so the
  // BYDAY=MO rule lands on Monday Phoenix-local, not on the UTC date
  // (which is Tuesday for a 7-9 PM Phoenix event).
  function buildGoogleUrl(ymd) {
    var dtstart = phoenixLocalToUtcStamp(ymd, 19, 0);
    var dtend = phoenixLocalToUtcStamp(ymd, 21, 0);
    var params = new URLSearchParams({
      action: "TEMPLATE",
      text: EVENT.title,
      dates: dtstart + "/" + dtend,
      details: EVENT.details,
      location: EVENT.location,
      ctz: "America/Phoenix",
      recur: "RRULE:FREQ=WEEKLY;INTERVAL=1;WKST=SU;BYDAY=MO",
    });
    return "https://calendar.google.com/calendar/render?" + params.toString();
  }

  function updateCalendarLinks() {
    var ymd = nextMondayPhoenix();

    var googleLinks = document.querySelectorAll("[data-calendar-google]");
    if (googleLinks.length) {
      var googleUrl = buildGoogleUrl(ymd);
      for (var g = 0; g < googleLinks.length; g++) {
        googleLinks[g].setAttribute("href", googleUrl);
        googleLinks[g].removeAttribute("download");
        googleLinks[g].setAttribute("target", "_blank");
        googleLinks[g].setAttribute("rel", "noopener");
      }
    }

    var icsLinks = document.querySelectorAll("[data-calendar-ics]");
    if (!icsLinks.length) return;
    if (typeof Blob === "undefined" || typeof URL === "undefined" || !URL.createObjectURL) return;

    var ics = buildIcs(ymd);
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var filename =
      "room38-the-table-" + ymd.year + pad2(ymd.month) + pad2(ymd.day) + ".ics";
    for (var i = 0; i < icsLinks.length; i++) {
      icsLinks[i].setAttribute("href", url);
      icsLinks[i].setAttribute("download", filename);
    }
  }

  updateCalendarLinks();

  // Expose helpers for inline/unit testing.
  if (typeof window !== "undefined") {
    window.__room38Calendar = {
      phoenixParts: phoenixParts,
      nextMondayPhoenix: nextMondayPhoenix,
      buildIcs: buildIcs,
      buildGoogleUrl: buildGoogleUrl,
    };
  }
})();
