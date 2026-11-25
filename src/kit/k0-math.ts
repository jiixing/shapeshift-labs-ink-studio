// KIT: the lab's shared modules. Everything hangs off one name so nothing here can collide with the game's own code.
// k0-math: vectors, 3x3 matrices, easing, keyed values, springs.
type k0MathVec3 = [number, number, number];
type k0MathMat3 = [number, number, number, number, number, number, number, number, number];

interface k0MathVectors {
  add(a: readonly number[], b: readonly number[]): k0MathVec3;
  sub(a: readonly number[], b: readonly number[]): k0MathVec3;
  mul(a: readonly number[], s: number): k0MathVec3;
  dot(a: readonly number[], b: readonly number[]): number;
  cross(a: readonly number[], b: readonly number[]): k0MathVec3;
  len(a: readonly number[]): number;
  norm(a: readonly number[], fallback?: k0MathVec3): k0MathVec3;
  lerp(a: readonly number[], b: readonly number[], t: number): k0MathVec3;
  mad(a: readonly number[], b: readonly number[], s: number): k0MathVec3;
  dist(a: readonly number[], b: readonly number[]): number;
  perp(d: readonly number[]): k0MathVec3;
}

interface k0MathMatrices {
  id(): k0MathMat3;
  rot(axis: readonly number[], angle: number): k0MathMat3;
  mul(a: k0MathMat3, b: k0MathMat3): k0MathMat3;
  app(matrix: k0MathMat3, vector: readonly number[]): k0MathVec3;
  tr(matrix: k0MathMat3): k0MathMat3;
  aim(from: readonly number[], to: readonly number[]): k0MathMat3;
  stretch(direction: readonly number[], scale: number, keep: boolean): k0MathMat3;
  cols(a: readonly number[], b: readonly number[], c: readonly number[]): k0MathMat3;
  det(matrix: k0MathMat3): number;
  inv(matrix: k0MathMat3): k0MathMat3;
  polar(matrix: k0MathMat3): k0MathMat3;
  turnOf(matrix: k0MathMat3, initial?: k0MathMat3 | null, iterations?: number): k0MathMat3;
}

interface k0MathEasing {
  linear(x: number): number;
  smooth(x: number): number;
  in(x: number): number;
  out(x: number): number;
  in3(x: number): number;
  out3(x: number): number;
  inout3(x: number): number;
  back(x: number): number;
  elastic(x: number): number;
  bounce(x: number): number;
  step(x: number): number;
}

type k0MathEaseName = keyof k0MathEasing;
type k0MathKey = number | k0MathEaseName;

interface k0MathSpring {
  x: number | number[];
  v: number | number[];
  stiff: number;
  damp: number;
  step(target: number | number[], dt: number): number | number[];
  kick(dv: number | number[]): void;
}

type k0MathSpringFactory = (x0: number | number[], stiff?: number, damp?: number) => k0MathSpring;

interface k0MathKitHost {
  V?: k0MathVectors;
  M?: k0MathMatrices;
  clamp?: (x: number, min: number, max: number) => number;
  frac?: (x: number) => number;
  mix?: (a: number, b: number, t: number) => number;
  TAU?: number;
  seed?: (seed: number) => void;
  rnd?: () => number;
  hash?: (a: number, b?: number, c?: number) => number;
  ease?: k0MathEasing;
  wobble?: (t: number, cycles?: number) => number;
  kf?: (p: number, keys: readonly k0MathKey[]) => number;
  spring?: k0MathSpringFactory;
  settle?: (age: number, duration: number, speed: number, damp: number) => number;
}

