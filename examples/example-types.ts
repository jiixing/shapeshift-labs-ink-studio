import type { CLIWorld, InkLibrary, SceneDefinition } from '../cli/ink-studio.types.js';

export type ExampleScene = SceneDefinition;
export type ExampleVec2 = [number, number];
export type ExampleVec3 = [number, number, number];
export type ExampleColor = readonly number[];
export type ExampleSdf = (x: number, y: number, z: number) => number;

export interface ExampleMaterial {
  r: readonly number[];
  rf?: (x: number, y: number, z: number) => readonly number[] | null;
  mod?: (x: number, y: number, z: number) => number;
  tex?: (
    x: number,
    y: number,
    z: number,
    ny: number,
    intensity: number,
    nx?: number,
    nz?: number
  ) => number | undefined;
  [key: string]: unknown;
}

export interface ExampleSolidDraft {
  bc: readonly number[];
  br: number;
  sd: ExampleSdf;
  sample(this: ExampleSolid, emit: (x: number, y: number, z: number) => void): void;
  [key: string]: unknown;
}

export interface ExampleSolid extends ExampleSolidDraft {
  res: number;
}

export interface ExampleSolidOptions {
  res?: number;
  rd?: number;
  tag?: string;
  neg?: boolean;
  hold?: boolean;
  ghost?: boolean;
  ax?: readonly (readonly number[])[];
  reach?: number;
  cell?: number;
  maxWork?: number;
  [key: string]: unknown;
}

export interface ExampleGroundOptions extends ExampleSolidOptions {
  rad?: number;
  zs?: number;
  edge?: number;
  cx?: number;
  cz?: number;
  y?: number;
  h?: (x: number, z: number) => number;
  keep?: (x: number, z: number) => boolean;
}

export interface ExampleSculpt {
  pixel?: boolean;
  amb?: number;
  sky?: number;
  sunK?: number;
  sun?: ExampleVec3;
  wob?: number;
  sdf: ExampleSdf;
  ground(material: ExampleMaterial, options?: ExampleGroundOptions): unknown;
  box(
    center: readonly number[],
    half: readonly number[],
    material: ExampleMaterial,
    options?: ExampleSolidOptions
  ): unknown;
  ball(
    center: readonly number[],
    radius: number | readonly number[],
    material: ExampleMaterial,
    options?: ExampleSolidOptions
  ): ExampleSolid;
  rock(
    center: readonly number[],
    radius: number | readonly number[],
    material: ExampleMaterial,
    options?: ExampleSolidOptions
  ): ExampleSolid;
  tube(
    points: readonly (readonly number[])[],
    radius: number | ((t: number) => number),
    endRadius: number,
    material: ExampleMaterial,
    options?: ExampleSolidOptions
  ): unknown;
  implicitForm(
    field: { bounds: { min: readonly number[]; max: readonly number[] }; sd: ExampleSdf; cost?: number },
    material: ExampleMaterial,
    options?: ExampleSolidOptions
  ): unknown;
  terrain(
    material: ExampleMaterial,
    options: {
      x0: number;
      x1: number;
      z0: number;
      z1: number;
      h: (x: number, z: number) => number;
      keep?: (x: number, z: number) => boolean;
      res?: number;
    }
  ): unknown;
  psd(solid: ExampleSolid, x: number, y: number, z: number): number;
  lathe(
    center: readonly number[],
    height: number,
    radius: number | readonly number[] | ((t: number) => number),
    material: ExampleMaterial,
    options?: ExampleSolidOptions
  ): unknown;
  vox(model: ExampleVoxModel, options?: ExampleSolidOptions): unknown;
  poly(
    center: readonly number[],
    planes: ReadonlyArray<{ n: readonly number[]; d: number }>,
    material: ExampleMaterial,
    options?: ExampleSolidOptions
  ): unknown;
  extrude(
    loops: readonly (readonly (readonly number[])[])[],
    center: readonly number[],
    depth: number,
    material: ExampleMaterial,
    options?: ExampleSolidOptions
  ): unknown;
  displace(
    solid: ExampleSolid,
    field: ExampleSdf | Record<string, unknown>,
    amplitude: number,
    options?: ExampleSolidOptions
  ): unknown;
  pick(ramp: readonly number[], intensity: number): number;
  add<T extends ExampleSolidDraft>(
    solid: T,
    material?: ExampleMaterial,
    options?: ExampleSolidOptions
  ): T & ExampleSolid;
  bake(): void;
}

