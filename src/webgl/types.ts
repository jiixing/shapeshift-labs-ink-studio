export type Vec3 = [number, number, number];

export interface CameraInput {
  target?: Vec3;
  dist?: number;
  yaw?: number;
  pitch?: number;
  fov?: number;
  ortho?: boolean;
}

export interface CameraOptions {
  target: Vec3;
  dist: number;
  yaw: number;
  pitch: number;
  fov?: number;
  ortho?: boolean;
}

export interface Camera {
  view: Float32Array;
  projection: Float32Array;
  eye: Vec3;
  aspect: number;
  ortho: boolean;
  radius: number;
  tangent: number;
  footprint: number;
  clipNear: number;
  depthRange: [number, number];
}

export interface ToneSettings {
  preset?: string;
  cutoff?: number;
  stops?: readonly (readonly [number, string])[];
  pattern?: 'bayer' | 'blue-noise';
  amount?: number;
  seed?: number;
  preserveDots?: boolean;
}

export type ToneDefinition = string | ToneSettings;

export interface PreparedTone {
  cutoff: number;
  stops: readonly (readonly [number, string])[];
  pattern: 'bayer' | 'blue-noise';
  amount: number;
  seed: number;
  preserveDots: boolean;
  width: number;
  height: number;
  thresholds: Float32Array;
  palette: number[];
}

export interface BlueNoiseTile {
  width: number;
  height: number;
  ranks: readonly number[];
}

export type BlueNoiseFactory = (options: { seed: number }) => BlueNoiseTile;

export interface OutlineOptions {
  k?: number;
  eps?: number;
  gap?: number;
}

export interface LineOptions {
  gap?: number;
  k?: number;
  lit?: number;
}

export interface CleanOptions {
  keep?: number;
}

export interface WorldLook {
  pixel?: unknown;
  clean?: boolean | CleanOptions;
  tone?: ToneDefinition | false | null;
  outline?: boolean | OutlineOptions;
  lines?: LineOptions;
  [key: string]: unknown;
}

export interface WorldAnimation {
  bones?: Float32Array;
  boned?: readonly number[];
  zoom?: number;
  kick?: Vec3;
  grade?: number[] | null;
  bars?: number;
  [key: string]: unknown;
}

export interface WorldGlass {
  dir: Vec3;
  at: Vec3;
  r: number;
  cols: readonly number[];
  gaps?: readonly (readonly number[])[];
  mode?: string;
  steps?: number;
  floor?: number;
  k?: number;
}

export interface SplatWorld {
  data: Float32Array;
  count: number;
  pal: readonly number[];
  fine?: Float32Array;
  pix?: Float32Array;
  pats?: readonly unknown[];
  ramps?: readonly (readonly number[])[];
  rampOff?: readonly boolean[];
  cam?: CameraInput;
  radius?: number;
  detail?: number;
  dither?: number;
  look?: WorldLook;
  anim?: WorldAnimation;
  moving?: readonly number[];
  back?: readonly number[];
  grow?: { rate?: number; fade?: number; loop?: number };
  fog?: { c?: number; start?: number; max?: number };
  glass?: WorldGlass;
  outline?: false | { c?: number; edge?: number };
  refract?: number;
  ao?: { k?: number; range?: number };
  [key: string]: unknown;
}

export interface AnchorWorld {
  count: number;
  data: Float32Array;
  detail?: number;
  pix: Float32Array;
  pats?: readonly unknown[];
}

export interface PixelMaterialData {
  kinds: Float32Array;
  params: Float32Array;
  ramps: Float32Array;
  lens: Float32Array;
}

export interface EdgeSprite {
  w: number;
  h: number;
  ax: number;
  sink: number;
  cells: readonly number[];
}

export interface EdgeTable {
  any: boolean;
  per: Float32Array;
  sprites: readonly EdgeSprite[];
}

export interface AnchorPoints {
  n: number;
  data: Float32Array;
}

export interface PixelToolkit {
  gpu(world: SplatWorld): PixelMaterialData;
  prepareTone(definition: ToneDefinition | false | null | undefined, blueNoise?: BlueNoiseFactory): PreparedTone | null;
  edgeTable?(world: SplatWorld): EdgeTable | null | undefined;
  anchors?(world: AnchorWorld): AnchorPoints | null | undefined;
  anchorKeep(world: SplatWorld, footprint: number): number;
}

export interface PixelLook extends PixelToolkit {
  glsl: string;
}

export interface RenderToolkit {
  PixelLook: PixelLook;
  KIT?: {
    pixel?: PixelToolkit;
    procedural?: { materials?: { blueNoise?: BlueNoiseFactory } };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface RenderFrame {
  width?: number;
  height?: number;
  time?: number;
  bornAt?: number;
  scale?: number;
  dither?: number;
  raw?: boolean;
  colored?: boolean;
  outline?: boolean;
  clean?: boolean;
  damp?: boolean;
  edges?: boolean;
  stepAnimation?: boolean;
  lightShape?: boolean;
  lineClean?: boolean;
  tone?: ToneDefinition | false | null;
  camera?: CameraInput;
  order?: Int32Array;
  changedRows?: number[];
}
