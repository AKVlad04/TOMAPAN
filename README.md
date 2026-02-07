# TOMAPAN

Joc web „TOMAPAN” (Țări, Orașe, Munți, Ape, Plante, Animale, Nume) pentru **2 jucători**, sincronizat **realtime** (merge bine și pe telefon). Poți crea o cameră, trimiți link-ul prietenului, pornești o rundă cu o literă aleasă random și completați categoriile; când cineva apasă **Finish**, runda se oprește pentru amândoi și se calculează scorul.

Sincronizarea realtime se face prin **Firebase Firestore**, deci proiectul poate fi hostat ca site static (ex: GitHub Pages) fără server.

## Ce conține

- [index.html](index.html) – UI
- [styles.css](styles.css) – stiluri mobile-friendly
- [app.js](app.js) – logică joc + lobby (creare/intrare cameră) + TOMAPAN + scor
- [firebase-config.js](firebase-config.js) – config Firebase (client)
- [firestore.rules](firestore.rules) – reguli Firestore (vezi nota de securitate)
- [data/answers.seed.json](data/answers.seed.json) – „baza de date” inițială pentru validarea răspunsurilor (o extinzi tu)

## Cum se joacă

1) Jucătorul 1 completează numele și apasă **Creează cameră**.
2) Apasă **Copiază link** și trimite link-ul către Jucătorul 2.
3) Jucătorul 2 deschide link-ul (intră automat în cameră).
4) Jucătorul 1 apasă **Start**.
5) Se alege o literă random (evită litere „awkward” ca Q/W/Z/X).
6) Completați câmpurile pentru fiecare categorie.
7) Când cineva apasă **Finish**, runda se oprește pentru amândoi și se afișează rezultatele + punctajul.

Notă: dacă intră o a treia persoană în cameră, devine spectator.

## Setup Firebase (necesar)

1) Intră în Firebase Console și creează un proiect.

2) Activează **Firestore Database**.
	- Pentru un MVP, poți porni în **Test mode** (atenție: e pentru demo, nu producție).

3) În Firebase Console → Project settings → Your apps → Web app
	- Creează/alege o aplicație Web și copiază config-ul.

4) Completează [firebase-config.js](firebase-config.js) cu valorile tale.

5) (Opțional, recomandat) Pune reguli mai stricte în [firestore.rules](firestore.rules) și activează autentificare (ex: Anonymous Auth). Vezi și secțiunea „Securitate”.

## Rulare locală

Orice server static e ok (fișierele folosesc Firebase CDN modules, nu ai build).

Opțiuni rapide:

- VS Code extension „Live Server” (recomandat)
- Python: `python -m http.server 5173`

Apoi deschizi `http://localhost:5173/`.

## Scor

Per categorie (Țări / Orașe / etc):

- corect și diferit: 10p fiecare
- corect dar la fel: 5p fiecare
- greșit: 0p
- unul a scris (corect), celălalt gol: 10p

Verificarea „corect” se face folosind [data/answers.seed.json](data/answers.seed.json) (pentru început lista poate fi mică; o completezi tu).

## Seed / baza de răspunsuri

Fișierul [data/answers.seed.json](data/answers.seed.json) este folosit ca dicționar local pentru validare.

- Dacă o valoare nu există în seed, e posibil să fie punctată ca greșită.
- Pentru o experiență mai bună, extinde listele din seed (țări, orașe, etc.).

## Deploy pe GitHub Pages

1) Push la repo pe GitHub.
2) Settings → Pages → Deploy from a branch → selectezi branch (ex: `main`) și folder `/(root)`.
3) Ai grijă ca [firebase-config.js](firebase-config.js) să fie completat înainte de deploy.

După deploy, link-ul de share va arăta ca `https://USER.github.io/REPO/?room=ABC123`.

## Observații importante (securitate)

- [firestore.rules](firestore.rules) este în prezent „open” (allow read/write: true) și este potrivit doar pentru demo / dezvoltare.
- Pentru producție: folosește autentificare (ex: Anonymous Auth) și reguli care permit acces doar la camera curentă și doar pentru jucătorii din acea cameră.