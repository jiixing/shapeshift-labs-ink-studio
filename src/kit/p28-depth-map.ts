/* A calibrated raster becomes an observed surface, a backed solid, and
   survey-aligned Gaussian splats. Source pixels are top left, with y up in the scene. */
type P28DepthVec2 = [number, number];
type P28DepthVec3 = [number, number, number];
type P28DepthRgb = P28DepthVec3;
type P28DepthTriangle = [number, number, number];
type P28DepthDistance = (x: number, y: number, z: number) => number;
type P28DepthMaterial = Record<string, unknown>;

interface P28DepthSample {
  u: number;
  v: number;
  d: number;
}

interface P28DepthImage {
  width: number;
  height: number;
  channels?: number;
  data?: ArrayLike<number>;
}

interface P28DepthCameraSpec {
  type?: 'orthographic' | 'perspective';
  cx?: number;
  cy?: number;
  height?: number;
  fov?: number;
  fx?: number;
  fy?: number;
}

interface P28DepthCameraBase {
  type: 'orthographic' | 'perspective';
  cx: number;
  cy: number;
  scaleAt(distance: number): P28DepthVec2;
}

interface P28DepthOrthographicCamera extends P28DepthCameraBase {
  type: 'orthographic';
  height: number;
}

interface P28DepthPerspectiveCamera extends P28DepthCameraBase {
  type: 'perspective';
  fx: number;
  fy: number;
  fov: number;
}

type P28DepthCamera = P28DepthOrthographicCamera | P28DepthPerspectiveCamera;

interface P28DepthMapOptions {
  width: number;
  height: number;
  depth: ArrayLike<number>;
  mask?: ArrayLike<number> | null;
  image?: P28DepthImage | null;
  camera?: P28DepthCameraSpec;
  stride?: number;
  alphaMask?: boolean;
  invalid?: number;
  depthScale?: number;
  depthOffset?: number;
  maxDepthJump?: number;
  thickness?: number;
  backColor?: P28DepthRgb;
}

interface P28DepthFieldOptions {
  cells?: number;
  thick?: number;
  [key: string]: unknown;
}

interface P28DepthSplatOptions {
  spread?: number;
  relight?: boolean;
}

interface P28DepthWorldOptions extends P28DepthSplatOptions {
  seed?: number;
  background?: number;
  [key: string]: unknown;
}

interface P28DepthMesh {
  pos: Float32Array;
  tri: Uint32Array;
  vcol: Float32Array | null;
  tmat: Uint16Array;
  mats: readonly { name: string; rgb: P28DepthRgb }[];
}

interface P28DepthField {
  sd: P28DepthDistance;
  lo: P28DepthVec3;
  hi: P28DepthVec3;
  n: P28DepthVec3;
  h: number;
  D: Float32Array;
}

interface P28DepthSolidInput {
  bc: P28DepthVec3;
  br: number;
  sd: P28DepthDistance;
  field: P28DepthField;
  mesh: P28DepthMesh;
  sample(emit: (x: number, y: number, z: number) => void): void;
  [key: string]: unknown;
}

interface P28DepthSolid extends P28DepthSolidInput {
  res: number;
}

interface P28DepthSculpt {
  add<T extends P28DepthSolidInput>(
    solid: T,
    material?: P28DepthMaterial | null,
    options?: P28DepthFieldOptions
  ): T & P28DepthSolid;
}

interface P28DepthBuilder {
  dab(
    x: number,
    y: number,
    z: number,
    normal: P28DepthVec3,
    direction: P28DepthVec3,
    sa: number,
    sb: number,
    sn: number,
    color: P28DepthRgb,
    alpha: number
  ): void;
  finish(meta?: Record<string, unknown>): { data: Float32Array; count: number; [key: string]: unknown };
}

interface P28DepthGrid {
  format?: string;
  origin?: P28DepthVec3;
  spacing?: number;
  dimensions?: P28DepthVec3;
  values?: ArrayLike<number>;
}

