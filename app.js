import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const els = {
  setupPanel: document.getElementById("setupPanel"),
  gamePanel: document.getElementById("gamePanel"),
  playerNameInput: document.getElementById("playerNameInput"),
  createRoomBtn: document.getElementById("createRoomBtn"),
  joinRoomBtn: document.getElementById("joinRoomBtn"),
  roomIdInput: document.getElementById("roomIdInput"),
  roomIdLabel: document.getElementById("roomIdLabel"),
  mySymbolLabel: document.getElementById("mySymbolLabel"),
  letterLabel: document.getElementById("letterLabel"),
  phaseLabel: document.getElementById("phaseLabel"),
  playersLabel: document.getElementById("playersLabel"),
  setupStatusText: document.getElementById("setupStatusText"),
  statusText: document.getElementById("statusText"),
  copyLinkBtn: document.getElementById("copyLinkBtn"),
  resetBtn: document.getElementById("resetBtn"),
  leaveBtn: document.getElementById("leaveBtn"),
  spectatorNote: document.getElementById("spectatorNote"),
  waitingPanel: document.getElementById("waitingPanel"),
  waitingSub: document.getElementById("waitingSub"),
  startBtn: document.getElementById("startBtn"),
  letterOverlay: document.getElementById("letterOverlay"),
  matrixBox: document.getElementById("matrixBox"),
  matrixStage: document.getElementById("matrixStage"),
  matrixHint: document.getElementById("matrixHint"),
  matrixLetter: document.getElementById("matrixLetter"),
  matrixActions: document.getElementById("matrixActions"),
  bugCanvas: document.getElementById("bugCanvas"),
  heartsLayer: document.getElementById("heartsLayer"),
  giftLayer: document.getElementById("giftLayer"),
  answersForm: document.getElementById("answersForm"),
  finishBtn: document.getElementById("finishBtn"),
  resultsPanel: document.getElementById("resultsPanel"),
  resultsMeta: document.getElementById("resultsMeta"),
  resultsTable: document.getElementById("resultsTable"),
  valentineNoBtn: document.getElementById("valentineNoBtn"),
  valentineAcceptBtn: document.getElementById("valentineAcceptBtn"),
};

const VALENTINE_GIF_URLS = [
  "https://media1.tenor.com/m/RiZpodi6JD0AAAAC/fast-cat-cat-excited.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXAwMG1ubGVvcms5OGoweXFtYTVndjVmcDUxNDRhbmQ1NXl3Mmt4ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ujTVMASREzuRbH6zy5/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYjZ4NWZ3cGtjbGZ1am9icTBpcW50YTNuN3BpaGlrYjRibm1xMmMzNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2UwId6UJEsvLYd2UY9/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTc2dGFxaTgwcDY5eHRvZWJjeG9vN25kM2tubTh6cGRreDEwNW4ydiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/k1Psl92gw7YPSPYFKm/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGN5ZWh0N20yeDNjem8zaWZhcGx4ZXlmOWJ2eWZkOXdlMXEzYTBqNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/04DMYESomjb6BCBNB8/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExanQ3aDF4aXpocmo0MG1ndnJ3azlubnppcjB4bWxkZTAybzY4Y2o1MyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Ch0JvNvkk7PH2/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNnc1eW5yaml0c21uNzVrc2Z3aXhlZjF0cDB4a2Rpemo3NnBhcTRqYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/t3sZxY5zS5B0z5zMIz/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExanpoYzJhNnp2d2thOG54ZGRyY3JnMDNzbnk1ZXpqNjZ3N3JwZGlxdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hryis7A55UXZNCUTNA/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExemozeXEwcXRtaWlxajE3bnh2dnRkNmNlbWR1NWM3MXBuNmU3YTdpdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yLieULk2FUW6EvkWjA/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ211aHc0ZXA5eW91cDBwaW5ycnR5dXJ5bWI2aGx2MWl1YmIwOXA4bSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT5LMHxhOfscxPfIfm/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTZjZG5kejB3NmhwYTZzaXppNGtub20zaTZtZmIycGFjeW5xamIybyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/rjkJD1v80CjYs/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzRnc3JhbDgyNzFzM3FueXRkd2E2bmVmNTQycmN5NDN0OXlyeWJtMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/F1P5wA3Ai0jFAAWQFA/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWU3OTBpN3ljaTNzd3ZxMG5sZDMxNmtva282emhkN2l5amxseXd5dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/W6Lwg2xvTr6tJpuSTd/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGpncWt5cXFtZGg5NHYwZm5sbnRncjF5bHkyZTJqaWhzYzIwcmhzZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/13Iu9mjLpXF0ek/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTBkOWZoYnViNHJvczhuemJjb2Fqd2UzN3lnanhwczRmcGFoa3V0YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ddHhhUBn25cuQ/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNG81cW9iN3ZybTQ5dTI3OG4zdHhma2s2M2k4bzc2dGdkeTRxanUzeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QlvPwCTw59B2E/giphy.gif",
];

const VALENTINE_EVENT = {
  id: "valentine_2026",
  threshold: 150,
  messageLines: ["WILL YOU BE MY", "VALENTINE?"]
};

const state = {
  uid: getOrCreateUid(),
  playerName: "",
  roomId: null,
  myRole: null, // 'P1' | 'P2' | 'S'
  unsubRoom: null,
  room: null,
  answerDb: null,
  answerSets: null,
  localDraft: createEmptyAnswers(),
  saveTimers: {},
  lastRoundSeen: null,
  lastStartKey: "",
  startAdvanceTimer: null,
  lastValentinePlayKey: "",
  valentineNoClicks: 0,
  bugLetterTimers: [],
  heartsRaf: 0,
  heartsLastTs: 0,
  hearts: [],
  heartsBoost: 1,
  ambientHeartsTimer: 0,
  ambientHeartsEl: null,
  valentineModeOn: false,
  cinematicTimers: [],
  giftTimers: [],
};

boot().catch(showError);

async function boot() {
  setStatus("Încarc baza de răspunsuri...");
  const { answerDb, answerSets } = await loadAnswerDb();
  state.answerDb = answerDb;
  state.answerSets = answerSets;

  hydratePlayerName();

  wireUI();
  wireFormAutosave();

  const roomFromUrl = getRoomIdFromUrl();
  if (roomFromUrl) {
    els.roomIdInput.value = roomFromUrl;
    await joinRoom(roomFromUrl);
  } else {
    setStatus("Pregătit.");
  }
}

function wireUI() {
  els.createRoomBtn.addEventListener("click", async () => {
    try {
      requirePlayerName();
      const roomId = await createRoom();
      await joinRoom(roomId);
    } catch (e) {
      showError(e);
    }
  });

  els.joinRoomBtn.addEventListener("click", async () => {
    try {
      requirePlayerName();
      const roomId = normalizeRoomId(els.roomIdInput.value);
      if (!roomId) return setStatus("Introdu un cod de cameră.");
      await joinRoom(roomId);
    } catch (e) {
      showError(e);
    }
  });

  els.copyLinkBtn.addEventListener("click", async () => {
    if (!state.roomId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("room", state.roomId);
    try {
      await navigator.clipboard.writeText(url.toString());
      setStatus("Link copiat.");
    } catch {
      setStatus("Nu pot copia automat. Copiază manual link-ul din adresă.");
    }
  });

  els.resetBtn.addEventListener("click", async () => {
    if (!state.roomId) return;
    if (state.myRole !== "P1") {
      return setStatus("Doar Jucătorul 1 poate da reset.");
    }
    try {
      await resetRoom(state.roomId);
    } catch (e) {
      showError(e);
    }
  });

  els.startBtn.addEventListener("click", async () => {
    if (!state.roomId) return;
    if (state.myRole !== "P1") return setStatus("Doar Jucătorul 1 poate da Start.");
    try {
      await startRound(state.roomId);
    } catch (e) {
      showError(e);
    }
  });

  els.finishBtn.addEventListener("click", async () => {
    if (!state.roomId) return;
    if (state.myRole === "S") return;

    try {
      await finishRound(state.roomId);
    } catch (e) {
      showError(e);
    }
  });

  els.leaveBtn.addEventListener("click", () => {
    leaveRoom().catch(showError);
  });

  els.valentineNoBtn?.addEventListener("click", () => {
    onValentineNo();
  });

  els.valentineAcceptBtn?.addEventListener("click", async () => {
    try {
      await onValentineAccept();
    } catch (e) {
      showError(e);
    }
  });

  window.addEventListener("beforeunload", () => {
    if (state.unsubRoom) state.unsubRoom();
  });
}

function showToast(message, { durationMs = 1500 } = {}) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  window.setTimeout(() => el.classList.remove("show"), Math.max(400, durationMs));
}

