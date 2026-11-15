/* ==========================================================================
   MISCHIEF — The showroom stage.
   One persistent 3D scene behind every page. The ten pieces are "actors" that
   live for the whole session: each view only says where every actor and the
   camera should be, and the stage glides them there. That is what makes
   moving between pages feel like flying through one room.
   ========================================================================== */

import * as THREE from "../lib/three.module.min.js";
import { createActor, PIECE_H, FLOOR_GAP } from "./garment.js";

const BG = 0x070708;
export const FLOOR_Y = -(PIECE_H / 2 + FLOOR_GAP);
export const GAP = 6; // distance between pieces along the corridor

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

export class Stage {
  constructor(canvas) {
    this.ok = true;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(BG, 1);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(BG, 5, 24);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);

    this.cam = {
      pos: new THREE.Vector3(0, 0, 9), look: new THREE.Vector3(0, 0, 0),
      tPos: new THREE.Vector3(0, 0, 6), tLook: new THREE.Vector3(0, 0, 0)
    };
    this.pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    this.fogTarget = [5, 24];
    this.envTarget = { corridor: 0, ring: 0 };
    this.envNow = { corridor: -1, ring: -1 };
    this.heroText = 0; // 0..1 opacity of the big headline wall
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

    this.shared = {
      uTime: { value: 0 },
      uLight: { value: new THREE.Vector2(0.5, 0.3) },
      uFogColor: { value: new THREE.Color(BG) },
      uFogNear: { value: 5 }, uFogFar: { value: 24 },
      glowTexture: canvasTexture(256, 256, (ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, "rgba(255,244,236,1)");
        g.addColorStop(0.35, "rgba(255,120,100,0.42)");
        g.addColorStop(1, "rgba(255,60,40,0)");
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

  /* ---------- Build ------------------------------------------------------ */

  async build(products, onProgress) {
    await document.fonts.load('900 120px "Big Shoulders Display"').catch(() => {});
    this.buildEnvironment(products.length);
    let done = 0;
    this.actors = await Promise.all(products.map(async (p) => {
      const a = await createActor(p, this.renderer, this.shared);
      onProgress && onProgress(++done / products.length);
      return a;
    }));
    this.actors.forEach((a) => this.scene.add(a.group));
    this.layout();
  }

  buildEnvironment(count) {
    const { scene } = this;

    // Floor: a faint grid that dissolves into the dark.
    const grid = canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#09090b"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.075)"; ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, w, h);
    });
    grid.wrapS = grid.wrapT = THREE.RepeatWrapping;
    grid.repeat.set(160, 160);
    grid.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshBasicMaterial({ map: grid }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, FLOOR_Y, -30);
    scene.add(floor);

    // Dust in the air.
    const N = 700, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = FLOOR_Y + Math.random() * 4.4;
      pos[i * 3 + 2] = 12 - Math.random() * 78;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xfff1ea, size: 0.022, transparent: true, opacity: 0.55, depthWrite: false }));
    scene.add(this.dust);

    /* Corridor dressing */
    const corridor = (this.corridor = new THREE.Group());
    const red = 0xff2d20;
    this.bars = [];
    this.numerals = [];
    for (let i = 0; i < count; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 3.3, 0.035), new THREE.MeshBasicMaterial({ color: red, transparent: true }));
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 4.6), new THREE.MeshBasicMaterial({
        map: this.shared.glowTexture, color: red, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      bar.add(halo);
      corridor.add(bar);
      this.bars.push(bar);

      const num = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({
        map: canvasTexture(256, 256, (ctx, w, h) => {
          ctx.font = '900 210px "Big Shoulders Display", Impact, sans-serif';
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.lineWidth = 3; ctx.strokeStyle = "rgba(240,237,231,0.95)";
          ctx.strokeText(String(i + 1).padStart(2, "0"), w / 2, h / 2 + 10);
        }),
        transparent: true, opacity: 0.5, depthWrite: false
      }));
      num.rotation.x = -Math.PI / 2;
      corridor.add(num);
      this.numerals.push(num);
    }
    for (let z = 6; z > -(count * GAP + 6); z -= 3) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(7, 0.012, 0.04), new THREE.MeshBasicMaterial({ color: 0x4a4a52, transparent: true }));
      beam.position.set(0, 2.35, z);
      corridor.add(beam);
    }

    // The headline wall behind the hero piece.
    const headline = canvasTexture(2048, 1280, (ctx, w, h) => {
      const fit = (text, target) => {
        ctx.font = '900 400px "Big Shoulders Display", Impact, sans-serif';
        return Math.floor(400 * (target / ctx.measureText(text).width));
      };
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      let size = Math.min(fit("MADE FOR", w * 0.9), 560);
      ctx.font = `900 ${size}px "Big Shoulders Display", Impact, sans-serif`;
      ctx.lineWidth = 5; ctx.strokeStyle = "#efece6";
      ctx.strokeText("MADE FOR", w / 2, h * 0.47);
      size = Math.min(fit("TROUBLE", w * 0.94), 620);
      ctx.font = `900 ${size}px "Big Shoulders Display", Impact, sans-serif`;
      ctx.fillStyle = "#ff2d20";
      ctx.fillText("TROUBLE", w / 2, h * 0.93);
    });
    headline.anisotropy = 4;
    this.headline = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshBasicMaterial({ map: headline, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    this.headline.position.set(0, 0.3, -2.4);
    scene.add(this.headline);
    scene.add(corridor);

    /* Ring dressing: a lit circle on the floor under the carousel. */
    const ring = (this.ring = new THREE.Group());
    const circle = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 160), new THREE.MeshBasicMaterial({ color: red, transparent: true, side: THREE.DoubleSide }));
    circle.rotation.x = -Math.PI / 2;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64), new THREE.MeshBasicMaterial({
      map: this.shared.glowTexture, color: 0xff5a48, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.002;
    ring.add(circle, pool);
    ring.position.y = FLOOR_Y + 0.01;
    scene.add(ring);

    // Remember each dressing material's resting opacity so groups can fade.
    [corridor, ring].forEach((g) => g.traverse((o) => { if (o.material) o.material.userData.base = o.material.opacity; }));
  }

  /** Positions that depend on the screen shape. */
  layout() {
    const p = this.portrait;
    this.slotX = p ? 0.36 : 1.45;
    this.ringR = p ? 2.25 : 3.1;
    if (!this.bars) return;
    this.bars.forEach((bar, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      bar.position.set(side * (this.slotX + (p ? 0.95 : 1.3)), FLOOR_Y + 1.65, -i * GAP - 0.7);
      this.numerals[i].position.set(-side * (p ? 0.5 : 0.9), FLOOR_Y + 0.012, -i * GAP + 1.5);
      this.numerals[i].scale.setScalar(p ? 0.6 : 1);
    });
    // Headline wall: as big as fits between the floor and the top of the screen
    // (seen from the hero camera position), never wider than the screen.
    const dist = (p ? 5.6 : 5.4) - this.headline.position.z;
    const halfH = Math.tan((this.camera.fov * Math.PI) / 360) * dist, halfW = halfH * this.camera.aspect;
    const bottom = FLOOR_Y + 0.14, top = halfH * (p ? 0.8 : 0.84);
    let h = top - bottom;
    if (h * 1.6 > halfW * 1.84) h = (halfW * 1.84) / 1.6;
    this.headline.scale.set(h, h, 1); // the plane is 1.6 wide by 1 tall
    this.headline.position.y = p ? top - h / 2 : bottom + h / 2;
    this.ring.scale.setScalar(this.ringR);
    this.ring.position.z = -this.ringR;
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const portrait = w / h < 0.9;
    this.camera.fov = portrait ? 58 : 42;
    this.camera.updateProjectionMatrix();
    this.portrait = portrait;
    this.layout();
  }

  /* ---------- Views ------------------------------------------------------ */

  setView(view) {
    this.view = view;
    this.transition = 0;
    this.scrollY = window.scrollY;
    this.actors.forEach((a) => a.resetSpin());
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

  fadeGroup(name, group) {
    const now = this.envNow[name], tgt = this.envTarget[name] || 0;
    const next = now < 0 ? tgt : now + (tgt - now) * 0.08;
    if (Math.abs(next - now) < 0.0005) return;
    this.envNow[name] = next;
    group.visible = next > 0.01;
    group.traverse((o) => { if (o.material) o.material.opacity = (o.material.userData.base ?? 1) * next; });
  }

  frame(t) {
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
    this.last = t;
    this.time += dt;
    this.shared.uTime.value = this.time;

    // Smoothed scroll and pointer.
    const sy = window.scrollY;
    this.scrollY += (sy - this.scrollY) * (1 - Math.exp(-dt * 9));
    if (Math.abs(sy - this.scrollY) < 0.05) this.scrollY = sy;
    const pf = 1 - Math.exp(-dt * 5);
    this.pointer.sx += (this.pointer.x - this.pointer.sx) * pf;
    this.pointer.sy += (this.pointer.y - this.pointer.sy) * pf;
    this.shared.uLight.value.set(0.55 + this.pointer.sx * 0.9, 0.3 + this.pointer.sy * 0.6);

    if (this.view && this.view.update) this.view.update(dt);

    // Glide slowly right after a page change, then follow tightly.
    this.transition = Math.min(1, this.transition + dt / 1.5);
    const k = lerp(2.3, 8.5, smooth(this.transition));
    const f = 1 - Math.exp(-dt * k);

    for (const a of this.actors) {
      const c = a.cur, g = a.tgt;
      c.x += (g.x - c.x) * f; c.y += (g.y - c.y) * f; c.z += (g.z - c.z) * f;
      c.rx += (g.rx - c.rx) * f; c.ry += (g.ry - c.ry) * f; c.rz += (g.rz - c.rz) * f;
      c.s += (g.s - c.s) * f; c.o += (g.o - c.o) * f; c.glow += (g.glow - c.glow) * f;
      a.hover += (a.hoverTgt - a.hover) * (1 - Math.exp(-dt * 10));
      const visible = c.o > 0.01;
      a.group.visible = visible;
      if (!visible) continue;
      a.group.position.set(c.x, c.y + Math.sin(this.time * 0.6 + a.product.index * 1.9) * 0.014, c.z);
      a.group.rotation.set(c.rx, c.ry, c.rz);
      a.group.scale.setScalar(c.s * (1 + a.hover * 0.035));
      a.material.uniforms.uOpacity.value = c.o;
      a.material.uniforms.uHover.value = a.hover;
      a.glowMat.opacity = c.o * 0.2 * c.glow;
      a.wireMat.opacity = c.o * 0.55;
    }

    const cam = this.cam;
    cam.pos.lerp(cam.tPos, f);
    cam.look.lerp(cam.tLook, f);
    this.camera.position.set(cam.pos.x + this.pointer.sx * 0.16, cam.pos.y + this.pointer.sy * 0.09, cam.pos.z);
    this.camera.lookAt(cam.look);

    const fog = this.scene.fog;
    fog.near += (this.fogTarget[0] - fog.near) * 0.06;
    fog.far += (this.fogTarget[1] - fog.far) * 0.06;
    this.shared.uFogNear.value = fog.near;
    this.shared.uFogFar.value = fog.far;

    this.fadeGroup("corridor", this.corridor);
    this.fadeGroup("ring", this.ring);
    const hm = this.headline.material;
    hm.opacity += (this.heroText - hm.opacity) * 0.1;
    this.headline.visible = hm.opacity > 0.01;
    this.dust.rotation.y = Math.sin(this.time * 0.05) * 0.02;

    this.renderer.render(this.scene, this.camera);
  }
}

/** Stand-in used when the device cannot run WebGL: same surface, does nothing. */
export function createNullStage(products) {
  const noop = { set() {} };
  const blank = () => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 0, glow: 1 });
  return {
    ok: false, portrait: window.innerWidth / window.innerHeight < 0.9, slotX: 1.45, ringR: 3.1,
    actors: products.map((p) => ({ product: p, cur: blank(), tgt: blank(), setSpin: (a) => a, resetSpin() {} })),
    cam: { tPos: noop, tLook: noop }, pointer: { x: 0, y: 0, sx: 0, sy: 0 },
    fogTarget: [5, 24], envTarget: {}, heroText: 0, time: 0,
    build: async (_, onProgress) => onProgress && onProgress(1),
    setView(v) { this.view = v; }, start() {}, pick: () => null, setHover() {},
    progress(el) { return el ? clamp01(window.scrollY / Math.max(1, el.offsetHeight - window.innerHeight)) : 0; }
  };
}
