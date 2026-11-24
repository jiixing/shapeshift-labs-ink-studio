'use strict';
/* ------------------------------------------------------------------
   Scene generators. Every object is emitted as gaussians:
   16 floats per splat =
     [x, y, z, density] [c00, c01, c02, packedRGB] [c11, c12, c22, kind] [phase, speed, range, extra]
   Palette indices: 0 void, 1 dark, 2 mid, 3 light, 4 pale, 5-7 reds.
   ------------------------------------------------------------------ */
type BuilderVec2 = readonly [number, number];
type BuilderVec3 = readonly [number, number, number];
type BuilderMutableVec3 = [number, number, number];
type BuilderRgb = readonly [number, number, number];
type BuilderVec6 = readonly [number, number, number, number, number, number];
type BuilderPalette = readonly number[];
type BuilderRamp = readonly number[];
type BuilderRecord = Record<string, unknown>;
type BuilderLabel = string | number;
type BuilderName = BuilderLabel | null;
type BuilderRenderLabel = BuilderLabel | object;
type BuilderPattern = BuilderRecord;
type BuilderDab = [number, number, number, number, number, number, number, number, number, number];

interface BuilderNoise {
  n3(x: number, y: number, z: number): number;
  fbm(x: number, y: number, z: number, octaves: number): number;
}

interface BuilderOptions {
  renderMetadata?: boolean;
}

interface BuilderSplatAttrs {
  k?: number;
  nd?: boolean;
  em?: boolean;
  emission?: boolean;
  bk?: boolean;
  gl?: boolean;
  wind?: boolean;
  as?: boolean | number;
  coverage?: number;
  ph?: number;
  sp?: number;
  rg?: number;
  ex?: number;
}

interface BuilderSplatDescription {
  object?: BuilderRenderLabel | null;
  material?: BuilderRenderLabel | null;
}

type BuilderDescribeSplats = (first: number, end: number, description?: BuilderSplatDescription) => void;

interface BuilderRenderRows {
  normals: Float32Array;
  muteEmission?: Uint8Array;
  objectIds?: Uint32Array;
  materialIds?: Uint32Array;
  objects: BuilderName[];
  materials: BuilderName[];
}

interface BuilderIdTable {
  get(key: BuilderRenderLabel): number | undefined;
  set(key: BuilderRenderLabel, value: number): unknown;
}

interface BuilderSurface {
  settings: BuilderRecord;
  light: BuilderVec3;
}

interface BuilderSurfaceLook {
  readonly STRIDE: number;
}

interface BuilderSampleCoverage {
  pack(rank: number): number;
}

interface BuilderBoxOptions {
  s?: number;
  rot?: number;
  skip?: readonly string[];
  col?: (name: string, u: number, v: number, position: BuilderVec3) => number | undefined;
  an?: BuilderSplatAttrs;
}

interface BuilderBallOptions {
  st?: number;
  minY?: number;
  hollow?: boolean;
  col?: (direction: BuilderVec3, position: BuilderVec3, normal: BuilderVec3) => number | undefined;
  an?: BuilderSplatAttrs;
}

interface BuilderCylOptions {
  s?: number;
  lean?: BuilderVec2;
  flute?: boolean;
  an?: BuilderSplatAttrs;
}

interface BuilderGroundSample {
  c: number;
  y?: number;
  an?: BuilderSplatAttrs;
}

type BuilderGroundResult = number | BuilderGroundSample | undefined;

interface BuilderSlabOptions {
  s?: number;
  col?: (axis: number, sign: number, a: number, b: number, position: BuilderVec3) => number | undefined;
  an?: BuilderSplatAttrs;
}

interface BuilderBounceTaps {
  ramp: readonly BuilderRamp[];
  t: readonly number[];
}

interface BuilderBounceOptions {
  k?: number;
  reach?: number;
  rays?: number;
  glow?: number;
  from?: number;
  tint?: number;
  taps?: BuilderBounceTaps;
}

interface BuilderLight {
  p: BuilderVec3;
  r: number;
  s?: number;
}

interface BuilderMirrorOptions {
  gap?: number;
  maxH?: number;
}

interface BuilderWorldMeta {
  detail?: number;
  surfaceEffects?: unknown;
  [key: string]: unknown;
}

interface BuilderWorld extends BuilderWorldMeta {
  data: Float32Array;
  count: number;
  renderMetadata: BuilderRenderRows | undefined;
  attr: Float32Array | undefined;
  pix: Float32Array | undefined;
  ramps: number[][] | undefined;
  rampOff: boolean[] | undefined;
  pats: BuilderPattern[] | undefined;
  surfaceData?: Float32Array;
  surfaces?: BuilderSurface[];
  fine: Float32Array | undefined;
  moving: Int32Array;
  back: Int32Array;
  bg: BuilderRgb;
  seed: number;
  pal: BuilderPalette;
  palName: string;
  dither: number;
  fog: { c: number; start: number; max: number };
  outline: { c: number; edge: number };
  radius: number;
}

interface BuilderKit {
  splatEffects: {
    context(definition: unknown): unknown;
  };
}

