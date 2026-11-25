/* Convert a bounded signed distance function using the same mesh and sculpt paths as imported geometry. */
type P29SdfVec3 = [number, number, number];
type P29SdfDistance = (x: number, y: number, z: number) => number;
type P29SdfMaterial = Record<string, unknown>;

interface P29SdfBounds {
  min: P29SdfVec3;
  max: P29SdfVec3;
}

interface P29SdfFieldObject {
  sd: P29SdfDistance;
  lo?: P29SdfVec3;
  hi?: P29SdfVec3;
  h?: number;
}

interface P29SdfFunction {
  (x: number, y: number, z: number): number;
  sd?: P29SdfDistance;
  lo?: P29SdfVec3;
  hi?: P29SdfVec3;
  h?: number;
}

type P29SdfInput = P29SdfFunction | P29SdfFieldObject;

interface P29SdfOptions {
  bounds?: P29SdfBounds | null;
  resolution?: number;
  maxCells?: number;
  color?: P29SdfVec3;
  palette?: number[];
  background?: number;
  seed?: number;
  material?: P29SdfMaterial;
  res?: number;
  cam?: Record<string, unknown>;
  [key: string]: unknown;
}

interface P29SdfPrepared {
  sd: P29SdfDistance;
  bounds: P29SdfBounds | null;
  resolution: number;
}

interface P29SdfSurfaceGroup {
  owner: string;
  material: string;
  start: number;
  count: number;
}

interface P29SdfSurface {
  positions: ArrayLike<number>;
  normals: ArrayLike<number>;
  uv: ArrayLike<number>;
  groups: readonly P29SdfSurfaceGroup[];
}

interface P29SdfMesh {
  pos: Float32Array;
  tri: Uint32Array;
  vcol: Float32Array | null;
  tmat: Uint16Array;
  mats: readonly { name: string; rgb: P29SdfVec3 }[];
}

interface P29SdfSculpt {
  add(...args: unknown[]): unknown;
  bake(): void;
  [key: string]: unknown;
}

interface P29SdfSolid {
  res: number;
  [key: string]: unknown;
}

interface P29SdfLook {
  pal: number[];
  ramps: number[][];
}

interface P29SdfBuilder {
  finish(meta?: Record<string, unknown>): { data: Float32Array; count: number; [key: string]: unknown };
}

interface P29SdfKitHost {
  sdf: {
    toMesh(field: P29SdfInput, options?: P29SdfOptions): P29SdfMesh;
    solid(
      sculpt: P29SdfSculpt,
      field: P29SdfInput,
      material?: P29SdfMaterial | null,
      options?: P29SdfOptions
    ): P29SdfSolid;
    toSplats(field: P29SdfInput, options?: P29SdfOptions): ReturnType<P29SdfBuilder['finish']>;
  };
  procedural: {
    geometry: {
      implicitSurface(
        field: (point: P29SdfVec3) => number,
        bounds: P29SdfBounds | null,
        options: { resolution: number; maxCells: number }
      ): P29SdfSurface;
      toKitMesh(surface: P29SdfSurface, resolveMaterial: (owner: string, material: string) => P29SdfVec3): P29SdfMesh;
    };
  };
  mesh: {
    solid(
      sculpt: P29SdfSculpt,
      mesh: P29SdfMesh,
      material?: P29SdfMaterial | null,
      options?: Record<string, unknown>
    ): P29SdfSolid;
    look(mesh: P29SdfMesh, options: { pal?: number[]; bg?: number }): P29SdfLook;
    box(mesh: P29SdfMesh): { lo: P29SdfVec3; hi: P29SdfVec3 };
  };
}

declare const KIT: P29SdfKitHost;
declare function makeBuilder(seed: number, palette: readonly number[]): P29SdfBuilder;
declare function makeSculpt(builder: P29SdfBuilder): P29SdfSculpt;

(function (K: P29SdfKitHost) {
  function inputs(field: P29SdfInput, options: P29SdfOptions) {
    const sd = typeof field === 'function' ? field : field?.sd;
    if (typeof sd !== 'function') throw new TypeError('Expected a signed distance function or a field with sd');
    const evaluate = typeof field === 'function' ? sd : sd.bind(field);
    const bounds = options.bounds ?? (field.lo && field.hi ? { min: field.lo, max: field.hi } : null);
    const resolution = options.resolution ?? field.h ?? 0.12;
    return { sd: evaluate, bounds, resolution };
  }

  function polygonize(
    { sd, bounds, resolution }: P29SdfPrepared,
    { maxCells = 30000, color = [0.7, 0.7, 0.7] }: P29SdfOptions
  ) {
    const geometry = K.procedural.geometry;
    const surface = geometry.implicitSurface(p => sd(...p), bounds, { resolution, maxCells });
    if (!surface.positions.length) throw new RangeError('No zero surface found within the supplied bounds');
    return geometry.toKitMesh(surface, () => color);
  }

  function sculpt(
    S: P29SdfSculpt,
    mesh: P29SdfMesh,
    sd: P29SdfDistance,
    material: P29SdfMaterial | null | undefined,
    options: P29SdfOptions
  ) {
    return K.mesh.solid(S, mesh, material, { ...options, field: { sd, thick: 0, open: false } });
  }

  K.sdf.toMesh = (field, options = {}) => polygonize(inputs(field, options), options);
  K.sdf.solid = (S, field, material, options = {}) => {
    const input = inputs(field, options);
    return sculpt(S, polygonize(input, options), input.sd, material, options);
  };
  K.sdf.toSplats = (field, options = {}) => {
    const input = inputs(field, options);
    const mesh = polygonize(input, options);
    const look = K.mesh.look(mesh, { pal: options.palette, bg: options.background });
    const B = makeBuilder(options.seed ?? 1, look.pal);
    const S = makeSculpt(B);
    const { lo, hi } = K.mesh.box(mesh);
    const target = lo.map((v, i) => (v + hi[i]) / 2);
    const radius = Math.hypot(...(hi.map((v, i) => (v - lo[i]) / 2) as P29SdfVec3));
    const res = options.res ?? input.resolution;
    sculpt(S, mesh, input.sd, options.material ?? { r: look.ramps[0] }, { ...options, res });
    S.bake();
    return B.finish({
      cam: { target, dist: Math.max(1, radius * 3.65), yaw: 0.42, pitch: 0.28, ...options.cam },
      radius: Math.max(radius, 1),
      detail: 1 / res
    });
  };
})(KIT);

export {};
