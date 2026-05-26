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
    var closeMenu = function () {
      header.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    };
    var openMenu = function () {
      header.classList.add("menu-open");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close navigation menu");
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
})();