interface Builder {
  count(): number;
  describeSplats: BuilderDescribeSplats | undefined;
  born(value: number | null | undefined): number | null;
  wet(value: number | null | undefined): number | null;
  fineTile(
    t0: number,
    t1: number,
    t2: number,
    t3: number,
    ux: number,
    uy: number,
    uz: number,
    vx: number,
    vy: number,
    vz: number,
    color: BuilderRgb
  ): void;
  attrNext(a: number, b: number, c: number, d: number): void;
  pixNext(
    ramp: BuilderRamp,
    t: number,
    pattern: BuilderPattern | null,
    nx: number,
    ny: number,
    nz: number,
    fx: number | undefined,
    fy: number,
    fz: number,
    noLine: boolean
  ): void;
  surfaceNext(
    settings: BuilderRecord,
    nx: number,
    ny: number,
    nz: number,
    light: BuilderVec3,
    visibility?: number,
    tangent?: BuilderVec3
  ): void;
  dabAt(index: number, out?: BuilderDab): BuilderDab | null;
  reseed(seed: number): void;
  take(): Float32Array;
  R(): number;
  rr(a: number, b: number): number;
  pick<T>(values: readonly T[]): T;
  gauss(): number;
  n3(x: number, y: number, z: number): number;
  fbm(x: number, y: number, z: number, octaves: number): number;
  P: BuilderRgb[];
  TAU: number;
  UP: BuilderVec3;
  clamp(value: number, min: number, max: number): number;
  mix(a: number, b: number, t: number): number;
  smooth(a: number, b: number, x: number): number;
  norm(vector: BuilderVec3): BuilderVec3;
  dot(a: BuilderVec3, b: BuilderVec3): number;
  add(a: BuilderVec3, b: BuilderVec3, scale: number): BuilderVec3;
  randDir(): BuilderVec3;
  fib(k: number, n: number): BuilderVec3;
  iso(
    x: number,
    y: number,
    z: number,
    scale: number,
    color: BuilderRgb,
    alpha: number,
    attrs?: BuilderSplatAttrs
  ): void;
  disc(
    x: number,
    y: number,
    z: number,
    normal: BuilderVec3,
    radius: number,
    thickness: number,
    color: BuilderRgb,
    alpha: number,
    attrs?: BuilderSplatAttrs
  ): void;
  dab(
    x: number,
    y: number,
    z: number,
    normal: BuilderVec3,
    direction: BuilderVec3,
    sa: number,
    sb: number,
    sn: number,
    color: BuilderRgb,
    alpha: number,
    attrs?: BuilderSplatAttrs
  ): void;
  stick(
    x: number,
    y: number,
    z: number,
    axis: BuilderVec3,
    length: number,
    radius: number,
    color: BuilderRgb,
    alpha: number,
    attrs?: BuilderSplatAttrs
  ): void;
  axial(
    x: number,
    y: number,
    z: number,
    axis: BuilderVec3,
    sa: number,
    sp: number,
    color: BuilderRgb,
    alpha: number,
    attrs?: BuilderSplatAttrs
  ): void;
  setLight(vector: BuilderVec3): void;
  lit(normal: BuilderVec3): number;
  shade(normal: BuilderVec3, colors: BuilderRamp, jitter?: number): BuilderRgb;
  path<T>(count: number, fn: (t: number) => T): T[];
  spline(waypoints: readonly BuilderVec3[], per: number): BuilderVec3[];
  tube(points: readonly BuilderVec3[], r0: number, r1: number, colors: BuilderRamp, attrs?: BuilderSplatAttrs): void;
  branch(
    point: BuilderVec3,
    direction: BuilderVec3,
    length: number,
    radius: number,
    depth: number,
    colors: BuilderRamp,
    spread: number
  ): void;
  box(
    cx: number,
    y0: number,
    cz: number,
    width: number,
    height: number,
    depth: number,
    colors: BuilderRamp,
    options?: BuilderBoxOptions | null
  ): void;
  ball(
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    rz: number,
    count: number,
    colors: BuilderRamp,
    options?: BuilderBallOptions | null
  ): void;
  cyl(
    bx: number,
    by: number,
    bz: number,
    radius: number,
    height: number,
    colors: BuilderRamp,
    options?: BuilderCylOptions | null
  ): void;
  spores(count: number, bounds: BuilderVec6, colors: BuilderRamp): void;
  ground(
    radius: number,
    fade: number,
    fn: (x: number, z: number, radius: number) => BuilderGroundResult,
    step?: number
  ): void;
  frame(yaw: number, tilt: number, roll: number): [BuilderVec3, BuilderVec3, BuilderVec3];
  slab(
    center: BuilderVec3,
    axes: readonly BuilderVec3[],
    su: number,
    sv: number,
    sw: number,
    colors: BuilderRamp,
    options?: BuilderSlabOptions | null
  ): void;
  sky(fn: (direction: BuilderVec3) => number, radius?: number): void;
  relight(lights: readonly BuilderLight[], table: readonly BuilderRamp[]): void;
  bounce(sdf: (x: number, y: number, z: number) => number, options?: BuilderBounceOptions | null): number;
  mirror(
    y0: number,
    inside: (x: number, z: number) => boolean,
    map: BuilderRamp,
    options?: BuilderMirrorOptions | null
  ): void;
  star(x: number, y: number, z: number, size: number, color: number, attrs?: BuilderSplatAttrs): void;
  finish(meta?: BuilderWorldMeta): BuilderWorld;
}

interface BuilderGlobalThis {
  INK_DECAL_NEXT: number[][] | null | undefined;
}

declare const SurfaceLook: BuilderSurfaceLook;
declare const SampleCoverage: BuilderSampleCoverage;
declare const KIT: BuilderKit;

const PAL_HEX = [0x0b1114, 0x1c3626, 0x356b36, 0x82b552, 0xdff0c4, 0x4a0d1a, 0xad1f36, 0xff6474];
const PALETTES = [
  { name: 'Moss', luma: false, spread: 0.3, colors: PAL_HEX },
  { name: 'Bone', luma: true, spread: 0.4, colors: [0x0e0d12, 0x3a3540, 0x7d7482, 0xc4bdb6, 0xf4efe0] },
  { name: 'Ember', luma: true, spread: 0.4, colors: [0x100808, 0x4a1418, 0x9c2a24, 0xe6772e, 0xffe2a0] },
  { name: 'One bit', luma: true, spread: 1.0, colors: [0x0b1114, 0xdff0c4] }
];

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeNoise(seed: number): BuilderNoise {
  const r = mulberry32(seed);
  const p = new Uint8Array(512),
    g = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    p[i] = i;
    g[i] = r();
  }
  for (let i = 255; i > 0; i--) {
    const j = (r() * (i + 1)) | 0;
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  function n3(x: number, y: number, z: number): number {
    let xi = Math.floor(x),
      yi = Math.floor(y),
      zi = Math.floor(z);
    const xf = x - xi,
      yf = y - yi,
      zf = z - zi;
    xi &= 255;
    yi &= 255;
    zi &= 255;
    const u = xf * xf * (3 - 2 * xf),
      v = yf * yf * (3 - 2 * yf),
      w = zf * zf * (3 - 2 * zf);
    const A = p[xi] + yi,
      B = p[xi + 1] + yi;
    const AA = p[A] + zi,
      AB = p[A + 1] + zi,
      BA = p[B] + zi,
      BB = p[B + 1] + zi;
    const x00 = g[p[AA]] + u * (g[p[BA]] - g[p[AA]]),
      x10 = g[p[AB]] + u * (g[p[BB]] - g[p[AB]]),
      x01 = g[p[AA + 1]] + u * (g[p[BA + 1]] - g[p[AA + 1]]),
      x11 = g[p[AB + 1]] + u * (g[p[BB + 1]] - g[p[AB + 1]]);
    const y0 = x00 + v * (x10 - x00),
      y1 = x01 + v * (x11 - x01);
    return y0 + w * (y1 - y0);
  }
  function fbm(x: number, y: number, z: number, oct: number): number {
    let s = 0,
      a = 0.5,
      n = 0;
    for (let i = 0; i < oct; i++) {
      s += a * n3(x, y, z);
      n += a;
      x *= 2.03;
      y *= 2.03;
      z *= 2.03;
      a *= 0.5;
    }
    return s / n;
  }
  return { n3, fbm };
}