export type ExampleVoxRows = string | readonly string[];
export type ExampleVoxLayer = ExampleVoxRows | readonly [ExampleVoxRows, number];

export interface ExampleVoxModel {
  cell: number | readonly number[];
  hard?: boolean;
  key: Record<string, readonly number[]>;
  layers: readonly ExampleVoxLayer[];
}

export interface ExampleBuilder {
  readonly P: readonly ExampleColor[];
  count(): number;
  R(): number;
  n3(x: number, y: number, z: number): number;
  frame(yaw: number, pitch: number, roll: number): number[];
  ball(
    x: number,
    y: number,
    z: number,
    rx: number,
    ry: number,
    rz: number,
    segments: number,
    colors: readonly number[]
  ): void;
  iso(
    x: number,
    y: number,
    z: number,
    size: number,
    color: ExampleColor,
    alpha: number,
    attrs?: Record<string, unknown>
  ): void;
  disc(
    x: number,
    y: number,
    z: number,
    normal: readonly number[],
    sa: number,
    sb: number,
    color: ExampleColor,
    alpha: number,
    attrs?: Record<string, unknown>
  ): void;
  box(
    x: number,
    y: number,
    z: number,
    hx: number,
    hy: number,
    hz: number,
    colors: readonly number[],
    options?: ExampleSolidOptions
  ): void;
  describeSplats(start: number, end: number, description: Record<string, unknown>): void;
  finish(options?: Record<string, unknown>): CLIWorld;
}

export interface ExamplePick {
  p: ExampleVec3;
}

export interface ExampleStage {
  W: CLIWorld;
  D: Float32Array;
  base: Float32Array;
  N: number;
  add<T extends ExampleSystem>(system: T): T;
}

export interface ExampleSystem {
  bind?(stage: ExampleStage): void;
  pre?(dt: number, time: number, stage: ExampleStage): void;
  update?(dt: number, time: number, stage: ExampleStage): void;
  paint?(index: number, color: number[], stage: ExampleStage): void;
  poke?(
    hit: ExamplePick | null,
    origin?: readonly number[],
    direction?: readonly number[],
    time?: number,
    stage?: ExampleStage
  ): void;
}

export interface ExampleParticles extends ExampleSystem {
  embers(position: readonly number[], count: number, colors: readonly number[]): void;
  sparks(position: readonly number[], count: number, colors: readonly number[]): void;
}

export interface ExampleClothOptions {
  at?: readonly number[];
  u?: readonly number[];
  v?: readonly number[];
  nu?: number;
  nv?: number;
  pins?: (i: number, j: number) => boolean;
  pinAt?: (i: number, j: number, point: readonly number[], time: number) => readonly number[];
  pattern?: (u: number, v: number) => readonly number[] | null | undefined;
  wind?: unknown;
  sdf?: ExampleSdf;
  [key: string]: unknown;
}

export interface ExampleFrameModel {
  readonly count: number;
}

export interface ExampleDraw {
  point(
    position: readonly number[],
    options?: { width?: number; density?: number; rgb?: readonly number[]; emissive?: boolean }
  ): boolean;
  model(
    model: ExampleFrameModel,
    at: readonly number[],
    options?: { matrix?: readonly number[]; opacity?: number }
  ): boolean;
  vortex(
    center: readonly number[],
    options?: {
      radius?: number | readonly number[];
      height?: number;
      turns?: number;
      segments?: number;
      phase?: number;
      width?: number;
      color?: number;
    }
  ): boolean;
}

export interface ExampleFrameSystem extends ExampleSystem {
  readonly count: number;
}

export interface ExampleFrameSplats {
  (
    builder: ExampleBuilder,
    capacity: number,
    render: (draw: ExampleDraw, dt: number, time: number) => void
  ): ExampleFrameSystem;
  capture(world: CLIWorld, origin?: readonly number[]): ExampleFrameModel;
}

export interface ExampleAdaptiveCell {
  depth: number;
}

export interface ExampleAdaptiveFace {
  indices: number[];
  transition?: boolean;
}

