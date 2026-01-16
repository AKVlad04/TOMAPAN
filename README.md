# TOMAPAN

Un MVP de joc web (X și 0) care poate fi jucat de 2 persoane în același timp de pe telefoane diferite.

Cheia ca să meargă și când îl hostezi pe GitHub Pages: sincronizarea „realtime” se face prin **Firebase Firestore** (GitHub Pages nu poate rula server WebSocket).

## Ce conține

- [index.html](index.html) – UI
- [styles.css](styles.css) – stiluri mobile-friendly
- [app.js](app.js) – logică joc + lobby (creare/intrare cameră)
- [firebase-config.js](firebase-config.js) – aici pui config-ul proiectului tău Firebase

## Setup Firebase (necesar)

1) Intră în Firebase Console și creează un proiect.

2) Activează **Firestore Database**.
	- Pentru un MVP, poți porni în **Test mode** (atenție: e pentru demo, nu producție).

3) În Firebase Console → Project settings → Your apps → Web app
	- Creează/alege o aplicație Web și copiază config-ul.

4) Completează [firebase-config.js](firebase-config.js) cu valorile tale.

## Rulare locală

Orice server static e ok (fișierele folosesc Firebase CDN modules, nu ai build).

Opțiuni rapide:

- VS Code extension „Live Server” (recomandat)
- Python: `python -m http.server 5173`

Apoi deschizi `http://localhost:5173/`.

## Cum joci

1) Pe Telefonul 1: apasă „Creează cameră” și dă „Copiază link”.
2) Trimite link-ul către Telefonul 2.
3) Pe Telefonul 2: deschide link-ul și intră automat în cameră.

Notă: dacă intră a 3-a persoană, va fi spectator.

## Deploy pe GitHub Pages

1) Push la repo pe GitHub.
2) Settings → Pages → Deploy from a branch → selectezi branch (ex: `main`) și folder `/(root)`.
3) Ai grijă ca [firebase-config.js](firebase-config.js) să fie completat înainte de deploy.

După deploy, link-ul de share va arăta ca `https://USER.github.io/REPO/?room=ABC123`.

## Observații importante (securitate)

- Fișierul [firestore.rules](firestore.rules) e doar un exemplu minimal.
- Pentru producție: recomand autentificare (Anonymous Auth) + reguli stricte de validare a mutărilor.