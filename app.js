const APP_CONFIG = window.MUNDIAL_CONFIG || {};
const ADMIN_PIN = APP_CONFIG.adminPin || "1234";
const STORAGE_KEY = "mundial_pontos_2026_excel_v2";
const PLAYER_ID = "single";
const PORTUGAL_TZ = "Europe/Lisbon";

let db = null;
let firebaseApi = null;
let storageMode = "local";
let games = [];
let bets = [];
let searchText = "";
let isAdmin = localStorage.getItem("mundial_admin_unlocked") === "1";
let pendingImport = null;

const MATCH_ROWS = [
  ["Grupo A", "México", "África do Sul", "2026-06-11T20:00"],
  ["Grupo A", "Coreia do Sul", "Chéquia", "2026-06-12T03:00"],
  ["Grupo B", "Canadá", "Bósnia", "2026-06-12T20:00"],
  ["Grupo D", "Estados Unidos", "Paraguai", "2026-06-13T02:00"],
  ["Grupo B", "Qatar", "Suíça", "2026-06-13T20:00"],
  ["Grupo C", "Brasil", "Marrocos", "2026-06-13T23:00"],
  ["Grupo C", "Haiti", "Escócia", "2026-06-14T02:00"],
  ["Grupo D", "Austrália", "Turquia", "2026-06-14T05:00"],
  ["Grupo E", "Alemanha", "Curaçao", "2026-06-14T18:00"],
  ["Grupo F", "Países Baixos", "Japão", "2026-06-14T21:00"],
  ["Grupo E", "Costa do Marfim", "Equador", "2026-06-15T00:00"],
  ["Grupo F", "Suécia", "Tunísia", "2026-06-15T03:00"],
  ["Grupo H", "Espanha", "Cabo Verde", "2026-06-15T17:00"],
  ["Grupo G", "Bélgica", "Egito", "2026-06-15T20:00"],
  ["Grupo H", "Arábia Saudita", "Uruguai", "2026-06-15T23:00"],
  ["Grupo G", "Irão", "Nova Zelândia", "2026-06-16T02:00"],
  ["Grupo I", "França", "Senegal", "2026-06-16T20:00"],
  ["Grupo I", "Iraque", "Noruega", "2026-06-16T23:00"],
  ["Grupo J", "Argentina", "Argélia", "2026-06-17T02:00"],
  ["Grupo J", "Áustria", "Jordânia", "2026-06-17T05:00"],
  ["Grupo K", "Portugal", "RD Congo", "2026-06-17T18:00"],
  ["Grupo L", "Inglaterra", "Croácia", "2026-06-17T21:00"],
  ["Grupo L", "Gana", "Panamá", "2026-06-18T00:00"],
  ["Grupo K", "Uzbequistão", "Colômbia", "2026-06-18T03:00"],
  ["Grupo A", "Chéquia", "África do Sul", "2026-06-18T17:00"],
  ["Grupo B", "Suíça", "Bósnia", "2026-06-18T20:00"],
  ["Grupo B", "Canadá", "Qatar", "2026-06-18T23:00"],
  ["Grupo A", "México", "Coreia do Sul", "2026-06-19T02:00"],
  ["Grupo D", "Estados Unidos", "Austrália", "2026-06-19T20:00"],
  ["Grupo C", "Escócia", "Marrocos", "2026-06-19T23:00"],
  ["Grupo C", "Brasil", "Haiti", "2026-06-20T01:30"],
  ["Grupo D", "Turquia", "Paraguai", "2026-06-20T04:00"],
  ["Grupo F", "Países Baixos", "Suécia", "2026-06-20T18:00"],
  ["Grupo E", "Alemanha", "Costa do Marfim", "2026-06-20T21:00"],
  ["Grupo E", "Equador", "Curaçao", "2026-06-21T01:00"],
  ["Grupo F", "Tunísia", "Japão", "2026-06-21T05:00"],
  ["Grupo H", "Espanha", "Arábia Saudita", "2026-06-21T17:00"],
  ["Grupo G", "Bélgica", "Irão", "2026-06-21T20:00"],
  ["Grupo H", "Uruguai", "Cabo Verde", "2026-06-21T23:00"],
  ["Grupo G", "Nova Zelândia", "Egito", "2026-06-22T02:00"],
  ["Grupo J", "Argentina", "Áustria", "2026-06-22T18:00"],
  ["Grupo I", "França", "Iraque", "2026-06-22T22:00"],
  ["Grupo I", "Noruega", "Senegal", "2026-06-23T01:00"],
  ["Grupo J", "Jordânia", "Argélia", "2026-06-23T04:00"],
  ["Grupo K", "Portugal", "Uzbequistão", "2026-06-23T18:00"],
  ["Grupo L", "Inglaterra", "Gana", "2026-06-23T21:00"],
  ["Grupo L", "Panamá", "Croácia", "2026-06-24T00:00"],
  ["Grupo K", "Colômbia", "RD Congo", "2026-06-24T03:00"],
  ["Grupo B", "Suíça", "Canadá", "2026-06-24T20:00"],
  ["Grupo B", "Bósnia", "Qatar", "2026-06-24T20:00"],
  ["Grupo C", "Escócia", "Brasil", "2026-06-24T23:00"],
  ["Grupo C", "Marrocos", "Haiti", "2026-06-24T23:00"],
  ["Grupo A", "África do Sul", "Coreia do Sul", "2026-06-25T02:00"],
  ["Grupo A", "Chéquia", "México", "2026-06-25T02:00"],
  ["Grupo E", "Curaçao", "Costa do Marfim", "2026-06-25T21:00"],
  ["Grupo E", "Equador", "Alemanha", "2026-06-25T21:00"],
  ["Grupo F", "Tunísia", "Países Baixos", "2026-06-26T00:00"],
  ["Grupo F", "Japão", "Suécia", "2026-06-26T00:00"],
  ["Grupo D", "Turquia", "Estados Unidos", "2026-06-26T03:00"],
  ["Grupo D", "Paraguai", "Austrália", "2026-06-26T03:00"],
  ["Grupo I", "Noruega", "França", "2026-06-26T20:00"],
  ["Grupo I", "Senegal", "Iraque", "2026-06-26T20:00"],
  ["Grupo H", "Cabo Verde", "Arábia Saudita", "2026-06-27T01:00"],
  ["Grupo H", "Uruguai", "Espanha", "2026-06-27T01:00"],
  ["Grupo G", "Nova Zelândia", "Bélgica", "2026-06-27T04:00"],
  ["Grupo G", "Egito", "Irão", "2026-06-27T04:00"],
  ["Grupo L", "Panamá", "Inglaterra", "2026-06-27T22:00"],
  ["Grupo L", "Croácia", "Gana", "2026-06-27T22:00"],
  ["Grupo K", "Colômbia", "Portugal", "2026-06-28T00:30"],
  ["Grupo K", "RD Congo", "Uzbequistão", "2026-06-28T00:30"],
  ["Grupo J", "Argélia", "Áustria", "2026-06-28T03:00"],
  ["Grupo J", "Jordânia", "Argentina", "2026-06-28T03:00"]
];

