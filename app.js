const APP_CONFIG = window.MUNDIAL_CONFIG || {};
const ADMIN_PIN = APP_CONFIG.adminPin || "1234";
const STORAGE_KEY = "mundial_pontos_2026_modal_resultados_v21";
const PORTUGAL_TZ = "Europe/Lisbon";

let db = null;
let firebaseApi = null;
let storageMode = "local";
let games = [];
let bets = [];
let appSettings = defaultSettings();
let searchText = "";
let isAdmin = localStorage.getItem("mundial_admin_unlocked") === "1";
let pendingExcelImport = null;

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

const TEAM_ALIASES = {
  "mexico": "México", "africa do sul": "África do Sul", "áfrica do sul": "África do Sul",
  "coreia do sul": "Coreia do Sul", "republica checa": "Chéquia", "república checa": "Chéquia", "chequia": "Chéquia", "chéquia": "Chéquia",
  "canada": "Canadá", "bosnia": "Bósnia", "bósnia": "Bósnia", "bosnia-herzegovina": "Bósnia", "bósnia-herzegovina": "Bósnia",
  "qatar": "Qatar", "suica": "Suíça", "suiça": "Suíça", "suíça": "Suíça", "brasil": "Brasil", "marrocos": "Marrocos",
  "haiti": "Haiti", "escocia": "Escócia", "escócia": "Escócia", "australia": "Austrália", "austrália": "Austrália",
  "turquia": "Turquia", "alemanha": "Alemanha", "curacao": "Curaçao", "curaçao": "Curaçao",
  "paises baixos": "Países Baixos", "países baixos": "Países Baixos", "japao": "Japão", "japão": "Japão",
  "costa do marfim": "Costa do Marfim", "equador": "Equador", "suecia": "Suécia", "suécia": "Suécia",
  "tunisia": "Tunísia", "tunísia": "Tunísia", "espanha": "Espanha", "cabo verde": "Cabo Verde",
  "belgica": "Bélgica", "bélgica": "Bélgica", "egito": "Egito", "arabia saudita": "Arábia Saudita", "arábia saudita": "Arábia Saudita",
  "uruguai": "Uruguai", "irao": "Irão", "irão": "Irão", "nova zelandia": "Nova Zelândia", "nova zelândia": "Nova Zelândia",
  "franca": "França", "frança": "França", "senegal": "Senegal", "iraque": "Iraque", "noruega": "Noruega",
  "argentina": "Argentina", "argelia": "Argélia", "argélia": "Argélia", "austria": "Áustria", "áustria": "Áustria",
  "jordania": "Jordânia", "jordânia": "Jordânia", "rd congo": "RD Congo", "r.d. congo": "RD Congo",
  "republica democratica do congo": "RD Congo", "inglaterra": "Inglaterra", "croacia": "Croácia", "croácia": "Croácia",
  "gana": "Gana", "panama": "Panamá", "panamá": "Panamá", "uzbequistao": "Uzbequistão", "uzbequistão": "Uzbequistão",
  "colombia": "Colômbia", "colômbia": "Colômbia"
};

const SEED_GAMES = MATCH_ROWS.map(([group, homeTeam, awayTeam, matchDate], index) => ({
  id: `wc2026-group-${String(index + 1).padStart(3, "0")}`,
  group, homeTeam, awayTeam, matchDate,
  phase: "Fase de grupos",
  homeScore: null, awayScore: null
}));

const $ = id => document.getElementById(id);
const clone = value => JSON.parse(JSON.stringify(value));
const hasResult = game => game.homeScore !== null && game.homeScore !== undefined && game.awayScore !== null && game.awayScore !== undefined;
const flag = team => FLAGS[team] || "🏳️";
const outcome = (home, away) => Number(home) > Number(away) ? "home" : Number(home) < Number(away) ? "away" : "draw";
const normalizeKey = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const normalizeComparable = value => normalizeKey(value);
const canonicalTeam = value => TEAM_ALIASES[normalizeKey(value)] || String(value ?? "").trim();
const playerIdFromName = name => `player_${normalizeKey(name).replace(/\s+/g, "_") || "sem_nome"}`;

function defaultSettings() {
  return {
    points: { exact: 3, winner: 0, mvp: 5, topScorer: 5, champion: 10 },
    extraResults: { mvp: "", topScorer: "", champion: "" },
    extraPredictions: {},
    importedPoints: {},
    users: [],
    lastImport: null
  };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function parsePortugalDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
}

