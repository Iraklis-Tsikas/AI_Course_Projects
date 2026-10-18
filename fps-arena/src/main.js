import * as THREE from 'three';
import './style.css';

// ---------- Config ----------
const ARENA_HALF = 22;
const EYE_HEIGHT = 1.6;
const RADIUS = 0.5;
const PLAYER_SPEED = 6;
const MOUSE_SENSITIVITY = 0.0022;
const PLAYER_FIRE_RATE = 0.22;
const BOT_SPEED = 4.2;
const BODY_DAMAGE = 20;
const HEAD_DAMAGE = 45;
const BOT_DAMAGE = 9;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const ui = {
  playerHp: $('player-hp'),
  enemyHp: $('enemy-hp'),
  score: $('score'),
  overlay: $('overlay'),
  title: $('overlay-title'),
  text: $('overlay-text'),
  damage: $('damage'),
  hitmarker: $('hitmarker'),
  start: document.querySelector('.start'),
};

// ---------- Renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb3d9);
scene.fog = new THREE.Fog(0x8fb3d9, 30, 75);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);
camera.rotation.order = 'YXZ';
scene.add(camera);

scene.add(new THREE.HemisphereLight(0xdfefff, 0x4a3b2a, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(15, 30, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 80 });
scene.add(sun);

// ---------- Textures ----------
function canvasTexture(size, draw, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const floorTex = canvasTexture(256, (g, s) => {
  g.fillStyle = '#5d6670';
  g.fillRect(0, 0, s, s);
  g.fillStyle = '#545d66';
  g.fillRect(0, 0, s / 2, s / 2);
  g.fillRect(s / 2, s / 2, s / 2, s / 2);
  g.strokeStyle = '#3f464d';
  g.lineWidth = 4;
  g.strokeRect(0, 0, s, s);
}, ARENA_HALF);

const crateTex = canvasTexture(128, (g, s) => {
  g.fillStyle = '#a0723f';
  g.fillRect(0, 0, s, s);
  g.strokeStyle = '#6b4a25';
  g.lineWidth = 10;
  g.strokeRect(5, 5, s - 10, s - 10);
  g.beginPath();
  g.moveTo(5, 5);
  g.lineTo(s - 5, s - 5);
  g.moveTo(s - 5, 5);
  g.lineTo(5, s - 5);
  g.stroke();
});

const wallTex = canvasTexture(128, (g, s) => {
  g.fillStyle = '#8a8f99';
  g.fillRect(0, 0, s, s);
  g.strokeStyle = '#6c717a';
  g.lineWidth = 3;
  for (let y = 0; y < s; y += 32) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(s, y);
    g.stroke();
    const off = (y / 32) % 2 ? 32 : 0;
    for (let x = off; x < s; x += 64) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + 32);
      g.stroke();
    }
  }
});

// ---------- Arena ----------
const obstacleMeshes = [];
const colliders = [];

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(ARENA_HALF * 2, ARENA_HALF * 2),
  new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

function addBlock(x, z, w, d, h, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
  obstacleMeshes.push(mesh);
  colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
}

function texturedMat(tex, w, h, color = 0xffffff) {
  const t = tex.clone();
  t.repeat.set(Math.max(1, w / 2), Math.max(1, h / 2));
  t.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map: t, color, roughness: 0.85 });
}

// Outer walls
const L = ARENA_HALF * 2 + 2;
addBlock(0, -ARENA_HALF - 0.5, L, 1, 5, texturedMat(wallTex, L, 5));
addBlock(0, ARENA_HALF + 0.5, L, 1, 5, texturedMat(wallTex, L, 5));
addBlock(-ARENA_HALF - 0.5, 0, 1, L, 5, texturedMat(wallTex, L, 5));
addBlock(ARENA_HALF + 0.5, 0, 1, L, 5, texturedMat(wallTex, L, 5));

