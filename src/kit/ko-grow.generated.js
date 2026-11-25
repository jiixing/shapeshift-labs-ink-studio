// Generated from src/kit/ko-grow.ts by npm run build:src. Do not edit.
(function(K) {
  const TAU = 6.283185307179586, GA = 2.399963229728653;
  const dice = (seed) => {
    let a = seed >>> 0 || 1;
    return () => {
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  const grad = (sdf, x, y, z) => {
    const e = 0.02;
    return norm([
      sdf(x + e, y, z) - sdf(x - e, y, z),
      sdf(x, y + e, z) - sdf(x, y - e, z),
      sdf(x, y, z + e) - sdf(x, y, z - e)
    ]);
  };
  K.grow = {
    dice,
    scatter(S, o) {
      o = o || {};
      S.ready();
      const R = dice(o.seed || 7), out = [], want = o.n || 60, gap = o.gap === void 0 ? 0.5 : o.gap, top = o.top === void 0 ? 12 : o.top, slope = o.slope || [0.8, 1], size = o.size || [1, 1], sun = S.sun;
      for (let tries = 0; tries < want * 12 && out.length < want; tries++) {
        let x, z;
        if (o.box) {
          x = o.box[0] + R() * (o.box[1] - o.box[0]);
          z = o.box[2] + R() * (o.box[3] - o.box[2]);
        } else {
          const d = o.disc || [0, 0, 6], rr = Math.sqrt(R()) * d[2], a = R() * TAU;
          x = d[0] + Math.cos(a) * rr;
          z = d[1] + Math.sin(a) * rr;
        }
        const keep = R(), sz = R(), yw = R();
        if (o.where && keep > o.where(x, z)) continue;
        const y = S.heightAt(x, z, top, o.depth || 30);
        if (y > 1e8 || y < -1e8) continue;
        if (o.height && (y < o.height[0] || y > o.height[1])) continue;
        const n = grad(S.sdf, x, y, z);
        if (n[1] < slope[0] || n[1] > slope[1]) continue;
        let lit = 1, t = 0.1;
        for (let k = 0; k < 24 && t < 10; k++) {
          const h = S.sdf(x + n[0] * 0.06 + sun[0] * t, y + n[1] * 0.06 + sun[1] * t, z + n[2] * 0.06 + sun[2] * t);
          if (h < 0.01) {
            lit = 0;
            break;
          }
          if (h < 0.9) lit = Math.min(lit, 6 * h / t);
          t += Math.max(0.08, h);
        }
        if (o.shade && (lit < o.shade[0] || lit > o.shade[1])) continue;
        let ok = true;
        for (const q of out)
          if (Math.hypot(q.p[0] - x, q.p[2] - z) < gap * (0.5 + 0.5 * (q.s + 1) * 0.5)) {
            ok = false;
            break;
          }
        if (!ok) continue;
        out.push({ p: [x, y, z], n, s: size[0] + sz * (size[1] - size[0]), yaw: yw * TAU, sun: lit });
      }
      return out;
    },
    branch(o) {
      o = o || {};
      const R = dice(o.seed || 11), limbs = [], tips = [], segs = o.segs || 5, forks = o.forks || 2, spread = o.spread === void 0 ? 0.65 : o.spread, shrink = o.shrink === void 0 ? 0.68 : o.shrink, lean = o.lean === void 0 ? 0.3 : o.lean, droop = o.droop === void 0 ? 0.08 : o.droop, wob = o.wobble === void 0 ? 0.25 : o.wobble, light = norm(o.light || [0, 1, 0]), maxD = o.depth === void 0 ? 3 : o.depth, margin = o.margin || 0.35;
      const go = (p, d, len, r, depth) => {
        const pts = [p.slice()], step = len / segs, thin = depth / Math.max(1, maxD);
        let q = p.slice(), dir = norm(d);
        for (let i = 0; i < segs; i++) {
          let ax = dir[0] + light[0] * lean * 0.35 + (R() - 0.5) * wob * 0.5, ay = dir[1] + light[1] * lean * 0.35 + (R() - 0.5) * wob * 0.5 - droop * thin * 0.6, az = dir[2] + light[2] * lean * 0.35 + (R() - 0.5) * wob * 0.5;
          if (o.sdf) {
            const h = o.sdf(q[0] + dir[0] * step, q[1] + dir[1] * step, q[2] + dir[2] * step);
            if (h < margin) {
              const g = grad(o.sdf, q[0] + dir[0] * step, q[1] + dir[1] * step, q[2] + dir[2] * step), k = (1 - Math.max(0, h) / margin) * 1.4;
              ax += g[0] * k;
              ay += g[1] * k;
              az += g[2] * k;
            }
          }
          dir = norm([ax, ay, az]);
          q = [q[0] + dir[0] * step, q[1] + dir[1] * step, q[2] + dir[2] * step];
          pts.push(q.slice());
        }
        const r1 = r * (depth === maxD ? 0.35 : shrink);
        limbs.push({ pts, r0: r, r1, depth });
        if (depth >= maxD) {
          tips.push({ p: q, dir, r: r1 });
          return;
        }
        const side = norm(cross(dir, Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), fwd = cross(dir, side), a0 = R() * TAU, nf = forks + (R() < (o.extra || 0.25) ? 1 : 0);
        for (let f = 0; f < nf; f++) {
          const a = a0 + f / nf * TAU + (R() - 0.5) * 0.6, sp = spread * (0.75 + 0.5 * R()), c = Math.cos(sp), s = Math.sin(sp), nd = [
            dir[0] * c + (side[0] * Math.cos(a) + fwd[0] * Math.sin(a)) * s,
            dir[1] * c + (side[1] * Math.cos(a) + fwd[1] * Math.sin(a)) * s,
            dir[2] * c + (side[2] * Math.cos(a) + fwd[2] * Math.sin(a)) * s
          ];
          go(q, nd, len * shrink * (0.85 + 0.3 * R()), r1, depth + 1);
        }
      };
      go(o.at || [0, 0, 0], o.dir || [0, 1, 0], o.len || 2.2, o.r || 0.16, 0);
      return { limbs, tips };
    },
    limbs(S, grown, mat, o) {
      o = o || {};
      const G = Object.assign(S.grp(o.melt === void 0 ? 0.08 : o.melt), o);
      for (const L of grown.limbs) S.tube(L.pts, L.r0, L.r1, mat, G);
    },
    arrange(kind, n, o) {
      o = o || {};
      const out = [], r = o.r === void 0 ? 1 : o.r;
      if (kind === "spiral") {
        const dome = o.dome || 0;
        for (let i = 0; i < n; i++) {
          const t = Math.sqrt((i + 0.5) / n), a = i * GA, ph = t * dome * (Math.PI / 2), rad = dome > 0 ? r * Math.sin(ph) / Math.sin(dome * (Math.PI / 2)) : r * t, y = dome > 0 ? r * (Math.cos(ph) - Math.cos(dome * (Math.PI / 2))) / Math.sin(dome * (Math.PI / 2)) : 0, dir = norm([
            Math.cos(a) * Math.sin(ph + (o.tilt || 0)),
            Math.cos(ph + (o.tilt || 0)),
            Math.sin(a) * Math.sin(ph + (o.tilt || 0))
          ]);
          out.push({ p: [Math.cos(a) * rad, y, Math.sin(a) * rad], dir, up: [0, 1, 0], s: 1 - 0.35 * t, t });
        }
      } else if (kind === "whorl") {
        const rings = o.rings || 3, per = o.per || Math.max(1, Math.round(n / rings)), rise = o.rise === void 0 ? 0.3 : o.rise, twist = o.twist === void 0 ? 0.5 / per : o.twist;
        for (let k = 0; k < rings; k++)
          for (let j = 0; j < per; j++) {
            const a = (j + k * twist * per) / per * TAU, t = rings === 1 ? 0 : k / (rings - 1), rk = r * (1 - (o.taper || 0) * t), up = o.lift === void 0 ? 0.25 : o.lift;
            out.push({
              p: [Math.cos(a) * rk * 0.1, k * rise, Math.sin(a) * rk * 0.1],
              dir: norm([Math.cos(a), up + t * (o.close || 0), Math.sin(a)]),
              up: [0, 1, 0],
              s: (1 - (o.taper || 0) * t) * rk,
              t
            });
          }
      } else if (kind === "rosette") {
        const rings = o.rings || 3, per = o.per || 6, open = o.open === void 0 ? 0.7 : o.open;
        for (let k = 0; k < rings; k++)
          for (let j = 0; j < per; j++) {
            const t = rings === 1 ? 1 : k / (rings - 1), a = (j + k % 2 * 0.5) / per * TAU, el = (1 - open * (0.35 + 0.65 * t)) * (Math.PI / 2), s = 0.45 + 0.55 * t;
            out.push({
              p: [Math.cos(a) * r * 0.12 * t, 0.04 * (1 - t), Math.sin(a) * r * 0.12 * t],
              dir: norm([Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)]),
              up: [0, 1, 0],
              s: s * r,
              t
            });
          }
      } else throw new Error("K.grow.arrange: no arrangement called " + kind + " (spiral, whorl, rosette)");
      return out;
    },
    put(fr, at, yaw, scale) {
      const c = Math.cos(yaw || 0), s = Math.sin(yaw || 0), k = scale === void 0 ? 1 : scale, tr = (v) => [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
      const p = tr(fr.p);
      return {
        p: [at[0] + p[0] * k, at[1] + p[1] * k, at[2] + p[2] * k],
        dir: tr(fr.dir),
        up: fr.up,
        s: fr.s * k,
        t: fr.t
      };
    },
    rock(S, c, r, mat, o) {
      o = o || {};
      const R = dice(o.seed || 5), sq = o.squash || [1, 1, 1], chip = o.chip === void 0 ? 0.3 : o.chip, worn = (o.worn === void 0 ? 0.12 : o.worn) * r, nf = o.facets === void 0 ? 7 : o.facets, flat = o.flat === void 0 ? o.settle ? 0.55 : 0 : o.flat, planes = [];
      for (let i = 0; i < nf; i++) {
        const y = R() * 1.5 - 0.5, a = R() * TAU, q = Math.sqrt(Math.max(0, 1 - Math.min(1, y * y)));
        planes.push([q * Math.cos(a), Math.min(1, y), q * Math.sin(a), r * (1 - chip * (0.25 + 0.75 * R()))]);
      }
      const beds = o.beds, bn = beds ? norm([beds.tilt ? beds.tilt[0] : 0.12, 1, beds.tilt ? beds.tilt[1] : 0.05]) : null, bth = beds ? 2 * r * sq[1] / (beds.n || 5) : 1, bd = beds ? beds.depth === void 0 ? 0.06 * r : beds.depth : 0, inset = [];
      for (let i = 0; i < 40; i++) inset.push(R());
      const smax = (a, b, k) => {
        if (k <= 0) return Math.max(a, b);
        const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (a - b) / k));
        return b + (a - b) * h + k * h * (1 - h);
      };
      const sd = (x, y, z) => {
        const px = x / sq[0], py = y / sq[1], pz = z / sq[2];
        let d = Math.hypot(px, py, pz) - r;
        for (let i = 0; i < nf; i++) {
          const pl = planes[i];
          d = smax(d, px * pl[0] + py * pl[1] + pz * pl[2] - pl[3], worn);
        }
        if (flat) d = smax(d, -py - flat * r, worn);
        d *= Math.min(sq[0], sq[1], sq[2]);
        if (beds) {
          const u = (x * bn[0] + y * bn[1] + z * bn[2]) / bth + 20, k = Math.floor(u), f = u - k, edge = Math.min(f, 1 - f), a0 = inset[(k % 40 + 40) % 40], a1 = inset[((k + 1) % 40 + 40) % 40], t = Math.max(0, Math.min(1, (f - 0.8) / 0.2)), iv = a0 + (a1 - a0) * t * t * (3 - 2 * t), gq = edge < 0.2 ? 1 - edge / 0.2 * (edge / 0.2) : 0, gv = gq * gq;
          d += bd * (0.7 * iv + (beds.groove === void 0 ? 0.6 : beds.groove) * gv);
        }
        return d;
      };
      const big = Math.max(sq[0], sq[1], sq[2]);
      if (o.settle) {
        const rest = K.grow.settle(S, sd, c, {
          r: r * big,
          lean: o.lean === void 0 ? 0.6 : o.lean,
          sink: o.sink === void 0 ? r * 0.06 : o.sink
        });
        c = rest.at;
        c[1] -= (o.bury === void 0 ? 0.2 : o.bury) * r * sq[1];
        const u = rest.up, t1 = norm([u[1], -u[0], 0]), t2 = cross(u, t1);
        if (Math.abs(u[1]) < 0.9999) o = Object.assign({}, o, { ax: [t1, u, t2] });
      }
      return S.solid(
        c,
        r * big,
        sd,
        (res, f) => {
          const shells = beds ? [
            [1, 1.5],
            [1 - chip * 0.45, 0.5],
            [1 - chip * 0.8, 0.4]
          ] : [[1, 1.5]];
          for (const [k, dens] of shells) {
            const n = Math.ceil(dens * 4 * Math.PI * r * r * k * k * big * big / (res * res)), tw = k * 1.7;
            for (let i = 0; i < n; i++) {
              const y = 1 - 2 * (i + 0.5) / n, q = Math.sqrt(Math.max(0, 1 - y * y)), a = i * GA + tw;
              f(q * Math.cos(a) * r * k * sq[0], y * r * k * sq[1], q * Math.sin(a) * r * k * sq[2]);
            }
          }
        },
        mat,
        Object.assign({ reach: r * big * chip + bd * 2 + worn }, o)
      );
    },
    seen: [],
    over: {},
    species(def) {
      const name = def.name, rng = (k) => name && K.grow.over[name + "." + k] || def.vary[k];
      if (name && !K.grow.seen.some((q) => q.name === name))
        K.grow.seen.push({ name, vary: Object.assign({}, def.vary), limits: def.limits || {}, share: 1 });
      const draw = (at) => {
        const R = dice(
          (def.seed || 1) * 7919 + Math.round(at[0] * 97) * 31 + Math.round(at[2] * 89) * 17 + Math.round((at[1] || 0) * 13)
        ), v = { rnd: R };
        for (const k in def.vary || {}) {
          const r = rng(k);
          v[k] = r[0] + R() * (r[1] - r[0]);
        }
        return v;
      };
      const share = () => name && K.grow.over[name + ".share"] !== void 0 ? K.grow.over[name + ".share"] : 1;
      const keep = (q) => dice(Math.round(q.p[0] * 131) * 7 + Math.round(q.p[2] * 137) * 13 + 5)() < share();
      return {
        draw,
        grow: (S, at, k, extra) => def.make(S, at, draw(at), k === void 0 ? 1 : k, extra),
        sow(S, places, o) {
          o = o || {};
          places = places.filter(keep);
          if (!o.instances) {
            for (const q of places) def.make(S, q.p, draw(q.p), q.s, q);
            return places.length;
          }
          const tpls = [];
          for (let k = 0; k < o.instances; k++) {
            const at = [k * 3.7 + 0.5, 0, k * 1.3 + 0.25];
            tpls.push(S.template((S2) => def.make(S2, [0, 0, 0], draw(at), 1, null), { res: o.res }));
          }
          for (const q of places) {
            const R = dice(Math.round(q.p[0] * 977) + Math.round(q.p[2] * 557) * 3 + 11);
            S.place(tpls[Math.floor(R() * tpls.length)], q.p, {
              yaw: q.yaw,
              scale: q.s,
              up: q.n,
              lean: o.lean === void 0 ? 0.5 : o.lean,
              sway: o.sway,
              solid: o.solid
            });
          }
          return places.length;
        }
      };
    },
    settle(S, sd, at, o) {
      o = o || {};
      S.ready();
      let pts = o.pts;
      if (!pts) {
        pts = [];
        const r = o.r || 1;
        for (let i = 0; i < 260; i++) {
          const y = 1 - 2 * (i + 0.5) / 260, q = Math.sqrt(1 - y * y), a = i * GA;
          let p = [q * Math.cos(a) * r * 1.6, y * r * 1.6, q * Math.sin(a) * r * 1.6];
          for (let it = 0; it < 40; it++) {
            const d = sd(p[0], p[1], p[2]);
            if (Math.abs(d) < 1e-3) break;
            const g = grad(sd, p[0], p[1], p[2]);
            p = [p[0] - g[0] * d * 0.9, p[1] - g[1] * d * 0.9, p[2] - g[2] * d * 0.9];
          }
          if (p[1] < r * 0.2) pts.push(p);
        }
      }
      const c = at.slice(), gap = () => {
        let g = 9;
        for (const p of pts) g = Math.min(g, S.sdf(c[0] + p[0], c[1] + p[1], c[2] + p[2]));
        return g;
      };
      const contact = () => {
        let g = 9, bp = null;
        for (const p of pts) {
          const d = S.sdf(c[0] + p[0], c[1] + p[1], c[2] + p[2]);
          if (d < g) g = d, bp = p;
        }
        return bp ? grad(S.sdf, c[0] + bp[0], c[1] + bp[1] - 0.02, c[2] + bp[2]) : [0, 1, 0];
      };
      let slides = 0;
      for (let it = 0; it < 600; it++) {
        const g = gap();
        if (g < 0.01) {
          const n = contact();
          if (n[1] > 0.7 || slides > 160) break;
          const h = Math.hypot(n[0], n[2]) || 1;
          c[0] += n[0] / h * 0.04;
          c[2] += n[2] / h * 0.04;
          c[1] += 4e-3;
          slides++;
          continue;
        }
        c[1] -= Math.max(5e-3, g * 0.9);
        if (c[1] < at[1] - (o.fall || 40)) break;
      }
      c[1] -= o.sink === void 0 ? 0.03 : o.sink;
      let up = [0, 1, 0];
      if (o.lean) {
        const fr = o.r || 1, ns = [0, 0, 0];
        for (const [dx, dz] of [
          [0, 0],
          [fr * 0.6, 0],
          [-fr * 0.6, 0],
          [0, fr * 0.6],
          [0, -fr * 0.6]
        ]) {
          const y = S.heightAt(c[0] + dx, c[2] + dz, c[1] + 0.2, fr * 3);
          if (y > 1e8 || y < -1e8) continue;
          const g = grad(S.sdf, c[0] + dx, y, c[2] + dz);
          ns[0] += g[0];
          ns[1] += g[1];
          ns[2] += g[2];
        }
        up = norm([ns[0] * o.lean, 1 + (norm(ns)[1] - 1) * o.lean, ns[2] * o.lean]);
      }
      return { at: c, up };
    },
    creep(S, o) {
      o = o || {};
      S.ready();
      const R = dice(o.seed || 19), paths = [], nodes = [], hug = o.hug === void 0 ? 0.04 : o.hug, step = o.step || 0.1, want = norm(o.dir || [0, 1, 0]), wander = o.wander === void 0 ? 0.45 : o.wander, sdf = o.on ? o.on.sd ? (x, y, z) => o.on.sd(x, y, z) : o.on : S.sdf;
      const onto = (p) => {
        for (let k = 0; k < 6; k++) {
          const d = sdf(p[0], p[1], p[2]) - hug;
          if (Math.abs(d) < 3e-3) break;
          const g = grad(sdf, p[0], p[1], p[2]);
          p = [p[0] - g[0] * d, p[1] - g[1] * d, p[2] - g[2] * d];
        }
        return p;
      };
      const walk = (p, head, steps, depth, s0) => {
        const path = [p.slice()];
        path.start = s0;
        for (let i = 0; i < steps; i++) {
          const n = grad(sdf, p[0], p[1], p[2]), mix = [
            head[0] * 0.7 + want[0] * 0.3 + (R() - 0.5) * wander,
            head[1] * 0.7 + want[1] * 0.3 + (R() - 0.5) * wander,
            head[2] * 0.7 + want[2] * 0.3 + (R() - 0.5) * wander
          ], dn = mix[0] * n[0] + mix[1] * n[1] + mix[2] * n[2];
          head = norm([mix[0] - n[0] * dn, mix[1] - n[1] * dn, mix[2] - n[2] * dn]);
          const q = onto([p[0] + head[0] * step, p[1] + head[1] * step, p[2] + head[2] * step]);
          if (Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) > step * 2.5) break;
          if (o.on && S.sdf(q[0], q[1], q[2]) < hug * 0.5 - 0.02) break;
          if (stop(q)) break;
          p = q;
          path.push(p.slice());
          if (i % (o.every || 3) === 1)
            nodes.push({
              p: p.slice(),
              n,
              dir: head.slice(),
              t: i / steps,
              depth,
              k: s0 + i
            });
          if (depth < (o.depth || 2) && R() < (o.branch === void 0 ? 0.06 : o.branch)) {
            const c = [
              head[1] * n[2] - head[2] * n[1],
              head[2] * n[0] - head[0] * n[2],
              head[0] * n[1] - head[1] * n[0]
            ], sg = R() < 0.5 ? -1 : 1;
            walk(
              p.slice(),
              norm([head[0] + c[0] * sg * 1.2, head[1] + c[1] * sg * 1.2, head[2] + c[2] * sg * 1.2]),
              Math.floor((steps - i) * 0.6),
              depth + 1,
              s0 + i
            );
          }
        }
        if (path.length > 2) paths.push(path);
      };
      const start = onto(o.from || [0, 0, 0]), stop = o.stop || (() => false);
      walk(start, want, o.steps || 60, 0, 0);
      return { paths, nodes };
    },
    /* leaves, cheaply: a few leaf shapes baked once (S.template) and copies placed with a whole orientation, not as solids in the
       field. -> put(at, dir (the way it points), up (the way its face faces), length). o: { kinds (3), wide (0.27), fold (0.3),
       res (for the template, whose leaf is 1 long), sway }. Each kind is a little different (width, curl). */
    leaves(S, mat, o) {
      o = o || {};
      const kinds = [];
      for (let k = 0; k < (o.kinds || 3); k++) {
        const wide = (o.wide || 0.27) * (0.85 + 0.15 * k), curl = 0.08 * (k - 1);
        kinds.push(
          S.template(
            (S2) => K.sweep(
              S2,
              [
                [0, 0, 0],
                [0, curl, 0.5],
                [0, -0.1 + curl, 1]
              ],
              { w: K.sweep.leaf(wide), h: 0.03, fold: o.fold === void 0 ? 0.3 : o.fold },
              mat,
              { up: [0, 1, 0] }
            ),
            { res: o.res || 0.09 }
          )
        );
      }
      let n = 0;
      return (at, dir, up, len, born) => {
        const z = norm(dir), x = norm(cross(up, z)), y = cross(z, x);
        S.place(kinds[n++ % kinds.length], at, {
          R: [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]],
          scale: len,
          solid: false,
          sway: born === void 0 ? o.sway : void 0,
          // (a leaf that grows cannot sway as a whole: both use the same number)
          born
        });
      };
    },
    vine(S, grown, stem, leaf, o) {
      o = o || {};
      const r = o.r || 0.025, G = Object.assign(S.grp(o.melt === void 0 ? 0.02 : o.melt), { res: o.res || 0.03 });
      const gw = o.grow || 0;
      for (const p of grown.paths)
        S.tube(
          K.curve.resample(p, Math.max(2, Math.ceil(p.length / 4))),
          r,
          r * 0.5,
          stem,
          gw ? Object.assign(
            { born: (x, y, z, al) => ((p.start || 0) + al * (p.length - 1)) * gw },
            G
          ) : G
        );
      const R = dice(o.seed || 23), size = o.size || 0.16;
      let put = null;
      for (const nd of grown.nodes) {
        if (R() > (o.leaves === void 0 ? 0.8 : o.leaves)) continue;
        const side = [
          nd.dir[1] * nd.n[2] - nd.dir[2] * nd.n[1],
          nd.dir[2] * nd.n[0] - nd.dir[0] * nd.n[2],
          nd.dir[0] * nd.n[1] - nd.dir[1] * nd.n[0]
        ], sg = R() < 0.5 ? -1 : 1, k = size * (0.7 + 0.6 * R()) * (1 - 0.4 * nd.t), d = norm([
          side[0] * sg + nd.n[0] * 0.6 + nd.dir[0] * 0.3,
          side[1] * sg + nd.n[1] * 0.6 + nd.dir[1] * 0.3,
          side[2] * sg + nd.n[2] * 0.6 + nd.dir[2] * 0.3
        ]), a = nd.p, b = [a[0] + d[0] * k * 0.5, a[1] + d[1] * k * 0.5 + 0.01, a[2] + d[2] * k * 0.5], c = [a[0] + d[0] * k, a[1] + d[1] * k - k * 0.15, a[2] + d[2] * k];
        if (o.cheap === false)
          K.sweep(S, [a, b, c], { w: K.sweep.leaf(k * 0.28), h: 8e-3, fold: 0.3 }, leaf, {
            up: nd.n,
            res: o.leafRes || 0.025
          });
        else
          (put || (put = K.grow.leaves(S, leaf, { res: (o.leafRes || 0.025) / size })))(
            a,
            [c[0] - a[0], c[1] - a[1], c[2] - a[2]],
            nd.n,
            k,
            gw ? ((nd.k || 0) + 3) * gw : void 0
          );
      }
    },
    spread(S, o) {
      o = o || {};
      S.ready();
      const R = dice(o.seed || 29), gap = o.gap || 0.12, sdf = S.sdf, cell = gap, map = /* @__PURE__ */ new Map(), key = (x, y, z) => Math.floor(x / cell) + "," + Math.floor(y / cell) + "," + Math.floor(z / cell), pts = [], near = (x, y, z, r) => {
        const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell), k = Math.ceil(r / cell);
        for (let a = -k; a <= k; a++)
          for (let b = -k; b <= k; b++)
            for (let c = -k; c <= k; c++) {
              const L = map.get(cx + a + "," + (cy + b) + "," + (cz + c));
              if (L) {
                for (const q of L) if ((q[0] - x) ** 2 + (q[1] - y) ** 2 + (q[2] - z) ** 2 < r * r) return true;
              }
            }
        return false;
      }, put = (p) => {
        p.step = stepNow;
        pts.push(p);
        const k = key(p[0], p[1], p[2]);
        (map.get(k) || map.set(k, []).get(k)).push(p);
      }, onto = (p) => {
        for (let k = 0; k < 5; k++) {
          const d = sdf(p[0], p[1], p[2]);
          if (Math.abs(d) < 3e-3) break;
          const g = grad(sdf, p[0], p[1], p[2]);
          p = [p[0] - g[0] * d, p[1] - g[1] * d, p[2] - g[2] * d];
        }
        return p;
      };
      let front = [], stepNow = 0;
      for (const s0 of o.from || []) {
        const p = onto(s0.p || s0);
        put(p);
        front.push(p);
      }
      for (let st = 0; st < (o.steps || 12) && front.length; st++) {
        stepNow = st + 1;
        const next = [];
        for (const p of front) {
          const n = grad(sdf, p[0], p[1], p[2]);
          for (let k = 0; k < (o.tries || 4); k++) {
            const a = R() * Math.PI * 2, t1 = norm(Math.abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [1, 0, 0]), t2 = [n[1] * t1[2] - n[2] * t1[1], n[2] * t1[0] - n[0] * t1[2], n[0] * t1[1] - n[1] * t1[0]], dd = gap * (1 + R() * 0.6), q = onto([
              p[0] + (t1[0] * Math.cos(a) + t2[0] * Math.sin(a)) * dd,
              p[1] + (t1[1] * Math.cos(a) + t2[1] * Math.sin(a)) * dd,
              p[2] + (t1[2] * Math.cos(a) + t2[2] * Math.sin(a)) * dd
            ]);
            if (near(q[0], q[1], q[2], gap * 0.8)) continue;
            if (o.ok && !o.ok(q[0], q[1], q[2], grad(sdf, q[0], q[1], q[2]))) continue;
            if (R() > (o.chance === void 0 ? 0.8 : o.chance)) continue;
            put(q);
            next.push(q);
          }
        }
        front = next;
      }
      const when = (x, y, z) => {
        const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
        let best = 1e9, st = o.steps || 12;
        for (let a = -2; a <= 2; a++)
          for (let b = -2; b <= 2; b++)
            for (let c = -2; c <= 2; c++) {
              const L = map.get(cx + a + "," + (cy + b) + "," + (cz + c));
              if (L)
                for (const q of L) {
                  const d = (q[0] - x) ** 2 + (q[1] - y) ** 2 + (q[2] - z) ** 2;
                  if (d < best) best = d, st = q.step;
                }
            }
        return st;
      };
      return { pts, has: (x, y, z, r) => near(x, y, z, r || gap), when };
    },
    scatterIn(S, sd, o) {
      o = o || {};
      const R = dice(o.seed || 31), b = o.box, out = [], gap = o.gap || 0.1;
      for (let tries = 0; tries < (o.n || 30) * 30 && out.length < (o.n || 30); tries++) {
        const p = [b[0] + R() * (b[1] - b[0]), b[2] + R() * (b[3] - b[2]), b[4] + R() * (b[5] - b[4])];
        if (sd(p[0], p[1], p[2]) > -(o.margin || 0)) continue;
        if (out.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < gap)) continue;
        out.push(p);
      }
      return out;
    },
    ray(S, from, dir, far) {
      const d = norm(dir);
      let t = 0;
      for (let i = 0; i < 300 && t < (far || 30); i++) {
        const p = [from[0] + d[0] * t, from[1] + d[1] * t, from[2] + d[2] * t], h = S.sdf(p[0], p[1], p[2]);
        if (h < 3e-3) return { p, n: grad(S.sdf, p[0], p[1], p[2]), d: t };
        t += Math.max(0.01, h * 0.9);
      }
      return null;
    }
  };
})(KIT);
