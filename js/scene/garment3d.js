/* ==========================================================================
   SLANG STUDIO — 3D garments.
   Each piece is built in the browser from its two photos (front, back) and two
   small depth maps (assets/depth/<id>-<side>.png) made offline by an AI depth
   model (Depth Anything V2). Both shells share one smooth outline (the union of
   the front and mirrored back silhouettes), so they meet at a clean seam:
     - body volume: a rounded profile from the distance to the outline
     - detail: the folds, hood and pocket shape from the depth map
   Edge vertices are snapped onto the smooth outline, so the sides have no grid
   "steps". buildGarmentGeometry returns a BufferGeometry: group 0 = front,
   group 1 = back.
   ========================================================================== */
import * as THREE from "../lib/three.module.min.js";

function pixels(img, w, h) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

/** Chamfer distance (cells) from each cell where src is true to the nearest false cell. */
function chamfer(src, w, h) {
  const INF = 1e9, d = new Float32Array(w * h), b = Math.SQRT2;
  for (let i = 0; i < d.length; i++) d[i] = src[i] ? INF : 0;
  const relax = (i, j, c) => { if (d[j] + c < d[i]) d[i] = d[j] + c; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!d[i]) continue;
    if (x > 0) relax(i, i - 1, 1); else d[i] = Math.min(d[i], 1);
    if (y > 0) { relax(i, i - w, 1); if (x > 0) relax(i, i - w - 1, b); if (x < w - 1) relax(i, i - w + 1, b); } else d[i] = Math.min(d[i], 1);
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; if (!d[i]) continue;
    if (x < w - 1) relax(i, i + 1, 1); else d[i] = Math.min(d[i], 1);
    if (y < h - 1) { relax(i, i + w, 1); if (x < w - 1) relax(i, i + w + 1, b); if (x > 0) relax(i, i + w - 1, b); } else d[i] = Math.min(d[i], 1);
  }
  return d;
}

function blur(f, w, h, passes) {
  let a = f;
  for (let p = 0; p < passes; p++) {
    const o = new Float32Array(a.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        s += a[yy * w + xx]; n++;
      }
      o[y * w + x] = s / n;
    }
    a = o;
  }
  return a;
}

/** Depth detail for one side, with the depth model's overall slope removed. */
function detail(px, GX, GY, mirror, inside) {
  const dep = new Float32Array(GX * GY);
  for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
    const sx = mirror ? GX - 1 - x : x, p = (y * GX + sx) * 4;
    dep[y * GX + x] = px[p + 3] > 127 ? px[p] / 255 : NaN;
  }
  let n = 0, sx = 0, sy = 0, sz = 0, sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0;
  for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
    const Z = dep[y * GX + x]; if (Number.isNaN(Z)) continue;
    const X = x / GX, Y = y / GY;
    n++; sx += X; sy += Y; sz += Z; sxx += X * X; syy += Y * Y; sxy += X * Y; sxz += X * Z; syz += Y * Z;
  }
  const M = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]], v = [sxz, syz, sz];
  const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det3(M), col = (k) => M.map((r, ri) => r.map((c, ci) => (ci === k ? v[ri] : c)));
  const [pa, pb, pc] = [det3(col(0)) / D, det3(col(1)) / D, det3(col(2)) / D];
  const out = new Float32Array(GX * GY);
  for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
    const i = y * GX + x, Z = dep[i];
    out[i] = Number.isNaN(Z) || !inside[i] ? 0 : Z - (pa * x / GX + pb * y / GY + pc);
  }
  return blur(out, GX, GY, 2);
}

