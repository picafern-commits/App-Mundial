// Mundial Pontos - v14.0 Calendário Limpo
// Firebase/API configuráveis via config.js. Modo teste continua ativo sem configuração.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, doc, getDocs, setDoc, addDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const APP_CONFIG = window.MUNDIAL_CONFIG || {};
const firebaseConfig = APP_CONFIG.firebase || {};
const apiConfig = APP_CONFIG.api || {};
const ADMIN_PIN = APP_CONFIG.adminPin || "1234";
const DEMO_MODE = !firebaseConfig.apiKey || firebaseConfig.apiKey === "COLOCA_AQUI";
const demoStoreKey = "mundial_demo_data_v14";

let db = null;
let activePlayer = "__single_user__";
let isAdmin = localStorage.getItem("mundial_is_admin") === "1";
let games = [];
let bets = [];
let currentFilter = "all";
let currentSearch = "";
let currentPhase = "groups";

const SEED_GAMES = [
  {
    "id": "wc2026-groups-001",
    "group": "Grupo A",
    "homeTeam": "México",
    "awayTeam": "África do Sul",
    "matchDate": "2026-06-11T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-002",
    "group": "Grupo A",
    "homeTeam": "Coreia do Sul",
    "awayTeam": "Chéquia",
    "matchDate": "2026-06-12T03:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-003",
    "group": "Grupo B",
    "homeTeam": "Canadá",
    "awayTeam": "Bósnia",
    "matchDate": "2026-06-12T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-004",
    "group": "Grupo D",
    "homeTeam": "Estados Unidos",
    "awayTeam": "Paraguai",
    "matchDate": "2026-06-13T02:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-005",
    "group": "Grupo B",
    "homeTeam": "Qatar",
    "awayTeam": "Suíça",
    "matchDate": "2026-06-13T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-006",
    "group": "Grupo C",
    "homeTeam": "Brasil",
    "awayTeam": "Marrocos",
    "matchDate": "2026-06-13T23:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-007",
    "group": "Grupo C",
    "homeTeam": "Haiti",
    "awayTeam": "Escócia",
    "matchDate": "2026-06-14T02:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-008",
    "group": "Grupo D",
    "homeTeam": "Austrália",
    "awayTeam": "Turquia",
    "matchDate": "2026-06-14T05:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-009",
    "group": "Grupo E",
    "homeTeam": "Alemanha",
    "awayTeam": "Curaçao",
    "matchDate": "2026-06-14T18:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-010",
    "group": "Grupo F",
    "homeTeam": "Países Baixos",
    "awayTeam": "Japão",
    "matchDate": "2026-06-14T21:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-011",
    "group": "Grupo E",
    "homeTeam": "Costa do Marfim",
    "awayTeam": "Equador",
    "matchDate": "2026-06-15T00:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-012",
    "group": "Grupo F",
    "homeTeam": "Suécia",
    "awayTeam": "Tunísia",
    "matchDate": "2026-06-15T03:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-013",
    "group": "Grupo H",
    "homeTeam": "Espanha",
    "awayTeam": "Cabo Verde",
    "matchDate": "2026-06-15T17:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-014",
    "group": "Grupo G",
    "homeTeam": "Bélgica",
    "awayTeam": "Egito",
    "matchDate": "2026-06-15T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-015",
    "group": "Grupo H",
    "homeTeam": "Arábia Saudita",
    "awayTeam": "Uruguai",
    "matchDate": "2026-06-15T23:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-016",
    "group": "Grupo G",
    "homeTeam": "Irão",
    "awayTeam": "Nova Zelândia",
    "matchDate": "2026-06-16T02:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-017",
    "group": "Grupo I",
    "homeTeam": "França",
    "awayTeam": "Senegal",
    "matchDate": "2026-06-16T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-018",
    "group": "Grupo I",
    "homeTeam": "Iraque",
    "awayTeam": "Noruega",
    "matchDate": "2026-06-16T23:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-019",
    "group": "Grupo J",
    "homeTeam": "Argentina",
    "awayTeam": "Argélia",
    "matchDate": "2026-06-17T02:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-020",
    "group": "Grupo J",
    "homeTeam": "Áustria",
    "awayTeam": "Jordânia",
    "matchDate": "2026-06-17T05:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-021",
    "group": "Grupo K",
    "homeTeam": "Portugal",
    "awayTeam": "RD Congo",
    "matchDate": "2026-06-17T18:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-022",
    "group": "Grupo L",
    "homeTeam": "Inglaterra",
    "awayTeam": "Croácia",
    "matchDate": "2026-06-17T21:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-023",
    "group": "Grupo L",
    "homeTeam": "Gana",
    "awayTeam": "Panamá",
    "matchDate": "2026-06-18T00:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-024",
    "group": "Grupo K",
    "homeTeam": "Uzbequistão",
    "awayTeam": "Colômbia",
    "matchDate": "2026-06-18T03:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-025",
    "group": "Grupo A",
    "homeTeam": "Chéquia",
    "awayTeam": "África do Sul",
    "matchDate": "2026-06-18T17:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-026",
    "group": "Grupo B",
    "homeTeam": "Suíça",
    "awayTeam": "Bósnia",
    "matchDate": "2026-06-18T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-027",
    "group": "Grupo B",
    "homeTeam": "Canadá",
    "awayTeam": "Qatar",
    "matchDate": "2026-06-18T23:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-028",
    "group": "Grupo A",
    "homeTeam": "México",
    "awayTeam": "Coreia do Sul",
    "matchDate": "2026-06-19T02:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-029",
    "group": "Grupo D",
    "homeTeam": "Estados Unidos",
    "awayTeam": "Austrália",
    "matchDate": "2026-06-19T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-030",
    "group": "Grupo C",
    "homeTeam": "Escócia",
    "awayTeam": "Marrocos",
    "matchDate": "2026-06-19T23:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-031",
    "group": "Grupo C",
    "homeTeam": "Brasil",
    "awayTeam": "Haiti",
    "matchDate": "2026-06-20T01:30",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-032",
    "group": "Grupo D",
    "homeTeam": "Turquia",
    "awayTeam": "Paraguai",
    "matchDate": "2026-06-20T04:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-033",
    "group": "Grupo F",
    "homeTeam": "Países Baixos",
    "awayTeam": "Suécia",
    "matchDate": "2026-06-20T18:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-034",
    "group": "Grupo E",
    "homeTeam": "Alemanha",
    "awayTeam": "Costa do Marfim",
    "matchDate": "2026-06-20T21:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-035",
    "group": "Grupo E",
    "homeTeam": "Equador",
    "awayTeam": "Curaçao",
    "matchDate": "2026-06-21T01:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-036",
    "group": "Grupo F",
    "homeTeam": "Tunísia",
    "awayTeam": "Japão",
    "matchDate": "2026-06-21T05:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-037",
    "group": "Grupo H",
    "homeTeam": "Espanha",
    "awayTeam": "Arábia Saudita",
    "matchDate": "2026-06-21T17:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-038",
    "group": "Grupo G",
    "homeTeam": "Bélgica",
    "awayTeam": "Irão",
    "matchDate": "2026-06-21T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-039",
    "group": "Grupo H",
    "homeTeam": "Uruguai",
    "awayTeam": "Cabo Verde",
    "matchDate": "2026-06-21T23:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-040",
    "group": "Grupo G",
    "homeTeam": "Nova Zelândia",
    "awayTeam": "Egito",
    "matchDate": "2026-06-22T02:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-041",
    "group": "Grupo J",
    "homeTeam": "Argentina",
    "awayTeam": "Áustria",
    "matchDate": "2026-06-22T18:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-042",
    "group": "Grupo I",
    "homeTeam": "França",
    "awayTeam": "Iraque",
    "matchDate": "2026-06-22T22:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-043",
    "group": "Grupo I",
    "homeTeam": "Noruega",
    "awayTeam": "Senegal",
    "matchDate": "2026-06-23T01:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-044",
    "group": "Grupo J",
    "homeTeam": "Jordânia",
    "awayTeam": "Argélia",
    "matchDate": "2026-06-23T04:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-045",
    "group": "Grupo K",
    "homeTeam": "Portugal",
    "awayTeam": "Uzbequistão",
    "matchDate": "2026-06-23T18:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-046",
    "group": "Grupo L",
    "homeTeam": "Inglaterra",
    "awayTeam": "Gana",
    "matchDate": "2026-06-23T21:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-047",
    "group": "Grupo L",
    "homeTeam": "Panamá",
    "awayTeam": "Croácia",
    "matchDate": "2026-06-24T00:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-048",
    "group": "Grupo K",
    "homeTeam": "Colômbia",
    "awayTeam": "RD Congo",
    "matchDate": "2026-06-24T03:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-049",
    "group": "Grupo B",
    "homeTeam": "Suíça",
    "awayTeam": "Canadá",
    "matchDate": "2026-06-24T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-050",
    "group": "Grupo B",
    "homeTeam": "Bósnia",
    "awayTeam": "Qatar",
    "matchDate": "2026-06-24T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-051",
    "group": "Grupo C",
    "homeTeam": "Escócia",
    "awayTeam": "Brasil",
    "matchDate": "2026-06-24T23:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-052",
    "group": "Grupo C",
    "homeTeam": "Marrocos",
    "awayTeam": "Haiti",
    "matchDate": "2026-06-24T23:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-053",
    "group": "Grupo A",
    "homeTeam": "África do Sul",
    "awayTeam": "Coreia do Sul",
    "matchDate": "2026-06-25T02:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-054",
    "group": "Grupo A",
    "homeTeam": "Chéquia",
    "awayTeam": "México",
    "matchDate": "2026-06-25T02:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-055",
    "group": "Grupo E",
    "homeTeam": "Curaçao",
    "awayTeam": "Costa do Marfim",
    "matchDate": "2026-06-25T21:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-056",
    "group": "Grupo E",
    "homeTeam": "Equador",
    "awayTeam": "Alemanha",
    "matchDate": "2026-06-25T21:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-057",
    "group": "Grupo F",
    "homeTeam": "Tunísia",
    "awayTeam": "Países Baixos",
    "matchDate": "2026-06-26T00:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-058",
    "group": "Grupo F",
    "homeTeam": "Japão",
    "awayTeam": "Suécia",
    "matchDate": "2026-06-26T00:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-059",
    "group": "Grupo D",
    "homeTeam": "Turquia",
    "awayTeam": "Estados Unidos",
    "matchDate": "2026-06-26T03:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-060",
    "group": "Grupo D",
    "homeTeam": "Paraguai",
    "awayTeam": "Austrália",
    "matchDate": "2026-06-26T03:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-061",
    "group": "Grupo I",
    "homeTeam": "Noruega",
    "awayTeam": "França",
    "matchDate": "2026-06-26T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-062",
    "group": "Grupo I",
    "homeTeam": "Senegal",
    "awayTeam": "Iraque",
    "matchDate": "2026-06-26T20:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-063",
    "group": "Grupo H",
    "homeTeam": "Cabo Verde",
    "awayTeam": "Arábia Saudita",
    "matchDate": "2026-06-27T01:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-064",
    "group": "Grupo H",
    "homeTeam": "Uruguai",
    "awayTeam": "Espanha",
    "matchDate": "2026-06-27T01:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-065",
    "group": "Grupo G",
    "homeTeam": "Nova Zelândia",
    "awayTeam": "Bélgica",
    "matchDate": "2026-06-27T04:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-066",
    "group": "Grupo G",
    "homeTeam": "Egito",
    "awayTeam": "Irão",
    "matchDate": "2026-06-27T04:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-067",
    "group": "Grupo L",
    "homeTeam": "Panamá",
    "awayTeam": "Inglaterra",
    "matchDate": "2026-06-27T22:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-068",
    "group": "Grupo L",
    "homeTeam": "Croácia",
    "awayTeam": "Gana",
    "matchDate": "2026-06-27T22:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-069",
    "group": "Grupo K",
    "homeTeam": "Colômbia",
    "awayTeam": "Portugal",
    "matchDate": "2026-06-28T00:30",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-070",
    "group": "Grupo K",
    "homeTeam": "RD Congo",
    "awayTeam": "Uzbequistão",
    "matchDate": "2026-06-28T00:30",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-071",
    "group": "Grupo J",
    "homeTeam": "Argélia",
    "awayTeam": "Áustria",
    "matchDate": "2026-06-28T03:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  },
  {
    "id": "wc2026-groups-072",
    "group": "Grupo J",
    "homeTeam": "Jordânia",
    "awayTeam": "Argentina",
    "matchDate": "2026-06-28T03:00",
    "venue": "A confirmar",
    "phase": "Fase de grupos",
    "homeScore": null,
    "awayScore": null
  }
].map(g => ({ ...g, createdAt: Date.now(), source:"Calendário fase grupos" }));

const FLAG_MAP = {
  "Portugal": "🇵🇹",
  "África do Sul": "🇿🇦",
  "México": "🇲🇽",
  "Coreia do Sul": "🇰🇷",
  "Chéquia": "🇨🇿",
  "Canadá": "🇨🇦",
  "Bósnia": "🇧🇦",
  "Bósnia-Herzegovina": "🇧🇦",
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

const defaultDemo = { games: SEED_GAMES, bets: [] };
const $ = id => document.getElementById(id);
const hasResult = game => game && game.homeScore !== null && game.homeScore !== undefined && game.awayScore !== null && game.awayScore !== undefined;
const isLocked = game => hasResult(game) || new Date(game.matchDate).getTime() <= Date.now();
const safeId = text => String(text ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/gi, "_");
const outcome = (h,a) => Number(h)>Number(a) ? "home" : Number(h)<Number(a) ? "away" : "draw";
const escapeHtml = text => String(text ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

const PORTUGAL_TZ = "Europe/Lisbon";
function parseDateValue(value){
  if(!value) return null;
  const text = String(value);
  if(/[zZ]$|[+-]\d{2}:\d{2}$/.test(text)) return new Date(text);
  const m = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if(m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]), Number(m[4]), Number(m[5]));
  return new Date(text);
}
function portugalDateKey(value){
  const d = parseDateValue(value);
  if(!d || Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: PORTUGAL_TZ, year:"numeric", month:"2-digit", day:"2-digit" }).format(d);
}
function todayPortugalKey(){
  return new Intl.DateTimeFormat("en-CA", { timeZone: PORTUGAL_TZ, year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
}
function portugalLongDate(value){
  const d = parseDateValue(value);
  if(!d || Number.isNaN(d.getTime())) return "Sem data";
  return new Intl.DateTimeFormat("pt-PT", { timeZone: PORTUGAL_TZ, weekday:"long", day:"2-digit", month:"long" }).format(d);
}
function portugalTimeOnly(value){
  const d = parseDateValue(value);
  if(!d || Number.isNaN(d.getTime())) return "--:--";
  return new Intl.DateTimeFormat("pt-PT", { timeZone: PORTUGAL_TZ, hour:"2-digit", minute:"2-digit" }).format(d);
}
function portugalDateTime(value, short=false){
  const d = parseDateValue(value);
  if(!d || Number.isNaN(d.getTime())) return "Sem data";
  const opts = short
    ? { timeZone: PORTUGAL_TZ, day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }
    : { timeZone: PORTUGAL_TZ, weekday:"short", day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" };
  return new Intl.DateTimeFormat("pt-PT", opts).format(d).replace(",", "") + " 🇵🇹";
}
function isGroupStage(game){
  return phaseKey(game) === "groups";
}
function displaySectionName(game){
  return isGroupStage(game) ? groupOf(game) : phaseLabel(phaseKey(game));
}

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
  return portugalDateTime(value, false);
}
function formatShortDate(value){
  return portugalDateTime(value, true);
}
function statusOf(game){
  if(hasResult(game)) return { label:"Terminado", cls:"closed" };
  if(isLocked(game)) return { label:"Apostas fechadas", cls:"locked" };
  return { label:"Aberto", cls:"open" };
}
function groupOf(game){ return game.group || game.groupName || game.pool || game.phase || "Outros jogos"; }
function groupSortKey(group){
  const text = String(group || "");
  const letter = text.match(/Grupo\s+([A-Z])/i);
  if(letter) return `0_${letter[1].toUpperCase()}`;
  const phaseOrder = { "Oitavos": "1", "Oitavos de Final": "1", "Quartos": "2", "Quartos de Final": "2", "Meias": "3", "Meias-Finais": "3", "Final": "4" };
  return `${phaseOrder[text] || "9"}_${text}`;
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
  activePlayer = "__single_user__";
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
  toast("Resultado guardado. Pontos e ranking atualizados automaticamente.");
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
    const txt=`${g.homeTeam} ${g.awayTeam} ${g.venue} ${g.phase} ${g.group} ${groupOf(g)}`.toLowerCase();
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
  const today = todayPortugalKey();
  return games.filter(g => portugalDateKey(g.matchDate) === today);
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
  activePlayer = "__single_user__";
  $("loginView")?.classList.add("hidden");
  $("mainView")?.classList.remove("hidden");
  $("adminLocked")?.classList.toggle("hidden",isAdmin);
  $("adminUnlocked")?.classList.toggle("hidden",!isAdmin);
}
function renderStats(){
  const done=games.filter(hasResult).length;
  const open=games.filter(g=>!isLocked(g)).length;
  $("statGames").textContent=games.length;
  if($("statBets")) $("statBets").textContent=bets.length;
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
  const list=getVisibleGames().filter(g => phaseKey(g)==="groups");
  if(!list.length){ el.innerHTML=`<div class="glass-card">Não encontrei jogos com esse filtro.</div>`; return; }

  const groupedByDate = new Map();
  list.forEach(game => {
    const key = portugalDateKey(game.matchDate);
    if(!groupedByDate.has(key)) groupedByDate.set(key, []);
    groupedByDate.get(key).push(game);
  });

  const days = [...groupedByDate.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  el.innerHTML = `<div class="calendar-clean">${days.map(([dateKey, dayGames]) => {
    const label = portugalLongDate(dayGames[0].matchDate);
    return `<section class="calendar-day">
      <div class="calendar-date">${escapeHtml(label)}</div>
      <div class="calendar-matches">
        ${dayGames.sort((a,b)=>String(a.matchDate).localeCompare(String(b.matchDate))).map(renderCalendarRow).join("")}
      </div>
    </section>`;
  }).join("")}</div>`;
}
function renderGameCard(game){
  const myBet=bets.find(b=>b.gameId===game.id&&b.playerName===activePlayer);
  const st=statusOf(game);
  const resultText=hasResult(game)?`${game.homeScore} - ${game.awayScore}`:"VS";
  const pts=myBet?pointsForBet(myBet,game):0;
  const betLabel = !myBet ? "Ainda sem aposta" : !hasResult(game) ? `A tua aposta: <strong>${myBet.homeGuess}-${myBet.awayGuess}</strong> · à espera do resultado` : `A tua aposta: <strong>${myBet.homeGuess}-${myBet.awayGuess}</strong> · <strong>${pts} pts</strong>`;
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
        <small>${hasResult(game) ? "Resultado final" : "Hora Portugal"}</small>
      </div>
      <div class="team-pro right">
        <span class="flag-ball">${flag(game.awayTeam)}</span>
        <strong>${escapeHtml(game.awayTeam)}</strong>
      </div>
    </div>
    <div class="match-meta-pro">🏟️ ${escapeHtml(game.venue||"Estádio a confirmar")} · 🕒 ${formatDate(game.matchDate)} · ${escapeHtml(groupOf(game))}</div>
    <div class="bet-status-pro">${betLabel}</div>
    <div class="bet-grid bet-grid-pro">
      <label>${escapeHtml(game.homeTeam)}<input id="home_${game.id}" type="number" min="0" value="${myBet?.homeGuess ?? ""}" ${locked?"disabled":""}></label>
      <label>${escapeHtml(game.awayTeam)}<input id="away_${game.id}" type="number" min="0" value="${myBet?.awayGuess ?? ""}" ${locked?"disabled":""}></label>
      <button class="primary" onclick="window.saveBetFromUI('${game.id}')" ${locked?"disabled":""}>Guardar</button>
    </div>
  </article>`;
}

function renderCalendarRow(game){
  const myBet = bets.find(b=>b.gameId===game.id && b.playerName===activePlayer);
  const st = statusOf(game);
  const locked = isLocked(game);
  const pts = myBet ? pointsForBet(myBet, game) : 0;
  const resultText = hasResult(game) ? `${game.homeScore}-${game.awayScore}` : "Por jogar";
  const betText = !myBet ? "Sem aposta" : !hasResult(game) ? `Aposta ${myBet.homeGuess}-${myBet.awayGuess}` : `Aposta ${myBet.homeGuess}-${myBet.awayGuess} · ${pts} pts`;
  return `<article class="calendar-match ${st.cls}">
    <div class="cal-group">${escapeHtml(groupOf(game))}</div>
    <div class="cal-teams">
      <span class="cal-team">${flag(game.homeTeam)} <strong>${escapeHtml(game.homeTeam)}</strong></span>
      <span class="cal-vs">${hasResult(game) ? resultText : "vs"}</span>
      <span class="cal-team right">${flag(game.awayTeam)} <strong>${escapeHtml(game.awayTeam)}</strong></span>
    </div>
    <div class="cal-time">${portugalTimeOnly(game.matchDate)}</div>
    <div class="cal-status">
      <span class="badge ${st.cls}">${hasResult(game) ? "Jogado" : (locked ? "Fechado" : "Por jogar")}</span>
      <small>${betText}</small>
    </div>
    <div class="cal-bet">
      <input id="home_${game.id}" type="number" min="0" placeholder="0" value="${myBet?.homeGuess ?? ""}" ${locked?"disabled":""}>
      <span>-</span>
      <input id="away_${game.id}" type="number" min="0" placeholder="0" value="${myBet?.awayGuess ?? ""}" ${locked?"disabled":""}>
      <button class="primary" onclick="window.saveBetFromUI('${game.id}')" ${locked?"disabled":""}>OK</button>
    </div>
  </article>`;
}

function renderRanking(){
  const r = getTotals().get(activePlayer) || {points:0, exact:0, played:0, winner:0};
  $("rankingList").innerHTML = `<div class="ranking-row single-score">
    <div class="rank-number">🏆</div>
    <div><strong>Pontuação total</strong><p class="muted">Jogos com resultado: ${r.played} · Resultados exatos: ${r.exact} · Vencedor/empate certo: ${r.winner || 0}</p></div>
    <div class="points">${r.points} pts</div>
  </div>`;
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
  t.textContent = `${firebaseState} · Resultados manuais · Pontos automáticos`;
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
  const r = getTotals().get(activePlayer) || {points:0, exact:0, played:0, winner:0};
  return `🏆 PONTUAÇÃO MUNDIAL 2026

Total: ${r.points} pts
Jogos com resultado: ${r.played}
Resultados exatos: ${r.exact}
Vencedor/empate certo: ${r.winner || 0}`;
}
function todayText(){
  const list=todayGames();
  if(!list.length) return "⭐ JOGOS DE HOJE\n\nHoje não há jogos registados.";
  return "⭐ JOGOS DE HOJE\n\n" + list.map(g=>`${flag(g.homeTeam)} ${g.homeTeam} vs ${flag(g.awayTeam)} ${g.awayTeam}\n⏰ ${formatShortDate(g.matchDate)} · Hora Portugal · 🏟️ ${g.venue || "A confirmar"}`).join("\n\n");
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

["copyRankingBtn"].forEach(id=>$(id)?.addEventListener("click",()=>copyText(rankingText(),"Pontuação copiada para WhatsApp.")));
["copyTodayBtn","copyTodayBtn2"].forEach(id=>$(id)?.addEventListener("click",()=>copyText(todayText(),"Jogos de hoje copiados para WhatsApp.")));
["copyGroupsBtn","copyGroupsBtn2"].forEach(id=>$(id)?.addEventListener("click",()=>copyText(groupsText(),"Classificações dos grupos copiadas.")));

await initFirebase();
await loadData();
