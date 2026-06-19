// Mundial Pontos - v9.0 Funcional
// Firebase/API configuráveis via config.js. Modo teste continua ativo sem configuração.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, doc, getDocs, setDoc, addDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const APP_CONFIG = window.MUNDIAL_CONFIG || {};
const firebaseConfig = APP_CONFIG.firebase || {};
const apiConfig = APP_CONFIG.api || {};
const ADMIN_PIN = APP_CONFIG.adminPin || "1234";
const DEMO_MODE = !firebaseConfig.apiKey || firebaseConfig.apiKey === "COLOCA_AQUI";
const demoStoreKey = "mundial_demo_data_v9";

let db = null;
let activePlayer = localStorage.getItem("mundial_active_player") || "";
let isAdmin = localStorage.getItem("mundial_is_admin") === "1";
let games = [];
let bets = [];
let currentFilter = "all";
let currentSearch = "";
let currentPhase = "all";

const SEED_GAMES = [
  { id:"wc2026-mex-kor", group:"Grupo A", homeTeam:"México", awayTeam:"Coreia do Sul", matchDate:"2026-06-19T01:00", venue:"Estadio Guadalajara", phase:"Fase de grupos", homeScore:1, awayScore:0 },
  { id:"wc2026-can-qat", group:"Grupo B", homeTeam:"Canadá", awayTeam:"Qatar", matchDate:"2026-06-18T22:00", venue:"BC Place Vancouver", phase:"Fase de grupos", homeScore:6, awayScore:0 },
  { id:"wc2026-sui-bih", group:"Grupo C", homeTeam:"Suíça", awayTeam:"Bósnia-Herzegovina", matchDate:"2026-06-18T19:00", venue:"Los Angeles Stadium", phase:"Fase de grupos", homeScore:4, awayScore:1 },
  { id:"wc2026-cze-rsa", group:"Grupo A", homeTeam:"Chéquia", awayTeam:"África do Sul", matchDate:"2026-06-18T16:00", venue:"Atlanta Stadium", phase:"Fase de grupos", homeScore:1, awayScore:1 },
  { id:"wc2026-uzb-col", group:"Grupo H", homeTeam:"Uzbequistão", awayTeam:"Colômbia", matchDate:"2026-06-18T02:00", venue:"Mexico City Stadium", phase:"Fase de grupos", homeScore:1, awayScore:3 },
  { id:"wc2026-eng-cro", group:"Grupo D", homeTeam:"Inglaterra", awayTeam:"Croácia", matchDate:"2026-06-17T20:00", venue:"Dallas Stadium", phase:"Fase de grupos", homeScore:4, awayScore:2 },
  { id:"wc2026-por-cod", group:"Grupo H", homeTeam:"Portugal", awayTeam:"RD Congo", matchDate:"2026-06-17T17:00", venue:"Houston Stadium", phase:"Fase de grupos", homeScore:1, awayScore:1 },
  { id:"wc2026-usa-aus", group:"Grupo E", homeTeam:"Estados Unidos", awayTeam:"Austrália", matchDate:"2026-06-19T19:00", venue:"Seattle Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-sco-mar", group:"Grupo F", homeTeam:"Escócia", awayTeam:"Marrocos", matchDate:"2026-06-19T22:00", venue:"Boston Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-bra-hai", group:"Grupo G", homeTeam:"Brasil", awayTeam:"Haiti", matchDate:"2026-06-20T00:30", venue:"Philadelphia Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-tur-par", group:"Grupo I", homeTeam:"Turquia", awayTeam:"Paraguai", matchDate:"2026-06-20T03:00", venue:"San Francisco Bay Area Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-ned-swe", group:"Grupo J", homeTeam:"Países Baixos", awayTeam:"Suécia", matchDate:"2026-06-20T17:00", venue:"Houston Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-ger-civ", group:"Grupo K", homeTeam:"Alemanha", awayTeam:"Costa do Marfim", matchDate:"2026-06-20T20:00", venue:"Toronto Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-ecu-cuw", group:"Grupo L", homeTeam:"Equador", awayTeam:"Curaçao", matchDate:"2026-06-21T00:00", venue:"Kansas City Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-tun-jpn", group:"Grupo M", homeTeam:"Tunísia", awayTeam:"Japão", matchDate:"2026-06-21T04:00", venue:"Estadio Monterrey", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-esp-ksa", group:"Grupo N", homeTeam:"Espanha", awayTeam:"Arábia Saudita", matchDate:"2026-06-21T16:00", venue:"Atlanta Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-bel-irn", group:"Grupo O", homeTeam:"Bélgica", awayTeam:"Irão", matchDate:"2026-06-21T19:00", venue:"Los Angeles Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-uru-cpv", group:"Grupo P", homeTeam:"Uruguai", awayTeam:"Cabo Verde", matchDate:"2026-06-21T22:00", venue:"Miami Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-arg-aut", group:"Grupo Q", homeTeam:"Argentina", awayTeam:"Áustria", matchDate:"2026-06-22T17:00", venue:"Dallas Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-fra-irq", group:"Grupo R", homeTeam:"França", awayTeam:"Iraque", matchDate:"2026-06-22T21:00", venue:"Philadelphia Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-por-uzb", group:"Grupo H", homeTeam:"Portugal", awayTeam:"Uzbequistão", matchDate:"2026-06-23T17:00", venue:"Houston Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-r16-1", group:"Oitavos", homeTeam:"1.º Grupo A", awayTeam:"2.º Grupo B", matchDate:"2026-06-28T20:00", venue:"A confirmar", phase:"Oitavos de Final", homeScore:null, awayScore:null },
  { id:"wc2026-qf-1", group:"Quartos", homeTeam:"Vencedor O1", awayTeam:"Vencedor O2", matchDate:"2026-07-04T20:00", venue:"A confirmar", phase:"Quartos de Final", homeScore:null, awayScore:null },
  { id:"wc2026-sf-1", group:"Meias", homeTeam:"Vencedor Q1", awayTeam:"Vencedor Q2", matchDate:"2026-07-08T20:00", venue:"A confirmar", phase:"Meias-Finais", homeScore:null, awayScore:null },
  { id:"wc2026-final", group:"Final", homeTeam:"Finalista 1", awayTeam:"Finalista 2", matchDate:"2026-07-19T20:00", venue:"A confirmar", phase:"Final", homeScore:null, awayScore:null }
].map(g => ({ ...g, createdAt: Date.now(), source:"Base inicial" }));

const FLAG_MAP = {
  "Portugal":"🇵🇹","Brasil":"🇧🇷","Argentina":"🇦🇷","França":"🇫🇷","Alemanha":"🇩🇪","Espanha":"🇪🇸","Inglaterra":"🏴","Croácia":"🇭🇷",
  "Canadá":"🇨🇦","México":"🇲🇽","Japão":"🇯🇵","Austrália":"🇦🇺","Estados Unidos":"🇺🇸","Suíça":"🇨🇭","Bósnia-Herzegovina":"🇧🇦",
  "Chéquia":"🇨🇿","África do Sul":"🇿🇦","Uzbequistão":"🇺🇿","Colômbia":"🇨🇴","RD Congo":"🇨🇩","Escócia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Marrocos":"🇲🇦","Haiti":"🇭🇹","Turquia":"🇹🇷","Paraguai":"🇵🇾","Países Baixos":"🇳🇱","Suécia":"🇸🇪","Costa do Marfim":"🇨🇮",
  "Equador":"🇪🇨","Curaçao":"🇨🇼","Tunísia":"🇹🇳","Arábia Saudita":"🇸🇦","Bélgica":"🇧🇪","Irão":"🇮🇷","Uruguai":"🇺🇾",
  "Cabo Verde":"🇨🇻","Áustria":"🇦🇹","Iraque":"🇮🇶","Qatar":"🇶🇦","Coreia do Sul":"🇰🇷"
};

const defaultDemo = { games: SEED_GAMES, bets: [] };
const $ = id => document.getElementById(id);
const hasResult = game => game && game.homeScore !== null && game.homeScore !== undefined && game.awayScore !== null && game.awayScore !== undefined;
const isLocked = game => hasResult(game) || new Date(game.matchDate).getTime() <= Date.now();
const safeId = text => String(text ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/gi, "_");
const outcome = (h,a) => Number(h)>Number(a) ? "home" : Number(h)<Number(a) ? "away" : "draw";
const escapeHtml = text => String(text ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const flag = team => FLAG_MAP[String(team || "").trim()] || (String(team || "").match(/^\d|Vencedor|Finalista/i) ? "🏆" : "🏳️");

function toast(message){
  const el=$("toast");
  if(!el) return alert(message);
  el.textContent=message;
  el.classList.remove("hidden");
  setTimeout(()=>el.classList.add("hidden"),2800);
}
function getDemoData(){
  const raw=localStorage.getItem(demoStoreKey);
  if(!raw){ localStorage.setItem(demoStoreKey, JSON.stringify(defaultDemo)); return structuredClone(defaultDemo); }
  try { return JSON.parse(raw); }
  catch { localStorage.removeItem(demoStoreKey); localStorage.setItem(demoStoreKey, JSON.stringify(defaultDemo)); return structuredClone(defaultDemo); }
}
function saveDemoData(data){ localStorage.setItem(demoStoreKey, JSON.stringify(data)); }
function formatDate(value){
  if(!value) return "Sem data";
  return new Date(value).toLocaleString("pt-PT", { weekday:"short", day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
}
function formatShortDate(value){
  if(!value) return "";
  return new Date(value).toLocaleString("pt-PT", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
}
function statusOf(game){
  if(hasResult(game)) return { label:"Terminado", cls:"closed" };
  if(isLocked(game)) return { label:"Apostas fechadas", cls:"locked" };
  return { label:"Aberto", cls:"open" };
}
function groupOf(game){ return game.group || game.groupName || game.pool || game.phase || "Outros jogos"; }
function groupSortKey(group){
  const letter = String(group).match(/Grupo\s+([A-Z])/i);
  if(letter) return `0_${letter[1].toUpperCase()}`;
  const phaseOrder = { "Oitavos": "1", "Quartos": "2", "Meias": "3", "Final": "4" };
  return `${phaseOrder[group] || "9"}_${group}`;
}
function phaseKey(game){
  const txt = `${game.phase || ""} ${game.group || ""}`.toLowerCase();
  if(txt.includes("oitavo")) return "r16";
  if(txt.includes("quarto")) return "quarters";
  if(txt.includes("meia")) return "semis";
  if(txt.includes("final") && !txt.includes("meia")) return "final";
  return "groups";
}
function phaseLabel(key){
  return ({groups:"Fase de grupos", r16:"Oitavos de Final", quarters:"Quartos de Final", semis:"Meias-Finais", final:"Final"}[key] || "Mundial");
}
function exactBet(bet, game){ return Number(bet.homeGuess) === Number(game.homeScore) && Number(bet.awayGuess) === Number(game.awayScore); }
function pointsForBet(bet, game){
  if(!game || !hasResult(game)) return 0;
  if(exactBet(bet, game)) return 3;
  return outcome(bet.homeGuess, bet.awayGuess) === outcome(game.homeScore, game.awayScore) ? 1 : 0;
}

async function initFirebase(){
  if(DEMO_MODE) return;
  try {
    const app=initializeApp(firebaseConfig);
    db=getFirestore(app);
  } catch(e){
    console.error(e);
    toast("Firebase não ligou. A usar modo teste.");
  }
}
async function loadData(){
  if(DEMO_MODE || !db){
    const data=getDemoData();
    games=(data.games || []).sort((a,b)=>String(a.matchDate).localeCompare(String(b.matchDate)));
    bets=data.bets || [];
    renderAll();
    return;
  }
  const gamesSnap=await getDocs(query(collection(db,"games"), orderBy("matchDate","asc")));
  games=gamesSnap.docs.map(d=>({id:d.id,...d.data()}));
  const betsSnap=await getDocs(collection(db,"bets"));
  bets=betsSnap.docs.map(d=>({id:d.id,...d.data()}));
  renderAll();
}
async function saveBet(gameId, homeGuess, awayGuess){
  if(!activePlayer) return toast("Entra primeiro com o teu nome.");
  const game=games.find(g=>g.id===gameId);
  if(!game) return;
  if(isLocked(game)) return toast("As apostas deste jogo já estão fechadas.");
  if(homeGuess==="" || awayGuess==="") return toast("Preenche o resultado completo.");
  const bet={gameId, playerName:activePlayer, homeGuess:Number(homeGuess), awayGuess:Number(awayGuess), updatedAt:Date.now()};
  if(DEMO_MODE || !db){
    const data=getDemoData();
    data.bets=data.bets.filter(b=>!(b.gameId===gameId && b.playerName===activePlayer));
    data.bets.push({id:`${gameId}_${activePlayer}`,...bet});
    saveDemoData(data);
  } else {
    await setDoc(doc(db,"bets",`${gameId}_${safeId(activePlayer)}`), {...bet, updatedAt:serverTimestamp()});
  }
  toast("Aposta guardada.");
  await loadData();
}
async function addGame(homeTeam, awayTeam, matchDate, venue="", phase="Fase de grupos", group="Grupo A"){
  if(!homeTeam || !awayTeam || !matchDate) return toast("Preenche os dados do jogo.");
  const game={homeTeam, awayTeam, matchDate, venue, phase, group, homeScore:null, awayScore:null, createdAt:Date.now(), source:"Manual"};
  if(DEMO_MODE || !db){
    const data=getDemoData();
    data.games.push({id:crypto.randomUUID(),...game});
    saveDemoData(data);
  } else {
    await addDoc(collection(db,"games"), {...game, createdAt:serverTimestamp()});
  }
  ["homeTeamInput","awayTeamInput","matchDateInput","venueInput","phaseInput","groupInput"].forEach(id=>$(id) && ($(id).value=""));
  toast("Jogo adicionado.");
  await loadData();
}
async function setResult(gameId, homeScore, awayScore){
  if(homeScore==="" || awayScore==="") return toast("Coloca o resultado completo.");
  if(DEMO_MODE || !db){
    const data=getDemoData();
    data.games=data.games.map(g=>g.id===gameId ? {...g, homeScore:Number(homeScore), awayScore:Number(awayScore)} : g);
    saveDemoData(data);
  } else {
    await setDoc(doc(db,"games",gameId), {homeScore:Number(homeScore), awayScore:Number(awayScore)}, {merge:true});
  }
  toast("Resultado guardado e tabelas atualizadas.");
  await loadData();
}
async function removeResult(gameId){
  if(DEMO_MODE || !db){
    const data=getDemoData();
    data.games=data.games.map(g=>g.id===gameId ? {...g, homeScore:null, awayScore:null} : g);
    saveDemoData(data);
  } else {
    await setDoc(doc(db,"games",gameId), {homeScore:null, awayScore:null}, {merge:true});
  }
  toast("Resultado removido.");
  await loadData();
}
async function removeGame(gameId){
  if(!confirm("Apagar este jogo e as apostas associadas?")) return;
  if(DEMO_MODE || !db){
    const data=getDemoData();
    data.games=data.games.filter(g=>g.id!==gameId);
    data.bets=data.bets.filter(b=>b.gameId!==gameId);
    saveDemoData(data);
  } else {
    await deleteDoc(doc(db,"games",gameId));
  }
  toast("Jogo apagado.");
  await loadData();
}
async function resetSeed(){
  if(!confirm("Isto repõe a lista base v9 e apaga apostas em modo teste. Continuar?")) return;
  saveDemoData(structuredClone(defaultDemo));
  toast("Lista base reposta.");
  await loadData();
}

function getVisibleGames(){
  return games.filter(g => {
    const txt=`${g.homeTeam} ${g.awayTeam} ${g.venue} ${g.phase} ${g.group}`.toLowerCase();
    const matchesSearch=!currentSearch || txt.includes(currentSearch.toLowerCase());
    const matchesFilter=currentFilter==="all" || (currentFilter==="open" && !isLocked(g)) || (currentFilter==="locked" && isLocked(g) && !hasResult(g)) || (currentFilter==="finished" && hasResult(g));
    const matchesPhase=currentPhase==="all" || phaseKey(g) === currentPhase;
    return matchesSearch && matchesFilter && matchesPhase;
  });
}
function getTotals(){
  const totals=new Map();
  bets.forEach(b=>{
    const g=games.find(x=>x.id===b.gameId);
    const cur=totals.get(b.playerName)||{playerName:b.playerName,points:0,exact:0,played:0, winner:0};
    const pts=pointsForBet(b,g);
    cur.points+=pts;
    if(g&&hasResult(g)) cur.played+=1;
    if(g&&exactBet(b,g)) cur.exact+=1;
    else if(pts===1) cur.winner+=1;
    totals.set(b.playerName,cur);
  });
  if(activePlayer&&!totals.has(activePlayer)) totals.set(activePlayer,{playerName:activePlayer,points:0,exact:0,played:0,winner:0});
  return totals;
}
function blankTeam(team){
  return { team, played:0, wins:0, draws:0, losses:0, gf:0, ga:0, gd:0, points:0 };
}
function buildGroupStandings(){
  const tables = new Map();
  games.filter(g => phaseKey(g)==="groups").forEach(g => {
    const group = groupOf(g);
    if(!tables.has(group)) tables.set(group, new Map());
    const table = tables.get(group);
    [g.homeTeam, g.awayTeam].forEach(team => {
      if(!table.has(team)) table.set(team, blankTeam(team));
    });
    if(!hasResult(g)) return;
    const home = table.get(g.homeTeam);
    const away = table.get(g.awayTeam);
    const hs = Number(g.homeScore);
    const as = Number(g.awayScore);
    home.played++; away.played++;
    home.gf += hs; home.ga += as; home.gd = home.gf - home.ga;
    away.gf += as; away.ga += hs; away.gd = away.gf - away.ga;
    if(hs > as){ home.wins++; home.points += 3; away.losses++; }
    else if(hs < as){ away.wins++; away.points += 3; home.losses++; }
    else { home.draws++; away.draws++; home.points++; away.points++; }
  });

  return [...tables.entries()]
    .sort((a,b)=>groupSortKey(a[0]).localeCompare(groupSortKey(b[0])))
    .map(([group, table]) => ({
      group,
      rows: [...table.values()].sort((a,b)=>
        b.points-a.points || b.gd-a.gd || b.gf-a.gf || a.team.localeCompare(b.team)
      )
    }));
}
function todayGames(){
  const today = new Date().toISOString().slice(0,10);
  return games.filter(g => String(g.matchDate || "").slice(0,10) === today);
}

function renderAll(){
  renderSession();
  renderStats();
  renderTodayGames();
  renderGames();
  renderRanking();
  renderGroupsTables();
  renderAdmin();
}
function renderSession(){
  $("activeUserLabel").textContent=activePlayer||"Sem jogador";
  if($("modeLabel")) $("modeLabel").textContent = DEMO_MODE || !db ? "Modo teste local" : "Firebase online";
  $("logoutBtn")?.classList.toggle("hidden",!activePlayer);
  $("loginView")?.classList.toggle("hidden",!!activePlayer);
  $("mainView")?.classList.toggle("hidden",!activePlayer);
  $("adminLocked")?.classList.toggle("hidden",isAdmin);
  $("adminUnlocked")?.classList.toggle("hidden",!isAdmin);
}
function renderStats(){
  const players=new Set(bets.map(b=>b.playerName));
  if(activePlayer) players.add(activePlayer);
  const done=games.filter(hasResult).length;
  const open=games.filter(g=>!isLocked(g)).length;
  $("statGames").textContent=games.length;
  if($("statBets")) $("statBets").textContent=bets.length;
  $("statPlayers").textContent=players.size;
  $("statMyPoints").textContent=getTotals().get(activePlayer)?.points||0;
  if($("statFinished")) $("statFinished").textContent=done;
  if($("statOpen")) $("statOpen").textContent=open;
}
function renderTodayGames(){
  const el = $("todayGamesList");
  if(!el) return;
  const list = todayGames();
  if(!list.length){
    el.innerHTML = `<div class="empty-today">Hoje não há jogos registados na app.</div>`;
    return;
  }
  el.innerHTML = list.map(game => {
    const st=statusOf(game);
    const result = hasResult(game) ? `${game.homeScore} - ${game.awayScore}` : formatShortDate(game.matchDate);
    return `<article class="today-card ${st.cls}">
      <div class="today-teams">
        <strong>${flag(game.homeTeam)} ${escapeHtml(game.homeTeam)}</strong>
        <span>${result}</span>
        <strong>${flag(game.awayTeam)} ${escapeHtml(game.awayTeam)}</strong>
      </div>
      <p>${escapeHtml(game.venue || "Estádio a confirmar")} · ${escapeHtml(game.phase || "Mundial")}</p>
    </article>`;
  }).join("");
}
function renderGames(){
  const el=$("gamesList");
  if(!el) return;
  const list=getVisibleGames();
  if(!list.length){ el.innerHTML=`<div class="glass-card">Não encontrei jogos com esse filtro.</div>`; return; }

  const grouped = new Map();
  list.forEach(game => {
    const key = currentPhase === "all" ? (phaseKey(game)==="groups" ? groupOf(game) : phaseLabel(phaseKey(game))) : (phaseKey(game)==="groups" ? groupOf(game) : phaseLabel(phaseKey(game)));
    if(!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(game);
  });

  const sections = [...grouped.entries()].sort((a,b)=>groupSortKey(a[0]).localeCompare(groupSortKey(b[0]))).map(([group, groupGames])=>{
    const openCount = groupGames.filter(g=>!isLocked(g)).length;
    const finishedCount = groupGames.filter(hasResult).length;
    const totalBets = groupGames.reduce((sum,g)=>sum + bets.filter(b=>b.gameId===g.id).length,0);
    return `<section class="group-section">
      <div class="group-header">
        <div>
          <span class="group-kicker">${escapeHtml(phaseLabel(phaseKey(groupGames[0])))}</span>
          <h3>${escapeHtml(group)}</h3>
        </div>
        <div class="group-meta">
          <span>${groupGames.length} jogos</span>
          <span>${openCount} abertos</span>
          <span>${finishedCount} terminados</span>
          <span>${totalBets} apostas</span>
        </div>
      </div>
      <div class="group-games">
      ${groupGames.map(renderGameCard).join("")}
      </div>
    </section>`;
  });
  el.innerHTML = sections.join("");
}
function renderGameCard(game){
  const myBet=bets.find(b=>b.gameId===game.id&&b.playerName===activePlayer);
  const st=statusOf(game);
  const resultText=hasResult(game)?`${game.homeScore} - ${game.awayScore}`:"VS";
  const pts=myBet?pointsForBet(myBet,game):0;
  const locked=isLocked(game);
  return `<article class="game-card match-card-pro ${st.cls}">
    <div class="match-topline">
      <span class="phase-pill">${escapeHtml(game.phase||"Mundial")}</span>
      <span class="badge ${st.cls}">${st.label}</span>
    </div>
    <div class="teams-pro">
      <div class="team-pro">
        <span class="flag-ball">${flag(game.homeTeam)}</span>
        <strong>${escapeHtml(game.homeTeam)}</strong>
      </div>
      <div class="score-pro">
        <span>${resultText}</span>
        <small>${hasResult(game) ? "Resultado final" : formatShortDate(game.matchDate)}</small>
      </div>
      <div class="team-pro right">
        <span class="flag-ball">${flag(game.awayTeam)}</span>
        <strong>${escapeHtml(game.awayTeam)}</strong>
      </div>
    </div>
    <div class="match-meta-pro">🏟️ ${escapeHtml(game.venue||"Estádio a confirmar")} · ${escapeHtml(groupOf(game))}</div>
    <div class="bet-status-pro">${myBet ? `A tua aposta: <strong>${myBet.homeGuess}-${myBet.awayGuess}</strong> · ${pts} pts` : "Ainda sem aposta"}</div>
    <div class="bet-grid bet-grid-pro">
      <label>${escapeHtml(game.homeTeam)}<input id="home_${game.id}" type="number" min="0" value="${myBet?.homeGuess ?? ""}" ${locked?"disabled":""}></label>
      <label>${escapeHtml(game.awayTeam)}<input id="away_${game.id}" type="number" min="0" value="${myBet?.awayGuess ?? ""}" ${locked?"disabled":""}></label>
      <button class="primary" onclick="window.saveBetFromUI('${game.id}')" ${locked?"disabled":""}>Guardar</button>
    </div>
  </article>`;
}
function renderRanking(){
  const rows=[...getTotals().values()].sort((a,b)=>b.points-a.points||b.exact-a.exact||a.playerName.localeCompare(b.playerName));
  $("rankingList").innerHTML=rows.length?rows.map((r,i)=>`<div class="ranking-row"><div class="rank-number">${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div><div><strong>${escapeHtml(r.playerName)}</strong><p class="muted">Jogos pontuados: ${r.played} · Exatos: ${r.exact}</p></div><div class="points">${r.points} pts</div></div>`).join(""):`<div class="glass-card">Ainda não existem apostas.</div>`;
}
function renderGroupsTables(){
  const el = $("groupsTables");
  if(!el) return;
  const tables = buildGroupStandings();
  if(!tables.length){
    el.innerHTML = `<div class="glass-card">Ainda não existem grupos para mostrar.</div>`;
    return;
  }
  el.innerHTML = tables.map(({group, rows}) => `<section class="standings-card">
    <div class="standings-head">
      <h3>${escapeHtml(group)}</h3>
      <span>${rows.filter(r=>r.played>0).length ? "Com resultados" : "Sem resultados"}</span>
    </div>
    <div class="standings-table">
      <div class="standings-row standings-title">
        <span>#</span><span>Seleção</span><span>J</span><span>V</span><span>E</span><span>D</span><span>GM</span><span>GS</span><span>DG</span><span>Pts</span>
      </div>
      ${rows.map((r,i)=>`<div class="standings-row ${i<2?"qualified":""}">
        <span>${i+1}</span>
        <strong>${flag(r.team)} ${escapeHtml(r.team)}</strong>
        <span>${r.played}</span><span>${r.wins}</span><span>${r.draws}</span><span>${r.losses}</span>
        <span>${r.gf}</span><span>${r.ga}</span><span>${r.gd}</span><b>${r.points}</b>
      </div>`).join("")}
    </div>
  </section>`).join("");
}
function renderAdmin(){
  const el=$("adminGamesList");
  if(!el) return;
  renderIntegration();
  el.innerHTML=games.map(game=>`<article class="game-card"><div class="match-title"><div><strong>${flag(game.homeTeam)} ${escapeHtml(game.homeTeam)} vs ${flag(game.awayTeam)} ${escapeHtml(game.awayTeam)}</strong><p class="muted">${escapeHtml(groupOf(game))} · ${formatDate(game.matchDate)} · ${escapeHtml(game.venue||"")}</p></div><button class="danger" onclick="window.removeGameFromUI('${game.id}')">Apagar</button></div><div class="result-grid"><label>${escapeHtml(game.homeTeam)}<input id="res_home_${game.id}" type="number" min="0" value="${game.homeScore ?? ""}"></label><label>${escapeHtml(game.awayTeam)}<input id="res_away_${game.id}" type="number" min="0" value="${game.awayScore ?? ""}"></label><button class="primary" onclick="window.setResultFromUI('${game.id}')">Guardar resultado</button><button class="secondary" onclick="window.removeResultFromUI('${game.id}')">Limpar resultado</button><span class="muted">Apostas: ${bets.filter(b=>b.gameId===game.id).length}</span></div></article>`).join("")||`<div class="glass-card">Ainda não existem jogos.</div>`;
}

function renderIntegration(){
  const t=$("integrationText"); if(!t) return;
  const firebaseState = DEMO_MODE || !db ? "Firebase: teste local" : "Firebase: online";
  const apiState = apiConfig.enabled && apiConfig.endpoint ? "API: preparada" : "API: desligada";
  t.textContent = `${firebaseState} · ${apiState}`;
}
function normalizeApiGame(item){
  const id = item.id || item.matchId || `${safeId(item.homeTeam||item.home||item.home_name)}_${safeId(item.awayTeam||item.away||item.away_name)}_${item.matchDate||item.date||item.utcDate||Date.now()}`;
  return {
    id,
    homeTeam: item.homeTeam || item.home || item.home_name || item.homeTeamName || "Casa",
    awayTeam: item.awayTeam || item.away || item.away_name || item.awayTeamName || "Fora",
    matchDate: item.matchDate || item.date || item.utcDate || "",
    venue: item.venue || item.stadium || "",
    phase: item.phase || item.stage || "Mundial",
    group: item.group || item.groupName || item.pool || item.roundGroup || "Outros jogos",
    homeScore: item.homeScore ?? item.scoreHome ?? item.home_score ?? null,
    awayScore: item.awayScore ?? item.scoreAway ?? item.away_score ?? null,
    source: "API",
    createdAt: Date.now()
  };
}
async function upsertGames(imported){
  if(!Array.isArray(imported) || !imported.length) return toast("Não encontrei jogos para importar.");
  if(DEMO_MODE || !db){
    const data=getDemoData();
    const map=new Map(data.games.map(g=>[g.id,g]));
    imported.forEach(g=>map.set(g.id,{...(map.get(g.id)||{}),...g}));
    data.games=[...map.values()];
    saveDemoData(data);
  } else {
    for(const g of imported) await setDoc(doc(db,"games",g.id), g, {merge:true});
  }
  toast(`${imported.length} jogos sincronizados.`);
  await loadData();
}
async function syncFromApi(showToast=true){
  if(!apiConfig.enabled || !apiConfig.endpoint){ if(showToast) toast("API ainda não configurada no config.js."); return; }
  try{
    const headers=apiConfig.apiKey ? {"Authorization":`Bearer ${apiConfig.apiKey}`} : {};
    const res=await fetch(apiConfig.endpoint,{headers});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const json=await res.json();
    const arr=Array.isArray(json) ? json : (json.games || json.matches || json.fixtures || []);
    await upsertGames(arr.map(normalizeApiGame));
  }catch(e){
    console.error(e);
    toast("Não consegui sincronizar a API.");
  }
}
function exportJson(){
  const data={version:APP_CONFIG.appVersion||"9.0", exportedAt:new Date().toISOString(), games, bets};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="mundial-pontos-backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
}
async function importJson(file){
  if(!file) return;
  try{
    const data=JSON.parse(await file.text());
    await upsertGames((data.games||[]).map(normalizeApiGame));
    if(Array.isArray(data.bets) && (DEMO_MODE || !db)){
      const cur=getDemoData();
      cur.bets=data.bets;
      saveDemoData(cur);
      await loadData();
    }
    toast("Importação concluída.");
  }catch(e){
    console.error(e);
    toast("Ficheiro inválido.");
  }
}

function rankingText(){
  const rows=[...getTotals().values()].sort((a,b)=>b.points-a.points||b.exact-a.exact||a.playerName.localeCompare(b.playerName));
  if(!rows.length) return "🏆 CLASSIFICAÇÃO MUNDIAL 2026\n\nAinda não há apostas.";
  return "🏆 CLASSIFICAÇÃO MUNDIAL 2026\n\n" + rows.map((r,i)=>`${i+1}️⃣ ${r.playerName} — ${r.points} pts (${r.exact} exatos)`).join("\n");
}
function todayText(){
  const list=todayGames();
  if(!list.length) return "⭐ JOGOS DE HOJE\n\nHoje não há jogos registados.";
  return "⭐ JOGOS DE HOJE\n\n" + list.map(g=>`${flag(g.homeTeam)} ${g.homeTeam} vs ${flag(g.awayTeam)} ${g.awayTeam}\n⏰ ${formatShortDate(g.matchDate)} · 🏟️ ${g.venue || "A confirmar"}`).join("\n\n");
}
function groupsText(){
  const tables=buildGroupStandings();
  if(!tables.length) return "🌍 CLASSIFICAÇÃO DOS GRUPOS\n\nAinda sem grupos.";
  return "🌍 CLASSIFICAÇÃO DOS GRUPOS\n\n" + tables.map(({group, rows}) =>
    `🏆 ${group}\n` + rows.map((r,i)=>`${i+1}. ${flag(r.team)} ${r.team} — ${r.points} pts | DG ${r.gd}`).join("\n")
  ).join("\n\n");
}
async function copyText(text, msg){
  try{
    await navigator.clipboard.writeText(text);
    toast(msg);
  }catch{
    prompt("Copia o texto:", text);
  }
}

window.saveBetFromUI=id=>saveBet(id,$(`home_${id}`).value,$(`away_${id}`).value);
window.setResultFromUI=id=>setResult(id,$(`res_home_${id}`).value,$(`res_away_${id}`).value);
window.removeResultFromUI=id=>removeResult(id);
window.removeGameFromUI=id=>removeGame(id);

$("enterBtn")?.addEventListener("click",async()=>{
  const name=$("playerNameInput").value.trim();
  if(!name) return toast("Escreve o teu nome.");
  activePlayer=name;
  localStorage.setItem("mundial_active_player",activePlayer);
  await loadData();
});
$("logoutBtn")?.addEventListener("click",()=>{
  activePlayer="";
  isAdmin=false;
  localStorage.removeItem("mundial_active_player");
  localStorage.removeItem("mundial_is_admin");
  renderAll();
});
$("refreshBtn")?.addEventListener("click",loadData);
$("unlockAdminBtn")?.addEventListener("click",()=>{
  if($("adminPinInput").value!==ADMIN_PIN) return toast("PIN errado.");
  isAdmin=true;
  localStorage.setItem("mundial_is_admin","1");
  renderSession();
  renderAdmin();
});
$("addGameBtn")?.addEventListener("click",()=>addGame($("homeTeamInput").value.trim(),$("awayTeamInput").value.trim(),$("matchDateInput").value,$("venueInput").value.trim(),$("phaseInput").value.trim()||"Fase de grupos",$("groupInput").value.trim()||"Grupo A"));
$("resetSeedBtn")?.addEventListener("click",resetSeed);
$("syncApiBtn")?.addEventListener("click",()=>syncFromApi(true));
$("exportBtn")?.addEventListener("click",exportJson);
$("importInput")?.addEventListener("change",e=>importJson(e.target.files?.[0]));
$("searchInput")?.addEventListener("input",e=>{ currentSearch=e.target.value; renderGames(); });

document.querySelectorAll(".filter-chip").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter-chip").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  currentFilter=btn.dataset.filter;
  renderGames();
}));
document.querySelectorAll(".phase-chip").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".phase-chip").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  currentPhase=btn.dataset.phase;
  renderGames();
}));
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
  btn.classList.add("active");
  $(btn.dataset.tab).classList.add("active");
  if(btn.dataset.tab==="groupsTab") renderGroupsTables();
}));

["copyRankingBtn"].forEach(id=>$(id)?.addEventListener("click",()=>copyText(rankingText(),"Classificação copiada para WhatsApp.")));
["copyTodayBtn","copyTodayBtn2"].forEach(id=>$(id)?.addEventListener("click",()=>copyText(todayText(),"Jogos de hoje copiados para WhatsApp.")));
["copyGroupsBtn","copyGroupsBtn2"].forEach(id=>$(id)?.addEventListener("click",()=>copyText(groupsText(),"Classificações dos grupos copiadas.")));

await initFirebase();
if(apiConfig.autoSyncOnOpen) await syncFromApi(false);
await loadData();