// Cover: pillars, crates and low walls (symmetric layout)
const pillarMat = new THREE.MeshStandardMaterial({ color: 0x4f6d8f, roughness: 0.6 });
const lowWallMat = new THREE.MeshStandardMaterial({ color: 0xc9b48a, roughness: 0.9 });
const crateMat = new THREE.MeshStandardMaterial({ map: crateTex, roughness: 0.8 });

for (const [x, z] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) addBlock(x, z, 2, 2, 4.5, pillarMat);
addBlock(0, 0, 4, 4, 3.5, pillarMat);
for (const s of [-1, 1]) {
  addBlock(0, s * 11, 7, 0.8, 1.3, lowWallMat);
  addBlock(s * 14, 0, 0.8, 7, 1.3, lowWallMat);
  addBlock(s * 15, s * 15, 1.6, 1.6, 1.6, crateMat);
  addBlock(s * -15, s * 15, 1.6, 1.6, 1.6, crateMat);
  addBlock(s * 4.5, s * -6, 1.4, 1.4, 1.4, crateMat);
  addBlock(s * 17, s * -6, 1.6, 1.6, 1.6, crateMat);
}

// ---------- Helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const yawTo = (from, to) => Math.atan2(-(to.x - from.x), -(to.z - from.z));
const forwardOf = (yaw) => new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));

function collide(pos, r = RADIUS) {
  for (const c of colliders) {
    const cx = clamp(pos.x, c.minX, c.maxX);
    const cz = clamp(pos.z, c.minZ, c.maxZ);
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      pos.x = cx + (dx / d) * r;
      pos.z = cz + (dz / d) * r;
    } else {
      // Center is inside the box: push out along the shallowest axis
      const pens = [pos.x - c.minX, c.maxX - pos.x, pos.z - c.minZ, c.maxZ - pos.z];
      const i = pens.indexOf(Math.min(...pens));
      if (i === 0) pos.x = c.minX - r;
      else if (i === 1) pos.x = c.maxX + r;
      else if (i === 2) pos.z = c.minZ - r;
      else pos.z = c.maxZ + r;
    }
  }
}

function separate(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const d = Math.hypot(dx, dz);
  const min = RADIUS * 2;
  if (d > 0 && d < min) {
    const push = (min - d) / 2;
    a.x -= (dx / d) * push;
    a.z -= (dz / d) * push;
    b.x += (dx / d) * push;
    b.z += (dz / d) * push;
  }
}

const raycaster = new THREE.Raycaster();
function hasLineOfSight(from, to) {
  const dir = to.clone().sub(from);
  const dist = dir.length();
  raycaster.set(from, dir.normalize());
  raycaster.far = dist;
  return raycaster.intersectObjects(obstacleMeshes, false).length === 0;
}

// ---------- Audio ----------
let audio;
function ensureAudio() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
}

function playShot(volume = 0.35, freq = 1400) {
  if (!audio) return;
  const len = audio.sampleRate * 0.18;
  const buf = audio.createBuffer(1, len, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = audio.createBufferSource();
  src.buffer = buf;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq;
  const gain = audio.createGain();
  gain.gain.value = volume;
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start();
}

function playTone(freq, dur, type = 'sine', volume = 0.15) {
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + dur);
}

// ---------- Effects ----------
const effects = [];

function addEffect(obj, life) {
  scene.add(obj);
  effects.push({ obj, life, max: life });
}

function tracer(from, to, color) {
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true });
  addEffect(new THREE.Line(geo, mat), 0.09);
}

const sparkGeo = new THREE.SphereGeometry(0.08, 6, 6);
function spark(point, color = 0xffd27a) {
  const mesh = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color, transparent: true }));
  mesh.position.copy(point);
  addEffect(mesh, 0.3);
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    e.life -= dt;
    e.obj.material.opacity = Math.max(0, e.life / e.max);
    if (e.obj.isMesh) e.obj.scale.setScalar(1 + (1 - e.life / e.max) * 1.5);
    if (e.life <= 0) {
      scene.remove(e.obj);
      if (e.obj.geometry !== sparkGeo) e.obj.geometry.dispose();
      e.obj.material.dispose();
      effects.splice(i, 1);
    }
  }
}