function dateKey(value) {
  const date = parsePortugalDate(value);
  return new Intl.DateTimeFormat("en-CA", { timeZone: PORTUGAL_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
function todayKey() { return dateKey(new Date()); }
function dateHeader(value) {
  const date = parsePortugalDate(value);
  const parts = new Intl.DateTimeFormat("pt-PT", { timeZone: PORTUGAL_TZ, day: "numeric", month: "long", weekday: "long" }).formatToParts(date);
  const day = parts.find(part => part.type === "day")?.value || "";
  const month = parts.find(part => part.type === "month")?.value || "";
  const weekday = parts.find(part => part.type === "weekday")?.value || "";
  return `${day} de ${month} (${weekday})`;
}
function dateTimePortugal(value) {
  const date = parsePortugalDate(value);
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: PORTUGAL_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
function timePortugal(value) {
  return new Intl.DateTimeFormat("pt-PT", { timeZone: PORTUGAL_TZ, hour: "2-digit", minute: "2-digit" }).format(parsePortugalDate(value));
}
function statusOf(game) {
  if (hasResult(game)) return { text: "Jogado", className: "played" };
  if (parsePortugalDate(game.matchDate).getTime() <= Date.now()) return { text: "Fechado", className: "closed" };
  return { text: "Por jogar", className: "open" };
}
function isLocked(game) { return statusOf(game).className !== "open"; }

function mergeSettings(input = {}) {
  const base = defaultSettings();
  return {
    ...base, ...input,
    points: { ...base.points, ...(input.points || {}) },
    extraResults: { ...base.extraResults, ...(input.extraResults || {}) },
    extraPredictions: { ...(input.extraPredictions || {}) },
    importedPoints: { ...(input.importedPoints || {}) },
    users: Array.isArray(input.users) ? input.users : [],
    users: Array.isArray(input.users) ? input.users : []
  };
}

function getLocalData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const data = { games: clone(SEED_GAMES), bets: [], settings: defaultSettings() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      games: Array.isArray(parsed.games) && parsed.games.length ? parsed.games : clone(SEED_GAMES),
      bets: Array.isArray(parsed.bets) ? parsed.bets : [],
      settings: mergeSettings(parsed.settings)
    };
  } catch {
    const data = { games: clone(SEED_GAMES), bets: [], settings: defaultSettings() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
}
function saveLocalData() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ games, bets, settings: appSettings })); }

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
    bets = normalizeBets(local.bets);
    appSettings = mergeSettings(local.settings);
    renderAll();
    return;
  }
  try {
    const { collection, doc, getDocs, query, orderBy, setDoc } = firebaseApi;
    const gamesSnap = await getDocs(query(collection(db, "games"), orderBy("matchDate", "asc")));
    const betsSnap = await getDocs(collection(db, "bets"));
    const settingsSnap = await getDocs(collection(db, "settings"));

    if (gamesSnap.empty) {
      games = clone(SEED_GAMES);
      await Promise.all(games.map(game => setDoc(doc(db, "games", game.id), game, { merge: true })));
    } else {
      games = gamesSnap.docs.map(item => ({ id: item.id, ...item.data() }));
    }

    bets = normalizeBets(betsSnap.docs.map(item => ({ id: item.id, ...item.data() })));
    const mainSettingsDoc = settingsSnap.docs.find(item => item.id === "main");
    appSettings = mergeSettings(mainSettingsDoc ? mainSettingsDoc.data() : defaultSettings());
    games = normalizeGames(games);
    storageMode = "firebase";
    renderAll();
  } catch (error) {
    console.warn("Erro no Firebase. A usar dados locais.", error);
    storageMode = "local";
    const local = getLocalData();
    games = normalizeGames(local.games);
    bets = normalizeBets(local.bets);
    appSettings = mergeSettings(local.settings);
    renderAll();
    toast("Firebase falhou. A app continua em modo local.");
  }
}

function normalizeGames(list) {
  const byId = new Map(clone(SEED_GAMES).map(game => [game.id, game]));
  (list || []).forEach(game => { if (game?.id) byId.set(game.id, { ...byId.get(game.id), ...game }); });
  return [...byId.values()].sort((a, b) => String(a.matchDate).localeCompare(String(b.matchDate)));
}
function normalizeBets(list) {
  return (list || [])
    .filter(bet => bet && bet.gameId && (bet.playerName || bet.playerId))
    .map(bet => {
      const playerName = String(bet.playerName || bet.playerId || "Sem nome").trim();
      return { ...bet, playerName, playerId: bet.playerId || playerIdFromName(playerName), homeGuess: Number(bet.homeGuess), awayGuess: Number(bet.awayGuess) };
    });
}