const KIT: k0MathKitHost = {};
(function (K) {
  const V: k0MathVectors = (K.V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: a => Math.hypot(a[0], a[1], a[2]),
    norm: (a, f) => {
      const l = Math.hypot(a[0], a[1], a[2]);
      return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : f || [0, 1, 0];
    },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
    mad: (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s],
    dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
    // a direction square to d (any one), and the one that completes the frame
    perp: d => V.norm(Math.abs(d[1]) < 0.9 ? V.cross([0, 1, 0], d) : V.cross([1, 0, 0], d))
  });
  // 3x3 matrices as nine numbers in rows. They need not be turns: stretch and shear are carried through to each splat's shape as well.
  const M: k0MathMatrices = (K.M = {
    id: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
    rot: (ax, a) => {
      const c = Math.cos(a),
        s = Math.sin(a),
        t = 1 - c,
        x = ax[0],
        y = ax[1],
        z = ax[2];
      return [
        t * x * x + c,
        t * x * y - s * z,
        t * x * z + s * y,
        t * x * y + s * z,
        t * y * y + c,
        t * y * z - s * x,
        t * x * z - s * y,
        t * y * z + s * x,
        t * z * z + c
      ];
    },
    mul: (A, C) => [
      A[0] * C[0] + A[1] * C[3] + A[2] * C[6],
      A[0] * C[1] + A[1] * C[4] + A[2] * C[7],
      A[0] * C[2] + A[1] * C[5] + A[2] * C[8],
      A[3] * C[0] + A[4] * C[3] + A[5] * C[6],
      A[3] * C[1] + A[4] * C[4] + A[5] * C[7],
      A[3] * C[2] + A[4] * C[5] + A[5] * C[8],
      A[6] * C[0] + A[7] * C[3] + A[8] * C[6],
      A[6] * C[1] + A[7] * C[4] + A[8] * C[7],
      A[6] * C[2] + A[7] * C[5] + A[8] * C[8]
    ],
    app: (R, v) => [
      R[0] * v[0] + R[1] * v[1] + R[2] * v[2],
      R[3] * v[0] + R[4] * v[1] + R[5] * v[2],
      R[6] * v[0] + R[7] * v[1] + R[8] * v[2]
    ],
    tr: A => [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]],
    // the least turn that carries direction u onto direction v
    aim: (u, v) => {
      const w = V.cross(u, v),
        k = 1 / (1 + Math.max(-0.98, V.dot(u, v)));
      return [
        1 - k * (w[1] * w[1] + w[2] * w[2]),
        -w[2] + k * w[0] * w[1],
        w[1] + k * w[0] * w[2],
        w[2] + k * w[0] * w[1],
        1 - k * (w[0] * w[0] + w[2] * w[2]),
        -w[0] + k * w[1] * w[2],
        -w[1] + k * w[0] * w[2],
        w[0] + k * w[1] * w[2],
        1 - k * (w[0] * w[0] + w[1] * w[1])
      ];
    },
    // stretch by s along direction d. keep = true thins it the other two ways so its volume stays what it was (squash and stretch)
    stretch: (d, s, keep) => {
      const q = keep ? 1 / Math.sqrt(Math.max(0.05, s)) : 1,
        k = s - q;
      return [
        q + k * d[0] * d[0],
        k * d[0] * d[1],
        k * d[0] * d[2],
        k * d[1] * d[0],
        q + k * d[1] * d[1],
        k * d[1] * d[2],
        k * d[2] * d[0],
        k * d[2] * d[1],
        q + k * d[2] * d[2]
      ];
    },
    // from three columns (where x, y and z go)
    cols: (a, b, c) => [a[0], b[0], c[0], a[1], b[1], c[1], a[2], b[2], c[2]],
    det: A =>
      A[0] * (A[4] * A[8] - A[5] * A[7]) - A[1] * (A[3] * A[8] - A[5] * A[6]) + A[2] * (A[3] * A[7] - A[4] * A[6]),
    inv: A => {
      const d = M.det(A) || 1e-12;
      return [
        (A[4] * A[8] - A[5] * A[7]) / d,
        (A[2] * A[7] - A[1] * A[8]) / d,
        (A[1] * A[5] - A[2] * A[4]) / d,
        (A[5] * A[6] - A[3] * A[8]) / d,
        (A[0] * A[8] - A[2] * A[6]) / d,
        (A[2] * A[3] - A[0] * A[5]) / d,
        (A[3] * A[7] - A[4] * A[6]) / d,
        (A[1] * A[6] - A[0] * A[7]) / d,
        (A[0] * A[4] - A[1] * A[3]) / d
      ];
    },
    // the turn nearest to A (what is left when stretch is taken out): a few rounds of averaging A with its inverse transpose
    polar: A => {
      let R = A.slice() as k0MathMat3;
      for (let i = 0; i < 6; i++) {
        const T = M.tr(M.inv(R));
        for (let k = 0; k < 9; k++) R[k] = 0.5 * (R[k] + T[k]);
      }
      return R;
    },
    // the same, for any matrix at all, flat or not, starting from a guess R (Mueller's method: turn R a little at a time toward where A's columns point)
    turnOf: (A, R, iters) => {
      R = R ? (R.slice() as k0MathMat3) : M.id();
      for (let it = 0; it < (iters || 8); it++) {
        const r0 = [R[0], R[3], R[6]],
          r1 = [R[1], R[4], R[7]],
          r2 = [R[2], R[5], R[8]],
          a0 = [A[0], A[3], A[6]],
          a1 = [A[1], A[4], A[7]],
          a2 = [A[2], A[5], A[8]];
        const c0 = V.cross(r0, a0),
          c1 = V.cross(r1, a1),
          c2 = V.cross(r2, a2),
          den = Math.abs(V.dot(r0, a0) + V.dot(r1, a1) + V.dot(r2, a2)) + 1e-9,
          om = [(c0[0] + c1[0] + c2[0]) / den, (c0[1] + c1[1] + c2[1]) / den, (c0[2] + c1[2] + c2[2]) / den],
          w = V.len(om);
        if (w < 1e-9) break;
        R = M.mul(M.rot(V.mul(om, 1 / w), w), R);
      }
      return R;
    }
  });
  const clamp = (K.clamp = (x, a, b) => (x < a ? a : x > b ? b : x)),
    c01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
  K.frac = x => x - Math.floor(x);
  K.mix = (a, b, t) => a + (b - a) * t;
  K.TAU = Math.PI * 2;
  /* Chance that can be repeated. K.rnd() is a number in 0..1 like Math.random, but from a seed: K.seed(n) starts it again, and K.stage
     seeds it when a stage is made, so a diorama run twice from the start does the same thing both times (which is what lets a test say
     what it should do). Everything in the lab that rolls dice while it runs uses this */
  let rseed = 0x9e3779b9;
  K.seed = n => {
    rseed = n >>> 0 || 0x9e3779b9;
  };
  K.rnd = () => {
    rseed ^= rseed << 13;
    rseed >>>= 0;
    rseed ^= rseed >>> 17;
    rseed ^= rseed << 5;
    rseed >>>= 0;
    return rseed / 4294967296;
  };
  K.hash = (a, b, c) => {
    const s = Math.sin(a * 127.1 + (b || 0) * 311.7 + (c || 0) * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  // ---- easing: every one takes 0..1 and gives 0..1 (some overshoot on the way)
  const E: k0MathEasing = (K.ease = {
    linear: x => c01(x),
    smooth: x => {
      x = c01(x);
      return x * x * (3 - 2 * x);
    },
    in: x => {
      x = c01(x);
      return x * x;
    },
    out: x => {
      x = c01(x);
      return 1 - (1 - x) * (1 - x);
    },
    in3: x => {
      x = c01(x);
      return x * x * x;
    },
    out3: x => {
      x = c01(x);
      return 1 - Math.pow(1 - x, 3);
    },
    inout3: x => {
      x = c01(x);
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    },
    back: x => {
      x = c01(x);
      const c = 1.70158;
      return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
    },
    elastic: x => {
      x = c01(x);
      return x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
    bounce: x => {
      x = c01(x);
      const n = 7.5625,
        d = 2.75;
      return x < 1 / d
        ? n * x * x
        : x < 2 / d
          ? n * (x -= 1.5 / d) * x + 0.75
          : x < 2.5 / d
            ? n * (x -= 2.25 / d) * x + 0.9375
            : n * (x -= 2.625 / d) * x + 0.984375;
    },
    step: x => (x < 1 ? 0 : 1)
  });
  // A signed offset for squash and stretch that starts and ends at zero.
  K.wobble = (t, cycles = 2) => (t > 0 && t < 1 ? Math.sin(K.TAU! * cycles * t) * (1 - t) ** 2 : 0);

  // a value that passes through (when, what) pairs, easing between them. K.kf(p, [0, 0, 0.5, 1, 1, 0]) ; an ease name may follow any pair: [0, 0, 0.5, 1, 'back', 1, 0]
  K.kf = (p, keys) => {
    let pt = keys[0] as number,
      pv = keys[1] as number;
    for (let i = 2; i < keys.length;) {
      const t = keys[i] as number,
        v = keys[i + 1] as number,
        e = typeof keys[i + 2] === 'string' ? E[keys[i + 2] as k0MathEaseName] : null;
      if (p <= t) return pv + (v - pv) * (e || E.smooth)((p - pt) / (t - pt || 1));
      pt = t;
      pv = v;
      i += e ? 3 : 2;
    }
    return pv;
  };
  // a spring that chases a target: lag when stiff is low, overshoot when damp is under 1. Works on a number or on a vector
  K.spring = (x0, stiff, damp) => {
    const vec = Array.isArray(x0),
      s: k0MathSpring = {
        x: vec ? x0.slice() : x0,
        v: vec ? x0.map(() => 0) : 0,
        stiff: stiff || 60,
        damp: damp === undefined ? 0.5 : damp,
        step(target, dt) {
          const w = Math.sqrt(s.stiff),
            n = Math.max(1, Math.ceil(dt / 0.008)),
            h = dt / n;
          for (let i = 0; i < n; i++) {
            if (vec)
              for (let k = 0; k < (s.x as number[]).length; k++) {
                (s.v as number[])[k] +=
                  (s.stiff * ((target as number[])[k] - (s.x as number[])[k]) - 2 * s.damp * w * (s.v as number[])[k]) *
                  h;
                (s.x as number[])[k] += (s.v as number[])[k] * h;
              }
            else {
              (s.v as number) +=
                (s.stiff * ((target as number) - (s.x as number)) - 2 * s.damp * w * (s.v as number)) * h;
              (s.x as number) += (s.v as number) * h;
            }
          }
          return s.x;
        },
        kick(dv) {
          if (vec) for (let k = 0; k < (s.v as number[]).length; k++) (s.v as number[])[k] += (dv as number[])[k];
          else (s.v as number) += dv as number;
        }
      };
    return s;
  };
  // a decaying wobble after an event at age 0 (the game's settle): how far, of 1, it is off at this age
  K.settle = (age, dur, speed, damp) => {
    const u = age / dur;
    return age < 0 || u >= 1 ? 0 : Math.cos(age * speed * Math.PI * 2) * Math.exp(-u * damp) * (1 - u);
  };
})(KIT);

export {};