// ---------- Player ----------
const player = {
  pos: new THREE.Vector3(),
  yaw: 0,
  pitch: 0,
  health: 100,
  cooldown: 0,
  moving: false,
  bob: 0,
};

// First-person gun attached to the camera
const gun = new THREE.Group();
const gunMat = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.4, metalness: 0.6 });
const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.55), gunMat);
const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 10), gunMat);
gunBarrel.rotation.x = Math.PI / 2;
gunBarrel.position.set(0, 0.02, -0.42);
const gunGrip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.2, 0.1), gunMat);
gunGrip.position.set(0, -0.14, 0.12);
gunGrip.rotation.x = 0.3;
const gunTip = new THREE.Object3D();
gunTip.position.set(0, 0.02, -0.62);
const muzzleFlash = new THREE.Mesh(
  new THREE.SphereGeometry(0.07, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xffdd66 })
);
muzzleFlash.position.copy(gunTip.position);
muzzleFlash.visible = false;
const muzzleLight = new THREE.PointLight(0xffaa33, 0, 6);
muzzleLight.position.copy(gunTip.position);
gun.add(gunBody, gunBarrel, gunGrip, gunTip, muzzleFlash, muzzleLight);
const GUN_REST = new THREE.Vector3(0.24, -0.22, -0.62);
gun.scale.setScalar(0.55);
gun.position.copy(GUN_REST);
camera.add(gun);
let flashTimer = 0;
let recoil = 0;

// ---------- Bot ----------
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = v3(0, 1, 0);