async function persistGame(game) {
  if (!db || !firebaseApi || storageMode !== "firebase") { saveLocalData(); return; }
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
async function persistAllGames() {
  if (!db || !firebaseApi || storageMode !== "firebase") { saveLocalData(); return; }
  const { doc, setDoc } = firebaseApi;
  await Promise.all(games.map(game => setDoc(doc(db, "games", game.id), game, { merge: true })));
}
async function persistBet(bet) {
  bets = bets.filter(item => !(item.gameId === bet.gameId && item.playerId === bet.playerId));
  bets.push(bet);
  if (!db || !firebaseApi || storageMode !== "firebase") { saveLocalData(); return; }
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
async function persistAllBets(importedBets, replaceImported = true) {
  if (replaceImported) bets = bets.filter(bet => bet.source !== "Resultados.xlsx");
  const byKey = new Map(bets.map(bet => [`${bet.playerId}_${bet.gameId}`, bet]));
  importedBets.forEach(bet => byKey.set(`${bet.playerId}_${bet.gameId}`, bet));
  bets = [...byKey.values()];
  if (!db || !firebaseApi || storageMode !== "firebase") { saveLocalData(); return; }
  const { doc, setDoc } = firebaseApi;
  await Promise.all(importedBets.map(bet => setDoc(doc(db, "bets", bet.id), bet, { merge: true })));
}
async function persistSettings() {
  if (!db || !firebaseApi || storageMode !== "firebase") { saveLocalData(); return; }
  try {
    const { doc, setDoc } = firebaseApi;
    await setDoc(doc(db, "settings", "main"), appSettings, { merge: true });
  } catch (error) {
    console.warn(error);
    storageMode = "local";
    saveLocalData();
    toast("Firebase falhou. Configurações guardadas localmente.");
  }
}

function betsForGame(gameId) { return bets.filter(bet => bet.gameId === gameId); }
function pointsForBet(bet, game) {
  if (!bet || !game || !hasResult(game)) return 0;
  const exactPoints = Number(appSettings.points.exact) || 0;
  if (Number(bet.homeGuess) === Number(game.homeScore) && Number(bet.awayGuess) === Number(game.awayScore)) return exactPoints;
  return 0;
}
function extraPointsForPlayer(playerName) {
  const predictions = appSettings.extraPredictions?.[playerName] || {};
  const results = appSettings.extraResults || {};
  const points = appSettings.points || defaultSettings().points;
  const details = { mvp: 0, topScorer: 0, champion: 0, total: 0 };
  if (results.mvp && predictions.mvp && normalizeComparable(results.mvp) === normalizeComparable(predictions.mvp)) details.mvp = Number(points.mvp) || 0;
  if (results.topScorer && predictions.topScorer && normalizeComparable(results.topScorer) === normalizeComparable(predictions.topScorer)) details.topScorer = Number(points.topScorer) || 0;
  if (results.champion && predictions.champion && normalizeComparable(results.champion) === normalizeComparable(predictions.champion)) details.champion = Number(points.champion) || 0;
  details.total = details.mvp + details.topScorer + details.champion;
  return details;
}
function allPlayers() {
  const names = new Set(appSettings.users || []);
  bets.map(bet => bet.playerName).forEach(name => names.add(name));
  Object.keys(appSettings.extraPredictions || {}).forEach(name => names.add(name));
  Object.keys(appSettings.importedPoints || {}).forEach(name => names.add(name));
  return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b));
}
function playerStats(playerName) {
  const playerBets = bets.filter(bet => bet.playerName === playerName);
  const stats = { playerName, points: 0, gamePoints: 0, extraPoints: 0, importedPoints: appSettings.importedPoints?.[playerName] ?? null, totalBets: playerBets.length, settled: 0, exact: 0, winner: 0, misses: 0, mvp: 0, topScorer: 0, champion: 0 };
  playerBets.forEach(bet => {
    const game = games.find(item => item.id === bet.gameId);
    if (!game || !hasResult(game)) return;
    const points = pointsForBet(bet, game);
    stats.gamePoints += points;
    stats.settled += 1;
    if (points === Number(appSettings.points.exact)) stats.exact += 1;
    else stats.misses += 1;
  });
  const extras = extraPointsForPlayer(playerName);
  stats.mvp = extras.mvp; stats.topScorer = extras.topScorer; stats.champion = extras.champion;
  stats.extraPoints = extras.total;
  stats.points = stats.gamePoints + stats.extraPoints;
  stats.accuracy = stats.settled ? Math.round((stats.exact / stats.settled) * 100) : 0;
  stats.diffExcel = stats.importedPoints === null ? null : stats.points - Number(stats.importedPoints);
  return stats;
}
function leaderboard() {
  return allPlayers().map(playerStats).sort((a, b) => b.points - a.points || b.exact - a.exact || a.playerName.localeCompare(b.playerName));
}

function filteredGames() {
  return games;
}
function groupByDate(list) {
  return list.reduce((map, game) => {
    const key = dateKey(game.matchDate);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(game);
    return map;
  }, new Map());
}

function renderAll() { renderAdminState(); renderCalendar(); renderScore(); renderGroups(); renderAdmin(); renderSettingsForm(); renderUsers(); }

function renderCalendar() {
  const container = $("gamesList");
  const groups = groupByDate(filteredGames());
  const days = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (!days.length) { container.innerHTML = `<div class="empty">Não há jogos para essa pesquisa.</div>`; return; }
  container.innerHTML = days.map(([, dayGames]) => `
    <section class="day-block"><h3>${escapeHtml(dateHeader(dayGames[0].matchDate))}</h3><div class="match-list">${dayGames.map(renderMatchRow).join("")}</div></section>
  `).join("");
}
function renderMatchRow(game) {
  const status = statusOf(game);
  const scoreText = hasResult(game) ? `${game.homeScore}-${game.awayScore}` : "VS";
  const gameBets = betsForGame(game.id);
  const settledText = hasResult(game) ? `${gameBets.length} apostas · pontos atribuídos` : `${gameBets.length} apostas importadas`;
  return `
    <article class="match-row ${status.className}">
      <div class="group-pill">${escapeHtml(game.group)}</div>
      <div class="team home"><span>${flag(game.homeTeam)}</span><strong>${escapeHtml(game.homeTeam)}</strong></div>
      <div class="score-vs">${escapeHtml(scoreText)}</div>
      <div class="team away"><span>${flag(game.awayTeam)}</span><strong>${escapeHtml(game.awayTeam)}</strong></div>
      <div class="time">${timePortugal(game.matchDate)}</div>
      <div class="state ${status.className}">${status.text}</div>
      <div class="bet-note">${escapeHtml(settledText)}</div>
      <button class="secondary small" type="button" onclick="window.showGameBets('${game.id}')">Ver apostas</button>
    </article>`;
}
function renderScore() {
  const rows = leaderboard();
  if (!rows.length) { $("scoreSummary").innerHTML = `<div class="empty">Importa o Excel de Resultados para criar a classificação.</div>`; return; }
  $("scoreSummary").innerHTML = `
    <div class="leaderboard-table">
      <div class="leaderboard-row head"><span>#</span><span>Jogador</span><span>Jogados</span><span>Exatos</span><span>Extras</span><span>Total</span><span>Excel</span></div>
      ${rows.map((row, index) => `
        <div class="leaderboard-row"><span>${index + 1}</span><strong>${escapeHtml(row.playerName)}</strong><span>${row.settled}</span><span>${row.exact}</span><span>${row.extraPoints}</span><b>${row.points}</b><span>${row.importedPoints === null ? "—" : `${row.importedPoints}${row.diffExcel ? ` (${row.diffExcel > 0 ? "+" : ""}${row.diffExcel})` : ""}`}</span></div>
      `).join("")}
    </div>`;
}

