// Generated from src/kit/k2-motion.ts by npm run build:src. Do not edit.
(function(K) {
  const V = K.V, M = K.M, TAU = Math.PI * 2;
  K.spine = (ctrl, n, o) => {
    o = o || {};
    const CP = [V.sub(V.mul(ctrl[0], 2), ctrl[1])].concat(ctrl, [
      V.sub(V.mul(ctrl[ctrl.length - 1], 2), ctrl[ctrl.length - 2])
    ]), SUB = 24, dense = [];
    for (let i = 1; i < CP.length - 2; i++)
      for (let k = 0; k < (i === CP.length - 3 ? SUB + 1 : SUB); k++) {
        const t = k / SUB, a = CP[i - 1], b = CP[i], c = CP[i + 1], d = CP[i + 2], q = [0, 0, 0];
        for (let m = 0; m < 3; m++)
          q[m] = 0.5 * (2 * b[m] + (c[m] - a[m]) * t + (2 * a[m] - 5 * b[m] + 4 * c[m] - d[m]) * t * t + (3 * b[m] - 3 * c[m] + d[m] - a[m]) * t * t * t);
        dense.push(q);
      }
    if (o.shape) o.shape(dense);
    const cum = [0];
    for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + V.dist(dense[i], dense[i - 1]));
    const L = cum[cum.length - 1], SL = L / n, C = [], T = [], D = [], Bn = [], rad = o.rad || (() => 0.5), sp = {
      n,
      L,
      SL,
      C,
      T,
      D,
      B: Bn,
      rad,
      cur: { l: 0, a: 0, seg: -1 },
      lenAt: (i) => cum[Math.min(cum.length - 1, (i - 1) * SUB)]
    };
    for (let j = 0, i = 0; j <= n; j++) {
      const l = Math.min(L - 1e-6, j * SL);
      while (cum[i + 1] < l) i++;
      C.push(V.lerp(dense[i], dense[i + 1], (l - cum[i]) / (cum[i + 1] - cum[i] || 1)));
    }
    for (let j = 0; j <= n; j++) {
      const t = V.norm(V.sub(C[Math.min(n, j + 1)], C[Math.max(0, j - 1)])), r = o.back ? o.back(j * SL, C[j], t) : [0, 1, 0], k = V.dot(r, t), d = V.norm(V.mad(r, t, -k), V.perp(t));
      T.push(t);
      D.push(d);
      Bn.push(V.cross(t, d));
    }
    sp.frame = (l) => {
      const q = K.clamp(l / SL, 0, n - 1e-4), i = Math.floor(q), f = q - i, t = V.norm(V.lerp(T[i], T[i + 1], f)), d0 = V.lerp(D[i], D[i + 1], f), d = V.norm(V.mad(d0, t, -V.dot(d0, t)));
      return { c: V.lerp(C[i], C[i + 1], f), t, d, b: V.cross(t, d) };
    };
    sp.at = (F, r, a, back) => {
      const ca = Math.cos(a) * r, sa = Math.sin(a) * r, k = back || 0;
      return [
        F.c[0] + F.d[0] * ca + F.b[0] * sa - F.t[0] * k,
        F.c[1] + F.d[1] * ca + F.b[1] * sa - F.t[1] * k,
        F.c[2] + F.d[2] * ca + F.b[2] * sa - F.t[2] * k
      ];
    };
    sp.rings = (l0, l1, k, res, f, keep, off) => {
      const step = res * 0.8, cur = sp.cur;
      for (let m = Math.ceil(l0 / step - 0.5); (m + 0.5) * step < l1; m++) {
        const l = (m + 0.5) * step, F = sp.frame(l), r = rad(l) * k, cnt = Math.max(5, Math.ceil(TAU * r / res)), w = (off || 0) * rad(l);
        cur.l = l;
        cur.seg = Math.round(l / SL);
        for (let q = m % 2 * 0.5; q < cnt; q++) {
          const a = q / cnt * TAU - Math.PI;
          if (keep && !keep(l, a)) continue;
          cur.a = a;
          const p = sp.at(F, r, a);
          f(p[0] - F.d[0] * w, p[1] - F.d[1] * w, p[2] - F.d[2] * w);
        }
      }
      cur.seg = -1;
    };
    sp.skin = (S, mat, o2) => {
      o2 = o2 || {};
      const k = o2.k || 1, PIECE = 8, out = [];
      for (let i = 0; i < n; i += PIECE) {
        const j1 = Math.min(n, i + PIECE), l0 = i * SL, l1 = j1 * SL;
        if (o2.where && !o2.where(l0, l1)) continue;
        const pts = C.slice(i, j1 + 1).map((c, m) => o2.off ? V.mad(c, D[i + m], -o2.off * rad((i + m) * SL)) : c), p = S.tube(pts, (t) => rad(l0 + t * (l1 - l0)) * k, 0, mat, {
          tag: o2.tag || "spine",
          ghost: o2.ghost,
          res: o2.res
        });
        p.spine = sp;
        p.sample = function(f) {
          sp.rings(l0, l1, k, this.res, f, o2.keep, o2.off);
        };
        out.push(p);
      }
      return out;
    };
    sp.parts = (rig, prefix) => {
      prefix = prefix || "s";
      const first = rig.part(prefix + 0);
      for (let j = 1; j <= n; j++) rig.part(prefix + j);
      sp.first = first;
      sp.loose = [];
      const before = rig.resolve;
      rig.resolve = (pr) => {
        if (pr.spine === sp) return sp.cur.seg >= 0 ? first + sp.cur.seg : (sp.pending = true, first);
        return before ? before(pr) : void 0;
      };
      return first;
    };
    sp.settle = (st) => {
      const rig = st.rig, D0 = st.base;
      for (let i = 0; i < st.N; i++) {
        if (rig.bid[i] !== sp.first) continue;
        let best = 1e9, bj = 0;
        const x = D0[i * 16], y = D0[i * 16 + 1], z = D0[i * 16 + 2];
        for (let j = 0; j <= n; j++) {
          const c = C[j], dd = Math.hypot(x - c[0], y - c[1], z - c[2]) / rad(j * SL);
          if (dd < best) {
            best = dd;
            bj = j;
          }
        }
        rig.bid[i] = sp.first + bj;
      }
      const cnt = new Int32Array(rig.names.length);
      for (let i = 0; i < st.N; i++) cnt[rig.bid[i]]++;
      for (let j = 0; j <= n; j++) rig.list[sp.first + j] = new Int32Array(cnt[sp.first + j]);
      cnt.fill(0);
      for (let i = 0; i < st.N; i++) {
        const b = rig.bid[i];
        if (b >= sp.first && b <= sp.first + n) rig.list[b][cnt[b]++] = i;
      }
    };
    const P = sp.P = C.map((c) => c.slice()), WANT = sp.want = new Float32Array((n + 1) * 3);
    sp.wish = (j, x, y, z) => {
      WANT[j * 3] = x;
      WANT[j * 3 + 1] = y;
      WANT[j * 3 + 2] = z;
    };
    sp.lay = (j0, j1) => {
      const st = j1 > j0 ? 1 : -1, m = Math.abs(j1 - j0);
      let ax = P[j0][0], ay = P[j0][1], az = P[j0][2], seg = 1, ux = 0, uy = 0, uz = 0;
      for (let q = 1; q <= m; q++) {
        let need = SL;
        for (; ; ) {
          const ti = (j0 + st * Math.min(seg, m)) * 3, dx = WANT[ti] - ax, dy = WANT[ti + 1] - ay, dz = WANT[ti + 2] - az, dd = Math.hypot(dx, dy, dz);
          if (dd > 1e-6 && seg <= m) {
            ux = dx / dd;
            uy = dy / dd;
            uz = dz / dd;
          }
          if (dd >= need || seg > m) {
            ax += ux * need;
            ay += uy * need;
            az += uz * need;
            break;
          }
          need -= dd;
          ax = WANT[ti];
          ay = WANT[ti + 1];
          az = WANT[ti + 2];
          seg++;
        }
        const e = P[j0 + st * q];
        e[0] = ax;
        e[1] = ay;
        e[2] = az;
      }
    };
    sp.drive = (rig, o3) => {
      o3 = o3 || {};
      let last = T[n];
      for (let j = 0; j <= n; j++) {
        const a = P[Math.max(0, j - 1)], b = P[Math.min(n, j + 1)], t = V.norm(V.sub(b, a), T[j]);
        let A = M.aim(T[j], t);
        if (o3.twist) A = M.mul(A, M.rot(T[j], o3.twist(j)));
        if (o3.squash) A = M.mul(A, M.stretch(T[j], o3.squash(j), true));
        rig.set(sp.first + j, A, C[j], P[j]);
        last = t;
      }
      return last;
    };
    return sp;
  };
  K.ik2 = (a, target, l1, l2, pole) => {
    let v = V.sub(target, a), d = V.len(v);
    const mx = l1 + l2 - 1e-3, mn = Math.abs(l1 - l2) + 1e-3;
    let tip = target;
    if (d > mx) {
      tip = V.mad(a, v, mx / d);
      d = mx;
    } else if (d < mn) {
      v = d > 1e-6 ? v : [0, -1, 0];
      tip = V.mad(a, V.norm(v), mn);
      d = mn;
    }
    const dir = V.norm(V.sub(tip, a)), x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), y = Math.sqrt(Math.max(0, l1 * l1 - x * x)), pk = V.dot(pole, dir), nn = V.norm(V.mad(pole, dir, -pk), V.perp(dir));
    return { mid: [a[0] + dir[0] * x + nn[0] * y, a[1] + dir[1] * x + nn[1] * y, a[2] + dir[2] * x + nn[2] * y], tip };
  };
  K.rope = (pts, o) => {
    o = o || {};
    const n = pts.length, P = pts.map((p) => p.slice()), Q = pts.map((p) => p.slice()), rest = pts.map((p) => p.slice()), len = [];
    for (let i = 1; i < n; i++) len.push(o.len || V.dist(pts[i], pts[i - 1]));
    const g = o.gravity === void 0 ? 9 : o.gravity, damp = o.damp === void 0 ? 0.92 : o.damp, r = {
      P,
      step(dt, anchor, frame) {
        dt = Math.min(dt, 0.033);
        P[0][0] = anchor[0];
        P[0][1] = anchor[1];
        P[0][2] = anchor[2];
        for (let i = 1; i < n; i++) {
          const p = P[i], q = Q[i], vx = (p[0] - q[0]) * damp, vy = (p[1] - q[1]) * damp, vz = (p[2] - q[2]) * damp;
          q[0] = p[0];
          q[1] = p[1];
          q[2] = p[2];
          p[0] += vx;
          p[1] += vy - g * dt * dt;
          p[2] += vz;
          if (o.stiff) {
            const w = frame ? V.add(anchor, M.app(frame, V.sub(rest[i], rest[0]))) : V.add(anchor, V.sub(rest[i], rest[0]));
            p[0] += (w[0] - p[0]) * o.stiff;
            p[1] += (w[1] - p[1]) * o.stiff;
            p[2] += (w[2] - p[2]) * o.stiff;
          }
        }
        for (let it = 0; it < 4; it++)
          for (let i = 1; i < n; i++) {
            const a = P[i - 1], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], d = Math.hypot(dx, dy, dz) || 1e-6, k = len[i - 1] / d;
            b[0] = a[0] + dx * k;
            b[1] = a[1] + dy * k;
            b[2] = a[2] + dz * k;
            if (o.floor) {
              const fy = o.floor(b[0], b[2]) + (o.thick || 0);
              if (b[1] < fy) b[1] = fy;
            }
          }
        return P;
      }
    };
    return r;
  };
  K.clip = (def) => {
    const names = Object.keys(def.tracks || {}), c = {
      dur: def.dur,
      loop: !!def.loop,
      cues: def.cues || [],
      names,
      at(t, out) {
        out = out || {};
        const u = c.loop ? (t % c.dur + c.dur) % c.dur : Math.min(t, c.dur);
        for (const k of names) out[k] = K.kf(u, def.tracks[k]);
        return out;
      }
    };
    return c;
  };
  K.machine = (def) => {
    const m = {
      state: def.start,
      time: 0,
      values: {},
      from: null,
      fade: 0,
      def
    };
    const blend = def.blend === void 0 ? 0.15 : def.blend;
    m.go = (s) => {
      if (!def.states[s]) return;
      m.from = Object.assign({}, m.values);
      m.fade = blend;
      m.state = s;
      m.time = 0;
      if (def.enter) def.enter(s, m);
    };
    m.fire = (ev) => {
      const st = def.states[m.state], to = st.on && st.on[ev] || def.on && def.on[ev];
      if (to) m.go(to);
      return !!to;
    };
    m.update = (dt) => {
      const st = def.states[m.state], c = st.clip, t0 = m.time;
      m.time += dt * (st.rate || 1);
      if (c) {
        for (const q of c.cues) {
          const tq = q[0];
          if (c.loop ? t0 % c.dur <= tq && t0 % c.dur + dt > tq : t0 <= tq && m.time > tq) {
            if (def.cue) def.cue(q[1], m.state, m);
          }
        }
        c.at(m.time, m.values);
      }
      if (m.fade > 0 && m.from) {
        const k = m.fade / (blend || 1);
        for (const n in m.values)
          if (m.from[n] !== void 0) m.values[n] = m.values[n] + (m.from[n] - m.values[n]) * K.ease.smooth(k);
        m.fade -= dt;
      }
      if (c && !c.loop && m.time >= c.dur && st.then) m.go(st.then);
      return m.values;
    };
    m.update(0);
    return m;
  };
  K.gait = (def) => {
    const feet = def.feet.map((f) => ({
      home: f.home,
      group: f.group || 0,
      p: null,
      from: null,
      to: null,
      u: 1,
      lift: 0
    })), reach = def.reach || 0.5, T = def.time || 0.22, gy = def.ground || (() => 0), g = { feet, steps: 0 };
    const homeOf = (f, body) => {
      const c = Math.cos(body.yaw), s = Math.sin(body.yaw), x = body.p[0] + f.home[0] * c + f.home[1] * s, z = body.p[2] - f.home[0] * s + f.home[1] * c;
      return [x, gy(x, z), z];
    };
    g.update = (dt, body) => {
      const air = {};
      for (const f of feet) if (f.u < 1) air[f.group] = (air[f.group] || 0) + 1;
      const any = feet.some((f) => f.u < 1);
      for (const f of feet) {
        const h = homeOf(f, body);
        if (!f.p) f.p = h.slice();
        if (f.u >= 1) {
          const off = Math.hypot(h[0] - f.p[0], h[2] - f.p[2]);
          if (off > reach && !any && !air[f.group] || off > reach * 2.2) {
            const k = def.lead === void 0 ? 0.6 : def.lead, vx = body.v ? body.v[0] : 0, vz = body.v ? body.v[1] : 0, tx = h[0] + vx * T * (1 + k) + (h[0] - f.p[0]) * 0, tz = h[2] + vz * T * (1 + k);
            f.from = f.p.slice();
            f.to = [tx, gy(tx, tz), tz];
            f.u = 0;
            air[f.group] = 1;
            g.steps++;
            if (def.lifted) def.lifted(f);
          }
        }
        if (f.u < 1) {
          f.u = Math.min(1, f.u + dt / T);
          const e = K.ease.smooth(f.u);
          f.lift = Math.sin(Math.PI * f.u);
          f.p = [
            f.from[0] + (f.to[0] - f.from[0]) * e,
            f.from[1] + (f.to[1] - f.from[1]) * e + (def.lift || 0.3) * f.lift,
            f.from[2] + (f.to[2] - f.from[2]) * e
          ];
          if (f.u >= 1) {
            f.lift = 0;
            if (def.planted) def.planted(f);
          }
        }
      }
      let hy = 0;
      for (const f of feet) hy += f.p[1] - (def.lift || 0.3) * f.lift;
      g.height = hy / feet.length;
      return feet;
    };
    return g;
  };
})(KIT);