function ensureThemeModal() {
  let backdrop = document.getElementById("themeModal");
  if (backdrop && document.body.contains(backdrop)) return backdrop;

  backdrop = document.createElement("div");
  backdrop.id = "themeModal";
  backdrop.className = "modalBackdrop";
  backdrop.setAttribute("aria-hidden", "true");

  const card = document.createElement("div");
  card.className = "modalCard";

  const title = document.createElement("h3");
  title.className = "modalTitle";
  title.textContent = "Tema nouă deblocată";

  const sub = document.createElement("div");
  sub.className = "modalSub";
  sub.textContent = "Acum ai accent roz + inimioare pe fundal.";

  card.appendChild(title);
  card.appendChild(sub);
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
  return backdrop;
}

async function showThemeUnlockedModal({ visibleMs = 2400 } = {}) {
  const el = ensureThemeModal();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  await new Promise((r) => window.setTimeout(r, Math.max(900, visibleMs)));
  el.classList.remove("show");
  el.setAttribute("aria-hidden", "true");
  await new Promise((r) => window.setTimeout(r, 280));
}

function initBoardUI() {
  // kept for backwards compatibility; no-op in TOMAPAN
}

async function createRoom() {
  const roomId = generateRoomId();
  const ref = doc(db, "rooms", roomId);
  const letter = randomGameLetter();
  const categories = getCategories();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error("Coliziune cod cameră. Reîncearcă.");

    tx.set(ref, {
      createdAt: serverTimestamp(),
      status: "lobby",
      round: 1,
      letter,
      categories,
      players: {
        P1: state.uid,
        P2: "",
      },
      names: {
        [state.uid]: state.playerName,
      },
      matchTotals: {
        [state.uid]: 0,
      },
      drafts: {},
      left: {},
      startedAt: null,
      startedAtMs: null,
      finishedAt: null,
      finishedBy: "",
      final: null,
      lastUpdateAt: serverTimestamp(),
    });
  });

  return roomId;
}

async function joinRoom(roomIdRaw) {
  const roomId = normalizeRoomId(roomIdRaw);
  if (!roomId) throw new Error("Cod cameră invalid.");

  const ref = doc(db, "rooms", roomId);

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      throw new Error("Camera nu există.");
    }

    const room = snap.data();
    const players = room.players || { P1: "", P2: "" };
    const names = room.names || {};
    const left = room.left || {};
    const matchTotals = room.matchTotals || {};

    let myRole = "S";

    if (!players.P1) {
      players.P1 = state.uid;
      myRole = "P1";
      tx.update(ref, { players });
    } else if (players.P1 === state.uid) {
      myRole = "P1";
    } else if (!players.P2) {
      players.P2 = state.uid;
      myRole = "P2";
      tx.update(ref, { players });
    } else if (players.P2 === state.uid) {
      myRole = "P2";
    } else {
      myRole = "S";
    }

    // Always refresh my display name and mark me as not-left.
    names[state.uid] = state.playerName;
    left[state.uid] = false;
    if (matchTotals[state.uid] == null) matchTotals[state.uid] = 0;
    tx.update(ref, { names, left, matchTotals });

    return { myRole };
  });

  state.roomId = roomId;
  state.myRole = result.myRole;
  state.lastRoundSeen = null;
  state.lastStartKey = "";
  if (state.startAdvanceTimer) {
    clearTimeout(state.startAdvanceTimer);
    state.startAdvanceTimer = null;
  }

  showGamePanel();
  // Safety: never show form/overlay right when entering.
  els.answersForm?.classList.add("hidden");
  els.letterOverlay?.classList.add("hidden");
  els.roomIdLabel.textContent = roomId;
  els.mySymbolLabel.textContent = "—";
  els.spectatorNote.style.display = state.myRole === "S" ? "block" : "none";

  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  window.history.replaceState({}, "", url);

  if (state.unsubRoom) state.unsubRoom();
  state.unsubRoom = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      setStatus("Camera a fost ștearsă.");
      return;
    }
    state.room = snap.data();
    renderRoom();
  });

  setStatus("Conectat.");
}

function renderRoom() {
  const room = state.room;
  if (!room) return;

  const players = room.players || { P1: "", P2: "" };
  const names = room.names || {};
  const round = Number.isFinite(room.round) ? room.round : 1;
  const bothPlayers = Boolean(players.P1) && Boolean(players.P2);
  const status = room.status || "lobby";

  if (state.lastRoundSeen === null) state.lastRoundSeen = round;
  if (round !== state.lastRoundSeen) {
    state.lastRoundSeen = round;
    clearLocalAnswers();
    state.lastStartKey = "";
    els.letterOverlay?.classList.add("hidden");
    if (state.startAdvanceTimer) {
      clearTimeout(state.startAdvanceTimer);
      state.startAdvanceTimer = null;
    }
  }

  const isFinished = status === "finished";
  const isPlaying = status === "playing";
  const isStarting = status === "starting";

  // Hard rule: overlay is ONLY visible while the room is starting.
  if (!isStarting) {
    els.letterOverlay?.classList.add("hidden");
  }

  els.letterLabel.textContent = isPlaying || isFinished ? room.letter || "-" : "-";
  els.phaseLabel.textContent = isFinished ? "Terminat" : isPlaying ? "În joc" : bothPlayers ? "Pregătit" : "Aștept";

  const p1Name = players.P1 ? (names[players.P1] || "Jucător 1") : "—";
  const p2Name = players.P2 ? (names[players.P2] || "Jucător 2") : "—";
  // Header field now displays players
  els.mySymbolLabel.textContent = `${p1Name} / ${p2Name}`;

  // Second row shows cumulative score (punctaj parcurs)
  const matchTotals = room.matchTotals || {};
  const p1Match = players.P1 ? (matchTotals[players.P1] ?? 0) : 0;
  const p2Match = players.P2 ? (matchTotals[players.P2] ?? 0) : 0;
  els.playersLabel.textContent = `${p1Match} – ${p2Match}`;

  // UX rules:
  // - Don't show inputs until BOTH connected AND creator pressed Start (status=playing)
  // - After Finish, hide inputs and only show results
  const showForm = bothPlayers && isPlaying && !isFinished;
  els.answersForm.classList.toggle("hidden", !showForm);

  const canEdit = showForm && state.myRole !== "S";
  setFormEnabled(canEdit);

  // Waiting panel visibility
  const showWaiting = !isFinished && (!bothPlayers || !isPlaying);
  els.waitingPanel.classList.toggle("hidden", !showWaiting);

  // Start button only when both connected, not started, and I'm P1
  const canStart = bothPlayers && !isPlaying && !isStarting && !isFinished && state.myRole === "P1";
  els.startBtn.classList.toggle("hidden", !canStart);

  if (showWaiting) {
    if (!bothPlayers) {
      els.waitingSub.textContent = "Trimite link-ul prietenului. Câmpurile apar după Start.";
    } else if (isStarting) {
      els.waitingSub.textContent = "Pornim runda...";
    } else {
      els.waitingSub.textContent = "Ambii jucători sunt conectați. Jucătorul 1 apasă Start.";
    }
  }

  // Pull my latest draft from room (so reloads keep text) only during playing.
  if (showForm) {
    const drafts = room.drafts || {};
    const myDraft = drafts[state.uid] || {};
    syncFormFromDraft(myDraft);
  }

  // Matrix start animation
  const event = room.event || {};
  const bugActive = bothPlayers && isStarting && event?.id === VALENTINE_EVENT.id && Boolean(event?.triggered) && !Boolean(event?.completed);

  if (bothPlayers && isStarting && !isFinished && !bugActive) {
    const startKey = String(room.startedAtMs || room.startedAt?.seconds || room.startedAt || "") + ":" + String(round);
    if (startKey && state.lastStartKey !== startKey) {
      state.lastStartKey = startKey;
      playMatrixLetter(room.letter || "A");
      scheduleAdvanceToPlaying(room);
    }
    // If starting has been going on for a while, advance to playing (any client can do this).
    maybeAdvanceToPlaying(room).catch(() => {});
  }

  // Special Valentine "bug" (runs during starting and blocks the round)
  if (bugActive) {
    if (String(event.stage || "bug") === "gifts") {
      showValentineGifts();
    }
    const playKey = String(event.triggeredAtMs || "");
    if (playKey && state.lastValentinePlayKey !== playKey) {
      state.lastValentinePlayKey = playKey;
      state.valentineNoClicks = 0;
      window.setTimeout(() => {
        if (String((state.room?.event || {}).stage || "bug") !== "gifts") {
          playValentineBug(room.letter || "A").catch(() => {});
        }
      }, 900);
    }
  }

  // Persistent Valentine visual mode for the whole match.
  const modeActive = event?.id === VALENTINE_EVENT.id && Boolean(event?.mode);
  setValentineMode(modeActive);

  if (!bothPlayers) {
    setStatus("Aștept jucătorul 2... Trimite link-ul.");
  } else if (isFinished) {
    setStatus("Runda s-a terminat.");
  } else if (isPlaying) {
    setStatus("Runda a început. Scrie răspunsurile.");
  } else {
    setStatus("Așteaptă Start de la Jucătorul 1.");
  }

  renderResultsIfFinished(room);
}