function makeBot() {
  const group = new THREE.Group();
  const std = (color, roughness, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const armorMat = std(0x2b2f36, 0.45, 0.6);
  const plateMat = std(0x8a1c1c, 0.5, 0.4);
  const suitMat = std(0x16181c, 0.85);
  const metalMat = std(0x5d636b, 0.3, 0.85);
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff2a1a, emissiveIntensity: 2.5 });

  function part(geo, mat, parent, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  const box = (w, h, d, mat, parent, x, y, z, rx, ry, rz) =>
    part(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z, rx, ry, rz);
  const cyl = (rt, rb, h, mat, parent, x, y, z, rx, ry, rz) =>
    part(new THREE.CylinderGeometry(rt, rb, h, 12), mat, parent, x, y, z, rx, ry, rz);
  // A box stretched between two points (used for arm segments)
  function limb(a, b, thick, mat, parent) {
    const dir = b.clone().sub(a);
    const m = part(new THREE.BoxGeometry(thick, dir.length(), thick), mat, parent, 0, 0, 0);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    return m;
  }

  // Legs: pivot at the hips so they can swing while walking
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.15, 0.92, 0);
    box(0.2, 0.46, 0.24, suitMat, leg, 0, -0.22, 0);
    box(0.17, 0.14, 0.07, plateMat, leg, 0, -0.46, -0.13);
    box(0.19, 0.4, 0.22, armorMat, leg, 0, -0.66, 0);
    box(0.22, 0.14, 0.34, suitMat, leg, 0, -0.85, -0.05);
    group.add(leg);
    legs.push(leg);
  }

  // Upper body pivots at the hips (for recoil and breathing); children use world-height coords
  const upper = new THREE.Group();
  upper.position.y = 0.95;
  const body = new THREE.Group();
  body.position.y = -0.95;
  upper.add(body);
  group.add(upper);

  // Pelvis and belt
  box(0.48, 0.2, 0.3, suitMat, body, 0, 0.98, 0);
  box(0.52, 0.07, 0.33, metalMat, body, 0, 1.06, 0);
  for (const x of [-0.17, 0, 0.17]) box(0.1, 0.1, 0.06, plateMat, body, x, 1.02, -0.18);

  // Torso with chest plate and glowing core
  box(0.56, 0.52, 0.34, armorMat, body, 0, 1.34, 0);
  box(0.46, 0.34, 0.06, plateMat, body, 0, 1.39, -0.19);
  cyl(0.065, 0.065, 0.03, glowMat, body, 0, 1.39, -0.225, Math.PI / 2);
  for (const side of [-1, 1]) box(0.1, 0.18, 0.05, metalMat, body, side * 0.17, 1.17, -0.18);

  // Spiked shoulder pads
  for (const side of [-1, 1]) {
    box(0.26, 0.15, 0.36, plateMat, body, side * 0.38, 1.6, 0, 0, 0, side * -0.3);
    part(new THREE.ConeGeometry(0.045, 0.2, 8), metalMat, body, side * 0.44, 1.72, 0.04, 0, 0, side * -0.5);
    part(new THREE.ConeGeometry(0.035, 0.14, 8), metalMat, body, side * 0.4, 1.7, -0.1, 0, 0, side * -0.5);
  }

  // Backpack with blinking antenna
  box(0.42, 0.44, 0.18, armorMat, body, 0, 1.36, 0.25);
  cyl(0.06, 0.06, 0.36, metalMat, body, -0.13, 1.36, 0.36);
  cyl(0.06, 0.06, 0.36, metalMat, body, 0.13, 1.36, 0.36);
  cyl(0.008, 0.008, 0.6, metalMat, body, 0.15, 1.82, 0.3);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3020 });
  const beacon = part(new THREE.SphereGeometry(0.03, 8, 6), beaconMat, body, 0.15, 2.13, 0.3);

  // Neck and helmet
  cyl(0.09, 0.1, 0.12, suitMat, body, 0, 1.65, 0);
  const head = new THREE.Group();
  head.position.set(0, 1.8, 0);
  body.add(head);
  const helmet = part(new THREE.SphereGeometry(0.2, 18, 14), armorMat, head, 0, 0, 0);
  helmet.scale.set(1, 1.05, 1.12);
  box(0.05, 0.07, 0.36, plateMat, head, 0, 0.2, 0.02);
  box(0.34, 0.07, 0.08, glowMat, head, 0, 0.02, -0.18);
  box(0.16, 0.1, 0.07, metalMat, head, 0, -0.1, -0.17);
  for (const y of [-0.08, -0.11, -0.14]) box(0.12, 0.012, 0.01, suitMat, head, 0, y + 0.02, -0.21);
  for (const side of [-1, 1]) cyl(0.06, 0.06, 0.06, metalMat, head, side * 0.2, 0, 0, 0, 0, Math.PI / 2);
  const eyeLight = new THREE.PointLight(0xff2a1a, 1.5, 2.5);
  eyeLight.position.set(0, 0.02, -0.35);
  head.add(eyeLight);

  // Rifle held in front
  const gx = 0.15;
  box(0.09, 0.14, 0.55, metalMat, body, gx, 1.27, -0.5);
  box(0.07, 0.12, 0.24, suitMat, body, gx, 1.24, -0.14);
  box(0.06, 0.2, 0.08, suitMat, body, gx, 1.13, -0.46, 0.25);
  cyl(0.025, 0.025, 0.32, suitMat, body, gx, 1.28, -0.92, Math.PI / 2);
  cyl(0.035, 0.035, 0.2, suitMat, body, gx, 1.38, -0.5, Math.PI / 2);
  cyl(0.03, 0.03, 0.01, glowMat, body, gx, 1.38, -0.605, Math.PI / 2);
  const tip = new THREE.Object3D();
  tip.position.set(gx, 1.28, -1.1);
  body.add(tip);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffcc55 }));
  flash.position.copy(tip.position);
  flash.visible = false;
  const flashLight = new THREE.PointLight(0xffaa33, 0, 6);
  flashLight.position.copy(tip.position);
  body.add(flash, flashLight);

  // Arms reaching to the rifle grip and handguard
  const rShoulder = v3(0.36, 1.54, 0);
  const rElbow = v3(0.42, 1.2, -0.1);
  const rHand = v3(gx + 0.02, 1.2, -0.36);
  const lShoulder = v3(-0.36, 1.54, 0);
  const lElbow = v3(-0.3, 1.2, -0.28);
  const lHand = v3(gx - 0.04, 1.22, -0.66);
  for (const [s, e, h] of [[rShoulder, rElbow, rHand], [lShoulder, lElbow, lHand]]) {
    limb(s, e, 0.14, armorMat, body);
    limb(e, h, 0.12, suitMat, body);
    part(new THREE.SphereGeometry(0.08, 10, 8), plateMat, body, e.x, e.y, e.z);
    part(new THREE.SphereGeometry(0.065, 10, 8), suitMat, body, h.x, h.y, h.z);
  }

  // Tag hit zones: anything in the helmet is a headshot
  const hitMeshes = [];
  group.traverse((o) => {
    if (!o.isMesh || o === flash) return;
    let isHead = false;
    for (let p = o; p; p = p.parent) if (p === head) isHead = true;
    o.userData.part = isHead ? 'head' : 'body';
    hitMeshes.push(o);
  });
  scene.add(group);

  return {
    group,
    tip,
    legs,
    upper,
    flash,
    flashLight,
    glowMat,
    beaconMat,
    eyeLight,
    hitMeshes,
    flashMats: [armorMat, plateMat, suitMat],
    stride: 0,
    moveAmt: 0,
    recoil: 0,
    flashTimer: 0,
    pos: new THREE.Vector3(),
    yaw: 0,
    health: 100,
    cooldown: 0,
    seenTime: 0,
    strafeDir: 1,
    strafeTimer: 0,
    detourDir: 1,
    detourTimer: 0,
    stuckTime: 0,
    hitFlash: 0,
    deathAnim: 0,
  };
}
const bot = makeBot();

