/* =====================================================================
   quiz.js — Tinder-style swipe kviz (vanilla JS, bez biblioteka)
   ---------------------------------------------------------------------
   Kako radi:
   - Špil od 12 kartica naslagan jedan preko drugog (CSS position:absolute).
   - Gornja kartica se vuče mišem (pointer events) i prstom (touch).
   - Tokom vučenja: translate + rotate + overlay oznaka (SVIĐA / NE).
   - Prelaz preko praga (SWIPE_THRESHOLD px) => kartica "izleti" i broji se;
     u suprotnom => snap-back na centar.
   - Bodovanje: DESNO (+poeni smerovima sa kartice), LEVO (0 poena).
   - Na kraju: smer sa najviše poena = glavna preporuka + 2 alternative.
   - Stanje se drži samo u JS promenljivama (BEZ localStorage).
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- 1. Podaci o smerovima ---------- */
  // Ključ -> sve što treba za prikaz rezultata.
  var PROGRAMS = {
    SI: {
      name: "Softversko inženjerstvo",
      faculty: "Fakultet informacionih tehnologija",
      emoji: "💻",
      desc: "Praviš aplikacije i rešavaš probleme kodom. Učiš programiranje, algoritme, baze podataka i web razvoj — temelj za karijeru developera.",
      url: "https://www.metropolitan.ac.rs/osnovne-studije/fakultet-informacionih-tehnologija/softversko-inzenjerstvo/"
    },
    RVI: {
      name: "Razvoj video igara",
      faculty: "Fakultet informacionih tehnologija",
      emoji: "🎮",
      desc: "Spoj programiranja i kreativnosti — praviš igre od ideje do gejmpleja. Game engine, 3D grafika, dizajn nivoa i matematika za igre.",
      url: "https://www.metropolitan.ac.rs/osnovne-studije/fakultet-informacionih-tehnologija/razvoj-video-igara/"
    },
    DBM: {
      name: "Digitalni biznis i marketing",
      faculty: "Fakultet za menadžment",
      emoji: "📈",
      desc: "Brendovi, mreže, kampanje i online prodaja. Učiš digitalni marketing, e-biznis, analitiku i kako se vode ljudi i projekti.",
      url: "https://www.metropolitan.ac.rs/osnovne-studije/fakultet-za-menadzment/digitalni-biznis-i-marketing/"
    },
    GD: {
      name: "Grafički dizajn",
      faculty: "Fakultet digitalnih umetnosti",
      emoji: "🎨",
      desc: "Vizuelno pričaš priče — tipografija, vizuelni identitet, ilustracija i komunikacija. Za one kojima je estetika jako bitna.",
      url: "https://www.metropolitan.ac.rs/fakultet-digitalnih-umetnosti-2/graficki-dizajn/"
    },
    DIM: {
      name: "Dizajn interaktivnih medija",
      faculty: "Fakultet digitalnih umetnosti",
      emoji: "✨",
      desc: "Kreativnost + tehnologija. UX/UI, web dizajn, animacija i motion grafika — dizajniraš stvari sa kojima ljudi stupaju u interakciju.",
      url: "https://www.metropolitan.ac.rs/fakultet-digitalnih-umetnosti-2/dizajn-interaktivnih-medija/"
    }
  };

  /* ---------- 2. Kartice kviza ---------- */
  // text = tvrdnja; tags = smerovi koji dobijaju +1 ako se prevuče DESNO.
  var CARDS = [
    { emoji: "🧩", text: "Volim da rešavam logičke probleme i zagonetke.", tags: ["SI", "RVI"] },
    { emoji: "🕹️", text: "Satima bih mogao/la da pravim i modujem igre.", tags: ["RVI"] },
    { emoji: "📱", text: "Pratim trendove na mrežama i volim marketing.", tags: ["DBM"] },
    { emoji: "🎨", text: "Uživam da crtam, biram boje, fontove i kompozicije.", tags: ["GD", "DIM"] },
    { emoji: "🛠️", text: "Zanima me kako nastaju aplikacije i sajtovi.", tags: ["SI", "DIM"] },
    { emoji: "🧑‍🤝‍🧑", text: "Volim da organizujem ljude i vodim projekte.", tags: ["DBM"] },
    { emoji: "🎞️", text: "Privlači me animacija i pokret na ekranu.", tags: ["DIM"] },
    { emoji: "➗", text: "Matematika i algoritmi su mi zanimljivi.", tags: ["SI", "RVI"] },
    { emoji: "🚀", text: "Sanjam da pokrenem sopstveni brend ili biznis.", tags: ["DBM"] },
    { emoji: "🖌️", text: "Vizuelni identitet i estetika su mi jako bitni.", tags: ["GD"] },
    { emoji: "🔗", text: "Volim da spajam kreativnost i tehnologiju.", tags: ["DIM", "RVI"] },
    { emoji: "🤖", text: "Zanimaju me veštačka inteligencija i podaci.", tags: ["SI"] }
  ];

  var SWIPE_THRESHOLD = 120; // px — koliko treba prevući da se izbor potvrdi
  var MAX_ROTATE = 18;       // stepeni rotacije pri maksimalnom pomeraju
  var FLY_DISTANCE = 1000;   // px — koliko daleko kartica "odleti"

  /* ---------- 3. DOM reference ---------- */
  var deck = document.getElementById("deck");
  if (!deck) return; // nismo na strani kviza

  var deckArea = document.getElementById("deckArea");
  var btnYes = document.getElementById("btnYes");
  var btnNo = document.getElementById("btnNo");
  var btnRetry = document.getElementById("btnRetry");

  var progressFill = document.getElementById("progressFill");
  var progressLabel = document.getElementById("progressLabel");
  var progressPct = document.getElementById("progressPct");

  var resultEl = document.getElementById("result");

  /* ---------- 4. Stanje (samo u memoriji) ---------- */
  var scores;        // { SI:0, RVI:0, ... }
  var currentIndex;  // indeks kartice koja je na vrhu
  var cardEls;       // DOM elementi kartica (poslednji = vrh)
  var topCard;       // trenutno aktivna (gornja) kartica
  var isAnimating;   // blokira input dok kartica leti

  // Drag stanje
  var dragging = false;
  var startX = 0, startY = 0;
  var dx = 0, dy = 0;
  var activePointerId = null;

  /* ---------- 5. Inicijalizacija / reset ---------- */
  function init() {
    scores = { SI: 0, RVI: 0, DBM: 0, GD: 0, DIM: 0 };
    currentIndex = 0;
    isAnimating = false;
    dragging = false;
    cardEls = [];

    deck.innerHTML = "";
    buildDeck();
    updateProgress();

    // pokaži špil, sakrij rezultat
    if (deckArea) deckArea.hidden = false;
    if (resultEl) resultEl.hidden = true;
  }

  // Napravi sve kartice. Render obrnutim redom da poslednja u DOM-u
  // (vizuelno na vrhu) bude PRVA tvrdnja iz CARDS.
  function buildDeck() {
    for (var i = CARDS.length - 1; i >= 0; i--) {
      var data = CARDS[i];
      var el = document.createElement("article");
      el.className = "swipe-card";
      el.dataset.index = String(i);
      el.setAttribute("role", "group");
      el.setAttribute("aria-roledescription", "kartica za prevlačenje");
      el.setAttribute("aria-label", "Tvrdnja " + (i + 1) + " od " + CARDS.length);

      el.innerHTML =
        '<div class="swipe-card__stamp swipe-card__stamp--yes" aria-hidden="true">SVIĐA MI SE</div>' +
        '<div class="swipe-card__stamp swipe-card__stamp--no" aria-hidden="true">NIJE ZA MENE</div>' +
        '<span class="swipe-card__index">' + (i + 1) + " / " + CARDS.length + "</span>" +
        '<div class="swipe-card__emoji" aria-hidden="true">' + data.emoji + "</div>" +
        '<p class="swipe-card__text">' + data.text + "</p>" +
        '<div class="swipe-card__hint">' +
          '<span>← Nije za mene</span>' +
          '<span>To sam ja →</span>' +
        "</div>";

      // Lagano stepenasto naslagan izgled (dubina)
      var depth = i - currentIndex; // 0 = vrh
      styleStack(el, depth);

      deck.appendChild(el);
      cardEls[i] = el;
    }
    setTopCard();
  }

  // Vizuelni "stack" efekat: dublje kartice malo niže i manje.
  function styleStack(el, depth) {
    if (depth < 0) return;
    var scale = 1 - Math.min(depth, 3) * 0.04;
    var translateY = Math.min(depth, 3) * 10;
    el.style.transform = "translateY(" + translateY + "px) scale(" + scale + ")";
    el.style.opacity = depth > 3 ? "0" : "1";
    el.style.zIndex = String(CARDS.length - depth);
  }

  // Postavi gornju karticu kao aktivnu (sluša input).
  function setTopCard() {
    topCard = cardEls[currentIndex] || null;
    if (topCard) {
      topCard.style.transition = "transform 0.3s ease";
      topCard.style.transform = "translateY(0) scale(1)";
      attachDragHandlers(topCard);
    }
  }

  /* ---------- 6. Drag / swipe handleri ---------- */
  function attachDragHandlers(card) {
    // Pointer events pokrivaju i miš i touch na modernim browserima.
    card.addEventListener("pointerdown", onPointerDown);
  }

  function onPointerDown(e) {
    if (isAnimating || dragging) return;
    // samo gornja kartica
    if (e.currentTarget !== topCard) return;

    dragging = true;
    activePointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    dy = 0;

    topCard.classList.add("is-dragging");
    topCard.style.transition = "none";

    // Uhvati pointer da pratimo i van kartice
    if (topCard.setPointerCapture) {
      try { topCard.setPointerCapture(e.pointerId); } catch (err) {}
    }

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== activePointerId) return;

    dx = e.clientX - startX;
    dy = e.clientY - startY;

    renderDrag(dx, dy);
  }

  // Primeni transform tokom vučenja + overlay oznake.
  function renderDrag(x, y) {
    if (!topCard) return;
    var rotate = (x / 200) * MAX_ROTATE;
    if (rotate > MAX_ROTATE) rotate = MAX_ROTATE;
    if (rotate < -MAX_ROTATE) rotate = -MAX_ROTATE;

    topCard.style.transform =
      "translate(" + x + "px, " + y + "px) rotate(" + rotate + "deg)";

    // Overlay: jačina prema pomeraju (0 → 1)
    var ratio = Math.min(Math.abs(x) / SWIPE_THRESHOLD, 1);
    var yesStamp = topCard.querySelector(".swipe-card__stamp--yes");
    var noStamp = topCard.querySelector(".swipe-card__stamp--no");
    if (x > 0) {
      if (yesStamp) yesStamp.style.opacity = String(ratio);
      if (noStamp) noStamp.style.opacity = "0";
    } else if (x < 0) {
      if (noStamp) noStamp.style.opacity = String(ratio);
      if (yesStamp) yesStamp.style.opacity = "0";
    } else {
      if (yesStamp) yesStamp.style.opacity = "0";
      if (noStamp) noStamp.style.opacity = "0";
    }
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = false;

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);

    if (topCard) topCard.classList.remove("is-dragging");

    // Odluka: prag pređen?
    if (dx > SWIPE_THRESHOLD) {
      flyOut(1);       // desno = sviđa mi se
    } else if (dx < -SWIPE_THRESHOLD) {
      flyOut(-1);      // levo = nije za mene
    } else {
      snapBack();      // vrati na centar
    }
  }

  // Vrati karticu na sredinu (nije prešla prag).
  function snapBack() {
    if (!topCard) return;
    topCard.style.transition = "transform 0.3s ease";
    topCard.style.transform = "translate(0,0) rotate(0)";
    var yesStamp = topCard.querySelector(".swipe-card__stamp--yes");
    var noStamp = topCard.querySelector(".swipe-card__stamp--no");
    if (yesStamp) yesStamp.style.opacity = "0";
    if (noStamp) noStamp.style.opacity = "0";
  }

  /* ---------- 7. Potvrda izbora ---------- */
  // direction: 1 = desno (sviđa), -1 = levo (ne sviđa)
  function flyOut(direction) {
    if (!topCard || isAnimating) return;
    isAnimating = true;

    var card = topCard;
    var idx = parseInt(card.dataset.index, 10);

    // Bodovanje: samo DESNO donosi poene smerovima sa kartice.
    if (direction === 1) {
      var tags = CARDS[idx].tags;
      for (var t = 0; t < tags.length; t++) {
        scores[tags[t]] += 1;
      }
    }

    // Animacija izletanja
    var flyX = direction * FLY_DISTANCE;
    var rotate = direction * 30;
    card.style.transition = "transform 0.45s ease, opacity 0.45s ease";
    card.style.transform =
      "translate(" + flyX + "px, " + (dy || -40) + "px) rotate(" + rotate + "deg)";
    card.style.opacity = "0";

    // Pokaži odgovarajuću oznaku do kraja
    var stamp = card.querySelector(
      direction === 1 ? ".swipe-card__stamp--yes" : ".swipe-card__stamp--no"
    );
    if (stamp) stamp.style.opacity = "1";

    window.setTimeout(function () {
      if (card.parentNode) card.parentNode.removeChild(card);
      currentIndex++;
      isAnimating = false;
      dx = 0;
      dy = 0;

      // Osveži dubinu preostalih kartica
      refreshStack();

      if (currentIndex >= CARDS.length) {
        showResult();
      } else {
        setTopCard();
        updateProgress();
      }
    }, 450);
  }

  // Ponovo izračunaj stack pozicije nakon uklanjanja vrha.
  function refreshStack() {
    for (var i = currentIndex; i < CARDS.length; i++) {
      var el = cardEls[i];
      if (!el || !el.parentNode) continue;
      el.style.transition = "transform 0.3s ease";
      styleStack(el, i - currentIndex);
    }
  }

  /* ---------- 8. Progres ---------- */
  function updateProgress() {
    var done = currentIndex;                 // koliko je odgovoreno
    var total = CARDS.length;
    var shown = Math.min(done + 1, total);   // trenutna kartica (1-baz.)
    var pct = Math.round((done / total) * 100);

    if (progressLabel) progressLabel.textContent = shown + "/" + total;
    if (progressPct) progressPct.textContent = pct + "%";
    if (progressFill) progressFill.style.width = pct + "%";
  }

  /* ---------- 9. Rezultat ---------- */
  function showResult() {
    // Napuni progres do kraja
    if (progressLabel) progressLabel.textContent = CARDS.length + "/" + CARDS.length;
    if (progressPct) progressPct.textContent = "100%";
    if (progressFill) progressFill.style.width = "100%";

    // Rangiraj smerove po poenima (opadajuće).
    var ranked = Object.keys(scores).sort(function (a, b) {
      return scores[b] - scores[a];
    });

    // Ako su svi nule (sve prevučeno levo), ponudi neutralni predlog.
    var top = ranked[0];
    var alt1 = ranked[1];
    var alt2 = ranked[2];

    var main = PROGRAMS[top];

    // Popuni glavnu preporuku
    setText("resEmoji", main.emoji);
    setText("resName", main.name);
    setText("resFaculty", main.faculty);
    setText("resDesc", main.desc);

    var link = document.getElementById("resLink");
    if (link) link.href = main.url;

    var scoreEl = document.getElementById("resScore");
    if (scoreEl) {
      if (scores[top] === 0) {
        scoreEl.textContent = "Nisi prevukao/la nijednu karticu desno — pogledaj sve smerove i probaj ponovo.";
      } else {
        scoreEl.textContent = "Poklapanje: " + scores[top] + " od mogućih poena na ovom smeru.";
      }
    }

    // Alternative
    var altGrid = document.getElementById("altGrid");
    if (altGrid) {
      altGrid.innerHTML = "";
      [alt1, alt2].forEach(function (key) {
        var p = PROGRAMS[key];
        var card = document.createElement("article");
        card.className = "alt-card";
        card.innerHTML =
          "<h5>" + p.emoji + " " + p.name + "</h5>" +
          "<span>" + p.faculty + "</span>" +
          '<a href="' + p.url + '" target="_blank" rel="noopener">Istraži program ↗</a>';
        altGrid.appendChild(card);
      });
    }

    // Pripremi "Preporuči prijatelju"
    setupShare(main);

    // Prikaži rezultat, sakrij špil
    if (deckArea) deckArea.hidden = true;
    if (resultEl) {
      resultEl.hidden = false;
      resultEl.focus && resultEl.setAttribute("tabindex", "-1");
      resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ---------- 9b. Preporuči prijatelju ---------- */
  // Gradi gotovu poruku o preporučenom smeru i veže dugmad:
  // native deljenje (Web Share API) + WhatsApp + mejl + kopiranje.
  // Sve klijentski, bez servera.
  function setupShare(main) {
    // Link na zvaničnu stranicu smera + link na sam kviz (trenutni URL).
    var quizUrl = window.location.href.split("#")[0];
    var title = "Mislim da je ovo smer za tebe: " + main.name;
    var message =
      "Hej! 👋 Radio/la sam kviz za izbor fakulteta i mislim da bi tebi baš legao smer " +
      "„" + main.name + "” (" + main.faculty + ") na Univerzitetu Metropolitan " + main.emoji + ".\n\n" +
      "Pogledaj o čemu se radi: " + main.url + "\n\n" +
      "Možeš i sam/a da uradiš kviz ovde: " + quizUrl;

    var lead = document.getElementById("shareLead");
    if (lead) {
      lead.textContent =
        "Misliš da bi " + main.name + " " + main.emoji +
        " legao nekom drugaru? Pošalji mu gotovu poruku sa linkom.";
    }

    var status = document.getElementById("shareStatus");
    function flash(msg) {
      if (!status) return;
      status.textContent = msg;
      window.clearTimeout(flash._t);
      flash._t = window.setTimeout(function () { status.textContent = ""; }, 3500);
    }

    // WhatsApp
    var wa = document.getElementById("shareWa");
    if (wa) wa.href = "https://wa.me/?text=" + encodeURIComponent(message);

    // Mejl
    var mail = document.getElementById("shareMail");
    if (mail) {
      mail.href =
        "mailto:?subject=" + encodeURIComponent(title) +
        "&body=" + encodeURIComponent(message);
    }

    // Native deljenje (telefoni) — prikaži samo ako postoji
    var nativeBtn = document.getElementById("shareNative");
    if (nativeBtn && navigator.share) {
      nativeBtn.hidden = false;
      nativeBtn.onclick = function () {
        navigator.share({ title: title, text: message, url: main.url })
          .catch(function () { /* korisnik otkazao — ignoriši */ });
      };
    }

    // Kopiraj poruku u clipboard
    var copyBtn = document.getElementById("shareCopy");
    if (copyBtn) {
      copyBtn.onclick = function () {
        copyText(message)
          .then(function () { flash("Poruka kopirana! Nalepi je drugaru ✅"); })
          .catch(function () { flash("Ne mogu da kopiram — označi i kopiraj ručno."); });
      };
    }
  }

  // Kopiranje sa fallback-om za starije/nesigurne kontekste.
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject();
      } catch (e) { reject(e); }
    });
  }

  /* ---------- 10. Dugmad + tastatura ---------- */
  function programmaticSwipe(direction) {
    if (isAnimating || !topCard) return;
    // Mali "naboj" pre izletanja radi prirodnijeg osećaja
    dy = -30;
    flyOut(direction);
  }

  if (btnYes) {
    btnYes.addEventListener("click", function () { programmaticSwipe(1); });
  }
  if (btnNo) {
    btnNo.addEventListener("click", function () { programmaticSwipe(-1); });
  }

  document.addEventListener("keydown", function (e) {
    // Aktivno samo dok je špil vidljiv
    if (!deckArea || deckArea.hidden) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      programmaticSwipe(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      programmaticSwipe(-1);
    }
  });

  if (btnRetry) {
    btnRetry.addEventListener("click", function () {
      init();
      if (deckArea) deckArea.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ---------- 11. Start ---------- */
  init();
})();