interface P28DepthKitHost {
  V: {
    cross(a: ArrayLike<number>, b: ArrayLike<number>): P28DepthVec3;
    sub(a: ArrayLike<number>, b: ArrayLike<number>): P28DepthVec3;
    len(a: ArrayLike<number>): number;
    norm(a: ArrayLike<number>): P28DepthVec3;
    dot(a: ArrayLike<number>, b: ArrayLike<number>): number;
  };
  clamp(value: number, min: number, max: number): number;
  mesh: {
    make(pos: ArrayLike<number>, triangles: ArrayLike<number>, colors: ArrayLike<number>): P28DepthMesh;
    box(mesh: P28DepthMesh): { lo: P28DepthVec3; hi: P28DepthVec3 };
    solid(
      sculpt: P28DepthSculpt,
      mesh: P28DepthMesh,
      material?: P28DepthMaterial | null,
      options?: P28DepthFieldOptions
    ): P28DepthSolid;
    field(mesh: P28DepthMesh, options: { cells: number; thick: number }): P28DepthField;
    look(mesh: P28DepthMesh, options: { hues: number; shades: number; bg: number }): { pal: number[] };
    gridSampler(lo: P28DepthVec3, n: P28DepthVec3, spacing: number, values: Float32Array): P28DepthDistance;
  };
  depth: {
    fromMap(options: P28DepthMapOptions): unknown;
    readField(grid: P28DepthGrid): P28DepthField;
  };
}

declare const KIT: P28DepthKitHost;
declare function makeBuilder(seed: number, palette: readonly number[]): P28DepthBuilder;

