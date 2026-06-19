// Mundial Pontos - v1.2.0 GitHub Pages
// Base pronta para Firebase/API. Em modo teste guarda tudo no localStorage.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, doc, getDocs, setDoc, addDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = { apiKey: "COLOCA_AQUI", authDomain: "COLOCA_AQUI", projectId: "COLOCA_AQUI", storageBucket: "COLOCA_AQUI", messagingSenderId: "COLOCA_AQUI", appId: "COLOCA_AQUI" };
const ADMIN_PIN = "1234";
const DEMO_MODE = firebaseConfig.apiKey === "COLOCA_AQUI";
const demoStoreKey = "mundial_demo_data_v2";

let db = null;
let activePlayer = localStorage.getItem("mundial_active_player") || "";
let isAdmin = localStorage.getItem("mundial_is_admin") === "1";
let games = [];
let bets = [];
let currentFilter = "all";
let currentSearch = "";

const SEED_GAMES = [
  { id:"wc2026-mex-kor", homeTeam:"México", awayTeam:"Coreia do Sul", matchDate:"2026-06-19T01:00", venue:"Estadio Guadalajara", phase:"Fase de grupos", homeScore:1, awayScore:0 },
  { id:"wc2026-can-qat", homeTeam:"Canadá", awayTeam:"Qatar", matchDate:"2026-06-18T22:00", venue:"BC Place Vancouver", phase:"Fase de grupos", homeScore:6, awayScore:0 },
  { id:"wc2026-sui-bih", homeTeam:"Suíça", awayTeam:"Bósnia-Herzegovina", matchDate:"2026-06-18T19:00", venue:"Los Angeles Stadium", phase:"Fase de grupos", homeScore:4, awayScore:1 },
  { id:"wc2026-cze-rsa", homeTeam:"Chéquia", awayTeam:"África do Sul", matchDate:"2026-06-18T16:00", venue:"Atlanta Stadium", phase:"Fase de grupos", homeScore:1, awayScore:1 },
  { id:"wc2026-uzb-col", homeTeam:"Uzbequistão", awayTeam:"Colômbia", matchDate:"2026-06-18T02:00", venue:"Mexico City Stadium", phase:"Fase de grupos", homeScore:1, awayScore:3 },
  { id:"wc2026-eng-cro", homeTeam:"Inglaterra", awayTeam:"Croácia", matchDate:"2026-06-17T20:00", venue:"Dallas Stadium", phase:"Fase de grupos", homeScore:4, awayScore:2 },
  { id:"wc2026-por-cod", homeTeam:"Portugal", awayTeam:"RD Congo", matchDate:"2026-06-17T17:00", venue:"Houston Stadium", phase:"Fase de grupos", homeScore:1, awayScore:1 },
  { id:"wc2026-usa-aus", homeTeam:"Estados Unidos", awayTeam:"Austrália", matchDate:"2026-06-19T19:00", venue:"Seattle Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-sco-mar", homeTeam:"Escócia", awayTeam:"Marrocos", matchDate:"2026-06-19T22:00", venue:"Boston Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-bra-hai", homeTeam:"Brasil", awayTeam:"Haiti", matchDate:"2026-06-20T00:30", venue:"Philadelphia Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-tur-par", homeTeam:"Turquia", awayTeam:"Paraguai", matchDate:"2026-06-20T03:00", venue:"San Francisco Bay Area Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-ned-swe", homeTeam:"Países Baixos", awayTeam:"Suécia", matchDate:"2026-06-20T17:00", venue:"Houston Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-ger-civ", homeTeam:"Alemanha", awayTeam:"Costa do Marfim", matchDate:"2026-06-20T20:00", venue:"Toronto Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-ecu-cuw", homeTeam:"Equador", awayTeam:"Curaçao", matchDate:"2026-06-21T00:00", venue:"Kansas City Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-tun-jpn", homeTeam:"Tunísia", awayTeam:"Japão", matchDate:"2026-06-21T04:00", venue:"Estadio Monterrey", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-esp-ksa", homeTeam:"Espanha", awayTeam:"Arábia Saudita", matchDate:"2026-06-21T16:00", venue:"Atlanta Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-bel-irn", homeTeam:"Bélgica", awayTeam:"Irão", matchDate:"2026-06-21T19:00", venue:"Los Angeles Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-uru-cpv", homeTeam:"Uruguai", awayTeam:"Cabo Verde", matchDate:"2026-06-21T22:00", venue:"Miami Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-arg-aut", homeTeam:"Argentina", awayTeam:"Áustria", matchDate:"2026-06-22T17:00", venue:"Dallas Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-fra-irq", homeTeam:"França", awayTeam:"Iraque", matchDate:"2026-06-22T21:00", venue:"Philadelphia Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null },
  { id:"wc2026-por-uzb", homeTeam:"Portugal", awayTeam:"Uzbequistão", matchDate:"2026-06-23T17:00", venue:"Houston Stadium", phase:"Fase de grupos", homeScore:null, awayScore:null }
].map(g => ({ ...g, createdAt: Date.now(), source:"Base SuperSport/FIFA" }));

