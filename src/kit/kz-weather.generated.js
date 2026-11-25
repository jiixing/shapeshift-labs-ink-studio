// Generated from src/kit/kz-weather.ts by npm run build:src. Do not edit.
(function(K) {
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const dice = (seed) => {
    let s = Math.floor(Math.abs(seed) * 7919) % 2147483646 + 1;
    return () => ((s = s * 16807 % 2147483647) - 1) / 2147483646;
  };
  K.weather = {
    fall(B, o) {
      o = o || {};
      const R = dice(o.seed || 61), kind = o.kind || "snow", top = o.top === void 0 ? 7 : o.top, ground = o.ground || (() => 0), cols = o.cols || [3], rad = o.rad || 6, box = o.box || [-rad, rad, -rad, rad], size = o.size || (kind === "rain" ? 0.012 : kind === "leaf" ? 0.07 : 0.025), speed = o.speed || (kind === "rain" ? 9 : kind === "leaf" ? 0.9 : 0.6), sway = o.sway === void 0 ? kind === "leaf" ? 0.35 : kind === "snow" ? 0.12 : 0 : o.sway, wind = o.wind || [0, 0];
      let laid = 0;
      for (let i = 0; i < (o.n || 300); i++) {
        const x = box[0] + (box[1] - box[0]) * R(), z = box[2] + (box[3] - box[2]) * R();
        if (o.rad && Math.hypot(x, z) > rad) continue;
        const h = top - ground(x, z);
        if (h <= 0.1) continue;
        const col = B.P[cols[Math.floor(R() * cols.length)]], an = kind === "rain" ? { k: 2, ph: R(), sp: speed * (0.9 + 0.2 * R()), rg: h, ex: 0, nd: true } : { k: 15, ph: R(), sp: speed * (0.7 + 0.6 * R()), rg: h, ex: sway * (0.6 + 0.8 * R()), nd: true };
        if (kind === "rain") {
          const ax = norm([wind[0] / speed, -1, wind[1] / speed]);
          B.stick(x, top, z, ax, o.len || 0.09, size, col, 1.1, an);
        } else if (kind === "leaf") {
          const a = R() * 6.28, nv = norm([Math.cos(a), 0.6 + R(), Math.sin(a)]);
          B.disc(x, top, z, nv, size, size * 0.2, col, 3, an);
        } else B.disc(x, top, z, [0, 0, 1], size, size, col, 2.2, an);
        laid++;
      }
      return laid;
    }
  };
  const F = K.form || (K.form = {});
  F.drifts = (S, o) => {
    o = o || {};
    S.ready();
    const box = o.box, cell = o.cell || 0.1, top = o.top === void 0 ? 8 : o.top, wind = o.wind ? ((l) => [o.wind[0] / l, o.wind[1] / l])(Math.hypot(o.wind[0], o.wind[1]) || 1) : [1, 0], depth = o.depth === void 0 ? 0.1 : o.depth, lee = o.lee === void 0 ? 0.7 : o.lee, reach = o.reach === void 0 ? 2.2 : o.reach, nx = Math.ceil((box[1] - box[0]) / cell) + 1, nz = Math.ceil((box[3] - box[2]) / cell) + 1, Y = new Float32Array(nx * nz), Dp = new Float32Array(nx * nz), sdf = S.sdf;
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const x = box[0] + i * cell, z = box[2] + j * cell;
        let y = top, k = 0;
        for (; k < 200; k++) {
          const d = sdf(x, y, z);
          if (d < 0.01) break;
          y -= Math.max(0.01, d * 0.9);
          if (y < (o.bottom === void 0 ? -6 : o.bottom)) break;
        }
        Y[j * nx + i] = k >= 200 || y < (o.bottom === void 0 ? -6 : o.bottom) ? -99 : y;
      }
    const at = (A, x, z) => {
      const fi = (x - box[0]) / cell, fj = (z - box[2]) / cell;
      if (fi < 0 || fj < 0 || fi > nx - 1.001 || fj > nz - 1.001) return -99;
      const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, q = j * nx + i;
      return A[q] * (1 - u) * (1 - v) + A[q + 1] * u * (1 - v) + A[q + nx] * (1 - u) * v + A[q + nx + 1] * u * v;
    };
    const raw = (i, j) => Y[Math.max(0, Math.min(nz - 1, j)) * nx + Math.max(0, Math.min(nx - 1, i))];
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const y0 = Y[j * nx + i];
        if (y0 < -90) continue;
        let shel = 0, front = 0;
        for (let d = cell; d <= reach; d += cell) {
          const up = raw(Math.round(i - wind[0] * d / cell), Math.round(j - wind[1] * d / cell)) - y0, dn = raw(Math.round(i + wind[0] * d / cell), Math.round(j + wind[1] * d / cell)) - y0;
          if (up > 0.05)
            shel = Math.max(shel, Math.min(1, up / 1.2) * Math.max(0, 1 - d / Math.min(reach, up * 4 + 0.6)));
          if (dn > 0.15 && d < 0.6) front = Math.max(front, (1 - d / 0.6) * 0.5);
        }
        Dp[j * nx + i] = (depth + lee * (shel * shel * (3 - 2 * shel)) + depth * front) * (o.less ? 1 - o.less(box[0] + i * cell, box[2] + j * cell) : 1);
      }
    const tmp = new Float32Array(Dp.length);
    for (let p2 = 0; p2 < (o.smooth === void 0 ? 3 : o.smooth); p2++) {
      tmp.set(Dp);
      for (let j = 1; j < nz - 1; j++)
        for (let i = 1; i < nx - 1; i++) {
          const q = j * nx + i;
          if (Y[q] < -90) continue;
          let s = 0, w = 0;
          for (const [a, b] of [
            [0, 0],
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ]) {
            const r = q + b * nx + a;
            if (Y[r] < -90 || Math.abs(Y[r] - Y[q]) > 0.25) continue;
            s += tmp[r];
            w++;
          }
          Dp[q] = s / w;
        }
    }
    const surf = (x, z) => {
      const fi = (x - box[0]) / cell, fj = (z - box[2]) / cell;
      if (fi < 0 || fj < 0 || fi > nx - 1.001 || fj > nz - 1.001) return -99;
      const i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, q = j * nx + i, c = [Y[q], Y[q + 1], Y[q + nx], Y[q + nx + 1]], w = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v], near = c[Math.round(u) + Math.round(v) * 2];
      if (near < -90) return -99;
      let s = 0, ws = 0;
      for (let k = 0; k < 4; k++)
        if (c[k] > -90 && Math.abs(c[k] - near) < 0.2) {
          s += c[k] * w[k];
          ws += w[k];
        }
      return s / ws;
    };
    dep = (x, z) => at(Dp, x, z), topAt = (x, z) => surf(x, z) + dep(x, z), bc = [(box[0] + box[1]) / 2, 0, (box[2] + box[3]) / 2];
    const p = {
      bc,
      br: Math.hypot(box[1] - box[0], 12, box[3] - box[2]) / 2,
      top: topAt,
      depth: dep,
      // the snow lies between the surface and its own top, as a height field (so it rests on things, never hangs under them)
      sd: (x, y, z) => {
        const s = surf(x, z);
        if (s < -90) return 1;
        const t = s + dep(x, z);
        return Math.max(y - t, s - 0.4 - y) * 0.7;
      },
      sample(f) {
        const res = this.res;
        for (let x = box[0]; x <= box[1]; x += res * 0.8)
          for (let z = box[2]; z <= box[3]; z += res * 0.8) {
            const s = surf(x, z);
            if (s < -90) continue;
            const d = dep(x, z);
            if (d < 0.015) continue;
            f(x, s + d, z);
            const s2 = surf(x + res, z) + dep(x + res, z);
            if (Math.abs(s2 - (s + d)) > res)
              for (let y = Math.min(s2, s + d); y < Math.max(s2, s + d); y += res * 0.7) f(x + res * 0.5, y, z);
          }
      }
    };
    return S.add(p, o.mat, { res: o.res, reach: 0.1, born: o.born, tag: o.tag });
  };
  F.frost = (B, o) => {
    o = o || {};
    const R = dice(o.seed || 67), n = norm(o.n || [0, 0, 1]), up0 = o.up || [0, 1, 0], ud = up0[0] * n[0] + up0[1] * n[1] + up0[2] * n[2], V = norm([up0[0] - n[0] * ud, up0[1] - n[1] * ud, up0[2] - n[2] * ud]), U = cross(V, n), size = o.size || 0.6, step = o.step || 0.025, ang = (o.angle === void 0 ? 60 : o.angle) * Math.PI / 180, cols = o.cols || [3], w = o.width || 0.012, gr = o.grow || null, on = (p) => {
      if (!o.sdf) return p;
      let q = p;
      for (let k = 0; k < 3; k++) {
        const d = o.sdf(q[0], q[1], q[2]);
        q = [q[0] - n[0] * d, q[1] - n[1] * d, q[2] - n[2] * d];
      }
      return [q[0] + n[0] * 6e-3, q[1] + n[1] * 6e-3, q[2] + n[2] * 6e-3];
    };
    let laid = 0;
    const lay = (u, v, k, dir) => {
      if (Math.hypot(u, v) > size) return false;
      const p = on([o.at[0] + U[0] * u + V[0] * v, o.at[1] + U[1] * u + V[1] * v, o.at[2] + U[2] * u + V[2] * v]), ax = norm([
        U[0] * Math.cos(dir) + V[0] * Math.sin(dir),
        U[1] * Math.cos(dir) + V[1] * Math.sin(dir),
        U[2] * Math.cos(dir) + V[2] * Math.sin(dir)
      ]), c = B.P[cols[Math.min(cols.length - 1, Math.floor(R() * cols.length * (1 - k / (o.steps || 26) * 0.3)))]];
      if (gr) B.born(gr.start + k * gr.per);
      B.stick(p[0], p[1], p[2], ax, step * 0.65, w, c, 3, { nd: true });
      laid++;
      return true;
    };
    const grow = (u, v, dir, len, k0, depth) => {
      let k = k0;
      for (let s = 0; s < len; s++, k++) {
        dir += (R() - 0.5) * 0.15;
        u += Math.cos(dir) * step;
        v += Math.sin(dir) * step;
        if (!lay(u, v, k, dir)) return;
        if (depth < 3 && s > 1 && s % (depth ? 2 : 3) === 0) {
          for (const sg of [-1, 1])
            if (R() < 0.85) grow(u, v, dir + sg * ang, Math.floor((len - s) * (depth ? 0.45 : 0.55)), k + 1, depth + 1);
        }
      }
    };
    for (let s = 0; s < (o.seeds || 3); s++) {
      const a = R() * 6.28, r = R() * size * 0.5;
      grow(Math.cos(a) * r, Math.sin(a) * r, R() * 6.28, o.steps || 26, 0, 0);
    }
    if (gr) B.born(null);
    return laid;
  };
})(KIT);
