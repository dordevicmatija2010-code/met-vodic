# MET Vodič 🎓

Nezvanični vodič koji pomaže srednjoškolcima da izaberu pravi smer na **Univerzitetu Metropolitan**. Autorski takmičarski rad za događaj **„Make IT Day @ MET"**.

> ⚠️ Ovo **nije** zvanični vodič za upis. Za tačne i aktuelne informacije proveri [metropolitan.ac.rs](https://www.metropolitan.ac.rs/).

## ✨ Šta nudi

- **Swipe kviz** (Tinder-style) od 12 kartica — prevlači levo/desno i dobij preporuku smera + 2 alternative
- **Preporuči prijatelju** — pošalji gotovu poruku o smeru (Web Share / WhatsApp / mejl / kopiranje)
- Pregled **5 smerova** sa predmetima, veštinama i poslovima + tabela poređenja
- Jasni **koraci za upis** sa direktnim linkovima ka MET-u
- Spisak **izvora**

## 🛠️ Tehnologija

Čist statički sajt — **HTML + CSS + vanilla JavaScript**. Bez frameworka, bez build koraka, bez npm-a, bez eksternih JS biblioteka.

```
index.html  smerovi.html  kviz.html  upis.html  izvori.html
css/styles.css
js/quiz.js  js/main.js
```

## ▶️ Lokalni pregled

Dupli klik na `index.html`, ili lokalni server:

```bash
python -m http.server 5500
# http://localhost:5500
```

## 🚀 Deploy

- **Netlify** — prevuci folder na app.netlify.com (Deploy manually)
- **Vercel** — `npx vercel` (framework: Other, build prazno, output `.`)
- **GitHub Pages** — Settings → Pages → Source: `main` / root

## 🎨 Identitet

Autorski vizuelni identitet u duhu MET-a (tamno teget + zlatna). Ne koristi MET logo, fontove niti sadržaj — samo bojnu paletu i linkove ka zvaničnim stranicama.

---

© 2026 MET Vodič — autorski takmičarski rad.
