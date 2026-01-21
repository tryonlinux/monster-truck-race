const canvas = document.getElementById("roadCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const overlay = document.getElementById("overlay");

const speedEl = document.getElementById("playerSpeed");
const cpuSpeedEl = document.getElementById("cpuSpeed");
const distanceEl = document.getElementById("distance");

const colorOneInput = document.getElementById("colorOne");
const colorTwoInput = document.getElementById("colorTwo");

const playerTruckEl = document.getElementById("playerTruck");
const cpuTruckEl = document.getElementById("cpuTruck");
const roadWrap = document.querySelector(".road-wrap");
const gameShell = document.getElementById("gameShell");
const touchControlsEl = document.getElementById("touchControls");
const touchActionsEl = document.getElementById("touchActions");

let road = { left: 0, right: 0, top: 0, bottom: 0 };
let logicalWidth = 0;
let logicalHeight = 0;
let startLineY = 0;
let finishLineY = 0;
let trackLength = 0;
let cameraY = 0;
const trackSpeedScale = 2;
let sizeScale = 1;
let speedScale = 1;

const state = {
  running: false,
  paused: false,
  puddles: [],
  nextPuddleY: 0,
};

const player = {
  x: 0,
  y: 0,
  baseSpeed: 260,
  speed: 0,
  color1: "#ff595e",
  color2: "#1982c4",
  hitTimer: 0,
};

const cpu = {
  x: 0,
  y: 0,
  baseSpeed: 250,
  speed: 0,
  color1: "#f7c948",
  color2: "#58d68d",
  hitTimer: 0,
  decisionTimer: 0,
  targetX: 0,
  oopsTimer: 0,
};

const keys = { left: false, right: false };
const touchState = {
  active: false,
  x: 0,
};
let audioCtx = null;
let rumbleNodes = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hashNoise(value) {
  return Math.abs(Math.sin(value) * 10000) % 1;
}

function randomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i += 1) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function truckSvg(color1, color2, label) {
  const id = label.toLowerCase();
  return `
    <svg viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg" aria-label="${label}">
      <defs>
        <linearGradient id="truckPaint-${id}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="${color1}" />
          <stop offset="1" stop-color="${color2}" />
        </linearGradient>
        <linearGradient id="truckPaintDark-${id}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#1a1c1f" />
          <stop offset="1" stop-color="#3a3f45" />
        </linearGradient>
        <linearGradient id="metal-${id}" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#b9c0c8" />
          <stop offset="1" stop-color="#6b737b" />
        </linearGradient>
        <radialGradient id="tire-${id}" cx="40%" cy="40%" r="70%">
          <stop offset="0" stop-color="#3c4147" />
          <stop offset="0.55" stop-color="#1a1d21" />
          <stop offset="1" stop-color="#090b0d" />
        </radialGradient>
        <radialGradient id="rim-${id}" cx="35%" cy="35%" r="70%">
          <stop offset="0" stop-color="#f2f6fb" />
          <stop offset="0.6" stop-color="#8f98a3" />
          <stop offset="1" stop-color="#3f4750" />
        </radialGradient>
        <filter id="shadow-${id}" x="-20%" y="-20%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <clipPath id="tire-clip-${id}-1">
          <rect x="-10" y="-16" width="20" height="32" rx="8" />
        </clipPath>
        <clipPath id="tire-clip-${id}-2">
          <rect x="-10" y="-16" width="20" height="32" rx="8" />
        </clipPath>
        <clipPath id="tire-clip-${id}-3">
          <rect x="-10" y="-16" width="20" height="32" rx="8" />
        </clipPath>
        <clipPath id="tire-clip-${id}-4">
          <rect x="-10" y="-16" width="20" height="32" rx="8" />
        </clipPath>
      </defs>

      <ellipse cx="60" cy="160" rx="34" ry="10" fill="rgba(0,0,0,0.35)" filter="url(#shadow-${id})" />

      <rect x="26" y="30" width="68" height="120" rx="18" fill="url(#truckPaint-${id})" stroke="#121316" stroke-width="2" />
      <rect x="34" y="40" width="52" height="28" rx="12" fill="url(#truckPaintDark-${id})" opacity="0.8" />
      <rect x="38" y="46" width="44" height="18" rx="8" fill="#6bc4ff" stroke="#1d2c36" stroke-width="2" />

      <rect x="30" y="80" width="60" height="50" rx="12" fill="rgba(255,255,255,0.08)" />

      <g opacity="0.7">
        <rect x="32" y="74" width="12" height="10" rx="4" fill="${color2}" />
        <rect x="48" y="74" width="12" height="10" rx="4" fill="${color2}" />
        <rect x="64" y="74" width="12" height="10" rx="4" fill="${color2}" />
        <rect x="80" y="74" width="12" height="10" rx="4" fill="${color2}" />
      </g>

      <rect x="42" y="24" width="36" height="6" rx="3" fill="url(#metal-${id})" />
      <rect x="42" y="150" width="36" height="6" rx="3" fill="url(#metal-${id})" />
      <circle cx="48" cy="28" r="4" fill="#ffd166" stroke="#8a5a0a" stroke-width="2" />
      <circle cx="72" cy="28" r="4" fill="#ffd166" stroke="#8a5a0a" stroke-width="2" />

      <g>
        <g transform="translate(22 60)">
          <g>
            <rect x="-10" y="-16" width="20" height="32" rx="8" fill="url(#tire-${id})" stroke="#0f1113" stroke-width="3" />
            <g clip-path="url(#tire-clip-${id}-1)">
              <g class="wheel-tread">
                <rect x="-10" y="-32" width="20" height="8" fill="rgba(255,255,255,0.18)" />
                <rect x="-10" y="-16" width="20" height="6" fill="rgba(0,0,0,0.35)" />
                <rect x="-10" y="0" width="20" height="8" fill="rgba(255,255,255,0.18)" />
                <rect x="-10" y="16" width="20" height="6" fill="rgba(0,0,0,0.35)" />
                <rect x="-10" y="32" width="20" height="8" fill="rgba(255,255,255,0.18)" />
              </g>
            </g>
            <rect x="-6" y="-12" width="12" height="24" rx="6" fill="url(#rim-${id})" />
            <rect x="-2" y="-16" width="4" height="32" fill="rgba(255,255,255,0.18)" />
          </g>
        </g>
        <g transform="translate(98 60)">
          <g>
            <rect x="-10" y="-16" width="20" height="32" rx="8" fill="url(#tire-${id})" stroke="#0f1113" stroke-width="3" />
            <g clip-path="url(#tire-clip-${id}-2)">
              <g class="wheel-tread">
                <rect x="-10" y="-32" width="20" height="8" fill="rgba(255,255,255,0.18)" />
                <rect x="-10" y="-16" width="20" height="6" fill="rgba(0,0,0,0.35)" />
                <rect x="-10" y="0" width="20" height="8" fill="rgba(255,255,255,0.18)" />
                <rect x="-10" y="16" width="20" height="6" fill="rgba(0,0,0,0.35)" />
                <rect x="-10" y="32" width="20" height="8" fill="rgba(255,255,255,0.18)" />
              </g>
            </g>
            <rect x="-6" y="-12" width="12" height="24" rx="6" fill="url(#rim-${id})" />
            <rect x="-2" y="-16" width="4" height="32" fill="rgba(255,255,255,0.18)" />
          </g>
        </g>
        <g transform="translate(22 120)">
          <g>
            <rect x="-10" y="-16" width="20" height="32" rx="8" fill="url(#tire-${id})" stroke="#0f1113" stroke-width="3" />
            <g clip-path="url(#tire-clip-${id}-3)">
              <g class="wheel-tread">
                <rect x="-10" y="-32" width="20" height="8" fill="rgba(255,255,255,0.18)" />
                <rect x="-10" y="-16" width="20" height="6" fill="rgba(0,0,0,0.35)" />
                <rect x="-10" y="0" width="20" height="8" fill="rgba(255,255,255,0.18)" />
                <rect x="-10" y="16" width="20" height="6" fill="rgba(0,0,0,0.35)" />
                <rect x="-10" y="32" width="20" height="8" fill="rgba(255,255,255,0.18)" />
              </g>
            </g>
            <rect x="-6" y="-12" width="12" height="24" rx="6" fill="url(#rim-${id})" />
            <rect x="-2" y="-16" width="4" height="32" fill="rgba(255,255,255,0.18)" />
          </g>
        </g>
        <g transform="translate(98 120)">
          <g>
            <rect x="-10" y="-16" width="20" height="32" rx="8" fill="url(#tire-${id})" stroke="#0f1113" stroke-width="3" />
            <g clip-path="url(#tire-clip-${id}-4)">
              <g class="wheel-tread">
                <rect x="-10" y="-32" width="20" height="8" fill="rgba(255,255,255,0.18)" />
                <rect x="-10" y="-16" width="20" height="6" fill="rgba(0,0,0,0.35)" />
                <rect x="-10" y="0" width="20" height="8" fill="rgba(255,255,255,0.18)" />
                <rect x="-10" y="16" width="20" height="6" fill="rgba(0,0,0,0.35)" />
                <rect x="-10" y="32" width="20" height="8" fill="rgba(255,255,255,0.18)" />
              </g>
            </g>
            <rect x="-6" y="-12" width="12" height="24" rx="6" fill="url(#rim-${id})" />
            <rect x="-2" y="-16" width="4" height="32" fill="rgba(255,255,255,0.18)" />
          </g>
        </g>
      </g>

      <rect x="26" y="30" width="68" height="12" rx="10" fill="rgba(255,255,255,0.22)" />

      <text x="60" y="172" text-anchor="middle" font-size="10" fill="#f4f1ed" font-family="Fredoka, sans-serif">${label}</text>
    </svg>
  `;
}