const FLAGS = {
  "Portugal": "🇵🇹",
  "África do Sul": "🇿🇦",
  "México": "🇲🇽",
  "Coreia do Sul": "🇰🇷",
  "Chéquia": "🇨🇿",
  "Canadá": "🇨🇦",
  "Bósnia": "🇧🇦",
  "Estados Unidos": "🇺🇸",
  "Paraguai": "🇵🇾",
  "Qatar": "🇶🇦",
  "Suíça": "🇨🇭",
  "Brasil": "🇧🇷",
  "Marrocos": "🇲🇦",
  "Haiti": "🇭🇹",
  "Escócia": "🏴",
  "Austrália": "🇦🇺",
  "Turquia": "🇹🇷",
  "Alemanha": "🇩🇪",
  "Curaçao": "🇨🇼",
  "Países Baixos": "🇳🇱",
  "Japão": "🇯🇵",
  "Costa do Marfim": "🇨🇮",
  "Equador": "🇪🇨",
  "Suécia": "🇸🇪",
  "Tunísia": "🇹🇳",
  "Espanha": "🇪🇸",
  "Cabo Verde": "🇨🇻",
  "Bélgica": "🇧🇪",
  "Egito": "🇪🇬",
  "Arábia Saudita": "🇸🇦",
  "Uruguai": "🇺🇾",
  "Irão": "🇮🇷",
  "Nova Zelândia": "🇳🇿",
  "França": "🇫🇷",
  "Senegal": "🇸🇳",
  "Iraque": "🇮🇶",
  "Noruega": "🇳🇴",
  "Argentina": "🇦🇷",
  "Argélia": "🇩🇿",
  "Áustria": "🇦🇹",
  "Jordânia": "🇯🇴",
  "RD Congo": "🇨🇩",
  "Inglaterra": "🏴",
  "Croácia": "🇭🇷",
  "Gana": "🇬🇭",
  "Panamá": "🇵🇦",
  "Uzbequistão": "🇺🇿",
  "Colômbia": "🇨🇴"
};

