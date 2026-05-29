/* =====================================================================
   main.js — zajednička logika za sve strane
   1) mobilni meni (hamburger)
   2) suptilni reveal animacija na skrol
   Aktivno stanje navigacije je već postavljeno u HTML-u (aria-current="page").
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- 1. Mobilni meni ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Zatvori meni" : "Otvori meni");
    });

    // Zatvori meni klikom na link (na mobilnom)
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a") && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Otvori meni");
      }
    });

    // Zatvori meni na Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- 2. Reveal na skrol ---------- */
  // Označi kandidate: sve kartice i naslove sekcija
  var revealEls = document.querySelectorAll(
    ".card, .program-card, .tl-step, .source-item, .cta-banner, .note, .table-wrap"
  );

  // Ako korisnik ne želi animacije ili nema IntersectionObserver — samo prikaži
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    revealEls.forEach(function (el) {
      el.classList.add("reveal");
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach(function (el) {
      io.observe(el);
    });
  }
})();
