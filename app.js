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
  matrixLetter: document.getElementById("matrixLetter"),
  answersForm: document.getElementById("answersForm"),
  finishBtn: document.getElementById("finishBtn"),
  resultsPanel: document.getElementById("resultsPanel"),
  resultsMeta: document.getElementById("resultsMeta"),
  resultsTable: document.getElementById("resultsTable"),
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

  window.addEventListener("beforeunload", () => {
    if (state.unsubRoom) state.unsubRoom();
  });
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
  if (bothPlayers && isStarting && !isFinished) {
    const startKey = String(room.startedAtMs || room.startedAt?.seconds || room.startedAt || "") + ":" + String(round);
    if (startKey && state.lastStartKey !== startKey) {
      state.lastStartKey = startKey;
      playMatrixLetter(room.letter || "A");
      scheduleAdvanceToPlaying(room);
    }
    // If starting has been going on for a while, advance to playing (any client can do this).
    maybeAdvanceToPlaying(room).catch(() => {});
  }

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

    tx.update(ref, {
      status: "starting",
      startedAt: serverTimestamp(),
      startedAtMs: Date.now(),
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

    tx.update(ref, {
      status: "finished",
      finishedAt: serverTimestamp(),
      finishedBy: state.uid,
      matchTotals: nextMatchTotals,
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