export interface ExampleAdaptiveSurface {
  points: ExampleVec3[];
  normals: ExampleVec3[];
  faces: ExampleAdaptiveFace[];
  cells: ExampleAdaptiveCell[];
  tree: { lookup(x: number, y: number, z: number): { depth?: number } | null };
}

export interface ExampleWake {
  velocity(x: number, y: number, z: number, time?: number): ExampleVec3;
}

export interface ExampleTrail {
  points: ExampleVec3[];
}

export interface ExampleOrbit {
  sample(time: number): { point: ExampleVec3 };
}

export interface ExampleWeatherSample {
  wetness: number;
  snow: number;
  frost: number;
  [key: string]: number;
}

export interface ExampleWeatherState {
  sample(x: number, z: number): ExampleWeatherSample | undefined;
}

export interface ExampleWeather {
  step(
    time: number,
    options: { forcing?: (x: number, z: number) => Record<string, number | readonly number[]> }
  ): ExampleWeatherState;
}

export interface ExampleStateMachine {
  initial: string;
  states: Record<string, { r: number[]; [key: string]: unknown }>;
  transitions: Array<{
    id: string;
    from: string;
    event: string;
    to: string;
    minAge?: number;
    when?: (frame: { payload: Record<string, number> }) => boolean;
    [key: string]: unknown;
  }>;
}

export interface ExampleMaterialStateGraph {
  advance(
    time: number,
    events: Array<{ at: number; type: string; target: string | string[]; payload?: Record<string, number> }>
  ): void;
  get(id: string): { material: ExampleMaterial; state: string };
}

export interface ExampleDepthInput {
  width: number;
  height: number;
  depth: ArrayLike<number>;
  image?: { width: number; height: number; data: ArrayLike<number> };
  camera?: { type?: 'orthographic' | 'perspective'; height?: number };
}

export interface ExampleDepthModel {
  world(options?: { background?: number }): CLIWorld;
}

export interface ExampleImplicitField {
  bounds: { min: readonly number[]; max: readonly number[] };
  sd: ExampleSdf;
  cost?: number;
}

export interface ExamplePlanarProfile {
  [key: string]: unknown;
}

export interface ExampleWeightedRoof {
  status: string;
  reason?: string;
  solid(options: { base: number; thickness: number }): ExampleImplicitField;
  arcs: Array<{ a: readonly number[]; b: readonly number[]; kind: string }>;
}

export interface ExampleRoute {
  points: ExampleVec3[];
  bounds: { min: ExampleVec3; max: ExampleVec3 };
  sample(value: number): ExampleAssemblyFrame;
  closest(point: readonly number[]): { distance: number };
}

export interface ExampleNetworkEdge {
  a: number;
  b: number;
  cost: number;
  loop?: boolean;
  route: ExampleRoute;
}

export interface ExampleNetwork {
  status: string;
  candidates: ExampleNetworkEdge[];
  edges: ExampleNetworkEdge[];
  nodes?: number[];
}

export interface ExampleBasin {
  reaches: Array<{ route: ExampleRoute }>;
  wetness(x: number, z: number): number;
}

export interface ExampleDualSurface {
  points: ExampleVec3[];
  normals: ExampleVec3[];
}

export interface ExampleLayoutMap {
  width: number;
  height: number;
  cells: ArrayLike<number>;
}

export interface ExampleTileModel {
  tiles: Array<{ id: string; sockets: Record<string, string | null> }>;
}

export interface ExampleTilePattern {
  status: string;
  width: number;
  height: number;
  at(x: number, z: number): string;
}

export interface ExampleAssemblyFrame {
  point: ExampleVec3;
  tangent: ExampleVec3;
  side: ExampleVec3;
  normal: ExampleVec3;
}

export interface ExampleAssemblyRoute {
  length: number;
  sample(value: number): ExampleAssemblyFrame;
}

export interface ExampleAssemblyModule {
  id: string;
  length: number;
  min?: number;
  max?: number;
  in?: string;
  out?: string;
  reversible?: boolean;
  cost?: number;
  data?: Record<string, unknown>;
}

