// Generated from src/kit/ki-deform.ts by npm run build:src. Do not edit.
(function(K) {
  const V = K.V, M = K.M, clamp = K.clamp, c01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x, smooth = (x) => {
    x = c01(x);
    return x * x * (3 - 2 * x);
  };
  const D = K.deform = {};
  const frameOf = (up, side) => {
    const u = V.norm(up || [0, 1, 0]);
    let ax = side ? V.sub(side, V.mul(u, V.dot(side, u))) : Math.abs(u[1]) > 0.9 ? [1, 0, 0] : V.cross([0, 1, 0], u);
    ax = V.norm(ax, [1, 0, 0]);
    return { ax, up: u, az: V.cross(ax, u) };
  };
  const local = (f, base, p) => {
    const d = V.sub(p, base);
    return [V.dot(d, f.ax), V.dot(d, f.up), V.dot(d, f.az)];
  }, world = (f, base, q) => [
    base[0] + f.ax[0] * q[0] + f.up[0] * q[1] + f.az[0] * q[2],
    base[1] + f.ax[1] * q[0] + f.up[1] * q[1] + f.az[1] * q[2],
    base[2] + f.ax[2] * q[0] + f.up[2] * q[1] + f.az[2] * q[2]
  ];
  D.body = (o) => {
    const f = frameOf(o.up, o.side), map = (p) => {
      const half = map.height / 2, q = local(f, map.base, p), y = q[1] - half, u = y / half, w = map.waist, a = 1 - w, s = Math.max(0.05, map.stretch), nrm = 1 / Math.sqrt(s * (a * a + 2 * a * w / 3 + w * w / 5)), r = (a + w * u * u) * nrm, lean = half * (u + 1) * (u + 1) * 0.25;
      return world(f, map.base, [q[0] * r + map.bend[0] * lean, (y + half) * s, q[2] * r + map.bend[1] * lean]);
    };
    map.base = o.base || [0, 0, 0];
    map.height = o.height || 1;
    map.stretch = o.stretch === void 0 ? 1 : o.stretch;
    map.waist = o.waist || 0;
    map.bend = o.bend || [0, 0];
    return map;
  };
  D.squash = (pivot, axis, s, keep) => {
    const map = (p) => V.add(map.pivot, M.app(M.stretch(map.axis, map.s, map.keep), V.sub(p, map.pivot)));
    map.pivot = pivot;
    map.axis = V.norm(axis || [0, 1, 0]);
    map.s = s === void 0 ? 1 : s;
    map.keep = keep !== false;
    return map;
  };
  D.spinePoint = (pts, t) => {
    const v = c01(t) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(v)), u = v - i, p = pts[i], q = pts[i + 1], a = pts[i - 1] || V.sub(V.mul(p, 2), q), b = pts[i + 2] || V.sub(V.mul(q, 2), p);
    return [0, 1, 2].map(
      (k) => 0.5 * (2 * p[k] + (-a[k] + q[k]) * u + (2 * a[k] - 5 * p[k] + 4 * q[k] - b[k]) * u * u + (-a[k] + 3 * p[k] - 3 * q[k] + b[k]) * u * u * u)
    );
  };
  const atList = (vals, t) => {
    const v = t * (vals.length - 1), i = Math.min(vals.length - 2, Math.floor(v));
    return vals[i] + (vals[i + 1] - vals[i]) * (v - i);
  };
  D.noodle = (o) => {
    const from = o.from, to = o.to, L0 = V.dist(from, to), dir = V.norm(V.sub(to, from)), fr = frameOf(dir, o.right), right0 = fr.ax, back0 = V.cross(right0, dir), N = o.samples || 64, n = o.handles || (o.points ? o.points.length : 4);
    let built = null;
    const build = () => {
      const pts = [], len = [0], frames = [];
      for (let i = 0; i <= N; i++) pts.push(D.spinePoint(map.points, i / N));
      for (let i = 1; i <= N; i++) len.push(len[i - 1] + V.dist(pts[i], pts[i - 1]));
      let right = right0, old = dir;
      for (let i = 0; i <= N; i++) {
        const tan = V.norm(V.sub(pts[Math.min(N, i + 1)], pts[Math.max(0, i - 1)]), old), ax = V.cross(old, tan), s = V.len(ax), c = clamp(V.dot(old, tan), -1, 1);
        if (s > 1e-8) {
          const k = V.mul(ax, 1 / s);
          right = V.add(V.add(V.mul(right, c), V.mul(V.cross(k, right), s)), V.mul(k, V.dot(k, right) * (1 - c)));
        }
        right = V.norm(V.sub(right, V.mul(tan, V.dot(right, tan))), right0);
        frames.push({ right, back: V.norm(V.cross(right, tan), back0), tan });
        old = tan;
      }
      return { pts, len, frames, length: Math.max(1e-5, len[N]) };
    };
    const map = (p) => {
      const b = built || (built = build()), d = V.sub(p, from), along = V.dot(d, dir), u = c01(along / L0), x = V.dot(d, right0), z = V.dot(d, back0), dist = u * b.length;
      let lo = 0, hi = N;
      while (hi - lo > 1) {
        const mid = lo + hi >> 1;
        if (b.len[mid] < dist) lo = mid;
        else hi = mid;
      }
      const f = (dist - b.len[lo]) / Math.max(1e-10, b.len[hi] - b.len[lo]), t = (lo + f) / N, A = b.frames[lo], B = b.frames[hi], R = V.norm(V.lerp(A.right, B.right, f)), Bk = V.norm(V.lerp(A.back, B.back, f)), T = V.cross(Bk, R), comp = map.volume ? Math.sqrt(Math.max(0.05, b.length * map.stretch / L0)) : 1, ang = (atList(map.twists, t) + map.turn) * Math.PI / 180, r = atList(map.widths, t) * map.thickness / comp, cs = Math.cos(ang), sn = Math.sin(ang), lx = (x * cs + z * sn) * r, lz = (-x * sn + z * cs) * r, end = (along - u * L0) * map.stretch, c = V.lerp(b.pts[lo], b.pts[hi], f), an = map.points[0];
      return [
        an[0] + (c[0] - an[0]) * map.stretch + R[0] * lx + Bk[0] * lz + T[0] * end,
        an[1] + (c[1] - an[1]) * map.stretch + R[1] * lx + Bk[1] * lz + T[1] * end,
        an[2] + (c[2] - an[2]) * map.stretch + R[2] * lx + Bk[2] * lz + T[2] * end
      ];
    };
    map.rest = Array.from({ length: n }, (_, i) => V.lerp(from, to, i / (n - 1)));
    map.points = o.points ? o.points.map((p) => p.slice()) : map.rest.map((p) => p.slice());
    map.widths = o.widths || map.points.map(() => 1);
    map.twists = o.twists || map.points.map(() => 0);
    map.stretch = o.stretch === void 0 ? 1 : o.stretch;
    map.thickness = o.thickness === void 0 ? 1 : o.thickness;
    map.turn = o.turn || 0;
    map.volume = o.volume !== false;
    map.set = (pose) => {
      if (pose) {
        for (const k of ["points", "widths", "twists", "stretch", "thickness", "turn"])
          if (pose[k] !== void 0)
            map[k] = pose[k];
      }
      built = null;
      return map;
    };
    map.pose = () => ({
      points: map.points.map((p) => p.slice()),
      widths: map.widths.slice(),
      twists: map.twists.slice(),
      stretch: map.stretch,
      thickness: map.thickness,
      turn: map.turn
    });
    map.span = () => (built || (built = build())).length;
    return map;
  };
  D.noodleAt = (n, keys, time, o) => {
    o = o || {};
    const dur = o.dur || (keys.length ? keys[keys.length - 1].t : 1), wrap = (t) => o.loop ? (t % dur + dur) % dur : clamp(t, 0, dur), mix = (a, b, t) => Array.isArray(a) ? a.map((v, i) => mix(v, b[i], t)) : a + (b - a) * t, rest = n.pose ? Object.assign(n.pose(), {
      points: n.rest.map((p) => p.slice())
    }) : n, sample = (t) => {
      t = wrap(t);
      let a = { t: 0, v: rest, ease: "smooth" }, b = null;
      for (const k of keys) {
        if (k.t > t) {
          b = k;
          break;
        }
        a = k;
      }
      if (!b) return a.v;
      const u = a.ease === "step" ? 0 : K.anim.ease(c01((t - a.t) / (b.t - a.t)), a.ease || "smooth"), out2 = {};
      for (const k in rest)
        out2[k] = mix(
          a.v[k] === void 0 ? rest[k] : a.v[k],
          b.v[k] === void 0 ? rest[k] : b.v[k],
          u
        );
      return out2;
    }, out = JSON.parse(JSON.stringify(sample(time))), lag = o.lag || 0, spring = o.spring || 0, cnt = out.points.length;
    if (lag > 0)
      for (let i = 1; i < cnt; i++) {
        const delay = lag * i / (cnt - 1), a = sample(time - delay), b = sample(time - delay * 1.65);
        out.points[i] = a.points[i].map((v, k) => v + (v - b.points[i][k]) * spring);
        out.twists[i] = a.twists[i] + (a.twists[i] - b.twists[i]) * spring;
        out.widths[i] = clamp(a.widths[i] + (a.widths[i] - b.widths[i]) * spring, 0.03, 8);
      }
    return out;
  };
  D.fold = (o) => {
    const X = V.norm(o.x || [1, 0, 0]), Y = V.norm(o.y || [0, 1, 0]), Z = V.cross(X, Y), f = { ax: X, up: Y, az: Z }, map = (p) => {
      const q = local(f, map.origin, p), c = Math.cos(map.axis), s = Math.sin(map.axis), along = q[0] * c + q[1] * s, d = -q[0] * s + q[1] * c - map.offset, z = q[2], angle = map.angle;
      if (d <= 0 || Math.abs(angle) < 1e-7) return p.slice();
      let y, h, t;
      if (map.width < 1e-6) {
        t = angle;
        y = d * Math.cos(t);
        h = d * Math.sin(t);
      } else {
        const a = Math.min(d, map.width), rad = map.width / angle;
        t = angle * a / map.width;
        y = rad * Math.sin(t) + Math.max(0, d - map.width) * Math.cos(t);
        h = rad * (1 - Math.cos(t)) + Math.max(0, d - map.width) * Math.sin(t);
      }
      y += map.offset - z * Math.sin(t);
      h += z * Math.cos(t);
      return world(f, map.origin, [along * c - y * s, along * s + y * c, h]);
    };
    map.origin = o.origin || [0, 0, 0];
    map.angle = o.angle || 0;
    map.axis = o.axis || 0;
    map.offset = o.offset || 0;
    map.width = o.width === void 0 ? 0.4 : o.width;
    return map;
  };
  D.lattice = (box, n) => {
    n = n || [2, 2, 2];
    const lo = box.min, hi = box.max, cnt = n[0] * n[1] * n[2], rest = new Float32Array(cnt * 3), idx = (i, j, k) => (i + n[0] * (j + n[1] * k)) * 3;
    for (let k = 0; k < n[2]; k++)
      for (let j = 0; j < n[1]; j++)
        for (let i = 0; i < n[0]; i++) {
          const q = idx(i, j, k);
          rest[q] = lo[0] + (hi[0] - lo[0]) * i / (n[0] - 1);
          rest[q + 1] = lo[1] + (hi[1] - lo[1]) * j / (n[1] - 1);
          rest[q + 2] = lo[2] + (hi[2] - lo[2]) * k / (n[2] - 1);
        }
    const map = (p) => {
      const g = [0, 1, 2].map((a) => clamp((p[a] - lo[a]) / (hi[a] - lo[a] || 1) * (n[a] - 1), 0, n[a] - 1)), i0 = g.map((v, a) => Math.min(n[a] - 2, Math.floor(v))), f = g.map((v, a) => v - i0[a]), out = p.slice(), P = map.pts;
      for (let c = 0; c < 8; c++) {
        const di = c & 1, dj = c >> 1 & 1, dk = c >> 2 & 1, w = (di ? f[0] : 1 - f[0]) * (dj ? f[1] : 1 - f[1]) * (dk ? f[2] : 1 - f[2]), q = idx(i0[0] + di, i0[1] + dj, i0[2] + dk);
        out[0] += w * (P[q] - rest[q]);
        out[1] += w * (P[q + 1] - rest[q + 1]);
        out[2] += w * (P[q + 2] - rest[q + 2]);
      }
      return out;
    };
    map.n = n;
    map.restPts = rest;
    map.pts = rest.slice();
    map.handle = (i, j, k) => {
      const q = idx(i, j, k);
      return [map.pts[q], map.pts[q + 1], map.pts[q + 2]];
    };
    map.set = (i, j, k, p) => {
      const q = idx(i, j, k);
      map.pts[q] = p[0];
      map.pts[q + 1] = p[1];
      map.pts[q + 2] = p[2];
      return map;
    };
    map.move = (i, j, k, d) => {
      const q = idx(i, j, k);
      map.pts[q] = rest[q] + d[0];
      map.pts[q + 1] = rest[q + 1] + d[1];
      map.pts[q + 2] = rest[q + 2] + d[2];
      return map;
    };
    map.reset = () => {
      map.pts.set(rest);
      return map;
    };
    map.mix = (a, b, w) => {
      for (let q = 0; q < cnt * 3; q++) map.pts[q] = a[q] + (b[q] - a[q]) * w;
      return map;
    };
    return map;
  };
  D.morph = (o) => {
    const f = frameOf(o.up, o.side), map = (p) => {
      const H = map.height, q = local(f, map.base, p), u = c01(q[1] / H), sc = (1 + map.inflate * Math.sin(Math.PI * u)) * (1 + map.taper * (2 * u - 1)), tw = map.twist * u, ct = Math.cos(tw), st = Math.sin(tw);
      let x = (q[0] * ct + q[2] * st) * sc, y = q[1];
      const z = (-q[0] * st + q[2] * ct) * sc;
      if (Math.abs(map.arc) > 1e-6) {
        const h = clamp(y, 0, H), th = map.arc * h / H, R = H / map.arc, over = y - h, cx = R - (R - x) * Math.cos(th), cy = (R - x) * Math.sin(th);
        x = cx + over * Math.sin(th);
        y = cy + over * Math.cos(th);
      }
      return world(f, map.base, [x, y, z]);
    };
    map.base = o.base || [0, 0, 0];
    map.height = o.height || 1;
    map.inflate = o.inflate || 0;
    map.taper = o.taper || 0;
    map.arc = o.arc || 0;
    map.twist = o.twist || 0;
    return map;
  };
  D.smear = (o) => {
    const map = (p) => {
      if (!map.len) return p.slice();
      const w = Math.pow(c01(V.dot(V.sub(map.front, p), map.dir) / map.extent), map.power);
      return V.mad(p, map.dir, -map.len * w);
    };
    map.dir = V.norm(o.dir || [1, 0, 0]);
    map.len = o.len || o.length || 0;
    map.front = o.front || [0, 0, 0];
    map.extent = o.extent || 1;
    map.power = o.power === void 0 ? 1.6 : o.power;
    map.from = (vel, front) => {
      const sp = V.len(vel), th = o.threshold === void 0 ? 4 : o.threshold;
      map.dir = sp > 1e-6 ? V.mul(vel, 1 / sp) : map.dir;
      map.len = Math.min(
        o.max === void 0 ? 0.6 : o.max,
        Math.max(0, sp - th) * (o.gain === void 0 ? 0.05 : o.gain)
      );
      if (front) map.front = front;
      return map;
    };
    return map;
  };
  D.burst = (o) => {
    const pcs = o.pieces.map((c) => c.slice(0, 3)), from = o.from || pcs.reduce((a, c) => V.mad(a, c, 1 / pcs.length), [0, 0, 0]), speed = o.speed === void 0 ? 1.6 : o.speed, up = o.up === void 0 ? 0.8 : o.up, g = o.gravity === void 0 ? -4 : o.gravity, drag = o.drag === void 0 ? 1.2 : o.drag, shrink = o.shrink === void 0 ? 0 : o.shrink, life = o.life || 1, vary = o.vary === void 0 ? 1 : o.vary, vel = pcs.map((c, i) => {
      const h = Math.abs(Math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1, h2 = Math.abs(Math.sin(i * 78.233 + 1.7) * 12543.123) % 1, out = V.sub(c, from), flat = Math.hypot(out[0], out[2]) > 1e-6 ? V.norm([out[0], 0, out[2]]) : [Math.cos(h2 * 6.283), 0, Math.sin(h2 * 6.283)];
      return V.mul(
        V.norm([flat[0], up + 0.4 * vary * (h2 - 0.5), flat[2]]),
        speed * (1 - 0.4 * vary + 0.8 * vary * h)
      );
    });
    const map = (p) => {
      const t = map.t;
      if (!(t > 0)) return p.slice();
      let best = 0, bd = 1e18;
      for (let i = 0; i < pcs.length; i++) {
        const c2 = pcs[i], dd = (p[0] - c2[0]) ** 2 + (p[1] - c2[1]) ** 2 + (p[2] - c2[2]) ** 2;
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      }
      const c = pcs[best], v = vel[best], k = drag > 0 ? (1 - Math.exp(-drag * t)) / drag : t, s = Math.max(0, 1 - (1 - shrink) * Math.pow(Math.min(1, t / life), 1.5));
      return [
        c[0] + (p[0] - c[0]) * s + v[0] * k,
        c[1] + (p[1] - c[1]) * s + v[1] * k + 0.5 * g * t * t,
        c[2] + (p[2] - c[2]) * s + v[2] * k
      ];
    };
    map.t = 0;
    map.pieces = pcs;
    return map;
  };
  D.EMOTES = [
    "shiver",
    "spring",
    "curl",
    "heartbeat",
    "twinkle",
    "sprout",
    "droplet",
    "accuse",
    "rumble",
    "steam",
    "droop",
    "notes",
    "sleep",
    "dots",
    "spiral",
    "broken",
    "crown",
    "ink",
    "sniff",
    "rattle",
    "tap"
  ];
  D.emoteField = (motion, x, y, t, intensity) => {
    const s = Math.sin, c = Math.cos, top = y + 0.5;
    let dx = 0, dy = 0;
    switch (motion) {
      case "shiver":
        dx = 0.035 * s(t * 29) * (0.4 + top);
        dy = 0.018 * s(t * 23 + x * 8) * top;
        break;
      case "spring":
        dy = 0.1 * s(t * 15) * Math.exp(-t * 2) * top;
        dx = -x * 0.14 * s(t * 15) * Math.exp(-t * 2);
        break;
      case "curl":
        dx = 0.075 * s(t * 4) * top * top;
        dy = 0.035 * s(t * 4 + x * 4) * top;
        break;
      case "heartbeat": {
        const beat = Math.pow(Math.max(0, s(t * 6)), 5) + 0.4 * Math.pow(Math.max(0, s(t * 6 - 1.3)), 8);
        dx = x * 0.13 * beat;
        dy = y * 0.09 * beat + 0.025 * s(x * 6) * beat;
        break;
      }
      case "twinkle":
        dx = 0.045 * s(t * 5 + x * 9) * x;
        dy = 0.055 * s(t * 5 + x * 8) * top;
        break;
      case "sprout":
        dx = 0.07 * s(t * 5) * top * top;
        dy = 0.04 * s(t * 5 + x * 5) * top;
        break;
      case "droplet":
        dx = -x * 0.12 * s(t * 5);
        dy = 0.07 * s(t * 5) * top * top;
        break;
      case "accuse": {
        const jab = Math.pow(Math.max(0, s(t * 8)), 4);
        dx = 0.065 * jab * top;
        dy = 0.035 * jab + 0.012 * s(t * 25) * top;
        break;
      }
      case "rumble":
        dx = 0.025 * s(t * 35) * top;
        dy = 0.045 * s(t * 6 + x * 5);
        break;
      case "steam":
        dx = 0.07 * s(t * 5 + y * 5) * top;
        dy = 0.04 * s(t * 4 + x * 5) * top;
        break;
      case "droop":
        dx = 0.11 * smooth(t / 0.7) * top * top;
        dy = -0.1 * smooth(t / 0.7) * top * top + 0.018 * s(t * 3) * top;
        break;
      case "notes":
        dy = 0.08 * s(t * 5 + x * 6);
        dx = 0.025 * s(t * 4) * top;
        break;
      case "sleep":
        dx = 0.04 * s(t * 2 + y * 3) * top;
        dy = 0.025 * s(t * 2 + x * 2);
        break;
      case "dots":
        dy = 0.1 * Math.max(0, s(t * 6 - x * 8));
        break;
      case "spiral": {
        const a = 0.14 * s(t * 4) * Math.exp(-(x * x + y * y) * 2), co = c(a), si = s(a);
        dx = x * co - y * si - x;
        dy = x * si + y * co - y;
        break;
      }
      case "broken":
        dx = Math.tanh(x * 14) * 0.035 * (1 - c(t * 4));
        dy = -0.035 * s(t * 3 + x * 3);
        break;
      case "crown":
        dx = 0.04 * s(t * 5) * top * top;
        dy = 0.035 * s(t * 6 + x * 5) * top;
        break;
      case "ink":
        dx = 0.06 * s(t * 5 + y * 5) * top * top;
        dy = 0.035 * s(t * 4 + x * 4) * top;
        break;
      case "sniff":
        dx = x * 0.03 * s(t * 4);
        dy = 0.025 * s(t * 4 + x * 2);
        break;
      case "rattle":
        dx = 0.035 * s(t * 19) * Math.exp(-t * 0.8);
        dy = 0.02 * s(t * 7 + x * 3);
        break;
      case "tap":
        dx = 0.075 * s(t * 6) * top;
        dy = 0.055 * s(t * 6) * x;
        break;
    }
    return [dx * intensity, dy * intensity];
  };
  D.emote = (o) => {
    const right = V.norm(o.right || [1, 0, 0]), up = V.norm(o.up || [0, 1, 0]), map = (p) => {
      if (!map.motion || !map.k) return p.slice();
      const d = V.sub(p, map.center), x = V.dot(d, right) / map.width, y = V.dot(d, up) / map.height, f = D.emoteField(map.motion, x, clamp(y, -0.5, 0.5), map.t * map.speed, map.k);
      return [
        p[0] + (right[0] * f[0] * map.width + up[0] * f[1] * map.height),
        p[1] + (right[1] * f[0] * map.width + up[1] * f[1] * map.height),
        p[2] + (right[2] * f[0] * map.width + up[2] * f[1] * map.height)
      ];
    };
    map.center = o.center || [0, 0, 0];
    map.width = o.width || 1;
    map.height = o.height || 1;
    map.motion = o.motion || null;
    map.t = 0;
    map.k = o.k === void 0 ? 1 : o.k;
    map.speed = o.speed === void 0 ? 1 : o.speed;
    return map;
  };
  D.foliage = (o) => {
    const f = frameOf(o.up, o.side), map = (p) => {
      const h = map.height, q = local(f, map.base, p), t = c01(q[1] / h), time = map.t, ph = map.phase, bend = map.bend;
      if (map.kind === "grass") {
        const w = t * t, wind = Math.sin(time * 1.1 + ph) * 0.055 + Math.sin(time * 1.83 + ph * 0.7) * 0.022;
        q[0] += (wind * h * map.wind + bend[0]) * w;
        q[1] -= Math.min(h * 0.34, Math.hypot(bend[0], bend[1]) * 0.28) * w;
        q[2] += bend[1] * w;
      } else if (map.kind === "bush") {
        const w = t * (2 - t), ang = clamp(-bend[0] / h * 0.9, -0.55, 0.55) + Math.sin(time * 1.2 + ph) * 0.012 * map.wind, rx = q[0] * Math.cos(ang) - q[1] * Math.sin(ang), ry = q[0] * Math.sin(ang) + q[1] * Math.cos(ang);
        q[0] += (rx - q[0]) * w;
        q[1] += (ry - q[1]) * w;
        q[1] -= clamp(bend[1] * 0.55, -h * 0.22, h * 0.3) * w;
        q[2] += bend[1] * w;
      } else {
        const x = q[0] / map.width + 0.5, y = q[1] / h, canopy = smooth((y - 0.44) / 0.34), left = Math.exp(-((x - 0.23) * (x - 0.23) / 9e-3 + (y - 0.43) * (y - 0.43) / 9e-3)), right = Math.exp(-((x - 0.75) * (x - 0.75) / 9e-3 + (y - 0.5) * (y - 0.5) / 9e-3)), gust = 0.82 + 0.18 * Math.sin(time * 0.37 + ph * 0.3), breeze = (Math.sin(time * 0.83 + ph) * 0.65 + Math.sin(time * 1.31 + ph * 0.6) * 0.35) * gust * map.wind;
        q[0] += h * (canopy * breeze * 0.052 + left * Math.sin(time * 1.8 + ph) * 0.024 * map.wind + right * Math.sin(time * 1.6 + ph + 1) * 0.024 * map.wind);
        q[1] += h * canopy * Math.sin(time * 1.12 + ph + x * 3) * 0.014 * map.wind;
        q[0] += h * map.impact * (canopy + left * 0.28 + right * 0.18);
        q[1] -= h * Math.abs(map.impact) * canopy * 0.16;
      }
      return world(f, map.base, q);
    };
    map.kind = o.kind || "grass";
    map.base = o.base || [0, 0, 0];
    map.height = o.height || 1;
    map.width = o.width || map.height;
    map.phase = o.phase || 0;
    map.wind = o.wind === void 0 ? 1 : o.wind;
    map.t = 0;
    map.bend = [0, 0];
    map.impact = 0;
    return map;
  };
  D.boil = (o) => {
    o = o || {};
    const map = (p) => {
      const fr = Math.floor(map.t * map.fps), cx = Math.floor(p[0] / map.cell), cy = Math.floor(p[1] / map.cell), cz = Math.floor(p[2] / map.cell), h = (k) => (K.hash(cx + fr * 17.3 + k * 5.1, cy + k * 3.7, cz + fr * 0.71) - 0.5) * 2 * map.amp;
      return [p[0] + h(1), p[1] + h(2), p[2] + h(3)];
    };
    map.fps = o.fps || 8;
    map.amp = o.amp === void 0 ? 0.02 : o.amp;
    map.cell = o.cell || 0.35;
    map.t = 0;
    return map;
  };
  D.field = (fn) => (p) => V.add(p, fn(p));
  D.chain = (...maps) => {
    const list = maps.filter(Boolean);
    return list.length === 1 ? list[0] : (p) => {
      for (const m of list) p = m(p);
      return p;
    };
  };
  D.jac = (map, p, e) => {
    e = e || 1e-3;
    const a = map([p[0] + e, p[1], p[2]]), b = map([p[0] - e, p[1], p[2]]), c = map([p[0], p[1] + e, p[2]]), d = map([p[0], p[1] - e, p[2]]), f = map([p[0], p[1], p[2] + e]), g = map([p[0], p[1], p[2] - e]), k = 0.5 / e;
    return [
      (a[0] - b[0]) * k,
      (c[0] - d[0]) * k,
      (f[0] - g[0]) * k,
      (a[1] - b[1]) * k,
      (c[1] - d[1]) * k,
      (f[1] - g[1]) * k,
      (a[2] - b[2]) * k,
      (c[2] - d[2]) * k,
      (f[2] - g[2]) * k
    ];
  };
  D.rest = (W, ids) => {
    const d = W.data, r = new Float32Array(ids.length * 9);
    for (let j = 0; j < ids.length; j++) {
      const q = ids[j] * 16;
      r[j * 9] = d[q];
      r[j * 9 + 1] = d[q + 1];
      r[j * 9 + 2] = d[q + 2];
      r[j * 9 + 3] = d[q + 4];
      r[j * 9 + 4] = d[q + 5];
      r[j * 9 + 5] = d[q + 6];
      r[j * 9 + 6] = d[q + 8];
      r[j * 9 + 7] = d[q + 9];
      r[j * 9 + 8] = d[q + 10];
    }
    return r;
  };
  const carry = (J, r, o, out, q) => {
    const c00 = r[o + 3], c012 = r[o + 4], c02 = r[o + 5], c11 = r[o + 6], c12 = r[o + 7], c22 = r[o + 8], m00 = J[0] * c00 + J[1] * c012 + J[2] * c02, m01 = J[0] * c012 + J[1] * c11 + J[2] * c12, m02 = J[0] * c02 + J[1] * c12 + J[2] * c22, m10 = J[3] * c00 + J[4] * c012 + J[5] * c02, m11 = J[3] * c012 + J[4] * c11 + J[5] * c12, m12 = J[3] * c02 + J[4] * c12 + J[5] * c22, m20 = J[6] * c00 + J[7] * c012 + J[8] * c02, m21 = J[6] * c012 + J[7] * c11 + J[8] * c12, m22 = J[6] * c02 + J[7] * c12 + J[8] * c22;
    out[q + 4] = m00 * J[0] + m01 * J[1] + m02 * J[2];
    out[q + 5] = m00 * J[3] + m01 * J[4] + m02 * J[5];
    out[q + 6] = m00 * J[6] + m01 * J[7] + m02 * J[8];
    out[q + 8] = m10 * J[3] + m11 * J[4] + m12 * J[5];
    out[q + 9] = m10 * J[6] + m11 * J[7] + m12 * J[8];
    out[q + 10] = m20 * J[6] + m21 * J[7] + m22 * J[8];
  };
  D.apply = (W, ids, rest, map, o) => {
    const d = W.data, rows = W.anim && W.anim.rows, shape = !o || o.shape !== false;
    for (let j = 0; j < ids.length; j++) {
      const r = j * 9, q = ids[j] * 16, p = [rest[r], rest[r + 1], rest[r + 2]], n = map(p);
      d[q] = n[0];
      d[q + 1] = n[1];
      d[q + 2] = n[2];
      if (shape) carry(D.jac(map, p), rest, r, d, q);
      if (rows) rows[ids[j] >> 9] = 1;
    }
  };
  D.skin = (W, ids, o) => {
    o = o || {};
    const d = W.data, NA = ids.length, bid = new Uint16Array(NA), bid2 = new Uint16Array(NA), w2 = new Float32Array(NA), cells = [];
    let weightsAt;
    if (o.pieces) {
      for (const c of o.pieces) cells.push(c.slice(0, 3));
      weightsAt = (point) => {
        let best = 0, bd = 1e18;
        for (let i = 0; i < cells.length; i++) {
          const c = cells[i], dd = (point[0] - c[0]) ** 2 + (point[1] - c[1]) ** 2 + (point[2] - c[2]) ** 2;
          if (dd < bd) {
            bd = dd;
            best = i;
          }
        }
        return [best, best, 0];
      };
    } else if (o.grid) {
      const g = o.grid, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      for (let j = 0; j < NA; j++)
        for (let a = 0; a < 3; a++) {
          const v = d[ids[j] * 16 + a];
          if (v < lo[a]) lo[a] = v;
          if (v > hi[a]) hi[a] = v;
        }
      const at = (i, j, k) => i + g[0] * (j + g[1] * k);
      for (let k = 0; k < g[2]; k++)
        for (let j = 0; j < g[1]; j++)
          for (let i = 0; i < g[0]; i++)
            cells.push([
              lo[0] + (hi[0] - lo[0]) * (i + 0.5) / g[0],
              lo[1] + (hi[1] - lo[1]) * (j + 0.5) / g[1],
              lo[2] + (hi[2] - lo[2]) * (k + 0.5) / g[2]
            ]);
      weightsAt = (point) => {
        const c = [0, 0, 0], f = [0, 0, 0];
        let best = -1, bf = 0;
        for (let a = 0; a < 3; a++) {
          const s = clamp((point[a] - lo[a]) / (hi[a] - lo[a] || 1) * g[a], 0, g[a] - 1e-6);
          c[a] = Math.floor(s);
          f[a] = s - c[a] - 0.5;
          const nb = c[a] + Math.sign(f[a]);
          if (g[a] > 1 && nb >= 0 && nb < g[a] && Math.abs(f[a]) > bf) {
            bf = Math.abs(f[a]);
            best = a;
          }
        }
        const primary = at(...c);
        if (best < 0) return [primary, 0, 0];
        c[best] += Math.sign(f[best]);
        return [primary, at(...c), bf];
      };
    } else {
      const n = Math.max(1, o.slices || 1), ax = V.norm(o.axis || [0, 1, 0]);
      let lo = 1e9, hi = -1e9;
      const cen = [0, 0, 0];
      for (let j = 0; j < NA; j++) {
        const q = ids[j] * 16, s = d[q] * ax[0] + d[q + 1] * ax[1] + d[q + 2] * ax[2];
        if (s < lo) lo = s;
        if (s > hi) hi = s;
        cen[0] += d[q];
        cen[1] += d[q + 1];
        cen[2] += d[q + 2];
      }
      if (o.from !== void 0) lo = o.from;
      if (o.to !== void 0) hi = o.to;
      for (let a = 0; a < 3; a++) cen[a] /= NA || 1;
      const mid = V.dot(cen, ax);
      for (let i = 0; i < n; i++) cells.push(V.mad(cen, ax, lo + (hi - lo) * (i + 0.5) / n - mid));
      weightsAt = (point) => {
        const s = (V.dot(point, ax) - lo) / (hi - lo || 1) * n - 0.5, i0 = Math.floor(s), f = s - i0, a = clamp(f < 0.5 ? i0 : i0 + 1, 0, n - 1), b = clamp(f < 0.5 ? i0 + 1 : i0, 0, n - 1);
        return [a, b, a === b ? 0 : f < 0.5 ? f : 1 - f];
      };
    }
    for (let j = 0; j < NA; j++) {
      const q = ids[j] * 16;
      [bid[j], bid2[j], w2[j]] = weightsAt([d[q], d[q + 1], d[q + 2]]);
    }
    const skin = {
      weightsAt,
      bid,
      bid2,
      w2,
      cells,
      n: cells.length,
      /* the bones for a map, written into M from bone `first`: each bone is the map's best straight-line stand-in where its cell is.
         post, when given, is { A, t }: a further move of everything (x -> A x + t) */
      fill(M_, first, map, post) {
        for (let i = 0; i < cells.length; i++) {
          const c = cells[i];
          let J = map ? D.jac(map, c) : M.id(), p = map ? map(c) : c;
          if (post) {
            J = M.mul(post.A, J);
            p = V.add(M.app(post.A, p), post.t);
          }
          const t = V.sub(p, M.app(J, c)), k = (first + i) * 12;
          for (let q = 0; q < 9; q++) M_[k + q] = J[q];
          M_[k + 9] = t[0];
          M_[k + 10] = t[1];
          M_[k + 11] = t[2];
        }
      }
    };
    return skin;
  };
  D.tags = (S) => {
    const by = {}, prev = S.emit;
    S.emit = (pr, n0, n1) => {
      if (prev) prev(pr, n0, n1);
      if (!pr || !pr.tag || n1 <= n0) return;
      const a = by[pr.tag] || (by[pr.tag] = []);
      for (let i = n0; i < n1; i++) a.push(i);
    };
    Object.defineProperty(by, "of", {
      value: (...names) => names.flatMap((n) => by[n] || []).sort((a, b) => a - b)
    });
    return by;
  };
  const eulerDeg = (r) => {
    const k = Math.PI / 180;
    return M.mul(M.rot([1, 0, 0], r[0] * k), M.mul(M.rot([0, 1, 0], r[1] * k), M.rot([0, 0, 1], r[2] * k)));
  };
  D.euler = eulerDeg;
  const ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  K.puppet = (W, def) => {
    const d = W.data, names = Object.keys(def.parts), parts = {}, order = [], all = [];
    let nb = 0;
    for (const name of names) {
      const s = def.parts[name], ids = Array.from(s.ids), axis = V.norm(s.axis || [0, 1, 0]), skin = D.skin(W, ids, { slices: s.slices, grid: s.grid, pieces: s.pieces, axis, from: s.from, to: s.to });
      let lo = 1e9, hi = -1e9;
      const cen = [0, 0, 0];
      for (const i of ids) {
        const q = i * 16, h = d[q] * axis[0] + d[q + 1] * axis[1] + d[q + 2] * axis[2];
        if (h < lo) lo = h;
        if (h > hi) hi = h;
        cen[0] += d[q] / ids.length;
        cen[1] += d[q + 1] / ids.length;
        cen[2] += d[q + 2] / ids.length;
      }
      const pivot = s.pivot || cen, base = V.mad(pivot, axis, lo - V.dot(pivot, axis));
      parts[name] = {
        name,
        parent: s.parent || null,
        ids,
        pivot,
        axis,
        side: s.side,
        base,
        height: Math.max(1e-3, hi - lo),
        center: cen,
        skin,
        first: nb,
        maps: (s.maps || []).slice(),
        frame: [],
        A: ID.slice(),
        t: [0, 0, 0],
        P: ID.slice(),
        Pt: [0, 0, 0],
        D: null,
        body: null,
        morph: null,
        fold: null
      };
      for (let j = 0; j < ids.length; j++) all.push([ids[j], nb + skin.bid[j], nb + skin.bid2[j], skin.w2[j]]);
      nb += skin.n;
    }
    const place = (name) => {
      if (order.includes(name)) return;
      const p = parts[name];
      if (p.parent) {
        if (!parts[p.parent]) throw new Error("puppet: " + name + " hangs from " + p.parent + ", which is not a part");
        place(p.parent);
      }
      order.push(name);
    };
    names.forEach(place);
    all.sort((a, b) => a[0] - b[0]);
    const Mx = new Float32Array(nb * 12), pup = { parts, names, order, pose: {}, bones: Mx, count: nb, time: 0 };
    const ch = (name, c, fb) => {
      const p = pup.pose[name];
      return p && p[c] !== void 0 ? p[c] : fb;
    };
    const deformer = (p) => {
      const n = p.name, st = ch(n, "stretch", 1), wa = ch(n, "waist", 0), be = ch(n, "bend", null), inf = ch(n, "inflate", 0), ta = ch(n, "taper", 0), arc = ch(n, "arc", 0), tw = ch(n, "twist", 0), fo = ch(n, "fold", null), list = [];
      if (st !== 1 || wa || be && (be[0] || be[1])) {
        const b = p.body || (p.body = D.body({ base: p.base, up: p.axis, side: p.side, height: p.height }));
        b.stretch = st;
        b.waist = wa;
        b.bend = be || [0, 0];
        list.push(b);
      }
      if (inf || ta || arc || tw) {
        const m = p.morph || (p.morph = D.morph({ base: p.base, up: p.axis, side: p.side, height: p.height }));
        m.inflate = inf;
        m.taper = ta;
        m.arc = arc;
        m.twist = tw * Math.PI / 180;
        list.push(m);
      }
      if (fo && fo.angle) {
        const f = p.fold || (p.fold = D.fold({ origin: p.base, x: frameOf(p.axis, p.side).ax, y: p.axis }));
        f.angle = fo.angle;
        f.axis = fo.axis || 0;
        f.offset = fo.offset === void 0 ? p.height * 0.5 : fo.offset;
        f.width = fo.width === void 0 ? p.height * 0.25 : fo.width;
        list.push(f);
      }
      for (const m of p.maps) list.push(m);
      for (const m of p.frame) list.push(m);
      return list.length ? D.chain(...list) : null;
    };
    pup.solve = () => {
      for (const name of order) {
        const p = parts[name], rot = ch(name, "rot", null), sc = ch(name, "scale", null), turn = ch(name, "turn", null), pos = ch(name, "pos", null);
        let L = rot ? eulerDeg(rot) : ID;
        if (turn) L = M.mul(turn, L);
        if (sc !== null) {
          const s = typeof sc === "number" ? [sc, sc, sc] : sc;
          L = M.mul(L, [s[0], 0, 0, 0, s[1], 0, 0, 0, s[2]]);
        }
        const pv = p.pivot, tl = V.sub(pos ? V.add(pv, pos) : pv, M.app(L, pv));
        let PA = ID, Pt = [0, 0, 0];
        if (p.parent) {
          const par = parts[p.parent];
          PA = par.A;
          Pt = par.t;
          if (par.D) {
            const Jr = M.polar(D.jac(par.D, pv)), ta = V.sub(par.D(pv), M.app(Jr, pv));
            Pt = V.add(M.app(PA, ta), Pt);
            PA = M.mul(PA, Jr);
          }
        }
        p.P = PA;
        p.Pt = Pt;
        p.A = M.mul(PA, L);
        p.t = V.add(M.app(PA, tl), Pt);
        p.D = deformer(p);
      }
      return pup;
    };
    pup.point = (name, q) => {
      const p = parts[name];
      return V.add(M.app(p.A, p.D ? p.D(q) : q), p.t);
    };
    const turnWorld = (name, Q) => {
      const p = parts[name], loc = M.mul(M.inv(p.P), M.mul(Q, p.P)), po = pup.pose[name] || (pup.pose[name] = {});
      po.turn = po.turn ? M.mul(loc, po.turn) : loc;
      pup.solve();
    };
    const moveWorld = (name, dw) => {
      const p = parts[name], dl = M.app(M.inv(p.P), dw), po = pup.pose[name] || (pup.pose[name] = {});
      po.pos = po.pos ? V.add(po.pos, dl) : dl;
      pup.solve();
    };
    const limited = (cur, want, limit, w) => {
      const ax = V.cross(cur, want), s = V.len(ax), ang = Math.atan2(s, V.dot(cur, want));
      if (s < 1e-7) return null;
      return M.rot(V.mul(ax, 1 / s), Math.min(ang, limit) * w);
    };
    pup.deform = (name, map) => {
      parts[name].frame.push(map);
      return pup;
    };
    pup.look = (name, target, o) => {
      o = o || {};
      pup.solve();
      const p = parts[name], cur = V.norm(M.app(p.A, V.norm(o.forward || [0, 0, 1]))), at = pup.point(name, p.pivot), Q = limited(
        cur,
        V.norm(V.sub(target, at)),
        (o.limit === void 0 ? 70 : o.limit) * Math.PI / 180,
        o.w === void 0 ? 1 : o.w
      );
      if (Q) turnWorld(name, Q);
      return pup;
    };
    pup.pin = (name, point, target, w) => {
      pup.solve();
      moveWorld(name, V.mul(V.sub(target, pup.point(name, point)), w === void 0 ? 1 : w));
      return pup;
    };
    pup.reach = (upper, lower, tip, target, o) => {
      o = o || {};
      pup.solve();
      const w = o.w === void 0 ? 1 : o.w, a = pup.point(upper, parts[upper].pivot), b = pup.point(lower, parts[lower].pivot), e = pup.point(lower, tip), goal = V.lerp(e, target, w), l1 = V.dist(a, b), l2 = V.dist(b, e), ik = K.ik2(a, goal, l1, l2, o.pole || V.sub(b, V.lerp(a, e, 0.5))), elbow = ik.mid;
      const Q1 = limited(V.norm(V.sub(b, a)), V.norm(V.sub(elbow, a)), Math.PI, 1);
      if (Q1) turnWorld(upper, Q1);
      const b2 = pup.point(lower, parts[lower].pivot), e2 = pup.point(lower, tip), Q2 = limited(V.norm(V.sub(e2, b2)), V.norm(V.sub(ik.tip, b2)), Math.PI, 1);
      if (Q2) turnWorld(lower, Q2);
      return V.dist(pup.point(lower, tip), goal);
    };
    pup.distance = (name, target, dist, o) => {
      o = o || {};
      pup.solve();
      const at = pup.point(name, parts[name].pivot), dl = V.sub(at, target), len = V.len(dl);
      if (o.mode === "closer" && len <= dist || o.mode === "further" && len >= dist) return pup;
      const want = V.mad(target, len > 1e-9 ? V.mul(dl, 1 / len) : [1, 0, 0], dist);
      moveWorld(name, V.mul(V.sub(want, at), o.w === void 0 ? 1 : o.w));
      return pup;
    };
    pup.onPath = (name, path, dist, o) => {
      o = o || {};
      pup.solve();
      const w = o.w === void 0 ? 1 : o.w, fr = path.at(dist), p3 = fr.p.length === 2 ? [fr.p[0], 0, fr.p[1]] : fr.p, t3 = fr.tan.length === 2 ? [fr.tan[0], 0, fr.tan[1]] : fr.tan;
      moveWorld(name, V.mul(V.sub(o.offset ? V.add(p3, o.offset) : p3, pup.point(name, parts[name].pivot)), w));
      if (o.orient) {
        const cur = V.norm(M.app(parts[name].A, V.norm(o.forward || [0, 0, 1]))), Q = limited(cur, V.norm(t3), Math.PI, w);
        if (Q) turnWorld(name, Q);
      }
      return pup;
    };
    pup.clear = () => {
      for (const k in pup.pose) delete pup.pose[k];
      for (const n of names) parts[n].frame.length = 0;
      return pup;
    };
    pup.flush = () => {
      pup.solve();
      for (const name of order) {
        const p = parts[name];
        if (ch(name, "show", 1) === 0) {
          for (let i = 0; i < p.skin.n; i++) {
            const k = (p.first + i) * 12;
            Mx.fill(0, k, k + 12);
            Mx[k] = Mx[k + 4] = Mx[k + 8] = 1e-4;
            Mx[k + 10] = -99;
          }
          continue;
        }
        p.skin.fill(Mx, p.first, p.D, { A: p.A, t: p.t });
      }
      return pup;
    };
    const NA = all.length, stage = W.anim && W.anim.systems ? W.anim : null;
    pup.anim = K.bones.bind(W, {
      ids: all.map((a) => a[0]),
      bid: Uint16Array.from(all, (a) => a[1]),
      bid2: Uint16Array.from(all, (a) => a[2]),
      w2: Float32Array.from(all, (a) => a[3]),
      M: Mx,
      react: def.react === true,
      pose(t, dt) {
        pup.time = t;
        pup.clear();
        if (def.pose) def.pose(t, dt, pup);
        pup.flush();
      }
    });
    pup.splats = NA;
    for (let i = 0; i < nb; i++) Mx[i * 12] = Mx[i * 12 + 4] = Mx[i * 12 + 8] = 1;
    if (stage) {
      const own = pup.anim;
      W.anim = stage;
      stage.bones = own.bones;
      stage.boned = own.boned;
      stage.add({
        update(dt, t) {
          own.update(dt, t);
          for (let r = 0; r < own.rows.length; r++)
            if (own.rows[r]) {
              stage.rows[r] = 1;
              own.rows[r] = 0;
            }
        }
      });
      pup.anim = stage;
    }
    return pup;
  };
})(KIT);