function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  const rumbleGain = audioCtx.createGain();
  rumbleGain.gain.value = 0.0001;

  const rumbleFilter = audioCtx.createBiquadFilter();
  rumbleFilter.type = "lowpass";
  rumbleFilter.frequency.value = 180;

  const osc1 = audioCtx.createOscillator();
  osc1.type = "sawtooth";
  osc1.frequency.value = 55;

  const osc2 = audioCtx.createOscillator();
  osc2.type = "square";
  osc2.frequency.value = 72;

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 2.2;
  lfoGain.gain.value = 18;
  lfo.connect(lfoGain).connect(rumbleFilter.frequency);

  osc1.connect(rumbleFilter);
  osc2.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain).connect(audioCtx.destination);

  osc1.start();
  osc2.start();
  lfo.start();

  rumbleNodes = { rumbleGain };
}

function setRumbleActive(active) {
  if (!audioCtx || !rumbleNodes) return;
  const now = audioCtx.currentTime;
  rumbleNodes.rumbleGain.gain.cancelScheduledValues(now);
  rumbleNodes.rumbleGain.gain.linearRampToValueAtTime(active ? 0.08 : 0.0001, now + 0.2);
}

function showOverlay(title, body) {
  overlay.querySelector("h2").textContent = title;
  overlay.querySelector("p").textContent = body;
  overlay.classList.remove("hidden");
  overlay.classList.add("active");
}

