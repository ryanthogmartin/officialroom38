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
  // Calendar CTAs: compute the next Monday in America/Phoenix and
  // rewrite Apple/iCal + Google Calendar links so they always start
  // on the upcoming Monday at 7-9 PM local time, weekly.
  //
  // "Next Monday" rule: the upcoming Monday at 7 PM Phoenix time.
  // If today is Monday and the current Phoenix time is before 19:00,
  // today qualifies. At/after 19:00 on Monday, roll to the following Monday.
  // ============================================================

  // Return { year, month (1-12), day, hour, minute, weekday (1=Mon..7=Sun) }
  // representing `date` rendered in America/Phoenix.
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

  // Compute the next-Monday Y/M/D (Phoenix-local). `now` lets tests inject time.
  function nextMondayPhoenix(now) {
    var p = phoenixParts(now || new Date());
    var offset;
    if (p.weekday === 1) {
      // Today is Monday in Phoenix: use today if before 7 PM, else +7 days.
      offset = p.hour < 19 ? 0 : 7;
    } else {
      // weekday 2..7 -> add (8 - weekday) days to reach next Monday
      offset = 8 - p.weekday;
    }
    // Add `offset` days to the Phoenix calendar date by reconstructing a UTC
    // midnight for the Phoenix date and shifting in 24h increments. Phoenix
    // has no DST so day-length is constant.
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

  // YYYYMMDDTHHMMSS — floating local time, used inside DTSTART;TZID= and Google's dates=
  function formatLocal(ymd, hour, minute) {
    return (
      ymd.year +
      pad2(ymd.month) +
      pad2(ymd.day) +
      "T" +
      pad2(hour) +
      pad2(minute) +
      "00"
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

  function buildGoogleUrl(ymd) {
    var start = formatLocal(ymd, 19, 0);
    var end = formatLocal(ymd, 21, 0);
    var params = [
      "action=TEMPLATE",
      "text=" + encodeURIComponent(EVENT.title),
      "dates=" + start + "/" + end,
      "ctz=America/Phoenix",
      "recur=" + encodeURIComponent("RRULE:FREQ=WEEKLY;BYDAY=MO"),
      "details=" + encodeURIComponent(EVENT.details),
      "location=" + encodeURIComponent(EVENT.location),
      "sf=true",
      "output=xml",
    ];
    return "https://www.google.com/calendar/render?" + params.join("&");
  }

  function buildIcs(ymd) {
    var start = formatLocal(ymd, 19, 0);
    var end = formatLocal(ymd, 21, 0);
    // DTSTAMP must be UTC.
    var nowUtc = new Date();
    var dtstamp =
      nowUtc.getUTCFullYear() +
      pad2(nowUtc.getUTCMonth() + 1) +
      pad2(nowUtc.getUTCDate()) +
      "T" +
      pad2(nowUtc.getUTCHours()) +
      pad2(nowUtc.getUTCMinutes()) +
      pad2(nowUtc.getUTCSeconds()) +
      "Z";
    // ICS DESCRIPTION needs commas escaped and newlines as \n.
    var icsDescription = EVENT.details
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Room 38//The Table//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VTIMEZONE",
      "TZID:America/Phoenix",
      "X-LIC-LOCATION:America/Phoenix",
      "BEGIN:STANDARD",
      "TZOFFSETFROM:-0700",
      "TZOFFSETTO:-0700",
      "TZNAME:MST",
      "DTSTART:19700101T000000",
      "END:STANDARD",
      "END:VTIMEZONE",
      "BEGIN:VEVENT",
      "UID:" + EVENT.uid,
      "DTSTAMP:" + dtstamp,
      "SUMMARY:" + EVENT.title,
      "DESCRIPTION:" + icsDescription,
      "URL:" + EVENT.url,
      "LOCATION:" + EVENT.location,
      "DTSTART;TZID=America/Phoenix:" + start,
      "DTEND;TZID=America/Phoenix:" + end,
      "RRULE:FREQ=WEEKLY;BYDAY=MO",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
  }

  function updateCalendarLinks() {
    var ymd = nextMondayPhoenix();

    // Google Calendar links
    var googleUrl = buildGoogleUrl(ymd);
    var googleLinks = document.querySelectorAll("[data-calendar-google]");
    for (var i = 0; i < googleLinks.length; i++) {
      googleLinks[i].setAttribute("href", googleUrl);
    }

    // Apple/iCal links — generate a Blob URL with the dynamic .ics file
    var icsLinks = document.querySelectorAll("[data-calendar-ics]");
    if (icsLinks.length && typeof Blob !== "undefined" && typeof URL !== "undefined" && URL.createObjectURL) {
      var ics = buildIcs(ymd);
      var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var filename =
        "room38-the-table-" + ymd.year + pad2(ymd.month) + pad2(ymd.day) + ".ics";
      for (var j = 0; j < icsLinks.length; j++) {
        icsLinks[j].setAttribute("href", url);
        icsLinks[j].setAttribute("download", filename);
      }
    }
  }

  updateCalendarLinks();

  // Expose helpers for inline/unit testing.
  if (typeof window !== "undefined") {
    window.__room38Calendar = {
      phoenixParts: phoenixParts,
      nextMondayPhoenix: nextMondayPhoenix,
      buildGoogleUrl: buildGoogleUrl,
      buildIcs: buildIcs,
    };
  }
})();
