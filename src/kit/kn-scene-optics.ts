type KnSceneOpticsVec3 = readonly [number, number, number];
type KnSceneOpticsRgb = [number, number, number];
type KnSceneOpticsColor = number | string | KnSceneOpticsVec3;

interface KnSceneOpticsReflectionPlane {
  id: string;
  at: KnSceneOpticsRgb;
  normal: KnSceneOpticsRgb;
  bias: number;
  select: KnSceneOpticsSelector | undefined;
}

type KnSceneOpticsSelector = (index: number, x: number, y: number, z: number, world: unknown) => boolean;

interface KnSceneOpticsReflectionPlaneOptions {
  id: string;
  at?: KnSceneOpticsVec3;
  normal?: KnSceneOpticsVec3;
  bias?: number;
  select?: KnSceneOpticsSelector;
}

interface KnSceneOpticsReflectionCapture {
  view: number[];
  equation: number[];
  bias: number | undefined;
}

interface KnSceneOpticsDensityField {
  bounds: { min: KnSceneOpticsVec3; max: KnSceneOpticsVec3 };
  sample(x: number, y: number, z: number, time?: number, context?: unknown): number;
  skip?(x: number, y: number, z: number, direction: KnSceneOpticsVec3, time?: number): number;
}

interface KnSceneOpticsVolumeOptions {
  density?: number;
  color?: KnSceneOpticsColor;
  near?: number;
  far?: number;
}

interface KnSceneOpticsVolumeData {
  density: number;
  color: KnSceneOpticsColor;
  near: number;
  far: number | undefined;
}

interface KnSceneOpticsFogVolume extends KnSceneOpticsVolumeData {
  type: 'fog';
  bottom: number | undefined;
  top: number | undefined;
}

interface KnSceneOpticsSphereVolume extends KnSceneOpticsVolumeData {
  type: 'sphere';
  at: KnSceneOpticsRgb;
  radius: number;
}

interface KnSceneOpticsBoxVolume extends KnSceneOpticsVolumeData {
  type: 'box';
  min: KnSceneOpticsRgb;
  max: KnSceneOpticsRgb;
}

interface KnSceneOpticsShaftVolume extends KnSceneOpticsVolumeData {
  type: 'shaft';
  from: KnSceneOpticsRgb;
  to: KnSceneOpticsRgb;
  radius: number;
}

interface KnSceneOpticsFieldVolume extends KnSceneOpticsVolumeData {
  type: 'field';
  field: KnSceneOpticsDensityField;
  min: KnSceneOpticsRgb;
  max: KnSceneOpticsRgb;
  step: number;
  lit: boolean;
  anisotropy: number;
  ramp: readonly KnSceneOpticsColor[] | undefined;
  emissive: KnSceneOpticsColor;
  emissiveGain: number;
}

type KnSceneOpticsVolume =
  | KnSceneOpticsFogVolume
  | KnSceneOpticsSphereVolume
  | KnSceneOpticsBoxVolume
  | KnSceneOpticsShaftVolume
  | KnSceneOpticsFieldVolume;

type KnSceneOpticsPreparedVolume =
  | (KnSceneOpticsFogVolume & { rgb: KnSceneOpticsRgb })
  | (KnSceneOpticsSphereVolume & { rgb: KnSceneOpticsRgb })
  | (KnSceneOpticsBoxVolume & { rgb: KnSceneOpticsRgb })
  | (KnSceneOpticsShaftVolume & { rgb: KnSceneOpticsRgb; height: number; axis: KnSceneOpticsRgb })
  | (KnSceneOpticsFieldVolume & {
      rgb: KnSceneOpticsRgb;
      ramp: KnSceneOpticsRgb[] | undefined;
      emissiveRgb: KnSceneOpticsRgb;
    });

interface KnSceneOpticsDirectionalLight {
  direction: KnSceneOpticsVec3;
  rgb: KnSceneOpticsRgb;
  intensity: number;
  distance: number;
}

interface KnSceneOpticsPointLight {
  at: KnSceneOpticsVec3;
  rgb: KnSceneOpticsRgb;
  intensity: number;
  radius: number;
}

