import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const els = {
  setupPanel: document.getElementById("setupPanel"),
  gamePanel: document.getElementById("gamePanel"),
  createRoomBtn: document.getElementById("createRoomBtn"),
  joinRoomBtn: document.getElementById("joinRoomBtn"),
  pasteFromUrlBtn: document.getElementById("pasteFromUrlBtn"),
  roomIdInput: document.getElementById("roomIdInput"),
  roomIdLabel: document.getElementById("roomIdLabel"),
  mySymbolLabel: document.getElementById("mySymbolLabel"),
  turnLabel: document.getElementById("turnLabel"),
  setupStatusText: document.getElementById("setupStatusText"),
  statusText: document.getElementById("statusText"),
  board: document.getElementById("board"),
  copyLinkBtn: document.getElementById("copyLinkBtn"),
  resetBtn: document.getElementById("resetBtn"),
  leaveBtn: document.getElementById("leaveBtn"),
  spectatorNote: document.getElementById("spectatorNote"),
};

const state = {
  uid: getOrCreateUid(),
  roomId: null,
  mySymbol: null, // 'X' | 'O' | 'S'
  unsubRoom: null,
  room: null,
};

initBoardUI();
wireUI();

const roomFromUrl = getRoomIdFromUrl();
if (roomFromUrl) {
  els.roomIdInput.value = roomFromUrl;
  joinRoom(roomFromUrl).catch(showError);
}

function wireUI() {
  els.createRoomBtn.addEventListener("click", async () => {
    try {
      const roomId = await createRoom();
      await joinRoom(roomId);
    } catch (e) {
      showError(e);
    }
  });

  els.joinRoomBtn.addEventListener("click", async () => {
    try {
      const roomId = normalizeRoomId(els.roomIdInput.value);
      if (!roomId) return setStatus("Introdu un cod de cameră.");
      await joinRoom(roomId);
    } catch (e) {
      showError(e);
    }
  });

  els.pasteFromUrlBtn.addEventListener("click", async () => {
    const roomId = getRoomIdFromUrl();
    if (!roomId) return setStatus("Nu există ?room=... în link.");
    els.roomIdInput.value = roomId;
    try {
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
    if (state.mySymbol !== "X") {
      return setStatus("Doar X poate da reset.");
    }
    try {
      await resetRoom(state.roomId);
    } catch (e) {
      showError(e);
    }
  });

  els.leaveBtn.addEventListener("click", () => {
    leaveRoom();
  });

  window.addEventListener("beforeunload", () => {
    if (state.unsubRoom) state.unsubRoom();
  });
}

function initBoardUI() {
  els.board.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement("button");
    btn.className = "cell";
    btn.type = "button";
    btn.dataset.idx = String(i);
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-label", `Celula ${i + 1}`);
    btn.addEventListener("click", () => attemptMove(i));
    els.board.appendChild(btn);
  }
}

async function createRoom() {
  const roomId = generateRoomId();
  const ref = doc(db, "rooms", roomId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) throw new Error("Coliziune cod cameră. Reîncearcă.");

    tx.set(ref, {
      createdAt: serverTimestamp(),
      status: "playing",
      board: Array(9).fill(""),
      turn: "X",
      winner: "",
      players: {
        X: state.uid,
        O: "",
      },
      lastMoveAt: serverTimestamp(),
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
    const players = room.players || { X: "", O: "" };

    let mySymbol = "S";

    if (!players.X) {
      players.X = state.uid;
      mySymbol = "X";
      tx.update(ref, { players });
    } else if (players.X === state.uid) {
      mySymbol = "X";
    } else if (!players.O) {
      players.O = state.uid;
      mySymbol = "O";
      tx.update(ref, { players });
    } else if (players.O === state.uid) {
      mySymbol = "O";
    } else {
      mySymbol = "S";
    }

    return { mySymbol };
  });

  state.roomId = roomId;
  state.mySymbol = result.mySymbol;

  showGamePanel();
  els.roomIdLabel.textContent = roomId;
  els.mySymbolLabel.textContent = state.mySymbol === "S" ? "Spectator" : state.mySymbol;
  els.spectatorNote.style.display = state.mySymbol === "S" ? "block" : "none";

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

  setStatus("Conectat. Așteaptă al doilea jucător dacă e cazul.");
}

function renderRoom() {
  const room = state.room;
  if (!room) return;

  const board = Array.isArray(room.board) ? room.board : Array(9).fill("");
  const turn = room.turn || "X";
  const winner = room.winner || "";
  const players = room.players || { X: "", O: "" };

  els.turnLabel.textContent = winner ? "—" : turn;

  const bothPlayers = Boolean(players.X) && Boolean(players.O);

  const isMyTurn = state.mySymbol !== "S" && turn === state.mySymbol;
  const canPlay = bothPlayers && !winner && isMyTurn;

  const status = buildStatusText({ bothPlayers, winner, turn });
  setStatus(status);

  for (const cell of els.board.querySelectorAll(".cell")) {
    const idx = Number(cell.dataset.idx);
    const v = board[idx] || "";
    cell.textContent = v;

    const empty = v === "";
    const clickable = canPlay && empty;

    cell.classList.toggle("clickable", clickable);
    cell.classList.toggle("disabled", !clickable);
    cell.disabled = !clickable;
  }
}

async function attemptMove(index) {
  if (!state.roomId) return;
  if (state.mySymbol === "S") return;

  const ref = doc(db, "rooms", state.roomId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("Camera nu mai există.");

      const room = snap.data();
      const players = room.players || { X: "", O: "" };
      const board = Array.isArray(room.board) ? room.board.slice() : Array(9).fill("");
      const turn = room.turn || "X";
      const winner = room.winner || "";

      if (!players.X || !players.O) throw new Error("Așteaptă să intre și al doilea jucător.");
      if (winner) throw new Error("Jocul s-a terminat. Dă reset.");
      if (turn !== state.mySymbol) throw new Error("Nu e rândul tău.");
      if (board[index]) throw new Error("Celula e ocupată.");

      board[index] = state.mySymbol;

      const nextWinner = computeWinner(board);
      const nextTurn = state.mySymbol === "X" ? "O" : "X";

      tx.update(ref, {
        board,
        turn: nextWinner ? turn : nextTurn,
        winner: nextWinner,
        lastMoveAt: serverTimestamp(),
      });
    });
  } catch (e) {
    showError(e);
  }
}

async function resetRoom(roomId) {
  const ref = doc(db, "rooms", roomId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Camera nu există.");
    const room = snap.data();
    const players = room.players || { X: "", O: "" };

    if (players.X !== state.uid) throw new Error("Doar X (creatorul) poate da reset.");

    tx.update(ref, {
      board: Array(9).fill(""),
      turn: "X",
      winner: "",
      lastMoveAt: serverTimestamp(),
    });
  });

  setStatus("Reset făcut.");
}

function leaveRoom() {
  if (state.unsubRoom) state.unsubRoom();
  state.unsubRoom = null;
  state.room = null;
  state.roomId = null;
  state.mySymbol = null;

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

function buildStatusText({ bothPlayers, winner, turn }) {
  if (!bothPlayers) return "Aștept jucătorul 2...";

  if (winner === "draw") return "Egal.";
  if (winner === "X" || winner === "O") return `A câștigat ${winner}.`;

  if (state.mySymbol === "S") return `Spectator. Rândul: ${turn}.`;
  if (turn === state.mySymbol) return "Rândul tău.";
  return "Rândul adversarului.";
}

function computeWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return v;
  }

  if (board.every((x) => x)) return "draw";
  return "";
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
