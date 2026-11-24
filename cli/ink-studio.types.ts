export type Vec3 = [number, number, number];
export type OptionValue = string | boolean;
export type CLIOptions = Record<string, OptionValue | undefined>;
export type Decal = number[];

export interface CLIConfig {
  out?: string;
  snaps?: string;
  paint?: string;
  load?: () => InkLibrary;
}

export interface Camera {
  target: Vec3;
  dist: number;
  pitch: number;
  yaw: number;
  sway?: number;
}

export interface CLIAnimation {
  update(dt: number, time: number): void;
  stateful?: boolean;
  poke?(eye: Vec3, direction: Vec3): void;
  bones?: Float32Array;
  rows?: Uint32Array;
  start: number;
  count: number;
  parts?: string[];
  partOf?(index: number): number;
  period?: number;
  boned?: Uint16Array;
}

export interface MeshInfo {
  tris: number;
  verts: number;
  mode: string;
  geometry?: string;
  sheet?: boolean;
  open?: number;
  mats: string[];
  hues: number;
  cell: number;
  [key: string]: unknown;
}

export interface CLIWorld {
  id: string;
  name: string;
  data: Float32Array;
  count: number;
  pal: number[];
  cam: Camera;
  detail: number;
  radius: number;
  dither: number;
  buildMs: number;
  clock: number;
  warnings?: string[];
  anim?: CLIAnimation;
  mesh?: MeshInfo;
  variant?: Record<string, number>;
  sandbox?: boolean;
  pix?: boolean;
  pixTex?: unknown[];
  pixCell?: unknown;
  pixView?: Record<string, unknown>;
  pixUnfold?: unknown;
  pixAnchors?: unknown;
  rest?: Float32Array;
  posedBuf?: Float32Array;
  [key: string]: unknown;
}

export interface SceneBuildOptions {
  controls?: Record<string, unknown>;
  snapshot?: Record<string, unknown>;
}

export interface SceneDefinition {
  id: string;
  name: string;
  seed: number;
  blurb?: string;
  build(seed: number, options?: SceneBuildOptions): CLIWorld;
  animate?(world: CLIWorld, seed: number): CLIWorld | void;
  model?(seed: number, options?: Record<string, unknown>): string;
}

export interface Image {
  w: number;
  h: number;
  rgb: Uint8Array;
  px?: number;
}

export interface RenderImage extends Image {
  px: number;
  use: Uint32Array;
  palette?: number[];
  color?: Uint8Array;
}

export interface AsciiImage extends Image {
  text: string;
  cols: number;
  rows: number;
}

export interface StableRenderOptions {
  snap?: boolean;
  dither?: OptionValue;
  resolve?: OptionValue;
}

export interface RenderOptions {
  t?: number;
  yaw?: number;
  pitch?: number;
  zoom?: number;
  target?: number[];
  w?: number;
  h?: number;
  px?: number;
  stable?: StableRenderOptions | false;
  artEffects?: OptionValue | false;
  ink?: OptionValue | false;
  tone?: OptionValue | false;
  raw?: boolean;
  colored?: boolean;
  splatOrder?: OptionValue;
  fine?: boolean;
  clean?: boolean;
  ortho?: boolean;
  surface?: false;
  reflections?: false;
  atmosphere?: false;
  volumeQuality?: {
    scale?: number;
    steps?: number;
    jitter?: OptionValue;
  };
  edges?: false;
  artHistory?: unknown;
  volumeHistory?: unknown;
  pick?: PickSurface;
  passes?: boolean | string[];
  [key: string]: unknown;
}

export interface RendererAPI {
  render(world: CLIWorld, options?: RenderOptions): RenderImage;
  upscale(image: Image, scale: number): Image;
  grid(images: Image[], columns: number, labels?: string[]): Image;
}

export interface PNGAPI {
  write(file: string, width: number, height: number, rgb: Uint8Array): void;
  read(file: string): Image;
  animate(file: string, frames: Image[], fps: number): void;
}

export interface SculptTools {
  mesh(
    mesh: unknown,
    look: unknown,
    options: Record<string, unknown>
  ): {
    field: { open: number; h: number };
  };
  bake(): void;
}

export interface CLIBuilder {
  finish(options: Record<string, unknown>): CLIWorld;
}