// ---------- Game state ----------
const score = { player: 0, bot: 0 };
let state = 'menu'; // menu | playing | paused | roundOver
let roundOverTimer = 0;
let damageFlash = 0;
let hitmarkerTimer = 0;
const keys = {};

function resetRound() {
  player.pos.set(0, 0, 18);
  player.yaw = 0;
  player.pitch = 0;
  player.health = 100;
  player.cooldown = 0.3;
  bot.pos.set(0, 0, -18);
  bot.yaw = Math.PI;
  bot.health = 100;
  bot.cooldown = 1;
  bot.seenTime = 0;
  bot.deathAnim = 0;
  bot.moveAmt = 0;
  bot.group.rotation.set(0, 0, 0);
  damageFlash = 0;
  updateHud();
}

function startRound() {
  ensureAudio();
  resetRound();
  state = 'playing';
  ui.overlay.classList.add('hidden');
}

function endRound(playerWon) {
  state = 'roundOver';
  roundOverTimer = 1.3;
  if (playerWon) score.player++;
  else score.bot++;
  updateHud();
  if (playerWon) {
    playTone(660, 0.15, 'triangle', 0.2);
    setTimeout(() => playTone(880, 0.3, 'triangle', 0.2), 150);
  } else {
    playTone(220, 0.5, 'sawtooth', 0.15);
  }
  ui.title.textContent = playerWon ? 'YOU WIN THE ROUND' : 'YOU WERE ELIMINATED';
  ui.text.textContent = `Score — You ${score.player} : ${score.bot} Bot`;
}

function updateHud() {
  ui.playerHp.style.width = `${Math.max(0, player.health)}%`;
  ui.enemyHp.style.width = `${Math.max(0, bot.health)}%`;
  ui.score.textContent = `${score.player} : ${score.bot}`;
}

// ---------- Input ----------
const canvas = renderer.domElement;
let mouseDown = false;

function lockPointer() {
  // requestPointerLock returns a promise in modern browsers; ignore rejections (e.g. clicking too soon after Esc)
  Promise.resolve(canvas.requestPointerLock?.()).catch(() => {});
}