const defaultDemo = { games: SEED_GAMES, bets: [] };
const $ = id => document.getElementById(id);
const hasResult = game => game && game.homeScore !== null && game.homeScore !== undefined && game.awayScore !== null && game.awayScore !== undefined;
const isLocked = game => hasResult(game) || new Date(game.matchDate).getTime() <= Date.now();
const safeId = text => text.toLowerCase().trim().replace(/[^a-z0-9]+/gi, "_");
const outcome = (h,a) => Number(h)>Number(a) ? "home" : Number(h)<Number(a) ? "away" : "draw";
const escapeHtml = text => String(text ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

function toast(message){ const el=$("toast"); el.textContent=message; el.classList.remove("hidden"); setTimeout(()=>el.classList.add("hidden"),2800); }
function getDemoData(){ const raw=localStorage.getItem(demoStoreKey); if(!raw){ localStorage.setItem(demoStoreKey, JSON.stringify(defaultDemo)); return structuredClone(defaultDemo); } return JSON.parse(raw); }
function saveDemoData(data){ localStorage.setItem(demoStoreKey, JSON.stringify(data)); }
function formatDate(value){ if(!value) return "Sem data"; return new Date(value).toLocaleString("pt-PT", { weekday:"short", day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }); }
function statusOf(game){ if(hasResult(game)) return { label:"Terminado", cls:"closed" }; if(isLocked(game)) return { label:"Apostas fechadas", cls:"locked" }; return { label:"Aberto", cls:"open" }; }
function exactBet(bet, game){ return Number(bet.homeGuess) === Number(game.homeScore) && Number(bet.awayGuess) === Number(game.awayScore); }
function pointsForBet(bet, game){ if(!game || !hasResult(game)) return 0; if(exactBet(bet, game)) return 3; return outcome(bet.homeGuess, bet.awayGuess) === outcome(game.homeScore, game.awayScore) ? 1 : 0; }

async function initFirebase(){ if(DEMO_MODE) return; const app=initializeApp(firebaseConfig); db=getFirestore(app); }
async function loadData(){
  if(DEMO_MODE){ const data=getDemoData(); games=data.games.sort((a,b)=>String(a.matchDate).localeCompare(String(b.matchDate))); bets=data.bets; renderAll(); return; }
  const gamesSnap=await getDocs(query(collection(db,"games"), orderBy("matchDate","asc"))); games=gamesSnap.docs.map(d=>({id:d.id,...d.data()}));
  const betsSnap=await getDocs(collection(db,"bets")); bets=betsSnap.docs.map(d=>({id:d.id,...d.data()})); renderAll();
}
async function saveBet(gameId, homeGuess, awayGuess){
  if(!activePlayer) return toast("Entra primeiro com o teu nome.");
  const game=games.find(g=>g.id===gameId); if(!game) return;
  if(isLocked(game)) return toast("As apostas deste jogo já estão fechadas.");
  if(homeGuess==="" || awayGuess==="") return toast("Preenche o resultado completo.");
  const bet={gameId, playerName:activePlayer, homeGuess:Number(homeGuess), awayGuess:Number(awayGuess), updatedAt:Date.now()};
  if(DEMO_MODE){ const data=getDemoData(); data.bets=data.bets.filter(b=>!(b.gameId===gameId && b.playerName===activePlayer)); data.bets.push({id:`${gameId}_${activePlayer}`,...bet}); saveDemoData(data); }
  else await setDoc(doc(db,"bets",`${gameId}_${safeId(activePlayer)}`), {...bet, updatedAt:serverTimestamp()});
  toast("Aposta guardada."); await loadData();
}
async function addGame(homeTeam, awayTeam, matchDate, venue="", phase="Fase de grupos"){
  if(!homeTeam || !awayTeam || !matchDate) return toast("Preenche os dados do jogo.");
  const game={homeTeam, awayTeam, matchDate, venue, phase, homeScore:null, awayScore:null, createdAt:Date.now(), source:"Manual"};
  if(DEMO_MODE){ const data=getDemoData(); data.games.push({id:crypto.randomUUID(),...game}); saveDemoData(data); } else await addDoc(collection(db,"games"), {...game, createdAt:serverTimestamp()});
  ["homeTeamInput","awayTeamInput","matchDateInput","venueInput"].forEach(id=>$(id) && ($(id).value="")); toast("Jogo adicionado."); await loadData();
}
async function setResult(gameId, homeScore, awayScore){
  if(homeScore==="" || awayScore==="") return toast("Coloca o resultado completo.");
  if(DEMO_MODE){ const data=getDemoData(); data.games=data.games.map(g=>g.id===gameId ? {...g, homeScore:Number(homeScore), awayScore:Number(awayScore)} : g); saveDemoData(data); }
  else await setDoc(doc(db,"games",gameId), {homeScore:Number(homeScore), awayScore:Number(awayScore)}, {merge:true});
  toast("Resultado guardado e ranking atualizado."); await loadData();
}
async function removeResult(gameId){
  if(DEMO_MODE){ const data=getDemoData(); data.games=data.games.map(g=>g.id===gameId ? {...g, homeScore:null, awayScore:null} : g); saveDemoData(data); }
  else await setDoc(doc(db,"games",gameId), {homeScore:null, awayScore:null}, {merge:true});
  toast("Resultado removido."); await loadData();
}
async function removeGame(gameId){
  if(!confirm("Apagar este jogo e as apostas associadas?")) return;
  if(DEMO_MODE){ const data=getDemoData(); data.games=data.games.filter(g=>g.id!==gameId); data.bets=data.bets.filter(b=>b.gameId!==gameId); saveDemoData(data); } else await deleteDoc(doc(db,"games",gameId));
  toast("Jogo apagado."); await loadData();
}
async function resetSeed(){ if(!confirm("Isto repõe a lista base e apaga apostas em modo teste. Continuar?")) return; saveDemoData(structuredClone(defaultDemo)); toast("Lista base reposta."); await loadData(); }

function getVisibleGames(){ return games.filter(g => {
  const txt=`${g.homeTeam} ${g.awayTeam} ${g.venue} ${g.phase}`.toLowerCase();
  const matchesSearch=!currentSearch || txt.includes(currentSearch.toLowerCase());
  const matchesFilter=currentFilter==="all" || (currentFilter==="open" && !isLocked(g)) || (currentFilter==="locked" && isLocked(g) && !hasResult(g)) || (currentFilter==="finished" && hasResult(g));
  return matchesSearch && matchesFilter;
}); }
function getTotals(){ const totals=new Map(); bets.forEach(b=>{ const g=games.find(x=>x.id===b.gameId); const cur=totals.get(b.playerName)||{playerName:b.playerName,points:0,exact:0,played:0}; cur.points+=pointsForBet(b,g); if(g&&hasResult(g)) cur.played+=1; if(g&&exactBet(b,g)) cur.exact+=1; totals.set(b.playerName,cur); }); if(activePlayer&&!totals.has(activePlayer)) totals.set(activePlayer,{playerName:activePlayer,points:0,exact:0,played:0}); return totals; }
function renderAll(){ renderSession(); renderStats(); renderGames(); renderRanking(); renderAdmin(); }
function renderSession(){ $("activeUserLabel").textContent=activePlayer||"Sem jogador"; $("logoutBtn").classList.toggle("hidden",!activePlayer); $("loginView").classList.toggle("hidden",!!activePlayer); $("mainView").classList.toggle("hidden",!activePlayer); $("adminLocked").classList.toggle("hidden",isAdmin); $("adminUnlocked").classList.toggle("hidden",!isAdmin); }
function renderStats(){ const players=new Set(bets.map(b=>b.playerName)); if(activePlayer) players.add(activePlayer); const done=games.filter(hasResult).length; const open=games.filter(g=>!isLocked(g)).length; $("statGames").textContent=games.length; $("statBets").textContent=bets.length; $("statPlayers").textContent=players.size; $("statMyPoints").textContent=getTotals().get(activePlayer)?.points||0; if($("statFinished")) $("statFinished").textContent=done; if($("statOpen")) $("statOpen").textContent=open; }
function renderGames(){
  const el=$("gamesList"); const list=getVisibleGames(); if(!list.length){ el.innerHTML=`<div class="glass-card">Não encontrei jogos com esse filtro.</div>`; return; }
  el.innerHTML=list.map(game=>{ const myBet=bets.find(b=>b.gameId===game.id&&b.playerName===activePlayer); const st=statusOf(game); const resultText=hasResult(game)?`${game.homeScore} - ${game.awayScore}`:"Por jogar"; const pts=myBet?pointsForBet(myBet,game):0; const locked=isLocked(game);
    return `<article class="game-card ${st.cls}">
      <div class="match-title">
        <div><span class="phase-pill">${escapeHtml(game.phase||"Mundial")}</span><strong>${escapeHtml(game.homeTeam)} <span>vs</span> ${escapeHtml(game.awayTeam)}</strong><p class="muted">${formatDate(game.matchDate)} · ${escapeHtml(game.venue||"Estádio a confirmar")}</p></div>
        <span class="badge ${st.cls}">${st.label}</span>
      </div>
      <div class="score-strip"><span>Resultado real</span><strong>${resultText}</strong><span>${myBet ? `A tua aposta: ${myBet.homeGuess}-${myBet.awayGuess} · ${pts} pts` : "Ainda sem aposta"}</span></div>
      <div class="bet-grid">
        <label>${escapeHtml(game.homeTeam)}<input id="home_${game.id}" type="number" min="0" value="${myBet?.homeGuess ?? ""}" ${locked?"disabled":""}></label>
        <label>${escapeHtml(game.awayTeam)}<input id="away_${game.id}" type="number" min="0" value="${myBet?.awayGuess ?? ""}" ${locked?"disabled":""}></label>
        <button class="primary" onclick="window.saveBetFromUI('${game.id}')" ${locked?"disabled":""}>Guardar aposta</button>
      </div>
    </article>`; }).join("");
}
function renderRanking(){ const rows=[...getTotals().values()].sort((a,b)=>b.points-a.points||b.exact-a.exact||a.playerName.localeCompare(b.playerName)); $("rankingList").innerHTML=rows.length?rows.map((r,i)=>`<div class="ranking-row"><div class="rank-number">${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div><div><strong>${escapeHtml(r.playerName)}</strong><p class="muted">Jogos pontuados: ${r.played} · Exatos: ${r.exact}</p></div><div class="points">${r.points} pts</div></div>`).join(""):`<div class="glass-card">Ainda não existem apostas.</div>`; }
function renderAdmin(){ const el=$("adminGamesList"); if(!el) return; el.innerHTML=games.map(game=>`<article class="game-card"><div class="match-title"><div><strong>${escapeHtml(game.homeTeam)} vs ${escapeHtml(game.awayTeam)}</strong><p class="muted">${formatDate(game.matchDate)} · ${escapeHtml(game.venue||"")}</p></div><button class="danger" onclick="window.removeGameFromUI('${game.id}')">Apagar</button></div><div class="result-grid"><label>${escapeHtml(game.homeTeam)}<input id="res_home_${game.id}" type="number" min="0" value="${game.homeScore ?? ""}"></label><label>${escapeHtml(game.awayTeam)}<input id="res_away_${game.id}" type="number" min="0" value="${game.awayScore ?? ""}"></label><button class="primary" onclick="window.setResultFromUI('${game.id}')">Guardar resultado</button><button class="secondary" onclick="window.removeResultFromUI('${game.id}')">Limpar resultado</button><span class="muted">Apostas: ${bets.filter(b=>b.gameId===game.id).length}</span></div></article>`).join("")||`<div class="glass-card">Ainda não existem jogos.</div>`; }

window.saveBetFromUI=id=>saveBet(id,$(`home_${id}`).value,$(`away_${id}`).value);
window.setResultFromUI=id=>setResult(id,$(`res_home_${id}`).value,$(`res_away_${id}`).value);
window.removeResultFromUI=id=>removeResult(id);
window.removeGameFromUI=id=>removeGame(id);

$("enterBtn").addEventListener("click",async()=>{ const name=$("playerNameInput").value.trim(); if(!name) return toast("Escreve o teu nome."); activePlayer=name; localStorage.setItem("mundial_active_player",activePlayer); await loadData(); });
$("logoutBtn").addEventListener("click",()=>{ activePlayer=""; isAdmin=false; localStorage.removeItem("mundial_active_player"); localStorage.removeItem("mundial_is_admin"); renderAll(); });
$("refreshBtn").addEventListener("click",loadData);
$("unlockAdminBtn").addEventListener("click",()=>{ if($("adminPinInput").value!==ADMIN_PIN) return toast("PIN errado."); isAdmin=true; localStorage.setItem("mundial_is_admin","1"); renderSession(); renderAdmin(); });
$("addGameBtn").addEventListener("click",()=>addGame($("homeTeamInput").value.trim(),$("awayTeamInput").value.trim(),$("matchDateInput").value,$("venueInput").value.trim()));
$("resetSeedBtn")?.addEventListener("click",resetSeed);
$("searchInput")?.addEventListener("input",e=>{ currentSearch=e.target.value; renderGames(); });
document.querySelectorAll(".filter-chip").forEach(btn=>btn.addEventListener("click",()=>{ document.querySelectorAll(".filter-chip").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); currentFilter=btn.dataset.filter; renderGames(); }));
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{ document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active")); document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active")); btn.classList.add("active"); $(btn.dataset.tab).classList.add("active"); }));

await initFirebase(); await loadData();
