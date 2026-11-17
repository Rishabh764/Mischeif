/* ==========================================================================
   SLANG STUDIO — A garment in the showroom.
   A real 3D model built from the piece's photos and depth maps (see
   garment3d.js), lit by the room's lights like any other object. Clothes hang
   on a dark metal hanger (a clip hanger for trousers); the cap and beanie have
   none, because they sit on plinths.

   Every garment is placed so its hanger hook sits at the same height (HOOK_Y),
   which is where the room's rails are.
   ========================================================================== */

import * as THREE from "../lib/three.module.min.js";
import { buildGarmentGeometry, fabricTexture } from "./garment3d.js";
import { pieceImage } from "../data/products.js";

export const PIECE_H = 1.6;
const PIECE_W = PIECE_H * 0.8;
export const FLOOR_GAP = 1.75;          // hem to floor (about 0.9 m: garments hang at shop height)
const SHOULDER_Y = 0.55;          // where the hanger's shoulders sit, in the piece's own space
export const HOOK_Y = 0.795;             // top of the hanger hook = rail height
const ACCESSORY = new Set(["cap", "beanie"]);

const load = (src) => new Promise((resolve) => {
  const img = new Image();
  img.decoding = "async";
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

/* ---------- Hangers (shared geometry) ------------------------------------- */

let HANGERS = null;
function hangers() {
  if (HANGERS) return HANGERS;
  const metal = new THREE.MeshStandardMaterial({ color: 0x24221f, roughness: 0.32, metalness: 0.85, transparent: true });
  const arc = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.4, -0.12, 0), new THREE.Vector3(-0.2, -0.02, 0), new THREE.Vector3(0, 0.04, 0),
    new THREE.Vector3(0.2, -0.02, 0), new THREE.Vector3(0.4, -0.12, 0)
  ]), 40, 0.011, 8);
  const neck = new THREE.CylinderGeometry(0.0065, 0.0065, 0.17, 8);
  const hook = new THREE.TorusGeometry(0.035, 0.0065, 8, 24, Math.PI * 1.3);
  const bar = new THREE.CylinderGeometry(0.009, 0.009, 0.62, 10);
  const clip = new THREE.BoxGeometry(0.035, 0.07, 0.03);
  const make = (type) => {
    const g = new THREE.Group();
    const mat = metal.clone(); // each hanger fades with its own garment
    const add = (geo, x, y, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, 0); m.rotation.set(rx, 0, rz); g.add(m); return m; };
    if (type === "shoulder") add(arc, 0, SHOULDER_Y);
    else { add(bar, 0, SHOULDER_Y + 0.02, 0, Math.PI / 2); add(clip, -0.26, SHOULDER_Y - 0.02); add(clip, 0.26, SHOULDER_Y - 0.02); }
    add(neck, 0, SHOULDER_Y + 0.04 + 0.085);
    add(hook, 0, HOOK_Y - 0.035, 0, -0.35);
    return g;
  };
  HANGERS = { metal, make };
  return HANGERS;
}

/* ---------- Actor ----------------------------------------------------------- */

