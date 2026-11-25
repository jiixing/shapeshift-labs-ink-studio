// Generated from src/kit/ky-built.ts by npm run build:src. Do not edit.
(function(K) {
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const dice = (seed) => {
    let s = Math.floor(Math.abs(seed) * 7919) % 2147483646 + 1;
    return () => ((s = s * 16807 % 2147483647) - 1) / 2147483646;
  };
  const hash = (i, j, k) => {
    const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const rbox = (x, y, z, hx, hy, hz, r) => {
    const qx = Math.abs(x) - hx + r, qy = Math.abs(y) - hy + r, qz = Math.abs(z) - hz + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  };
  const F = K.form || (K.form = {});
  const pathOf = (pts, closed, reach) => {
    const P = closed ? pts.concat([pts[0]]) : pts.slice(), cum = [0];
    for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const len = cum[cum.length - 1], ns = P.length - 1, at = (u) => {
      let i = 0;
      if (closed) u = (u % len + len) % len;
      while (i < ns - 1 && cum[i + 1] < u) i++;
      const L = cum[i + 1] - cum[i] || 1, t = (u - cum[i]) / L, tx = (P[i + 1][0] - P[i][0]) / L, tz = (P[i + 1][1] - P[i][1]) / L;
      let nx = -tz, nz = tx;
      const blend = (j, k) => {
        if (j < 0 || j >= ns) return;
        const Lj = cum[j + 1] - cum[j] || 1;
        nx = nx * (1 - k) + -(P[j + 1][1] - P[j][1]) / Lj * k;
        nz = nz * (1 - k) + (P[j + 1][0] - P[j][0]) / Lj * k;
      };
      if (t < 0.5) blend(closed && i === 0 ? ns - 1 : i - 1, 0.5 - t);
      else blend(closed && i === ns - 1 ? 0 : i + 1, t - 0.5);
      const nl = Math.hypot(nx, nz) || 1;
      return { p: [P[i][0] + tx * (u - cum[i]), P[i][1] + tz * (u - cum[i])], t: [tx, tz], n: [nx / nl, nz / nl] };
    };
    const CELL = 0.4, REACH = reach, grid = /* @__PURE__ */ new Map(), key = (i, j) => i * 73856093 + j * 19349663;
    for (let s = 0; s < ns; s++) {
      const x0 = Math.min(P[s][0], P[s + 1][0]) - REACH, x1 = Math.max(P[s][0], P[s + 1][0]) + REACH, z0 = Math.min(P[s][1], P[s + 1][1]) - REACH, z1 = Math.max(P[s][1], P[s + 1][1]) + REACH;
      for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++)
        for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) {
          const k = key(i, j);
          if (!grid.has(k)) grid.set(k, []);
          grid.get(k).push(s);
        }
    }
    if (ns === 1 && !closed) {
      const L = len || 1, tx = (P[1][0] - P[0][0]) / L, tz = (P[1][1] - P[0][1]) / L;
      return {
        len,
        at,
        closed,
        pts: P,
        straight: true,
        local: (x, z) => {
          const dx = x - P[0][0], dz = z - P[0][1];
          return [dx * tx + dz * tz, dx * -tz + dz * tx];
        }
      };
    }
    const local = (x, z) => {
      const cand = grid.get(key(Math.floor(x / CELL), Math.floor(z / CELL)));
      if (!cand) return null;
      let best = 1e18, bu = 0, bw = 0;
      for (const s of cand) {
        const ax = P[s][0], az = P[s][1], L = cum[s + 1] - cum[s] || 1, tx = (P[s + 1][0] - ax) / L, tz = (P[s + 1][1] - az) / L, dx = x - ax, dz = z - az;
        let a = dx * tx + dz * tz;
        if (closed || s > 0 && a < 0) a = Math.max(0, a);
        if (closed || s < ns - 1 && a > L) a = Math.min(L, a);
        const px = ax + tx * a, pz = az + tz * a, dd = (x - px) ** 2 + (z - pz) ** 2, w = dx * -tz + dz * tx;
        if (dd < best - 1e-12) {
          best = dd;
          bu = cum[s] + a;
          bw = Math.abs(w) < Math.sqrt(dd) - 1e-9 ? Math.sign(w || 1) * Math.sqrt(dd) : w;
        }
      }
      return [bu, bw];
    };
    return { len, at, local, closed, pts: P };
  };
  F.wall = (S, mat, o) => {
    o = o || {};
    const R = dice(o.seed || 107), th = (o.thick || 0.36) / 2, REACH = th + 0.35, path = pathOf(o.path || [o.from, o.to], !!o.closed, REACH), len = path.len, y0 = o.y0 || 0, h = o.h || 1.6, bl = (o.brick || [0.42, 0.17])[0], bh = (o.brick || [0.42, 0.17])[1], gap = o.gap === void 0 ? 0.025 : o.gap, rd = o.round === void 0 ? 0.015 : o.round, jit = o.jitter === void 0 ? 0.012 : o.jitter, pl = bl + gap, ph = bh + gap, courses = Math.floor(h / ph), top0 = o.top || (() => h), miss = o.missing || 0, sd0 = o.seed || 107;
    const TS = Math.min(0.02, pl / 8), NT = Math.ceil(len / TS) + 1, TT = Float32Array.from({ length: NT + 1 }, (_, i) => top0(Math.min(len, i * TS))), top = o.path ? (u) => {
      const f = Math.max(0, Math.min(NT - 1e-6, u / TS)), i = Math.floor(f);
      return TT[i] + (TT[i + 1] - TT[i]) * (f - i);
    } : top0;
    const runs = [];
    {
      let u = 0;
      for (const g of (o.openings || []).slice().sort((p, q) => p[0] - q[0])) {
        if (g[0] > u) runs.push([u, Math.min(len, g[0])]);
        u = Math.max(u, g[1]);
      }
      if (u < len) runs.push([u, len]);
    }
    const runAt = (u) => runs.find((r) => u >= r[0] && u <= r[1]) || null;
    const runSd = (u) => {
      let d = 1e9;
      for (const r of runs) d = Math.min(d, Math.max(r[0] - u, u - r[1]));
      return d;
    };
    const world = (u, v, w) => {
      const q = path.at(u);
      return [q.p[0] + q.n[0] * w, y0 + v, q.p[1] + q.n[1] * w];
    };
    const brick = (i, c) => {
      if (c < 0 || c >= courses) return null;
      const off = c % 2 ? pl / 2 : 0, uc = i * pl - off + pl / 2, run = runAt(Math.max(0, Math.min(len, uc)));
      if (!run || uc + bl / 2 < run[0] + 0.02 || uc - bl / 2 > run[1] - 0.02) return null;
      const vc = c * ph + gap + bh / 2, hr = hash(i, c, sd0);
      if (vc + bh / 2 > top(uc) + 0.01 || hr < miss) return null;
      const lo = Math.max(run[0], uc - bl / 2), hi = Math.min(run[1], uc + bl / 2), mid = (lo + hi) / 2;
      return {
        u: mid + (hash(i, c, sd0 + 1) - 0.5) * jit,
        v: vc + (hash(i, c, sd0 + 2) - 0.5) * jit * 0.5,
        w: (hash(i, c, sd0 + 3) - 0.5) * jit * 2,
        hx: (hi - lo) / 2 - (hash(i, c, sd0 + 4) - 0.5) * jit,
        hy: bh / 2,
        hz: th
      };
    };
    const sd = (x, y, z) => {
      const L = path.local(x, z), v = y - y0;
      if (!L) return Math.max(0.05, REACH - th, Math.abs(v - h / 2) - h / 2);
      const [u, w] = L, c0 = Math.floor((v - gap) / ph);
      let d = 1e9;
      for (let c = c0 - 1; c <= c0 + 1; c++) {
        const off = c % 2 ? pl / 2 : 0, i0 = Math.floor((u + off) / pl);
        for (let i = i0 - 1; i <= i0 + 1; i++) {
          const B = brick(i, c);
          if (!B) continue;
          const q = rbox(u - B.u, v - B.v, w - B.w, B.hx, B.hy, B.hz, rd);
          if (q < d) d = q;
        }
      }
      if (d < 1e8) return d;
      return path.straight ? Math.max(0.05, rbox(u - len / 2, v - h / 2, w, len / 2, h / 2, th)) : Math.max(0.05, runSd(u), Math.abs(w) - th, Math.abs(v - h / 2) - h / 2);
    };
    let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9;
    for (const q of path.pts) {
      mnx = Math.min(mnx, q[0]);
      mxx = Math.max(mxx, q[0]);
      mnz = Math.min(mnz, q[1]);
      mxz = Math.max(mxz, q[1]);
    }
    const bc = [(mnx + mxx) / 2, y0 + h / 2, (mnz + mxz) / 2], br = path.straight ? Math.hypot(len / 2, h / 2, th) + 0.1 : Math.hypot((mxx - mnx) / 2, h / 2, (mxz - mnz) / 2) + th + 0.1;
    const wall = S.add(
      {
        bc,
        br,
        sd,
        sample(f) {
          const res = this.res;
          for (let c = 0; c < courses; c++)
            for (let i = -1; i <= Math.ceil(len / pl) + 1; i++) {
              const B = brick(i, c);
              if (!B) continue;
              const up = brick(i, c + 1) || brick(i + (c % 2 ? 1 : 0), c + 1) || brick(i - (c % 2 ? 0 : 1), c + 1);
              for (let p = -B.hx; p <= B.hx; p += res * 0.8)
                for (let q = -B.hy; q <= B.hy; q += res * 0.8)
                  for (const sw of [-1, 1]) f(...world(B.u + p, B.v + q, B.w + sw * B.hz));
              const faces = [];
              if (!up) faces.push("top");
              if (!brick(i - 1, c)) faces.push("left");
              if (!brick(i + 1, c)) faces.push("right");
              for (const fc of faces)
                for (let p = -1; p <= 1; p += res / Math.max(B.hx, B.hz) / 1.3)
                  for (let q = -1; q <= 1; q += res / Math.max(B.hy, B.hz) / 1.3) {
                    const uu = fc === "top" ? B.u + p * B.hx : B.u + (fc === "left" ? -B.hx : B.hx), vv = fc === "top" ? B.v + B.hy : B.v + q * B.hy, ww = B.w + (fc === "top" ? q : p) * B.hz;
                    f(...world(uu, vv, ww));
                  }
            }
        }
      },
      mat,
      { res: o.res, reach: rd + jit, tag: o.tag, born: o.born }
    );
    const core = S.add(
      {
        bc,
        br,
        sd: (x, y, z) => {
          const L = path.local(x, z), v = y - y0;
          if (!L) return Math.max(0.05, REACH - th);
          const [u, w] = L;
          if (path.straight && runs.length === 1)
            return Math.max(
              rbox(u - len / 2, v - h / 2, w, len / 2 - 0.01, h / 2, th - gap * 0.8, 0.01),
              v - top(Math.max(0, Math.min(len, u))) + bh * 0.6
            );
          return Math.max(
            runSd(u) + 0.01,
            Math.abs(w) - (th - gap * 0.8),
            Math.abs(v - h / 2) - h / 2,
            v - top(Math.max(0, Math.min(len, u))) + bh * 0.6
          );
        },
        sample(f) {
          const res = this.res;
          for (const r of runs)
            for (let u = r[0]; u <= r[1]; u += res)
              for (let v = 0; v <= Math.min(h, top(u)); v += res)
                for (const sw of [-1, 1]) f(...world(u, v, sw * (th - gap)));
        }
      },
      o.mortar || mat,
      { res: o.res, reach: 0.02 }
    );
    const fallen = [];
    if (o.rubble) {
      const tp = S.template((S2) => S2.box([0, 0, 0], [bl / 2, bh / 2, th * 0.6], mat, { res: 0.05 }), { res: 0.05 }), gone = [];
      for (let c = 0; c < courses; c++)
        for (let i = 0; i <= Math.ceil(len / pl); i++) {
          const off = c % 2 ? pl / 2 : 0, uc = i * pl - off + pl / 2, vc = c * ph + bh / 2;
          if (uc < 0 || uc > len || !runAt(uc)) continue;
          if (vc + bh / 2 > top(uc) + 0.01 && vc < h) gone.push(uc);
        }
      if (o.ground) S.ready();
      for (const uc of gone) {
        if (R() > o.rubble) continue;
        const side = R() < 0.5 ? -1 : 1, out = th + 0.1 + R() * 0.9, x = world(uc + (R() - 0.5) * 0.4, 0, side * out)[0], z = world(uc + (R() - 0.5) * 0.4, 0, side * out)[2], gy = o.ground ? o.ground(x, z) : y0;
        fallen.push([x, gy, z]);
        S.place(tp, [x, gy + bh * 0.35, z], {
          yaw: R() * 6.28,
          up: norm([(R() - 0.5) * 0.6, 1, (R() - 0.5) * 0.6]),
          lean: 1,
          solid: false
        });
      }
    }
    return { wall, core, fallen, sd, len, at: path.at, local: path.local };
  };
  F.steps = (S, mat, o) => {
    o = o || {};
    const R = dice(o.seed || 109), at = o.at, D = norm([o.dir ? o.dir[0] : 0, 0, o.dir ? o.dir[2] : -1]), Wd = [-D[2], 0, D[0]], n = o.n || 5, rise = o.rise || 0.2, run = o.run || 0.36, wd = (o.width || 1.4) / 2, jit = o.jitter === void 0 ? 0.02 : o.jitter, out = [];
    for (let k = 0; k < n; k++) {
      const depth = run * (k === n - 1 ? 1 : 1.6), c = [
        at[0] + D[0] * (run * k + depth / 2) + Wd[0] * (R() - 0.5) * jit * 2,
        at[1] + rise * k + rise / 2 + (R() - 0.5) * jit,
        at[2] + D[2] * (run * k + depth / 2) + Wd[2] * (R() - 0.5) * jit * 2
      ], tw = (R() - 0.5) * 0.04, ax = [
        [Wd[0] * Math.cos(tw) + D[0] * Math.sin(tw), 0, Wd[2] * Math.cos(tw) + D[2] * Math.sin(tw)],
        [0, 1, 0],
        [D[0] * Math.cos(tw) - Wd[0] * Math.sin(tw), 0, D[2] * Math.cos(tw) - Wd[2] * Math.sin(tw)]
      ], hx = wd * (0.97 + 0.06 * R()), hy = rise / 2, hz = depth / 2;
      out.push(
        S.convex(
          c,
          [
            { n: [1, 0, 0], d: hx },
            { n: [-1, 0, 0], d: hx },
            { n: [0, 1, 0], d: hy },
            { n: [0, -1, 0], d: hy },
            { n: [0, 0, 1], d: hz },
            { n: [0, 0, -1], d: hz },
            // the nose worn back
            {
              n: norm([0, 1, -1]),
              d: Math.SQRT1_2 * (hy + hz) - (o.wear === void 0 ? 0.035 : o.wear) * (0.6 + 0.8 * R())
            }
          ],
          mat,
          { ax, rd: o.round === void 0 ? 0.03 : o.round, res: o.res, tag: o.tag, born: o.born }
        )
      );
    }
    return out;
  };
  F.fence = (S, mat, o) => {
    o = o || {};
    const R = dice(o.seed || 113), ground = o.ground || (() => 0), h = o.h || 0.9, r = o.r || 0.05, rr = o.rr || 0.025, rails = o.rails || [0.35, 0.72], posts = K.curve.place(o.path, { gap: o.gap || 0.9 }), tops = [], out = [];
    for (const pp of posts) {
      const x = pp.p[0], z = pp.p[2], y = ground(x, z), lean = o.lean === void 0 ? 0.12 : o.lean, l = [(R() - 0.5) * lean * 2, 0, (R() - 0.5) * lean * 2], hh = h * (0.9 + 0.2 * R()), topP = [x + l[0] * hh, y + hh, z + l[2] * hh];
      out.push(S.tube([[x, y - 0.15, z], topP], r, r * 0.9, mat, { res: o.res, tag: o.tag }));
      tops.push({ base: [x, y, z], top: topP, hh });
    }
    for (let k = 0; k + 1 < tops.length; k++)
      for (const fy of rails) {
        if (R() < (o.broken === void 0 ? 0.15 : o.broken)) continue;
        const A = tops[k], B = tops[k + 1], at = (P, f) => [
          P.base[0] + (P.top[0] - P.base[0]) * (fy / P.hh),
          P.base[1] + fy * f,
          P.base[2] + (P.top[2] - P.base[2]) * (fy / P.hh)
        ], p0 = at(A, 1), p1 = at(B, 1), mid = [
          (p0[0] + p1[0]) / 2,
          (p0[1] + p1[1]) / 2 - (o.sag === void 0 ? 0.03 : o.sag),
          (p0[2] + p1[2]) / 2
        ];
        out.push(S.tube([p0, mid, p1], rr, rr, mat, { res: o.res, tag: o.tag }));
      }
    return out;
  };
})(KIT);
