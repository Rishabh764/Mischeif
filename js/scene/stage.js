/* ==========================================================================
   SLANG STUDIO — The showroom stage.
   One persistent 3D scene behind every page: a real room (showroom.js) with
   the ten pieces as real 3D garments (garment.js). The pieces are "actors"
   that live for the whole session: each view only says where every actor and
   the camera should be, and the stage glides them there. That is what makes
   moving between pages feel like walking through one store.
   ========================================================================== */

import * as THREE from "../lib/three.module.min.js";
import { RoomEnvironment } from "../lib/RoomEnvironment.js";
import { createActor } from "./garment.js";
import { buildShowroom, FLOOR_Y, CEIL_Y, GAP, SLOT0_Z, RING_Z, PLINTH_TOP } from "./showroom.js";
import { HOOK_Y } from "./garment.js";

export { FLOOR_Y, GAP, SLOT0_Z, RING_Z, HOOK_Y };
export const ACC_SCALE = 0.42; // cap and beanie at true size
const BG = 0xf1ebe2; // warm plaster, also the fog colour

const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;

export function webglSupported() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) { return false; }
}

function canvasTexture(w, h, draw) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Lighter settings for phones and small screens. */
function pickQuality() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const light = coarse || small;
  return light
    ? { light: true, pixelRatio: 2, minPixelRatio: 1.5, gridX: 140, spotIntensity: 55 }
    : { light: false, pixelRatio: 2, minPixelRatio: 1, gridX: 160, spotIntensity: 55 };
}