function blankTeam(team) { return { team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 }; }
function groupSortName(group) { return String(group).match(/Grupo ([A-Z])/i)?.[1] || "Z"; }
function buildStandings() {
  const tables = new Map();
  games.forEach(game => {
    if (!tables.has(game.group)) tables.set(game.group, new Map());
    const table = tables.get(game.group);
    [game.homeTeam, game.awayTeam].forEach(team => { if (!table.has(team)) table.set(team, blankTeam(team)); });
    if (!hasResult(game)) return;
    const home = table.get(game.homeTeam), away = table.get(game.awayTeam);
    const hs = Number(game.homeScore), as = Number(game.awayScore);
    home.played += 1; away.played += 1;
    home.gf += hs; home.ga += as; away.gf += as; away.ga += hs;
    home.gd = home.gf - home.ga; away.gd = away.gf - away.ga;
    if (hs > as) { home.wins += 1; away.losses += 1; home.points += 3; }
    else if (hs < as) { away.wins += 1; home.losses += 1; away.points += 3; }
    else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
  });
  return [...tables.entries()].sort((a, b) => groupSortName(a[0]).localeCompare(groupSortName(b[0]))).map(([group, table]) => ({ group, rows: [...table.values()].sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team)) }));
}
function renderGroups() {
  $("groupsTables").innerHTML = buildStandings().map(({ group, rows }) => `
    <section class="group-table"><h3>${escapeHtml(group)}</h3><div class="table">
      <div class="table-row head"><span>#</span><span>Seleção</span><span>J</span><span>DG</span><span>Pts</span></div>
      ${rows.map((row, index) => `<div class="table-row"><span>${index + 1}</span><strong>${flag(row.team)} ${escapeHtml(row.team)}</strong><span>${row.played}</span><span>${row.gd}</span><b>${row.points}</b></div>`).join("")}
    </div></section>`).join("");
}

function renderAdminState() {
  $("adminLocked").classList.toggle("hidden", isAdmin);
  $("adminUnlocked").classList.toggle("hidden", !isAdmin);
  const status = storageMode === "firebase" ? "Firebase online" : "Modo local";
  $("storageStatus").textContent = `${status}. Importa as apostas do Excel Resultados e mete os resultados reais manualmente.`;
}
function renderSettingsForm() {
  if (!$("pointsExactInput")) return;
  $("pointsExactInput").value = appSettings.points.exact;
  $("pointsMvpInput").value = appSettings.points.mvp;
  $("pointsTopScorerInput").value = appSettings.points.topScorer;
  $("pointsChampionInput").value = appSettings.points.champion;
  $("finalMvpInput").value = appSettings.extraResults.mvp || "";
  $("finalTopScorerInput").value = appSettings.extraResults.topScorer || "";
  $("finalChampionInput").value = appSettings.extraResults.champion || "";
  if (appSettings.lastImport) {
    $("importSummary").innerHTML = `<strong>Última importação:</strong> ${escapeHtml(new Date(appSettings.lastImport.at).toLocaleString("pt-PT"))} · ${appSettings.lastImport.bets || 0} apostas · ${appSettings.lastImport.players || 0} users · ${appSettings.lastImport.results || 0} resultados.`;
  }
}

function renderApiSettings() {
  if (!$("apiKeyInput")) return;
  const api = appSettings.api || defaultSettings().api;
  $("apiKeyInput").value = api.apiKey || "";
  $("apiLeagueInput").value = api.league || "1";
  $("apiSeasonInput").value = api.season || "2026";
  const summary = $("apiSyncSummary");
  if (summary) {
    summary.innerHTML = api.lastSync
      ? `<strong>Última sincronização:</strong> ${escapeHtml(new Date(api.lastSync.at).toLocaleString("pt-PT"))} · ${api.lastSync.updated || 0} resultados atualizados · ${api.lastSync.matched || 0} jogos encontrados na app.`
      : "Ainda não foi feita sincronização automática.";
  }
}

