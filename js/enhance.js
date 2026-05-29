/* =====================================================================
   enhance.js — sloj poliranja: tema, scroll-progres, count-up, konfete
   Učitava se POSLE main.js na svim stranama.
   ===================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Uključi hero ulazne animacije tek kad JS radi — sadržaj je inače uvek vidljiv.
  if (!reduceMotion) {
    requestAnimationFrame(function () { document.body.classList.add("anim-ready"); });
  }

  /* ---------- 1. THEME TOGGLE ---------- */
  var SUN =
    '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON =
    '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function applyTheme(t) {
    if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#0B1426" : "#0E1B36");
  }

  var stored = null;
  try { stored = localStorage.getItem("met-theme"); } catch (e) {}
  if (stored) applyTheme(stored);

  function buildToggle() {
    var menu = document.getElementById("nav-menu");
    if (!menu || document.querySelector(".theme-toggle")) return;
    var li = document.createElement("li");
    li.style.display = "flex";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Promeni temu (svetla/tamna)");
    btn.innerHTML = SUN + MOON;
    btn.addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      var next = isDark ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("met-theme", next); } catch (e) {}
    });
    li.appendChild(btn);
    // ubaci pre CTA dugmeta ako postoji, inače na kraj
    var cta = menu.querySelector(".nav__cta");
    if (cta && cta.parentNode) menu.insertBefore(li, cta.parentNode);
    else menu.appendChild(li);
  }
  buildToggle();

  /* ---------- 2. SCROLL PROGRESS ---------- */
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  var ticking = false;
  function updateBar() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
    bar.style.width = pct + "%";
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(updateBar); ticking = true; }
  }, { passive: true });
  updateBar();

  /* ---------- 3. COUNT-UP na hero statistici ---------- */
  // Animira brojeve unutar .hero__meta b (npr "5", "12", "~2 min")
  if (!reduceMotion) {
    var metaNums = document.querySelectorAll(".hero__meta b");
    metaNums.forEach(function (el) {
      var raw = el.textContent.trim();
      var m = raw.match(/(\d+)/);
      if (!m) return;
      var target = parseInt(m[1], 10);
      var prefix = raw.slice(0, m.index);
      var suffix = raw.slice(m.index + m[1].length);
      var dur = 900, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = raw;
      }
      // kreni malo posle ulaza
      setTimeout(function () { requestAnimationFrame(step); }, 350);
    });
  }

  /* ---------- 4. KONFETE (poziva quiz.js preko window.metConfetti) ---------- */
  window.metConfetti = function () {
    if (reduceMotion) return;
    var colors = ["#E1A92E", "#F0BC4C", "#1F3768", "#FFE6A6", "#28C76F"];
    var n = 90;
    for (var i = 0; i < n; i++) {
      (function (i) {
        var p = document.createElement("div");
        p.className = "confetti-piece";
        p.style.left = Math.random() * 100 + "vw";
        p.style.background = colors[i % colors.length];
        var dur = 2.2 + Math.random() * 1.8;
        p.style.animationDuration = dur + "s";
        p.style.animationDelay = (Math.random() * 0.3) + "s";
        p.style.opacity = String(0.7 + Math.random() * 0.3);
        if (Math.random() > 0.5) p.style.borderRadius = "50%";
        document.body.appendChild(p);
        setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, (dur + 0.5) * 1000);
      })(i);
    }
  };
})();