function handleStartAction() {
  if (state === 'paused') {
    state = 'playing';
    ui.overlay.classList.add('hidden');
    lockPointer();
  } else if (state !== 'playing' && roundOverTimer <= 0) {
    startRound();
    lockPointer();
  }
}

ui.overlay.addEventListener('click', handleStartAction);

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') e.preventDefault();
  keys[e.code] = true;
  if (e.code === 'Enter') handleStartAction();
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});
window.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  mouseDown = false;
});

window.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || state !== 'playing') return;
  if (document.pointerLockElement !== canvas) lockPointer();
  mouseDown = true;
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouseDown = false;
});

document.addEventListener('mousemove', (e) => {
  if (state !== 'playing' || document.pointerLockElement !== canvas) return;
  player.yaw -= e.movementX * MOUSE_SENSITIVITY;
  player.pitch = clamp(player.pitch - e.movementY * MOUSE_SENSITIVITY, -1.4, 1.4);
});

// Esc releases the pointer lock: pause until the player clicks back in
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas || state !== 'playing') return;
  state = 'paused';
  mouseDown = false;
  ui.title.textContent = 'PAUSED';
  ui.text.textContent = `Score — You ${score.player} : ${score.bot} Bot`;
  ui.start.innerHTML = 'Click to resume';
  ui.overlay.classList.remove('hidden');
});

// ---------- Shooting ----------
const SCREEN_CENTER = new THREE.Vector2(0, 0);
const shootTargets = [floor, ...obstacleMeshes, ...bot.hitMeshes];

function playerShoot() {
  player.cooldown = PLAYER_FIRE_RATE;
  flashTimer = 0.05;
  recoil = 1;
  playShot(0.4, 1600);

  raycaster.setFromCamera(SCREEN_CENTER, camera);
  raycaster.far = 200;
  const hit = raycaster.intersectObjects(shootTargets, false)[0];
  const start = gunTip.getWorldPosition(new THREE.Vector3());
  const end = hit ? hit.point : raycaster.ray.at(80, new THREE.Vector3());
  tracer(start, end, 0xfff2a8);

  if (!hit) return;
  const part = hit.object.userData.part;
  if (part && bot.health > 0) {
    const dmg = part === 'head' ? HEAD_DAMAGE : BODY_DAMAGE;
    bot.health -= dmg;
    bot.hitFlash = 0.12;
    bot.seenTime = Math.max(bot.seenTime, 0.4); // getting shot makes the bot react
    hitmarkerTimer = 0.15;
    ui.hitmarker.style.color = part === 'head' ? '#ffd23f' : '#ff4040';
    playTone(part === 'head' ? 1200 : 900, 0.08, 'square', 0.08);
    spark(hit.point, 0xff3030);
    updateHud();
    if (bot.health <= 0) endRound(true);
  } else {
    spark(hit.point);
  }
}

function botShoot(dist) {
  bot.cooldown = 0.55 + Math.random() * 0.5;
  bot.recoil = 1;
  bot.flashTimer = 0.06;
  const muzzle = bot.tip.getWorldPosition(new THREE.Vector3());
  const target = player.pos.clone().setY(EYE_HEIGHT - 0.25);

  let chance = 0.78 - dist * 0.022;
  if (player.moving) chance -= 0.15;
  chance = clamp(chance, 0.2, 0.78);

  const dist3 = muzzle.distanceTo(target);
  playShot(clamp(0.5 - dist3 * 0.012, 0.12, 0.4), 900);

  if (Math.random() < chance) {
    tracer(muzzle, target.clone().add(new THREE.Vector3(0, -0.3, 0)), 0xff6644);
    player.health -= BOT_DAMAGE;
    damageFlash = 0.6;
    playTone(160, 0.12, 'square', 0.1);
    updateHud();
    if (player.health <= 0) endRound(false);
    return;
  }

  // Miss: spray past the player and hit whatever is behind
  const miss = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.6 - 0.2, Math.random() - 0.5)
    .normalize()
    .multiplyScalar(0.6 + Math.random());
  const dir = target.add(miss).sub(muzzle).normalize();
  raycaster.set(muzzle, dir);
  raycaster.far = 100;
  const hit = raycaster.intersectObjects([floor, ...obstacleMeshes], false)[0];
  const end = hit ? hit.point : muzzle.clone().addScaledVector(dir, 60);
  tracer(muzzle, end, 0xff6644);
  if (hit) spark(hit.point);
}