const SEED_GAMES = MATCH_ROWS.map(([group, homeTeam, awayTeam, matchDate], index) => ({
  id: `wc2026-group-${String(index + 1).padStart(3, "0")}`,
  group,
  homeTeam,
  awayTeam,
  matchDate,
  phase: "Fase de grupos",
  homeScore: null,
  awayScore: null
}));

const $ = id => document.getElementById(id);
const clone = value => JSON.parse(JSON.stringify(value));
const hasResult = game => game.homeScore !== null && game.homeScore !== undefined && game.awayScore !== null && game.awayScore !== undefined;
const flag = team => FLAGS[team] || "🏳️";
const outcome = (home, away) => Number(home) > Number(away) ? "home" : Number(home) < Number(away) ? "away" : "draw";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}

function parsePortugalDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
}

function dateKey(value) {
  const date = parsePortugalDate(value);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PORTUGAL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function todayKey() {
  return dateKey(new Date());
}

function dateHeader(value) {
  const date = parsePortugalDate(value);
  const parts = new Intl.DateTimeFormat("pt-PT", {
    timeZone: PORTUGAL_TZ,
    day: "numeric",
    month: "long",
    weekday: "long"
  }).formatToParts(date);
  const day = parts.find(part => part.type === "day")?.value || "";
  const month = parts.find(part => part.type === "month")?.value || "";
  const weekday = parts.find(part => part.type === "weekday")?.value || "";
  return `${day} de ${month} (${weekday})`;
}

function timePortugal(value) {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: PORTUGAL_TZ,
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsePortugalDate(value));
}

function statusOf(game) {
  if (hasResult(game)) return { text: "Jogado", className: "played" };
  if (parsePortugalDate(game.matchDate).getTime() <= Date.now()) return { text: "Fechado", className: "closed" };
  return { text: "Por jogar", className: "open" };
}

function isLocked(game) {
  return statusOf(game).className !== "open";
}

function getLocalData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = { games: clone(SEED_GAMES), bets: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      games: Array.isArray(parsed.games) && parsed.games.length ? parsed.games : clone(SEED_GAMES),
      bets: Array.isArray(parsed.bets) ? parsed.bets : []
    };
  } catch {
    const data = { games: clone(SEED_GAMES), bets: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
}

function saveLocalData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ games, bets }));
}

async function initFirebase() {
  const config = APP_CONFIG.firebase || {};
  if (!config.apiKey || !config.projectId) return;

  try {
    const appModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const firestoreModule = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
    const app = appModule.initializeApp(config);
    db = firestoreModule.getFirestore(app);
    firebaseApi = firestoreModule;
    storageMode = "firebase";
  } catch (error) {
    console.warn("Firebase indisponível. A usar modo local.", error);
    storageMode = "local";
  }
}

async function loadData() {
  if (!db || !firebaseApi) {
    const local = getLocalData();
    games = normalizeGames(local.games);
    bets = local.bets;
    renderAll();
    return;
  }

  try {
    const { collection, doc, getDocs, query, orderBy, setDoc } = firebaseApi;
    const gamesSnap = await getDocs(query(collection(db, "games"), orderBy("matchDate", "asc")));
    const betsSnap = await getDocs(collection(db, "bets"));

    if (gamesSnap.empty) {
      games = clone(SEED_GAMES);
      await Promise.all(games.map(game => setDoc(doc(db, "games", game.id), game, { merge: true })));
    } else {
      games = gamesSnap.docs.map(item => ({ id: item.id, ...item.data() }));
    }

    bets = betsSnap.docs.map(item => ({ id: item.id, ...item.data() }));
    games = normalizeGames(games);
    storageMode = "firebase";
    renderAll();
  } catch (error) {
    console.warn("Erro no Firebase. A usar dados locais.", error);
    storageMode = "local";
    const local = getLocalData();
    games = normalizeGames(local.games);
    bets = local.bets;
    renderAll();
    toast("Firebase falhou. A app continua em modo local.");
  }
}

function normalizeGames(list) {
  const byId = new Map(clone(SEED_GAMES).map(game => [game.id, game]));
  (list || []).forEach(game => {
    if (!game?.id) return;
    byId.set(game.id, { ...byId.get(game.id), ...game });
  });
  return [...byId.values()].sort((a, b) => String(a.matchDate).localeCompare(String(b.matchDate)));
}