(function (K: P28DepthKitHost) {
  const V = K.V;
  const MAX_SAMPLES = 180000;
  const GRAY: P28DepthRgb = [0.59, 0.67, 0.73];
  const finitePositive = (n: number) => Number.isFinite(n) && n > 0;
  const vectorAt = (values: ArrayLike<number>, i: number): P28DepthVec3 => [
    values[3 * i],
    values[3 * i + 1],
    values[3 * i + 2]
  ];
  const bytes = (color: readonly number[]): P28DepthRgb =>
    color.map(v => Math.round(K.clamp(v, 0, 1) * 255)) as P28DepthRgb;

  function cameraFor(width: number, height: number, spec: P28DepthCameraSpec): P28DepthCamera {
    const type = spec.type ?? 'orthographic';
    const cx = spec.cx ?? (width - 1) / 2;
    const cy = spec.cy ?? (height - 1) / 2;
    if (![cx, cy].every(Number.isFinite)) throw new TypeError('The optical centre must be finite');
    if (type === 'orthographic') {
      const heightInWorld = spec.height ?? 2;
      if (!finitePositive(heightInWorld)) throw new RangeError('Orthographic height must be positive');
      return {
        type,
        cx,
        cy,
        height: heightInWorld,
        scaleAt: (): P28DepthVec2 => [heightInWorld / height, heightInWorld / height]
      };
    }
    if (type !== 'perspective') throw new RangeError('Projection must be orthographic or perspective');
    const fov = spec.fov ?? 38;
    if (!Number.isFinite(fov) || fov <= 0 || fov >= 179)
      throw new RangeError('Vertical FOV must be between 0 and 179 degrees');
    const focal = height / (2 * Math.tan((fov * Math.PI) / 360));
    const fx = spec.fx ?? spec.fy ?? focal;
    const fy = spec.fy ?? spec.fx ?? focal;
    if (![fx, fy].every(finitePositive)) throw new RangeError('Focal lengths must be positive');
    return { type, cx, cy, fx, fy, fov, scaleAt: (d): P28DepthVec2 => [d / fx, d / fy] };
  }

  function fromMap(options: P28DepthMapOptions) {
    const { width, height, depth, mask, image } = options;
    if (
      ![width, height].every(v => Number.isSafeInteger(v) && v > 0) ||
      !Number.isSafeInteger(width * height) ||
      !depth ||
      depth.length !== width * height
    )
      throw new TypeError('Depth needs one value per pixel and valid width and height');
    if (mask && mask.length !== depth.length) throw new TypeError('The depth mask must match the depth dimensions');
    const channels = image ? (image.channels ?? (image.data?.length === depth.length * 4 ? 4 : 3)) : 0;
    if (
      image &&
      (image.width !== width ||
        image.height !== height ||
        ![3, 4].includes(channels) ||
        !image.data ||
        image.data.length !== depth.length * channels)
    )
      throw new TypeError('The colour image must match the depth map and contain RGB or RGBA bytes');

    const camera = cameraFor(width, height, options.camera ?? {});
    const stride = options.stride ?? Math.max(1, Math.ceil(Math.sqrt(depth.length / 64000)));
    if (!Number.isSafeInteger(stride) || stride < 1) throw new RangeError('Stride must be a positive integer');
    const rows = Math.ceil(height / stride),
      cols = Math.ceil(width / stride);
    if (rows * cols > MAX_SAMPLES) throw new RangeError('Too many depth samples for one asset. Increase the stride');
    const { depthScale = 1, depthOffset = 0 } = options;
    if (!finitePositive(depthScale) || !Number.isFinite(depthOffset))
      throw new RangeError('Invalid depth scale or offset');
    const pos: number[] = [],
      colors: number[] = [],
      samples: P28DepthSample[] = [];
    const order = new Int32Array(rows * cols).fill(-1);
    const project = (u: number, v: number, d: number): P28DepthVec3 => {
      const [xs, ys] = camera.scaleAt(d);
      return [(u - camera.cx) * xs, (camera.cy - v) * ys, -d];
    };
    let low = Infinity,
      high = -Infinity;
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const u = Math.min(width - 1, col * stride + Math.floor(stride / 2));
        const v = Math.min(height - 1, row * stride + Math.floor(stride / 2));
        const pixel = v * width + u,
          raw = depth[pixel];
        if ((mask && !mask[pixel]) || (options.alphaMask && channels === 4 && !image!.data![pixel * channels + 3]))
          continue;
        if (!Number.isFinite(raw) || raw === options.invalid) continue;
        const d = raw * depthScale + depthOffset;
        if (!finitePositive(d)) continue;
        const p = project(u, v, d);
        if (!p.every(v => Number.isFinite(Math.fround(v))))
          throw new RangeError('Projection exceeds the supported coordinate range');
        let rgb: number[] = GRAY;
        if (image && (channels !== 4 || image.data![pixel * channels + 3])) {
          rgb = [0, 1, 2].map(i => image.data![pixel * channels + i] / 255);
          if (rgb.some(value => !Number.isFinite(value) || value < 0 || value > 1))
            throw new RangeError('Colour channels must contain values from 0 to 255');
        }
        order[row * cols + col] = samples.length;
        samples.push({ u, v, d });
        pos.push(...p);
        colors.push(...rgb);
        low = Math.min(low, d);
        high = Math.max(high, d);
      }
    if (!samples.length) throw new RangeError('The depth map has no valid samples');

    const jump = options.maxDepthJump ?? typicalJump(order, samples, cols, rows, high - low);
    if (jump !== Infinity && !(Number.isFinite(jump) && jump >= 0))
      throw new RangeError('Maximum depth jump must be nonnegative');
    const connected = (a: number, b: number) => a >= 0 && b >= 0 && Math.abs(samples[a].d - samples[b].d) <= jump;
    const validFace = (a: number, b: number, c: number) => connected(a, b) && connected(b, c) && connected(c, a);
    const frontTriangles: number[] = [];
    const normals = new Float64Array(samples.length * 3);
    const used = new Uint8Array(samples.length);
    const observed = ([a, b, c]: P28DepthTriangle) => {
      frontTriangles.push(a, b, c);
      const p = vectorAt(pos, a);
      const n = V.cross(V.sub(vectorAt(pos, b), p), V.sub(vectorAt(pos, c), p));
      for (const i of [a, b, c]) {
        used[i] = 1;
        for (let k = 0; k < 3; k++) normals[i * 3 + k] += n[k];
      }
    };
    // Prefer the diagonal that preserves more samples without crossing a depth step.
    for (let row = 0; row < rows - 1; row++)
      for (let col = 0; col < cols - 1; col++) {
        const a = order[row * cols + col],
          b = order[row * cols + col + 1];
        const c = order[(row + 1) * cols + col],
          d = order[(row + 1) * cols + col + 1];
        const ac: P28DepthTriangle[] = (
          [
            [a, c, d],
            [a, d, b]
          ] as P28DepthTriangle[]
        ).filter(t => validFace(...t));
        const bc: P28DepthTriangle[] = (
          [
            [a, c, b],
            [b, c, d]
          ] as P28DepthTriangle[]
        ).filter(t => validFace(...t));
        const useSecond =
          bc.length > ac.length ||
          (bc.length === ac.length &&
            bc.length &&
            connected(b, c) &&
            (!connected(a, d) || Math.abs(samples[b].d - samples[c].d) < Math.abs(samples[a].d - samples[d].d)));
        (useSecond ? bc : ac).forEach(observed);
      }
    const rasterVertices = samples.slice();
    for (const [i, s] of samples.entries()) {
      if (used[i]) continue;
      // A disconnected pixel still contributes a small camera-facing patch.
      const h = stride * 0.44,
        first = pos.length / 3;
      for (const [du, dv] of [
        [-h, -h],
        [h, -h],
        [-h, h],
        [h, h]
      ]) {
        const vertex = { u: s.u + du, v: s.v + dv, d: s.d };
        rasterVertices.push(vertex);
        pos.push(...project(vertex.u, vertex.v, vertex.d));
        colors.push(...vectorAt(colors, i));
      }
      frontTriangles.push(first, first + 2, first + 1, first + 1, first + 2, first + 3);
    }
    let boundary = boundaryEdges(frontTriangles, rasterVertices.length);
    if (splitBoundaryFans(frontTriangles, boundary, rasterVertices, pos, colors))
      boundary = boundaryEdges(frontTriangles, rasterVertices.length);
    const front = K.mesh.make(pos, frontTriangles, colors);
    const bounds = K.mesh.box(front);
    const span = Math.max(...bounds.hi.map((v, k) => v - bounds.lo[k]));
    if (!finitePositive(span)) throw new RangeError('Depth samples do not span a representable surface');
    const thickness = options.thickness ?? span * 0.085;
    if (!finitePositive(thickness)) throw new RangeError('Backing thickness must be positive');
    const count = pos.length / 3;
    const back = rasterVertices.flatMap(s => project(s.u, s.v, s.d + thickness));
    if (!back.every(v => Number.isFinite(Math.fround(v))))
      throw new RangeError('Backing exceeds the supported coordinate range');
    const backColor: P28DepthRgb = options.backColor ?? [0.3, 0.38, 0.46];
    if (
      !Array.isArray(backColor) ||
      backColor.length !== 3 ||
      backColor.some(v => !Number.isFinite(v) || v < 0 || v > 1)
    )
      throw new TypeError('Backing colour must be an RGB triple in 0…1');
    const closedTriangles = frontTriangles.slice();
    for (let i = 0; i < frontTriangles.length; i += 3) {
      closedTriangles.push(frontTriangles[i] + count, frontTriangles[i + 2] + count, frontTriangles[i + 1] + count);
    }
    for (const [a, b] of boundary.values()) closedTriangles.push(b, a, a + count, b, a + count, b + count);
    const closedColors = colors.concat(Array.from({ length: count }, () => backColor).flat());
    const mesh = K.mesh.make(pos.concat(back), closedTriangles, closedColors);
    const closedBounds = K.mesh.box(mesh);
    const fields = new Map<number, P28DepthField>();

    function field({ cells = 64 }: P28DepthFieldOptions = {}) {
      if (!Number.isSafeInteger(cells) || cells < 8 || cells > 128)
        throw new RangeError('Field resolution must be 8…128 cells');
      if (!fields.has(cells)) fields.set(cells, K.mesh.field(mesh, { cells, thick: 0 }));
      return fields.get(cells)!;
    }

    function addSolid(S: P28DepthSculpt, material: P28DepthMaterial, options: P28DepthFieldOptions = {}) {
      return K.mesh.solid(S, mesh, material, { ...options, field: field(options) });
    }

    const normalAt = (i: number): P28DepthVec3 => {
      const n = vectorAt(normals, i);
      return V.len(n) > 1e-12 ? V.norm(n) : [0, 0, 1];
    };

    function splat(B: P28DepthBuilder, { spread = 0.6, relight = !image }: P28DepthSplatOptions = {}) {
      if (!finitePositive(spread)) throw new RangeError('Splat spread must be positive');
      const light = V.norm([-0.43, 0.6, 0.67]);
      for (const [i, s] of samples.entries()) {
        const p = vectorAt(pos, i),
          n = normalAt(i),
          [xs, ys] = camera.scaleAt(s.d);
        const tangent = V.cross([0, 1, 0], n);
        const axis: P28DepthVec3 = V.len(tangent) > 1e-6 ? V.norm(tangent) : [1, 0, 0];
        const dx = (xs * stride) / Math.max(0.43, Math.hypot(n[1], n[2]));
        const dy = (ys * stride) / Math.max(0.43, Math.hypot(n[0], n[2]));
        const shade = relight ? 0.43 + 0.57 * Math.max(0, V.dot(light, n)) : 1;
        const rgb = bytes(vectorAt(colors, i).map(v => v * shade));
        B.dab(...p, n, axis, dx * spread, dy * spread, Math.min(dx, dy) * 0.12, rgb, 3);
      }
      return samples.length;
    }

    function world({ seed = 1, background = 0x131920, ...options }: P28DepthWorldOptions = {}) {
      const palette = K.mesh.look(front, { hues: 11, shades: 4, bg: background }).pal;
      const B = makeBuilder(seed, palette);
      splat(B, options);
      const target = bounds.lo.map((v, k) => (v + bounds.hi[k]) / 2);
      const size = Math.max(bounds.hi[1] - bounds.lo[1], bounds.hi[0] - bounds.lo[0]);
      const dist = Math.max(size / (1.44 * Math.tan((38 * Math.PI) / 360)), span * 1.7);
      return B.finish({
        cam: { target, dist, yaw: 0, pitch: 0 },
        detail: (Math.max(cols, rows) * 2) / Math.max(size, 1e-6),
        radius: Math.max(span, 1),
        dither: 0
      });
    }

    return {
      front,
      mesh,
      bounds: closedBounds,
      camera,
      count: samples.length,
      stride,
      thickness,
      maxDepthJump: jump,
      field,
      addSolid,
      splat,
      world
    };
  }

  function boundaryEdges(triangles: number[], count: number): Map<number, [number, number]> {
    const edges = new Map<number, [number, number]>();
    for (let i = 0; i < triangles.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        const a = triangles[i + j],
          b = triangles[i + ((j + 1) % 3)];
        const key = Math.min(a, b) * count + Math.max(a, b);
        if (edges.has(key)) edges.delete(key);
        else edges.set(key, [a, b]);
      }
    }
    return edges;
  }

  // Two islands can touch at one raster sample. Keep separate vertex fans so
  // extruding them does not give the same vertical edge four incident faces.
  function splitBoundaryFans(
    triangles: number[],
    boundary: Map<number, [number, number]>,
    raster: P28DepthSample[],
    positions: number[],
    colors: number[]
  ) {
    const degree = new Uint8Array(raster.length);
    for (const [a, b] of boundary.values()) {
      degree[a]++;
      degree[b]++;
    }
    const candidates = new Map<number, Set<number>>();
    degree.forEach((n, vertex) => {
      if (n > 2) candidates.set(vertex, new Set());
    });
    if (!candidates.size) return false;
    triangles.forEach((vertex, offset) => candidates.get(vertex)?.add(offset));
    const neighbors = (offset: number): [number, number] => {
      const face = offset - (offset % 3);
      return [triangles[face + ((offset + 1) % 3)], triangles[face + ((offset + 2) % 3)]];
    };
    for (const [vertex, remaining] of candidates) {
      let id = vertex;
      while (remaining.size) {
        const next: number[] = [remaining.values().next().value!];
        while (next.length) {
          const offset = next.pop()!;
          remaining.delete(offset);
          const [a, b] = neighbors(offset);
          triangles[offset] = id;
          for (const corner of remaining) {
            const [c, d] = neighbors(corner);
            if (a === c || a === d || b === c || b === d) {
              remaining.delete(corner);
              next.push(corner);
            }
          }
        }
        if (!remaining.size) break;
        id = raster.length;
        raster.push(raster[vertex]);
        positions.push(...vectorAt(positions, vertex));
        colors.push(...vectorAt(colors, vertex));
      }
    }
    return true;
  }

  function typicalJump(order: Int32Array, samples: P28DepthSample[], cols: number, rows: number, span: number) {
    const values: number[] = [];
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < cols; col++) {
        const p = order[row * cols + col];
        if (p < 0) continue;
        for (const q of [
          col + 1 < cols ? order[row * cols + col + 1] : -1,
          row + 1 < rows ? order[(row + 1) * cols + col] : -1
        ]) {
          if (q >= 0) values.push(Math.abs(samples[p].d - samples[q].d));
        }
      }
    values.sort((a, b) => a - b);
    return Math.max(span * 0.075, (values[values.length >> 1] ?? 0) * 4, 1e-8);
  }

  function readField(grid: P28DepthGrid): P28DepthField {
    const { format, origin, spacing, dimensions, values } = grid;
    if (
      format !== 'ink-studio-sdf-grid-v1' ||
      !Array.isArray(origin) ||
      origin.length !== 3 ||
      !origin.every(Number.isFinite) ||
      !Array.isArray(dimensions) ||
      dimensions.length !== 3 ||
      !dimensions.every(n => Number.isSafeInteger(n) && n >= 2 && n <= 136) ||
      !finitePositive(spacing!) ||
      !values ||
      values.length !== dimensions.reduce((n, v) => n * v, 1) ||
      !Array.prototype.every.call(values, v => Number.isFinite(v) && Number.isFinite(Math.fround(v)))
    )
      throw new TypeError('Invalid Ink Studio signed-distance grid');
    const lo = origin.slice() as P28DepthVec3,
      n = dimensions.slice() as P28DepthVec3,
      D = Float32Array.from(values);
    const hi = lo.map((v, i) => v + spacing! * (n[i] - 1)) as P28DepthVec3;
    return { lo, hi, n, h: spacing!, D, sd: K.mesh.gridSampler(lo, n, spacing!, D) };
  }

  K.depth = { fromMap, readField };
})(KIT);

export {};