type KnSceneOpticsShadow = (x: number, y: number, z: number, direction: KnSceneOpticsVec3, stop: number) => boolean;

interface KnSceneOpticsMedia {
  ambient: number;
  sun: KnSceneOpticsDirectionalLight | null;
  point: KnSceneOpticsPointLight | null;
  shadow: KnSceneOpticsShadow | undefined;
}

interface KnSceneOpticsLightingSettings {
  ambient?: number;
  sun?: { direction: KnSceneOpticsVec3; color?: KnSceneOpticsColor; intensity?: number; distance?: number };
  point?: { at: KnSceneOpticsVec3; color?: KnSceneOpticsColor; intensity?: number; radius?: number };
  shadow?: KnSceneOpticsShadow;
}

interface KnSceneOpticsTraceOptions {
  time?: number;
  media?: KnSceneOpticsMedia;
  maxSteps?: number;
  stepScale?: number;
  jitter?: number;
  skip?: boolean;
  [key: string]: unknown;
}

interface KnSceneOpticsHistory {
  filter<T extends ArrayLike<number> & { slice(): T }>(
    color: T,
    depth: ArrayLike<number>,
    time: number,
    key: unknown
  ): T;
  clear(): void;
}

interface KnSceneOpticsApi {
  plane(options?: KnSceneOpticsReflectionPlaneOptions): KnSceneOpticsReflectionPlane;
  planeDistance(plane: KnSceneOpticsReflectionPlane, x: number, y: number, z: number): number;
  reflectedView(matrix: readonly number[], plane: KnSceneOpticsReflectionPlane): number[];
  captureView(
    matrix: readonly number[],
    plane: KnSceneOpticsReflectionPlane,
    eye: KnSceneOpticsVec3
  ): KnSceneOpticsReflectionCapture | null;
  fog(options?: KnSceneOpticsVolumeOptions & { bottom?: number; top?: number }): KnSceneOpticsFogVolume;
  sphere(options: KnSceneOpticsVolumeOptions & { at: KnSceneOpticsVec3; radius: number }): KnSceneOpticsSphereVolume;
  box(options: KnSceneOpticsVolumeOptions & { min: KnSceneOpticsVec3; max: KnSceneOpticsVec3 }): KnSceneOpticsBoxVolume;
  shaft(
    options: KnSceneOpticsVolumeOptions & { from: KnSceneOpticsVec3; to: KnSceneOpticsVec3; radius: number }
  ): KnSceneOpticsShaftVolume;
  field(
    options: KnSceneOpticsVolumeOptions & {
      field: KnSceneOpticsDensityField;
      step?: number;
      lit?: boolean;
      anisotropy?: number;
      ramp?: readonly KnSceneOpticsColor[];
      emissive?: KnSceneOpticsColor;
      emissiveGain?: number;
    }
  ): KnSceneOpticsFieldVolume;
  prepareVolumes(volumes: readonly KnSceneOpticsVolume[], palette?: readonly number[]): KnSceneOpticsPreparedVolume[];
  trace(
    volumes: readonly KnSceneOpticsPreparedVolume[],
    origin: KnSceneOpticsVec3,
    direction: KnSceneOpticsVec3,
    stop: number,
    result?: number[],
    options?: KnSceneOpticsTraceOptions
  ): number[];
  lighting(settings: KnSceneOpticsLightingSettings | null | undefined, palette: readonly number[]): KnSceneOpticsMedia;
  occluder(
    field: (x: number, y: number, z: number) => number,
    options?: { bias?: number; step?: number; steps?: number; safety?: number }
  ): KnSceneOpticsShadow;
  volumeHistory(options?: { weight?: number; depthTolerance?: number; maxGap?: number }): KnSceneOpticsHistory;
}

interface KnSceneOpticsMirrorOptions {
  type: 'planarReflection';
  plane: KnSceneOpticsReflectionPlane;
  [key: string]: unknown;
}

interface KnSceneOpticsSurfaceSettings {
  layers: { mirror: KnSceneOpticsMirrorOptions };
  [key: string]: unknown;
}

interface KnSceneOpticsSurfaceLook {
  material<T>(base: T, settings: KnSceneOpticsSurfaceSettings): T & { surface: Record<string, unknown> };
}

