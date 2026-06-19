// Mundial Pontos - Configuração v1.7.0
// Para testar offline deixa tudo como está.
// Para Firebase, substitui os campos abaixo pelos dados do teu projeto. Quando preencheres, fica online automaticamente.
window.MUNDIAL_CONFIG = {
  appVersion: "9.0",
  adminPin: "1234",
  firebase: {
    apiKey: "AIzaSyCOyW5rfwF8iZxcVN6jxR4VqZ6pNdNmFRA",
    authDomain: "app-mundial2026.firebaseapp.com",
    projectId: "app-mundial2026",
    storageBucket: "app-mundial2026.firebasestorage.app",
    messagingSenderId: "143980254410",
    appId: "1:143980254410:web:0f48873c3aa4c9ad201033"
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