// ---------- Update ----------
function updatePlayer(dt) {
  const fwd = forwardOf(player.yaw);
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const move = new THREE.Vector3();
  if (keys.KeyW) move.add(fwd);
  if (keys.KeyS) move.sub(fwd);
  if (keys.KeyD) move.add(right);
  if (keys.KeyA) move.sub(right);
  player.moving = move.lengthSq() > 0;
  if (player.moving) {
    player.pos.addScaledVector(move.normalize(), PLAYER_SPEED * dt);
    player.bob += dt * 10;
  }
  collide(player.pos);

  player.cooldown -= dt;
  if (mouseDown && player.cooldown <= 0) playerShoot();
}

const _move = new THREE.Vector3();
function updateBot(dt) {
  const eye = bot.pos.clone().setY(EYE_HEIGHT);
  const playerEye = player.pos.clone().setY(EYE_HEIGHT);
  const dist = bot.pos.distanceTo(player.pos);
  const sees = hasLineOfSight(eye, playerEye);
  bot.seenTime = sees ? bot.seenTime + dt : 0;

  const angleToPlayer = yawTo(bot.pos, player.pos);
  const fwd = forwardOf(angleToPlayer);
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);

  bot.strafeTimer -= dt;
  if (bot.strafeTimer <= 0) {
    bot.strafeDir = Math.random() < 0.5 ? -1 : 1;
    bot.strafeTimer = 0.7 + Math.random() * 1.5;
  }
  bot.detourTimer -= dt;

  _move.set(0, 0, 0);
  if (sees) {
    // Engage: keep a comfortable range and strafe
    if (dist > 14) _move.add(fwd);
    else if (dist < 6) _move.sub(fwd);
    _move.addScaledVector(right, bot.strafeDir * 0.9);
  } else {
    // Hunt: head toward the player, detouring around cover when stuck
    _move.add(fwd);
    if (bot.detourTimer > 0) _move.addScaledVector(right, bot.detourDir * 1.6);
  }

  const before = bot.pos.clone();
  if (_move.lengthSq() > 0) {
    _move.normalize();
    bot.pos.addScaledVector(_move, BOT_SPEED * dt);
  }
  collide(bot.pos);

  const moved = bot.pos.distanceTo(before);
  bot.stride += moved * 2.6;
  bot.moveAmt += (clamp(moved / (BOT_SPEED * dt), 0, 1) - bot.moveAmt) * Math.min(1, dt * 8);
  if (_move.lengthSq() > 0 && moved < BOT_SPEED * dt * 0.35) {
    bot.stuckTime += dt;
    if (bot.stuckTime > 0.2) {
      bot.stuckTime = 0;
      bot.strafeDir *= -1;
      bot.detourDir = Math.random() < 0.5 ? -1 : 1;
      bot.detourTimer = 1 + Math.random();
    }
  } else {
    bot.stuckTime = 0;
  }

  // Aim: face the player when visible, otherwise face movement direction
  const desiredYaw = sees || _move.lengthSq() === 0 ? angleToPlayer : Math.atan2(-_move.x, -_move.z);
  const diff = wrapAngle(desiredYaw - bot.yaw);
  bot.yaw += clamp(diff, -5 * dt, 5 * dt);

  bot.cooldown -= dt;
  const aimError = Math.abs(wrapAngle(angleToPlayer - bot.yaw));
  if (sees && bot.seenTime > 0.45 && bot.cooldown <= 0 && aimError < 0.2) botShoot(dist);
}