export interface ExampleAssemblyPart {
  key: string;
  module: string;
  reversed: boolean;
  length: number;
  natural: number;
  t0: number;
  t1: number;
  data: Record<string, unknown>;
  in: string;
  out: string;
  start: ExampleAssemblyFrame;
  end: ExampleAssemblyFrame;
  frame: ExampleAssemblyFrame;
}

export interface ExampleAssembly {
  id: string;
  status: string;
  cost: number;
  parts: ExampleAssemblyPart[];
  intervals: Array<{ a: string; b: string; length: number; status: string }>;
  anchors: Array<{ id: string; at: number; enter: string; out: string }>;
  work: { checks: number; queue: number; priceSearchComplete: boolean };
}

export interface ExampleLoadBearing {
  key: string;
  top: ExampleVec3;
  base: ExampleVec3;
  height: number;
  column: boolean;
  load: number;
  spans: string[];
}

export interface ExampleLoadBeam {
  key: string;
  span: string;
  a: ExampleVec3;
  b: ExampleVec3;
  length: number;
  load: number;
  supports: string[];
}

export interface ExampleLoadBrace {
  key: string;
  a: ExampleVec3;
  b: ExampleVec3;
  beam: string;
  column: string;
}

export interface ExampleLoadResult {
  status: string;
  spans: Array<{ id: string; status: string; limit?: number; supports?: string[] }>;
  bearings: ExampleLoadBearing[];
  beams: ExampleLoadBeam[];
  braces: ExampleLoadBrace[];
  work: { samples: number; checks: number };
}

export interface ExampleDamageState {
  key: string;
  role: string;
  state: string;
  data: Record<string, unknown>;
  active: boolean;
  supported: boolean;
}

export interface ExampleDamageResult {
  status: string;
  states: ExampleDamageState[];
  events: Array<{ key: string; from: string; to: string; tick: number; cause: string }>;
  work: { steps: number; checks: number };
}

export interface ExampleRaster {
  width: number;
  height: number;
  channels: number;
  data: { length: number; [index: number]: number };
}

export interface ExampleFluidState {
  sample(x: number, z: number): { density: number } | undefined;
}

export interface ExampleWaterColumn {
  depth: number;
  level: number;
  bed: number;
  velocity: readonly number[];
}

export interface ExampleSurfaceChart {
  sample(at: readonly number[]): {
    p: ExampleVec3;
    n: ExampleVec3;
    tangent: ExampleVec3;
    du: ExampleVec3;
    dv: ExampleVec3;
  };
}

export interface ExampleAdvectedParticle {
  id: string;
  position: ExampleVec3;
  normal: ExampleVec3;
  data: Record<string, unknown>;
}

export interface ExampleLodSplat {
  id: string;
  position: ExampleVec3;
  normal: ExampleVec3;
  radius: number;
  color: readonly number[];
  opacity: number;
  owner: string;
  material: string;
  protect: boolean;
}

export interface ExampleSurfacePlane {
  [key: string]: unknown;
}

export interface ExampleContactMask {
  (x: number, y: number, z: number): number;
}