async function persistGame(game) {
  if (!db || !firebaseApi || storageMode !== "firebase") {
    saveLocalData();
    return;
  }

  try {
    const { doc, setDoc } = firebaseApi;
    await setDoc(doc(db, "games", game.id), game, { merge: true });
  } catch (error) {
    console.warn(error);
    storageMode = "local";
    saveLocalData();
    toast("Firebase falhou. Resultado guardado localmente.");
  }
}

async function persistBet(bet) {
  bets = bets.filter(item => !(item.gameId === bet.gameId && item.playerId === bet.playerId));
  bets.push(bet);

  if (!db || !firebaseApi || storageMode !== "firebase") {
    saveLocalData();
    return;
  }

  try {
    const { doc, setDoc } = firebaseApi;
    await setDoc(doc(db, "bets", bet.id), bet, { merge: true });
  } catch (error) {
    console.warn(error);
    storageMode = "local";
    saveLocalData();
    toast("Firebase falhou. Aposta guardada localmente.");
  }
}

function getBet(gameId) {
  return bets.find(bet => bet.gameId === gameId && bet.playerId === PLAYER_ID);
}

function pointsForBet(bet, game) {
  if (!bet || !game || !hasResult(game)) return 0;
  if (Number(bet.homeGuess) === Number(game.homeScore) && Number(bet.awayGuess) === Number(game.awayScore)) return 3;
  return outcome(bet.homeGuess, bet.awayGuess) === outcome(game.homeScore, game.awayScore) ? 1 : 0;
}

function statsForBetList(list) {
  const stats = { points: 0, totalBets: list.length, settled: 0, exact: 0, winner: 0, misses: 0 };

  list.forEach(bet => {
    const game = games.find(item => item.id === bet.gameId);
    if (!game || !hasResult(game)) return;

    const points = pointsForBet(bet, game);
    stats.points += points;
    stats.settled += 1;
    if (points === 3) stats.exact += 1;
    else if (points === 1) stats.winner += 1;
    else stats.misses += 1;
  });

  stats.accuracy = stats.settled ? Math.round(((stats.exact + stats.winner) / stats.settled) * 100) : 0;
  return stats;
}

function scoreStats() {
  return statsForBetList(bets);
}

function leaderboardRows() {
  const byPlayer = new Map();
  bets.forEach(bet => {
    const name = bet.playerName || bet.userName || bet.playerId || "Sem nome";
    if (!byPlayer.has(name)) byPlayer.set(name, []);
    byPlayer.get(name).push(bet);
  });

  return [...byPlayer.entries()].map(([name, list]) => ({ name, ...statsForBetList(list) }))
    .sort((a, b) => b.points - a.points || b.exact - a.exact || b.winner - a.winner || a.name.localeCompare(b.name));
}

function filteredGames() {
  const query = searchText.trim().toLowerCase();
  if (!query) return games;
  return games.filter(game => `${game.group} ${game.homeTeam} ${game.awayTeam}`.toLowerCase().includes(query));
}

function groupByDate(list) {
  return list.reduce((map, game) => {
    const key = dateKey(game.matchDate);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(game);
    return map;
  }, new Map());
}

function renderAll() {
  renderAdminState();
  renderCalendar();
  renderScore();
  renderGroups();
  renderAdmin();
}

function renderCalendar() {
  const container = $("gamesList");
  const groups = groupByDate(filteredGames());
  const days = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  if (!days.length) {
    container.innerHTML = `<div class="empty">Não há jogos para essa pesquisa.</div>`;
    return;
  }

  container.innerHTML = days.map(([, dayGames]) => `
    <section class="day-block">
      <h3>${escapeHtml(dateHeader(dayGames[0].matchDate))}</h3>
      <div class="match-list">
        ${dayGames.map(renderMatchRow).join("")}
      </div>
    </section>
  `).join("");
}