function renderAdmin() {
  const container = $("adminGamesList");
  if (!isAdmin) { container.innerHTML = ""; return; }
  container.innerHTML = games.map(game => `
    <article class="admin-row"><div class="admin-match"><span class="group-pill">${escapeHtml(game.group)}</span><strong>${flag(game.homeTeam)} ${escapeHtml(game.homeTeam)} vs ${flag(game.awayTeam)} ${escapeHtml(game.awayTeam)}</strong><small>${timePortugal(game.matchDate)} · ${escapeHtml(dateHeader(game.matchDate))} · ${betsForGame(game.id).length} apostas</small></div>
      <div class="result-inputs modal-result-actions">
        <span class="admin-result-chip">${hasResult(game) ? `Resultado: ${game.homeScore}-${game.awayScore}` : "Sem resultado"}</span>
        <button class="primary" type="button" onclick="window.openResultModal('${game.id}')">${hasResult(game) ? "Editar resultado" : "Adicionar resultado"}</button>
      </div>
    </article>`).join("");
}

async function saveBet(gameId, homeGuess, awayGuess, playerName = "Manual") {
  const game = games.find(item => item.id === gameId);
  if (!game) return;
  if (isLocked(game)) return toast("Apostas fechadas para este jogo.");
  if (homeGuess === "" || awayGuess === "") return toast("Preenche os dois campos da aposta.");
  const playerId = playerIdFromName(playerName);
  const bet = { id: `${playerId}_${gameId}`, playerId, playerName, gameId, homeGuess: Number(homeGuess), awayGuess: Number(awayGuess), source: "manual", updatedAt: new Date().toISOString() };
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

function todayGames() { const key = todayKey(); return games.filter(game => dateKey(game.matchDate) === key); }
function scoreText() {
  const rows = leaderboard();
  if (!rows.length) return "⭐ Classificação Mundial 2026\n\nAinda não há apostas importadas.";
  return "⭐ Classificação Mundial 2026\n\n" + rows.map((row, index) => `${index + 1}. ${row.playerName} - ${row.points} pts`).join("\n");
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
  return list.reduce((map, game) => { if (!map.has(game.group)) map.set(game.group, []); map.get(game.group).push(game); return map; }, new Map());
}
async function copyText(text, message) {
  try { await navigator.clipboard.writeText(text); toast(message); }
  catch { window.prompt("Copia o texto:", text); }
}
function toast(message) {
  const element = $("toast");
  element.textContent = message;
  element.classList.remove("hidden");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.add("hidden"), 2600);
}

