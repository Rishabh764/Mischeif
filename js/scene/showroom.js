/* ==========================================================================
   SLANG STUDIO — The showroom: a real room, built once, behind every page.

   Plan (1 unit ≈ 0.5 m):
     - an entrance hall (z from +10 to about -6): the hero piece, the banner
       and, on the Shop page, the round carousel platform
     - a long aisle beyond it: one piece every GAP units on alternating sides,
       each on a short rail hung from the ceiling (accessories on plinths),
       each lit by its own spotlight on the ceiling track
     - plaster walls with lit alcoves, oak herringbone floor, plaster ceiling,
       and the SLANG STUDIO sign on the far wall
   ========================================================================== */

import * as THREE from "../lib/three.module.min.js";
import { PIECE_H, FLOOR_GAP, HOOK_Y } from "./garment.js";

export const FLOOR_Y = -(PIECE_H / 2 + FLOOR_GAP); // -2.55
export const CEIL_Y = FLOOR_Y + 6.4;                // ceiling ≈ 3.2 m
export const ROOM_W = 4.6;                          // half-width: walls at ±4.6
export const GAP = 6;                               // distance between pieces along the aisle
export const SLOT0_Z = -9;                          // first piece in the aisle
export const Z_FRONT = 10;                          // entrance wall
export const RING_Z = -3.1;                         // carousel centre (Shop page)
export const PLINTH_TOP = FLOOR_Y + 1.75;           // display plinths ≈ 0.9 m tall

const WARM = 0xffe3bf;         // spotlight colour (≈ 3000 K)
const WALL_TINT = 0xfff6ec;
const INK = "#141416", RED = "#e8251a";