interface KnSceneOpticsRippleDrop {
  at: KnSceneOpticsVec3;
  start?: number;
  repeat?: number;
  strength?: number;
}

interface KnSceneOpticsRippleFrame {
  axes: readonly [number, number, number, number, number, number];
  shape: readonly [number, number, number, number];
  drops: Float32Array;
  count: number;
}

type KnSceneOpticsRippleSampler = (
  position: KnSceneOpticsVec3,
  time?: number,
  footprint?: number,
  out?: KnSceneOpticsRgb
) => KnSceneOpticsRgb;

interface KnSceneOpticsRippleInstance {
  add(drop: KnSceneOpticsRippleDrop): number;
  remove(id: number): boolean;
  clear(): void;
  prune(time: number, reach: number): number;
  frame(time: number, storage?: Float32Array): KnSceneOpticsRippleFrame;
  readonly size: number;
  sample: KnSceneOpticsRippleSampler;
  normal: { type: 'rings'; sample: KnSceneOpticsRippleSampler };
}

interface KnSceneOpticsRippleField {
  field(options?: {
    axis?: KnSceneOpticsVec3 | 'x' | 'y' | 'z';
    cross?: KnSceneOpticsVec3 | 'x' | 'y' | 'z';
    amplitude?: number;
    scale?: number;
    speed?: number;
    width?: number;
    damping?: number;
    drops?: readonly KnSceneOpticsRippleDrop[];
    capacity?: number;
  }): KnSceneOpticsRippleInstance;
  sampleFrame(
    frame: KnSceneOpticsRippleFrame,
    position: KnSceneOpticsVec3,
    footprint?: number,
    out?: KnSceneOpticsRgb
  ): KnSceneOpticsRgb;
  glsl: string;
}

interface KnSceneOpticsReflectionApi {
  plane: KnSceneOpticsApi['plane'];
  reflectedView: KnSceneOpticsApi['reflectedView'];
  captureView: KnSceneOpticsApi['captureView'];
  material<T>(
    base: T,
    plane: KnSceneOpticsReflectionPlane,
    options?: Record<string, unknown> | null
  ): T & { surface: Record<string, unknown> };
}

interface KnSceneOpticsKitHost {
  reflection: KnSceneOpticsReflectionApi;
  ripple: Pick<KnSceneOpticsRippleField, 'field' | 'sampleFrame' | 'glsl'>;
  atmosphere: {
    fog: KnSceneOpticsApi['fog'];
    sphere: KnSceneOpticsApi['sphere'];
    box: KnSceneOpticsApi['box'];
    shaft: KnSceneOpticsApi['shaft'];
    field: KnSceneOpticsApi['field'];
    lighting: KnSceneOpticsApi['lighting'];
    occluder: KnSceneOpticsApi['occluder'];
    history: KnSceneOpticsApi['volumeHistory'];
    prepare: KnSceneOpticsApi['prepareVolumes'];
    trace: KnSceneOpticsApi['trace'];
  };
}

declare const KIT: KnSceneOpticsKitHost;
declare const SceneOptics: KnSceneOpticsApi;
declare const SurfaceLook: KnSceneOpticsSurfaceLook;
declare const RippleField: KnSceneOpticsRippleField;

(function (K: KnSceneOpticsKitHost) {
  K.reflection = {
    plane: SceneOptics.plane,
    reflectedView: SceneOptics.reflectedView,
    captureView: SceneOptics.captureView,
    material(base, plane, options) {
      return SurfaceLook.material(base, { layers: { mirror: { ...options, type: 'planarReflection', plane } } });
    }
  };
  K.ripple = { field: RippleField.field, sampleFrame: RippleField.sampleFrame, glsl: RippleField.glsl };
  K.atmosphere = {
    fog: SceneOptics.fog,
    sphere: SceneOptics.sphere,
    box: SceneOptics.box,
    shaft: SceneOptics.shaft,
    field: SceneOptics.field,
    lighting: SceneOptics.lighting,
    occluder: SceneOptics.occluder,
    history: SceneOptics.volumeHistory,
    prepare: SceneOptics.prepareVolumes,
    trace: SceneOptics.trace
  };
})(KIT);
export {};
