// Mundial Pontos - v1.1.0 GitHub Pages
// Para ligar ao Firebase, preenche firebaseConfig abaixo com os dados do teu projeto.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, setDoc, addDoc, deleteDoc,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "COLOCA_AQUI",
  authDomain: "COLOCA_AQUI",
  projectId: "COLOCA_AQUI",
  storageBucket: "COLOCA_AQUI",
  messagingSenderId: "COLOCA_AQUI",
  appId: "COLOCA_AQUI"
};

const ADMIN_PIN = "1234";
const DEMO_MODE = firebaseConfig.apiKey === "COLOCA_AQUI";

let db = null;
let activePlayer = localStorage.getItem("mundial_active_player") || "";
let isAdmin = localStorage.getItem("mundial_is_admin") === "1";
let games = [];
let bets = [];

const demoStoreKey = "mundial_demo_data_v1";
const defaultDemo = {
  games: [
    { id: "demo1", homeTeam: "Portugal", awayTeam: "Brasil", matchDate: "2026-06-20T20:00", homeScore: null, awayScore: null, createdAt: Date.now() },
    { id: "demo2", homeTeam: "Argentina", awayTeam: "França", matchDate: "2026-06-21T18:00", homeScore: null, awayScore: null, createdAt: Date.now() + 1 }
  ],
  bets: []
};

function $(id) { return document.getElementById(id); }

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2600);
}

function getDemoData() {
  const raw = localStorage.getItem(demoStoreKey);
  if (!raw) {
    localStorage.setItem(demoStoreKey, JSON.stringify(defaultDemo));
    return structuredClone(defaultDemo);
  }
  return JSON.parse(raw);
}
function saveDemoData(data) { localStorage.setItem(demoStoreKey, JSON.stringify(data)); }