function renderMatchRow(game) {
  const bet = getBet(game.id);
  const status = statusOf(game);
  const locked = isLocked(game);
  const scoreText = hasResult(game) ? `${game.homeScore}-${game.awayScore}` : "VS";
  const betText = bet ? `${bet.homeGuess}-${bet.awayGuess}${hasResult(game) ? ` · ${pointsForBet(bet, game)} pts` : ""}` : "Sem aposta";

  return `
    <article class="match-row ${status.className}">
      <div class="group-pill">${escapeHtml(game.group)}</div>
      <div class="team home"><span>${flag(game.homeTeam)}</span><strong>${escapeHtml(game.homeTeam)}</strong></div>
      <div class="score-vs">${escapeHtml(scoreText)}</div>
      <div class="team away"><span>${flag(game.awayTeam)}</span><strong>${escapeHtml(game.awayTeam)}</strong></div>
      <div class="time">${timePortugal(game.matchDate)}</div>
      <div class="state ${status.className}">${status.text}</div>
      <div class="bet-note">${escapeHtml(betText)}</div>
      <div class="bet-inputs">
        <input id="home_${game.id}" type="number" min="0" inputmode="numeric" value="${bet?.homeGuess ?? ""}" ${locked ? "disabled" : ""} aria-label="Aposta ${escapeHtml(game.homeTeam)}" />
        <span>-</span>
        <input id="away_${game.id}" type="number" min="0" inputmode="numeric" value="${bet?.awayGuess ?? ""}" ${locked ? "disabled" : ""} aria-label="Aposta ${escapeHtml(game.awayTeam)}" />
        <button class="primary small" type="button" onclick="window.saveBetFromUI('${game.id}')" ${locked ? "disabled" : ""}>OK</button>
      </div>
    </article>
  `;
}

function renderScore() {
  const rows = leaderboardRows();
  const totals = scoreStats();

  if (!rows.length) {
    $("scoreSummary").innerHTML = `<div class="empty">Ainda não existem apostas importadas. Vai ao Admin e importa o Excel dos users.</div>`;
    return;
  }

  $("scoreSummary").innerHTML = `
    <div class="score-top-grid">
      <div class="score-card main-score"><span>Total de users</span><strong>${rows.length}</strong></div>
      <div class="score-card"><span>Apostas importadas</span><strong>${totals.totalBets}</strong></div>
      <div class="score-card"><span>Jogos com pontuação</span><strong>${totals.settled}</strong></div>
      <div class="score-card"><span>Resultados exatos</span><strong>${totals.exact}</strong></div>
    </div>
    <div class="leaderboard">
      <div class="leader-row head"><span>#</span><span>User</span><span>Pts</span><span>Apostas</span><span>Exatos</span><span>Venc.</span><span>%</span></div>
      ${rows.map((row, index) => `
        <div class="leader-row ${index < 3 ? "podium" : ""}">
          <span>${index + 1}</span>
          <strong>${escapeHtml(row.name)}</strong>
          <b>${row.points}</b>
          <span>${row.totalBets}</span>
          <span>${row.exact}</span>
          <span>${row.winner}</span>
          <span>${row.accuracy}%</span>
        </div>
      `).join("")}
    </div>
  `;
}

function blankTeam(team) {
  return { team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 };
}

function groupSortName(group) {
  const letter = String(group).match(/Grupo ([A-Z])/i)?.[1] || "Z";
  return letter;
}

function buildStandings() {
  const tables = new Map();

  games.forEach(game => {
    if (!tables.has(game.group)) tables.set(game.group, new Map());
    const table = tables.get(game.group);
    [game.homeTeam, game.awayTeam].forEach(team => {
      if (!table.has(team)) table.set(team, blankTeam(team));
    });

    if (!hasResult(game)) return;

    const home = table.get(game.homeTeam);
    const away = table.get(game.awayTeam);
    const hs = Number(game.homeScore);
    const as = Number(game.awayScore);

    home.played += 1;
    away.played += 1;
    home.gf += hs;
    home.ga += as;
    away.gf += as;
    away.ga += hs;
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;

    if (hs > as) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (hs < as) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  return [...tables.entries()]
    .sort((a, b) => groupSortName(a[0]).localeCompare(groupSortName(b[0])))
    .map(([group, table]) => ({
      group,
      rows: [...table.values()].sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team))
    }));
}