function parseScore(value) {
  if (value === null || value === undefined) return null;
  const match = String(value).trim().match(/(\d+)\s*[-–:]\s*(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}
function splitMatchLabel(label) {
  const raw = String(label || "").trim();
  if (!raw) return null;
  const scoreMatch = raw.match(/\s+(\d+\s*[-–:]\s*\d+)\s*$/);
  const score = scoreMatch ? parseScore(scoreMatch[1]) : null;
  const cleanLabel = scoreMatch ? raw.slice(0, scoreMatch.index).trim() : raw;
  const parts = cleanLabel.split(/\s+-\s+/);
  if (parts.length < 2) return null;
  return { home: canonicalTeam(parts[0]), away: canonicalTeam(parts.slice(1).join(" - ")), score };
}
function findGameByTeams(home, away, group = "") {
  const h = normalizeComparable(canonicalTeam(home));
  const a = normalizeComparable(canonicalTeam(away));
  const g = normalizeComparable(group);
  return games.find(game => normalizeComparable(game.homeTeam) === h && normalizeComparable(game.awayTeam) === a && (!g || normalizeComparable(game.group) === g))
    || games.find(game => normalizeComparable(game.homeTeam) === h && normalizeComparable(game.awayTeam) === a);
}
async function readWorkbookFile(file) {
  if (!window.XLSX) throw new Error("Biblioteca Excel ainda não carregou. Verifica ligação à internet.");
  const buffer = await file.arrayBuffer();
  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    return XLSX.read(text, { type: "string" });
  }
  return XLSX.read(buffer, { type: "array" });
}
function firstSheetRows(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, blankrows: false });
}
function cellText(value) { return String(value ?? "").trim(); }
function findPlayersRow(rows) {
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const idx = row.findIndex(cell => normalizeKey(cell) === "jogadores");
    if (idx !== -1) {
      const players = [];
      for (let c = idx + 1; c < row.length; c += 1) {
        const name = cellText(row[c]);
        if (name) players.push({ name, col: c });
      }
      return { rowIndex: r, labelCol: idx, players };
    }
  }
  return null;
}
function parseResultadosWorkbookRows(rows) {
  const info = findPlayersRow(rows);
  if (!info) return { bets: [], extras: {}, errors: ["Não encontrei a linha Jogadores no ficheiro Resultados."] };
  const importedBets = [];
  const extras = {};
  const errors = [];
  let currentGroup = "";
  for (let r = info.rowIndex + 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const label = cellText(row[info.labelCol]);
    if (!label) continue;
    if (/^grupo\s+/i.test(label)) { currentGroup = label; continue; }
    const labelKey = normalizeKey(label);
    if (labelKey.includes("mvp") || labelKey.includes("melhor marcador") || labelKey.includes("equipa vencedora") || labelKey.includes("campeao") || labelKey.includes("campea")) {
      const field = labelKey.includes("mvp") ? "mvp" : labelKey.includes("melhor marcador") ? "topScorer" : "champion";
      info.players.forEach(player => {
        const value = cellText(row[player.col]);
        if (!value) return;
        if (!extras[player.name]) extras[player.name] = {};
        extras[player.name][field] = value;
      });
      continue;
    }
    const parsedMatch = splitMatchLabel(label);
    if (!parsedMatch) continue;
    const game = findGameByTeams(parsedMatch.home, parsedMatch.away, currentGroup);
    if (!game) { errors.push(`Jogo não encontrado: ${currentGroup} · ${label}`); continue; }
    info.players.forEach(player => {
      const score = parseScore(row[player.col]);
      if (!score) return;
      const playerId = playerIdFromName(player.name);
      importedBets.push({ id: `${playerId}_${game.id}`, playerId, playerName: player.name, gameId: game.id, homeGuess: score[0], awayGuess: score[1], source: "Resultados.xlsx", updatedAt: new Date().toISOString() });
    });
  }
  return { bets: importedBets, extras, errors };
}
function parsePontosWorkbookRows(rows) {
  const info = findPlayersRow(rows);
  if (!info) return { results: [], importedPoints: {}, errors: ["Não encontrei a linha Jogadores no ficheiro Pontos."] };
  const results = [];
  const importedPoints = {};
  const errors = [];
  let currentGroup = "";
  info.players.forEach(player => importedPoints[player.name] = 0);
  for (let r = info.rowIndex + 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const label = cellText(row[info.labelCol]);
    if (!label) continue;
    if (/^grupo\s+/i.test(label)) { currentGroup = label; continue; }
    const parsedMatch = splitMatchLabel(label);
    if (parsedMatch?.score) {
      const game = findGameByTeams(parsedMatch.home, parsedMatch.away, currentGroup);
      if (game) results.push({ gameId: game.id, homeScore: parsedMatch.score[0], awayScore: parsedMatch.score[1] });
      else errors.push(`Resultado sem jogo encontrado: ${currentGroup} · ${label}`);
    }
    info.players.forEach(player => {
      const value = Number(String(row[player.col] ?? "").replace(",", "."));
      if (Number.isFinite(value)) importedPoints[player.name] += value;
    });
  }
  return { results, importedPoints, errors };
}
async function previewExcelImport() {
  const resultadosFile = $("resultadosExcelInput").files?.[0];
  const pontosFile = $("pontosExcelInput").files?.[0];
  if (!resultadosFile && !pontosFile) { toast("Seleciona pelo menos um ficheiro Excel."); return; }
  const preview = $("excelPreview");
  preview.innerHTML = "A ler ficheiros...";
  const combined = { bets: [], extras: {}, results: [], importedPoints: {}, errors: [] };
  try {
    if (resultadosFile) {
      const workbook = await readWorkbookFile(resultadosFile);
      const parsed = parseResultadosWorkbookRows(firstSheetRows(workbook));
      combined.bets.push(...parsed.bets);
      combined.extras = { ...combined.extras, ...parsed.extras };
      combined.errors.push(...parsed.errors);
    }
    if (pontosFile) {
      const workbook = await readWorkbookFile(pontosFile);
      const parsed = parsePontosWorkbookRows(firstSheetRows(workbook));
      combined.results.push(...parsed.results);
      combined.importedPoints = parsed.importedPoints;
      combined.errors.push(...parsed.errors);
    }
    const players = new Set(combined.bets.map(bet => bet.playerName));
    Object.keys(combined.extras).forEach(name => players.add(name));
    Object.keys(combined.importedPoints).forEach(name => players.add(name));
    pendingExcelImport = combined;
    preview.innerHTML = `
      <div class="preview-grid"><div><strong>${combined.bets.length}</strong><span>apostas lidas</span></div><div><strong>${players.size}</strong><span>users</span></div><div><strong>${combined.results.length}</strong><span>resultados de jogos</span></div><div><strong>${Object.keys(combined.extras).length}</strong><span>extras</span></div></div>
      ${combined.errors.length ? `<details open><summary>${combined.errors.length} avisos</summary><ul>${combined.errors.slice(0, 80).map(err => `<li>${escapeHtml(err)}</li>`).join("")}</ul></details>` : `<p class="ok-line">Sem erros críticos encontrados.</p>`}
    `;
    $("confirmExcelImportBtn").disabled = false;
  } catch (error) {
    console.error(error);
    preview.innerHTML = `<p class="error-line">Erro a ler Excel: ${escapeHtml(error.message || error)}</p>`;
    $("confirmExcelImportBtn").disabled = true;
  }
}
async function confirmExcelImport() {
  if (!pendingExcelImport) return toast("Faz primeiro a pré-visualização.");
  const replace = $("replaceExcelBetsInput").checked;
  pendingExcelImport.results.forEach(result => {
    const game = games.find(item => item.id === result.gameId);
    if (!game) return;
    game.homeScore = result.homeScore;
    game.awayScore = result.awayScore;
  });
  appSettings.extraPredictions = { ...(appSettings.extraPredictions || {}), ...(pendingExcelImport.extras || {}) };
  appSettings.importedPoints = pendingExcelImport.importedPoints || appSettings.importedPoints || {};
  const importedUsers = new Set(appSettings.users || []);
  pendingExcelImport.bets.forEach(bet => importedUsers.add(bet.playerName));
  Object.keys(pendingExcelImport.extras || {}).forEach(name => importedUsers.add(name));
  Object.keys(pendingExcelImport.importedPoints || {}).forEach(name => importedUsers.add(name));
  appSettings.users = [...importedUsers].filter(Boolean).sort((a, b) => a.localeCompare(b));
  appSettings.lastImport = { at: new Date().toISOString(), bets: pendingExcelImport.bets.length, players: new Set(pendingExcelImport.bets.map(bet => bet.playerName)).size, results: pendingExcelImport.results.length };
  await persistAllBets(pendingExcelImport.bets, replace);
  await persistAllGames();
  await persistSettings();
  pendingExcelImport = null;
  $("excelModal").classList.add("hidden");
  $("confirmExcelImportBtn").disabled = true;
  renderAll();
  toast("Excel importado. Classificação recalculada.");
}
async function savePointsSettings() {
  appSettings.points = {
    exact: Number($("pointsExactInput").value) || 0,
    winner: 0,
    mvp: Number($("pointsMvpInput").value) || 0,
    topScorer: Number($("pointsTopScorerInput").value) || 0,
    champion: Number($("pointsChampionInput").value) || 0
  };
  await persistSettings(); renderAll(); toast("Sistema de pontos atualizado.");
}
async function saveExtraResults() {
  appSettings.extraResults = { mvp: $("finalMvpInput").value.trim(), topScorer: $("finalTopScorerInput").value.trim(), champion: $("finalChampionInput").value.trim() };
  await persistSettings(); renderAll(); toast("Resultados especiais guardados.");
}