function showValentineGifts() {
  const overlay = els.letterOverlay;
  const box = els.matrixBox;
  const giftLayer = els.giftLayer;
  if (!overlay || !box || !giftLayer) return;

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  box.classList.add("bug");
  startHeartsScreensaver();

  if (els.bugCanvas) els.bugCanvas.innerHTML = "";
  if (els.matrixHint) els.matrixHint.textContent = "";
  if (els.matrixLetter) {
    els.matrixLetter.style.display = "none";
    els.matrixLetter.textContent = "";
  }

  giftLayer.classList.remove("hidden");
  giftLayer.setAttribute("aria-hidden", "false");

  // Rebuild each time so the sequential reveal is immediate.
  for (const t of state.giftTimers) clearTimeout(t);
  state.giftTimers = [];
  giftLayer.dataset.ready = "";
  giftLayer.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "giftStack";
  giftLayer.appendChild(wrap);

  const img = document.createElement("img");
  img.className = "giftImg";
  img.alt = "gif";
  img.loading = "eager";
  img.decoding = "async";
  img.referrerPolicy = "no-referrer";
  wrap.appendChild(img);

  // Slideshow: show one GIF at a time, centered.
  const urls = Array.isArray(VALENTINE_GIF_URLS) ? VALENTINE_GIF_URLS : [];
  const perGifMs = 1400;
  const fadeMs = 160;
  let idx = 0;

  const showOne = () => {
    if (overlay.classList.contains("hidden")) return;
    const stage = String((state.room?.event || {}).stage || "bug");
    if (stage !== "gifts") return;
    if (!urls.length) return;
    const url = urls[idx] || "";
    img.classList.remove("show");
    const t1 = window.setTimeout(() => {
      img.src = url;
      // Ensure we re-trigger the transition.
      void img.offsetWidth;
      img.classList.add("show");
    }, fadeMs);
    state.giftTimers.push(t1);

    idx = (idx + 1) % urls.length;
    const t2 = window.setTimeout(showOne, perGifMs);
    state.giftTimers.push(t2);
  };

  const t0 = window.setTimeout(showOne, 0);
  state.giftTimers.push(t0);

  els.valentineNoBtn?.classList.add("hidden");
  if (els.valentineAcceptBtn) {
    // Second click should feel like "exit" from the Valentine flow.
    els.valentineAcceptBtn.textContent = "Gata";
    els.valentineAcceptBtn.classList.remove("hidden");
  }
}

async function setValentineStage(stage) {
  if (!state.roomId) return;
  const ref = doc(db, "rooms", state.roomId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data();
    const event = room.event || {};
    if (event?.id !== VALENTINE_EVENT.id || !event?.triggered) return;
    if (Boolean(event?.completed)) return;
    tx.update(ref, {
      event: {
        ...event,
        stage,
        stageAt: serverTimestamp(),
        stageAtMs: Date.now(),
      },
      lastUpdateAt: serverTimestamp(),
    });
  });
}

async function advanceToPlayingNow() {
  if (!state.roomId) return;
  const ref = doc(db, "rooms", state.roomId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const cur = snap.data();
    if ((cur.status || "") !== "starting") return;
    const event = cur.event || {};
    if (event?.id === VALENTINE_EVENT.id && Boolean(event?.triggered) && !Boolean(event?.completed)) return;
    tx.update(ref, {
      status: "playing",
      lastUpdateAt: serverTimestamp(),
    });
  });
}

async function onValentineAccept() {
  const stage = String((state.room?.event || {}).stage || "bug");
  if (stage === "gifts") {
    if (els.valentineAcceptBtn) els.valentineAcceptBtn.disabled = true;
    await showThemeUnlockedModal({ visibleMs: 2500 });
    await completeValentineEvent({ enableMode: true, returnToLobby: true });
    setValentineMode(true);
    hideValentineBug();
    if (els.valentineAcceptBtn) els.valentineAcceptBtn.disabled = false;
    return;
  }

  // First "Da": show GIFs immediately.
  showValentineGifts();
  await setValentineStage("gifts");
}

async function startRound(roomId) {
  const ref = doc(db, "rooms", roomId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Camera nu există.");
    const room = snap.data();
    const players = room.players || { P1: "", P2: "" };
    const bothPlayers = Boolean(players.P1) && Boolean(players.P2);
    if (!bothPlayers) throw new Error("Așteaptă să intre și al doilea jucător.");
    if (players.P1 !== state.uid) throw new Error("Doar Jucătorul 1 poate da Start.");

    const status = room.status || "lobby";
    if (status === "playing" || status === "finished") return;

    const event = room.event || {};
    const shouldTriggerBug = event?.id === VALENTINE_EVENT.id && Boolean(event?.bugReady) && !Boolean(event?.triggered);

    const startedAtMs = Date.now();

    tx.update(ref, {
      status: "starting",
      startedAt: serverTimestamp(),
      startedAtMs,
      ...(shouldTriggerBug
        ? {
            event: {
              ...event,
              id: VALENTINE_EVENT.id,
              unlocked: true,
              bugReady: false,
              triggered: true,
              triggeredAt: serverTimestamp(),
              triggeredAtMs: startedAtMs,
              triggeredBy: state.uid,
              completed: false,
              stage: "bug",
            },
          }
        : {}),
      lastUpdateAt: serverTimestamp(),
    });
  });
}

function scheduleAdvanceToPlaying(room) {
  // Ensure we get a second chance to advance, even if no new snapshots arrive.
  if (state.startAdvanceTimer) {
    clearTimeout(state.startAdvanceTimer);
    state.startAdvanceTimer = null;
  }

  const durMs = 2200;
  const startedMs = Number(room.startedAtMs);
  const nowMs = Date.now();
  const waitMs = Number.isFinite(startedMs) && startedMs > 0 ? Math.max(0, durMs - (nowMs - startedMs)) : durMs;

  state.startAdvanceTimer = setTimeout(() => {
    maybeAdvanceToPlaying(state.room || room).catch(() => {});
  }, waitMs + 80);
}

async function maybeAdvanceToPlaying(room) {
  if (!state.roomId) return;
  if ((room.status || "") !== "starting") return;

  const event = room.event || {};
  if (event?.id === VALENTINE_EVENT.id && Boolean(event?.triggered) && !Boolean(event?.completed)) {
    return;
  }

  let startedMs = Number(room.startedAtMs);
  if (!Number.isFinite(startedMs) || startedMs <= 0) {
    if (!room.startedAt || typeof room.startedAt.toDate !== "function") return;
    startedMs = room.startedAt.toDate().getTime();
  }

  const nowMs = Date.now();
  // duration of overlay effect
  const durMs = 2200;
  if (nowMs - startedMs < durMs) return;

  const ref = doc(db, "rooms", state.roomId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const cur = snap.data();
    if ((cur.status || "") !== "starting") return;
    tx.update(ref, {
      status: "playing",
      lastUpdateAt: serverTimestamp(),
    });
  });
}

