// Generated from src/kit/kv-form.ts by npm run build:src. Do not edit.
(function(K) {
  const V = K.V;
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const dice = (seed) => {
    let s = Math.floor(Math.abs(seed) * 7919) % 2147483646 + 1;
    return () => ((s = s * 16807 % 2147483647) - 1) / 2147483646;
  };
  const frameY = (dir, spin) => {
    const Vv = norm(dir), ref = Math.abs(Vv[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let U = norm(cross(ref, Vv));
    let W = cross(U, Vv);
    const c = Math.cos(spin || 0), s = Math.sin(spin || 0);
    const U2 = [U[0] * c + W[0] * s, U[1] * c + W[1] * s, U[2] * c + W[2] * s];
    W = cross(U2, Vv);
    U = U2;
    return [U, Vv, W];
  };
  const facePolys = (planes, big) => planes.map((f, fi) => {
    const n = norm(f.n), ref = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = norm(cross(ref, n)), v = cross(n, u), o = [n[0] * f.d, n[1] * f.d, n[2] * f.d];
    let poly = [
      [-big, -big],
      [big, -big],
      [big, big],
      [-big, big]
    ].map((q) => [
      o[0] + u[0] * q[0] + v[0] * q[1],
      o[1] + u[1] * q[0] + v[1] * q[1],
      o[2] + u[2] * q[0] + v[2] * q[1]
    ]);
    planes.forEach((g, gi) => {
      if (gi === fi || !poly.length) return;
      const gn = norm(g.n), out = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length], sa = dot(gn, a) - g.d, sb = dot(gn, b) - g.d;
        if (sa <= 0) out.push(a);
        if (sa <= 0 !== sb <= 0) {
          const t = sa / (sa - sb);
          out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
        }
      }
      poly = out;
    });
    return { n, u, v, o, poly };
  });
  const sculpt0 = K.sculpt;
  K.sculpt = (S0) => {
    const S = sculpt0(S0) || S0;
    S.convex = (c, planes, mat, o) => {
      o = o || {};
      const P = planes.map((p) => ({ n: norm(p.n), d: p.d })), big = Math.max(...P.map((p) => Math.abs(p.d))) * 4 + 1, faces = facePolys(P, big).filter((f) => f.poly.length >= 3), rd = o.rd || 0;
      let br = 0;
      for (const f of faces) for (const q of f.poly) br = Math.max(br, Math.hypot(q[0], q[1], q[2]));
      const sd = (x, y, z) => {
        let m = -1e9;
        for (const p of P) {
          const q = p.n[0] * x + p.n[1] * y + p.n[2] * z - (p.d - rd);
          if (q > m) m = q;
        }
        return m - rd;
      };
      const sm = (res, f) => {
        for (const F2 of faces) {
          let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
          for (const q of F2.poly) {
            const a = dot(F2.u, q), b = dot(F2.v, q);
            a0 = Math.min(a0, a);
            a1 = Math.max(a1, a);
            b0 = Math.min(b0, b);
            b1 = Math.max(b1, b);
          }
          const nd = dot(F2.n, F2.o);
          for (let b = b0; b <= b1 + res * 0.5; b += res * 0.87)
            for (let a = a0 + (Math.round((b - b0) / (res * 0.87)) & 1) * res * 0.5; a <= a1 + res * 0.5; a += res) {
              const q = [
                F2.n[0] * nd + F2.u[0] * a + F2.v[0] * b,
                F2.n[1] * nd + F2.u[1] * a + F2.v[1] * b,
                F2.n[2] * nd + F2.u[2] * a + F2.v[2] * b
              ];
              let ok = true;
              for (const p of P)
                if (dot(p.n, q) - p.d > res * 0.35) {
                  ok = false;
                  break;
                }
              if (ok) f(q[0], q[1], q[2]);
            }
        }
      };
      return S.solid(c, br + 0.02, sd, sm, mat, o);
    };
    return S;
  };
  const F = K.form = {};
  F.crystal = (S, at, dir, mat, o) => {
    o = o || {};
    const R = dice(o.seed || 1), r = o.r || 0.12, sides = o.sides || 6, len = o.len || 1, tip = o.tip === void 0 ? r * 1.6 : o.tip, bury = o.bury === void 0 ? r : o.bury, taper = o.taper === void 0 ? 0.08 : o.taper, body = Math.max(0.01, len - tip), ap = r * Math.cos(Math.PI / sides), ap2 = ap * (1 - taper), planes = [{ n: [0, -1, 0], d: bury }], sp = R() * Math.PI * 2;
    for (let k = 0; k < sides; k++) {
      const a = sp + k / sides * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a), sl = (ap - ap2) / (body + bury), ns = norm([cx, sl, cz]);
      planes.push({ n: ns, d: dot(ns, [cx * ap, -bury, cz * ap]) });
      const nt = norm([cx * tip, ap2, cz * tip]);
      planes.push({ n: nt, d: dot(nt, [0, body + tip, 0]) });
    }
    for (let k = 0; k < (o.chips || 0); k++) {
      const a = R() * Math.PI * 2, h = body + tip * (0.2 + 0.6 * R()), nc = norm([Math.cos(a), 0.4 + R() * 1.4, Math.sin(a)]), q = [Math.cos(a) * ap2 * (1 - (h - body) / tip), h, Math.sin(a) * ap2 * (1 - (h - body) / tip)];
      planes.push({ n: nc, d: dot(nc, q) - r * (0.15 + 0.3 * R()) });
    }
    const ax = frameY(dir, R() * Math.PI * 2), opts = Object.assign({ ax }, o);
    delete opts.r;
    if (o.glow && mat && mat.sss) {
      const D = norm(dir), a = [at[0] + D[0] * len * 0.1, at[1] + D[1] * len * 0.1, at[2] + D[2] * len * 0.1], b = [at[0] + D[0] * (body + tip * 0.4), at[1] + D[1] * (body + tip * 0.4), at[2] + D[2] * (body + tip * 0.4)];
      mat = Object.assign({}, mat, { sss: Object.assign({}, mat.sss, { core: { p: a, b, r: r * 1.1, k: o.glow } }) });
    }
    if (o.grow) {
      const d0 = o.delay || 0, D = norm(dir);
      opts.born = (x, y, z) => d0 + Math.max(0, dot([x - at[0], y - at[1], z - at[2]], D) + bury) / (len + bury) * o.grow;
    }
    return S.convex(at, planes, mat, opts);
  };
  F.cluster = (S, at, up, mat, o) => {
    o = o || {};
    const R = dice(o.seed || 3), n = o.n || 9, len = o.len || [0.5, 1.6], spread = o.spread === void 0 ? 0.75 : o.spread, U = norm(up || [0, 1, 0]), fr = frameY(U, 0), out = [];
    for (let i = 0; i < n; i++) {
      const k = i === 0 ? 0 : Math.sqrt(i / n), a = R() * Math.PI * 2, tilt = spread * (i === 0 ? 0.08 : 0.25 + 0.75 * k) * (0.7 + 0.5 * R()), L = len[1] - (len[1] - len[0]) * (i === 0 ? 0 : 0.3 + 0.7 * k * R()), d = norm([
        U[0] * Math.cos(tilt) + (fr[0][0] * Math.cos(a) + fr[2][0] * Math.sin(a)) * Math.sin(tilt),
        U[1] * Math.cos(tilt) + (fr[0][1] * Math.cos(a) + fr[2][1] * Math.sin(a)) * Math.sin(tilt),
        U[2] * Math.cos(tilt) + (fr[0][2] * Math.cos(a) + fr[2][2] * Math.sin(a)) * Math.sin(tilt)
      ]), off = (o.foot === void 0 ? 0.35 : o.foot) * L * k * (0.5 + 0.5 * R()), p = [
        at[0] + (fr[0][0] * Math.cos(a) + fr[2][0] * Math.sin(a)) * off,
        at[1] + (fr[0][1] * Math.cos(a) + fr[2][1] * Math.sin(a)) * off,
        at[2] + (fr[0][2] * Math.cos(a) + fr[2][2] * Math.sin(a)) * off
      ];
      out.push(
        F.crystal(S, p, d, mat, {
          glow: o.glow,
          r: L * (o.r || 0.14) * (0.8 + 0.4 * R()),
          len: L,
          sides: o.sides,
          chips: o.chips === void 0 ? R() < 0.5 ? 1 : 0 : o.chips,
          seed: (o.seed || 3) * 31 + i * 7,
          res: o.res,
          tag: o.tag,
          grow: o.grow ? o.grow * (L / len[1]) : 0,
          delay: o.grow ? (o.delay || 0) + o.grow * 0.35 * k : 0
        })
      );
    }
    return out;
  };
  F.geode = (S, c, r, o) => {
    o = o || {};
    const R = dice(o.seed || 5), cut = norm(o.cut || [0, 0, 1]), shell = o.shell === void 0 ? 0.32 : o.shell, ri = r * (1 - shell), n3 = K.tex.noise(1.3 / r, 3), brk = (x, y, z) => dot([x - c[0], y - c[1], z - c[2]], cut) - r * 0.06 * (n3(x, y, z) - 0.5), rind = o.rind || { r: [1, 2, 3] }, bands = o.bands || [4, 5, 6, 5, 4], faceMat = {
      r: rind.r || rind,
      rf: (x, y, z) => {
        const d = Math.hypot(x - c[0], y - c[1], z - c[2]) / r;
        if (d > 0.93) return rind.r || rind;
        const b = Math.floor(
          (0.93 - d) / (0.93 - (1 - shell)) * bands.length * 1.6 + 2 * K.tex.noise(4 / r)(x, y, z)
        );
        return [bands[Math.min(bands.length - 1, Math.abs(b) % bands.length)]];
      }
    };
    const ball = S.solid(
      c,
      r * 1.15,
      (x, y, z) => Math.hypot(x, y, z) - r * (1 + 0.08 * (n3(x + c[0], y + c[1], z + c[2]) - 0.5)),
      (res, f) => {
        const m = Math.ceil(4 * Math.PI * r * r / (res * res * 0.8));
        for (let i = 0; i < m; i++) {
          const yy = 1 - 2 * (i + 0.5) / m, rr = Math.sqrt(1 - yy * yy), a = i * 2.399963;
          f(Math.cos(a) * rr * r, yy * r, Math.sin(a) * rr * r);
        }
      },
      rind,
      { res: o.res, tag: o.tag, born: o.born }
    );
    const hollow = S.solid(
      c,
      ri * 1.1,
      (x, y, z) => Math.hypot(x, y, z) - ri * (1 + 0.1 * (n3(x * 2 + c[0], y * 2 + c[1], z * 2 + c[2]) - 0.5)),
      (res, f) => {
        const m = Math.ceil(4 * Math.PI * ri * ri / (res * res * 0.8));
        for (let i = 0; i < m; i++) {
          const yy = 1 - 2 * (i + 0.5) / m, rr = Math.sqrt(1 - yy * yy), a = i * 2.399963;
          f(Math.cos(a) * rr * ri, yy * ri, Math.sin(a) * rr * ri);
        }
      },
      o.inside || bands.slice(0, 2),
      { neg: true, res: o.res }
    );
    const half = S.add(
      {
        bc: c,
        br: r * 1.2,
        sd: (x, y, z) => -brk(x, y, z) * 0.85,
        sample(f) {
          const res = this.res, fr = frameY(cut, 0);
          for (let a = -r * 1.1; a <= r * 1.1; a += res)
            for (let b = -r * 1.1; b <= r * 1.1; b += res * 0.87) {
              if (a * a + b * b > r * r * 1.2) continue;
              f(
                c[0] + fr[0][0] * a + fr[2][0] * b,
                c[1] + fr[0][1] * a + fr[2][1] * b,
                c[2] + fr[0][2] * a + fr[2][2] * b
              );
            }
        }
      },
      faceMat,
      { neg: true, res: o.res, reach: r * 0.08 }
    );
    const lining = [], N = o.n || 160, lm = o.lining || { r: [7, 8, 9] }, tpls = [0, 1, 2].map(
      (k) => S.template(
        (S2) => F.crystal(S2, [0, 0, 0], [0, 1, 0], lm, {
          r: 0.22,
          len: 1,
          seed: (o.seed || 5) * 13 + k,
          chips: k,
          res: 0.09
        }),
        {
          res: 0.09
        }
      )
    );
    for (let i = 0; i < N; i++) {
      const yy = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - yy * yy), a = i * 2.399963, d = [Math.cos(a) * rr, yy, Math.sin(a) * rr], p = [c[0] + d[0] * ri * 1.02, c[1] + d[1] * ri * 1.02, c[2] + d[2] * ri * 1.02];
      if (brk(p[0], p[1], p[2]) > -r * 0.02) continue;
      const L = r * (0.16 + 0.22 * R()), inw = norm([-d[0] + (R() - 0.5) * 0.5, -d[1] + (R() - 0.5) * 0.5, -d[2] + (R() - 0.5) * 0.5]), fr = frameY(inw, R() * 6.28);
      lining.push(p);
      S.place(tpls[i % 3], p, {
        R: [fr[0][0], fr[0][1], fr[0][2], fr[1][0], fr[1][1], fr[1][2], fr[2][0], fr[2][1], fr[2][2]],
        scale: L,
        solid: false,
        born: o.grow ? (o.delay || 0) + o.grow * (0.2 + 0.8 * R()) : void 0
      });
    }
    return { ball, hollow, half, lining };
  };
  F.columns = (S, o) => {
    o = o || {};
    const at = o.at || [0, 0, 0], r = o.r || 0.35, rad = o.rad || 3, gap = o.gap === void 0 ? 0.03 : o.gap, bev = o.bevel === void 0 ? 0.03 : o.bevel, depth = o.depth || 2, w = Math.sqrt(3) * r, key = (i, j) => i * 4099 + j, cells = /* @__PURE__ */ new Map();
    const hrand = (i, j) => {
      const s = Math.sin(i * 127.1 + j * 311.7 + (o.seed || 7) * 74.7) * 43758.5453;
      return s - Math.floor(s);
    };
    const centre = (i, j) => [at[0] + w * (i + (j & 1) * 0.5), at[2] + 1.5 * r * j];
    const n = Math.ceil(rad / (1.5 * r)) + 1;
    for (let j = -n; j <= n; j++)
      for (let i = -n; i <= n; i++) {
        const [x, z] = centre(i, j);
        if (o.where ? !o.where(x, z) : Math.hypot(x - at[0], z - at[2]) > rad) continue;
        const k = hrand(i, j), top = at[1] + (o.top ? o.top(x, z, k) : 1 + k * 0.6), tl = o.tilt ? o.tilt(x, z, k) : [(hrand(i + 7, j) - 0.5) * 0.12, (hrand(i, j + 7) - 0.5) * 0.12];
        cells.set(key(i, j), { i, j, x, z, top, tl, k });
      }
    const hex = (px, pz, rr) => {
      const kx = -0.866025404, ky = 0.5;
      let x = Math.abs(pz), y = Math.abs(px);
      const d = 2 * Math.min(kx * x + ky * y, 0);
      x -= d * kx;
      y -= d * ky;
      x -= Math.max(-0.5 * rr, Math.min(0.5 * rr, x));
      y -= rr * 0.866025404;
      return Math.hypot(x, y) * Math.sign(y);
    };
    const one = (C, x, y, z) => {
      const px = x - C.x, pz = z - C.z, tp = C.top + C.tl[0] * px + C.tl[1] * pz, d2 = hex(px, pz, r - gap / 2) + bev, dy = y - tp + bev, dlo = at[1] - depth - y;
      return Math.max(Math.min(Math.max(d2, dy), 0) + Math.hypot(Math.max(d2, 0), Math.max(dy, 0)) - bev, dlo);
    };
    const near = (x, z) => {
      const j = Math.round((z - at[2]) / (1.5 * r)), i = Math.round((x - at[0]) / w - (j & 1) * 0.5);
      return [i, j];
    };
    const sd = (x, y, z) => {
      const [i0, j0] = near(x, z);
      let d = 1e9;
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const C = cells.get(key(i0 + di, j0 + dj));
          if (C) {
            const q = one(C, x, y, z);
            if (q < d) d = q;
          }
        }
      return d > 1e8 ? 1 : d;
    };
    let lo = 1e9, hi = -1e9;
    for (const C of cells.values()) {
      lo = Math.min(lo, C.top);
      hi = Math.max(hi, C.top);
    }
    const p = {
      bc: [at[0], (at[1] - depth + hi) / 2, at[2]],
      br: Math.hypot(rad + r * 2, (hi - at[1] + depth) / 2 + 0.5),
      cells: [...cells.values()],
      sd,
      sample(f) {
        const res = this.res;
        for (const C of cells.values()) {
          for (let a = -r; a <= r; a += res * 0.8)
            for (let b = -r; b <= r; b += res * 0.8)
              if (hex(a, b, r) < 0) f(C.x + a, C.top + C.tl[0] * a + C.tl[1] * b, C.z + b);
          let nlo = C.top;
          for (let dj = -1; dj <= 1; dj++)
            for (let di = -1; di <= 1; di++) {
              const N = cells.get(key(C.i + di, C.j + dj));
              nlo = Math.min(nlo, N ? N.top : at[1] - 0.3);
            }
          const bottom = Math.max(at[1] - depth, nlo - res * 2), m = Math.ceil(2 * Math.PI * r / res);
          for (let y = C.top; y >= bottom; y -= res * 0.87)
            for (let k = 0; k < m; k++) {
              const a = k / m * Math.PI * 2;
              f(C.x + Math.cos(a) * r, y, C.z + Math.sin(a) * r);
            }
        }
      }
    };
    return S.add(p, o.mat, { res: o.res, tag: o.tag, reach: bev + 0.02, born: o.born });
  };
  F.drips = (S, o) => {
    o = o || {};
    S.ready();
    const R = dice(o.seed || 11), box = o.box, gap = o.gap || 0.5, len = o.len || [0.4, 1.4], rk = o.r || 0.16, tites = [], mites = [], columns = [], grp = o.melt ? S.grp(o.melt) : null;
    const cone = (base, down, L, rb, mat, g, born) => {
      const ax = frameY(down ? [0, -1, 0] : [0, 1, 0], R() * 6.28), rings = o.rings === void 0 ? 0.07 : o.rings, ph = R() * 6;
      return S.lathe(
        base,
        L,
        (t) => rb * Math.pow(1 - t, down ? 0.85 : 0.6) * (1 + rings * Math.sin(t * 26 + ph)) + (down ? 4e-3 : rb * 0.12),
        mat,
        Object.assign({ ax, res: o.res }, g || {}, born ? { born } : {})
      );
    };
    for (let t = 0; t < (o.n || 40); t++) {
      const x = box[0] + (box[1] - box[0]) * R(), z = box[2] + (box[3] - box[2]) * R();
      if (S.sdf(x, o.y, z) < 0.1) continue;
      const up = K.grow.ray(S, [x, o.y, z], [0, 1, 0], 20);
      if (!up || up.n[1] > -0.5) continue;
      if (tites.some((q) => Math.hypot(q[0] - up.p[0], q[2] - up.p[2]) < gap)) continue;
      const dn = K.grow.ray(S, [x, o.y, z], [0, -1, 0], 30), L = len[0] + (len[1] - len[0]) * R() * R(), rb = L * rk * (0.8 + 0.4 * R()), g = grp ? { g: grp.g, k: grp.k } : null, top = up.p[1] + rb * 0.4, room = dn ? top - dn.p[1] : 99;
      const grow = o.grow || 0;
      if (dn && dn.n[1] > 0.5 && room < L * 1.6 + (o.join || 0.3)) {
        const mid = dn.p[1] + room * 0.45;
        cone(
          [x, top, z],
          true,
          top - mid + rb * 0.3,
          rb * 1.1,
          o.mat,
          g,
          grow ? (px, py) => (top - py) / room * grow : null
        );
        cone(
          [x, dn.p[1] - rb * 0.3, z],
          false,
          mid - dn.p[1] + rb * 0.6,
          rb * 1.4,
          o.mite || o.mat,
          g,
          grow ? (px, py) => (py - dn.p[1]) / room * grow : null
        );
        columns.push([x, z]);
        tites.push(up.p);
        continue;
      }
      cone([x, top, z], true, Math.min(L, room * 0.6), rb, o.mat, g, grow ? (px, py) => (top - py) / L * grow : null);
      tites.push([x, up.p[1] - Math.min(L, room * 0.6), z]);
      if (o.mites !== false && dn && dn.n[1] > 0.6) {
        const Lm = Math.min(L * 0.55, room * 0.3);
        cone(
          [x, dn.p[1] - rb * 0.3, z],
          false,
          Lm + rb * 0.3,
          rb * 1.3,
          o.mite || o.mat,
          g,
          grow ? (px, py) => (py - dn.p[1]) / Lm * grow * 0.8 + grow * 0.2 : null
        );
        mites.push([x, dn.p[1] + Lm, z]);
      }
    }
    return { tites, mites, columns };
  };
  F.flowstone = (S, on, o) => {
    o = o || {};
    const lo = o.box[0], hi = o.box[1], th = o.thick || 0.18, rip = o.ripple === void 0 ? 0.5 : o.ripple, fq = o.freq || 5, tsd = typeof on === "function" ? on : (x, y, z) => S.psd(on, x, y, z), wn = K.tex.noise(1.1, 2), blob = K.tex.noise(0.55, 2), src = o.from || null, us = src ? src[0] + src[2] * 0.7 : 0, sm = (a, b, v) => {
      const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
      return t * t * (3 - 2 * t);
    }, thick = (x, y, z) => {
      const u = x + z * 0.7, h = (y - lo[1]) / (hi[1] - lo[1]), ex = Math.min(x - lo[0], hi[0] - x, z - lo[2], hi[2] - z, hi[1] - y), inBox = sm(0, 0.5, ex), where = src ? sm(0, 0.3, src[1] - y) * sm(
        0,
        0.3,
        (o.w0 || 0.3) + (src[1] - y) * (o.fan || 0.45) + 0.45 * (blob(x, y * 0.5, z) - 0.5) - Math.abs(u - us)
      ) : sm(0.42 - 0.12 * h, 0.58 - 0.12 * h, blob(x, y * 0.35, z)), fold = 0.5 + 0.5 * Math.sin(u * fq + wn(x, y * 0.3, z) * 3), drape = lo[1] + (hi[1] - lo[1]) * 0.35 * (1 - fold) * (0.6 + 0.8 * wn(u * 2, 1, 3)), foot = sm(drape - 0.05, drape + 0.25, y), ridges = 0.5 + 0.5 * Math.sin(y * fq * 1.7 + u * 0.8);
      return th * inBox * where * foot * (1 - rip + rip * fold) * (0.85 + 0.15 * ridges);
    }, bc = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
    return S.add(
      {
        bc,
        br: Math.hypot(hi[0] - bc[0], hi[1] - bc[1], hi[2] - bc[2]) + th,
        sd: (x, y, z) => {
          const t = thick(x, y, z);
          return t <= 2e-3 ? Math.max(0.05, tsd(x, y, z)) : (tsd(x, y, z) - t) * 0.7;
        },
        sample(f) {
          const res = this.res;
          for (let x = lo[0]; x <= hi[0]; x += res * 0.8)
            for (let y = lo[1]; y <= hi[1]; y += res * 0.8)
              for (let z = lo[2]; z <= hi[2]; z += res * 0.8) {
                const d = tsd(x, y, z);
                if (Math.abs(d) < res * 0.8 && thick(x, y, z) > 0.01) f(x, y, z);
              }
        }
      },
      o.mat,
      { res: o.res, reach: th, g: o.g, k: o.k, born: o.born }
    );
  };
  F.icicles = (S, o) => {
    o = o || {};
    S.ready();
    const R = dice(o.seed || 13), box = o.box, len = o.len || [0.15, 0.6], edge = o.edge === void 0 ? 0.4 : o.edge, gap = o.gap || 0.12, out = [], tpls = [0, 1, 2].map(
      (k) => S.template(
        (S2) => S2.lathe(
          [0, 0, 0],
          1,
          (t) => 0.11 * Math.pow(1 - t, 1.1) * (1 + 0.18 * Math.sin(t * (18 + k * 5) + k)) + 6e-3,
          o.mat,
          { ax: frameY([0, -1, 0], k), res: 0.06 }
        ),
        { res: 0.06 }
      )
    );
    for (let t = 0; t < (o.n || 200); t++) {
      const x = box[0] + (box[1] - box[0]) * R(), z = box[2] + (box[3] - box[2]) * R();
      const hit = K.grow.ray(S, [x, o.top, z], [0, -1, 0], o.top - (o.bottom === void 0 ? -5 : o.bottom));
      if (!hit) continue;
      let y = hit.p[1] - 0.02, k = 0;
      while (S.sdf(x, y, z) < 0 && k++ < 400) y -= 0.01;
      if (k >= 400 || k < 2) continue;
      const below = K.grow.ray(S, [x, y - 0.01, z], [0, -1, 0], 3);
      if (below && below.d < len[0] * 1.5) continue;
      let open = false;
      for (let a = 0; a < 8 && !open; a++) {
        const qx = x + Math.cos(a * 0.785) * edge, qz = z + Math.sin(a * 0.785) * edge;
        if (S.sdf(qx, y + 0.06, qz) > 0.04 && S.sdf(qx, y + 0.25, qz) > 0.04) open = true;
      }
      if (!open || out.some((q) => Math.hypot(q[0] - x, q[2] - z) < gap)) continue;
      const L = Math.min(len[0] + (len[1] - len[0]) * R() * R(), below ? below.d * 0.7 : 9);
      out.push([x, y, z]);
      S.place(tpls[t % 3], [x, y + 0.02, z], {
        scale: L,
        yaw: R() * 6.28,
        solid: false,
        born: o.grow ? (o.delay || 0) + o.grow * R() : void 0
      });
    }
    return out;
  };
})(KIT);