function hideOverlay() {
  overlay.classList.add("hidden");
  overlay.classList.remove("active");
}

function setUiPlaying(isPlaying) {
  if (isPlaying) {
    gameShell.classList.add("is-playing");
  } else {
    gameShell.classList.remove("is-playing");
  }
  updateDimensions();
  render();
}

function playExplosion() {
  if (!audioCtx) return;
  const duration = 0.35;
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 700;

  const gain = audioCtx.createGain();
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.5, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter).connect(gain).connect(audioCtx.destination);
  source.start(now);
  source.stop(now + duration);
}

function applyTruckColors() {
  playerTruckEl.innerHTML = truckSvg(player.color1, player.color2, "YOU");
  cpuTruckEl.innerHTML = truckSvg(cpu.color1, cpu.color2, "CPU");
}

function updateDimensions() {
  const prevStart = startLineY;
  const prevFinish = finishLineY;
  const prevTrack = trackLength;
  const wasRunning = state.running;
  const prevLeft = road.left;
  const prevRight = road.right;
  const rect = roadWrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  logicalWidth = rect.width;
  logicalHeight = rect.height;
  sizeScale = clamp(logicalWidth / 900, 0.7, 1.15);
  speedScale = logicalWidth < 680 ? 0.67 : 1;
  roadWrap.style.setProperty("--truck-scale", sizeScale.toFixed(2));

  road = {
    left: logicalWidth * 0.12,
    right: logicalWidth * 0.88,
    top: 30,
    bottom: logicalHeight - 30,
  };
  startLineY = road.top + 45;
  finishLineY = road.bottom - 45;
  trackLength = (finishLineY - startLineY) * 32;

  if (wasRunning && prevRight > prevLeft) {
    const playerRatio = (player.x - prevLeft) / (prevRight - prevLeft);
    const cpuRatio = (cpu.x - prevLeft) / (prevRight - prevLeft);
    player.x = road.left + playerRatio * (road.right - road.left);
    cpu.x = road.left + cpuRatio * (road.right - road.left);
  } else {
    const roadCenter = (road.left + road.right) / 2;
    player.x = roadCenter - 90;
    cpu.x = roadCenter + 90;
    cpu.targetX = cpu.x;
  }
  if (!wasRunning) {
    player.y = 0;
    cpu.y = 0;
  }

  state.puddles.forEach((puddle) => {
    if (wasRunning && prevTrack > 0) {
      puddle.y = clamp((puddle.y / prevTrack) * trackLength, 0, trackLength);
    }
    puddle.x = clamp(puddle.x, road.left + 24, road.right - 24);
    if (!puddle.baseRadius) {
      puddle.baseRadius = puddle.radius || 24;
    }
  });

  if (wasRunning && prevTrack > 0) {
    const playerProgress = player.y / prevTrack;
    const cpuProgress = cpu.y / prevTrack;
    player.y = clamp(playerProgress * trackLength, 0, trackLength);
    cpu.y = clamp(cpuProgress * trackLength, 0, trackLength);
  }
}