function playMatrixLetter(finalLetter) {
  const overlay = els.letterOverlay;
  const letterEl = els.matrixLetter;
  if (!overlay || !letterEl) return;

  const allowed = getAllowedLetters();
  const endAt = performance.now() + 1800;
  overlay.classList.remove("hidden");

  let raf = 0;
  const tick = () => {
    const now = performance.now();
    if (now >= endAt) {
      letterEl.textContent = String(finalLetter || "A").toUpperCase();
      letterEl.classList.remove("pulse");
      // force reflow
      void letterEl.offsetWidth;
      letterEl.classList.add("pulse");
      window.setTimeout(() => {
        overlay.classList.add("hidden");
      }, 450);
      cancelAnimationFrame(raf);
      return;
    }
    letterEl.textContent = allowed[Math.floor(Math.random() * allowed.length)];
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

function hideValentineBug() {
  els.valentineNoBtn?.classList.add("hidden");
  els.valentineAcceptBtn?.classList.add("hidden");
  if (els.valentineAcceptBtn) els.valentineAcceptBtn.textContent = "Da";
  if (els.bugCanvas) els.bugCanvas.innerHTML = "";
  if (els.giftLayer) {
    els.giftLayer.classList.add("hidden");
    els.giftLayer.setAttribute("aria-hidden", "true");
    els.giftLayer.dataset.ready = "";
    els.giftLayer.innerHTML = "";
  }
  stopHeartsScreensaver();
  if (els.matrixBox) {
    els.matrixBox.classList.remove("bug");
    els.matrixBox.classList.remove("shake");
    els.matrixBox.classList.remove("cinematic");
    els.matrixBox.style.removeProperty("--bugScale");
  }
  for (const t of state.bugLetterTimers) clearTimeout(t);
  state.bugLetterTimers = [];
  for (const t of state.giftTimers) clearTimeout(t);
  state.giftTimers = [];
  if (els.letterOverlay) {
    els.letterOverlay.classList.add("hidden");
    els.letterOverlay.setAttribute("aria-hidden", "true");
  }
  if (els.matrixLetter) {
    els.matrixLetter.classList.remove("glitch");
    els.matrixLetter.classList.remove("vanish");
    els.matrixLetter.style.removeProperty("display");
    els.matrixLetter.style.removeProperty("opacity");
    els.matrixLetter.textContent = "";
  }
  resetNoButtonPosition();
  if (els.valentineNoBtn) {
    els.valentineNoBtn.style.removeProperty("font-size");
    els.valentineNoBtn.style.removeProperty("padding");
  }
  if (els.valentineAcceptBtn) {
    els.valentineAcceptBtn.style.removeProperty("font-size");
    els.valentineAcceptBtn.style.removeProperty("padding");
  }
  applyValentineButtonScaling(0);
}

function setValentineMode(on) {
  const next = Boolean(on);
  if (state.valentineModeOn === next) return;
  state.valentineModeOn = next;
  document.body.classList.toggle("valentineMode", next);
  if (next) startAmbientHeartRain();
  else stopAmbientHeartRain();
}

function ensureAmbientHeartsEl() {
  if (state.ambientHeartsEl && document.body.contains(state.ambientHeartsEl)) return state.ambientHeartsEl;
  const el = document.createElement("div");
  el.className = "ambientHearts";
  document.body.prepend(el);
  state.ambientHeartsEl = el;
  return el;
}

function stopAmbientHeartRain() {
  if (state.ambientHeartsTimer) window.clearInterval(state.ambientHeartsTimer);
  state.ambientHeartsTimer = 0;
  if (state.ambientHeartsEl) state.ambientHeartsEl.innerHTML = "";
}

function startAmbientHeartRain() {
  stopAmbientHeartRain();
  const el = ensureAmbientHeartsEl();
  const rand = (min, max) => min + Math.random() * (max - min);
  const palette = [
    { c: "rgba(251,113,133,0.32)", glow: "rgba(251,113,133,0.22)" },
    { c: "rgba(244,114,182,0.28)", glow: "rgba(244,114,182,0.18)" },
    { c: "rgba(253,186,116,0.24)", glow: "rgba(253,186,116,0.14)" },
    { c: "rgba(250,204,21,0.20)", glow: "rgba(250,204,21,0.12)" },
    { c: "rgba(125,211,252,0.20)", glow: "rgba(125,211,252,0.12)" },
  ];

  const spawn = () => {
    if (!state.valentineModeOn) return;
    const h = document.createElement("div");
    h.className = "ambientHeart";
    h.textContent = "♥";

    const p = palette[Math.floor(Math.random() * palette.length)];
    const s = Math.round(rand(10, 22));
    const a = rand(0.18, 0.52);
    const d = rand(5.2, 10.0);
    const x = rand(0, 100);
    const dx = rand(-80, 80);

    h.style.setProperty("--c", p.c);
    h.style.setProperty("--glow", p.glow);
    h.style.setProperty("--s", `${s}px`);
    h.style.setProperty("--a", String(a));
    h.style.setProperty("--d", `${d.toFixed(2)}s`);
    h.style.setProperty("--x", `${x.toFixed(2)}%`);
    h.style.setProperty("--dx", `${dx.toFixed(1)}px`);

    el.appendChild(h);
    window.setTimeout(() => h.remove(), Math.ceil(d * 1000) + 250);
  };

  // Density tuned to be noticeable but not too heavy.
  state.ambientHeartsTimer = window.setInterval(() => {
    spawn();
    if (Math.random() < 0.45) spawn();
  }, 180);
}

function resetNoButtonPosition() {
  const noBtn = els.valentineNoBtn;
  const yesBtn = els.valentineAcceptBtn;
  const actions = els.matrixActions;
  if (!noBtn || !actions) return;

  if (actions.contains(noBtn)) {
    // keep order Nu then Da
    if (yesBtn && actions.contains(yesBtn) && noBtn.nextSibling !== yesBtn) {
      actions.insertBefore(noBtn, yesBtn);
    }
  } else {
    if (yesBtn && actions.contains(yesBtn)) actions.insertBefore(noBtn, yesBtn);
    else actions.prepend(noBtn);
  }

}

function stopHeartsScreensaver() {
  if (state.heartsRaf) cancelAnimationFrame(state.heartsRaf);
  state.heartsRaf = 0;
  state.heartsLastTs = 0;
  state.hearts = [];
  state.heartsBoost = 1;
  if (els.heartsLayer) els.heartsLayer.innerHTML = "";
}

function startHeartsScreensaver() {
  const layer = els.heartsLayer;
  const box = els.matrixBox;
  const overlay = els.letterOverlay;
  if (!layer || !box || !overlay) return;

  stopHeartsScreensaver();

  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const palette = [
    { c: "rgba(251,113,133,0.18)", glow: "rgba(251,113,133,0.14)" },
    { c: "rgba(244,114,182,0.16)", glow: "rgba(244,114,182,0.12)" },
    { c: "rgba(253,186,116,0.14)", glow: "rgba(253,186,116,0.10)" },
    { c: "rgba(250,204,21,0.12)", glow: "rgba(250,204,21,0.10)" },
    { c: "rgba(94,234,212,0.12)", glow: "rgba(94,234,212,0.10)" },
    { c: "rgba(125,211,252,0.12)", glow: "rgba(125,211,252,0.10)" },
  ];

  // Use the matrix box for initial sizing. The layer can report 0/1px on the first frame.
  // Also compute a *target* (expanded) box size so spawns cover the final area even while it grows.
  const boxRect = box.getBoundingClientRect();
  const stageRect = els.matrixStage?.getBoundingClientRect?.() || { height: 0 };
  const actionsRect = els.matrixActions?.getBoundingClientRect?.() || { height: 0 };

  const wNow = Math.max(1, boxRect.width);
  const hNow = Math.max(1, boxRect.height);

  // If the overlay just became visible, layout may not be ready yet.
  if (wNow < 80 || hNow < 80) {
    let tries = 0;
    const retry = () => {
      if (overlay.classList.contains("hidden")) return;
      const r = box.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      if (w >= 80 && h >= 80) {
        startHeartsScreensaver();
        return;
      }
      tries += 1;
      if (tries < 8) requestAnimationFrame(retry);
    };
    requestAnimationFrame(retry);
    return;
  }

  const targetW = Math.min(760, Math.max(240, window.innerWidth - 44));
  const targetStageH = Math.min(300, Math.max(140, window.innerHeight * 0.52));
  const otherH = Math.max(0, hNow - Math.max(0, stageRect.height) - Math.max(0, actionsRect.height));
  const targetH = otherH + targetStageH + Math.max(0, actionsRect.height);

  const spawnW = Math.max(wNow, targetW);
  const spawnH = Math.max(hNow, targetH);

  const getBounds = () => {
    const r = box.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    return {
      w: Math.max(w, targetW),
      h: Math.max(h, targetH),
    };
  };

  const baseCount = Math.round(56 + Math.min(44, spawnW / 32));
  const count = Math.min(120, Math.max(30, baseCount));
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "heart";
    const size = Math.round(rand(12, 26));
    const { c, glow } = pick(palette);
    el.style.setProperty("--s", `${size}px`);
    el.style.setProperty("--c", c);
    el.style.setProperty("--glow", glow);
    el.style.setProperty("--a", String(rand(0.55, 0.92)));
    layer.appendChild(el);

    // Slower baseline speeds, but with chaotic wobble applied each frame.
    const speed = rand(22, 64); // px/s
    const angle = rand(0, Math.PI * 2);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    // Spawn random across the whole *target* box (so it's not concentrated early).
    const spawnPad = 6;
    const x = rand(spawnPad, Math.max(spawnPad, spawnW - size - spawnPad));
    const y = rand(spawnPad, Math.max(spawnPad, spawnH - size - spawnPad));

    const rot = rand(-18, 18);
    const vr = rand(-120, 120); // deg/s
    el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${45 + rot}deg)`;
    state.hearts.push({ el, x, y, vx, vy, size, rot, vr });
  }

  state.heartsLastTs = 0;
  const pad = 2;

  const tick = (ts) => {
    if (overlay.classList.contains("hidden")) {
      stopHeartsScreensaver();
      return;
    }

    if (!state.heartsLastTs) state.heartsLastTs = ts - 16.7;

    const dt = Math.min(0.034, Math.max(0.010, (ts - (state.heartsLastTs || ts)) / 1000));
    state.heartsLastTs = ts;

    const { w, h } = getBounds();

    for (const heart of state.hearts) {
      // Chaotic wobble: small random acceleration that changes every frame.
      const boost = Math.max(0.6, Number(state.heartsBoost) || 1);
      const wobble = 36 * boost;
      heart.vx += rand(-wobble, wobble) * dt;
      heart.vy += rand(-wobble, wobble) * dt;

      // Keep speeds in a pleasant range.
      const sp = Math.hypot(heart.vx, heart.vy);
      const minSp = 18;
      const maxSp = 84;
      if (sp > 0.0001) {
        const target = sp < minSp ? minSp : sp > maxSp ? maxSp : sp;
        if (target !== sp) {
          const k = target / sp;
          heart.vx *= k;
          heart.vy *= k;
        }
      }

      heart.x += heart.vx * dt * boost;
      heart.y += heart.vy * dt * boost;

      heart.rot = (Number(heart.rot) || 0) + (Number(heart.vr) || 0) * dt;

      const maxX = Math.max(pad, w - heart.size - pad);
      const maxY = Math.max(pad, h - heart.size - pad);

      if (heart.x <= pad) {
        heart.x = pad;
        heart.vx = Math.abs(heart.vx);
      } else if (heart.x >= maxX) {
        heart.x = maxX;
        heart.vx = -Math.abs(heart.vx);
      }

      if (heart.y <= pad) {
        heart.y = pad;
        heart.vy = Math.abs(heart.vy);
      } else if (heart.y >= maxY) {
        heart.y = maxY;
        heart.vy = -Math.abs(heart.vy);
      }

      heart.el.style.transform = `translate3d(${heart.x}px, ${heart.y}px, 0) rotate(${45 + (Number(heart.rot) || 0)}deg)`;
    }

    state.heartsRaf = requestAnimationFrame(tick);
  };

  state.heartsRaf = requestAnimationFrame(tick);
}

function applyValentineButtonScaling(noClicks) {
  const noBtn = els.valentineNoBtn;
  const acceptBtn = els.valentineAcceptBtn;
  if (!noBtn || !acceptBtn) return;

  const n = Math.max(0, Number(noClicks) || 0);
  // Avoid transforms (button:active uses transform). Adjust size via font/padding so layout reflows and buttons never overlap.
  const noFont = Math.max(8, 16 - n * 0.95);
  const acceptFont = Math.min(44, 16 + n * 2.65);
  const noPadY = Math.max(6, 12 - n * 0.65);
  const acceptPadY = Math.min(34, 12 + n * 1.45);

  noBtn.style.fontSize = `${noFont}px`;
  acceptBtn.style.fontSize = `${acceptFont}px`;
  noBtn.style.padding = `${noPadY}px 14px`;
  acceptBtn.style.padding = `${acceptPadY}px 16px`;
}

function onValentineNo() {
  state.valentineNoClicks = (Number(state.valentineNoClicks) || 0) + 1;
  applyValentineButtonScaling(state.valentineNoClicks);

  const box = els.matrixBox;
  if (box) {
    const base = 1.22;
    const extra = Math.min(0.05, (Number(state.valentineNoClicks) || 0) * 0.006);
    box.style.setProperty("--bugScale", String(base + extra));
    box.classList.remove("shake");
    void box.offsetWidth;
    box.classList.add("shake");
  }
}

async function playValentineAcceptCinematic() {
  const box = els.matrixBox;
  const canvas = els.bugCanvas;
  if (!box || !canvas) return;

  for (const t of state.cinematicTimers) clearTimeout(t);
  state.cinematicTimers = [];

  box.classList.add("cinematic");
  state.heartsBoost = 2.8;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const rand = (min, max) => min + Math.random() * (max - min);

  const spawnHeartRain = () => {
    // Spawn a small burst of falling hearts on top of the existing rain.
    const burst = 10;
    for (let i = 0; i < burst; i++) {
      const el = document.createElement("span");
      el.className = "rainLetter ghost";
      el.textContent = "♥";
      const x = rand(0, Math.max(1, width));
      const dx = rand(-120, 120);
      const fall = height + rand(40, 180);
      const dur = rand(900, 1700);
      const delay = rand(0, 120);

      const h = Math.floor(rand(330, 20) + 360) % 360;
      el.style.setProperty("--c", `hsla(${h}, 88%, 72%, 0.95)`);
      el.style.setProperty("--glow", `hsla(${h}, 88%, 45%, 0.22)`);
      el.style.fontSize = `${Math.round(rand(16, 26))}px`;
      el.style.left = `${x}px`;
      el.style.setProperty("--dx", `${dx}px`);
      el.style.setProperty("--fall", `${fall}px`);
      el.style.animation = `rainFall ${dur}ms linear ${delay}ms 1 forwards`;
      canvas.appendChild(el);
      const t = window.setTimeout(() => el.remove(), delay + dur + 120);
      state.cinematicTimers.push(t);
    }
  };

  const start = performance.now();
  const durationMs = 1700;
  const pump = () => {
    if (performance.now() - start > durationMs) return;
    spawnHeartRain();
    const t = window.setTimeout(pump, 140);
    state.cinematicTimers.push(t);
  };
  pump();

  await new Promise((r) => {
    const t = window.setTimeout(r, durationMs);
    state.cinematicTimers.push(t);
  });

  state.heartsBoost = 1;
  box.classList.remove("cinematic");
}

function assembleBugMessage(lines) {
  // Kept for compatibility; message is now assembled from raining letters.
}

function startBugRainAndAssembleMessage(lines) {
  const canvas = els.bugCanvas;
  if (!canvas) return 0;

  canvas.innerHTML = "";
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);

  const rand = (min, max) => min + Math.random() * (max - min);
  const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789♥";

  const confettiColor = () => {
    const h = Math.floor(rand(0, 360));
    const s = Math.floor(rand(78, 96));
    const l = Math.floor(rand(58, 76));
    return {
      c: `hsla(${h}, ${s}%, ${l}%, 0.90)`,
      glow: `hsla(${h}, ${s}%, ${Math.max(20, l - 20)}%, 0.22)`,
    };
  };

  const spawnRainLetter = ({ ch, cls, x, dx, fall, dur, delay }) => {
    const el = document.createElement("span");
    el.className = cls;
    el.textContent = ch;
    if (!cls.includes(" msg")) {
      const { c, glow } = confettiColor();
      el.style.setProperty("--c", c);
      el.style.setProperty("--glow", glow);
      el.style.fontSize = `${Math.round(rand(14, 22))}px`;
    }
    el.style.left = `${x}px`;
    el.style.setProperty("--dx", `${dx}px`);
    el.style.setProperty("--fall", `${fall}px`);
    el.style.animation = `rainFall ${dur}ms linear ${delay}ms 1 forwards`;
    canvas.appendChild(el);
    // Keep DOM light: background rain gets removed after it finished.
    if (!cls.includes(" msg")) {
      const t = window.setTimeout(() => el.remove(), delay + dur + 80);
      state.bugLetterTimers.push(t);
    }
  };

  // Random rain (background noise)
  const initialCount = Math.round(260 + Math.min(220, width / 2.4));
  for (let i = 0; i < initialCount; i++) {
    const ch = randomChars[Math.floor(Math.random() * randomChars.length)];
    spawnRainLetter({
      ch,
      cls: "rainLetter" + (Math.random() < 0.66 ? " ghost" : ""),
      x: rand(0, width),
      dx: rand(-240, 240),
      fall: rand(height * 0.75, height * 1.35),
      dur: rand(1400, 2800),
      delay: rand(0, 1200),
    });
  }

  // Aggressive continuous rain for a few seconds.
  const burstForMs = 5200;
  const burstStart = performance.now();
  const loop = () => {
    const now = performance.now();
    if (now - burstStart > burstForMs) return;
    const burst = 26 + Math.floor(Math.random() * 18);
    for (let i = 0; i < burst; i++) {
      const ch = randomChars[Math.floor(Math.random() * randomChars.length)];
      spawnRainLetter({
        ch,
        cls: "rainLetter" + (Math.random() < 0.70 ? " ghost" : ""),
        x: rand(0, width),
        dx: rand(-320, 320),
        fall: rand(height * 0.80, height * 1.45),
        dur: rand(1100, 2400),
        delay: rand(0, 240),
      });
    }
    const t = window.setTimeout(loop, 90 + Math.random() * 90);
    state.bugLetterTimers.push(t);
  };
  loop();

  // Message letters (they are also falling letters) centered in the bug canvas.
  const usableH = height;

  const maxLen = Math.max(1, ...lines.map((l) => String(l || "").length));
  const padX = 18;
  const letterW = Math.max(12, Math.min(26, Math.floor((width - padX * 2) / maxLen)));
  const fontSize = Math.round(letterW * 1.25);
  const lineH = Math.round(fontSize * 1.75);
  const totalMsgH = (lines.length - 1) * lineH;
  const startY = Math.round((usableH - totalMsgH) / 2);
  let messageEndMs = 0;

  for (let li = 0; li < lines.length; li++) {
    const line = String(lines[li] || "").toUpperCase();
    const lineWidth = Math.max(0, (line.length - 1) * letterW);
    const baseX = Math.max(0, (width - lineWidth) / 2);
    const y = Math.max(0, Math.min(usableH - fontSize - 4, startY + li * lineH));

    for (let ci = 0; ci < line.length; ci++) {
      const c = line[ci];
      if (c === " ") continue;

      const el = document.createElement("span");
      el.className = "rainLetter msg";
      el.textContent = c;
      el.style.fontSize = `${fontSize}px`;
      el.style.setProperty("--c", "rgba(254,202,202,0.98)");
      el.style.setProperty("--glow", "rgba(239,68,68,0.22)");

      const tx = baseX + ci * letterW;
      const ty = y;
      const fall = ty + 40;
      const dur = rand(1400, 2700);
      const delay = rand(550, 1900);

      el.style.left = `${tx}px`;
      el.style.setProperty("--dx", `${rand(-340, 340)}px`);
      el.style.setProperty("--fall", `${fall}px`);
      el.style.animation = `rainFall ${dur}ms linear ${delay}ms 1 forwards`;

      messageEndMs = Math.max(messageEndMs, delay + dur);
      canvas.appendChild(el);
    }
  }

  // Fade background rain once message has formed.
  const fadeT = window.setTimeout(() => {
    for (const el of Array.from(canvas.querySelectorAll(".rainLetter:not(.msg)"))) {
      el.classList.add("fade");
      el.style.transition = "opacity 700ms ease";
    }
    const cleanup = window.setTimeout(() => {
      for (const el of Array.from(canvas.querySelectorAll(".rainLetter.fade"))) el.remove();
    }, 900);
    state.bugLetterTimers.push(cleanup);
  }, Math.max(900, Math.ceil(messageEndMs) + 120));

  state.bugLetterTimers.push(fadeT);

  return messageEndMs;
}

async function playValentineBug(finalLetter) {
  const overlay = els.letterOverlay;
  const box = els.matrixBox;
  const letterEl = els.matrixLetter;
  const hintEl = els.matrixHint;
  if (!overlay || !box || !letterEl) return;

  for (const t of state.bugLetterTimers) clearTimeout(t);
  state.bugLetterTimers = [];

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
  box.classList.remove("bug");
  box.classList.remove("shake");
  els.valentineNoBtn?.classList.add("hidden");
  els.valentineAcceptBtn?.classList.add("hidden");
  if (els.bugCanvas) els.bugCanvas.innerHTML = "";
  if (els.giftLayer) {
    els.giftLayer.classList.add("hidden");
    els.giftLayer.setAttribute("aria-hidden", "true");
    els.giftLayer.dataset.ready = "";
    els.giftLayer.innerHTML = "";
  }
  resetNoButtonPosition();

  // Reset letter state.
  letterEl.classList.remove("glitch");
  letterEl.classList.remove("vanish");
  letterEl.style.opacity = "1";
  letterEl.style.display = "";
  letterEl.classList.add("loading");

  if (hintEl) hintEl.textContent = "Se alege litera...";

  // Phase 1: normal-ish selection (spins), no final letter reveal.
  const allowed = getAllowedLetters();
  const phase1Ms = 3400;
  const phase1End = performance.now() + phase1Ms;
  let raf = 0;
  const tick = () => {
    const now = performance.now();
    if (now >= phase1End) {
      cancelAnimationFrame(raf);
      return;
    }
    letterEl.textContent = allowed[Math.floor(Math.random() * allowed.length)];
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  // Phase 2: takeover begins inside the same frame: gradual red/scale (CSS transitions are slow on purpose).
  await new Promise((r) => window.setTimeout(r, phase1Ms + 120));
  const bugStart = performance.now();
  box.classList.add("bug");
  // Hearts appear only once the box starts growing.
  startHeartsScreensaver();
  // Once the box starts growing/red, hide the letter completely.
  letterEl.classList.remove("loading");
  letterEl.classList.remove("glitch");
  letterEl.classList.remove("vanish");
  letterEl.style.display = "none";
  letterEl.textContent = "";
  if (hintEl) hintEl.textContent = "Se alege litera...";

  // Corrupt the chosen letter briefly, then remove it.
  const corruptForMs = 0;
  const corruptEnd = performance.now() + corruptForMs;
  let raf2 = 0;
  const tick2 = () => {
    const now = performance.now();
    if (now >= corruptEnd) {
      cancelAnimationFrame(raf2);
      return;
    }
    letterEl.textContent = allowed[Math.floor(Math.random() * allowed.length)];
    raf2 = requestAnimationFrame(tick2);
  };
  raf2 = requestAnimationFrame(tick2);

  // Phase 3: start the aggressive rain shortly after takeover starts.
  await new Promise((r) => window.setTimeout(r, 680));
  if (hintEl) hintEl.textContent = "";
  // 1–2 sec gradual takeover happens via CSS transitions while letters rain.
  const messageEndMs = Number(startBugRainAndAssembleMessage(VALENTINE_EVENT.messageLines) || 0);

  // Show the buttons only after the text has fully formed.
  // Requirement: ~4–5s after the box starts enlarging ("bug" starts), aligned with the completed message.
  const minButtonsAfterBugMs = 4500;
  const revealAfterBugMs = Math.max(minButtonsAfterBugMs, 680 + messageEndMs);
  const revealAt = bugStart + revealAfterBugMs;
  const revealIn = Math.max(0, Math.ceil(revealAt - performance.now()));

  const t = window.setTimeout(() => {
    const stage = String((state.room?.event || {}).stage || "bug");
    if (stage !== "bug") return;
    if (overlay.classList.contains("hidden")) return;

    els.valentineNoBtn?.classList.remove("hidden");
    els.valentineAcceptBtn?.classList.remove("hidden");
    if (els.valentineAcceptBtn) els.valentineAcceptBtn.textContent = "Da";
    applyValentineButtonScaling(0);
  }, revealIn);
  state.bugLetterTimers.push(t);
}

function getAllowedLetters() {
  const forbidden = new Set(["Q", "W", "Z", "X"]);
  const letters = [];
  for (let c = 65; c <= 90; c++) {
    const ch = String.fromCharCode(c);
    if (!forbidden.has(ch)) letters.push(ch);
  }
  return letters;
}

function wireFormAutosave() {
  const inputs = getCategoryInputs();
  for (const [cat, input] of Object.entries(inputs)) {
    input.addEventListener("input", () => {
      state.localDraft[cat] = String(input.value || "");
      scheduleSaveDraft(cat);
    });
  }
}

function scheduleSaveDraft(category) {
  if (!state.roomId) return;
  if (state.myRole === "S") return;
  const room = state.room;
  const players = room?.players || { P1: "", P2: "" };
  const bothPlayers = Boolean(players.P1) && Boolean(players.P2);
  if (!bothPlayers) return;
  if ((room?.status || "") !== "playing") return;
  if (room?.status === "finished") return;

  if (state.saveTimers[category]) clearTimeout(state.saveTimers[category]);
  state.saveTimers[category] = setTimeout(() => {
    saveDraftField(category).catch(showError);
  }, 400);
}

async function saveDraftField(category) {
  if (!state.roomId) return;
  const ref = doc(db, "rooms", state.roomId);
  const value = String(state.localDraft[category] || "");

  // Nested update: drafts.{uid}.{category}
  await updateDoc(ref, {
    [`drafts.${state.uid}.${category}`]: value,
    lastUpdateAt: serverTimestamp(),
  });
}

async function finishRound(roomId) {
  const ref = doc(db, "rooms", roomId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Camera nu mai există.");
    const room = snap.data();

    if ((room.status || "lobby") === "finished") return;

    const players = room.players || { P1: "", P2: "" };
    const bothPlayers = Boolean(players.P1) && Boolean(players.P2);
    if (!bothPlayers) throw new Error("Așteaptă să intre și al doilea jucător.");

    const letter = String(room.letter || "").toUpperCase();
    const categories = Array.isArray(room.categories) ? room.categories : getCategories();

    const matchTotals = room.matchTotals || {};

    const drafts = room.drafts || {};
    const p1Uid = players.P1;
    const p2Uid = players.P2;
    const a1 = normalizeAnswers(drafts[p1Uid] || {});
    const a2 = normalizeAnswers(drafts[p2Uid] || {});

    const computed = computeScores({
      letter,
      categories,
      p1Uid,
      p2Uid,
      answers1: a1,
      answers2: a2,
      answerSets: state.answerSets,
    });

    if (matchTotals[p1Uid] == null) matchTotals[p1Uid] = 0;
    if (matchTotals[p2Uid] == null) matchTotals[p2Uid] = 0;

    const nextMatchTotals = {
      ...matchTotals,
      [p1Uid]: Number(matchTotals[p1Uid] || 0) + Number(computed.totals[p1Uid] || 0),
      [p2Uid]: Number(matchTotals[p2Uid] || 0) + Number(computed.totals[p2Uid] || 0),
    };

    const existingEvent = room.event || {};
    const alreadyUnlocked = existingEvent?.id === VALENTINE_EVENT.id && Boolean(existingEvent?.unlocked);
    const maxMatch = Math.max(Number(nextMatchTotals[p1Uid] || 0), Number(nextMatchTotals[p2Uid] || 0));
    const unlockNow = !alreadyUnlocked && maxMatch >= VALENTINE_EVENT.threshold;

    tx.update(ref, {
      status: "finished",
      finishedAt: serverTimestamp(),
      finishedBy: state.uid,
      matchTotals: nextMatchTotals,
      ...(unlockNow
        ? {
            event: {
              id: VALENTINE_EVENT.id,
              unlocked: true,
              unlockedAt: serverTimestamp(),
              unlockedAtMs: Date.now(),
              bugReady: false,
              triggered: false,
              completed: false,
            },
          }
        : {}),
      final: {
        letter,
        categories,
        round: Number.isFinite(room.round) ? room.round : 1,
        players,
        answers: {
          [p1Uid]: a1,
          [p2Uid]: a2,
        },
        pointsByCategory: computed.pointsByCategory,
        totals: computed.totals,
        matchTotals: nextMatchTotals,
        details: computed.details,
      },
      lastUpdateAt: serverTimestamp(),
    });
  });
}

async function resetRoom(roomId) {
  const ref = doc(db, "rooms", roomId);
  const letter = randomGameLetter();
  const categories = getCategories();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Camera nu există.");
    const room = snap.data();
    const players = room.players || { P1: "", P2: "" };

    if (players.P1 !== state.uid) throw new Error("Doar Jucătorul 1 poate da reset.");

    const nextRound = (Number.isFinite(room.round) ? room.round : 1) + 1;

    const existingEvent = room.event || {};
    const canArmBug = existingEvent?.id === VALENTINE_EVENT.id && Boolean(existingEvent?.unlocked) && !Boolean(existingEvent?.triggered);

    tx.update(ref, {
      status: "lobby",
      round: nextRound,
      letter,
      categories,
      drafts: {},
      left: {},
      startedAt: null,
      startedAtMs: null,
      finishedAt: null,
      finishedBy: "",
      final: null,
      ...(canArmBug
        ? {
            event: {
              ...existingEvent,
              bugReady: true,
              bugReadyAt: serverTimestamp(),
              bugReadyAtMs: Date.now(),
            },
          }
        : {}),
      lastUpdateAt: serverTimestamp(),
    });
  });

  setStatus("Reset făcut.");
}

async function leaveRoom() {
  const roomId = state.roomId;
  const role = state.myRole;

  // Mark left in DB (so results persist until both leave).
  if (roomId && role !== "S") {
    await markLeftAndMaybeDelete(roomId);
  }

  if (state.unsubRoom) state.unsubRoom();
  state.unsubRoom = null;
  state.room = null;
  state.roomId = null;
  state.myRole = null;
  setValentineMode(false);
  clearLocalAnswers();

  const url = new URL(window.location.href);
  url.searchParams.delete("room");
  window.history.replaceState({}, "", url);

  els.roomIdInput.value = "";
  showSetupPanel();
  setStatus("Ieșit din cameră.");
}

function showSetupPanel() {
  els.setupPanel.classList.remove("hidden");
  els.gamePanel.classList.add("hidden");
}

function showGamePanel() {
  els.setupPanel.classList.add("hidden");
  els.gamePanel.classList.remove("hidden");
}

function setStatus(text) {
  if (els.statusText) els.statusText.textContent = text;
  if (els.setupStatusText) els.setupStatusText.textContent = text;
}

function showError(e) {
  const msg = e?.message ? String(e.message) : String(e);
  setStatus(msg);
  console.error(e);
}

function setFormEnabled(enabled) {
  if (!els.answersForm) return;
  for (const input of els.answersForm.querySelectorAll("input")) {
    input.disabled = !enabled;
  }
  els.finishBtn.disabled = !enabled;
}

function clearLocalAnswers() {
  state.localDraft = createEmptyAnswers();
  const inputs = getCategoryInputs();
  for (const input of Object.values(inputs)) {
    if (input) input.value = "";
  }
}

function getCategories() {
  return ["tari", "orase", "munti", "ape", "plante", "animale", "nume"];
}

function createEmptyAnswers() {
  return {
    tari: "",
    orase: "",
    munti: "",
    ape: "",
    plante: "",
    animale: "",
    nume: "",
  };
}

function getCategoryInputs() {
  return {
    tari: document.getElementById("field_tari"),
    orase: document.getElementById("field_orase"),
    munti: document.getElementById("field_munti"),
    ape: document.getElementById("field_ape"),
    plante: document.getElementById("field_plante"),
    animale: document.getElementById("field_animale"),
    nume: document.getElementById("field_nume"),
  };
}

function syncFormFromDraft(draft) {
  // Only fill empty inputs to avoid fighting the user while typing.
  const inputs = getCategoryInputs();
  for (const [cat, input] of Object.entries(inputs)) {
    if (!input) continue;
    const remote = String(draft?.[cat] || "");
    const local = String(state.localDraft?.[cat] || "");
    if (!local && remote && input.value !== remote) {
      input.value = remote;
      state.localDraft[cat] = remote;
    }
  }
}

function normalizeAnswers(obj) {
  const out = createEmptyAnswers();
  for (const cat of getCategories()) {
    out[cat] = String(obj?.[cat] || "").trim();
  }
  return out;
}

function renderResultsIfFinished(room) {
  const isFinished = (room.status || "") === "finished" && room.final;
  els.resultsPanel.classList.toggle("hidden", !isFinished);
  // When finished, keep the form hidden; otherwise let renderRoom() decide.
  if (isFinished) {
    els.answersForm?.classList.add("hidden");
  }

  if (!isFinished) return;

  const final = room.final;
  const players = final.players || {};
  const p1Uid = players.P1;
  const p2Uid = players.P2;
  const totals = final.totals || {};
  const p1Total = totals[p1Uid] ?? 0;
  const p2Total = totals[p2Uid] ?? 0;

  const matchTotals = final.matchTotals || room.matchTotals || {};
  const p1Match = matchTotals[p1Uid] ?? 0;
  const p2Match = matchTotals[p2Uid] ?? 0;

  const finishBy = room.finishedBy === p1Uid ? "Jucător 1" : room.finishedBy === p2Uid ? "Jucător 2" : "—";
  const roundNo = Number.isFinite(final.round) ? final.round : "?";
  els.resultsMeta.textContent = `Runda ${roundNo} • Finish: ${finishBy} • Runda: J1=${p1Total} / J2=${p2Total} • Parcurs: J1=${p1Match} / J2=${p2Match}`;

  els.resultsTable.innerHTML = buildResultsTableHtml(final);
}

async function completeValentineEvent({ enableMode, returnToLobby } = {}) {
  if (!state.roomId) return;

  const ref = doc(db, "rooms", state.roomId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data();
    const event = room.event || {};
    if (event?.id !== VALENTINE_EVENT.id || !event?.triggered) return;
    if (Boolean(event?.completed)) return;

    const nowMs = Date.now();
    tx.update(ref, {
      event: {
        ...event,
        completed: true,
        completedAt: serverTimestamp(),
        completedAtMs: nowMs,
        completedBy: state.uid,
        stage: "done",
        ...(enableMode ? { mode: true, modeEnabledAt: serverTimestamp(), modeEnabledAtMs: nowMs } : {}),
      },
      ...(returnToLobby
        ? {
            status: "lobby",
            startedAt: null,
            startedAtMs: null,
          }
        : {}),
      lastUpdateAt: serverTimestamp(),
    });
  });
}

async function markLeftAndMaybeDelete(roomId) {
  const ref = doc(db, "rooms", roomId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data();

    const players = room.players || { P1: "", P2: "" };
    const p1Uid = players.P1;
    const p2Uid = players.P2;
    const left = room.left || {};

    left[state.uid] = true;

    const finished = (room.status || "") === "finished";
    const bothPlayers = Boolean(p1Uid) && Boolean(p2Uid);
    const bothLeft =
      bothPlayers &&
      Boolean(left[p1Uid]) &&
      Boolean(left[p2Uid]);

    if (finished && bothLeft) {
      tx.delete(ref);
    } else {
      tx.update(ref, {
        left,
        lastUpdateAt: serverTimestamp(),
      });
    }
  });
}

function hydratePlayerName() {
  const key = "tomapan_name";
  const existing = localStorage.getItem(key);
  if (existing && typeof existing === "string") {
    state.playerName = existing;
  }
  if (els.playerNameInput) {
    els.playerNameInput.value = state.playerName;
    els.playerNameInput.addEventListener("input", () => {
      state.playerName = normalizePlayerName(els.playerNameInput.value);
      localStorage.setItem(key, state.playerName);
    });
  }
}

function requirePlayerName() {
  const name = normalizePlayerName(els.playerNameInput?.value || state.playerName);
  if (!name) throw new Error("Introdu un nume înainte să creezi/intri.");
  state.playerName = name;
  localStorage.setItem("tomapan_name", name);
}

function normalizePlayerName(v) {
  return String(v || "").trim().replace(/\s+/g, " ").slice(0, 24);
}

function buildResultsTableHtml(final) {
  const categories = Array.isArray(final.categories) ? final.categories : getCategories();
  const players = final.players || {};
  const p1Uid = players.P1;
  const p2Uid = players.P2;
  const answers = final.answers || {};
  const a1 = answers[p1Uid] || {};
  const a2 = answers[p2Uid] || {};
  const pointsByCategory = final.pointsByCategory || {};
  const totals = final.totals || {};
  const matchTotals = final.matchTotals || {};

  const header = `
    <tr>
      <th>Categorie</th>
      <th>Jucător 1</th>
      <th>Pct</th>
      <th>Jucător 2</th>
      <th>Pct</th>
    </tr>
  `;

  const rows = categories
    .map((cat) => {
      const p = pointsByCategory[cat] || {};
      const p1 = p[p1Uid] ?? 0;
      const p2 = p[p2Uid] ?? 0;
      const v1 = escapeHtml(String(a1[cat] || ""));
      const v2 = escapeHtml(String(a2[cat] || ""));
      return `
        <tr>
          <td><span class="pill">${escapeHtml(prettyCategory(cat))}</span></td>
          <td>${v1 || "<span class=\"pill\">—</span>"}</td>
          <td><strong>${p1}</strong></td>
          <td>${v2 || "<span class=\"pill\">—</span>"}</td>
          <td><strong>${p2}</strong></td>
        </tr>
      `;
    })
    .join("");

  const footer = `
    <tr>
      <th colspan="2">Total rundă</th>
      <th>${totals[p1Uid] ?? 0}</th>
      <th></th>
      <th>${totals[p2Uid] ?? 0}</th>
    </tr>
    <tr>
      <th colspan="2">Punctaj parcurs</th>
      <th>${matchTotals[p1Uid] ?? 0}</th>
      <th></th>
      <th>${matchTotals[p2Uid] ?? 0}</th>
    </tr>
  `;

  return `<thead>${header}</thead><tbody>${rows}</tbody><tfoot>${footer}</tfoot>`;
}

function prettyCategory(cat) {
  switch (cat) {
    case "tari":
      return "Țări";
    case "orase":
      return "Orașe";
    case "munti":
      return "Munți";
    case "ape":
      return "Ape";
    case "plante":
      return "Plante";
    case "animale":
      return "Animale";
    case "nume":
      return "Nume";
    default:
      return cat;
  }
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function computeScores({ letter, categories, p1Uid, p2Uid, answers1, answers2, answerSets }) {
  const pointsByCategory = {};
  const totals = { [p1Uid]: 0, [p2Uid]: 0 };
  const details = {};

  for (const cat of categories) {
    const v1 = String(answers1?.[cat] || "").trim();
    const v2 = String(answers2?.[cat] || "").trim();

    const ok1 = isCorrectAnswer({ letter, category: cat, value: v1, answerSets });
    const ok2 = isCorrectAnswer({ letter, category: cat, value: v2, answerSets });

    const n1 = normalizeForCompare(v1);
    const n2 = normalizeForCompare(v2);

    let p1 = 0;
    let p2 = 0;

    if (!v1 && !v2) {
      p1 = 0;
      p2 = 0;
    } else if (v1 && !v2) {
      p1 = ok1 ? 10 : 0;
      p2 = 0;
    } else if (!v1 && v2) {
      p1 = 0;
      p2 = ok2 ? 10 : 0;
    } else {
      // both wrote something
      if (ok1 && ok2) {
        if (n1 && n2 && n1 === n2) {
          p1 = 5;
          p2 = 5;
        } else {
          p1 = 10;
          p2 = 10;
        }
      } else if (ok1 && !ok2) {
        p1 = 10;
        p2 = 0;
      } else if (!ok1 && ok2) {
        p1 = 0;
        p2 = 10;
      } else {
        p1 = 0;
        p2 = 0;
      }
    }

    pointsByCategory[cat] = { [p1Uid]: p1, [p2Uid]: p2 };
    totals[p1Uid] += p1;
    totals[p2Uid] += p2;
    details[cat] = {
      [p1Uid]: { value: v1, correct: ok1 },
      [p2Uid]: { value: v2, correct: ok2 },
    };
  }

  return { pointsByCategory, totals, details };
}

function isCorrectAnswer({ letter, category, value, answerSets }) {
  const raw = String(value || "").trim();
  if (!raw) return false;

  const first = normalizeFirstLetter(raw);
  if (!first || first !== String(letter || "").toUpperCase()) return false;

  const set = answerSets?.[category];
  if (!set) return false;
  return set.has(normalizeForCompare(raw));
}

function normalizeFirstLetter(s) {
  const t = normalizeForCompare(s);
  if (!t) return "";
  return t[0].toUpperCase();
}

function normalizeForCompare(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function randomGameLetter() {
  const forbidden = new Set(["Q", "W", "Z", "X"]);
  const letters = [];
  for (let c = 65; c <= 90; c++) {
    const ch = String.fromCharCode(c);
    if (!forbidden.has(ch)) letters.push(ch);
  }
  const bytes = new Uint8Array(1);
  crypto.getRandomValues(bytes);
  return letters[bytes[0] % letters.length];
}

async function loadAnswerDb() {
  const res = await fetch("./data/answers.seed.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Nu pot încărca data/answers.seed.json");
  const answerDb = await res.json();

  const answerSets = {};
  for (const cat of getCategories()) {
    const arr = Array.isArray(answerDb?.[cat]) ? answerDb[cat] : [];
    answerSets[cat] = new Set(arr.map((x) => normalizeForCompare(x)));
  }
  return { answerDb, answerSets };
}

function getOrCreateUid() {
  const key = "tomapan_uid";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const uid = cryptoRandomId(20);
  localStorage.setItem(key, uid);
  return uid;
}

function cryptoRandomId(len) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function generateRoomId() {
  // 6 caractere ușor de dictat
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < bytes.length; i++) id += chars[bytes[i] % chars.length];
  return id;
}

function normalizeRoomId(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

function getRoomIdFromUrl() {
  const url = new URL(window.location.href);
  const room = url.searchParams.get("room");
  return room ? normalizeRoomId(room) : "";
}
