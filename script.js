// ==========================================
// MOBILE AUDIO UNLOCK HANDLER
// ==========================================
function unlockMobileAudio() {
  const rainAudio = document.getElementById('rainAudio');
  const engineAudio = document.getElementById('engineAudio');
  const mainMusic = document.getElementById('mainMusic');

  const audioTracks = [rainAudio, engineAudio, mainMusic];

  audioTracks.forEach(track => {
    if (track) {
      // Play and immediately pause to unlock mobile browser restrictions
      track.play().then(() => {
        if (track.paused) track.pause();
      }).catch(err => {
        console.log("Audio unlock waiting for user gesture:", err);
      });
    }
  });

  // Remove event listeners after first tap
  document.removeEventListener('touchstart', unlockMobileAudio);
  document.removeEventListener('click', unlockMobileAudio);
}

// Listen for first user tap/click anywhere on screen
document.addEventListener('touchstart', unlockMobileAudio, { once: true });
document.addEventListener('click', unlockMobileAudio, { once: true });

// ==========================================
// 1. REAL-TIME PRESENCE ENGINE (FIREBASE)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyD7pwHoljKpWBSt6zdXSYFkgCQPjXglh0A",
  authDomain: "musafir-radio.firebaseapp.com",
  databaseURL: "https://musafir-radio-default-rtdb.firebaseio.com",
  projectId: "musafir-radio",
  storageBucket: "musafir-radio.firebasestorage.app",
  messagingSenderId: "474712939813",
  appId: "1:474712939813:web:c72e32126c297c5a0b0ecc"
};

try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    
    // Generate unique session key for current user tab
    const myPresenceRef = db.ref('presence/' + Math.random().toString(36).substring(2, 9));
    const onlineCountRef = db.ref('presence');

    // On tab close/disconnect, wipe user entry from Firebase
    myPresenceRef.onDisconnect().remove();
    myPresenceRef.set({ online: true, time: Date.now() });

    // Listen to real-time connected visitors
    // AFTER
onlineCountRef.on('value', (snapshot) => {
  const count = snapshot.numChildren() || 1;
  const countEl = document.getElementById('activeTravelers');
  if (countEl) {
    countEl.innerHTML = `<span class="green-dot"></span> <i class="fa-solid fa-users"></i> ${count} ${count === 1 ? 'Traveler' : 'Travelers'} Onboard`;
  }
});
  }
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

// ==========================================
// 2. 60-SONG PLAYLIST & AUDIO MANAGEMENT
// ==========================================
// Dynamically configured for 60 songs (assets/music1.mp3 to assets/music60.mp3)
const playlist = Array.from({ length: 60 }, (_, i) => {
  const num = i + 1;
  return {
    title: `Safar - Track #${num < 10 ? '0' + num : num}`,
    artist: `Musafir Night Radio Vol. ${Math.ceil(num / 10)}`,
    src: `assets/music${num}.mp3`
  };
});

let currentTrackIndex = 0;
let isPlaying = false;

// DOM Elements
const mainAudio = document.getElementById('mainAudio');
const rainAudio = document.getElementById('rainAudio');
const engineAudio = document.getElementById('engineAudio');
const conductorAudio = document.getElementById('conductorAudio');

const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = playPauseBtn ? playPauseBtn.querySelector('i') : null;
const songTitle = document.getElementById('songTitle');
const artistName = document.getElementById('artistName');
const albumBox = document.getElementById('albumBox');

const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

const musicVolumeBar = document.getElementById('musicVolumeBar');
const rainVolumeBar = document.getElementById('rainVolumeBar');
const engineVolumeBar = document.getElementById('engineVolumeBar');

const btnWindow = document.getElementById('btnWindow');
const btnRain = document.getElementById('btnRain');
const btnEngine = document.getElementById('btnEngine');
const btnConductor = document.getElementById('btnConductor');
const bgVideo = document.getElementById('bgVideo');

function loadTrack(index) {
  const track = playlist[index];
  if (songTitle) songTitle.innerText = track.title;
  if (artistName) artistName.innerText = track.artist;
  if (mainAudio) mainAudio.src = track.src;
}

function playTrack() {
  if (!mainAudio) return;
  mainAudio.play().then(() => {
    isPlaying = true;
    if (playIcon) {
      playIcon.classList.remove('fa-play');
      playIcon.classList.add('fa-pause');
    }
    if (albumBox) albumBox.classList.add('playing');
  }).catch(err => console.log("Playback error:", err));
}

function pauseTrack() {
  if (!mainAudio) return;
  mainAudio.pause();
  isPlaying = false;
  if (playIcon) {
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
  }
  if (albumBox) albumBox.classList.remove('playing');
}

if (playPauseBtn) {
  playPauseBtn.addEventListener('click', () => {
    isPlaying ? pauseTrack() : playTrack();
  });
}