const loader = new THREE.TextureLoader();
function tex(url, renderer, { color = false, repeat = [1, 1], rotation = 0 } = {}) {
  const t = loader.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.rotation = rotation;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function canvasTexture(w, h, draw) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Faint visible light beam: brightest at the fixture, fading toward the floor. */
function beamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(WARM) }, uStrength: { value: 0.1 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN, vV;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uStrength; varying vec2 vUv; varying vec3 vN, vV;
      void main(){ float edge = pow(abs(dot(vN, vV)), 1.8); float fall = pow(vUv.y, 1.6); gl_FragColor = vec4(uColor * uStrength * edge * fall, 1.0); }`
  });
}

export function buildShowroom(stage, count) {
  const { scene, renderer } = stage;
  const q = stage.quality;
  const room = new THREE.Group();
  const zEnd = SLOT0_Z - (count - 1) * GAP - 9;    // far wall
  const length = Z_FRONT - zEnd, zMid = (Z_FRONT + zEnd) / 2;

  /* ---------- Surfaces ---------------------------------------------------- */
  const floorTile = 2.6; // one herringbone texture repeat ≈ 1.3 m
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W * 2, length), new THREE.MeshStandardMaterial({
    map: tex("assets/room/floor-color.jpg", renderer, { color: true, repeat: [ROOM_W * 2 / floorTile, length / floorTile] }),
    normalMap: tex("assets/room/floor-normal.jpg", renderer, { repeat: [ROOM_W * 2 / floorTile, length / floorTile] }),
    roughnessMap: tex("assets/room/floor-rough.jpg", renderer, { repeat: [ROOM_W * 2 / floorTile, length / floorTile] }),
    roughness: 0.62, metalness: 0, normalScale: new THREE.Vector2(0.55, 0.55), envMapIntensity: 0.8
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR_Y, zMid);
  floor.receiveShadow = true;
  room.add(floor);

  const wallMat = (len, h, tint = WALL_TINT) => new THREE.MeshStandardMaterial({
    map: tex("assets/room/wall-color.jpg", renderer, { color: true, repeat: [len / 5, h / 5] }),
    normalMap: tex("assets/room/wall-normal.jpg", renderer, { repeat: [len / 5, h / 5] }),
    normalScale: new THREE.Vector2(0.35, 0.35), color: tint, roughness: 0.94, metalness: 0, envMapIntensity: 0.35
  });
  const H = CEIL_Y - FLOOR_Y, yMid = (CEIL_Y + FLOOR_Y) / 2;
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(length, H), wallMat(length, H));
    wall.rotation.y = -side * Math.PI / 2;
    wall.position.set(side * ROOM_W, yMid, zMid);
    wall.receiveShadow = true;
    room.add(wall);
  }
  const endWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W * 2, H), wallMat(ROOM_W * 2, H));
  endWall.position.set(0, yMid, zEnd); endWall.receiveShadow = true; room.add(endWall);
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W * 2, H), wallMat(ROOM_W * 2, H));
  frontWall.rotation.y = Math.PI; frontWall.position.set(0, yMid, Z_FRONT); room.add(frontWall);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_W * 2, length), wallMat(ROOM_W * 2, length, 0xfffbf5));
  ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, CEIL_Y, zMid); room.add(ceiling);

  // Skirting boards and a slim shadow-gap where the walls meet the ceiling.
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0xf0e9df, roughness: 0.7 });
  const gapMat = new THREE.MeshStandardMaterial({ color: 0x8c8378, roughness: 0.9 });
  for (const side of [-1, 1]) {
    const sk = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, length), skirtMat);
    sk.position.set(side * (ROOM_W - 0.025), FLOOR_Y + 0.11, zMid); sk.receiveShadow = true; room.add(sk);
    const sg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, length), gapMat);
    sg.position.set(side * (ROOM_W - 0.015), CEIL_Y - 0.03, zMid); room.add(sg);
  }
  const skEnd = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W * 2, 0.22, 0.05), skirtMat);
  skEnd.position.set(0, FLOOR_Y + 0.11, zEnd + 0.025); room.add(skEnd);

  /* ---------- Alcoves: recessed wall niches with a warm strip light -------- */
  const glowTex = canvasTexture(64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(255,226,186,0.95)"); g.addColorStop(0.35, "rgba(255,220,180,0.35)"); g.addColorStop(1, "rgba(255,220,180,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  const nicheMat = new THREE.MeshStandardMaterial({ color: 0xeee2d1, roughness: 0.9 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf1e8dc, roughness: 0.9 });
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xfff1dc });
  const washMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 });
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0xcdb08c, roughness: 0.6 });
  for (let z = SLOT0_Z - GAP / 2; z > zEnd + 4; z -= GAP * 2) {
    for (const side of [-1, 1]) {
      const zz = z + (side > 0 ? -GAP : 0);
      if (zz < zEnd + 4) continue;
      const W = 2.6, NH = 4.2, D = 0.5, y0 = FLOOR_Y + 1.1;
      const g = new THREE.Group();
      const back = new THREE.Mesh(new THREE.PlaneGeometry(W, NH), nicheMat); back.position.set(0, NH / 2, -D); back.receiveShadow = true; g.add(back);
      for (const sx of [-1, 1]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, NH, D), frameMat); s.position.set(sx * W / 2, NH / 2, -D / 2); g.add(s); }
      const top = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, D), frameMat); top.position.set(0, NH, -D / 2); g.add(top);
      const bot = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, D), frameMat); bot.position.set(0, 0, -D / 2); g.add(bot);
      const led = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.025, 0.04), ledMat); led.position.set(0, NH - 0.06, -0.08); g.add(led);
      const wash = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, NH * 0.9), washMat); wash.position.set(0, NH - NH * 0.45, -D + 0.01); g.add(wash);
      for (const sy of [1.25, 2.55]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(W - 0.12, 0.05, D - 0.04), shelfMat); sh.position.set(0, sy, -D / 2 - 0.02); sh.castShadow = sh.receiveShadow = true; g.add(sh); }
      // A built-out niche: its back panel touches the wall, its frame stands D proud of it.
      g.rotation.y = -side * Math.PI / 2;
      g.position.set(side * (ROOM_W - D - 0.002), y0, zz);
      room.add(g);
    }
  }

  const lensMat = new THREE.MeshBasicMaterial({ color: 0xfff4e2 });

  /* ---------- Wall-washer downlights: recessed cans near each wall and the
     arched "scallops" of light they throw down the plaster ------------------ */
  const scallopTex = canvasTexture(256, 512, (ctx, w, h) => {
    const img = ctx.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x / (w - 1)) * 2 - 1, v = y / (h - 1);           // u: -1..1 across, v: 0 top .. 1 bottom
      const edge = 0.04 + 0.5 * u * u;                              // the arched top edge of the scallop
      const inside = Math.max(0, Math.min(1, (v - edge) / 0.025));  // soft but defined top edge
      const fall = Math.pow(Math.max(0, 1 - v), 1.6) * Math.max(0, 1 - Math.abs(u) * 0.9);
      const a = inside * fall;
      const i = (y * w + x) * 4;
      d[i] = 255; d[i + 1] = 226; d[i + 2] = 190; d[i + 3] = Math.round(255 * Math.min(1, a * 1.25));
    }
    ctx.putImageData(img, 0, 0);
  });
  const scallopMat = new THREE.MeshBasicMaterial({ map: scallopTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.42 });
  const scallopGeo = new THREE.PlaneGeometry(2.4, 4.2);
  const canGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 20);
  for (let z = Z_FRONT - 2.5; z > zEnd + 1; z -= 3) {
    for (const side of [-1, 1]) {
      const sc = new THREE.Mesh(scallopGeo, scallopMat);
      sc.rotation.y = -side * Math.PI / 2;
      sc.position.set(side * (ROOM_W - 0.012), CEIL_Y - 2.1, z);
      room.add(sc);
      const can = new THREE.Mesh(canGeo, lensMat);
      can.position.set(side * (ROOM_W - 0.45), CEIL_Y - 0.011, z);
      room.add(can);
    }
  }

  /* ---------- Far wall: the backlit sign ------------------------------------ */
  const signTex = canvasTexture(2048, 420, (ctx, w, h) => {
    ctx.font = '900 300px "Big Shoulders Display", Impact, sans-serif';
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    const a = "SLANG ", b = "STUDIO", wa = ctx.measureText(a).width, wb = ctx.measureText(b).width, x0 = (w - wa - wb) / 2;
    ctx.fillStyle = INK; ctx.fillText(a, x0, h / 2 + 10);
    ctx.fillStyle = RED; ctx.fillText(b, x0 + wa, h / 2 + 10);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.6 * 420 / 2048), new THREE.MeshBasicMaterial({ map: signTex, transparent: true }));
  sign.position.set(0, FLOOR_Y + 4.2, zEnd + 0.06); room.add(sign);
  const signWash = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 4.6), new THREE.MeshBasicMaterial({ map: stage.shared.glowTexture, color: 0xffe0b8, transparent: true, depthWrite: false, opacity: 0.22, blending: THREE.AdditiveBlending }));
  signWash.position.set(0, FLOOR_Y + 4.1, zEnd + 0.03); room.add(signWash);

  /* ---------- Ceiling tracks, fixtures, rails, plinths, spotlights --------- */
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x1f1d1b, roughness: 0.4, metalness: 0.7 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x24221f, roughness: 0.3, metalness: 0.85 });
  for (const tx of [-1.0, 1.0]) {
    const track = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, length - 2), trackMat);
    track.position.set(tx, CEIL_Y - 0.025, zMid); room.add(track);
  }
  const fixtureGeo = new THREE.CylinderGeometry(0.075, 0.095, 0.24, 20);
  const lensGeo = new THREE.CircleGeometry(0.07, 20);
  const beamGeo = new THREE.ConeGeometry(1, 1, 40, 1, true);

  const makeFixture = (pos, target) => {
    const f = new THREE.Group();
    const body = new THREE.Mesh(fixtureGeo, trackMat); f.add(body);
    const lens = new THREE.Mesh(lensGeo, lensMat); lens.rotation.x = Math.PI / 2; lens.position.y = -0.121; f.add(lens);
    f.position.copy(pos);
    // Aim the fixture: its -Y axis points at the target.
    const dir = new THREE.Vector3().subVectors(target, pos).normalize();
    f.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, CEIL_Y - pos.y), trackMat);
    stem.position.set(pos.x, (CEIL_Y + pos.y) / 2, pos.z); room.add(stem);
    room.add(f);
    return f;
  };
  const makeSpot = (intensity, angle, shadow) => {
    const s = new THREE.SpotLight(WARM, intensity, 14, angle, 0.72, 1.35);
    if (shadow && q.shadows) {
      s.castShadow = true; s.shadow.mapSize.set(q.shadowSize, q.shadowSize);
      s.shadow.bias = -0.0005; s.shadow.normalBias = 0.02; s.shadow.radius = 6; s.shadow.blurSamples = 12;
      s.shadow.camera.near = 0.5; s.shadow.camera.far = 14;
    }
    scene.add(s, s.target);
    return s;
  };
  const makeBeam = () => { const b = new THREE.Mesh(beamGeo, beamMaterial()); room.add(b); return b; };
  const aimBeam = (beam, from, to, radius) => {
    const len = from.distanceTo(to);
    beam.scale.set(radius, len, radius);
    beam.position.copy(from).add(to).multiplyScalar(0.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3().subVectors(to, from).normalize());
  };

  const slots = [];
  for (let i = 0; i < count; i++) {
    const rail = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.5, 12), railMat);
    bar.rotation.z = Math.PI / 2; bar.castShadow = true; rail.add(bar);
    for (const sx of [-0.68, 0.68]) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, CEIL_Y - HOOK_Y), railMat);
      rod.position.set(sx, (CEIL_Y - HOOK_Y) / 2, 0); rail.add(rod);
    }
    room.add(rail);
    const spot = makeSpot(q.spotIntensity, 0.4, false);
    const beam = makeBeam();
    slots.push({ rail, spot, beam, fixture: null });
  }

  /* ---------- Hall: hero light, banner, carousel platform, soft downlights -- */
  const heroSpot = makeSpot(q.spotIntensity * 1.15, 0.42, true);
  const heroFixture = makeFixture(new THREE.Vector3(0, CEIL_Y - 0.35, 5.0), new THREE.Vector3(0, 0, 2.4));
  const hallLights = [];
  for (const [x, z] of [[-2.2, 1.5], [2.2, 1.5], [0, -4.5]]) {
    const s = new THREE.SpotLight(0xfff0dd, q.spotIntensity * 0.55, 13, 0.95, 0.9, 1.2);
    s.position.set(x, CEIL_Y - 0.1, z); s.target.position.set(x, FLOOR_Y, z);
    scene.add(s, s.target); hallLights.push(s);
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 24), lensMat);
    can.position.set(x, CEIL_Y - 0.011, z); room.add(can);
  }

  // The headline banner: printed fabric hung from the ceiling; it lifts away on scroll.
  const bannerTex = canvasTexture(2048, 1280, (ctx, w, h) => {
    ctx.fillStyle = "#f3ece2"; ctx.fillRect(0, 0, w, h);
    const fit = (text, target) => { ctx.font = '900 400px "Big Shoulders Display", Impact, sans-serif'; return Math.floor(400 * (target / ctx.measureText(text).width)); };
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    let size = Math.min(fit("MADE FOR", w * 0.84), 520);
    ctx.font = `900 ${size}px "Big Shoulders Display", Impact, sans-serif`;
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeText("MADE FOR", w / 2, h * 0.46);
    size = Math.min(fit("TROUBLE", w * 0.88), 600);
    ctx.font = `900 ${size}px "Big Shoulders Display", Impact, sans-serif`;
    ctx.fillStyle = RED; ctx.fillText("TROUBLE", w / 2, h * 0.9);
  });
  bannerTex.anisotropy = 4;
  const bannerH = 5.2, bannerW = bannerH * 1.6;
  const banner = new THREE.Group();
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(bannerW, bannerH, 1, 1), new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.95, side: THREE.DoubleSide }));
  cloth.position.y = -bannerH / 2; cloth.receiveShadow = true; banner.add(cloth);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, bannerW + 0.3, 12), railMat);
  pole.rotation.z = Math.PI / 2; banner.add(pole);
  const weight = pole.clone(); weight.position.y = -bannerH; banner.add(weight);
  banner.position.set(0, CEIL_Y - 0.25, -6.2);
  room.add(banner);

  // Shop carousel: a low oak platform with a circular ceiling rail above it.
  const ring = new THREE.Group();
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.12, 96), new THREE.MeshStandardMaterial({
    map: tex("assets/room/floor-color.jpg", renderer, { color: true, repeat: [1.2, 1.2] }), color: 0xf5ebdd, roughness: 0.5, transparent: true
  }));
  platform.receiveShadow = true;
  platform.position.y = FLOOR_Y + 0.06;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 8, 160), new THREE.MeshStandardMaterial({ color: 0x24221f, metalness: 0.85, roughness: 0.3, transparent: true }));
  halo.rotation.x = Math.PI / 2; halo.position.y = HOOK_Y;
  const edge = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.008, 6, 160), new THREE.MeshBasicMaterial({ color: 0xe8251a, transparent: true }));
  edge.rotation.x = Math.PI / 2; edge.position.y = FLOOR_Y + 0.125;
  ring.add(platform, halo, edge);
  ring.position.z = RING_Z;
  room.add(ring);
  const ringSpot = new THREE.SpotLight(WARM, 0, 16, 0.75, 0.8, 1.2);
  ringSpot.position.set(0, CEIL_Y - 0.2, RING_Z + 2.5); ringSpot.target.position.set(0, -0.5, RING_Z);
  scene.add(ringSpot, ringSpot.target);

  scene.add(room);

  /* ---------- Layout (depends on screen shape) and per-frame upkeep ---------- */
  return {
    room, banner, ring, ringSpot, heroSpot, heroFixture, hallLights, zEnd,
    layout() {
      slots.forEach((s, i) => {
        const p = stage.slot(i);
        s.rail.position.set(p.x, HOOK_Y, p.z); s.rail.rotation.y = p.ry;
        const target = new THREE.Vector3(p.x, -0.1, p.z);
        const from = new THREE.Vector3(p.x * 0.35, CEIL_Y - 0.35, p.z + 2.2);
        s.spot.position.copy(from); s.spot.target.position.copy(target);
        if (s.fixture) room.remove(s.fixture);
        s.fixture = makeFixture(from, target);
        aimBeam(s.beam, from, new THREE.Vector3(p.x, FLOOR_Y + 0.5, p.z - 0.2), 0.95);
      });
      this.ring.scale.set(stage.ringR, 1, stage.ringR);
    },
    /** Accessories stand on their own plinths, so their slot has no rail. */
    setAccessory(i, isAccessory) { slots[i].rail.visible = !isAccessory; },
    update(env) {
      // Ring dressing fades with the Shop page; its light follows.
      ring.visible = env.ring > 0.01;
      ring.traverse((o) => { if (o.material) o.material.opacity = env.ring; });
      ringSpot.intensity = q.spotIntensity * 1.4 * env.ring;
      for (const s of slots) s.beam.material.uniforms.uStrength.value = 0.09 * (0.35 + 0.65 * env.corridor);
    }
  };
}