function renderGroups() {
  $("groupsTables").innerHTML = buildStandings().map(({ group, rows }) => `
    <section class="group-table">
      <h3>${escapeHtml(group)}</h3>
      <div class="table">
        <div class="table-row head"><span>#</span><span>Seleção</span><span>J</span><span>DG</span><span>Pts</span></div>
        ${rows.map((row, index) => `
          <div class="table-row">
            <span>${index + 1}</span>
            <strong>${flag(row.team)} ${escapeHtml(row.team)}</strong>
            <span>${row.played}</span>
            <span>${row.gd}</span>
            <b>${row.points}</b>
          </div>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderAdminState() {
  $("adminLocked").classList.toggle("hidden", isAdmin);
  $("adminUnlocked").classList.toggle("hidden", !isAdmin);
  const status = storageMode === "firebase" ? "Firebase online" : "Modo local";
  $("storageStatus").textContent = `${status}. Ao guardar resultado, os pontos são recalculados automaticamente.`;
}

function renderAdmin() {
  const container = $("adminGamesList");
  if (!isAdmin) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = games.map(game => `
    <article class="admin-row">
      <div class="admin-match">
        <span class="group-pill">${escapeHtml(game.group)}</span>
        <strong>${flag(game.homeTeam)} ${escapeHtml(game.homeTeam)} vs ${flag(game.awayTeam)} ${escapeHtml(game.awayTeam)}</strong>
        <small>${timePortugal(game.matchDate)} · ${escapeHtml(dateHeader(game.matchDate))}</small>
      </div>
      <div class="result-inputs">
        <input id="res_home_${game.id}" type="number" min="0" inputmode="numeric" value="${game.homeScore ?? ""}" aria-label="Resultado ${escapeHtml(game.homeTeam)}" />
        <span>-</span>
        <input id="res_away_${game.id}" type="number" min="0" inputmode="numeric" value="${game.awayScore ?? ""}" aria-label="Resultado ${escapeHtml(game.awayTeam)}" />
        <button class="primary" type="button" onclick="window.setResultFromUI('${game.id}')">Guardar resultado</button>
        <button class="secondary" type="button" onclick="window.clearResultFromUI('${game.id}')">Limpar resultado</button>
      </div>
    </article>
  `).join("");
}

async function saveBet(gameId, homeGuess, awayGuess) {
  const game = games.find(item => item.id === gameId);
  if (!game) return;
  if (isLocked(game)) return toast("Apostas fechadas para este jogo.");
  if (homeGuess === "" || awayGuess === "") return toast("Preenche os dois campos da aposta.");

  const bet = {
    id: `${PLAYER_ID}_${gameId}`,
    playerId: PLAYER_ID,
    gameId,
    homeGuess: Number(homeGuess),
    awayGuess: Number(awayGuess),
    updatedAt: new Date().toISOString()
  };

  await persistBet(bet);
  renderAll();
  toast("Aposta guardada.");
}

async function setResult(gameId, homeScore, awayScore) {
  if (homeScore === "" || awayScore === "") return toast("Preenche o resultado completo.");
  const game = games.find(item => item.id === gameId);
  if (!game) return;

  game.homeScore = Number(homeScore);
  game.awayScore = Number(awayScore);
  await persistGame(game);
  renderAll();
  toast("Resultado guardado. Pontos recalculados.");
}

async function clearResult(gameId) {
  const game = games.find(item => item.id === gameId);
  if (!game) return;

  game.homeScore = null;
  game.awayScore = null;
  await persistGame(game);
  renderAll();
  toast("Resultado limpo.");
}

function todayGames() {
  const key = todayKey();
  return games.filter(game => dateKey(game.matchDate) === key);
}

function scoreText() {
  const rows = leaderboardRows();
  if (!rows.length) return "🏆 Classificação Mundial 2026\n\nAinda não existem apostas importadas.";

  return "🏆 Classificação Mundial 2026\n\n" + rows.map((row, index) => `${index + 1}. ${row.name} - ${row.points} pts (${row.exact} exatos)`).join("\n");
}

function todayText() {
  const list = todayGames();
  if (!list.length) return "⭐ Jogos de Hoje\n\nHoje não há jogos registados.";

  const grouped = [...groupByGroup(list).entries()];
  return "⭐ Jogos de Hoje\n\n" + grouped.map(([group, rows]) => {
    const lines = rows.map(game => `${flag(game.homeTeam)} ${game.homeTeam} vs ${flag(game.awayTeam)} ${game.awayTeam} - ${timePortugal(game.matchDate)}`);
    return `${group}\n${lines.join("\n")}`;
  }).join("\n\n");
}

function groupsText() {
  return "⭐ Classificação dos Grupos\n\n" + buildStandings().map(({ group, rows }) => {
    const lines = rows.map((row, index) => `${index + 1}. ${flag(row.team)} ${row.team} - ${row.points} pts`);
    return `${group}\n${lines.join("\n")}`;
  }).join("\n\n");
}

function groupByGroup(list) {
  return list.reduce((map, game) => {
    if (!map.has(game.group)) map.set(game.group, []);
    map.get(game.group).push(game);
    return map;
  }, new Map());
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    window.prompt("Copia o texto:", text);
  }
}

function toast(message) {
  const element = $("toast");
  element.textContent = message;
  element.classList.remove("hidden");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.add("hidden"), 2600);
}