const prevBtn = document.getElementById('prevBtn');
if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    playTrack();
  });
}

const nextBtn = document.getElementById('nextBtn');
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    playTrack();
  });
}

if (mainAudio) {
  mainAudio.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    playTrack();
  });

  mainAudio.addEventListener('timeupdate', () => {
    if (mainAudio.duration && progressBar) {
      const pct = (mainAudio.currentTime / mainAudio.duration) * 100;
      progressBar.value = pct;
      if (currentTimeEl) currentTimeEl.innerText = formatTime(mainAudio.currentTime);
      if (durationEl) durationEl.innerText = formatTime(mainAudio.duration);
    }
  });
}

if (progressBar) {
  progressBar.addEventListener('input', () => {
    if (mainAudio && mainAudio.duration) {
      mainAudio.currentTime = (progressBar.value / 100) * mainAudio.duration;
    }
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

if (musicVolumeBar && mainAudio) {
  musicVolumeBar.addEventListener('input', (e) => { mainAudio.volume = e.target.value / 100; });
}
if (rainVolumeBar && rainAudio) {
  rainVolumeBar.addEventListener('input', (e) => { rainAudio.volume = e.target.value / 100; });
}
if (engineVolumeBar && engineAudio) {
  engineVolumeBar.addEventListener('input', (e) => { engineAudio.volume = e.target.value / 100; });
}

// Ambient Sound Toggles
if (btnRain && rainAudio) {
  btnRain.addEventListener('click', () => {
    btnRain.classList.toggle('active');
    rainAudio.paused ? rainAudio.play() : rainAudio.pause();
  });
}

if (btnEngine && engineAudio) {
  btnEngine.addEventListener('click', () => {
    btnEngine.classList.toggle('active');
    engineAudio.paused ? engineAudio.play() : engineAudio.pause();
  });
}

if (btnConductor && conductorAudio) {
  btnConductor.addEventListener('click', () => {
    if (conductorAudio.paused) {
      conductorAudio.currentTime = 0;
      conductorAudio.play();
      btnConductor.classList.add('active');
    } else {
      conductorAudio.pause();
      conductorAudio.currentTime = 0;
      btnConductor.classList.remove('active');
    }
  });

  conductorAudio.addEventListener('ended', () => {
    btnConductor.classList.remove('active');
  });
}

// WINDOW BUTTON TOGGLE
if (btnWindow && bgVideo) {
  btnWindow.addEventListener('click', () => {
    btnWindow.classList.toggle('active');
    bgVideo.classList.toggle('tinted');
  });
}

// SEAMLESS VIDEO LOOP (Fixes 1-sec video stutter when video ends)
if (bgVideo) {
  bgVideo.addEventListener('timeupdate', () => {
    if (bgVideo.duration && (bgVideo.duration - bgVideo.currentTime < 0.15)) {
      bgVideo.currentTime = 0;
      bgVideo.play();
    }
  });
}

// LIVE CLOCK ENGINE
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds(); // Grab seconds
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const formattedMinutes = m < 10 ? '0' + m : m;
  const formattedSeconds = s < 10 ? '0' + s : s; // Pad single digits with 0
  
  const liveClockEl = document.getElementById('liveClock');
  if (liveClockEl) {
    liveClockEl.innerText = `${h}:${formattedMinutes}:${formattedSeconds} ${ampm} • NH 44`;
  }
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// 3. STEERING WHEEL INTERACTIVE ROTATION
// ==========================================
const steeringWheel = document.getElementById('steeringWheel');
let steeringAngle = 0;

window.addEventListener('mousemove', (e) => {
  if (steeringWheel) {
    const center = window.innerWidth / 2;
    steeringAngle = ((e.clientX - center) / center) * 30;
    steeringWheel.style.transform = `rotate(${steeringAngle}deg)`;
  }
});

window.addEventListener('keydown', (e) => {
  if (!steeringWheel) return;
  if (e.key === 'ArrowLeft') {
    steeringAngle = -25;
    steeringWheel.style.transform = `rotate(${steeringAngle}deg)`;
  } else if (e.key === 'ArrowRight') {
    steeringAngle = 25;
    steeringWheel.style.transform = `rotate(${steeringAngle}deg)`;
  }
});

window.addEventListener('keyup', () => {
  if (steeringWheel) {
    steeringAngle = 0;
    steeringWheel.style.transform = `rotate(0deg)`;
  }
});

// ==========================================
// 4. PROCEDURAL SKY & LIGHTNING BOLT ENGINE
// ==========================================
const skyCanvas = document.getElementById('skyCanvas');
const sCtx = skyCanvas ? skyCanvas.getContext('2d') : null;
const lightningOverlay = document.getElementById('lightningOverlay');

function resizeSkyCanvas() {
  if (skyCanvas) {
    skyCanvas.width = window.innerWidth;
    skyCanvas.height = window.innerHeight;
  }
}
window.addEventListener('resize', resizeSkyCanvas);
resizeSkyCanvas();

function drawLightningBolt(startX, startY, endX, endY, branchDepth) {
  if (branchDepth <= 0 || !sCtx) return;

  sCtx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
  sCtx.lineWidth = branchDepth * 1.5;
  sCtx.shadowColor = '#00f0ff';
  sCtx.shadowBlur = 15;

  sCtx.beginPath();
  sCtx.moveTo(startX, startY);

  let currentX = startX;
  let currentY = startY;

  while (currentY < endY) {
    let nextX = currentX + (Math.random() - 0.5) * 40;
    let nextY = currentY + Math.random() * 25 + 10;

    sCtx.lineTo(nextX, nextY);

    if (Math.random() < 0.25) {
      drawLightningBolt(currentX, currentY, currentX + (Math.random() - 0.5) * 80, currentY + 60, branchDepth - 1);
    }

    currentX = nextX;
    currentY = nextY;
  }

  sCtx.stroke();
  sCtx.shadowBlur = 0;
}

function triggerLightningEffect() {
  if (!skyCanvas || !sCtx) return;
  sCtx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);

  const startX = Math.random() * skyCanvas.width;
  const startY = 0;
  const endY = skyCanvas.height * 0.45;

  drawLightningBolt(startX, startY, startX + (Math.random() - 0.5) * 100, endY, 3);

  if (lightningOverlay) {
    lightningOverlay.style.opacity = '0.75';
    setTimeout(() => { lightningOverlay.style.opacity = '0'; }, 50);
    setTimeout(() => { lightningOverlay.style.opacity = '0.35'; }, 100);
    setTimeout(() => { lightningOverlay.style.opacity = '0'; }, 160);
  }

  setTimeout(() => {
    sCtx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);
  }, 200);
}

function scheduleRandomLightning() {
  const nextFlash = Math.random() * 12000 + 10000;
  setTimeout(() => {
    triggerLightningEffect();
    scheduleRandomLightning();
  }, nextFlash);
}
scheduleRandomLightning();

// ==========================================
// 5. MOVING ROAD & HIGHWAY SPEED ENGINE
// ==========================================
const roadCanvas = document.getElementById('roadCanvas');
const rCtx = roadCanvas ? roadCanvas.getContext('2d') : null;

function resizeRoadCanvas() {
  if (roadCanvas) {
    roadCanvas.width = window.innerWidth;
    roadCanvas.height = window.innerHeight;
  }
}
window.addEventListener('resize', resizeRoadCanvas);
resizeRoadCanvas();

let dashOffset = 0;

function drawRoadEngine() {
  if (!roadCanvas || !rCtx) return;
  const w = roadCanvas.width;
  const h = roadCanvas.height;
  const horizon = h * 0.48;
  const vanishingX = w / 2;

  rCtx.fillStyle = '#030308';
  rCtx.fillRect(0, 0, w, h);

  let horizonGlow = rCtx.createRadialGradient(vanishingX, horizon, 5, vanishingX, horizon, w * 0.7);
  horizonGlow.addColorStop(0, 'rgba(0, 240, 255, 0.18)');
  horizonGlow.addColorStop(1, 'rgba(0,0,0,0)');
  rCtx.fillStyle = horizonGlow;
  rCtx.fillRect(0, 0, w, h);

  rCtx.fillStyle = '#080810';
  rCtx.beginPath();
  rCtx.moveTo(vanishingX - 10, horizon);
  rCtx.lineTo(vanishingX + 10, horizon);
  rCtx.lineTo(w * 1.3, h);
  rCtx.lineTo(-w * 0.3, h);
  rCtx.closePath();
  rCtx.fill();

  rCtx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
  rCtx.lineWidth = 2;
  dashOffset = (dashOffset + 2.2) % 40;

  for (let i = 0; i < 20; i++) {
    let z1 = (i * 20 + dashOffset) / 400;
    let z2 = ((i + 0.5) * 20 + dashOffset) / 400;

    let y1 = horizon + (h - horizon) * z1;
    let y2 = horizon + (h - horizon) * z2;

    rCtx.beginPath();
    rCtx.moveTo(vanishingX, y1);
    rCtx.lineTo(vanishingX, y2);
    rCtx.stroke();
  }

  requestAnimationFrame(drawRoadEngine);
}
drawRoadEngine();

// ==========================================
// 6. DYNAMIC MOVING FRONT TRUCK & TRAFFIC
// ==========================================
const trafficCanvas = document.getElementById('trafficCanvas');
const tCtx = trafficCanvas ? trafficCanvas.getContext('2d') : null;

function resizeTrafficCanvas() {
  if (trafficCanvas) {
    trafficCanvas.width = window.innerWidth;
    trafficCanvas.height = window.innerHeight;
  }
}
window.addEventListener('resize', resizeTrafficCanvas);
resizeTrafficCanvas();

let truckState = {
  z: 380,
  laneOffset: 25,
  speed: 0.6,
  dir: 1
};

function drawTrafficEngine() {
  if (!trafficCanvas || !tCtx) return;
  const w = trafficCanvas.width;
  const h = trafficCanvas.height;
  const horizon = h * 0.48;
  const vanishingX = w / 2;

  tCtx.clearRect(0, 0, w, h);

  truckState.z += truckState.speed * truckState.dir;
  if (truckState.z > 700 || truckState.z < 220) {
    truckState.dir *= -1;
  }

  truckState.laneOffset += Math.sin(Date.now() * 0.001) * 0.15;

  let scale = 300 / truckState.z;
  let truckW = 140 * scale;
  let truckH = 100 * scale;
  let truckX = vanishingX + (truckState.laneOffset * scale) - (truckW / 2);
  let truckY = horizon + (h - horizon) * (1 - truckState.z / 1000) - truckH;

  tCtx.fillStyle = '#0c0c12';
  tCtx.fillRect(truckX, truckY, truckW, truckH);

  tCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  tCtx.lineWidth = 1;
  tCtx.strokeRect(truckX + 4, truckY + 4, truckW - 8, truckH - 8);

  tCtx.fillStyle = '#ff1100';
  tCtx.shadowColor = '#ff1100';
  tCtx.shadowBlur = 15;
  
  let lightW = 14 * scale;
  let lightH = 8 * scale;
  tCtx.fillRect(truckX + 6 * scale, truckY + truckH - 12 * scale, lightW, lightH);
  tCtx.fillRect(truckX + truckW - (6 * scale + lightW), truckY + truckH - 12 * scale, lightW, lightH);

  tCtx.fillStyle = 'rgba(255, 17, 0, 0.15)';
  tCtx.fillRect(truckX, truckY + truckH, truckW, 30 * scale);
  
  tCtx.shadowBlur = 0;

  requestAnimationFrame(drawTrafficEngine);
}
drawTrafficEngine();

// ==========================================
// 7. WINDSHIELD RAINDROP ENGINE
// ==========================================
const rainCanvas = document.getElementById('rainCanvas');
const rainCtx = rainCanvas ? rainCanvas.getContext('2d') : null;

function resizeRainCanvas() {
  if (rainCanvas) {
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
  }
}
window.addEventListener('resize', resizeRainCanvas);
resizeRainCanvas();

const rainDrops = [];
if (rainCanvas) {
  for (let i = 0; i < 150; i++) {
    rainDrops.push({
      x: Math.random() * rainCanvas.width,
      y: Math.random() * rainCanvas.height,
      length: Math.random() * 22 + 8,
      speed: Math.random() * 12 + 9,
      opacity: Math.random() * 0.4 + 0.1
    });
  }
}

function drawRainEngine() {
  if (!rainCanvas || !rainCtx) return;
  rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);

  for (let drop of rainDrops) {
    rainCtx.strokeStyle = `rgba(0, 240, 255, ${drop.opacity})`;
    rainCtx.lineWidth = 1;
    rainCtx.beginPath();
    rainCtx.moveTo(drop.x, drop.y);
    rainCtx.lineTo(drop.x, drop.y + drop.length);
    rainCtx.stroke();

    drop.y += drop.speed;
    if (drop.y > rainCanvas.height) {
      drop.y = -drop.length;
      drop.x = Math.random() * rainCanvas.width;
    }
  }

  requestAnimationFrame(drawRainEngine);
}
drawRainEngine();

// Load Startup Track
loadTrack(currentTrackIndex);
// ==========================================
// MOBILE AUDIO UNLOCK HANDLER
// ==========================================
function unlockMobileAudio() {
  const rainAudio = document.getElementById('rainAudio');
  const engineAudio = document.getElementById('engineAudio');
  const mainMusic = document.getElementById('mainMusic');

  const audioTracks = [rainAudio, engineAudio, mainMusic];

  audioTracks.forEach(track => {
    if (track) {
      track.play().then(() => {
        if (track.paused) track.pause();
      }).catch(err => {
        console.log("Audio unlock waiting for user tap:", err);
      });
    }
  });

  document.removeEventListener('touchstart', unlockMobileAudio);
  document.removeEventListener('click', unlockMobileAudio);
}

document.addEventListener('touchstart', unlockMobileAudio, { once: true });
document.addEventListener('click', unlockMobileAudio, { once: true });