export interface MeshLook {
  pal: number[];
  ramps: number[][];
}

export interface DioramaProblem {
  level: string;
  [key: string]: unknown;
}

export interface DataSolid {
  kind?: string;
  asset?: string;
  [key: string]: unknown;
}

export interface DataSceneSpec {
  style?: string;
  solids?: DataSolid[];
  [key: string]: unknown;
}

export interface Toolkit {
  authoring: {
    assetSurfaces: {
      world(asset: unknown, options: Record<string, unknown>): CLIWorld;
    };
  };
  mesh: {
    fit(raw: unknown, options: Record<string, unknown>): unknown;
    look(mesh: unknown, options: Record<string, unknown>): MeshLook;
    box(mesh: unknown): { lo: Vec3; hi: Vec3 };
    info(raw: unknown): Record<string, unknown>;
  };
  sculpt(sculpt: unknown): SculptTools;
  diorama: {
    check(spec: DataSceneSpec, options: { assets: Record<string, unknown> }): DioramaProblem[];
    report(problems: DioramaProblem[]): string;
    scene(spec: DataSceneSpec, options: { assets: Record<string, unknown> }): SceneDefinition;
  };
  ramp: {
    check(palette: number[], ramp: number[]): { says: string };
    make(
      palette: number[],
      options: { base: number; n: number; dark: number; light: number }
    ): { ramp: number[]; travel: number; says: string; miss: number[] };
    hsl(color: number): [number, number, number];
  };
  ascii: {
    draw(image: Image, options: Record<string, unknown>): AsciiImage;
  };
  sandbox: {
    attach(world: CLIWorld): void;
  };
  pixel?: {
    evaluators(world: CLIWorld): unknown[];
    CELL: unknown;
    VIEW: Record<string, unknown>;
    unfold: unknown;
    anchors: unknown;
  };
  bones: {
    posed(options: { data: Float32Array; anim: CLIAnimation; posedBuf: Float32Array | undefined }): Float32Array;
  };
  atmosphere: {
    history(): unknown;
  };
  acts: {
    KINDS: string[];
    DUR: Record<string, number>;
    REACTIONS: Array<{
      id: string;
      motion: string;
      expression: string;
      label: string;
    }>;
    ACTION: { duration: Record<string, number> };
  };
  deform: {
    EMOTES: string[];
  };
  anim: {
    EASES: string[];
    CUES: Record<string, unknown>;
  };
}

export interface InkLibrary {
  KIT: Toolkit;
  SCENES: SceneDefinition[];
  makeBuilder(seed: number, palette?: number[]): CLIBuilder;
  makeSculpt(builder: CLIBuilder): unknown;
  [key: string]: unknown;
}

export interface InkIndex {
  load(): InkLibrary;
  readMesh(file: string): unknown;
  readAsset(file: string, options?: Record<string, unknown>): Promise<unknown>;
  exportGlb(source: string, options: Record<string, unknown>): unknown;
}

export interface CatalogEntry {
  id: string;
  title: string;
  what: string;
  kind: string;
  status: string;
  tags?: string[];
  use?: string;
  example?: string;
  where?: string;
  from?: string;
}

export interface Catalog {
  entries: CatalogEntry[];
}

export interface PickSurface {
  W: number;
  H: number;
  win: Int32Array;
  PIX: Float32Array;
  X: Float32Array;
  Y: Float32Array;
  Z: Float32Array;
}

export interface PaintMetadata {
  id: string;
  w: number;
  h: number;
  t: number;
  detail: number;
  pal: string[];
}

export type Command = (world?: CLIWorld) => void | Promise<void>;
export type Commands = Record<string, Command>;

declare global {
  var INK_FOCUS:
    | {
        p: Vec3;
        near?: number;
        far?: number;
        coarse?: number;
      }
    | undefined;
  var INK_FOLLOW:
    | {
        stretch?: number;
        broad?: number;
      }
    | undefined;
  var INK_BOUNCE: boolean | undefined;
  var INK_FINE: boolean | undefined;
  var INK_DECAL_NEXT: Decal[] | null | undefined;
  var INK_PAINT: Record<string, Decal[] | undefined> | undefined;
  var INK_RAMPS: Map<number[], number> | undefined;
}