async function addUser() {
  const input = $("newUserNameInput");
  const name = input?.value.trim();
  if (!name) return toast("Escreve o nome do user.");
  const users = new Set(appSettings.users || []);
  users.add(name);
  appSettings.users = [...users].filter(Boolean).sort((a, b) => a.localeCompare(b));
  input.value = "";
  await persistSettings();
  renderAll();
  toast("User adicionado.");
}

async function removeUser(name) {
  if (!confirm(`Remover ${name} da lista de users? As apostas importadas não são apagadas.`)) return;
  appSettings.users = (appSettings.users || []).filter(user => user !== name);
  await persistSettings();
  renderAll();
  toast("User removido da lista.");
}

function renderUsers() {
  const el = $("usersList");
  if (!el) return;
  const users = allPlayers();
  if (!users.length) {
    el.innerHTML = `<div class="empty small-empty">Ainda não existem users. Adiciona manualmente ou importa o Excel.</div>`;
    return;
  }
  el.innerHTML = users.map(name => {
    const stats = playerStats(name);
    const isManual = (appSettings.users || []).includes(name);
    return `<div class="user-pill-row">
      <div>
        <strong>${escapeHtml(name)}</strong>
        <small>${stats.points} pts · ${stats.totalBets} apostas${isManual ? " · user manual" : " · via Excel"}</small>
      </div>
      <button class="secondary small" type="button" onclick="window.removeUserFromUI('${escapeHtml(name).replace(/'/g, "\\'")}')">Remover</button>
    </div>`;
  }).join("");
}


