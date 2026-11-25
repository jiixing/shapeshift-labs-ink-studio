// Generated from src/kit/kpx-pixel.ts by npm run build:src. Do not edit.
(function(K) {
  const sculpt0 = K.sculpt;
  const hash = (i, j, k, s) => {
    let h = i * 374761393 + j * 668265263 + k * 1440662683 + s * 1274126177 | 0;
    h = Math.imul(h ^ h >>> 13, 1274126177);
    h ^= h >>> 16;
    h = Math.imul(h, 2246822519);
    h ^= h >>> 13;
    return (h >>> 0) / 4294967296;
  };
  const rnd = (s) => {
    let x = (s >>> 0) * 2654435761 + 1 || 1;
    return () => {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return (x >>> 0) / 4294967296;
    };
  };
  const W3 = [0, 0, 0, 0];
  const worley = (x, y, z, cell, seed) => {
    const gx = x / cell, gy = y / cell, gz = z / cell, ix = Math.floor(gx), iy = Math.floor(gy), iz = Math.floor(gz);
    let best = 1e9, bx = 0, by = 0, bz = 0;
    for (let k = -1; k <= 1; k++)
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) {
          const a = ix + i, b = iy + j, c = iz + k, px = a + 0.15 + 0.7 * hash(a, b, c, seed), py = b + 0.15 + 0.7 * hash(a, b, c, seed + 1), pz = c + 0.15 + 0.7 * hash(a, b, c, seed + 2), d = (px - gx) ** 2 + (py - gy) ** 2 + (pz - gz) ** 2;
          if (d < best) best = d, bx = px, by = py, bz = pz;
        }
    W3[0] = Math.sqrt(best);
    W3[1] = bx * cell;
    W3[2] = by * cell;
    W3[3] = bz * cell;
    return W3;
  };
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const fib = (i, n) => {
    const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.399963;
    return [r * Math.cos(a), y, r * Math.sin(a)];
  };
  const skin = (rx, ry, rz) => (res, f) => {
    const n = Math.ceil(
      1.3 * 4 * Math.PI * Math.pow((Math.pow(rx * ry, 1.6) + Math.pow(rx * rz, 1.6) + Math.pow(ry * rz, 1.6)) / 3, 0.625) / (res * res)
    );
    for (let i = 0; i < n; i++) {
      const d = fib(i, n);
      f(d[0] * rx, d[1] * ry, d[2] * rz);
    }
  };
  const ellipsoid = (x, y, z, rx, ry, rz) => {
    const k0 = Math.hypot(x / rx, y / ry, z / rz), k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
    return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
  };
  const level = (px0, fp) => fp ? px0 * Math.pow(2, Math.round(Math.log2(fp / px0))) : px0;
  const band = (ramp, t) => Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)));
  const step = (ramp, b, d) => ramp[Math.max(0, Math.min(ramp.length - 1, b + d))];
  K.pixel = { worley: (x, y, z, cell, seed) => worley(x, y, z, cell, seed || 1).slice() };
  const spec = (kind, o) => ({
    kind,
    o: JSON.parse(JSON.stringify(o, (k, v) => typeof v === "function" || k === "px" || k === "fl" ? void 0 : v))
  });
  K.pixel.gpu = (W) => {
    const kinds = new Float32Array(32), params = new Float32Array(32 * 16), ramps = new Float32Array(64 * 8), lens = new Float32Array(64);
    (W.ramps || []).slice(0, 64).forEach((r, k) => {
      lens[k] = Math.min(8, r.length) + ((W.rampOff || [])[k] ? 16 : 0);
      for (let i = 0; i < Math.min(8, r.length); i++) ramps[k * 8 + i] = r[i];
    });
    (W.pats || []).slice(0, 32).forEach((pt, k) => {
      const o = pt.o, q = params.subarray(k * 16, k * 16 + 16);
      if (pt.kind === "masonry") {
        kinds[k] = 1;
        q.set([
          o.stone ? o.stone[0] : 9,
          o.stone ? o.stone[1] : 5,
          o.joint === void 0 ? 2 : o.joint,
          o.vary === void 0 ? 0.25 : o.vary,
          o.seed || 7
        ]);
      } else if (pt.kind === "planks") {
        kinds[k] = 2;
        q.set([o.width || 5, o.along === "z" ? 1 : o.along === "y" ? 2 : 0, 0, 0, o.seed || 11]);
      } else if (pt.kind === "tiles") {
        kinds[k] = 3;
        q.set([o.tile ? o.tile[0] : 5, o.tile ? o.tile[1] : 4, 0, 0, o.seed || 13]);
      } else if (pt.kind === "turf") {
        kinds[k] = 7;
        const fl = (o.flowers || []).slice(0, 2);
        q.set([
          o.clump || 6,
          o.tufts === void 0 ? 0.7 : o.tufts,
          o.patch || 1.6,
          fl.length,
          o.seed || 23,
          o.clumps || 0,
          o.base || 0,
          o.wind === void 0 ? 1 : o.wind
        ]);
        fl.forEach((f, i) => q.set([f[0], f[1], f[2] === void 0 ? f[0] : f[2]], 8 + i * 3));
      } else if (pt.kind === "water") {
        kinds[k] = 8;
        q.set([o.ripple || 7, o.ripples === void 0 ? 0.35 : o.ripples, o.twinkle || 0.6, 0, o.seed || 19]);
      } else if (pt.kind === "needles") {
        kinds[k] = 9;
        q.set([(o.tier || 0) + 1, o.marks === void 0 ? 0.45 : o.marks, o.mark || 4, 0, o.seed || 37]);
      } else if (pt.kind === "rock") {
        kinds[k] = 10;
        q.set([o.mark || 5, o.marks === void 0 ? 0.3 : o.marks, 0, 0, o.seed || 41]);
      } else if (pt.kind === "thatch") {
        kinds[k] = 6;
        q.set([o.course || 5, o.bundle || 2, o.droop === void 0 ? 2 : o.droop, 0, o.seed || 31]);
      } else if (pt.kind === "leaves") {
        kinds[k] = 5;
        q.set([
          o.cluster || 6,
          o.mix === void 0 ? 0.55 : o.mix,
          o.sunK === void 0 ? 0.6 : o.sunK,
          o.marks === void 0 ? 0.3 : o.marks,
          o.seed || 29,
          o.sun[0],
          o.sun[1],
          o.sun[2],
          o.mark || 4
        ]);
      } else if (pt.kind === "lawn") {
        kinds[k] = 4;
        const fl = (o.flowers || []).slice(0, 3);
        q.set([o.tufts === void 0 ? 0.22 : o.tufts, o.cell || 6, o.patch || 1.6, fl.length, o.seed || 17]);
        fl.forEach((f, i) => q.set([f[0], f[1], f[2] === void 0 ? f[0] : f[2]], 5 + i * 3));
      }
    });
    return { kinds, params, ramps, lens };
  };
  const leafSpecs = /* @__PURE__ */ new Map();
  K.pixel.leafSpec = (o) => {
    const L = norm(o.sun || [0.4, 0.8, 0.4]), q = {
      cluster: o.cluster || 6,
      mix: o.mix === void 0 ? 0.55 : o.mix,
      sunK: o.sunK === void 0 ? 0.6 : o.sunK,
      sun: L,
      seed: o.seed || 29
    }, key = JSON.stringify(q);
    if (!leafSpecs.has(key)) leafSpecs.set(key, { kind: "leaves", o: q });
    return leafSpecs.get(key);
  };
  const withEdges = /* @__PURE__ */ new Map();
  K.pixel.withEdge = (spec2, mp) => {
    const edge = mp && mp.edge;
    if (!edge) return spec2;
    if (!withEdges.has(spec2)) withEdges.set(spec2, /* @__PURE__ */ new Map());
    const m = withEdges.get(spec2);
    if (!m.has(edge)) m.set(edge, Object.assign({}, spec2, { edge }));
    return m.get(edge);
  };
  const needleSpecs = /* @__PURE__ */ new Map();
  K.pixel.needlesSpec = (o) => {
    const q = { tier: (o.tier || 0) % 8, seed: o.seed || 37 }, key = JSON.stringify(q);
    if (!needleSpecs.has(key)) needleSpecs.set(key, { kind: "needles", o: q });
    return needleSpecs.get(key);
  };
  K.pixel.leaves = (o) => {
    const px = () => o.px || K.pixel.px || 0.08, L = norm(o.sun || [0.4, 0.8, 0.4]), seed = o.seed || 29, mix = o.mix === void 0 ? 0.55 : o.mix, marks = o.marks === void 0 ? 0.3 : o.marks, sk = o.sunK === void 0 ? 0.6 : o.sunK;
    const cellAt = (x, y, z, ny, t, nx, nz, AA, fp, ramp, form) => {
      if (form) nx = form[0], ny = form[1], nz = form[2];
      const r = ramp || o.r, p = level(px(), fp), cell = (o.cluster || 6) * p, w = worley(x, y, z, cell, seed), a = Math.floor(w[1] / cell), b = Math.floor(w[2] / cell), c = Math.floor(w[3] / cell), d = norm([x - w[1], y - w[2], z - w[3]]), nc = norm([nx * (1 - mix) + d[0] * mix, ny * (1 - mix) + d[1] * mix, nz * (1 - mix) + d[2] * mix]), t2 = t + sk * (Math.max(0, nc[0] * L[0] + nc[1] * L[1] + nc[2] * L[2]) - Math.max(0, nx * L[0] + ny * L[1] + nz * L[2])), b2 = band(r, t2);
      let body = step(r, b2, 0);
      if (VIEW.on && marks > 0) {
        let best = -9, col = -1;
        const [nL, nF] = nestL(p), mc = (o.mark || 4) * p * 2 ** nL, mA = (o.mark || 4) * p * 2 ** LMIN, gx = Math.floor(x / mc), gy = Math.floor(y / mc), gz = Math.floor(z / mc), half = r.length / 2;
        for (let k = -1; k <= 1; k++)
          for (let j = -1; j <= 1; j++)
            for (let i = -1; i <= 1; i++) {
              if (!shown3(gx + i, gy + j, gz + k, nL, nF, seed)) continue;
              const [A, Bq, Cq] = atom3(gx + i, gy + j, gz + k, nL, seed);
              if (hash(A, Bq, Cq, seed + 5) > marks) continue;
              const qx = (A + 0.15 + 0.7 * hash(A, Bq, Cq, seed)) * mA, qy = (Bq + 0.15 + 0.7 * hash(A, Bq, Cq, seed + 1)) * mA, qz = (Cq + 0.15 + 0.7 * hash(A, Bq, Cq, seed + 2)) * mA;
              if ((qx - x) ** 2 + (qy - y) ** 2 + (qz - z) ** 2 > mc * mc * 1.5) continue;
              toScreen(qx, qy, qz, scr);
              const ox = Math.round(VIEW.x - scr[0]), oy = Math.round(VIEW.y - scr[1]);
              if (Math.abs(ox) > 2 || oy < 0 || oy > 2 || oy <= best) continue;
              const m = LEAFM[Math.floor(hash(A, Bq, Cq, seed + 6) * LEAFM.length) % LEAFM.length];
              if (!(m >> oy * 5 + ox + 2 & 1)) continue;
              best = oy;
              col = step(r, b2, b2 >= half ? -1 : 1);
            }
        if (col >= 0) body = col;
      }
      CELL.body = CELL.below = CELL.above = CELL.left = body;
      return (a + 5e4) * 1e10 + (b + 5e4) * 1e5 + (c + 5e4);
    };
    return Object.assign({}, o, {
      pat: { kind: "leaves", o },
      cellAt,
      tex: (x, y, z, ny, t, nx, nz, AA, fp, ramp, form) => (cellAt(x, y, z, ny, t, nx, nz, AA, fp, ramp, form), CELL.body)
    });
  };
  K.pixel.unfold = (a, b) => {
    if (a > 8) return null;
    let x = a, z = b;
    const y = 1 - Math.abs(a) - Math.abs(b);
    if (y < 0) {
      x = (1 - Math.abs(b)) * (a >= 0 ? 1 : -1);
      z = (1 - Math.abs(a)) * (b >= 0 ? 1 : -1);
    }
    return norm([x, y, z]);
  };
  const mergeKey = (kind, k, m) => {
    if (m <= 0) return k;
    const sh = (v, n) => Math.floor(v / 2 ** n);
    if (kind === "masonry") return [k[0], sh(k[1], Math.max(0, m - 1)), sh(k[2], m + 1)];
    if (kind === "planks" || kind === "tiles") return [sh(k[0], Math.max(0, m - 1)), sh(k[1], m), k[2]];
    if (kind === "thatch") return [sh(k[0], m), k[1], k[2]];
    return k;
  };
  const pinned = (px0, f, isCell, kind) => (x, y, z, ny, t, nx, nz, AA, fp, ramp, form) => {
    VIEW.fp = fp;
    CELL.kc = null;
    const r = f(x, y, z, ny, t, nx, nz, AA, px0, ramp, form);
    if (!isCell || r !== r || !CELL.kc || !(fp > px0)) return r;
    const lam = Math.min(Math.log2(fp / px0), 3.99), m = Math.floor(lam), kn = mergeKey(kind, CELL.kc, m + 1), kk = hash(kn[0], kn[1], kn[2], 4099) < lam - m ? kn : mergeKey(kind, CELL.kc, m);
    return ((kk[0] + 5e4) * 1e5 + (kk[1] + 5e4)) * 1e5 + (kk[2] + 5e4);
  };
  K.pixel.evaluators = (W) => (W.pats || []).map((p) => {
    const px0 = 1 / (W.detail || 12), m = K.pixel[p.kind](Object.assign({}, p.o, { px: px0 }));
    return {
      tex: pinned(px0, m.tex, false, p.kind),
      cell: typeof m.cellAt === "function" ? pinned(px0, m.cellAt, true, p.kind) : null
    };
  });
  const uvOf = (x, y, z, nx, ny, nz) => Math.abs(ny) > 0.7 ? [x, z, 0] : Math.abs(nx) > Math.abs(nz) ? [z * Math.sign(nx || 1), y, 1] : [-x * Math.sign(nz || 1), y, 2];
  const CELL = { body: 0, below: 0, above: 0, left: 0 };
  K.pixel.CELL = CELL;
  K.pixel.masonry = (o) => {
    const px = () => o.px || K.pixel.px || 0.08, seed = o.seed || 7, joint = o.joint === void 0 ? 2 : o.joint, vary = o.vary === void 0 ? 0.25 : o.vary;
    return Object.assign({}, o, {
      pat: spec("masonry", o),
      r: o.r,
      tex(x, y, z, ny, t, nx, nz, AA, fp) {
        const p = level(px(), fp), sl = (o.stone ? o.stone[0] : 9) * p, sh = (o.stone ? o.stone[1] : 5) * p, [u, v, face] = uvOf(x, y, z, nx, ny, nz), row = Math.floor(v / sh), off = row % 2 * 0.5 * sl + hash(row, face, 0, seed) * sl * 0.3, slot = Math.floor((u + off) / sl), su = u + off - slot * sl, fv = v - row * sh, b = band(o.r, t);
        const keepJ = hash(slot, row, face, seed + 7) > 0.28, half = hash(slot, row, face, seed + 9) > 0.86, col = keepJ ? slot * 2 + (half && su > sl / 2 ? 1 : 0) : (slot - 1) * 2 + 1, fu = half && su > sl / 2 ? su - sl / 2 : su;
        if (fv < p * 0.95 || fu < p * 0.95 && (keepJ || half && su > sl / 2)) return step(o.r, b, -joint);
        let d = 0;
        const hv = hash(col, row, face, seed + 3);
        if (hv < vary * 0.6) d = -1;
        else if (hv > 1 - vary * 0.4) d = 1;
        if (fv > sh - p * 1.05 && b < o.r.length - 1) d += 1;
        return step(o.r, b, d);
      },
      cellAt(x, y, z, ny, t, nx, nz, AA, fp) {
        const p = level(px(), fp), sl = (o.stone ? o.stone[0] : 9) * p, sh = (o.stone ? o.stone[1] : 5) * p, [u, v, face] = uvOf(x, y, z, nx, ny, nz), row = Math.floor(v / sh), off = row % 2 * 0.5 * sl + hash(row, face, 0, seed) * sl * 0.3, slot = Math.floor((u + off) / sl), su = u + off - slot * sl, b = band(o.r, t), keepJ = (s2) => hash(s2, row, face, seed + 7) > 0.28, half = (s2) => hash(s2, row, face, seed + 9) > 0.86, last = (s2, k) => half(s2) ? s2 * 2 + 1 : keepJ(s2) || k > 2 ? s2 * 2 : last(s2 - 1, k + 1), col = half(slot) && su > sl / 2 ? slot * 2 + 1 : keepJ(slot) ? slot * 2 : last(slot - 1, 0), hv = hash(col, row, face, seed + 3), d = hv < vary * 0.6 ? -1 : hv > 1 - vary * 0.4 ? 1 : 0;
        CELL.body = step(o.r, b, d);
        CELL.below = CELL.left = step(o.r, b, -joint);
        CELL.above = step(o.r, b, d + (b < o.r.length - 1 ? 1 : 0));
        CELL.kc = [face, row, col];
        return face * 1e9 + (row + 5e4) * 1e5 + (col + 5e4);
      }
    });
  };
  K.pixel.planks = (o) => {
    const px = () => o.px || K.pixel.px || 0.08, seed = o.seed || 11, ax = o.along || "x";
    return Object.assign({}, o, {
      pat: spec("planks", o),
      r: o.r,
      tex(x, y, z, ny, t, nx, nz, AA, fp) {
        const p = level(px(), fp), w = (o.width || 5) * p, a = ax === "x" ? x : ax === "z" ? z : y, c = ax === "y" ? Math.abs(nx) > Math.abs(nz) ? z : x : Math.abs(ny) > 0.7 ? ax === "x" ? z : x : y, k0 = Math.floor(c / w), wide = hash(k0, 9, 0, seed) < 0.3, k = wide && k0 % 2 ? k0 - 1 : k0, f = c - k0 * w, b = band(o.r, t);
        if (f < p * 0.95 && !(wide && k0 % 2)) return step(o.r, b, -2);
        const len = (6 + 10 * hash(k, 0, 0, seed)) * p * 4, e = a + hash(k, 1, 0, seed) * len, fe = e - Math.floor(e / len) * len;
        if (fe < p * 0.95) return step(o.r, b, -2);
        if (Math.abs(f - w * (0.3 + 0.4 * hash(k, 2, Math.floor(e / len), seed))) < p * 0.5 && hash(k, Math.floor(a / (p * 3)), 3, seed) < 0.5)
          return step(o.r, b, -1);
        return step(o.r, b, hash(k, Math.floor(e / len), 4, seed) < 0.2 ? -1 : 0);
      },
      cellAt(x, y, z, ny, t, nx, nz, AA, fp) {
        const p = level(px(), fp), w = (o.width || 5) * p, a = ax === "x" ? x : ax === "z" ? z : y, c = ax === "y" ? Math.abs(nx) > Math.abs(nz) ? z : x : Math.abs(ny) > 0.7 ? ax === "x" ? z : x : y, k0 = Math.floor(c / w), wide = hash(k0, 9, 0, seed) < 0.3, k = wide && k0 % 2 ? k0 - 1 : k0, len = (6 + 10 * hash(k, 0, 0, seed)) * p * 4, e = a + hash(k, 1, 0, seed) * len, seg = Math.floor(e / len), b = band(o.r, t);
        CELL.body = step(o.r, b, hash(k, seg, 4, seed) < 0.2 ? -1 : 0);
        CELL.below = CELL.left = step(o.r, b, -2);
        CELL.above = CELL.body;
        CELL.kc = [k, seg, 0];
        return (k + 5e4) * 1e5 + (seg + 5e4);
      }
    });
  };
  K.pixel.tiles = (o) => {
    const px = () => o.px || K.pixel.px || 0.08, seed = o.seed || 13;
    return Object.assign({}, o, {
      pat: spec("tiles", o),
      r: o.r,
      tex(x, y, z, ny, t, nx, nz, AA, fp) {
        const p = level(px(), fp), tw = (o.tile ? o.tile[0] : 5) * p, th = (o.tile ? o.tile[1] : 4) * p, u = Math.abs(nx) > Math.abs(nz) ? z : x, v = y, row = Math.floor(v / th), off = row % 2 * 0.5 * tw, col = Math.floor((u + off) / tw), fu = u + off - col * tw, sag = hash(col, row, 1, seed) < 0.18 ? p : 0, fv = v - row * th + sag, b = band(o.r, t);
        if (fv < p * 0.95) return step(o.r, b, -2);
        if (fv < p * 1.95) return step(o.r, b, 1);
        if (fu < p * 0.95) return step(o.r, b, -1);
        return step(o.r, b, hash(col, row, 0, seed) < 0.08 ? -1 : 0);
      },
      cellAt(x, y, z, ny, t, nx, nz, AA, fp) {
        const p = level(px(), fp), tw = (o.tile ? o.tile[0] : 5) * p, th = (o.tile ? o.tile[1] : 4) * p, u = Math.abs(nx) > Math.abs(nz) ? z : x, row = Math.floor(y / th), off = row % 2 * 0.5 * tw, col = Math.floor((u + off) / tw), b = band(o.r, t);
        CELL.body = step(o.r, b, hash(col, row, 0, seed) < 0.08 ? -1 : 0);
        CELL.below = step(o.r, b, 1);
        CELL.above = step(o.r, b, -2);
        CELL.left = y - row * th < th * (o.notch === void 0 ? 0.5 : o.notch) ? step(o.r, b, -1) : CELL.body;
        CELL.kc = [row, col, 1];
        return (row + 5e4) * 1e5 + (col + 5e4);
      }
    });
  };
  K.pixel.thatch = (o) => {
    const px = () => o.px || K.pixel.px || 0.08, seed = o.seed || 31, droop = o.droop === void 0 ? 2 : o.droop;
    const at = (x, y, z, nx, nz, fp) => {
      const p = level(px(), fp), ch = (o.course || 5) * p, bw = (o.bundle || 2) * p, u = Math.abs(nx) > Math.abs(nz) ? z : x, bundle = (r) => {
        const c = Math.floor((u + hash(r, 0, 2, seed) * bw) / bw);
        return [c, Math.floor(hash(c, r, 1, seed) * (droop + 0.999)) * p];
      };
      let row = Math.floor(y / ch);
      let [col, sag] = bundle(row + 1);
      const f = y - row * ch;
      if (f >= ch - sag) row++;
      else [col, sag] = bundle(row);
      return { row, col, p, top: (row + 1) * ch - bundle(row + 1)[1] - y, foot: y - (row * ch - sag) };
    };
    const shade = (row, col) => {
      const h = hash(col, row, 3, seed);
      return h < 0.28 ? -1 : h > 0.82 ? 1 : 0;
    };
    return Object.assign({}, o, {
      pat: spec("thatch", o),
      r: o.r,
      tex(x, y, z, ny, t, nx, nz, AA, fp) {
        const c = at(x, y, z, nx, nz, fp), b = band(o.r, t);
        if (c.foot < c.p * 0.95) return step(o.r, b, 1);
        if (c.top < c.p * 0.95) return step(o.r, b, -2);
        return step(o.r, b, shade(c.row, c.col));
      },
      cellAt(x, y, z, ny, t, nx, nz, AA, fp) {
        const c = at(x, y, z, nx, nz, fp), b = band(o.r, t);
        CELL.body = step(o.r, b, shade(c.row, c.col));
        CELL.below = step(o.r, b, 1);
        CELL.above = step(o.r, b, -2);
        CELL.left = step(o.r, b, -1);
        CELL.kc = [c.row, 0, 6];
        return c.row + 5e4;
      }
    });
  };
  K.pixel.grade = (pal, o = {}) => {
    const cool = o.cool === void 0 ? 0.3 : o.cool, warm = o.warm === void 0 ? 0.22 : o.warm, hc = o.hueCool === void 0 ? 250 : o.hueCool, hw = o.hueWarm === void 0 ? 52 : o.hueWarm, sat = o.sat === void 0 ? 0.15 : o.sat, con = o.contrast === void 0 ? 1.08 : o.contrast, keep = new Set(o.keep || []);
    const toward = (h, t, k) => {
      const d = (t - h + 540) % 360 - 180;
      return (h + d * k + 360) % 360;
    };
    return pal.map((c, i) => {
      if (keep.has(i)) return c;
      const r = (c >> 16 & 255) / 255, g = (c >> 8 & 255) / 255, b = (c & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      let l = (mx + mn) / 2, sv = mx === mn ? 0 : l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn), h = mx === mn ? 0 : mx === r ? ((g - b) / (mx - mn) + 6) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
      h *= 60;
      const y = 0.3 * r + 0.59 * g + 0.11 * b, ws = Math.max(0, Math.min(1, (0.55 - y) / 0.45)), wl = Math.max(0, Math.min(1, (y - 0.5) / 0.45));
      if (sv < 0.08) {
        h = ws > wl ? hc : hw;
        sv = Math.max(sv, 0.1 * Math.max(ws, wl));
      } else h = toward(toward(h, hc, cool * ws), hw, warm * wl);
      sv = Math.min(1, sv * (1 + sat * (1 - Math.abs(2 * l - 1))));
      l = Math.max(0, Math.min(1, 0.5 + (l - 0.5) * con));
      const q = l < 0.5 ? l * (1 + sv) : l + sv - l * sv, pp = 2 * l - q, f = (t) => {
        t = (t + 1) % 1;
        return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp;
      }, hh = h / 360, to = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255);
      return to(f(hh + 1 / 3)) << 16 | to(f(hh)) << 8 | to(f(hh - 1 / 3));
    });
  };
  const LMIN = -2;
  const shown2 = (cx, cz, L, f, seed) => {
    const px2 = Math.floor(cx / 2), pz2 = Math.floor(cz / 2), ch = Math.floor(hash(px2, pz2, 21 + L, seed) * 4);
    return cx - px2 * 2 === (ch & 1) && cz - pz2 * 2 === ch >> 1 || hash(cx, cz, 41 + L, seed) >= f;
  };
  const atom2 = (cx, cz, L, seed) => {
    for (let l = L; l > LMIN; l--) {
      const ch = Math.floor(hash(cx, cz, 20 + l, seed) * 4);
      cx = cx * 2 + (ch & 1);
      cz = cz * 2 + (ch >> 1);
    }
    return [cx, cz];
  };
  const shown3 = (cx, cy, cz, L, f, seed) => {
    const a = Math.floor(cx / 2), b = Math.floor(cy / 2), c = Math.floor(cz / 2), ch = Math.floor(hash(a + 7 * c, b, 21 + L, seed) * 8);
    return cx - a * 2 === (ch & 1) && cy - b * 2 === (ch >> 1 & 1) && cz - c * 2 === ch >> 2 || hash(cx + 7 * cz, cy, 41 + L, seed) >= f;
  };
  const atom3 = (cx, cy, cz, L, seed) => {
    for (let l = L; l > LMIN; l--) {
      const ch = Math.floor(hash(cx + 7 * cz, cy, 20 + l, seed) * 8);
      cx = cx * 2 + (ch & 1);
      cy = cy * 2 + (ch >> 1 & 1);
      cz = cz * 2 + (ch >> 2);
    }
    return [cx, cy, cz];
  };
  const nestL = (p) => {
    const lam = Math.max(LMIN, Math.min(4, Math.log2(Math.max(VIEW.fp || p, 1e-6) / p))), L = Math.floor(lam);
    return [L, lam - L];
  };
  K.pixel.nest = { shown2, atom2, shown3, atom3, nestL, LMIN };
  const VIEW = {
    on: false,
    fp: 0,
    ortho: false,
    oh: 1,
    t: 0,
    x: 0,
    y: 0,
    R: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    e: [0, 0, 0],
    tp: 1,
    asp: 1,
    W: 1,
    H: 1
  };
  K.pixel.VIEW = VIEW;
  const toScreen = (x, y, z, out) => {
    const R = VIEW.R, dx = x - VIEW.e[0], dy = y - VIEW.e[1], dz = z - VIEW.e[2], cb = -(R[6] * dx + R[7] * dy + R[8] * dz) || 1e-6;
    if (VIEW.ortho) {
      out[0] = ((R[0] * dx + R[1] * dy + R[2] * dz) / (VIEW.oh * VIEW.asp) + 1) * 0.5 * VIEW.W - 0.5;
      out[1] = ((R[3] * dx + R[4] * dy + R[5] * dz) / VIEW.oh + 1) * 0.5 * VIEW.H - 0.5;
      return out;
    }
    out[0] = ((R[0] * dx + R[1] * dy + R[2] * dz) / cb * (VIEW.tp / VIEW.asp) + 1) * 0.5 * VIEW.W - 0.5;
    out[1] = ((R[3] * dx + R[4] * dy + R[5] * dz) / cb * VIEW.tp + 1) * 0.5 * VIEW.H - 0.5;
    return out;
  };
  const TUFTS = [17732, 4782, 324, 11118, 2700, 8524], FLOWER = 4548, scr = [0, 0];
  K.pixel.TUFTS = TUFTS;
  const CLUMPS = [42975166, 17211164, 38797084, 9150366];
  K.pixel.CLUMPS = CLUMPS;
  const NEEDLES = [21956, 3268, 24964, 10368];
  K.pixel.NEEDLES = NEEDLES;
  const CRACKS = [1100, 4289, 368, 192];
  K.pixel.CRACKS = CRACKS;
  K.pixel.rock = (o) => {
    const px = () => o.px || K.pixel.px || 0.08, seed = o.seed || 41, marks = o.marks === void 0 ? 0.3 : o.marks;
    const cellAt = (x, y, z, ny, t, nx, nz, AA, fp, ramp) => {
      const r = ramp || o.r, p = level(px(), fp), b = band(r, t);
      let body = step(r, b, 0);
      if (VIEW.on && marks > 0) {
        const [nL, nF] = nestL(p), mc = (o.mark || 5) * p * 2 ** nL, mA = (o.mark || 5) * p * 2 ** LMIN, gx = Math.floor(x / mc), gy = Math.floor(y / mc), gz = Math.floor(z / mc);
        let best = -9;
        for (let k = -1; k <= 1; k++)
          for (let j = -1; j <= 1; j++)
            for (let i = -1; i <= 1; i++) {
              if (!shown3(gx + i, gy + j, gz + k, nL, nF, seed)) continue;
              const [A, Bq, Cq] = atom3(gx + i, gy + j, gz + k, nL, seed);
              if (hash(A, Bq, Cq, seed + 5) > marks) continue;
              const qx = (A + 0.15 + 0.7 * hash(A, Bq, Cq, seed)) * mA, qy = (Bq + 0.15 + 0.7 * hash(A, Bq, Cq, seed + 1)) * mA, qz = (Cq + 0.15 + 0.7 * hash(A, Bq, Cq, seed + 2)) * mA;
              if ((qx - x) ** 2 + (qy - y) ** 2 + (qz - z) ** 2 > mc * mc * 1.5) continue;
              toScreen(qx, qy, qz, scr);
              const ox = Math.round(VIEW.x - scr[0]), oy = Math.round(VIEW.y - scr[1]);
              if (Math.abs(ox) > 2 || oy < 0 || oy > 2 || oy <= best) continue;
              const mi = Math.floor(hash(A, Bq, Cq, seed + 6) * CRACKS.length) % CRACKS.length;
              if (!(CRACKS[mi] >> oy * 5 + ox + 2 & 1)) continue;
              best = oy;
              body = step(r, b, mi === 3 ? 1 : -2);
            }
      }
      CELL.body = CELL.below = CELL.above = CELL.left = body;
      return NaN;
    };
    return Object.assign({}, o, {
      pat: spec("rock", o),
      r: o.r,
      cellAt,
      tex: (x, y, z, ny, t, nx, nz, AA, fp, ramp) => (cellAt(x, y, z, ny, t, nx, nz, AA, fp, ramp), CELL.body)
    });
  };
  K.pixel.needles = (o) => {
    const px = () => o.px || K.pixel.px || 0.08, seed = o.seed || 37, marks = o.marks === void 0 ? 0.45 : o.marks;
    const cellAt = (x, y, z, ny, t, nx, nz, AA, fp, ramp) => {
      const r = ramp || o.r, p = level(px(), fp), b = band(r, t);
      let body = step(r, b, 0);
      if (VIEW.on && marks > 0) {
        const [nL, nF] = nestL(p), mc = (o.mark || 4) * p * 2 ** nL, mA = (o.mark || 4) * p * 2 ** LMIN, gx = Math.floor(x / mc), gy = Math.floor(y / mc), gz = Math.floor(z / mc);
        let best = -9;
        for (let k = -1; k <= 1; k++)
          for (let j = -1; j <= 1; j++)
            for (let i = -1; i <= 1; i++) {
              if (!shown3(gx + i, gy + j, gz + k, nL, nF, seed)) continue;
              const [A, Bq, Cq] = atom3(gx + i, gy + j, gz + k, nL, seed);
              if (hash(A, Bq, Cq, seed + 5) > marks) continue;
              const qx = (A + 0.15 + 0.7 * hash(A, Bq, Cq, seed)) * mA, qy = (Bq + 0.15 + 0.7 * hash(A, Bq, Cq, seed + 1)) * mA, qz = (Cq + 0.15 + 0.7 * hash(A, Bq, Cq, seed + 2)) * mA;
              if ((qx - x) ** 2 + (qy - y) ** 2 + (qz - z) ** 2 > mc * mc * 1.5) continue;
              toScreen(qx, qy, qz, scr);
              const ox = Math.round(VIEW.x - scr[0]), oy = Math.round(VIEW.y - scr[1]);
              if (Math.abs(ox) > 2 || oy < 0 || oy > 2 || oy <= best) continue;
              const m = NEEDLES[Math.floor(hash(A, Bq, Cq, seed + 6) * NEEDLES.length) % NEEDLES.length];
              if (!(m >> oy * 5 + ox + 2 & 1)) continue;
              best = oy;
              body = step(r, b, b >= r.length - 1 ? -1 : 1);
            }
      }
      CELL.body = CELL.below = CELL.left = body;
      CELL.above = step(r, b, -2);
      return (o.tier || 0) + 1;
    };
    return Object.assign({}, o, {
      pat: spec("needles", o),
      r: o.r,
      cellAt,
      tex: (x, y, z, ny, t, nx, nz, AA, fp, ramp) => (cellAt(x, y, z, ny, t, nx, nz, AA, fp, ramp), CELL.body)
    });
  };
  const LEAFM = [2274, 4812, 10692, 5312];
  K.pixel.LEAFM = LEAFM;
  const RIPPLES = [14, 108, 7, 22];
  K.pixel.RIPPLES = RIPPLES;
  K.pixel.turf = (o) => {
    const px = () => o.px || K.pixel.px || 0.08, seed = o.seed || 23, dens = o.tufts === void 0 ? 0.7 : o.tufts, clumps = o.clumps || 0, base = o.base || 0, wind = o.wind === void 0 ? 1 : o.wind, ps = o.patch || 1.6, flowers = (o.flowers || []).slice(0, 2);
    const cellAt = (x, y, z, ny, t, nx, nz, AA, fp, ramp) => {
      const r = ramp || o.r, p = level(px(), fp), pn = Math.sin(x / ps + 1.3 * Math.sin(z / (ps * 1.7))) * Math.sin(z / ps + 0.9 * Math.sin(x / (ps * 1.3))), b = Math.max(0, band(r, t) - (pn > 0.55 ? 1 : 0) + base), [nL, nF] = nestL(p), cell = (o.clump || 6) * p * 2 ** nL, cA = (o.clump || 6) * p * 2 ** LMIN, ix = Math.floor(x / cell), iz = Math.floor(z / cell);
      let body = step(r, b, 0);
      if (VIEW.on && ny >= 0.5) {
        const d = b <= r.length - 2 ? 1 : -1;
        let best = -9, col = -1, shade = false;
        for (let k = -1; k <= 1; k++)
          for (let i = -1; i <= 1; i++) {
            if (!shown2(ix + i, iz + k, nL, nF, seed)) continue;
            const [a, c] = atom2(ix + i, iz + k, nL, seed), h = hash(a, c, 4, seed);
            if (h > dens) continue;
            const qx = (a + 0.15 + 0.7 * hash(a, c, 0, seed)) * cA, qz = (c + 0.15 + 0.7 * hash(a, c, 1, seed)) * cA;
            toScreen(qx, y, qz, scr);
            const oy = Math.round(VIEW.y - scr[1]), lean = wind && oy >= 2 && Math.sin(VIEW.t * 1.5 - (qx * 0.8 + qz * 0.6) * 3) > 0.5 ? 1 : 0, ox = Math.round(VIEW.x - scr[0]) - lean;
            if (hash(a, c, 8, seed) < clumps) {
              if (oy === -1 && Math.abs(ox) <= 2) shade = true;
              if (Math.abs(ox) > 3 || oy < 0 || oy > 3 || oy <= best) continue;
              const m2 = CLUMPS[Math.floor(hash(a, c, 6, seed) * CLUMPS.length) % CLUMPS.length], bit = oy * 7 + ox + 3;
              if (!(m2 >> bit & 1)) continue;
              best = oy;
              col = step(r, b, d > 0 ? oy === 3 || !(m2 >> bit + 7 & 1) ? 2 : 1 : d);
              continue;
            }
            if (oy === -1 && Math.abs(ox) <= 1) shade = true;
            if (Math.abs(ox) > 2 || oy < 0 || oy > 2 || oy <= best) continue;
            const hf = hash(a, c, 5, seed);
            let f = 0, fl = null;
            for (const q of flowers)
              if (hf < (f += q[1])) {
                fl = q;
                break;
              }
            const m = fl ? FLOWER : TUFTS[Math.floor(hash(a, c, 6, seed) * TUFTS.length) % TUFTS.length];
            if (!(m >> oy * 5 + ox + 2 & 1)) continue;
            best = oy;
            col = fl ? ox === 0 && oy === 1 ? fl[2] === void 0 ? fl[0] : fl[2] : fl[0] : step(r, b, oy === 2 && d > 0 ? 2 : d);
          }
        if (col >= 0) body = col;
        else if (shade) body = step(r, b, -1);
      }
      CELL.body = CELL.below = CELL.above = CELL.left = body;
      return NaN;
    };
    return Object.assign({}, o, {
      pat: spec("turf", o),
      r: o.r,
      cellAt,
      tex: (x, y, z, ny, t, nx, nz, AA, fp, ramp) => (cellAt(x, y, z, ny, t, nx, nz, AA, fp, ramp), CELL.body)
    });
  };
  K.pixel.lawn = (o) => {
    const px = () => o.px || K.pixel.px || 0.08, seed = o.seed || 17, share = o.tufts === void 0 ? 0.22 : o.tufts, flowers = o.flowers || [];
    return Object.assign({}, o, {
      pat: spec("lawn", o),
      r: o.r,
      tex(x, y, z, ny, t, nx, nz, AA, fp) {
        const p = level(px(), fp), cell = (o.cell || 6) * p, b0 = band(o.r, t);
        const ps = o.patch || 1.6, pn = Math.sin(x / ps + 1.3 * Math.sin(z / (ps * 1.7))) * Math.sin(z / ps + 0.9 * Math.sin(x / (ps * 1.3)));
        const b = pn > 0.55 ? Math.max(0, b0 - 1) : b0;
        const i = Math.floor(x / cell), k = Math.floor(z / cell), h = hash(i, k, 0, seed);
        CELL.sel = (i + 5e4) * 1e5 + (k + 5e4);
        const cx = (i + 0.25 + 0.5 * hash(i, k, 1, seed)) * cell, cz = (k + 0.25 + 0.5 * hash(i, k, 2, seed)) * cell, dx = (x - cx) / p, dz = (z - cz) / p;
        let f = 0;
        for (let q = 0; q < flowers.length; q++) {
          f += flowers[q][1];
          if (h < f) {
            if (Math.abs(dx) + Math.abs(dz) < 1.1)
              return Math.abs(dx) < 0.5 && Math.abs(dz) < 0.5 ? flowers[q][2] !== void 0 ? flowers[q][2] : flowers[q][0] : flowers[q][0];
            return step(o.r, b, 0);
          }
        }
        if (h < f + share && Math.abs(dz) < 0.6 && Math.abs(dx) < 1.6)
          return step(o.r, b, b >= o.r.length - 2 ? -1 : 1);
        return step(o.r, b, 0);
      }
    });
  };
  K.pixel.water = (o) => {
    const px = () => o.px || K.pixel.px || 0.08, seed = o.seed || 19, g = o.glint === void 0 ? 0.05 : o.glint, yaw = o.yaw || 0, rx = Math.cos(yaw), rz = -Math.sin(yaw);
    return Object.assign({}, o, {
      pat: spec("water", o),
      r: o.r,
      tex(x, y, z, ny, t, nx, nz, AA, fp) {
        const p = px();
        if (o.shore) {
          const sd = o.shore(x, z) / p;
          if (sd < 1.2) return o.foam !== void 0 ? o.foam : step(o.r, band(o.r, t), 3);
          if (sd < (o.shallow || 5)) return step(o.r, band(o.r, t), 1);
        }
        if (VIEW.on) {
          const b2 = band(o.r, t), q = level(p, fp), [nL, nF] = nestL(q), cell = (o.ripple || 7) * q * 2 ** nL, cA = (o.ripple || 7) * q * 2 ** LMIN, ix = Math.floor(x / cell), iz = Math.floor(z / cell), dens = o.ripples === void 0 ? 0.35 : o.ripples, sp = o.twinkle || 0.6;
          for (let k = -1; k <= 1; k++)
            for (let i = -1; i <= 1; i++) {
              if (!shown2(ix + i, iz + k, nL, nF, seed)) continue;
              const [a2, c] = atom2(ix + i, iz + k, nL, seed);
              if (hash(a2, c, 4, seed) > dens) continue;
              const ph = VIEW.t * sp + hash(a2, c, 7, seed);
              if (ph - Math.floor(ph) > 0.6) continue;
              toScreen(
                (a2 + 0.15 + 0.7 * hash(a2, c, 0, seed)) * cA,
                y,
                (c + 0.15 + 0.7 * hash(a2, c, 1, seed)) * cA,
                scr
              );
              const ox = Math.round(VIEW.x - scr[0]), oy = Math.round(VIEW.y - scr[1]), m = RIPPLES[Math.floor(hash(a2, c, 6, seed) * RIPPLES.length) % RIPPLES.length];
              if (Math.abs(ox) <= 2 && oy >= 0 && oy <= 1 && m >> oy * 5 + ox + 2 & 1) return step(o.r, b2, 2);
            }
          return step(o.r, b2, 0);
        }
        const a = (x * rx + z * rz) / p, d = (x * -rz + z * rx) / p, b = band(o.r, t), row = Math.floor(d / 3), len = 3 + Math.floor(4 * hash(row, 0, 0, seed)), seg = Math.floor(a / (len * 4)), fa = a - seg * len * 4;
        if (hash(row, seg, 1, seed) < g * 4 && fa < len && d - row * 3 < 1) return step(o.r, b, 2);
        return step(o.r, b, 0);
      }
    });
  };
  K.sculpt = (S0) => {
    const S = sculpt0(S0) || S0;
    const pxOf = (o) => o && o.px || S.px || 0.08;
    S.pixelSize = (detail) => S.px = K.pixel.px = Math.pow(2, typeof globalThis !== "undefined" && globalThis.INK_LOD || 0) / detail;
    S.canopy = (o) => {
      const px = pxOf(o), R = rnd(o.seed || 1), c0 = o.at, [RX, RY, RZ] = o.size, n = o.lobes || 5, cell = (o.cluster || 6) * px, amp = (o.bump === void 0 ? 1.6 : o.bump) * px, mix = S.pixel ? 0 : o.mix === void 0 ? 0.45 : o.mix, wseed = (o.seed || 1) * 31 + 5, lobes = [{ c: [c0[0], c0[1] + RY * 0.12, c0[2]], r: [RX * 0.66, RY * 0.66, RZ * 0.66] }];
      for (let k = 0; k < n - 1; k++) {
        const a = k / (n - 1) * Math.PI * 2 + (R() - 0.5) * 0.9, e = (R() - 0.45) * 0.7, q = 0.42 + 0.12 * R(), s = 0.42 + 0.14 * R();
        lobes.push({
          c: [c0[0] + Math.cos(a) * RX * q, c0[1] + e * RY, c0[2] + Math.sin(a) * RZ * q],
          r: [RX * s, RY * s * (0.85 + 0.2 * R()), RZ * s]
        });
      }
      const parts = [];
      for (const L of lobes) {
        const [rx, ry, rz] = L.r, c = L.c;
        const dome = (x, y, z) => {
          const w = worley(x, y, z, cell, wseed);
          return Math.max(0, 1 - w[0] * w[0] * 1.6);
        };
        const form = (x, y, z) => {
          const l = norm([(x - c[0]) / (rx * rx), (y - c[1]) / (ry * ry), (z - c[2]) / (rz * rz)]), w = worley(x, y, z, cell, wseed), d = norm([x - w[1], y - w[2], z - w[3]]);
          return norm([l[0] * (1 - mix) + d[0] * mix, l[1] * (1 - mix) + d[1] * mix, l[2] * (1 - mix) + d[2] * mix]);
        };
        parts.push(
          S.solid(
            c,
            Math.max(rx, ry, rz) + amp * 2,
            (x, y, z) => ellipsoid(x, y, z, rx, ry, rz) - amp * dome(x + c[0], y + c[1], z + c[2]),
            skin(rx, ry, rz),
            Object.assign({}, o.mat, {
              form,
              pat: K.pixel.withEdge(
                K.pixel.leafSpec({ cluster: o.leaf || 12, mix: 0.4, sun: S.sun, sunK: S.sunK }),
                o.mat.pat
              )
            }),
            Object.assign({ res: o.res || px * 0.9, reach: amp * 3 }, o.opts || {})
          )
        );
      }
      return { lobes, parts };
    };
    S.pine = (o) => {
      const px = pxOf(o), [x0, y0, z0] = o.at, h = o.h || 3, w = o.w || h * 0.36, n = o.tiers || 4, cell = (o.cluster || 5) * px, amp = (o.bump === void 0 ? S.pixel ? 0.5 : 1.2 : o.bump) * px, teeth = o.teeth || 9, tooth = (o.tooth === void 0 ? 4 : o.tooth) * px, mix = S.pixel ? 0 : o.mix === void 0 ? 0.35 : o.mix, seed = o.seed || 1, parts = [];
      if (o.trunk !== false)
        parts.push(
          S.tube(
            [
              [x0, y0 - 0.05, z0],
              [x0, y0 + h * 0.4, z0]
            ],
            w * 0.18,
            w * 0.12,
            o.trunk || o.mat,
            { res: px * 0.8 }
          )
        );
      for (let k = 0; k < n; k++) {
        const f = k / n, rb = w * (1 - f * 0.68), th = h * (0.42 - f * 0.12), by = y0 + h * (0.22 + f * 0.6), tw = (seed * 7 + k * 3) % 10;
        const sd = (x, y, z) => {
          const r = Math.hypot(x, z), a = Math.atan2(z, x), u = ((a / (Math.PI * 2) * teeth + tw * 0.1) % 1 + 1) % 1, jag = tooth * (1 - Math.abs(u - 0.5) * 2) * (0.6 + 0.4 * hash(Math.floor(a / (Math.PI * 2) * teeth + 50), k, 0, seed)), cone = (r * th + y * rb - rb * th) / Math.hypot(th, rb), w3 = worley(x + x0, y + by, z + z0, cell, seed * 13 + k);
          return Math.max(cone - amp * Math.max(0, 1 - w3[0] * w3[0] * 1.6), -y - jag * (r / rb));
        };
        const form = (x, y, z) => {
          const a = Math.atan2(z - z0, x - x0), c = norm([Math.cos(a) * th, rb, Math.sin(a) * th]), w3 = worley(x, y, z, cell, seed * 13 + k), d = norm([x - w3[1], y - w3[2], z - w3[3]]);
          return norm([c[0] * (1 - mix) + d[0] * mix, c[1] * (1 - mix) + d[1] * mix, c[2] * (1 - mix) + d[2] * mix]);
        };
        parts.push(
          S.solid(
            [x0, by, z0],
            Math.max(rb, th) + tooth + amp * 2,
            sd,
            (res, f2) => {
              for (let yy = -tooth; yy < th; yy += res * 0.8) {
                const rr2 = rb * (1 - Math.max(0, yy) / th), m = Math.max(1, Math.ceil(Math.PI * 2 * rr2 / (res * 0.8)));
                for (let i = 0; i < m; i++)
                  f2(Math.cos(i / m * Math.PI * 2) * rr2, yy, Math.sin(i / m * Math.PI * 2) * rr2);
              }
              for (let rr2 = 0; rr2 < rb; rr2 += res * 0.8) {
                const m = Math.max(1, Math.ceil(Math.PI * 2 * rr2 / (res * 0.8)));
                for (let i = 0; i < m; i++)
                  f2(Math.cos(i / m * Math.PI * 2) * rr2, -tooth * 0.5, Math.sin(i / m * Math.PI * 2) * rr2);
              }
            },
            Object.assign({}, o.mat, {
              form,
              // (drawn per pixel: needles, one pattern a tier, so the shadow under each tier is known; else leaf clusters)
              pat: K.pixel.withEdge(
                S.pixel ? K.pixel.needlesSpec({ tier: k }) : K.pixel.leafSpec({ cluster: o.leaf || 9, mix: 0.4, sun: S.sun, sunK: S.sunK }),
                o.mat.pat
              )
            }),
            Object.assign({ res: o.res || px * 0.9, reach: tooth + amp * 2 }, o.opts || {})
          )
        );
      }
      return parts;
    };
    const wallFrame = (face) => {
      const yw = Math.atan2(face[0], face[1]);
      return {
        ax: [
          [Math.cos(yw), 0, -Math.sin(yw)],
          [0, 1, 0],
          [Math.sin(yw), 0, Math.cos(yw)]
        ],
        u: [Math.cos(yw), 0, -Math.sin(yw)],
        n: [Math.sin(yw), 0, Math.cos(yw)]
      };
    };
    const at3 = (c, F, du, dv, dn) => [
      c[0] + F.u[0] * du + F.n[0] * dn,
      c[1] + dv,
      c[2] + F.u[2] * du + F.n[2] * dn
    ];
    S.window = (o) => {
      const px = pxOf(o), F = wallFrame(o.face), c = o.at, w = o.w, h = o.h, t = Math.max(px * 1.5, o.t || 0), res = { res: px * 0.7 }, box = (du, dv, dn, hu, hv, hn, m) => S.box(at3(c, F, du, dv, dn), [hu, hv, hn], m, Object.assign({ ax: F.ax }, res));
      box(0, 0, -px * 0.5, w / 2, h / 2, px * 1.2, o.glass);
      box(0, h / 2 + t / 2, px * 0.6, w / 2 + t, t / 2, px * 1.2, o.frame);
      box(0, -h / 2 - t / 2, px * 0.6, w / 2 + t, t / 2, px * 1.2, o.frame);
      for (const sg of [-1, 1]) box(sg * (w / 2 + t / 2), 0, px * 0.6, t / 2, h / 2, px * 1.2, o.frame);
      if (o.cross !== false) {
        box(0, 0, px * 0.3, px * 0.6, h / 2, px * 0.8, o.frame);
        box(0, 0, px * 0.3, w / 2, px * 0.6, px * 0.8, o.frame);
      }
      if (o.sill !== false) box(0, -h / 2 - t - px, px * 2.2, w / 2 + t * 1.8, px * 1.1, px * 2.4, o.frame);
      if (o.shutters)
        for (const sg of [-1, 1])
          box(sg * (w / 2 + t + w * 0.28), 0, px * 0.8, w * 0.26, h / 2 + t * 0.5, px * 0.8, o.shutters);
      if (o.box) {
        box(0, -h / 2 - t - px * 5, px * 4, w / 2 + t, px * 2.6, px * 2.6, o.box);
        if (o.flowers)
          S.canopy({
            at: at3(c, F, 0, -h / 2 - t - px * 1.5, px * 4),
            size: Math.abs(F.u[0]) > Math.abs(F.u[2]) ? [w / 2 + t, px * 3, px * 3] : [px * 3, px * 3, w / 2 + t],
            lobes: 3,
            mat: o.flowers,
            cluster: 3,
            bump: 1,
            seed: o.seed || 5
          });
      }
    };
    S.door = (o) => {
      const px = pxOf(o), F = wallFrame(o.face), c = o.at, w = o.w, h = o.h, t = Math.max(px * 1.6, o.t || 0), res = { res: px * 0.7 }, box = (du, dv, dn, hu, hv, hn, m) => S.box(at3(c, F, du, dv, dn), [hu, hv, hn], m, Object.assign({ ax: F.ax }, res)), hs = o.arch === false ? h : h - w / 2;
      box(0, hs / 2, px * 0.2, w / 2, hs / 2, px * 1.2, o.mat);
      if (o.arch !== false) {
        const cc = at3(c, F, 0, hs, px * 0.2);
        S.solid(
          cc,
          w,
          (x, y, z) => {
            const a = x * F.u[0] + z * F.u[2], nn = x * F.n[0] + z * F.n[2];
            return Math.max(Math.hypot(a, y) - w / 2, -y, Math.abs(nn) - px * 1.2);
          },
          (r2, f) => {
            for (let a = -w / 2; a <= w / 2; a += r2 * 0.7)
              for (let y = 0; y <= w / 2; y += r2 * 0.7)
                if (Math.hypot(a, y) < w / 2) f(F.u[0] * a + F.n[0] * px * 1.2, y, F.u[2] * a + F.n[2] * px * 1.2);
          },
          o.mat,
          Object.assign({ reach: px * 3 }, res)
        );
        S.solid(
          cc,
          w + t,
          (x, y, z) => {
            const a = x * F.u[0] + z * F.u[2], nn = x * F.n[0] + z * F.n[2], r = Math.hypot(a, y);
            return Math.max(Math.abs(r - w / 2 - t / 2) - t / 2, -y, Math.abs(nn - px * 0.5) - px * 1.4);
          },
          (r2, f) => {
            for (let k = 0; k <= 24; k++) {
              const an = k / 24 * Math.PI;
              f(
                F.u[0] * Math.cos(an) * (w / 2 + t / 2) + F.n[0] * px * 1.8,
                Math.sin(an) * (w / 2 + t / 2),
                F.u[2] * Math.cos(an) * (w / 2 + t / 2) + F.n[2] * px * 1.8
              );
            }
          },
          o.frame,
          Object.assign({ reach: px * 3 }, res)
        );
      } else box(0, h + t / 2, px * 0.6, w / 2 + t, t / 2, px * 1.4, o.frame);
      for (const sg of [-1, 1]) box(sg * (w / 2 + t / 2), hs / 2, px * 0.6, t / 2, hs / 2, px * 1.4, o.frame);
      if (o.iron) {
        for (const v of [hs * 0.25, hs * 0.8]) box(-w * 0.12, v, px * 1.6, w * 0.34, px * 0.6, px * 0.6, o.iron);
        S.ball(at3(c, F, w * 0.3, hs * 0.5, px * 2), px * 1.1, o.iron, res);
      }
    };
    S.trim = (pts, o) => {
      const px = pxOf(o), w = o.w || px * 2.5, t = o.t || px * 1.5;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]), V = [d[0] / l, d[1] / l, d[2] / l], up = Math.abs(V[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], U0 = [V[1] * up[2] - V[2] * up[1], V[2] * up[0] - V[0] * up[2], V[0] * up[1] - V[1] * up[0]], ul = Math.hypot(U0[0], U0[1], U0[2]), U = [U0[0] / ul, U0[1] / ul, U0[2] / ul], W = [U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]];
        S.box([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [t / 2, l / 2 + t / 2, w / 2], o.mat, {
          ax: [U, V, W],
          res: px * 0.7
        });
      }
    };
    S.barrel = (o) => {
      const px = pxOf(o), [x, y, z] = o.at, h = o.h || 0.5, r = o.r || 0.2;
      S.lathe([x, y, z], h, (t) => r * (0.86 + 0.14 * Math.sin(Math.PI * t)), o.mat, { res: px * 0.7 });
      for (const f of [0.18, 0.82])
        S.lathe([x, y + h * f - px, z], px * 2, () => r * (0.88 + 0.14 * Math.sin(Math.PI * f)) + px * 0.5, o.hoop, {
          res: px * 0.6
        });
      S.lathe([x, y + h - px * 0.5, z], px, () => r * 0.8, o.lid || o.mat, { res: px * 0.6 });
    };
    S.crate = (o) => {
      const px = pxOf(o), [x, y, z] = o.at, [hx, hy, hz] = o.size, e = px * 1.4, res = { res: px * 0.7 };
      S.box([x, y + hy, z], [hx - e * 0.3, hy - e * 0.3, hz - e * 0.3], o.mat, res);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          S.box([x + sx * (hx - e / 2), y + hy, z + sz * (hz - e / 2)], [e / 2, hy, e / 2], o.edge, res);
      for (const sy of [0, 1]) {
        S.box([x, y + sy * (2 * hy - e) + e / 2, z + hz - e / 2], [hx, e / 2, e / 2], o.edge, res);
        S.box([x, y + sy * (2 * hy - e) + e / 2, z - hz + e / 2], [hx, e / 2, e / 2], o.edge, res);
        S.box([x + hx - e / 2, y + sy * (2 * hy - e) + e / 2, z], [e / 2, e / 2, hz], o.edge, res);
        S.box([x - hx + e / 2, y + sy * (2 * hy - e) + e / 2, z], [e / 2, e / 2, hz], o.edge, res);
      }
    };
    S.facet = (o) => {
      const px = pxOf(o), R = rnd(o.seed || 3), c = o.at, [rx, ry, rz] = o.size, nf = o.faces || 9, planes = [];
      const tilt = o.tilt === void 0 ? 0.25 : o.tilt;
      planes.push(norm([(R() - 0.5) * tilt, 1, (R() - 0.5) * tilt]));
      planes.push([0, -1, 0]);
      for (let k = 0; k < nf - 2; k++) {
        const a = k / (nf - 2) * Math.PI * 2 + (R() - 0.5) * 0.7, e = (R() - 0.35) * 0.9;
        planes.push([Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)]);
      }
      const D = planes.map((n, i) => {
        const s = Math.hypot(rx * n[0], ry * n[1], rz * n[2]);
        return i === 1 ? ry * (o.sink === void 0 ? 0.25 : o.sink) + ry * 0.75 : s * (0.8 + 0.2 * R());
      });
      const best2 = (x, y, z) => {
        let b = -1e9, bi = 0, s = -1e9, si = 0;
        for (let i = 0; i < planes.length; i++) {
          const n = planes[i], v = x * n[0] + y * n[1] + z * n[2] - D[i];
          if (v > b) s = b, si = bi, b = v, bi = i;
          else if (v > s) s = v, si = i;
        }
        return [b, bi, s, si];
      };
      const L = norm(S.sun || [0.4, 0.8, 0.4]), edge = (o.edge === void 0 ? 1 : o.edge) * px;
      const mat = Object.assign({}, o.mat, {
        form: (x, y, z) => planes[best2(x - c[0], y - c[1], z - c[2])[1]],
        // the edge where a sunlit face meets one turned further from the sun is drawn a step lighter
        mod: (x, y, z) => {
          if (!edge) return 0;
          const [b, bi, s, si] = best2(x - c[0], y - c[1], z - c[2]), nb = planes[bi], ns = planes[si], lb = nb[0] * L[0] + nb[1] * L[1] + nb[2] * L[2], ls = ns[0] * L[0] + ns[1] * L[1] + ns[2] * L[2];
          return b - s < edge && lb > ls && lb > 0.15 ? 0.28 : 0;
        }
      });
      if (o.top) mat.top = Object.assign({ min: o.up === void 0 ? 0.72 : o.up }, o.top, { form: mat.form });
      const br = Math.max(rx, ry, rz) * 1.2;
      return S.solid(
        c,
        br,
        (x, y, z) => best2(x, y, z)[0],
        (res, f) => {
          const st = res * 0.75;
          for (let i = 0; i < planes.length; i++) {
            const n = planes[i], a = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], t1 = norm([n[1] * a[2] - n[2] * a[1], n[2] * a[0] - n[0] * a[2], n[0] * a[1] - n[1] * a[0]]), t2 = [n[1] * t1[2] - n[2] * t1[1], n[2] * t1[0] - n[0] * t1[2], n[0] * t1[1] - n[1] * t1[0]];
            for (let u = -br; u <= br; u += st)
              for (let v = -br; v <= br; v += st) {
                const p = [
                  n[0] * D[i] + t1[0] * u + t2[0] * v,
                  n[1] * D[i] + t1[1] * u + t2[1] * v,
                  n[2] * D[i] + t1[2] * u + t2[2] * v
                ];
                let inside = true;
                for (let j = 0; j < planes.length && inside; j++)
                  if (j !== i && p[0] * planes[j][0] + p[1] * planes[j][1] + p[2] * planes[j][2] - D[j] > st * 0.5)
                    inside = false;
                if (inside) f(p[0], p[1], p[2]);
              }
          }
        },
        mat,
        Object.assign({ res: o.res || px * 0.9, reach: br * 0.3 }, o.opts || {})
      );
    };
    S.lip = (pts, o) => {
      const px = pxOf(o), drop = (o.drop || 4) * px, tuft = (o.tuft || 4) * px, depth = (o.depth || 2) * px, seed = o.seed || 23;
      const out = [];
      let u0 = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz);
        if (len < 1e-6) continue;
        const ux = dx / len, uz = dz / len, ou = o.out ? typeof o.out === "function" ? o.out(i) : o.out : [uz, -ux], ol = Math.hypot(ou[0], ou[1]) || 1, ox = ou[0] / ol, oz = ou[1] / ol, c = [
          (a[0] + b[0]) / 2 + ox * depth * 0.5,
          (a[1] + b[1]) / 2,
          (a[2] + b[2]) / 2 + oz * depth * 0.5
        ], base = u0;
        const sd = (x, y, z) => {
          const along = x * ux + z * uz, across = x * ox + z * oz, u = base + along + len / 2, k = Math.floor(u / tuft), f = (u - k * tuft) / tuft, hang = drop * (0.55 + 0.45 * hash(k, i, 0, seed)) * (1 - Math.abs(f - 0.5) * 2), yy = y - ((a[1] - b[1]) / 2 + (b[1] - a[1]) * ((along + len / 2) / len));
          const dA = Math.abs(along) - len / 2 - px * 0.5, dC = Math.abs(across) - depth / 2, dY = Math.max(yy + px * 0.5, -yy - hang);
          return Math.max(dA, dC, dY);
        };
        out.push(
          S.solid(
            c,
            len / 2 + drop + depth,
            sd,
            (res, f) => {
              for (let s = -len / 2; s <= len / 2; s += res * 0.7)
                for (let h = 0; h <= drop; h += res * 0.7) f(ux * s + ox * depth * 0.5, -h, uz * s + oz * depth * 0.5);
            },
            o.mat,
            Object.assign({ res: o.res || px * 0.8, reach: depth * 2 }, o.opts || {})
          )
        );
        u0 += len;
      }
      return out;
    };
    return S;
  };
})(KIT);