// ---------------- shared builder: splat storage plus shape helpers ----------------
function makeBuilder(
  seed: number,
  hex?: BuilderPalette | null,
  { renderMetadata = true }: BuilderOptions = {}
): Builder {
  seed = seed >>> 0;
  let gen = mulberry32(seed ^ 0x5bd1e995);
  const R = (): number => gen(),
    reseed = (s2: number): void => {
      gen = mulberry32(((s2 >>> 0) ^ 0x5bd1e995) >>> 0);
    }; // a builder's random stream can be restarted, so one thing built in two places comes out the same
  const { n3, fbm } = makeNoise(seed ^ 0x9e3779b9);
  const TAU = Math.PI * 2,
    UP: BuilderVec3 = [0, 1, 0];
  const P = (hex || PAL_HEX).map(h => [(h >> 16) & 255, (h >> 8) & 255, h & 255] as BuilderRgb);
  const rr = (a: number, b: number): number => a + (b - a) * R();
  const pick = <T>(arr: readonly T[]): T => arr[(R() * arr.length) | 0];
  const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);
  const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
  const smooth = (a: number, b: number, x: number): number => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const norm = (v: BuilderVec3): BuilderVec3 => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const dot = (a: BuilderVec3, b: BuilderVec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const add = (a: BuilderVec3, b: BuilderVec3, s: number): BuilderVec3 => [
    a[0] + b[0] * s,
    a[1] + b[1] * s,
    a[2] + b[2] * s
  ];
  const gauss = (): number => (R() + R() + R() + R() - 2) * 1.732;
  const randDir = (): BuilderVec3 => {
    const y = R() * 2 - 1,
      a = R() * TAU,
      r = Math.sqrt(1 - y * y);
    return [r * Math.cos(a), y, r * Math.sin(a)];
  };
  const fib = (k: number, n: number): BuilderVec3 => {
    const y = 1 - (2 * (k + 0.5)) / n,
      r = Math.sqrt(Math.max(0, 1 - y * y)),
      a = k * 2.399963;
    return [r * Math.cos(a), y, r * Math.sin(a)];
  };

  let cap = 1 << 15,
    n = 0,
    data = new Float32Array(cap * 16);
  const moving: number[] = [],
    back: number[] = [],
    cidx: number[] = [],
    nrms: (BuilderVec3 | null)[] = [];
  let curN: BuilderVec3 | null = null;
  let ownerRows: Uint32Array | undefined, materialRows: Uint32Array | undefined, muteEmission: Uint8Array | undefined;
  let unnamedOwners: WeakMap<object, number> = new WeakMap<object, number>(),
    unnamedMaterials: WeakMap<object, number> = new WeakMap<object, number>();
  const ownerIds = new Map<BuilderLabel, number>(),
    materialIds = new Map<BuilderLabel, number>();
  const ownerNames: BuilderName[] = [null],
    materialNames: BuilderName[] = [null];
  function renderId(
    value: BuilderRenderLabel | null | undefined,
    labels: Map<BuilderLabel, number>,
    unnamed: WeakMap<object, number>,
    names: BuilderName[]
  ): number {
    if (value == null) return 0;
    const hasLabel = typeof value === 'string' || typeof value === 'number';
    const ids: BuilderIdTable = hasLabel ? labels : unnamed;
    let id = ids.get(value);
    if (id === undefined) {
      id = names.length;
      ids.set(value, id);
      names.push(hasLabel ? value : null);
    }
    return id;
  }
  // Labels can be shared across several solids or supplied for splats built directly.
  function describeSplats(first: number, end: number, { object, material }: BuilderSplatDescription = {}): void {
    if (!renderMetadata || first === end) return;
    if (!Number.isSafeInteger(first) || !Number.isSafeInteger(end) || first < 0 || end < first || end > n)
      throw new RangeError('Splat metadata range must belong to the builder');
    if (!ownerRows || ownerRows.length < cap) {
      const owners = new Uint32Array(cap),
        materials = new Uint32Array(cap);
      if (ownerRows) {
        owners.set(ownerRows);
        materials.set(materialRows!);
      }
      ownerRows = owners;
      materialRows = materials;
    }
    ownerRows.fill(renderId(object, ownerIds, unnamedOwners, ownerNames), first, end);
    materialRows!.fill(renderId(material, materialIds, unnamedMaterials, materialNames), first, end);
  }

  function renderRows(): BuilderRenderRows | undefined {
    if (!renderMetadata) return undefined;
    const normals = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) if (nrms[i]) normals.set(nrms[i]!, i * 3);
    return {
      normals,
      muteEmission: muteEmission?.slice(0, n),
      objectIds: ownerRows?.slice(0, n),
      materialIds: materialRows?.slice(0, n),
      objects: ownerNames.slice(),
      materials: materialNames.slice()
    };
  }
  /* the birth time given to the dabs laid next (null: there from the start). The motions that use the last number for themselves
     (falling, rising, flapping, swelling, writhing, a placed copy's sway) cannot grow */
  let bornV: number | null = null,
    wetV: number | null = null;
  const OWNEX = [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1];
  /* Inked detail (optional, see S.fine in the sculptor): a dab may carry a small picture of the surface under it, four colours by four,
     looked up for each pixel it covers. Twelve numbers a dab: the sixteen palette colours (four to a number), the two half-axes of the
     tile on the surface, and the colour the dab was given, so a dab recoloured later is known and drawn plain. */
  let fine: Float32Array | null = null,
    attr: Float32Array | null = null,
    attrN: Float32Array | null = null,
    pix: Float32Array | null = null,
    pixHas = false,
    surfaceData: Float32Array | null = null,
    surfacePending = false;
  const surfaces: BuilderSurface[] = [],
    surfaceIds = new Map<BuilderRecord, Map<string, number>>(),
    surfaceRow = new Float32Array(SurfaceLook.STRIDE);
  function surfaceNext(
    settings: BuilderRecord,
    nx: number,
    ny: number,
    nz: number,
    light: BuilderVec3,
    visibility = 1,
    tangent?: BuilderVec3
  ): void {
    let ids = surfaceIds.get(settings);
    if (!ids) surfaceIds.set(settings, (ids = new Map<string, number>()));
    const key = light.join(',');
    let id = ids.get(key);
    if (id === undefined) {
      id = surfaces.push({ settings, light: Array.from(light) as unknown as BuilderVec3 });
      ids.set(key, id);
    }
    surfaceRow.set([id, nx, ny, nz, visibility, tangent?.[0] ?? 0, tangent?.[1] ?? 0, tangent?.[2] ?? 0]);
    surfacePending = true;
  }
  /* colour worked out per pixel (a diorama's look.pixel): for a dab laid next, the ramp it is coloured from, how lit it is, the pattern
     laid on it (a K.pixel material's pat) and the way its surface faces; the picture then decides each pixel from these, not from the
     dab's one colour. Eight numbers a dab; the ramps and patterns are kept once each */
  const pixN = new Float32Array(8),
    ramps: number[][] = [],
    rampOff: boolean[] = [],
    rampIx = new Map<BuilderRamp, number>(),
    rampNoIx = new Map<BuilderRamp, number>(),
    rampByText = new Map<string, number>(),
    pats: BuilderPattern[] = [],
    patIx = new Map<BuilderPattern, number>();
  /* (fx, fy, fz: the way the shape it is lit as faces, if that is not its own: folded into two numbers; 9, 9 when there is none.
      noLine: the material draws no outline, as clouds and water. Ramps with the same colours are one ramp, so an outline is drawn
      only where one material meets another) */
  const pixNext = (
    ramp: BuilderRamp,
    t: number,
    pat: BuilderPattern | null,
    nx: number,
    ny: number,
    nz: number,
    fx: number | undefined,
    fy: number,
    fz: number,
    noLine: boolean
  ): void => {
    const ix = noLine ? rampNoIx : rampIx;
    let r = ix.get(ramp);
    if (r === undefined) {
      const text = (noLine ? '!' : '') + Array.from(ramp).join(',');
      r = rampByText.get(text);
      if (r === undefined) {
        r = ramps.push(Array.from(ramp)) - 1;
        rampOff.push(!!noLine);
        rampByText.set(text, r);
      }
      ix.set(ramp, r);
    }
    let pi: number | undefined = 0;
    if (pat) {
      pi = patIx.get(pat);
      if (pi === undefined) {
        pi = pats.push(pat);
        patIx.set(pat, pi);
      }
    }
    pixN[0] = r + 1;
    pixN[1] = t;
    pixN[2] = pi;
    pixN[3] = nx;
    pixN[4] = ny;
    pixN[5] = nz;
    if (fx === undefined) pixN[6] = pixN[7] = 9;
    else {
      const l = Math.abs(fx) + Math.abs(fy) + Math.abs(fz) || 1;
      let a = fx / l,
        b = fz / l;
      if (fy < 0) {
        const a2 = (1 - Math.abs(b)) * (a >= 0 ? 1 : -1),
          b2 = (1 - Math.abs(a)) * (b >= 0 ? 1 : -1);
        a = a2;
        b = b2;
      }
      pixN[6] = a;
      pixN[7] = b;
    }
    pixHas = true;
  };
  /* attributes (see the sculptor's S.keepAttrs): four numbers a dab, for the dabs laid next */
  const attrNext = (a: number, b: number, c: number, d: number): void => {
    attrN = attrN || new Float32Array(4);
    attrN[0] = a;
    attrN[1] = b;
    attrN[2] = c;
    attrN[3] = d;
  };
  const fineTile = (
    t0: number,
    t1: number,
    t2: number,
    t3: number,
    ux: number,
    uy: number,
    uz: number,
    vx: number,
    vy: number,
    vz: number,
    col: BuilderRgb
  ): void => {
    if (!fine || fine.length < cap * 12) {
      const f = new Float32Array(cap * 12);
      if (fine) f.set(fine);
      fine = f;
    }
    const o = n * 12;
    fine[o] = t0;
    fine[o + 1] = t1;
    fine[o + 2] = t2;
    fine[o + 3] = t3;
    fine[o + 4] = ux;
    fine[o + 5] = uy;
    fine[o + 6] = uz;
    fine[o + 7] = (col[0] | 0) + (col[1] | 0) * 256 + (col[2] | 0) * 65536;
    fine[o + 8] = vx;
    fine[o + 9] = vy;
    fine[o + 10] = vz;
    fine[o + 11] = 1;
  };
  function push(
    x: number,
    y: number,
    z: number,
    c00: number,
    c01: number,
    c02: number,
    c11: number,
    c12: number,
    c22: number,
    col: BuilderRgb,
    a: number,
    an?: BuilderSplatAttrs
  ): void {
    if (n === cap) {
      cap *= 2;
      const d = new Float32Array(cap * 16);
      d.set(data);
      data = d;
    }
    if (attrN) {
      if (!attr || attr.length < cap * 4) {
        const f = new Float32Array(cap * 4);
        if (attr) f.set(attr);
        attr = f;
      }
      attr.set(attrN, n * 4);
    }
    if (pixHas || pix) {
      if (!pix || pix.length < cap * 8) {
        const f = new Float32Array(cap * 8);
        if (pix) f.set(pix);
        pix = f;
      }
      if (pixHas) pix.set(pixN, n * 8);
      else pix.fill(0, n * 8, n * 8 + 8);
      pixHas = false;
    }
    if (surfacePending || surfaceData) {
      const stride = SurfaceLook.STRIDE;
      if (!surfaceData || surfaceData.length < cap * stride) {
        const next = new Float32Array(cap * stride);
        if (surfaceData) next.set(surfaceData);
        surfaceData = next;
      }
      if (surfacePending) surfaceData.set(surfaceRow, n * stride);
      surfacePending = false;
    }
    if (fine && fine[n * 12 + 11] === 1)
      fine[n * 12 + 11] = 2; // the tile laid for this dab is now its own
    else if (fine && n * 12 < fine.length) fine.fill(0, n * 12, n * 12 + 12);
    const o = n * 16;
    data[o] = x;
    data[o + 1] = y;
    data[o + 2] = z;
    data[o + 3] = a;
    data[o + 4] = c00;
    data[o + 5] = c01;
    data[o + 6] = c02;
    data[o + 7] = (col[0] | 0) + (col[1] | 0) * 256 + (col[2] | 0) * 65536;
    data[o + 8] = c11;
    data[o + 9] = c12;
    data[o + 10] = c22;
    cidx.push(P.indexOf(col));
    nrms.push(curN);
    if (an) {
      if (renderMetadata && an.em && an.emission === false) {
        if (!muteEmission || muteEmission.length < cap) {
          const next = new Uint8Array(cap);
          if (muteEmission) next.set(muteEmission);
          muteEmission = next;
        }
        muteEmission[n] = 1;
      }
      // kind, plus flags: 16 = leave out of outlines, 32 = glows (ignores haze and relighting)
      // 64 = behind everything, 256 = glass, 8192 = responds to horizontal airflow, 2048 = drawn as text where a page offers it
      // (K.ascii), with its own set in 4096 and 16384 (as: 1 ascii, 2 symbols, 3 braille; as: true, the page's)
      const asSet = an.as && an.as !== true ? Math.max(0, Math.min(3, an.as | 0)) : 0;
      data[o + 11] =
        (an.k || 0) +
        (an.nd ? 16 : 0) +
        (an.em ? 32 : 0) +
        (an.bk ? 64 : 0) +
        (an.gl ? 256 : 0) +
        (an.wind ? 8192 : 0) +
        (an.as ? 2048 + (asSet & 1 ? 4096 : 0) + (asSet & 2 ? 16384 : 0) : 0) +
        (an.coverage === undefined ? 0 : SampleCoverage.pack(an.coverage));
      if (an.bk) back.push(n);
      data[o + 12] = an.ph || 0;
      data[o + 13] = an.sp || 0;
      data[o + 14] = an.rg || 0;
      data[o + 15] = an.ex || 0;
      if (an.k === 2 || an.k === 3 || an.k === 5 || an.k === 6) moving.push(n);
    }
    /* born: a dab that is not there until its time comes (growth you can watch). Its time goes in the last number, so only the
       motions that leave that free can grow (+ 512: the page and the renderer read it as flag 32) */
    if (bornV !== null && !OWNEX[data[o + 11] % 16]) {
      if (!an) {
        data[o + 11] = 0;
        data[o + 12] = data[o + 13] = data[o + 14] = 0;
      }
      data[o + 11] += 512;
      data[o + 15] = bornV;
    } else if (wetV !== null && !OWNEX[(an ? data[o + 11] : 0) % 16]) {
      /* wet: from its time on the dab darkens, as rain soaks it (+ 1024: flag 64 in the page and the renderer) */
      if (!an) data[o + 11] = data[o + 12] = data[o + 13] = data[o + 14] = 0;
      data[o + 11] += 1024;
      data[o + 15] = wetV;
    } else if (!an) data[o + 11] = data[o + 12] = data[o + 13] = data[o + 14] = data[o + 15] = 0;
    n++;
  }
  function iso(x: number, y: number, z: number, s: number, col: BuilderRgb, a: number, an?: BuilderSplatAttrs): void {
    const v = s * s;
    push(x, y, z, v, 0, 0, v, 0, v, col, a, an);
  }
  function axial(
    x: number,
    y: number,
    z: number,
    ax: BuilderVec3,
    sa: number,
    sp: number,
    col: BuilderRgb,
    a: number,
    an?: BuilderSplatAttrs
  ): void {
    const p = sp * sp,
      d = sa * sa - p;
    push(
      x,
      y,
      z,
      p + d * ax[0] * ax[0],
      d * ax[0] * ax[1],
      d * ax[0] * ax[2],
      p + d * ax[1] * ax[1],
      d * ax[1] * ax[2],
      p + d * ax[2] * ax[2],
      col,
      a,
      an
    );
  }
  const disc = (
    x: number,
    y: number,
    z: number,
    nrm: BuilderVec3,
    st: number,
    sn: number,
    col: BuilderRgb,
    a: number,
    an?: BuilderSplatAttrs
  ): void => {
    curN = nrm;
    axial(x, y, z, nrm, sn, st, col, a, an);
    curN = null;
  };
  const stick = (
    x: number,
    y: number,
    z: number,
    ax: BuilderVec3,
    sl: number,
    sw: number,
    col: BuilderRgb,
    a: number,
    an?: BuilderSplatAttrs
  ): void => axial(x, y, z, ax, sl, sw, col, a, an);
  /* a dab that is longer one way across the surface than the other (S.follow lays these along the form): nrm the way the surface
     faces, e the long way (across the surface), sa and sb its two half-widths, sn its thickness */
  const dab = (
    x: number,
    y: number,
    z: number,
    nrm: BuilderVec3,
    e: BuilderVec3,
    sa: number,
    sb: number,
    sn: number,
    col: BuilderRgb,
    a: number,
    an?: BuilderSplatAttrs
  ): void => {
    const fx = nrm[1] * e[2] - nrm[2] * e[1],
      fy = nrm[2] * e[0] - nrm[0] * e[2],
      fz = nrm[0] * e[1] - nrm[1] * e[0],
      A = sa * sa,
      Bq = sb * sb,
      C = sn * sn;
    curN = nrm;
    push(
      x,
      y,
      z,
      A * e[0] * e[0] + Bq * fx * fx + C * nrm[0] * nrm[0],
      A * e[0] * e[1] + Bq * fx * fy + C * nrm[0] * nrm[1],
      A * e[0] * e[2] + Bq * fx * fz + C * nrm[0] * nrm[2],
      A * e[1] * e[1] + Bq * fy * fy + C * nrm[1] * nrm[1],
      A * e[1] * e[2] + Bq * fy * fz + C * nrm[1] * nrm[2],
      A * e[2] * e[2] + Bq * fz * fz + C * nrm[2] * nrm[2],
      col,
      a,
      an
    );
    curN = null;
  };

  let Lv = norm([-0.45, 0.75, 0.5]);
  const setLight = (v: BuilderVec3): void => {
    Lv = norm(v);
  };
  const lit = (nv: BuilderVec3): number => clamp(0.5 + 0.5 * dot(nv, Lv), 0, 1);
  function shade(nv: BuilderVec3, cols: BuilderRamp, jit?: number): BuilderRgb {
    const i = clamp(
      Math.floor((lit(nv) + (R() - 0.5) * (jit === undefined ? 0.1 : jit)) * cols.length),
      0,
      cols.length - 1
    );
    return P[cols[i]];
  }
  const path = <T>(cnt: number, fn: (t: number) => T): T[] => {
    const pts: T[] = [];
    for (let i = 0; i <= cnt; i++) pts.push(fn(i / cnt));
    return pts;
  };
  // Catmull-Rom through waypoints
  function spline(w: readonly BuilderVec3[], per: number): BuilderVec3[] {
    const pts: BuilderVec3[] = [];
    for (let i = 0; i < w.length - 1; i++) {
      const p0 = w[Math.max(0, i - 1)],
        p1 = w[i],
        p2 = w[i + 1],
        p3 = w[Math.min(w.length - 1, i + 2)];
      for (let s = 0; s < per; s++) {
        const t = s / per,
          t2 = t * t,
          t3 = t2 * t,
          q: BuilderMutableVec3 = [0, 0, 0];
        for (let k = 0; k < 3; k++)
          q[k] =
            0.5 *
            (2 * p1[k] +
              (p2[k] - p0[k]) * t +
              (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
              (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3);
        pts.push(q);
      }
    }
    pts.push(w[w.length - 1].slice() as unknown as BuilderVec3);
    return pts;
  }
  // a vine, branch or cable: three offset strands give it a lit side and a shadow side
  function tube(pts: readonly BuilderVec3[], r0: number, r1: number, cols: BuilderRamp, an?: BuilderSplatAttrs): void {
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++)
      total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1], pts[i + 1][2] - pts[i][2]);
    let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i],
        b = pts[i + 1],
        d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
        len = Math.hypot(d[0], d[1], d[2]);
      if (len < 1e-6) continue;
      const t: BuilderVec3 = [d[0] / len, d[1] / len, d[2] / len],
        lt = dot(Lv, t);
      const h = norm([Lv[0] - t[0] * lt, Lv[1] - t[1] * lt, Lv[2] - t[2] * lt]);
      const rm = mix(r0, r1, (acc + len / 2) / total),
        steps = Math.max(1, Math.ceil(len / (Math.max(rm, 0.045) * 1.3)));
      for (let s = 0; s < steps; s++) {
        const f = (s + 0.5) / steps,
          r = mix(r0, r1, (acc + len * f) / total);
        const x = a[0] + d[0] * f,
          y = a[1] + d[1] * f,
          z = a[2] + d[2] * f,
          sl = Math.max(r * 1.05, (len / steps) * 0.65);
        if (r < 0.056) {
          stick(x, y, z, t, sl, Math.max(r, 0.02), P[cols[1]], 3, an);
          continue;
        }
        stick(x - h[0] * r * 0.45, y - h[1] * r * 0.45, z - h[2] * r * 0.45, t, sl, r * 0.7, P[cols[0]], 3, an);
        stick(x, y, z, t, sl, r * 0.8, P[cols[1]], 3, an);
        stick(x + h[0] * r * 0.5, y + h[1] * r * 0.5, z + h[2] * r * 0.5, t, sl, r * 0.55, P[cols[2]], 3, an);
      }
      acc += len;
    }
  }
  // recursive bare branches
  function branch(
    p: BuilderVec3,
    dir: BuilderVec3,
    len: number,
    r: number,
    depth: number,
    cols: BuilderRamp,
    spread: number
  ): void {
    const bend = randDir(),
      end = add(p, dir, len);
    const pts = path(5, (t): BuilderVec3 => {
      const s = Math.sin(t * Math.PI) * len * 0.14;
      return [
        p[0] + dir[0] * len * t + bend[0] * s,
        p[1] + dir[1] * len * t + bend[1] * s,
        p[2] + dir[2] * len * t + bend[2] * s
      ];
    });
    tube(pts, r, r * 0.62, cols);
    if (depth > 0)
      for (let k = 0; k < 2; k++) {
        const rd = randDir();
        branch(
          end,
          norm([dir[0] + rd[0] * spread, dir[1] + rd[1] * spread + 0.25, dir[2] + rd[2] * spread]),
          len * rr(0.6, 0.8),
          r * 0.62,
          depth - 1,
          cols,
          spread
        );
      }
  }
  // axis-aligned box with flat toon faces; opt.col(face, u, v, p) may return a palette index, or -1 to leave a hole
  function box(
    cx: number,
    y0: number,
    cz: number,
    w: number,
    h: number,
    d: number,
    cols: BuilderRamp,
    opt?: BuilderBoxOptions | null
  ): void {
    opt = opt || {};
    const s = opt.s || 0.14;
    const faces: [string, BuilderVec3, BuilderVec3, BuilderVec3, BuilderVec3][] = [
      ['top', [0, 1, 0], [cx - w / 2, y0 + h, cz - d / 2], [w, 0, 0], [0, 0, d]],
      ['front', [0, 0, 1], [cx - w / 2, y0, cz + d / 2], [w, 0, 0], [0, h, 0]],
      ['back', [0, 0, -1], [cx - w / 2, y0, cz - d / 2], [w, 0, 0], [0, h, 0]],
      ['right', [1, 0, 0], [cx + w / 2, y0, cz - d / 2], [0, 0, d], [0, h, 0]],
      ['left', [-1, 0, 0], [cx - w / 2, y0, cz - d / 2], [0, 0, d], [0, h, 0]]
    ];
    for (const [name, nv, o, u, v] of faces) {
      if (opt.skip && opt.skip.indexOf(name) >= 0) continue;
      const lu = Math.hypot(u[0], u[1], u[2]),
        lv = Math.hypot(v[0], v[1], v[2]);
      const nu = Math.max(1, Math.round(lu / s)),
        nvv = Math.max(1, Math.round(lv / s));
      const rc = Math.cos(opt.rot || 0),
        rs = Math.sin(opt.rot || 0),
        wn: BuilderVec3 = [nv[0] * rc + nv[2] * rs, nv[1], -nv[0] * rs + nv[2] * rc];
      const t = lit(wn),
        base = name === 'top' ? cols[3] : t > 0.73 ? cols[2] : t > 0.55 ? cols[1] : cols[0];
      const st = Math.max(lu / nu, lv / nvv) * 0.62;
      for (let i = 0; i < nu; i++)
        for (let j = 0; j < nvv; j++) {
          const a = (i + 0.5) / nu,
            b = (j + 0.5) / nvv;
          const p: BuilderVec3 = [o[0] + u[0] * a + v[0] * b, o[1] + u[1] * a + v[1] * b, o[2] + u[2] * a + v[2] * b];
          let c = base;
          if (opt.col) {
            const r2 = opt.col(name, a, b, p);
            if (r2 === -1) continue;
            if (r2 !== undefined) c = r2;
          }
          const dx = p[0] - cx,
            dz = p[2] - cz;
          disc(cx + dx * rc + dz * rs, p[1], cz - dx * rs + dz * rc, wn, st, st * 0.3, P[c], 3, opt.an);
        }
    }
  }
  // ellipsoid shell; opt.col(d, p, nv) may override the palette index
  function ball(
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    rz: number,
    cnt: number,
    cols: BuilderRamp,
    opt?: BuilderBallOptions | null
  ): void {
    opt = opt || {};
    const st = opt.st || (2.2 * Math.cbrt(rx * ry * rz)) / Math.sqrt(cnt);
    for (let k = 0; k < cnt; k++) {
      const d = fib(k, cnt),
        p: BuilderVec3 = [cx + d[0] * rx, cy + d[1] * ry, cz + d[2] * rz];
      if (opt.minY !== undefined && p[1] < opt.minY) continue;
      const nv = norm([d[0] / rx, d[1] / ry, d[2] / rz]);
      let col: BuilderRgb;
      if (opt.col) {
        const c = opt.col(d, p, nv);
        if (c === -1) continue;
        col = c === undefined ? shade(nv, cols) : P[c];
      } else col = shade(nv, cols);
      disc(p[0], p[1], p[2], nv, st, st * 0.35, col, 3, opt.an);
    }
    if (!opt.hollow) iso(cx, cy, cz, Math.min(rx, ry, rz) * 0.6, P[cols[0]], 3, opt.an);
  }
  // upright cylinder of discs; opt.lean shifts the top, opt.flute stripes it
  function cyl(
    bx: number,
    by: number,
    bz: number,
    r: number,
    h: number,
    cols: BuilderRamp,
    opt?: BuilderCylOptions | null
  ): void {
    opt = opt || {};
    const sp = opt.s || 0.16,
      rows = Math.max(1, Math.round(h / sp)),
      cnt = Math.max(6, Math.round((TAU * r) / sp)),
      lean = opt.lean || [0, 0];
    for (let j = 0; j < rows; j++) {
      const f = (j + 0.5) / rows,
        ox = bx + lean[0] * f,
        oz = bz + lean[1] * f;
      for (let k = 0; k < cnt; k++) {
        const a = (k / cnt) * TAU,
          nv: BuilderVec3 = [Math.cos(a), 0, Math.sin(a)];
        let i = clamp(Math.floor(lit(nv) * cols.length), 0, cols.length - 1);
        if (opt.flute && k % 2 && i > 0) i--;
        disc(ox + nv[0] * r, by + f * h, oz + nv[2] * r, nv, sp * 0.62, sp * 0.2, P[cols[i]], 3, opt.an);
      }
      iso(ox, by + f * h, oz, r * 0.7, P[cols[0]], 3, opt.an);
    }
  }
  // drifting specks that give the void some depth
  function spores(cnt: number, bx: BuilderVec6, cols: BuilderRamp): void {
    for (let i = 0; i < cnt; i++)
      iso(rr(bx[0], bx[1]), rr(bx[2], bx[3]), rr(bx[4], bx[5]), 0.025, P[pick(cols)], 2, {
        k: 6,
        ph: R() * TAU,
        sp: rr(0.2, 0.7),
        rg: rr(0.15, 0.5),
        nd: true
      });
  }
  // flat ground patch; fn(x, z, r) returns a palette index, {c, y, an}, or -1 for a gap
  function ground(
    rad: number,
    fade: number,
    fn: (x: number, z: number, r: number) => BuilderGroundResult,
    step?: number
  ): void {
    step = step || 0.2;
    for (let x = -rad; x < rad; x += step)
      for (let z = -rad; z < rad; z += step) {
        const px = x + R() * step,
          pz = z + R() * step,
          r = Math.hypot(px, pz);
        if (r > rad || (fade < rad && R() > smooth(rad, fade, r))) continue;
        const res = fn(px, pz, r);
        if (res === undefined || res === -1) continue;
        if (typeof res === 'number') disc(px, 0, pz, UP, step * 0.75, 0.02, P[res], 2.5);
        else disc(px, res.y || 0, pz, UP, step * 0.75, 0.02, P[res.c], 2.5, res.an);
      }
  }
  // orientation helper: yaw about Y after tilt about X after roll about Z; returns [U, V, W] with V the long axis
  function frame(yaw: number, tilt: number, roll: number): [BuilderVec3, BuilderVec3, BuilderVec3] {
    const rot = (v: BuilderVec3): BuilderVec3 => {
      let [x, y, z] = v,
        c = Math.cos(roll || 0),
        s2 = Math.sin(roll || 0);
      [x, y] = [x * c - y * s2, x * s2 + y * c];
      c = Math.cos(tilt || 0);
      s2 = Math.sin(tilt || 0);
      [y, z] = [y * c - z * s2, y * s2 + z * c];
      c = Math.cos(yaw || 0);
      s2 = Math.sin(yaw || 0);
      [x, z] = [x * c + z * s2, -x * s2 + z * c];
      return [x, y, z];
    };
    return [rot([1, 0, 0]), rot([0, 1, 0]), rot([0, 0, 1])];
  }
  // box at any orientation, with flat toon faces; opt.col(axis, sign, a, b, p) may override or return -1
  function slab(
    c: BuilderVec3,
    ax: readonly BuilderVec3[],
    su: number,
    sv: number,
    sw: number,
    cols: BuilderRamp,
    opt?: BuilderSlabOptions | null
  ): void {
    opt = opt || {};
    const s = opt.s || 0.16,
      size = [su, sv, sw];
    for (let a = 0; a < 3; a++)
      for (const sg of [-1, 1]) {
        const N: BuilderVec3 = [ax[a][0] * sg, ax[a][1] * sg, ax[a][2] * sg],
          A = ax[(a + 1) % 3],
          Bx = ax[(a + 2) % 3],
          sa = size[(a + 1) % 3],
          sb = size[(a + 2) % 3],
          h = size[a] / 2;
        const nu = Math.max(1, Math.round(sa / s)),
          nv = Math.max(1, Math.round(sb / s)),
          st = Math.max(sa / nu, sb / nv) * 0.62;
        const t = lit(N),
          base = N[1] > 0.75 ? cols[3] : t > 0.73 ? cols[2] : t > 0.55 ? cols[1] : cols[0];
        for (let i = 0; i < nu; i++)
          for (let j = 0; j < nv; j++) {
            const fa = (i + 0.5) / nu,
              fb = (j + 0.5) / nv,
              ua = (fa - 0.5) * sa,
              ub = (fb - 0.5) * sb;
            const p: BuilderVec3 = [
              c[0] + N[0] * h + A[0] * ua + Bx[0] * ub,
              c[1] + N[1] * h + A[1] * ua + Bx[1] * ub,
              c[2] + N[2] * h + A[2] * ua + Bx[2] * ub
            ];
            let col = base;
            if (opt.col) {
              const r2 = opt.col(a, sg, fa, fb, p);
              if (r2 === -1) continue;
              if (r2 !== undefined) col = r2;
            }
            disc(p[0], p[1], p[2], N, st, st * 0.3, P[col], 3, opt.an);
          }
      }
  }
  // a dome of large soft splats that stands in for sky; fn(dir) picks the colour
  function sky(fn: (dir: BuilderVec3) => number, rad?: number): void {
    rad = rad || 70;
    for (let k = 0; k < 260; k++) {
      const d = fib(k, 260);
      iso(d[0] * rad, d[1] * rad, d[2] * rad, rad * 0.2, P[fn(d)], 0.85, { em: true, nd: true });
    }
  }
  // recolour solid splats near local lights: table[zone][paletteIndex] gives the lit colour, zone 0 dimmest
  /* Bounce light (optional: nothing calls this unless a diorama asks, or S.bounce is set). Light that has landed on one thing lights
     the things round it, in its own colour: orange off a fire onto snow, green up under a ledge from the moss below. For each dab a
     few lines are sent out over the side it faces; where one lands, the colour already there is what arrives, weaker with distance.
     The dab then takes the palette colour nearest to what it was plus that light. Only palette colours are ever used.
       sdf (x, y, z)  the finished field (S.sdf)
       o.k     how strong (1)            o.reach  how far light carries (2.4)       o.rays  lines to a dab (8)
       o.glow  how much more a glowing thing gives than a lit one (2.5)             o.from  first dab to do (those before are only lit from)
       o.tint  how much of its colour arrives, 0 for brightness only (1)       o.taps  { ramp: [], t: [] } a dab's ramp and brightness */
  let bounced = 0;
  function bounce(sdf: (x: number, y: number, z: number) => number, o?: BuilderBounceOptions | null): number {
    o = o || {};
    const k = o.k === undefined ? 1 : o.k,
      reach = o.reach || 2.4,
      rays = o.rays || 8,
      glow = o.glow === undefined ? 2.5 : o.glow,
      from = o.from === undefined ? bounced : o.from,
      cell = 0.3,
      grid = new Map<number, number[]>(),
      key = (x: number, y: number, z: number): number =>
        (Math.floor(x / cell) + 512) * 1048576 + (Math.floor(y / cell) + 512) * 1024 + (Math.floor(z / cell) + 512),
      was = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const q = i * 16;
      was[i] = data[q + 7];
      if (data[q + 3] < 1) continue;
      const kk = key(data[q], data[q + 1], data[q + 2]),
        g = grid.get(kk);
      if (g) g.push(i);
      else grid.set(kk, [i]);
    }
    const near = (x: number, y: number, z: number): number => {
      let best = -1,
        bd = 0.3 * 0.3;
      const cx = Math.floor(x / cell),
        cy = Math.floor(y / cell),
        cz = Math.floor(z / cell);
      for (let a = -1; a <= 1; a++)
        for (let b = -1; b <= 1; b++)
          for (let c = -1; c <= 1; c++) {
            const g = grid.get((cx + a + 512) * 1048576 + (cy + b + 512) * 1024 + (cz + c + 512));
            if (!g) continue;
            for (let j = 0; j < g.length; j++) {
              const q = g[j] * 16,
                dx = data[q] - x,
                dy = data[q + 1] - y,
                dz = data[q + 2] - z,
                d2 = dx * dx + dy * dy + dz * dz;
              if (d2 < bd) {
                bd = d2;
                best = g[j];
              }
            }
          }
      return best;
    };
    let changed = 0;
    for (let i = from; i < n; i++) {
      const q = i * 16,
        nv = nrms[i],
        ci = cidx[i];
      if (!nv || ci < 0 || data[q + 3] < 1 || Math.floor(data[q + 11] / 32) % 2) continue;
      const x = data[q],
        y = data[q + 1],
        z = data[q + 2];
      // two directions across the surface
      let ux = -nv[2],
        uz = nv[0],
        ul = Math.hypot(ux, uz);
      if (ul < 1e-3) ((ux = 1), (uz = 0), (ul = 1));
      ux /= ul;
      uz /= ul;
      const vx = nv[1] * uz,
        vy = nv[2] * ux - nv[0] * uz,
        vz = -nv[1] * ux,
        turn = ((i * 0.6180339) % 1) * TAU;
      let er = 0,
        eg = 0,
        eb = 0;
      for (let r = 0; r < rays; r++) {
        // spread evenly over the side the dab faces, more of them near straight out (where light counts most)
        const rad = Math.sqrt((r + 0.5) / rays),
          an = turn + r * 2.399963,
          a = rad * Math.cos(an),
          b = rad * Math.sin(an),
          c = Math.sqrt(Math.max(0, 1 - rad * rad)),
          dx = ux * a + vx * b + nv[0] * c,
          dy = vy * b + nv[1] * c,
          dz = uz * a + vz * b + nv[2] * c;
        let t = 0.12;
        for (let st = 0; st < 24 && t < reach; st++) {
          const h = sdf(x + dx * t, y + dy * t, z + dz * t);
          if (h < 0.02) {
            const j = near(x + dx * t, y + dy * t, z + dz * t);
            if (j >= 0) {
              const pk = was[j],
                f = 1 - t / reach,
                w = f * f * (Math.floor(data[j * 16 + 11] / 32) % 2 ? glow : 1);
              er += ((pk % 256) / 255) * w;
              eg += ((Math.floor(pk / 256) % 256) / 255) * w;
              eb += (Math.floor(pk / 65536) / 255) * w;
            }
            break;
          }
          t += h < 0.06 ? 0.06 : h;
        }
      }
      er /= rays;
      eg /= rays;
      eb /= rays;
      if (er + eg + eb < 0.02) continue;
      /* The light that arrives first moves the dab up its own ramp (o.taps says which ramp it was shaded on and how bright it came
         out, when the sculptor kept them): that is most of what bounce light does, shadows near bright things fill in. Then, if what
         arrives is strongly coloured, the palette colour nearest to that step plus the coloured light is taken, which is how a fire's
         orange gets onto the snow beside it. */
      const tp = o.taps,
        rp = tp && tp.ramp[i],
        lum = 0.3 * er + 0.59 * eg + 0.11 * eb;
      let step = ci;
      if (rp) step = rp[clamp(Math.floor((tp!.t[i] + lum * k) * rp.length), 0, rp.length - 1)];
      const c0 = P[step],
        mx = Math.max(c0[0], c0[1], c0[2], 40),
        tint = o.tint === undefined ? 1 : o.tint,
        tr = c0[0] + (c0[0] / mx) * 190 * (er - lum) * k * tint,
        tg = c0[1] + (c0[1] / mx) * 190 * (eg - lum) * k * tint,
        tb = c0[2] + (c0[2] / mx) * 190 * (eb - lum) * k * tint;
      let best = step,
        bd = (c0[0] - tr) * (c0[0] - tr) + (c0[1] - tg) * (c0[1] - tg) + (c0[2] - tb) * (c0[2] - tb);
      if (tint > 0)
        for (let j = 1; j < P.length; j++) {
          const pj = P[j],
            d = (pj[0] - tr) * (pj[0] - tr) + (pj[1] - tg) * (pj[1] - tg) + (pj[2] - tb) * (pj[2] - tb);
          if (d < bd * 0.8) {
            bd = d / 0.8;
            best = j;
          }
        }
      if (best !== ci) {
        const pj = P[best];
        data[q + 7] = (pj[0] | 0) + (pj[1] | 0) * 256 + (pj[2] | 0) * 65536;
        cidx[i] = best;
        changed++;
      }
    }
    bounced = n;
    return changed;
  }
  function relight(lights: readonly BuilderLight[], table: readonly BuilderRamp[]): void {
    for (let i = 0; i < n; i++) {
      const o = i * 16,
        c = cidx[i];
      if (c < 0 || data[o + 3] < 1 || Math.floor(data[o + 11] / 32) % 2) continue;
      let best = 0;
      for (const L of lights) {
        const dx = L.p[0] - data[o],
          dy = L.p[1] - data[o + 1],
          dz = L.p[2] - data[o + 2],
          dist = Math.hypot(dx, dy, dz);
        if (dist > L.r) continue;
        const nv = nrms[i],
          face = nv ? clamp(((nv[0] * dx + nv[1] * dy + nv[2] * dz) / (dist || 1)) * 0.6 + 0.5, 0, 1) : 0.7;
        const t = (1 - dist / L.r) * (0.3 + 0.7 * face) * (L.s || 1);
        if (t > best) best = t;
      }
      const zone = best > 0.5 ? 3 : best > 0.3 ? 2 : best > 0.14 ? 1 : 0;
      if (!zone) continue;
      const m = table[zone - 1][c];
      if (m === undefined) continue;
      data[o + 7] = P[m][0] + P[m][1] * 256 + P[m][2] * 65536;
    }
  }
  // water reflection: solid splats above y0 are copied below it, recoloured through map and broken into streaks
  function mirror(
    y0: number,
    inside: (x: number, z: number) => boolean,
    map: BuilderRamp,
    o?: BuilderMirrorOptions | null
  ): void {
    o = o || {};
    const n0 = n,
      gap = o.gap || 3.2,
      maxH = o.maxH || 9;
    for (let i = 0; i < n0; i++) {
      const s = i * 16,
        y = data[s + 1],
        c = cidx[i];
      if (y < y0 + 0.03 || y > y0 + maxH || data[s + 3] < 1 || map[c] === undefined) continue;
      const x = data[s],
        z = data[s + 2],
        dy = y - y0;
      if (!inside(x, z) || (dy * gap + 0.35 * Math.sin(x * 2.3)) % 1 < 0.3 + dy * 0.05) continue;
      push(
        x + 0.06 * Math.sin(dy * 7 + x),
        y0 - dy,
        z,
        data[s + 4],
        -data[s + 5],
        data[s + 6],
        data[s + 8],
        -data[s + 9],
        data[s + 10],
        P[map[c]],
        3,
        { nd: true }
      );
    }
  }
  function star(x: number, y: number, z: number, s2: number, c: number, an?: BuilderSplatAttrs): void {
    stick(x, y, z, [1, 0, 0], s2, s2 * 0.12 + 0.012, P[c], 3, an);
    stick(x, y, z, UP, s2, s2 * 0.12 + 0.012, P[c], 3, an);
  }
  function finish(meta?: BuilderWorldMeta): BuilderWorld {
    /* paint-over decals (ink-studio paint): pixels painted over a view of the diorama, each pinned where it fell on the surface, as a
       flat dab one pixel across of that palette colour just in front of it. Whatever builds the diorama puts its decals in
       INK_DECAL_NEXT as [x, y, z, nx, ny, nz, palette index] (the game's build embeds them as INK_PAINT, by diorama) */
    const dec =
      typeof globalThis !== 'undefined' ? (globalThis as typeof globalThis & BuilderGlobalThis).INK_DECAL_NEXT : null;
    if (dec && dec.length) {
      (globalThis as typeof globalThis & BuilderGlobalThis).INK_DECAL_NEXT = null;
      const px = 1 / ((meta && meta.detail) || 12);
      for (const [x, y, z, nx, ny, nz, c] of dec)
        if (P[c])
          disc(x + nx * px * 0.3, y + ny * px * 0.3, z + nz * px * 0.3, [nx, ny, nz], px * 0.6, px * 0.12, P[c], 3);
    }
    const world: BuilderWorld = Object.assign(
      {
        data: data.subarray(0, n * 16),
        count: n,
        renderMetadata: renderRows(),
        attr: attr ? Float32Array.from({ length: n * 4 }, (_, i) => attr![i] || 0) : undefined,
        pix: pix ? Float32Array.from({ length: n * 8 }, (_, i) => pix![i] || 0) : undefined,
        ramps: pix ? ramps.map(r => r.slice()) : undefined,
        rampOff: pix ? rampOff.slice() : undefined,
        pats: pix ? pats.slice() : undefined,
        ...(surfaceData
          ? { surfaceData: surfaceData.slice(0, n * SurfaceLook.STRIDE), surfaces: surfaces.slice() }
          : {}),
        fine: fine
          ? fine.length >= n * 12
            ? fine.subarray(0, n * 12)
            : Float32Array.from({ length: n * 12 }, (_, i) => fine![i] || 0)
          : undefined,
        moving: Int32Array.from(moving),
        back: Int32Array.from(back),
        bg: P[0],
        seed,
        pal: hex || PAL_HEX,
        palName: 'Moss',
        dither: 1,
        fog: { c: 0, start: 1, max: 0 },
        outline: { c: 0, edge: 0 },
        radius: 14
      },
      meta
    );
    if (world.surfaceEffects) world.surfaceEffects = KIT.splatEffects.context(world.surfaceEffects);
    return world;
  }
  // hand over everything pushed so far and start again empty
  const take = (): Float32Array => {
    const out = data.slice(0, n * 16);
    n = 0;
    fine = null;
    attr = null;
    attrN = null;
    pix = null;
    pixHas = false;
    surfaceData = null;
    surfacePending = false;
    surfaces.length = 0;
    surfaceIds.clear();
    bounced = 0;
    cidx.length = 0;
    nrms.length = 0;
    ownerRows = materialRows = muteEmission = undefined;
    unnamedOwners = new WeakMap<object, number>();
    unnamedMaterials = new WeakMap<object, number>();
    ownerIds.clear();
    materialIds.clear();
    ownerNames.length = materialNames.length = 1;
    moving.length = 0;
    back.length = 0;
    return out;
  };
  /* one dab read back: [x, y, z, nx, ny, nz, alpha, kind and flags, packed colour, palette index], or null if it has no surface it lies on */
  const dabAt = (i: number, out?: BuilderDab): BuilderDab | null => {
    const nv = nrms[i];
    if (!nv || i >= n) return null;
    const o = i * 16;
    out = out || (new Array(10) as BuilderDab);
    out[0] = data[o];
    out[1] = data[o + 1];
    out[2] = data[o + 2];
    out[3] = nv[0];
    out[4] = nv[1];
    out[5] = nv[2];
    out[6] = data[o + 3];
    out[7] = data[o + 11];
    out[8] = data[o + 7];
    out[9] = cidx[i];
    return out;
  };
  return {
    count: () => n,
    describeSplats: renderMetadata ? describeSplats : undefined,
    born: v => (bornV = v === undefined || v === null || !isFinite(v) ? null : v),
    wet: v => (wetV = v === undefined || v === null || !isFinite(v) ? null : v),
    fineTile,
    attrNext,
    pixNext,
    surfaceNext,
    dabAt,
    reseed,
    take,
    R,
    rr,
    pick,
    gauss,
    n3,
    fbm,
    P,
    TAU,
    UP,
    clamp,
    mix,
    smooth,
    norm,
    dot,
    add,
    randDir,
    fib,
    iso,
    disc,
    dab,
    stick,
    axial,
    setLight,
    lit,
    shade,
    path,
    spline,
    tube,
    branch,
    box,
    ball,
    cyl,
    spores,
    ground,
    frame,
    slab,
    sky,
    relight,
    bounce,
    mirror,
    star,
    finish
  };
}