export class Stage {
  constructor(canvas) {
    this.ok = true;
    this.canvas = canvas;
    this.quality = pickQuality();
    // Edge smoothing only where pixels are big enough to need it: on screens with
    // 150%+ scaling it is invisible but costs ~15% of the graphics chip's work.
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 1.5, powerPreference: "high-performance" }));
    r.setClearColor(BG, 1);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.12;
    r.autoClear = false; // two layers per frame, see frame()

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG);
    this.fog = new THREE.Fog(BG, 30, 90);
    this.scene.fog = this.fog;
    // Soft, realistic reflections and fill light from a generic room environment.
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.62;
    // The room is lit by soft fill light only (its spotlight pools are painted on,
    // see showroom.js): walls and floor cover most of the screen, and real
    // spotlights on every one of those pixels were what overloaded the GPU.
    this.scene.add(new THREE.HemisphereLight(0xfff8ef, 0xe0cfb8, 0.95));
    // The garments get their own layer with the real spotlights, so light still
    // falls properly on the cloth.
    this.pieces = new THREE.Scene();
    this.pieces.fog = this.fog;
    this.pieces.environment = this.scene.environment;
    this.pieces.environmentIntensity = 0.5;
    this.pieces.add(new THREE.HemisphereLight(0xfff8ef, 0xe0cfb8, 0.62));

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140);
    this.cam = {
      pos: new THREE.Vector3(0, 0.5, 9), look: new THREE.Vector3(0, 0, 0),
      tPos: new THREE.Vector3(0, 0.5, 6), tLook: new THREE.Vector3(0, 0, 0)
    };
    this.pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    this.fogTarget = [30, 90];
    this.envTarget = { corridor: 0, ring: 0 };
    this.envNow = { corridor: -1, ring: -1 };
    this.heroText = 0;   // 0..1: how far the headline banner is lowered
    this.heroLight = 0;  // 0..1: the hall spotlight that follows the featured piece
    this.feature = null; // the piece that spotlight follows (Home: piece 01; product page: that piece)
    this.actors = [];
    this.view = null;
    this.time = 0;
    this.last = 0;
    this.scrollY = 0;
    this.transition = 1;
    this.portrait = false;
    this.slotX = 1.45;
    this.ringR = 3.1;
    this.raycaster = new THREE.Raycaster();
    this.adapt = null; // automatic-quality state (see adaptQuality)
    this.needsRender = true; // draw on the next frame even if nothing seems to move
    this.idle = 0;          // seconds since anything last changed
    this.swayAmt = 1;       // garments' gentle sway; settles to 0 when the scene is still
    this.drewLast = false;  // whether the previous frame was drawn (for adaptQuality)

    this.shared = {
      quality: this.quality,
      oakMaterial: (() => {
        const t = new THREE.TextureLoader().load("assets/room/floor-color.jpg", () => this.requestRender());
        t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.35, 0.35);
        return new THREE.MeshStandardMaterial({ map: t, color: 0xf2e6d6, roughness: 0.55, transparent: true });
      })(),
      glowTexture: canvasTexture(256, 256, (ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, "rgba(255,244,230,1)");
        g.addColorStop(0.4, "rgba(255,214,170,0.4)");
        g.addColorStop(1, "rgba(255,200,150,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }),
      shadowTexture: canvasTexture(256, 256, (ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, "rgba(40,32,24,0.85)");
        g.addColorStop(0.45, "rgba(40,32,24,0.35)");
        g.addColorStop(1, "rgba(40,32,24,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      })
    };

    window.addEventListener("pointermove", (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  /** Where piece i hangs in the aisle (alternating sides). */
  slot(i) {
    const side = i % 2 === 0 ? -1 : 1;
    return { side, x: side * this.slotX, z: SLOT0_Z - i * GAP, ry: -side * (this.portrait ? 0.2 : 0.42) };
  }

  /** Put a piece back in its place in the aisle (on its rail, or its plinth). */
  park(a, i, o = 1) {
    const p = this.slot(i), t = a.tgt;
    t.x = p.x; t.z = p.z; t.ry = p.ry; t.rx = 0; t.rz = 0;
    t.s = a.accessory ? ACC_SCALE : 1;
    t.y = a.accessory ? PLINTH_TOP - a.bottom * ACC_SCALE : 0;
    t.o = o; t.stand = a.accessory ? 1 : 0; t.cable = 0; t.cableTo = null;
  }

  /* ---------- Build ------------------------------------------------------ */

  async build(products, onProgress) {
    await document.fonts.load('900 120px "Big Shoulders Display"').catch(() => {});
    this.showroom = buildShowroom(this, products.length);
    let done = 0;
    this.actors = await Promise.all(products.map(async (p) => {
      const a = await createActor(p, this.renderer, this.shared);
      onProgress && onProgress(++done / products.length);
      return a;
    }));
    this.actors.forEach((a, i) => { this.pieces.add(a.group); this.showroom.setAccessory(i, a.accessory); });
    this.layout();
  }

  /** Positions that depend on the screen shape. */
  layout() {
    const p = this.portrait;
    this.slotX = p ? 0.62 : 1.45;
    this.ringR = p ? 2.25 : 3.1;
    if (!this.showroom) return;
    this.showroom.layout();
    this.actors.forEach((a, i) => this.showroom.setAccessory(i, a.accessory));
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    // Keep whatever resolution automatic quality settled on (resizes happen often on phones).
    this.renderer.setPixelRatio(this.adapt && this.adapt.ratio ? this.adapt.ratio : this.pixelRatioRange().max);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const portrait = w / h < 0.9;
    this.camera.fov = portrait ? 60 : 44;
    this.camera.updateProjectionMatrix();
    this.portrait = portrait;
    this.layout();
    this.needsRender = true;
  }

  /* ---------- Views ------------------------------------------------------ */

  /** Ask for a fresh frame (a texture finished loading, the screen changed...). */
  requestRender() { this.needsRender = true; }

  setView(view) {
    this.view = view;
    this.needsRender = true;
    this.transition = 0;
    this.scrollY = window.scrollY;
    this.heroLight = 0;
    this.feature = null;
    this.actors.forEach((a) => { a.resetSpin(); a.tgt.stand = 0; a.tgt.cable = 0; a.tgt.cableTo = null; });
  }

  /** 0..1 scroll progress through a tall "scroll space" element. */
  progress(el) {
    if (!el) return 0;
    return clamp01(this.scrollY / Math.max(1, el.offsetHeight - window.innerHeight));
  }

  pick(clientX, clientY) {
    if (!this.actors.length) return null;
    const ndc = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -((clientY / window.innerHeight) * 2 - 1));
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.actors.filter((a) => a.cur.o > 0.4).map((a) => a.mesh), false);
    if (!hits.length) return null;
    return this.actors.find((a) => a.mesh === hits[0].object) || null;
  }

  setHover(actor) {
    this.actors.forEach((a) => (a.hoverTgt = a === actor ? 1 : 0));
  }

  /* ---------- Loop ------------------------------------------------------- */

  start() {
    const tick = (t) => { this.frame(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  envFade(name) {
    const now = this.envNow[name], tgt = this.envTarget[name] || 0;
    const next = now < 0 ? tgt : now + (tgt - now) * 0.08;
    this.envNow[name] = Math.abs(next - tgt) < 0.0005 ? tgt : next;
    return this.envNow[name];
  }

  /** Automatic quality: keeps the room smooth by trading sharpness, never the other way.
   *  - ignores the first 4 s (loading, shaders warming up) and page changes
   *  - steps the drawing resolution down only after two slow readings in a row,
   *    and back up after four fast ones
   *  - never below quality.minPixelRatio (phones stay sharp) */
  adaptQuality(frameMs) {
    const a = (this.adapt ||= { sum: 0, n: 0, slow: 0, fast: 0, warm: 0, ratio: 0 });
    if (document.hidden) return;
    a.warm += frameMs;
    if (a.warm < 4000 || this.transition < 1) { a.sum = 0; a.n = 0; return; }
    a.sum += frameMs; a.n++;
    if (a.n < 60) return;
    const fps = 1000 / (a.sum / a.n); a.sum = 0; a.n = 0;
    if (fps < 45) { a.slow++; a.fast = 0; } else if (fps > 57) { a.fast++; a.slow = 0; } else { a.slow = 0; a.fast = 0; }
    const { max, min } = this.pixelRatioRange(), cur = this.renderer.getPixelRatio();
    let next = cur;
    if (a.slow >= 2 && cur > min) next = Math.max(min, cur - 0.25);
    else if (a.fast >= 4 && cur < max) next = Math.min(max, cur + 0.25);
    if (next === cur) return;
    a.slow = 0; a.fast = 0; a.ratio = next;
    this.renderer.setPixelRatio(next);
    this.renderer.setSize(this.canvas.clientWidth || window.innerWidth, this.canvas.clientHeight || window.innerHeight, false);
  }

  /** Sharpest and softest drawing resolution allowed on this device. */
  pixelRatioRange() {
    const max = Math.min(window.devicePixelRatio || 1, this.quality.pixelRatio);
    return { max, min: Math.min(max, this.quality.minPixelRatio) };
  }
  frame(t) {
    const frameMs = t - (this.last || t);
    const dt = Math.min(0.05, frameMs / 1000);
    this.last = t;
    this.time += dt;

    // Smoothed scroll and pointer.
    const sy = window.scrollY;
    this.scrollY += (sy - this.scrollY) * (1 - Math.exp(-dt * 9));
    if (Math.abs(sy - this.scrollY) < 0.05) this.scrollY = sy;
    const pf = 1 - Math.exp(-dt * 5);
    this.pointer.sx += (this.pointer.x - this.pointer.sx) * pf;
    this.pointer.sy += (this.pointer.y - this.pointer.sy) * pf;

    if (this.view && this.view.update) this.view.update(dt);

    // Is anything actually changing? When nothing is, the stage stops drawing:
    // the same picture stays on screen and the graphics chip rests.
    let moving = this.needsRender || this.transition < 1 || Math.abs(sy - this.scrollY) > 0.05
      || Math.abs(this.pointer.x - this.pointer.sx) > 2e-4 || Math.abs(this.pointer.y - this.pointer.sy) > 2e-4
      || this.cam.pos.distanceToSquared(this.cam.tPos) > 1e-8 || this.cam.look.distanceToSquared(this.cam.tLook) > 1e-8
      || Math.abs(this.fog.near - this.fogTarget[0]) > 0.01 || Math.abs(this.fog.far - this.fogTarget[1]) > 0.01;

    // Glide slowly right after a page change, then follow tightly.
    this.transition = Math.min(1, this.transition + dt / 1.5);
    const k = lerp(2.3, 8.5, smooth(this.transition));
    const f = 1 - Math.exp(-dt * k);

    for (const a of this.actors) {
      const c = a.cur, g = a.tgt;
      const delta = Math.abs(g.x - c.x) + Math.abs(g.y - c.y) + Math.abs(g.z - c.z) + Math.abs(g.rx - c.rx) + Math.abs(g.ry - c.ry)
        + Math.abs(g.rz - c.rz) + Math.abs(g.s - c.s) + Math.abs(g.o - c.o) + Math.abs(a.hoverTgt - a.hover);
      if (delta > 1e-4) moving = true;
      c.x += (g.x - c.x) * f; c.y += (g.y - c.y) * f; c.z += (g.z - c.z) * f;
      c.rx += (g.rx - c.rx) * f; c.ry += (g.ry - c.ry) * f; c.rz += (g.rz - c.rz) * f;
      c.s += (g.s - c.s) * f; c.o += (g.o - c.o) * f;
      a.hover += (a.hoverTgt - a.hover) * (1 - Math.exp(-dt * 10));
      const visible = c.o > 0.01;
      a.group.visible = visible;
      if (!visible) continue;
      // Hanging pieces sway very slightly; pieces on plinths stay still.
      const sway = a.accessory ? 0 : Math.sin(this.time * 0.55 + a.product.index * 1.9) * 0.012 * this.swayAmt;
      a.group.position.set(c.x, c.y, c.z);
      a.group.rotation.set(c.rx, c.ry + sway, c.rz);
      a.group.scale.setScalar(c.s * (1 + a.hover * 0.025));
      a.setOpacity(c.o);
      a.setHover(a.hover);
      a.floorShadow.position.y = (FLOOR_Y + 0.008 - a.group.position.y) / a.group.scale.y;
      const sc = a.group.scale.y, gy = a.group.position.y;
      if (a.stand) {
        // Oak plinth from the piece's base down to the floor, 0.9 units wide in the room.
        const top = a.bottom, bottom = (FLOOR_Y - gy) / sc;
        a.stand.visible = !!g.stand && top - bottom > 0.05;
        a.stand.scale.set(0.9 / sc, top - bottom, 0.9 / sc);
        a.stand.position.set(a.centerX, (top + bottom) / 2, 0);
      }
      {
        // Cable from the hanger hook (or the top of a cap/beanie) straight up to the
        // ceiling, or to the Shop's ring rail when the view says so.
        const to = g.cableTo ?? CEIL_Y;
        const len = (to - (gy + a.cableFrom * sc)) / sc;
        a.cable.visible = !!g.cable && len > 0.02 && Math.abs(c.rx) < 0.2;
        a.cable.scale.y = Math.max(0.01, len);
        a.cable.position.set(a.accessory ? a.centerX : 0, a.cableFrom + len / 2, 0);
      }
      a.floorMat.opacity = g.stand || Math.abs(c.rx) > 0.3 ? 0 : c.o * 0.28; // none on plinths or lying flat
    }

    // The hall spotlight follows piece 01 while it is the hero on Home.
    const sr = this.showroom;
    if (sr) {
      const h = (this.feature || this.actors[0] || { group: { position: new THREE.Vector3() } }).group.position;
      sr.heroSpot.target.position.set(h.x, h.y - 0.1, h.z);
      sr.heroSpot.position.set(h.x * 0.6, sr.heroFixture.position.y, h.z + 2.6);
      sr.heroSpot.intensity = this.quality.spotIntensity * 1.15 * this.heroLight;
      sr.heroPool.position.set(h.x * 1.25, FLOOR_Y + 0.013, h.z - 1.1);
      sr.heroPool.material.opacity = 0.4 * this.heroLight;
      // The banner lowers with the headline and lifts away as you walk in.
      const drop = smooth(this.heroText);
      sr.banner.position.y = lerp(9.3, 3.6, drop); // 9.3: fully retracted above the ceiling
      sr.banner.visible = drop > 0.002;
    }

    const cam = this.cam;
    cam.pos.lerp(cam.tPos, f);
    cam.look.lerp(cam.tLook, f);
    this.camera.position.set(cam.pos.x + this.pointer.sx * 0.14, cam.pos.y + this.pointer.sy * 0.07, cam.pos.z);
    this.camera.lookAt(cam.look);

    const fog = this.fog;
    fog.near += (this.fogTarget[0] - fog.near) * 0.06;
    fog.far += (this.fogTarget[1] - fog.far) * 0.06;

    const before = { ...this.envNow };
    const env = { corridor: this.envFade("corridor"), ring: this.envFade("ring") };
    if (env.corridor !== before.corridor || env.ring !== before.ring) moving = true;
    if (sr) sr.update(env, this.camera.position);

    // The sway eases out half a second after everything else is still, and back in on any change.
    this.idle = moving ? 0 : this.idle + dt;
    this.swayAmt += ((this.idle < 0.5 ? 1 : 0) - this.swayAmt) * (1 - Math.exp(-dt * 2.5));
    if (!moving && this.swayAmt < 0.002) { this.drewLast = false; return; } // nothing would change: skip drawing

    // Judge smoothness only from back-to-back drawn frames (idle frames would look "fast").
    if (this.drewLast && frameMs > 0) this.adaptQuality(frameMs);
    this.drewLast = true;

    this.needsRender = false;
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);  // the room
    this.renderer.render(this.pieces, this.camera); // the garments, on top (depth kept)
  }
}

/** Stand-in used when the device cannot run WebGL: same surface, does nothing. */
export function createNullStage(products) {
  const noop = { set() {} };
  const blank = () => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 0 });
  return {
    ok: false, portrait: window.innerWidth / window.innerHeight < 0.9, slotX: 1.45, ringR: 3.1,
    actors: products.map((p) => ({ product: p, cur: blank(), tgt: blank(), setSpin: (a) => a, resetSpin() {}, accessory: p.kind === "cap" || p.kind === "beanie", bottom: -0.4 })),
    cam: { tPos: noop, tLook: noop }, pointer: { x: 0, y: 0, sx: 0, sy: 0 },
    fogTarget: [30, 90], envTarget: {}, heroText: 0, heroLight: 0, time: 0,
    slot(i) { const side = i % 2 === 0 ? -1 : 1; return { side, x: side * 1.45, z: SLOT0_Z - i * GAP, ry: -side * 0.42 }; },
    park() {},
    build: async (_, onProgress) => onProgress && onProgress(1),
    setView(v) { this.view = v; }, start() {}, pick: () => null, setHover() {},
    progress(el) { return el ? clamp01(window.scrollY / Math.max(1, el.offsetHeight - window.innerHeight)) : 0; }
  };
}