function resetRace() {
  state.running = true;
  state.paused = false;
  setUiPlaying(true);

  player.speed = player.baseSpeed;
  player.x = clamp(player.x || (road.left + 80), road.left + 30, road.right - 30);
  player.y = 0;
  player.hitTimer = 0;

  cpu.speed = cpu.baseSpeed;
  cpu.x = clamp(cpu.x || (road.right - 80), road.left + 30, road.right - 30);
  cpu.y = 0;
  cpu.hitTimer = 0;
  cpu.targetX = cpu.x;
  cpu.decisionTimer = 0;
  cpu.oopsTimer = 0;

  cameraY = 0;
  buildPuddles();
  hideOverlay();
}

function buildPuddles() {
  state.puddles = [];
  state.nextPuddleY = 120;
  ensurePuddlesAhead();
}

function updatePuddles(dt) {
  state.puddles.forEach((puddle) => {
    puddle.wobble += dt * 3;
  });
  const cutoff = cameraY - 200;
  state.puddles = state.puddles.filter((puddle) => puddle.y >= cutoff);
  ensurePuddlesAhead();
}

function ensurePuddlesAhead() {
  const minY = 120;
  const maxY = Math.max(minY + 200, trackLength - 60);
  const rowSpacing = 120;
  const leftEdge = road.left + 26;
  const rightEdge = road.right - 26;
  const viewport = finishLineY - startLineY;
  const targetY = Math.min(maxY, cameraY + viewport + 400);
  const isMobile = logicalWidth < 680;

  while (state.nextPuddleY <= targetY) {
    const rowY = clamp(state.nextPuddleY, minY, maxY);
    const rowCount = isMobile ? 1 : 1 + (Math.random() < 0.35 ? 1 : 0);
    for (let i = 0; i < rowCount; i += 1) {
      const x = leftEdge + Math.random() * (rightEdge - leftEdge);
      state.puddles.push({
        x,
        y: clamp(rowY + (Math.random() - 0.5) * 20, minY, maxY),
        baseRadius: 22 + Math.random() * 10,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    if (!isMobile && Math.random() < 0.12) {
      const clusterCenter = leftEdge + Math.random() * (rightEdge - leftEdge);
      const clusterSize = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < clusterSize; i += 1) {
        const offsetX = (Math.random() - 0.5) * 36;
        const offsetY = (Math.random() - 0.5) * 18;
        state.puddles.push({
          x: clamp(clusterCenter + offsetX, leftEdge, rightEdge),
          y: clamp(rowY + offsetY, minY, maxY),
          baseRadius: 20 + Math.random() * 10,
          wobble: Math.random() * Math.PI * 2,
        });
      }
    }

    state.nextPuddleY += rowSpacing;
    if (state.nextPuddleY > maxY) break;
  }
}

function applyHit(entity) {
  const isPlayer = entity === player;
  const isMobile = logicalWidth < 680;
  const cpuPenaltyScale = !isPlayer && isMobile ? 2.3 : 1;
  const playerPenaltyScale = isPlayer && isMobile ? 0.7 : 1;
  entity.hitTimer = isPlayer ? 3 * playerPenaltyScale : 0.8 * cpuPenaltyScale;
  entity.speed = isPlayer
    ? Math.max(
        entity.baseSpeed * (0.17 / playerPenaltyScale),
        entity.speed * (0.33 / playerPenaltyScale)
      )
    : Math.max(
        entity.baseSpeed * (0.5 / cpuPenaltyScale),
        entity.speed * (0.6 / cpuPenaltyScale)
      );
  playExplosion();
}

function checkCollisions(entity) {
  state.puddles.forEach((puddle) => {
    const dx = entity.x - puddle.x;
    const dy = entity.y - puddle.y;
    const distance = Math.hypot(dx, dy);
    const radius = (puddle.baseRadius || 24) * sizeScale;
    const buffer = 18 * sizeScale;
    if (distance < radius + buffer && entity.hitTimer <= 0) {
      applyHit(entity);
    }
  });
}

function updatePlayer(dt) {
  const steerSpeed = 260;
  if (keys.left) {
    player.x -= steerSpeed * dt;
  }
  if (keys.right) {
    player.x += steerSpeed * dt;
  }
  if (touchState.active) {
    const targetX = clamp(touchState.x, road.left + 28, road.right - 28);
    player.x += (targetX - player.x) * dt * 6;
  }
  player.x = clamp(player.x, road.left + 28, road.right - 28);

  if (player.hitTimer > 0) {
    player.hitTimer -= dt;
    player.speed = Math.min(player.baseSpeed, player.speed + dt * 130);
  } else {
    player.speed = Math.min(player.baseSpeed + 46, player.speed + dt * 86);
  }

  player.y = Math.min(trackLength, player.y + player.speed * dt * trackSpeedScale * speedScale);
  checkCollisions(player);
}

function updateCpu(dt) {
  cpu.decisionTimer -= dt;
  cpu.oopsTimer = Math.max(0, cpu.oopsTimer - dt);
  if (cpu.decisionTimer <= 0) {
    cpu.decisionTimer = 0.08 + Math.random() * 0.14;

    const upcoming = state.puddles
      .filter((puddle) => puddle.y > cpu.y && puddle.y - cpu.y < 420)
      .sort((a, b) => a.y - b.y);
    const dangerHole = upcoming.length ? upcoming[0] : null;

    const closeToPlayer = Math.abs(player.y - cpu.y) < 260;
    const oopsChance = closeToPlayer ? 0.015 : 0.008;
    const oops = Math.random() < oopsChance;

    if (upcoming.length) {
      const leftEdge = road.left + 30;
      const rightEdge = road.right - 30;
      const candidates = [];
      const lanes = 8;
      for (let i = 0; i <= lanes; i += 1) {
        candidates.push(leftEdge + ((rightEdge - leftEdge) * i) / lanes);
      }
      candidates.push(cpu.x);

      const scoreCandidate = (x) => {
        let score = 0;
        let nearest = Infinity;
        for (const hole of upcoming) {
          const dx = Math.abs(hole.x - x);
          const dy = hole.y - cpu.y;
          if (dy < 0) continue;
          const proximity = Math.max(0, 320 - dx);
          const danger = proximity * Math.exp(-dy / 180);
          nearest = Math.min(nearest, dx);
          score -= danger;
        }
        score += nearest * 0.1;
        score -= Math.abs(x - cpu.x) * 0.05;
        return score;
      };

      let bestX = candidates[0];
      let bestScore = -Infinity;
      for (const candidate of candidates) {
        const score = scoreCandidate(candidate);
        if (score > bestScore) {
          bestScore = score;
          bestX = candidate;
        }
      }

      cpu.targetX = oops ? dangerHole.x : bestX;
      if (oops) {
        cpu.oopsTimer = 0.3 + Math.random() * 0.2;
      }
    } else if (Math.random() < 0.4) {
      cpu.targetX = road.left + 30 + Math.random() * (road.right - road.left - 60);
    }
  }

  const steerFactor = cpu.oopsTimer > 0 ? 2.8 : 6.2;
  cpu.x += (cpu.targetX - cpu.x) * dt * steerFactor;
  cpu.x = clamp(cpu.x, road.left + 28, road.right - 28);

  if (cpu.hitTimer > 0) {
    cpu.hitTimer -= dt;
    cpu.speed = Math.min(cpu.baseSpeed, cpu.speed + dt * 120);
  } else {
    cpu.speed = Math.min(cpu.baseSpeed + 40, cpu.speed + dt * 78);
  }

  cpu.y = Math.min(trackLength, cpu.y + cpu.speed * dt * trackSpeedScale * speedScale);
  checkCollisions(cpu);
}

function updateCamera() {
  const viewport = finishLineY - startLineY;
  const minCamForPlayer = clamp(player.y - viewport * 0.85, 0, Math.max(0, trackLength - viewport));
  const maxCamForPlayer = clamp(player.y - viewport * 0.15, 0, Math.max(0, trackLength - viewport));
  const focusOnPlayer = clamp(player.y - viewport * 0.6, 0, Math.max(0, trackLength - viewport));
  const keepCpuVisible = cpu.y - viewport * 0.15;
  const target = Math.min(focusOnPlayer, keepCpuVisible);
  cameraY = clamp(target, minCamForPlayer, maxCamForPlayer);
}

function drawRoad() {
  const { left, right, top, bottom } = road;
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  ctx.fillStyle = "#2e6b3a";
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  ctx.fillStyle = "#8b5a36";
  ctx.fillRect(left, top, right - left, bottom - top);

  ctx.fillStyle = "#7a4e2f";
  ctx.fillRect(left + 6, top + 10, right - left - 12, bottom - top - 20);

  for (let y = top + 12; y < bottom - 12; y += 28) {
    for (let x = left + 16; x < right - 16; x += 48) {
      const seed = (x * 0.19) + ((y + cameraY) * 0.23);
      const noise = hashNoise(seed);
      if (noise > 0.68) {
        const size = 2 + noise * 3;
        ctx.fillStyle = noise > 0.9 ? "rgba(65, 40, 20, 0.45)" : "rgba(110, 72, 40, 0.35)";
        ctx.beginPath();
        ctx.ellipse(x + (noise - 0.5) * 10, y, size * 1.6, size, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.strokeStyle = "rgba(45, 30, 20, 0.35)";
  ctx.lineWidth = 6;
  ctx.setLineDash([28, 32]);
  ctx.beginPath();
  ctx.moveTo(left + (right - left) * 0.33, top);
  ctx.lineTo(left + (right - left) * 0.33, bottom);
  ctx.moveTo(left + (right - left) * 0.67, top);
  ctx.lineTo(left + (right - left) * 0.67, bottom);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPuddle(puddle) {
  const screenY = startLineY + (puddle.y - cameraY);
  if (screenY < road.top - 60 || screenY > road.bottom + 20) return;
  if (puddle.x < road.left + 12 || puddle.x > road.right - 12) return;
  const radius = (puddle.baseRadius || 24) * sizeScale;
  ctx.save();
  ctx.translate(puddle.x, screenY);
  ctx.rotate(Math.sin(puddle.wobble) * 0.2);
  ctx.fillStyle = "#5a3b24";
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.2, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.ellipse(4, -3, radius * 0.6, radius * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFinishLine() {
  ctx.save();
  const screenY = startLineY + (trackLength - cameraY);
  ctx.translate(road.left, screenY);
  const width = road.right - road.left;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(0, 0, width, 6);
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  for (let i = 0; i < width; i += 22) {
    ctx.fillRect(i, 0, 12, 6);
  }
  ctx.restore();
}

function drawStartLine() {
  ctx.save();
  const screenY = startLineY + (0 - cameraY);
  ctx.translate(road.left, screenY);
  const width = road.right - road.left;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(0, 0, width, 4);
  ctx.restore();
}

function updateHud() {
  speedEl.textContent = Math.round(player.speed);
  cpuSpeedEl.textContent = Math.round(cpu.speed);
  const leadPx = player.y - cpu.y;
  const leadMeters = Math.round(Math.abs(leadPx) / 8);
  if (leadMeters < 1) {
    distanceEl.textContent = "Tied";
  } else if (leadPx > 0) {
    distanceEl.textContent = `You +${leadMeters}m`;
  } else {
    distanceEl.textContent = `CPU +${leadMeters}m`;
  }
}

function updateTruckPositions() {
  const playerScreenY = startLineY + (player.y - cameraY);
  const cpuScreenY = startLineY + (cpu.y - cameraY);
  playerTruckEl.style.left = `${player.x}px`;
  playerTruckEl.style.top = `${playerScreenY}px`;
  cpuTruckEl.style.left = `${cpu.x}px`;
  cpuTruckEl.style.top = `${cpuScreenY}px`;
}

function render() {
  updateCamera();
  drawRoad();
  drawFinishLine();
  drawStartLine();
  state.puddles.forEach(drawPuddle);
  updateTruckPositions();
}

function finishRace(winner) {
  state.running = false;
  state.paused = false;
  setRumbleActive(false);
  setUiPlaying(false);
  showOverlay(winner === "player" ? "You win!" : "CPU wins!", "Hit Start Race to go again with new colors.");
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  if (state.paused) {
    setRumbleActive(false);
    showOverlay("Paused", "Press P to resume. Press R to reset.");
  } else {
    setRumbleActive(true);
    hideOverlay();
  }
}

let lastTime = 0;
function loop(timestamp) {
  if (!state.running) {
    render();
    return;
  }
  if (state.paused) {
    render();
    requestAnimationFrame(loop);
    return;
  }
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;

  updatePuddles(dt);
  updatePlayer(dt);
  updateCpu(dt);
  updateHud();
  render();

  if (player.y >= trackLength || cpu.y >= trackLength) {
    finishRace(player.y >= trackLength ? "player" : "cpu");
  }

  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", () => {
  initAudio();
  audioCtx.resume();
  setRumbleActive(true);
  player.color1 = colorOneInput.value;
  player.color2 = colorTwoInput.value;
  cpu.color1 = randomColor();
  cpu.color2 = randomColor();
  applyTruckColors();
  lastTime = performance.now();
  resetRace();
  requestAnimationFrame(loop);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = true;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = true;
  }
  if (event.key.toLowerCase() === "p") {
    togglePause();
  }
  if (event.key.toLowerCase() === "r") {
    lastTime = performance.now();
    resetRace();
    requestAnimationFrame(loop);
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = false;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = false;
  }
});

function setTouchMode() {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  document.body.classList.toggle("touch", isTouch);
  touchControlsEl.setAttribute("aria-hidden", (!isTouch).toString());
  touchActionsEl.setAttribute("aria-hidden", (!isTouch).toString());
  if (!isTouch) {
    touchState.active = false;
  }
}

canvas.addEventListener("pointerdown", (event) => {
  if (!document.body.classList.contains("touch")) return;
  const rect = canvas.getBoundingClientRect();
  touchState.active = true;
  touchState.x = event.clientX - rect.left;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!touchState.active) return;
  const rect = canvas.getBoundingClientRect();
  touchState.x = event.clientX - rect.left;
});

canvas.addEventListener("pointerup", (event) => {
  if (touchState.active) {
    touchState.active = false;
    canvas.releasePointerCapture(event.pointerId);
  }
});

touchControlsEl.addEventListener("pointerdown", (event) => {
  const pad = event.target.closest(".pad");
  if (!pad) return;
  const dir = pad.dataset.dir;
  if (dir === "left") keys.left = true;
  if (dir === "right") keys.right = true;
});

touchControlsEl.addEventListener("pointerup", () => {
  keys.left = false;
  keys.right = false;
});

touchControlsEl.addEventListener("pointerleave", () => {
  keys.left = false;
  keys.right = false;
});

touchActionsEl.addEventListener("pointerdown", (event) => {
  const action = event.target.closest(".action-button")?.dataset.action;
  if (action === "pause") {
    togglePause();
  }
  if (action === "reset") {
    lastTime = performance.now();
    resetRace();
    requestAnimationFrame(loop);
  }
});

window.addEventListener("resize", () => {
  updateDimensions();
  render();
});

window.addEventListener("pointerdown", setTouchMode, { once: true });
setTouchMode();
updateDimensions();
applyTruckColors();
render();