function exportPontosExcel() {
  if (!window.XLSX) {
    toast("Biblioteca Excel ainda não carregou.");
    return;
  }

  const rows = [
    ["Jogador", "Jogos com resultado", "Resultados exatos", "Pontos jogos", "MVP", "Melhor Marcador", "Equipa Vencedora", "Pontos extras", "Total"]
  ];

  leaderboard().forEach(row => {
    rows.push([
      row.playerName,
      row.settled,
      row.exact,
      row.gamePoints,
      row.mvp,
      row.topScorer,
      row.champion,
      row.extraPoints,
      row.points
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
    { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 10 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Pontos");

  const detailRows = [["Grupo", "Jogo", "Resultado real", "Hora Portugal", "User", "Aposta", "Pontos"]];
  games.forEach(game => {
    betsForGame(game.id).forEach(bet => {
      detailRows.push([
        game.group,
        `${game.homeTeam} - ${game.awayTeam}`,
        hasResult(game) ? `${game.homeScore}-${game.awayScore}` : "",
        timePortugal(game.matchDate),
        bet.playerName,
        `${bet.homeGuess}-${bet.awayGuess}`,
        pointsForBet(bet, game)
      ]);
    });
  });
  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, "Detalhe");

  XLSX.writeFile(wb, "Pontos_Mundial_2026.xlsx");
  toast("Excel Pontos exportado.");
}

function showGameBets(gameId) {
  const game = games.find(item => item.id === gameId);
  if (!game) return;
  const rows = betsForGame(gameId).sort((a, b) => a.playerName.localeCompare(b.playerName)).map(bet => `${bet.playerName}: ${bet.homeGuess}-${bet.awayGuess}${hasResult(game) ? ` · ${pointsForBet(bet, game)} pts` : ""}`);
  alert(`${game.homeTeam} vs ${game.awayTeam}\n\n${rows.length ? rows.join("\n") : "Sem apostas para este jogo."}`);
}


function resultImpactPreview(game, homeScore, awayScore) {
  const gameBets = betsForGame(game.id);
  if (homeScore === "" || awayScore === "") {
    return `${gameBets.length} apostas importadas. Mete o resultado para calcular pontos.`;
  }

  const tempGame = { ...game, homeScore: Number(homeScore), awayScore: Number(awayScore) };
  const exact = gameBets.filter(bet => pointsForBet(bet, tempGame) > 0).length;
  const totalPoints = gameBets.reduce((sum, bet) => sum + pointsForBet(bet, tempGame), 0);
  return `${gameBets.length} apostas · ${exact} resultados exatos · ${totalPoints} pontos atribuídos`;
}

function updateResultPreview() {
  const gameId = $("resultGameIdInput")?.value;
  const game = games.find(item => item.id === gameId);
  if (!game || !$("resultPointsPreview")) return;

  $("resultPointsPreview").textContent = resultImpactPreview(
    game,
    $("modalHomeScoreInput").value,
    $("modalAwayScoreInput").value
  );
}

function openResultModal(gameId) {
  const game = games.find(item => item.id === gameId);
  if (!game) return;

  $("resultGameIdInput").value = game.id;
  $("resultModalTitle").textContent = hasResult(game) ? "Editar resultado" : "Adicionar resultado";
  $("resultModalSubtitle").textContent = "Ao guardar, a app compara as apostas dos users e recalcula a classificação.";
  $("resultHomeFlag").textContent = flag(game.homeTeam);
  $("resultAwayFlag").textContent = flag(game.awayTeam);
  $("resultHomeTeam").textContent = game.homeTeam;
  $("resultAwayTeam").textContent = game.awayTeam;
  $("resultGroupInput").value = game.group;
  $("resultDateInput").value = `${dateHeader(game.matchDate)} · ${timePortugal(game.matchDate)}`;
  $("modalHomeScoreInput").value = game.homeScore ?? "";
  $("modalAwayScoreInput").value = game.awayScore ?? "";

  updateResultPreview();
  $("resultModal").classList.remove("hidden");
  setTimeout(() => $("modalHomeScoreInput")?.focus(), 80);
}

function closeResultModal() {
  $("resultModal")?.classList.add("hidden");
}

async function saveResultFromModal() {
  const gameId = $("resultGameIdInput").value;
  const homeScore = $("modalHomeScoreInput").value;
  const awayScore = $("modalAwayScoreInput").value;

  if (homeScore === "" || awayScore === "") {
    toast("Preenche os dois campos do resultado.");
    return;
  }

  await setResult(gameId, homeScore, awayScore);
  closeResultModal();
}

async function clearResultFromModal() {
  const gameId = $("resultGameIdInput").value;
  if (!gameId) return;
  await clearResult(gameId);
  closeResultModal();
}

window.showGameBets = showGameBets;
window.saveBetFromUI = id => saveBet(id, $("home_" + id)?.value ?? "", $("away_" + id)?.value ?? "");
window.setResultFromUI = id => setResult(id, $("res_home_" + id).value, $("res_away_" + id).value);
window.clearResultFromUI = id => clearResult(id);

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
    button.classList.add("active");
    $(button.dataset.tab).classList.add("active");
  });
});
$("unlockAdminBtn").addEventListener("click", () => {
  if ($("adminPinInput").value !== ADMIN_PIN) return toast("PIN errado.");
  isAdmin = true; localStorage.setItem("mundial_admin_unlocked", "1"); renderAll();
});
$("copyTodayBtn").addEventListener("click", () => copyText(todayText(), "Jogos de hoje copiados."));
$("copyScoreBtn").addEventListener("click", () => copyText(scoreText(), "Classificação copiada."));
$("copyGroupsBtn").addEventListener("click", () => copyText(groupsText(), "Classificação dos grupos copiada."));
$("addUserBtn")?.addEventListener("click", addUser);
$("newUserNameInput")?.addEventListener("keydown", event => { if (event.key === "Enter") addUser(); });
$("openExcelModalBtn")?.addEventListener("click", () => $("excelModal").classList.remove("hidden"));
$("closeExcelModalBtn")?.addEventListener("click", () => $("excelModal").classList.add("hidden"));
$("excelModal")?.addEventListener("click", event => { if (event.target.id === "excelModal") $("excelModal").classList.add("hidden"); });
$("previewExcelBtn")?.addEventListener("click", previewExcelImport);
$("confirmExcelImportBtn")?.addEventListener("click", confirmExcelImport);
$("savePointsSettingsBtn")?.addEventListener("click", savePointsSettings);
$("saveExtraResultsBtn")?.addEventListener("click", saveExtraResults);
$("exportPontosBtn")?.addEventListener("click", exportPontosExcel);


$("closeResultModalBtn")?.addEventListener("click", closeResultModal);
$("saveModalResultBtn")?.addEventListener("click", saveResultFromModal);
$("clearModalResultBtn")?.addEventListener("click", clearResultFromModal);
$("modalHomeScoreInput")?.addEventListener("input", updateResultPreview);
$("modalAwayScoreInput")?.addEventListener("input", updateResultPreview);
$("resultModal")?.addEventListener("click", event => { if (event.target.id === "resultModal") closeResultModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !$("resultModal")?.classList.contains("hidden")) closeResultModal(); });

await initFirebase();
await loadData();
