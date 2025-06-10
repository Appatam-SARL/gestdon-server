// Script simplifié pour tester les connexions Socket.IO sans authentification
// Pour utiliser ce script:
// 1. Installez socket.io-client: npm install socket.io-client
// 2. Exécutez avec Node.js: node socket-test.js

const { io } = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:5500';
// Utiliser un ID de chauffeur réel existant dans votre base de données
const DRIVER_ID = '67fcdfc0985a5ae75dc3935a'; // Remplacer par l'ID réel du chauffeur qui apparaît dans les logs

// Connexion au serveur
console.log(`Connexion au serveur: ${SERVER_URL}`);
const socket = io(SERVER_URL);

// Événements de connexion
socket.on('connect', () => {
  console.log(`✅ Connecté au serveur avec l'ID socket: ${socket.id}`);

  // Authentification du chauffeur (même sans token valide)
  console.log(`🔐 Tentative d'authentification du chauffeur: ${DRIVER_ID}`);
  socket.emit('driver-auth', {
    driverId: DRIVER_ID,
    token: 'mock-token-pour-test', // En test, le serveur ne vérifie pas ce token
  });

  // Programme d'émission de position après authentification
  console.log('🚗 Démarrage du mode test');
  startLocationUpdates();
});

socket.on('connect_error', (error) => {
  console.error(`❌ Erreur de connexion: ${error.message}`);
});

socket.on('disconnect', (reason) => {
  console.log(`❌ Déconnecté du serveur: ${reason}`);
});

// Écouter les réponses du serveur
socket.on('driver-location-update', (data) => {
  console.log(`📍 Mise à jour de position reçue:`, data);
});

socket.on('driver-entered-area', (data) => {
  console.log(
    `🚨 Notification: Chauffeur entré dans une zone surveillée:`,
    data
  );
});

// Fonction pour simuler des mises à jour de position
function startLocationUpdates() {
  console.log('📡 Démarrage des mises à jour de position...');

  // Coordonnées de départ (Paris)
  let lat = 5.4371785; // Latitude d'Abobo
  let lng = -4.0800787; // Longitude d'Abobo

  // Envoyer une mise à jour toutes les 5 secondes
  setInterval(() => {
    // Simuler un petit déplacement aléatoire
    lat += (Math.random() - 0.5) * 0.001;
    lng += (Math.random() - 0.5) * 0.001;

    // Simuler une direction et une vitesse
    const heading = Math.floor(Math.random() * 360);
    const speed = Math.floor(Math.random() * 50);

    // Préparer les données
    const locationData = {
      driverId: DRIVER_ID,
      coordinates: [lng, lat], // [longitude, latitude]
      heading: heading,
      speed: speed,
      timestamp: new Date(),
      isAvailable: true,
    };

    // Envoyer au serveur
    console.log(
      `📤 Envoi de la position: [${lng.toFixed(6)}, ${lat.toFixed(
        6
      )}], vitesse: ${speed} km/h, cap: ${heading}°`
    );
    socket.emit('driver-location', locationData);
  }, 5000);
}

// Gérer la fermeture proprement
process.on('SIGINT', () => {
  console.log('🛑 Fermeture de la connexion...');
  socket.close();
  process.exit(0);
});
