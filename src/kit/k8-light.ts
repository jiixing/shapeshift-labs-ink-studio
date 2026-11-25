/* k8-light: lights that move after the bake.
   While a diorama is sculpted, K.light.capture(B, S) notes for every plain splat which colour ramp it was shaded on, how bright it came out,
   and which way its surface faces. Afterwards a light can be carried about and each splat it reaches steps up its own ramp: still only the
   palette's colours, never a tint. A splat on a rigged part turns its normal with the part.
     const cap = K.light.capture(B, S)        (before S.bake())
     const lamp = { p: [x, y, z], r: 6, s: 0.9 }
     const lit = st.add(K.light.system(st, cap, [lamp]))   (add it BEFORE soot, frost and artwork, which paint over it)
     lamp.p = [...]; lit.touch()              move it, then say so.   lit.flash(0.5, 0.15) brightens everything for a moment (lightning)
   A lamp that stays where it is can have more, each of it optional:
     K.light.shadow(st, cap, lamp, S.sdf)     works out once what the lamp can and cannot see, so it casts shadows; after that it can be
                                              dimmed, switched (lamp.off) and recoloured as often as wanted, at no cost. Move it and call again.
     lamp.ramp = [12, 13, 16]                 its own colours, dark to bright: where it is the main light on a splat, the splat is painted
                                              from this ramp, not its own (a fire's orange on stone)
     st.add(K.light.flicker(lit, lamp, { rate: 9, depth: 0.3 }))   it gutters: its strength wanders, and what it lights follows */
type K8Vec3 = readonly number[];
type K8Ramp = readonly number[];
type K8Sdf = (x: number, y: number, z: number) => number;
type K8Tap = (ramp: K8Ramp, t: number, nx: number, ny: number, nz: number, flat: boolean) => void;

interface K8Builder {
  count(): number;
}

interface K8Sculpt {
  tap: K8Tap;
}

interface K8Capture {
  ramp: number[];
  t: number[];
  n: K8Vec3[];
  ramps: K8Ramp[];
  ids: Map<K8Ramp, number>;
}

interface K8Rig {
  bid: ArrayLike<number>;
  M: Float32Array;
  part(name: string): number;
}

interface K8Stage {
  N: number;
  D: Float32Array;
  base?: Float32Array;
  W: { pal: number[] };
  rig?: K8Rig | null;
  repaint(i: number): void;
}

interface K8Grid {
  near(x: number, y: number, z: number, radius: number, visit: (i: number, distance: number) => void): void;
}

interface K8Lamp {
  p: K8Vec3;
  r: number;
  s: number;
  off?: boolean;
  ramp?: K8Ramp | null;
  vis?: Uint8Array;
}

interface K8Sun {
  dir: K8Vec3;
  amb: number;
  sky: number;
  k: number;
  parts: string[];
  shade?: (x: number, y: number, z: number) => number;
}

interface K8LightOptions {
  sun?: K8Sun | null;
}

interface K8ShadowOptions {
  dark?: number;
}

interface K8FlickerOptions {
  rate?: number;
  depth?: number;
}

interface K8LightSystem {
  lights: K8Lamp[];
  count: number;
  live?: number;
  touch(): void;
  flash(amount: number, duration?: number): void;
  update(dt: number): void;
  paint(i: number, color: number[]): void;
}

interface K8FlickerSystem {
  update(dt: number, t: number): void;
}

interface K8LightApi {
  capture(B: K8Builder, S: K8Sculpt): K8Capture;
  system(st: K8Stage, cap: K8Capture, lights: K8Lamp[], options?: K8LightOptions | null): K8LightSystem;
  shadow(st: K8Stage, cap: K8Capture, lamp: K8Lamp, sdf: K8Sdf, options?: K8ShadowOptions | null): number;
  flicker(sys: K8LightSystem, lamp: K8Lamp, options?: K8FlickerOptions | null): K8FlickerSystem;
}

interface K8KitHost {
  light: K8LightApi;
  clamp(value: number, min: number, max: number): number;
  grid(st: K8Stage, cell: number): K8Grid;
}

declare const KIT: K8KitHost;