function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getCell(row, names) {
  const normalized = Object.entries(row).map(([key, value]) => [normalizeText(key), value]);
  for (const name of names) {
    const target = normalizeText(name);
    const found = normalized.find(([key]) => key === target || key.includes(target) || target.includes(key));
    if (found) return found[1];
  }
  return "";
}

function matchGameFromRow(row) {
  const gameId = String(getCell(row, ["id", "gameId", "id jogo", "jogo id"])).trim();
  if (gameId) {
    const byId = games.find(game => game.id === gameId);
    if (byId) return byId;
  }

  const home = String(getCell(row, ["equipa casa", "casa", "home", "home team", "equipa 1", "seleção casa"])).trim();
  const away = String(getCell(row, ["equipa fora", "fora", "away", "away team", "equipa 2", "seleção fora"])).trim();
  const gameText = String(getCell(row, ["jogo", "partida", "match"])).trim();

  if (home && away) {
    const h = normalizeText(home);
    const a = normalizeText(away);
    return games.find(game => normalizeText(game.homeTeam) === h && normalizeText(game.awayTeam) === a)
      || games.find(game => normalizeText(game.homeTeam) === a && normalizeText(game.awayTeam) === h);
  }

  if (gameText) {
    const t = normalizeText(gameText);
    return games.find(game => t.includes(normalizeText(game.homeTeam)) && t.includes(normalizeText(game.awayTeam)));
  }

  return null;
}

function numberOrBlank(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : "";
}

function parseExcelRows(rows) {
  const parsed = [];
  const errors = [];
  const resultUpdates = new Map();

  rows.forEach((row, index) => {
    const playerName = String(getCell(row, ["jogador", "nome", "user", "utilizador", "participante"])).trim();
    const homeGuess = numberOrBlank(getCell(row, ["aposta casa", "resultado casa", "prognostico casa", "prognóstico casa", "casa aposta", "home guess"]));
    const awayGuess = numberOrBlank(getCell(row, ["aposta fora", "resultado fora", "prognostico fora", "prognóstico fora", "fora aposta", "away guess"]));
    const game = matchGameFromRow(row);

    if (!playerName && homeGuess === "" && awayGuess === "") return;
    if (!playerName) return errors.push(`Linha ${index + 2}: falta o nome/user.`);
    if (!game) return errors.push(`Linha ${index + 2}: não consegui encontrar o jogo.`);
    if (homeGuess === "" || awayGuess === "") return errors.push(`Linha ${index + 2}: falta a aposta completa.`);

    const playerId = `excel_${normalizeText(playerName).replace(/\s+/g, "_")}`;
    parsed.push({
      id: `${playerId}_${game.id}`,
      playerId,
      playerName,
      gameId: game.id,
      homeGuess,
      awayGuess,
      source: "excel",
      updatedAt: new Date().toISOString()
    });

    const realHome = numberOrBlank(getCell(row, ["real casa", "resultado real casa", "final casa", "score casa"]));
    const realAway = numberOrBlank(getCell(row, ["real fora", "resultado real fora", "final fora", "score fora"]));
    if (realHome !== "" && realAway !== "") resultUpdates.set(game.id, { homeScore: realHome, awayScore: realAway });
  });

  return { bets: parsed, errors, resultUpdates };
}

function previewImport(parsed) {
  pendingImport = parsed;
  const box = $("importPreview");
  const confirm = $("confirmImportBtn");
  if (!parsed) {
    box.textContent = "Ainda não foi selecionado nenhum ficheiro.";
    confirm.disabled = true;
    return;
  }

  const players = new Set(parsed.bets.map(bet => bet.playerName));
  const gamesFound = new Set(parsed.bets.map(bet => bet.gameId));
  confirm.disabled = !parsed.bets.length;
  box.innerHTML = `
    <div><strong>${parsed.bets.length}</strong> apostas válidas</div>
    <div><strong>${players.size}</strong> users encontrados</div>
    <div><strong>${gamesFound.size}</strong> jogos com apostas</div>
    <div><strong>${parsed.resultUpdates.size}</strong> resultados reais no Excel</div>
    ${parsed.errors.length ? `<details open><summary>${parsed.errors.length} avisos/erros</summary><ul>${parsed.errors.slice(0, 30).map(error => `<li>${escapeHtml(error)}</li>`).join("")}</ul></details>` : ""}
  `;
}