export async function createActor(product, renderer, shared) {
  const [front, back, frontDepth, backDepth] = await Promise.all([
    load(pieceImage(product, "front")), load(pieceImage(product, "back")),
    load(`assets/depth/${product.id}-front.png`), load(`assets/depth/${product.id}-back.png`)
  ]);

  const q = shared.quality;
  const geometry = frontDepth && backDepth
    ? buildGarmentGeometry(frontDepth, backDepth, { GX: q.gridX, GY: Math.round(q.gridX * 1.25), width: PIECE_W, height: PIECE_H })
    : new THREE.BoxGeometry(PIECE_W * 0.8, PIECE_H * 0.8, 0.2); // only if the depth maps are missing
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;

  const material = (img) => new THREE.MeshStandardMaterial({
    map: img ? fabricTexture(img, renderer) : null, color: img ? 0xffffff : product.color.hex,
    roughness: 0.88, metalness: 0, envMapIntensity: 0.55, transparent: true
  });
  const frontMat = material(front), backMat = material(back || front);
  const mesh = new THREE.Mesh(geometry, [frontMat, backMat]);
  mesh.userData.product = product;

  // Hang it: shoulders (or waistband) on the hanger; accessories centred on their own base.
  const accessory = ACCESSORY.has(product.kind);
  const hangerType = accessory ? null : product.kind === "cargo" ? "clip" : "shoulder";
  if (hangerType === "shoulder") {
    // Fit the hanger to this garment's real shoulder line: sample the outline
    // along the hanger's arms and raise the garment until the arms sit just
    // under the fabric everywhere (so the piece hangs ON the hanger, not below it).
    const topAt = geometry.userData.topAt;
    const arcY = (x) => (x < 0.2 ? 0.04 - 0.3 * x : -0.02 - 0.5 * (x - 0.2)); // hanger arm height at |x|
    let lift = -Infinity;
    if (topAt) for (let x = 0.14; x <= 0.37; x += 0.01) for (const side of [-1, 1]) {
      const top = topAt(side * x);
      if (Number.isFinite(top)) lift = Math.max(lift, SHOULDER_Y + arcY(x) + 0.045 - top);
    }
    mesh.position.y = Number.isFinite(lift) ? lift : SHOULDER_Y - (box.max.y - 0.05);
  } else if (hangerType === "clip") {
    mesh.position.y = SHOULDER_Y - 0.012 - box.max.y; // waistband held inside the clips
  }
  const group = new THREE.Group();
  group.add(mesh);
  let hanger = null;
  if (hangerType) { hanger = hangers().make(hangerType); group.add(hanger); }

  // Accessories carry their own oak plinth; clothes their own ceiling cable for
  // when they hang on their own (hero, product page). The stage sizes both every
  // frame so they always reach the floor / the ceiling.
  let stand = null;
  if (accessory) {
    stand = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), shared.oakMaterial);
    stand.visible = false;
    group.add(stand);
  }
  const cableMat = hanger ? hanger.children[0].material : new THREE.MeshStandardMaterial({ color: 0x24221f, roughness: 0.4, metalness: 0.8, transparent: true });
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(accessory ? 0.008 : 0.005, accessory ? 0.008 : 0.005, 1, 6), cableMat);
  cable.visible = false;
  group.add(cable);

  // Soft contact shadow on the floor under the piece (the stage keeps it on the floor).
  const floorMat = new THREE.MeshBasicMaterial({ map: shared.shadowTexture, transparent: true, depthWrite: false, opacity: 0 });
  const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), floorMat);
  floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.scale.set(1.5, 0.75, 1);
  group.add(floorShadow);

  const materials = [frontMat, backMat];
  // stand / cable: whether the plinth or ceiling cable shows (set by the views, not smoothed).
  // cableTo: world height the cable runs up to (the ceiling, or the Shop's ring rail).
  const zero = () => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 0, stand: 0, cable: 0, cableTo: null });
  return {
    product, group, mesh, materials, hanger, floorShadow, floorMat, accessory, stand, cable,
    /** Lowest point / middle of the piece in its own space (for plinths). */
    bottom: box.min.y + mesh.position.y,
    centerX: (box.min.x + box.max.x) / 2,
    /** Where a ceiling cable starts: the hanger hook, or the top of a cap or beanie. */
    cableFrom: hanger ? HOOK_Y : box.max.y + mesh.position.y,
    cur: zero(), tgt: zero(), hover: 0, hoverTgt: 0,
    /** The model is real 3D, so a spin is simply a rotation. */
    setSpin(angle) { return angle; },
    resetSpin() {},
    setOpacity(o) {
      for (const m of materials) { m.opacity = o; m.depthWrite = o > 0.98; }
      cableMat.opacity = o;
    },
    setHover(h) { for (const m of materials) m.emissive.setScalar(h * 0.06); }
  };
}