(function (K) {
  K.light = {
    capture(B, S) {
      const cap: K8Capture = { ramp: [], t: [], n: [], ramps: [], ids: new Map() };
      S.tap = (ramp: K8Ramp, t: number, nx: number, ny: number, nz: number, flat: boolean) => {
        if (flat) return;
        const i = B.count();
        let id = cap.ids.get(ramp);
        if (id === undefined) {
          id = cap.ramps.length;
          cap.ramps.push(ramp);
          cap.ids.set(ramp, id);
        }
        cap.ramp[i] = id + 1;
        cap.t[i] = t;
        cap.n[i] = [nx, ny, nz];
      };
      return cap;
    },
    system(st, cap, lights, o) {
      o = o || {};
      const N = st.N,
        D = st.D,
        has = new Uint8Array(N),
        T = new Float32Array(N),
        NR = new Float32Array(N * 3),
        RI = new Uint16Array(N),
        cur = new Int16Array(N).fill(-1),
        over = new Int16Array(N).fill(-1),
        list: number[] = [],
        pal = st.W.pal;
      let seen = -1,
        version = 0,
        flash = 0,
        flashT = 0;
      for (let i = 0; i < N; i++)
        if (cap.ramp[i]) {
          has[i] = 1;
          RI[i] = cap.ramp[i] - 1;
          T[i] = cap.t[i];
          NR[i * 3] = cap.n[i][0];
          NR[i * 3 + 1] = cap.n[i][1];
          NR[i * 3 + 2] = cap.n[i][2];
          list.push(i);
          const rp = cap.ramps[RI[i]];
          cur[i] = K.clamp(Math.floor(T[i] * rp.length), 0, rp.length - 1);
        }
      // Only splats a lamp can reach are looked at: those in the cells round each lamp (by where they rest), those on rigged parts (which may have
      // moved into reach), and those that were lit last time (so they go dark again when the lamp leaves). A flash looks at everything.
      const grid = K.grid(st, 1.2),
        movers: number[] = [],
        mark = new Uint8Array(N);
      let prev: number[] = [],
        work: number[] = [],
        wasFlash = false;
      if (st.rig) for (const i of list) if (st.rig.bid[i]) movers.push(i);
      // o.sun = { dir, amb, sky, k, parts: [names] }: for those rig parts the sun's share is worked out from the normal as it now points; only fine detail is kept from the bake
      const sun = o.sun || null,
        live = new Uint8Array(N),
        fine = new Float32Array(N);
      if (sun && st.rig) {
        const want = new Set(sun.parts.map(n => st.rig!.part(n)));
        for (const i of list)
          if (want.has(st.rig!.bid[i])) {
            live[i] = 1;
            const nx = NR[i * 3],
              ny = NR[i * 3 + 1],
              nz = NR[i * 3 + 2];
            fine[i] = K.clamp(
              T[i] -
                (sun.amb +
                  sun.sky * (0.5 + 0.5 * ny) +
                  sun.k * Math.max(0, nx * sun.dir[0] + ny * sun.dir[1] + nz * sun.dir[2])),
              -0.09,
              0.09
            );
          }
      }
      const sys: K8LightSystem = {
        lights,
        count: list.length,
        touch() {
          version++;
        },
        flash(amount, dur) {
          flash = amount;
          flashT = dur || 0.12;
          version++;
        },
        update(dt) {
          if (flashT > 0) {
            flashT -= dt;
            version++;
            if (flashT <= 0) flash = 0;
          }
          if (seen === version && !sys.live) return;
          seen = version;
          const rig = st.rig,
            Mx = rig ? rig.M : null,
            bid = rig ? rig.bid : null;
          if (flash > 0 || wasFlash) work = list;
          else {
            work = [];
            const push = (i: number) => {
              if (!mark[i] && has[i]) {
                mark[i] = 1;
                work.push(i);
              }
            };
            for (const L of lights) if (!L.off) grid.near(L.p[0], L.p[1], L.p[2], L.r, push);
            for (const i of movers) push(i);
            for (const i of prev) push(i);
            for (const i of work) mark[i] = 0;
          }
          wasFlash = flash > 0;
          const lit: number[] = [];
          for (let m = 0; m < work.length; m++) {
            const i = work[m],
              q = i * 16,
              x = D[q],
              y = D[q + 1],
              z = D[q + 2];
            let add = flash,
              lbest = 0,
              lb: K8Lamp | null = null,
              nx = NR[i * 3],
              ny = NR[i * 3 + 1],
              nz = NR[i * 3 + 2],
              turned = false;
            for (const L of lights) {
              if (L.off) continue;
              const lx = L.p[0] - x,
                ly = L.p[1] - y,
                lz = L.p[2] - z,
                d2 = lx * lx + ly * ly + lz * lz;
              if (d2 > L.r * L.r) continue;
              if (!turned && bid && bid[i]) {
                const k = bid[i] * 12,
                  a = Mx![k] * nx + Mx![k + 1] * ny + Mx![k + 2] * nz,
                  b = Mx![k + 3] * nx + Mx![k + 4] * ny + Mx![k + 5] * nz,
                  c = Mx![k + 6] * nx + Mx![k + 7] * ny + Mx![k + 8] * nz,
                  l = Math.hypot(a, b, c) || 1;
                nx = a / l;
                ny = b / l;
                nz = c / l;
                turned = true;
              }
              const dist = Math.sqrt(d2) || 1e-3,
                nd = (nx * lx + ny * ly + nz * lz) / dist,
                fa = 1 - dist / L.r;
              const share = fa * fa * L.s * (0.2 + 0.8 * Math.max(nd, 0)) * (L.vis ? L.vis[i] / 255 : 1);
              add += share;
              if (L.ramp && share > lbest) ((lbest = share), (lb = L));
            }
            let base = T[i];
            if (live[i]) {
              if (!turned && bid![i]) {
                const k = bid![i] * 12,
                  a = Mx![k] * nx + Mx![k + 1] * ny + Mx![k + 2] * nz,
                  b = Mx![k + 3] * nx + Mx![k + 4] * ny + Mx![k + 5] * nz,
                  c = Mx![k + 6] * nx + Mx![k + 7] * ny + Mx![k + 8] * nz,
                  l = Math.hypot(a, b, c) || 1;
                nx = a / l;
                ny = b / l;
                nz = c / l;
              }
              base =
                sun!.amb +
                sun!.sky * (0.5 + 0.5 * ny) +
                sun!.k * Math.max(0, nx * sun!.dir[0] + ny * sun!.dir[1] + nz * sun!.dir[2]) +
                fine[i];
              if (sun!.shade) base *= sun!.shade(x, y, z);
            }
            const rp = cap.ramps[RI[i]],
              idx = K.clamp(Math.floor((base + add) * rp.length), 0, rp.length - 1),
              /* a lamp with colours of its own takes the splat over where it is most of the light there */
              ov =
                lb && lbest > base * 0.8
                  ? lb.ramp![K.clamp(Math.floor((base + add) * lb.ramp!.length), 0, lb.ramp!.length - 1)]
                  : -1;
            if (add > 0) lit.push(i);
            if (idx !== cur[i] || ov !== over[i]) {
              cur[i] = idx;
              over[i] = ov;
              st.repaint(i);
            }
          }
          prev = lit;
        },
        paint(i, c) {
          if (!has[i]) return;
          const h = pal[over[i] >= 0 ? over[i] : cap.ramps[RI[i]][cur[i]]];
          c[0] = ((h >> 16) & 255) / 255;
          c[1] = ((h >> 8) & 255) / 255;
          c[2] = (h & 255) / 255;
        }
      };
      return sys;
    },
    /* what a lamp that stays put can see: for every captured splat in its reach, a line is walked through the field toward the lamp, and
       a splat with something in the way gets only a little of it (as a baked lamp's shadow does). Kept on the lamp as lamp.vis. */
    shadow(st, cap, lamp, sdf, o) {
      o = o || {};
      const N = st.N,
        D = st.base || st.D,
        vis = new Uint8Array(N).fill(255),
        dark = Math.round(255 * (o.dark === undefined ? 0.12 : o.dark));
      let n = 0;
      for (let i = 0; i < N; i++) {
        if (!cap.ramp[i]) continue;
        const q = i * 16,
          nv = cap.n[i],
          x = D[q] + nv[0] * 0.05,
          y = D[q + 1] + nv[1] * 0.05,
          z = D[q + 2] + nv[2] * 0.05,
          lx = lamp.p[0] - x,
          ly = lamp.p[1] - y,
          lz = lamp.p[2] - z,
          dist = Math.hypot(lx, ly, lz);
        if (dist > lamp.r || dist < 0.2) continue;
        let t = 0.08;
        for (let k = 0; k < 32 && t < dist - 0.12; k++) {
          const h = sdf(x + (lx / dist) * t, y + (ly / dist) * t, z + (lz / dist) * t);
          if (h < 0.004) {
            vis[i] = dark;
            n++;
            break;
          }
          t += h < 0.06 ? 0.06 : h;
        }
      }
      lamp.vis = vis;
      return n;
    },
    /* a lamp that gutters: a system to add to the stage. Its strength wanders about what it was given (two slow waves and a quick one,
       never a plain sine), and the light system is told. o: { rate (9), depth (0.3) } */
    flicker(sys, lamp, o) {
      o = o || {};
      const s0 = lamp.s,
        rate = o.rate || 9,
        depth = o.depth === undefined ? 0.3 : o.depth,
        ph = (lamp.p[0] * 12.9898 + lamp.p[2] * 78.233) % 6.28;
      let was = -1;
      return {
        update(dt, t) {
          const w =
              0.5 * Math.sin(t * rate + ph) +
              0.3 * Math.sin(t * rate * 2.31 + ph * 1.7) +
              0.2 * Math.sin(t * rate * 0.43 + ph * 0.6),
            s = s0 * (1 - depth * (0.5 + 0.5 * w)),
            q = Math.round(s * 24);
          lamp.s = s;
          if (q !== was) {
            was = q;
            sys.touch();
          }
        }
      };
    }
  };
})(KIT);

export {};
