// Mundial Pontos - Configuração v1.6.0
// Para testar offline deixa tudo como está.
// Para Firebase, substitui os campos abaixo pelos dados do teu projeto. Quando preencheres, fica online automaticamente.
window.MUNDIAL_CONFIG = {
  appVersion: "1.6.0",
  adminPin: "1234",
  firebase: {
    apiKey: "COLOCA_AQUI",
    authDomain: "COLOCA_AQUI",
    projectId: "COLOCA_AQUI",
    storageBucket: "COLOCA_AQUI",
    messagingSenderId: "COLOCA_AQUI",
    appId: "COLOCA_AQUI"
  },
  api: {
    enabled: false,
    // Usa um endpoint teu/proxy que devolva uma lista JSON de jogos.
    // Formato aceite por jogo:
    // { id, homeTeam, awayTeam, matchDate, venue, phase, homeScore, awayScore }
    endpoint: "",
    apiKey: "",
    autoSyncOnOpen: false
  }
};