async function initFirebase() {
  if (DEMO_MODE) return;
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

async function loadData() {
  if (DEMO_MODE) {
    const data = getDemoData();
    games = data.games.sort((a,b) => String(a.matchDate).localeCompare(String(b.matchDate)));
    bets = data.bets;
    renderAll();
    return;
  }

  const gamesSnap = await getDocs(query(collection(db, "games"), orderBy("matchDate", "asc")));
  games = gamesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const betsSnap = await getDocs(collection(db, "bets"));
  bets = betsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAll();
}

async function saveBet(gameId, homeGuess, awayGuess) {
  if (!activePlayer) return toast("Entra primeiro com o teu nome.");
  const game = games.find(g => g.id === gameId);
  if (hasResult(game)) return toast("Este jogo já tem resultado lançado.");

  const bet = {
    gameId,
    playerName: activePlayer,
    homeGuess: Number(homeGuess),
    awayGuess: Number(awayGuess),
    updatedAt: Date.now()
  };

  if (DEMO_MODE) {
    const data = getDemoData();
    data.bets = data.bets.filter(b => !(b.gameId === gameId && b.playerName === activePlayer));
    data.bets.push({ id: `${gameId}_${activePlayer}`, ...bet });
    saveDemoData(data);
  } else {
    await setDoc(doc(db, "bets", `${gameId}_${safeId(activePlayer)}`), { ...bet, updatedAt: serverTimestamp() });
  }
  toast("Aposta guardada.");
  await loadData();
}

async function addGame(homeTeam, awayTeam, matchDate) {
  if (!homeTeam || !awayTeam || !matchDate) return toast("Preenche todos os dados do jogo.");
  const game = { homeTeam, awayTeam, matchDate, homeScore: null, awayScore: null, createdAt: Date.now() };
  if (DEMO_MODE) {
    const data = getDemoData();
    data.games.push({ id: crypto.randomUUID(), ...game });
    saveDemoData(data);
  } else {
    await addDoc(collection(db, "games"), { ...game, createdAt: serverTimestamp() });
  }
  $("homeTeamInput").value = "";
  $("awayTeamInput").value = "";
  $("matchDateInput").value = "";
  toast("Jogo adicionado.");
  await loadData();
}

async function setResult(gameId, homeScore, awayScore) {
  if (homeScore === "" || awayScore === "") return toast("Coloca o resultado completo.");
  if (DEMO_MODE) {
    const data = getDemoData();
    data.games = data.games.map(g => g.id === gameId ? { ...g, homeScore: Number(homeScore), awayScore: Number(awayScore) } : g);
    saveDemoData(data);
  } else {
    await setDoc(doc(db, "games", gameId), { homeScore: Number(homeScore), awayScore: Number(awayScore) }, { merge: true });
  }
  toast("Resultado guardado e pontos atualizados.");
  await loadData();
}

async function removeGame(gameId) {
  if (!confirm("Apagar este jogo e as apostas associadas?")) return;
  if (DEMO_MODE) {
    const data = getDemoData();
    data.games = data.games.filter(g => g.id !== gameId);
    data.bets = data.bets.filter(b => b.gameId !== gameId);
    saveDemoData(data);
  } else {
    await deleteDoc(doc(db, "games", gameId));
  }
  toast("Jogo apagado.");
  await loadData();
}

function safeId(text) { return text.toLowerCase().trim().replace(/[^a-z0-9]+/gi, "_"); }
function hasResult(game) { return game && game.homeScore !== null && game.homeScore !== undefined && game.awayScore !== null && game.awayScore !== undefined; }
function exactBet(bet, game) { return Number(bet.homeGuess) === Number(game.homeScore) && Number(bet.awayGuess) === Number(game.awayScore); }
function outcome(home, away) { return Number(home) > Number(away) ? "home" : Number(home) < Number(away) ? "away" : "draw"; }
function pointsForBet(bet, game) {
  if (!hasResult(game)) return 0;
  if (exactBet(bet, game)) return 3;
  return outcome(bet.homeGuess, bet.awayGuess) === outcome(game.homeScore, game.awayScore) ? 1 : 0;
}
function formatDate(value) {
  if (!value) return "Sem data";
  return new Date(value).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function renderAll() {
  renderSession();
  renderStats();
  renderGames();
  renderRanking();
  renderAdmin();
}

function getTotals() {
  const totals = new Map();
  bets.forEach(bet => {
    const game = games.find(g => g.id === bet.gameId);
    const current = totals.get(bet.playerName) || { playerName: bet.playerName, points: 0, exact: 0 };
    current.points += pointsForBet(bet, game);
    if (game && exactBet(bet, game)) current.exact += 1;
    totals.set(bet.playerName, current);
  });
  if (activePlayer && !totals.has(activePlayer)) totals.set(activePlayer, { playerName: activePlayer, points: 0, exact: 0 });
  return totals;
}

function renderStats() {
  const players = new Set(bets.map(b => b.playerName));
  if (activePlayer) players.add(activePlayer);
  const myTotal = getTotals().get(activePlayer)?.points || 0;
  if ($("statGames")) $("statGames").textContent = games.length;
  if ($("statBets")) $("statBets").textContent = bets.length;
  if ($("statPlayers")) $("statPlayers").textContent = players.size;
  if ($("statMyPoints")) $("statMyPoints").textContent = myTotal;
}

function renderSession() {
  $("activeUserLabel").textContent = activePlayer ? activePlayer : "Sem jogador";
  $("logoutBtn").classList.toggle("hidden", !activePlayer);
  $("loginView").classList.toggle("hidden", !!activePlayer);
  $("mainView").classList.toggle("hidden", !activePlayer);
  $("adminLocked").classList.toggle("hidden", isAdmin);
  $("adminUnlocked").classList.toggle("hidden", !isAdmin);
}

function renderGames() {
  const el = $("gamesList");
  if (!games.length) { el.innerHTML = `<div class="glass-card">Ainda não existem jogos.</div>`; return; }
  el.innerHTML = games.map(game => {
    const myBet = bets.find(b => b.gameId === game.id && b.playerName === activePlayer);
    const resultText = hasResult(game) ? `${game.homeScore} - ${game.awayScore}` : "Por jogar";
    const badgeClass = hasResult(game) ? "badge closed" : "badge";
    const pts = myBet ? pointsForBet(myBet, game) : 0;
    return `<article class="game-card">
      <div class="match-title">
        <div>
          <strong>${escapeHtml(game.homeTeam)} vs ${escapeHtml(game.awayTeam)}</strong>
          <p class="muted">${formatDate(game.matchDate)} · Resultado: ${resultText}</p>
        </div>
        <span class="${badgeClass}">${hasResult(game) ? `${pts} pts` : "Aberto"}</span>
      </div>
      <div class="bet-grid">
        <div class="muted">${myBet ? `A tua aposta: <strong>${myBet.homeGuess} - ${myBet.awayGuess}</strong>` : "Ainda sem aposta"}</div>
        <label>${escapeHtml(game.homeTeam)}<input id="home_${game.id}" type="number" min="0" value="${myBet?.homeGuess ?? ""}" ${hasResult(game) ? "disabled" : ""}></label>
        <label>${escapeHtml(game.awayTeam)}<input id="away_${game.id}" type="number" min="0" value="${myBet?.awayGuess ?? ""}" ${hasResult(game) ? "disabled" : ""}></label>
        <button class="primary" onclick="window.saveBetFromUI('${game.id}')" ${hasResult(game) ? "disabled" : ""}>Guardar</button>
      </div>
    </article>`;
  }).join("");
}

function renderRanking() {
  const totals = getTotals();
  const rows = [...totals.values()].sort((a,b) => b.points - a.points || b.exact - a.exact || a.playerName.localeCompare(b.playerName));
  $("rankingList").innerHTML = rows.length ? rows.map((row, i) => `<div class="ranking-row">
    <div class="rank-number">${i + 1}</div>
    <div><strong>${escapeHtml(row.playerName)}</strong><p class="muted">Resultados exatos: ${row.exact}</p></div>
    <div class="points">${row.points} pts</div>
  </div>`).join("") : `<div class="glass-card">Ainda não existem apostas.</div>`;
}

function renderAdmin() {
  const el = $("adminGamesList");
  if (!el) return;
  el.innerHTML = games.map(game => `<article class="game-card">
    <div class="match-title">
      <div>
        <strong>${escapeHtml(game.homeTeam)} vs ${escapeHtml(game.awayTeam)}</strong>
        <p class="muted">${formatDate(game.matchDate)}</p>
      </div>
      <button class="danger" onclick="window.removeGameFromUI('${game.id}')">Apagar</button>
    </div>
    <div class="result-grid">
      <label>${escapeHtml(game.homeTeam)}<input id="res_home_${game.id}" type="number" min="0" value="${game.homeScore ?? ""}"></label>
      <label>${escapeHtml(game.awayTeam)}<input id="res_away_${game.id}" type="number" min="0" value="${game.awayScore ?? ""}"></label>
      <button class="primary" onclick="window.setResultFromUI('${game.id}')">Guardar resultado</button>
      <span class="muted">Apostas: ${bets.filter(b => b.gameId === game.id).length}</span>
    </div>
  </article>`).join("") || `<div class="glass-card">Ainda não existem jogos.</div>`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

window.saveBetFromUI = gameId => saveBet(gameId, $(`home_${gameId}`).value, $(`away_${gameId}`).value);
window.setResultFromUI = gameId => setResult(gameId, $(`res_home_${gameId}`).value, $(`res_away_${gameId}`).value);
window.removeGameFromUI = gameId => removeGame(gameId);

$("enterBtn").addEventListener("click", async () => {
  const name = $("playerNameInput").value.trim();
  if (!name) return toast("Escreve o teu nome.");
  activePlayer = name;
  localStorage.setItem("mundial_active_player", activePlayer);
  await loadData();
});
$("logoutBtn").addEventListener("click", () => {
  activePlayer = "";
  isAdmin = false;
  localStorage.removeItem("mundial_active_player");
  localStorage.removeItem("mundial_is_admin");
  renderAll();
});
$("refreshBtn").addEventListener("click", loadData);
$("unlockAdminBtn").addEventListener("click", () => {
  if ($("adminPinInput").value !== ADMIN_PIN) return toast("PIN errado.");
  isAdmin = true;
  localStorage.setItem("mundial_is_admin", "1");
  renderSession();
  renderAdmin();
});
$("addGameBtn").addEventListener("click", () => addGame($("homeTeamInput").value.trim(), $("awayTeamInput").value.trim(), $("matchDateInput").value));
document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  $(btn.dataset.tab).classList.add("active");
}));

await initFirebase();
await loadData();
