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
  sample(value: number): { point: ExampleVec3 };
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

export interface ExampleToolkit {
  V: {
    norm(vector: readonly number[]): ExampleVec3;
    mad(origin: readonly number[], direction: readonly number[], distance: number): ExampleVec3;
    len(vector: readonly number[]): number;
    sub(a: readonly number[], b: readonly number[]): ExampleVec3;
    add(a: readonly number[], b: readonly number[]): ExampleVec3;
    mul(vector: readonly number[], scale: number): ExampleVec3;
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
    };
  };
  depth: { fromMap(input: ExampleDepthInput): ExampleDepthModel };
}

export type ExampleKit = Omit<InkLibrary, 'KIT' | 'makeBuilder' | 'makeSculpt'> & {
  KIT: ExampleToolkit;
  makeBuilder(seed: number, palette?: readonly number[]): ExampleBuilder;
  makeSculpt(builder: ExampleBuilder): unknown;
};