async function handleExcelFile(file) {
  if (!file) return;
  if (!window.XLSX) return toast("Biblioteca Excel não carregou. Verifica a ligação à internet.");
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
  previewImport(parseExcelRows(rows));
}

async function confirmImport() {
  if (!pendingImport || !pendingImport.bets.length) return toast("Não há apostas válidas para importar.");

  const replace = $("replaceBetsCheck")?.checked;
  const previousExcelBets = bets.filter(bet => bet.source === "excel");
  if (replace) bets = bets.filter(bet => bet.source !== "excel");

  pendingImport.bets.forEach(imported => {
    bets = bets.filter(bet => !(bet.gameId === imported.gameId && bet.playerId === imported.playerId));
    bets.push(imported);
  });

  pendingImport.resultUpdates.forEach((result, gameId) => {
    const game = games.find(item => item.id === gameId);
    if (game) {
      game.homeScore = result.homeScore;
      game.awayScore = result.awayScore;
    }
  });

  if (!db || !firebaseApi || storageMode !== "firebase") {
    saveLocalData();
  } else {
    const { doc, setDoc, deleteDoc } = firebaseApi;
    const deleteOldExcel = replace
      ? previousExcelBets.map(bet => deleteDoc(doc(db, "bets", bet.id)).catch(() => null))
      : [];
    await Promise.all([
      ...deleteOldExcel,
      ...pendingImport.bets.map(bet => setDoc(doc(db, "bets", bet.id), bet, { merge: true })),
      ...[...pendingImport.resultUpdates.entries()].map(([gameId, result]) => {
        const game = games.find(item => item.id === gameId);
        return game ? setDoc(doc(db, "games", game.id), game, { merge: true }) : null;
      }).filter(Boolean)
    ]);
  }

  renderAll();
  closeImportModal();
  toast("Excel importado. Classificação atualizada.");
}

function openImportModal() {
  $("excelModal")?.classList.remove("hidden");
}

function closeImportModal() {
  $("excelModal")?.classList.add("hidden");
  if ($("excelInput")) $("excelInput").value = "";
  previewImport(null);
}

function downloadTemplate() {
  if (!window.XLSX) return toast("Biblioteca Excel não carregou.");
  const rows = games.map(game => ({
    Jogador: "Nome do user",
    Grupo: game.group,
    "Equipa Casa": game.homeTeam,
    "Equipa Fora": game.awayTeam,
    "Aposta Casa": "",
    "Aposta Fora": "",
    "Real Casa": game.homeScore ?? "",
    "Real Fora": game.awayScore ?? ""
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Apostas");
  XLSX.writeFile(wb, "modelo-apostas-mundial-2026.xlsx");
}

window.saveBetFromUI = id => saveBet(id, $(`home_${id}`).value, $(`away_${id}`).value);
window.setResultFromUI = id => setResult(id, $(`res_home_${id}`).value, $(`res_away_${id}`).value);
window.clearResultFromUI = id => clearResult(id);

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
    button.classList.add("active");
    $(button.dataset.tab).classList.add("active");
  });
});

$("searchInput").addEventListener("input", event => {
  searchText = event.target.value;
  renderCalendar();
});

$("unlockAdminBtn").addEventListener("click", () => {
  if ($("adminPinInput").value !== ADMIN_PIN) return toast("PIN errado.");
  isAdmin = true;
  localStorage.setItem("mundial_admin_unlocked", "1");
  renderAll();
});

$("copyTodayBtn").addEventListener("click", () => copyText(todayText(), "Jogos de hoje copiados."));
$("copyScoreBtn").addEventListener("click", () => copyText(scoreText(), "Pontuação copiada."));
$("copyGroupsBtn").addEventListener("click", () => copyText(groupsText(), "Classificação copiada."));


$("openImportBtn")?.addEventListener("click", openImportModal);
$("closeImportBtn")?.addEventListener("click", closeImportModal);
$("excelModal")?.addEventListener("click", event => {
  if (event.target.id === "excelModal") closeImportModal();
});
$("excelInput")?.addEventListener("change", event => handleExcelFile(event.target.files?.[0]));
$("confirmImportBtn")?.addEventListener("click", confirmImport);
$("downloadTemplateBtn")?.addEventListener("click", downloadTemplate);

await initFirebase();
await loadData();