export function buildGarmentGeometry(frontDepth, backDepth, opts = {}) {
  const o = { GX: 160, GY: 200, width: 1.28, height: 1.6, thickness: 0.17, relief: 0.08, ...opts };
  const { GX, GY } = o;
  const body = o.bodyCells ?? GX * 0.2, fade = o.fadeCells ?? GX * 0.06;
  const fpx = pixels(frontDepth, GX, GY), bpx = pixels(backDepth, GX, GY);

  // One shared silhouette: front OR mirrored back.
  const inside = new Uint8Array(GX * GY), outside = new Uint8Array(GX * GY);
  for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
    const i = y * GX + x;
    inside[i] = fpx[i * 4 + 3] > 127 || bpx[(y * GX + (GX - 1 - x)) * 4 + 3] > 127 ? 1 : 0;
    outside[i] = 1 - inside[i];
  }
  // Signed distance (cells): + inside, - outside, smoothed so the outline has no steps.
  const dIn = chamfer(inside, GX, GY), dOut = chamfer(outside, GX, GY);
  let sd = new Float32Array(GX * GY);
  for (let i = 0; i < sd.length; i++) sd[i] = inside[i] ? dIn[i] - 0.5 : -(dOut[i] - 0.5);
  sd = blur(sd, GX, GY, 3);

  const det = [detail(fpx, GX, GY, false, inside), detail(bpx, GX, GY, true, inside)];
  const pos = [], uv = [], idx = [[], []];
  const toX = (gx) => (gx / (GX - 1) - 0.5) * o.width, toY = (gy) => (0.5 - gy / (GY - 1)) * o.height;

  for (let side = 0; side < 2; side++) {
    const V = new Int32Array(GX * GY).fill(-1);
    for (let y = 1; y < GY - 1; y++) for (let x = 1; x < GX - 1; x++) {
      const i = y * GX + x, s = sd[i];
      if (s < -1.6) continue;
      let gx = x, gy = y, z = 0;
      if (s <= 0) {
        // Snap onto the smooth outline (s = 0) along the field's gradient.
        const ddx = (sd[i + 1] - sd[i - 1]) / 2, ddy = (sd[i + GX] - sd[i - GX]) / 2, g2 = ddx * ddx + ddy * ddy || 1;
        gx = x - (s * ddx) / g2; gy = y - (s * ddy) / g2;
      } else {
        const t = Math.min(s / body, 1);
        const vol = o.thickness * Math.sqrt(1 - (1 - t) * (1 - t));
        z = Math.max(0.002, vol + det[side][i] * o.relief * Math.min(s / fade, 1));
      }
      V[i] = pos.length / 3;
      pos.push(toX(gx), toY(gy), side === 0 ? z : -z);
      // The steep sides take their colour from a little inside the outline, not
      // from the photo's soft edge pixels (which would smear into grey streaks).
      let ux = gx, uy = gy;
      const inset = o.uvInset ?? 5;
      if (s < inset) {
        const ddx = (sd[i + 1] - sd[i - 1]) / 2, ddy = (sd[i + GX] - sd[i - GX]) / 2, gl = Math.hypot(ddx, ddy) || 1;
        const k = inset - Math.max(s, 0);
        ux += (ddx / gl) * k; uy += (ddy / gl) * k;
      }
      const u = ux / (GX - 1), v = 1 - uy / (GY - 1);
      uv.push(side === 0 ? u : 1 - u, v);
    }
    for (let y = 0; y < GY - 1; y++) for (let x = 0; x < GX - 1; x++) {
      const a = y * GX + x, b = a + 1, c = a + GX, d = c + 1;
      if (V[a] < 0 || V[b] < 0 || V[c] < 0 || V[d] < 0) continue;
      if (!(sd[a] > 0 || sd[b] > 0 || sd[c] > 0 || sd[d] > 0)) continue;
      if (side === 0) idx[0].push(V[a], V[c], V[b], V[b], V[c], V[d]);
      else idx[1].push(V[a], V[b], V[c], V[b], V[d], V[c]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex([...idx[0], ...idx[1]]);
  g.addGroup(0, idx[0].length, 0);
  g.addGroup(idx[0].length, idx[1].length, 1);
  g.computeVertexNormals();
  return g;
}

/** Photo -> texture where every transparent pixel carries the nearest fabric
 *  colour (needed where the front and back outlines differ): a small copy is
 *  grown outward until full, scaled up as a backdrop, the sharp photo on top. */
export function fabricTexture(img, renderer) {
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const sw = 96, sh = Math.round((96 * h) / w), s = document.createElement("canvas");
  s.width = sw; s.height = sh;
  const sctx = s.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(img, 0, 0, sw, sh);
  const sd = sctx.getImageData(0, 0, sw, sh), p = sd.data;
  for (let pass = 0; pass < sw + sh; pass++) {
    const src = new Uint8ClampedArray(p); let empty = 0;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4; if (src[i + 3] > 200) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= sw || yy >= sh) continue;
        const j = (yy * sw + xx) * 4; if (src[j + 3] > 200) { r += src[j]; g += src[j + 1]; b += src[j + 2]; n++; }
      }
      if (n) { p[i] = r / n; p[i + 1] = g / n; p[i + 2] = b / n; p[i + 3] = 255; } else empty++;
    }
    if (!empty) break;
  }
  sctx.putImageData(sd, 0, 0);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high"; ctx.drawImage(s, 0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
