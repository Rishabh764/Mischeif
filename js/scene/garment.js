/* ==========================================================================
   MISCHIEF — A hanging garment: a flat cut-out given depth.
   The plane curves like a torso (always bulging toward the camera), sways as
   if hanging, shows a different image on its back face, and casts a faint
   mirror image on the showroom floor.
   ========================================================================== */

import * as THREE from "../lib/three.module.min.js";
import { pieceImage } from "./standins.js";

export const PIECE_H = 1.6;
export const PIECE_W = PIECE_H * 0.8;
export const FLOOR_GAP = 0.34; // gap between the hem and the floor

const VERT = /* glsl */ `
  uniform float uTime, uPhase, uBulge, uSway;
  varying vec2 vUv;
  varying float vDepth, vCurve;
  void main() {
    vUv = uv;
    vec3 p = position;
    // +1 when the front face looks at the camera, -1 when the back does.
    float facing = (modelViewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).z >= 0.0 ? 1.0 : -1.0;
    p.z += facing * uBulge * (cos((uv.x - 0.5) * 3.14159) - 0.35);
    float hang = 1.0 - uv.y;
    p.x += sin(uTime * 0.9 + uPhase + uv.y * 2.4) * uSway * hang;
    p.z += cos(uTime * 0.7 + uPhase * 1.7 + uv.x * 3.0) * uSway * 1.6 * hang;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    vCurve = (uv.x - 0.5) * facing;
    gl_Position = projectionMatrix * mv;
  }`;

const FRAG = /* glsl */ `
  uniform sampler2D uFront, uBack;
  uniform float uOpacity, uFogNear, uFogFar, uReflect, uFlipFace, uHover;
  uniform vec3 uFogColor;
  uniform vec2 uLight;
  varying vec2 vUv;
  varying float vDepth, vCurve;
  void main() {
    bool front = gl_FrontFacing;
    if (uFlipFace > 0.5) front = !front;
    vec4 c = front ? texture2D(uFront, vUv) : texture2D(uBack, vec2(1.0 - vUv.x, vUv.y));
    if (c.a < 0.02) discard;
    float n = sin(vCurve * 3.14159);
    float lit = 0.86 + 0.24 * n * uLight.x + 0.10 * uLight.y * (vUv.y - 0.5);
    float rim = smoothstep(0.30, 0.5, abs(vUv.x - 0.5)) * 0.07;
    vec3 col = c.rgb * lit + rim + uHover * 0.05;
    col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, vDepth));
    float a = c.a * uOpacity;
    if (uReflect > 0.5) { a *= 0.22 * pow(1.0 - vUv.y, 1.5); col *= 0.75; }
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }`;

const geometry = new THREE.PlaneGeometry(PIECE_W, PIECE_H, 28, 36);
const glowGeometry = new THREE.PlaneGeometry(1, 1);

function loadTexture(url, renderer) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      // Rasterise onto a fixed canvas so SVG stand-ins and photos behave the same.
      const cv = document.createElement("canvas");
      cv.width = 800; cv.height = 1000;
      const ctx = cv.getContext("2d");
      const s = Math.min(cv.width / img.width, cv.height / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      resolve(tex);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function createActor(product, renderer, shared) {
  const [front, back] = await Promise.all([
    loadTexture(pieceImage(product, "front"), renderer),
    loadTexture(pieceImage(product, "back"), renderer)
  ]);
  let frames = null;
  if (product.turntable && product.turntable.length) {
    frames = (await Promise.all(product.turntable.map((u) => loadTexture(u, renderer)))).filter(Boolean);
    if (!frames.length) frames = null;
  }

  const uniforms = {
    uFront: { value: front }, uBack: { value: back || front },
    uTime: shared.uTime, uLight: shared.uLight,
    uFogColor: shared.uFogColor, uFogNear: shared.uFogNear, uFogFar: shared.uFogFar,
    uPhase: { value: product.index * 1.37 }, uBulge: { value: 0.085 }, uSway: { value: 0.012 },
    uOpacity: { value: 0 }, uReflect: { value: 0 }, uFlipFace: { value: 0 }, uHover: { value: 0 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.product = product;

  // Mirror image on the floor.
  const reflMat = material.clone();
  Object.assign(reflMat.uniforms, {
    uFront: uniforms.uFront, uBack: uniforms.uBack, uTime: shared.uTime, uLight: shared.uLight,
    uFogColor: shared.uFogColor, uFogNear: shared.uFogNear, uFogFar: shared.uFogFar,
    uOpacity: uniforms.uOpacity, uPhase: uniforms.uPhase
  });
  reflMat.uniforms.uReflect.value = 1;
  reflMat.uniforms.uFlipFace.value = 1;
  const refl = new THREE.Mesh(geometry, reflMat);
  refl.scale.y = -1;
  refl.position.y = -(PIECE_H + FLOOR_GAP * 2);

  // Soft light behind the piece, so dark garments read against a dark room.
  const glowMat = new THREE.MeshBasicMaterial({
    map: shared.glowTexture, transparent: true, depthWrite: false, opacity: 0,
    blending: THREE.AdditiveBlending, fog: true, side: THREE.DoubleSide
  });
  const glow = new THREE.Mesh(glowGeometry, glowMat);
  glow.scale.set(3.0, 3.4, 1);
  glow.position.z = -0.4;
  glow.renderOrder = -1;

  // Hanging wire.
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x55555c, transparent: true, opacity: 0, fog: true });
  const wire = new THREE.Mesh(new THREE.PlaneGeometry(0.006, 7), wireMat);
  wire.position.y = PIECE_H / 2 + 3.42;

  const group = new THREE.Group();
  group.add(glow, refl, wire, mesh);

  const zero = () => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 0, glow: 1 });
  return {
    product, group, mesh, material, glowMat, wireMat, frames, front,
    cur: zero(), tgt: zero(), hover: 0, hoverTgt: 0,
    /** Hero spin: real turntable frames when they exist, otherwise the cut-out turns. */
    setSpin(angle) {
      if (!frames) return angle;
      const n = frames.length;
      const k = ((Math.round((angle / (Math.PI * 2)) * n) % n) + n) % n;
      uniforms.uFront.value = frames[k];
      return 0;
    },
    resetSpin() { if (frames) uniforms.uFront.value = front; }
  };
}