function syncVisuals(dt) {
  // Camera
  const bobY = player.moving ? Math.sin(player.bob) * 0.05 : 0;
  const deadDrop = state !== 'playing' && player.health <= 0 ? -1.1 : 0;
  camera.position.set(player.pos.x, EYE_HEIGHT + bobY + deadDrop, player.pos.z);
  camera.rotation.y = player.yaw;
  camera.rotation.x = deadDrop ? 0 : player.pitch;
  camera.rotation.z = deadDrop ? 0.4 : 0;

  // Gun recoil & sway
  recoil = Math.max(0, recoil - dt * 8);
  gun.position.set(
    GUN_REST.x + (player.moving ? Math.cos(player.bob * 0.5) * 0.015 : 0),
    GUN_REST.y + (player.moving ? Math.abs(Math.sin(player.bob * 0.5)) * 0.02 : 0),
    GUN_REST.z + recoil * 0.08
  );
  gun.rotation.x = recoil * 0.15;

  flashTimer -= dt;
  muzzleFlash.visible = flashTimer > 0;
  muzzleLight.intensity = flashTimer > 0 ? 4 : 0;

  // Bot
  bot.group.position.set(bot.pos.x, 0, bot.pos.z);
  bot.group.rotation.y = bot.yaw;
  const t = performance.now() / 1000;
  const swing = Math.sin(bot.stride) * 0.6 * bot.moveAmt;
  bot.legs[0].rotation.x = swing;
  bot.legs[1].rotation.x = -swing;
  bot.recoil = Math.max(0, bot.recoil - dt * 8);
  bot.upper.position.y = 0.95 + Math.abs(Math.cos(bot.stride)) * 0.03 * bot.moveAmt + Math.sin(t * 2) * 0.008;
  bot.upper.rotation.x = bot.recoil * 0.12;
  bot.flashTimer -= dt;
  bot.flash.visible = bot.flashTimer > 0;
  bot.flashLight.intensity = bot.flashTimer > 0 ? 5 : 0;

  const alive = bot.health > 0;
  bot.glowMat.emissiveIntensity = alive ? 2.2 + Math.sin(t * 6) * 0.6 : 0.1;
  bot.eyeLight.intensity = alive ? 1.5 : 0;
  bot.beaconMat.color.setHex(alive && Math.sin(t * 5) > 0.3 ? 0xff3020 : 0x330806);

  if (!alive) {
    bot.deathAnim = Math.min(1, bot.deathAnim + dt * 3);
    bot.group.rotation.x = -bot.deathAnim * (Math.PI / 2);
  }
  bot.hitFlash -= dt;
  for (const m of bot.flashMats) m.emissive.setHex(bot.hitFlash > 0 ? 0xff2200 : 0x000000);

  // HUD effects
  damageFlash = Math.max(0, damageFlash - dt * 1.5);
  const lowHp = state === 'playing' && player.health <= 30 ? 0.3 + Math.sin(performance.now() / 200) * 0.1 : 0;
  ui.damage.style.opacity = Math.max(damageFlash, lowHp);
  hitmarkerTimer -= dt;
  ui.hitmarker.style.opacity = hitmarkerTimer > 0 ? 1 : 0;
}

// ---------- Loop ----------
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state === 'playing') {
    updatePlayer(dt);
    if (state === 'playing') updateBot(dt);
    separate(player.pos, bot.pos);
    collide(player.pos);
    collide(bot.pos);
  } else if (state === 'roundOver') {
    roundOverTimer -= dt;
    if (roundOverTimer <= 0 && ui.overlay.classList.contains('hidden')) {
      ui.start.innerHTML = 'Click to play the next round';
      ui.overlay.classList.remove('hidden');
      if (document.pointerLockElement) document.exitPointerLock();
    }
  } else if (state === 'menu') {
    // Menu: slow orbit for a backdrop
    player.yaw += dt * 0.15;
  }

  updateEffects(dt);
  syncVisuals(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

resetRound();
frame();