export interface ExampleToolkit {
  V: {
    norm(vector: readonly number[]): ExampleVec3;
    mad(origin: readonly number[], direction: readonly number[], distance: number): ExampleVec3;
    len(vector: readonly number[]): number;
    sub(a: readonly number[], b: readonly number[]): ExampleVec3;
    add(a: readonly number[], b: readonly number[]): ExampleVec3;
    mul(vector: readonly number[], scale: number): ExampleVec3;
    dot(a: readonly number[], b: readonly number[]): number;
    cross(a: readonly number[], b: readonly number[]): ExampleVec3;
    dist(a: readonly number[], b: readonly number[]): number;
  };
  M: {
    id(): number[];
    rot(axis: readonly number[], angle: number): number[];
    stretch(axis: readonly number[], scale: number, keep: boolean): number[];
  };
  frac(value: number): number;
  wobble(time: number, cycles?: number): number;
  hash(a: number, b?: number, c?: number): number;
  mix(a: number, b: number, t: number): number;
  tab2(
    field: (x: number, z: number) => number,
    bounds: readonly number[],
    cell: number
  ): (x: number, z: number) => number;
  grow: { dice(seed: number): () => number };
  sweep(
    sculpt: ExampleSculpt,
    points: readonly (readonly number[])[],
    profile: { w?: number | ((t: number) => number); h?: number | ((t: number) => number) },
    material: ExampleMaterial,
    options?: ExampleSolidOptions
  ): unknown;
  surface: {
    preset(
      name: string,
      base?: ExampleMaterial | readonly number[],
      overrides?: Record<string, unknown>
    ): ExampleMaterial;
    material<T extends ExampleMaterial>(base: T, settings: Record<string, unknown>): T & { surface: unknown };
  };
  tex: { noise(scale: number, octaves: number): (x: number, y: number, z: number) => number };
  sculpt(base: unknown): ExampleSculpt;
  stage(world: CLIWorld): ExampleStage;
  pool(builder: ExampleBuilder, capacity: number): unknown;
  particles(stage: ExampleStage, pool: unknown, options: { flow?: unknown; ground?: () => number }): ExampleParticles;
  flow: {
    wind(vector: readonly number[]): unknown;
    curl(scale: number, falloff: number): unknown;
    sum(...flows: unknown[]): unknown;
  };
  cloth(builder: ExampleBuilder, options: ExampleClothOptions): ExampleSystem;
  xpbd: { gust(base: readonly number[]): unknown };
  frameSplats: ExampleFrameSplats;
  morph(
    builder: ExampleBuilder,
    stage: ExampleStage,
    from: readonly number[],
    to: readonly number[],
    options: Record<string, unknown>
  ): { update(dt: number, time: number): void };
  procedural: {
    construct: {
      profile(rings: readonly (readonly (readonly number[])[])[]): ExamplePlanarProfile;
      offset(profile: ExamplePlanarProfile, distance: number): ExamplePlanarProfile;
      extrude(profile: ExamplePlanarProfile, options: { low: number; high: number }): ExampleImplicitField;
      weightedRoof(
        rings: readonly (readonly (readonly number[])[])[],
        options: { pitch?: number; pitches?: readonly (readonly number[])[] }
      ): ExampleWeightedRoof;
      loadPaths(
        nodes: ReadonlyArray<{ id: string; point: readonly number[]; bearing?: boolean }>,
        spans: ReadonlyArray<{ id: string; a: string; b: string; load?: number }>,
        options: {
          ground: (x: number, z: number) => number | null | undefined;
          clear?: (
            a: readonly number[],
            b: readonly number[],
            info: { role: string; key?: string; span?: string }
          ) => boolean;
          maxSpan?: number;
          maxDrop?: number;
          postStep?: number;
          nominalLoad?: number;
          minHeight?: number;
          braceAfter?: number;
          braceRun?: number;
          maxSamples?: number;
          maxChecks?: number;
          mergePosts?: boolean;
        }
      ): ExampleLoadResult;
      damage(
        parts: ReadonlyArray<{
          key: string;
          role?: string;
          module?: string;
          state?: string;
          data?: Record<string, unknown>;
        }>,
        options: {
          rules: ReadonlyArray<{
            id: string;
            from?: string;
            to: string;
            role?: string;
            chance?: number;
            weight?: number;
            when?: (
              part: ExampleDamageState,
              context: { tick: number; exposure: number; from: string; supported: boolean }
            ) => boolean;
          }>;
          supports?: ReadonlyArray<{ child: string; by: string[]; required?: number }>;
          pins?: ReadonlyArray<{ key: string; state?: string }>;
          seed?: number;
          steps?: number;
          exposure?: (part: ExampleDamageState) => number;
          inactive?: string[];
          failure?: string;
          maxChecks?: number;
        }
      ): ExampleDamageResult;
    };
    fields: {
      compile(
        spec: Record<string, unknown>,
        options?: { seed?: number }
      ): (x: number, y: number, z: number, time?: number) => number;
    };
    forms: {
      superquadric(options: {
        radii: readonly number[];
        exponents: readonly number[];
        pose?: { position?: readonly number[]; rotation?: readonly number[] | number };
      }): ExampleImplicitField;
    };
    materials: {
      ramp(colors: readonly number[], options?: { steps?: number; space?: string }): { hex: number[] };
      quilt(
        swatch: ExampleRaster,
        options: { width: number; height: number; patch: number; overlap: number; candidates: number; seed: number }
      ): ExampleRaster;
      synthesize(
        recipe: ExampleRaster,
        target: ExampleRaster,
        options: {
          mask: ArrayLike<number>;
          seed: number;
          guide?: number;
          cycles?: number;
          iterations?: number;
          radius?: number;
        }
      ): ExampleRaster;
      blueNoise(options: { width: number; height: number; sigma: number; seed: number }): {
        sample(x: number, y: number): number;
      };
      triplanar(pattern: (u: number, v: number) => number, options: Record<string, unknown>): unknown;
      threshold(field: unknown, options: Record<string, unknown>): unknown;
      tangent(pattern: (u: number, v: number) => number, options: Record<string, unknown>): unknown;
      outline(
        data: ArrayLike<number>,
        options: { size: readonly number[]; outer: number; inner: number }
      ): { inside: ArrayLike<number>; outside: ArrayLike<number> };
    };
    surface: {
      plane(options: {
        id: string;
        origin: readonly number[];
        u: readonly number[];
        v: readonly number[];
      }): ExampleSurfacePlane;
    };
    contacts: {
      traceSdf(
        surface: ExampleSurfacePlane,
        cover: ExampleSdf,
        options: { id: string; cell: number }
      ): Record<string, unknown>;
      runoff(
        traced: Record<string, unknown>,
        map: (point: readonly number[]) => { p: ExampleVec3; n: ExampleVec3 } | null,
        options: { spacing: number; step: number; distance: number }
      ): unknown;
      field(source: unknown): {
        mask(options: {
          inner: number;
          outer: number;
          weight?: (hit: { t: number }, point: readonly number[]) => number;
        }): ExampleContactMask;
      };
    };
    lod: {
      mergeSplats(
        samples: readonly ExampleLodSplat[],
        options: {
          maxDistance: number;
          maxRadius: number;
          minNormal: number;
          maxColor: number;
          viewDirections: readonly (readonly number[])[];
          lockSeams: boolean;
          ratio: number;
        }
      ): { splats: ExampleLodSplat[] };
      packSplats(rows: readonly ExampleLodSplat[]): { data: Float32Array; count: number };
    };
    hydrology: {
      analyze(
        height: (x: number, z: number) => number,
        options: {
          bounds: { min: readonly number[]; max: readonly number[] };
          cell: number;
          channelArea?: number;
          wetnessArea?: number;
          lakeAt?: (x: number, z: number) => { id: string; level: number } | null;
        }
      ): ExampleBasin;
    };
    routes: {
      terrain(
        start: readonly number[],
        end: readonly number[],
        options: {
          bounds: { min: readonly number[]; max: readonly number[] };
          height?: (x: number, z: number) => number;
          clearance?: (x: number, y: number, z: number) => number;
          keepOut?: (x: number, z: number) => boolean;
          cell?: number;
          sampleStep?: number;
          minClearance?: number;
          maxSlope?: number;
          maxDeviation?: number;
          slopeCost?: number;
          turnCost?: number;
        }
      ): { status: string; route: ExampleRoute };
      layout(
        route: ExampleRoute,
        options: { pitch: number; gap: number }
      ): Array<{
        frame: { point: ExampleVec3; side: ExampleVec3; normal: ExampleVec3; tangent: ExampleVec3 };
        length: number;
      }>;
      network(points: readonly (readonly number[])[], options: { loops?: number; minStretch?: number }): ExampleNetwork;
      steiner(
        points: readonly (readonly number[])[],
        edges: readonly ExampleNetworkEdge[],
        terminals: readonly number[]
      ): ExampleNetwork;
      polyline(points: readonly (readonly number[])[]): ExampleRoute & { length: number };
      travelTime(
        outlets: readonly (readonly number[])[],
        options: {
          bounds: { min: readonly number[]; max: readonly number[] };
          cell: number;
          speed: (x: number, z: number) => number;
        }
      ): {
        trace(
          start: readonly number[],
          options: { height: (x: number, z: number) => number }
        ): { status: string; route: ExampleRoute };
      };
      visibility(
        start: readonly number[],
        end: readonly number[],
        obstacles: readonly (readonly (readonly number[])[])[]
      ): { route: ExampleRoute };
      spline(
        route: ExampleRoute,
        options: {
          radius: number;
          spacing: number;
          clearance: (x: number, y: number, z: number) => number;
          minClearance: number;
        }
      ): { status: string; route: ExampleRoute };
      tensor(fields: ReadonlyArray<Record<string, unknown>>): unknown;
      growStreets(
        seeds: ReadonlyArray<{ point: readonly number[]; angle: number }>,
        options: {
          bounds: { min: readonly number[]; max: readonly number[] };
          mask: (x: number, z: number) => boolean;
          field: unknown;
          seed: number;
          branchChance: number;
          step: number;
          maxSegments: number;
          maxAge: number;
        }
      ): { edges: Array<{ route: ExampleRoute }>; points: ExampleVec3[] };
      followTensor(
        field: unknown,
        seeds: ReadonlyArray<readonly number[] | { point: readonly number[]; family?: string }>,
        options: {
          bounds: { min: readonly number[]; max: readonly number[] };
          mask: (x: number, z: number) => boolean;
          step: number;
          length: number;
        }
      ): { streets: Array<{ route: ExampleRoute; family?: string }> };
      parcels(
        site: readonly (readonly number[])[],
        options: { pitch: number; depth: number; gap: number }
      ): {
        lots: Array<{
          fragments: readonly (readonly (readonly number[])[])[];
          frontage: readonly (readonly number[])[];
        }>;
      };
    };
    sampling: {
      eliminate(
        candidates: readonly (readonly number[])[],
        options: { count: number; progressive: boolean }
      ): { points: ExampleVec2[]; levels: number[] };
      patch(options: {
        spacing: number;
        sample: (u: number, v: number) => readonly number[];
        jitter?: number;
        curvature?: number;
        seed?: number;
      }): Array<{ point: ExampleVec3 }>;
      poisson(options: {
        bounds: { min: readonly number[]; max: readonly number[] };
        radius: number;
        mask?: (point: readonly number[]) => boolean;
        seed?: number;
      }): { samples: Array<{ point: ExampleVec2 }> };
    };
    populations: {
      layout(
        regions: ReadonlyArray<{ min: readonly number[]; max: readonly number[] }>,
        evaluate: (x: number, z: number) => { density: number } | null,
        options: { spacing: number; slots?: number; seed?: number; exclusion?: { distance: number } }
      ): { instances: Array<{ point: ExampleVec3 }> };
    };
    layouts: {
      cave(options: {
        width: number;
        height: number;
        seed: number;
        steps?: number;
        openChance?: number;
        minArea?: number;
        open?: readonly (readonly number[])[];
        corridorWidth?: number;
      }): ExampleLayoutMap;
      bsp(options: {
        width: number;
        height: number;
        seed: number;
        minRoom?: number;
        corridorWidth?: number;
      }): ExampleLayoutMap;
    };
    grammar: {
      assemble(
        route: ExampleAssemblyRoute,
        modules: readonly ExampleAssemblyModule[],
        options?: {
          id?: string;
          start?: string;
          end?: string;
          pins?: ReadonlyArray<{ id: string; at: number; socket: string; in?: string; out?: string }>;
          joins?: ReadonlyArray<readonly [string, string]>;
          seed?: number;
          maxParts?: number;
          maxChecks?: number;
        }
      ): ExampleAssembly;
      rewriteGrid(
        rows: readonly string[],
        rules: ReadonlyArray<{ id: string; find: readonly string[]; replace: readonly string[]; weight?: number }>,
        options: { steps: number; seed: number }
      ): { rows: string[][] };
    };
    growth: {
      aggregate(options: {
        width: number;
        height: number;
        target: number;
        launch: number;
        seed: number;
        mask: (x: number, z: number) => boolean;
      }): { cells: ArrayLike<number> };
      grayScottGrid(options: {
        width: number;
        height: number;
        seed: number;
        steps: number;
        mask: (x: number, z: number) => boolean;
        feed: number;
        kill: number;
        initial: (point: readonly number[]) => readonly number[];
      }): { sample(x: number, z: number): { v: number } };
    };
    tiles: {
      learn(swatch: readonly string[], options: { size: number; periodic: boolean }): Record<string, unknown>;
      overlap(
        bank: Record<string, unknown>,
        options: { width: number; height: number; seed: number; pins?: Array<{ x: number; z: number; value: string }> }
      ): ExampleTilePattern;
      compile(
        tiles: ReadonlyArray<{ id: string; weight: number; sockets?: Record<string, string | null> }>
      ): ExampleTileModel;
      solve(
        model: ExampleTileModel,
        options: {
          width: number;
          height: number;
          mask: (x: number, z: number) => boolean;
          pins?: Array<{ x: number; z: number; tiles: string[] }>;
          ports?: Array<{ x: number; z: number; direction: string; socket: string | null }>;
          seed?: number;
        }
      ): { status: string; at(x: number, z: number): string | null };
    };
    geometry: {
      adaptiveSurface(
        field: ExampleSdf,
        bounds: { min: readonly number[]; max: readonly number[] },
        options: {
          minDepth?: number;
          maxDepth?: number;
          surfaceDepth?: (point: readonly number[]) => number;
          tolerance?: number;
          variation?: number;
        }
      ): ExampleAdaptiveSurface;
      surfaceNets(
        field: ExampleSdf,
        bounds: { min: readonly number[]; max: readonly number[] },
        options: { cell: number }
      ): ExampleDualSurface;
      dualContour(
        field: ExampleSdf,
        bounds: { min: readonly number[]; max: readonly number[] },
        options: { cell: number }
      ): ExampleDualSurface;
    };
    motion: {
      obstacleWake(field: ExampleSdf, options: Record<string, unknown>): ExampleWake;
      streamline(
        field: (x: number, y: number, z: number, time?: number) => ExampleVec3,
        start: readonly number[],
        options: {
          bounds: { min: readonly number[]; max: readonly number[] };
          obstacle?: ExampleSdf;
          mask?: (x: number, y: number, z: number) => boolean;
          [key: string]: unknown;
        }
      ): ExampleTrail;
      loopTrajectory(points: readonly (readonly number[])[], options: Record<string, unknown>): ExampleOrbit;
      surfaceWeather(options: {
        width: number;
        height: number;
        cell: number;
        origin: readonly [number, number];
        maxRunoff?: number;
        normal?: (x: number, z: number) => ExampleVec3;
        initial?: (x: number, z: number) => Record<string, number>;
        heatDiffusion?: number;
        wetDiffusion?: number;
      }): ExampleWeather;
      materialStateGraph(machine: ExampleStateMachine, initial: Array<{ id: string }>): ExampleMaterialStateGraph;
      stableFluid(options: {
        cell: number;
        width: number;
        height: number;
        origin: readonly number[];
        maxDt?: number;
        pressureIterations?: number;
        mask: (x: number, z: number) => boolean;
        initial: (x: number, z: number) => { density: number; velocity: readonly number[] };
      }): {
        step(
          time: number,
          options: {
            source: (x: number, z: number, time: number) => number;
            force: (x: number, z: number, time: number) => readonly number[];
            viscosity?: number;
            diffusion?: number;
            dissipation?: number;
          }
        ): ExampleFluidState;
      };
      shallowWater(options: {
        cell: number;
        width: number;
        height: number;
        origin: readonly number[];
        terrain: (x: number, z: number) => number;
        mask: (x: number, z: number) => boolean;
        initial: (x: number, z: number) => number;
      }): {
        step(
          time: number,
          options: { friction?: number }
        ): { sample(x: number, z: number): ExampleWaterColumn | undefined };
      };
      surfaceAdvection(
        chart: (time: number) => ExampleSurfaceChart,
        particles: ReadonlyArray<{ id: string; uv: readonly number[]; data: Record<string, unknown> }>,
        options: {
          step: number;
          velocity: (
            x: number,
            y: number,
            z: number,
            time: number,
            particle: { uv: readonly number[] }
          ) => readonly number[];
        }
      ): { advance(time: number): { particles: ExampleAdvectedParticle[] } };
    };
  };
  depth: { fromMap(input: ExampleDepthInput): ExampleDepthModel };
}

export type ExampleKit = Omit<InkLibrary, 'KIT' | 'makeBuilder' | 'makeSculpt'> & {
  KIT: ExampleToolkit;
  makeBuilder(seed: number, palette?: readonly number[]): ExampleBuilder;
  makeSculpt(builder: ExampleBuilder): unknown;
};
