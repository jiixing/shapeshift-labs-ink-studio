/* Core scene optics descriptors and samplers shared by browser hosts and the CLI. */
type OpticsVector = readonly [number, number, number];
type OpticsRgb = [number, number, number];
type OpticsInterval = [number, number];
type OpticsColor = number | string | OpticsVector;
type OpticsPalette = readonly number[];
type OpticsDensityFunction = (x: number, y: number, z: number) => number;
type OpticsShadow = (x: number, y: number, z: number, direction: OpticsVector, stop: number) => boolean;
type OpticsSelector = (index: number, x: number, y: number, z: number, world: unknown) => boolean;

interface OpticsReflectionPlaneDescriptor {
  at: OpticsVector;
  normal: OpticsVector;
  bias?: number;
}

interface OpticsReflectionCapture {
  view: number[];
  equation: number[];
  bias: number | undefined;
}

interface OpticsReflectionPlaneApi {
  planeDistance(plane: OpticsReflectionPlaneDescriptor, x: number, y: number, z: number): number;
  reflectedView(matrix: readonly number[], plane: OpticsReflectionPlaneDescriptor): number[];
  captureView(
    matrix: readonly number[],
    plane: OpticsReflectionPlaneDescriptor,
    eye: OpticsVector
  ): OpticsReflectionCapture | null;
}

interface OpticsReflectionPlaneOptions {
  id: string;
  at?: OpticsVector;
  normal?: OpticsVector;
  bias?: number;
  select?: OpticsSelector;
}

interface OpticsReflectionPlane extends OpticsReflectionPlaneDescriptor {
  id: string;
  bias: number;
  select: OpticsSelector | undefined;
}

interface OpticsDensityBounds {
  min: OpticsVector;
  max: OpticsVector;
}

interface OpticsDensityField {
  bounds: OpticsDensityBounds;
  sample(x: number, y: number, z: number, time?: number, context?: unknown): number;
  skip?(x: number, y: number, z: number, direction: OpticsVector, time?: number): number;
}

interface OpticsVolumeFieldApi {
  bounds(value?: OpticsDensityBounds | null): { min: OpticsRgb; max: OpticsRgb };
}

interface OpticsRippleDrop {
  at: OpticsVector;
  start?: number;
  repeat?: number;
  strength?: number;
}

interface OpticsRippleSamplerOptions {
  along: OpticsVector;
  across: OpticsVector;
  amplitude: number;
  scale: number;
  speed: number;
  width: number;
  damping: number;
}

type OpticsRippleSampler = (position: OpticsVector, time?: number, footprint?: number, out?: OpticsRgb) => OpticsRgb;

interface OpticsRippleFieldOptions {
  axis?: OpticsVector | 'x' | 'y' | 'z';
  cross?: OpticsVector | 'x' | 'y' | 'z';
  amplitude?: number;
  scale?: number;
  speed?: number;
  width?: number;
  damping?: number;
  drops?: readonly OpticsRippleDrop[];
  capacity?: number;
}

interface OpticsRippleFrame {
  axes: readonly [number, number, number, number, number, number];
  shape: readonly [number, number, number, number];
  drops: Float32Array;
  count: number;
}

interface OpticsRippleFieldInstance {
  add(drop: OpticsRippleDrop): number;
  remove(id: number): boolean;
  clear(): void;
  prune(time: number, reach: number): number;
  frame(time: number, storage?: Float32Array): OpticsRippleFrame;
  readonly size: number;
  sample: OpticsRippleSampler;
  normal: { type: 'rings'; sample: OpticsRippleSampler };
}

interface OpticsRippleFieldApi {
  field(options?: OpticsRippleFieldOptions): OpticsRippleFieldInstance;
  ringSampler(drops: () => Iterable<OpticsRippleDrop>, options: OpticsRippleSamplerOptions): OpticsRippleSampler;
}

interface OpticsDirectionalLight {
  direction: OpticsVector;
  rgb: OpticsRgb;
  intensity: number;
  distance: number;
}

interface OpticsPointLight {
  at: OpticsVector;
  rgb: OpticsRgb;
  intensity: number;
  radius: number;
}

interface OpticsLightingSettings {
  ambient?: number;
  sun?: {
    direction: OpticsVector;
    color?: OpticsColor;
    intensity?: number;
    distance?: number;
  };
  point?: {
    at: OpticsVector;
    color?: OpticsColor;
    intensity?: number;
    radius?: number;
  };
  shadow?: OpticsShadow;
}

interface OpticsMedia {
  ambient: number;
  sun: OpticsDirectionalLight | null;
  point: OpticsPointLight | null;
  shadow: OpticsShadow | undefined;
}

interface OpticsTraceOptions {
  time?: number;
  media?: OpticsMedia;
  maxSteps?: number;
  stepScale?: number;
  jitter?: number;
  skip?: boolean;
  [key: string]: unknown;
}

interface OpticsHistoryOptions {
  weight?: number;
  depthTolerance?: number;
  maxGap?: number;
}

interface OpticsHistory {
  filter<T extends ArrayLike<number> & { slice(): T }>(
    color: T,
    depth: ArrayLike<number>,
    time: number,
    key: unknown
  ): T;
  clear(): void;
}

interface OpticsVolumeLightApi {
  lighting(
    settings: OpticsLightingSettings | null | undefined,
    color: (value: OpticsColor, palette: OpticsPalette) => OpticsRgb,
    palette: OpticsPalette
  ): OpticsMedia;
  occluder(
    field: OpticsDensityFunction,
    options?: { bias?: number; step?: number; steps?: number; safety?: number }
  ): OpticsShadow;
  integrate(
    segments: readonly OpticsVolumeHit[],
    origin: OpticsVector,
    direction: OpticsVector,
    stop: number,
    result: number[],
    options?: OpticsTraceOptions
  ): number[];
  history(options?: OpticsHistoryOptions): OpticsHistory;
}

interface OpticsVolumeOptions {
  density?: number;
  color?: OpticsColor;
  near?: number;
  far?: number;
}

interface OpticsVolumeData {
  density: number;
  color: OpticsColor;
  near: number;
  far: number | undefined;
}

interface OpticsDerivedVolumeData {
  rgb?: OpticsRgb;
  height?: number;
  axis?: OpticsRgb;
  emissiveRgb?: OpticsRgb;
}

interface OpticsFogOptions extends OpticsVolumeOptions {
  bottom?: number;
  top?: number;
}

interface OpticsFogVolume extends OpticsVolumeData, OpticsDerivedVolumeData {
  type: 'fog';
  bottom: number | undefined;
  top: number | undefined;
}

interface OpticsSphereOptions extends OpticsVolumeOptions {
  at: OpticsVector;
  radius: number;
}

interface OpticsSphereVolume extends OpticsVolumeData, OpticsDerivedVolumeData {
  type: 'sphere';
  at: OpticsRgb;
  radius: number;
}

interface OpticsBoxOptions extends OpticsVolumeOptions {
  min: OpticsVector;
  max: OpticsVector;
}

interface OpticsBoxVolume extends OpticsVolumeData, OpticsDerivedVolumeData {
  type: 'box';
  min: OpticsRgb;
  max: OpticsRgb;
}

interface OpticsShaftOptions extends OpticsVolumeOptions {
  from: OpticsVector;
  to: OpticsVector;
  radius: number;
}

interface OpticsShaftVolume extends OpticsVolumeData, OpticsDerivedVolumeData {
  type: 'shaft';
  from: OpticsRgb;
  to: OpticsRgb;
  radius: number;
}

interface OpticsFieldOptions extends OpticsVolumeOptions {
  field: OpticsDensityField;
  step?: number;
  lit?: boolean;
  anisotropy?: number;
  ramp?: readonly OpticsColor[];
  emissive?: OpticsColor;
  emissiveGain?: number;
}

interface OpticsFieldVolume extends OpticsVolumeData, OpticsDerivedVolumeData {
  type: 'field';
  field: OpticsDensityField;
  min: OpticsRgb;
  max: OpticsRgb;
  step: number;
  lit: boolean;
  anisotropy: number;
  ramp: readonly OpticsColor[] | undefined;
  emissive: OpticsColor;
  emissiveGain: number;
}

type OpticsVolumeDefinition =
  OpticsFogVolume | OpticsSphereVolume | OpticsBoxVolume | OpticsShaftVolume | OpticsFieldVolume;

interface OpticsPreparedFog extends OpticsFogVolume {
  rgb: OpticsRgb;
}

interface OpticsPreparedSphere extends OpticsSphereVolume {
  rgb: OpticsRgb;
}

interface OpticsPreparedBox extends OpticsBoxVolume {
  rgb: OpticsRgb;
}

interface OpticsPreparedShaft extends OpticsShaftVolume {
  rgb: OpticsRgb;
  height: number;
  axis: OpticsRgb;
}

interface OpticsPreparedField extends OpticsFieldVolume {
  rgb: OpticsRgb;
  ramp: OpticsRgb[] | undefined;
  emissiveRgb: OpticsRgb;
}

type OpticsPreparedVolume =
  OpticsPreparedFog | OpticsPreparedSphere | OpticsPreparedBox | OpticsPreparedShaft | OpticsPreparedField;
type OpticsVolumeHit = readonly [number, OpticsPreparedVolume, 1 | -1];

declare const ReflectionPlane: OpticsReflectionPlaneApi;
declare const RippleField: OpticsRippleFieldApi;
declare const VolumeField: OpticsVolumeFieldApi;
declare const VolumeLight: OpticsVolumeLightApi;

const SceneOptics = (() => {
  const reflection =
    typeof ReflectionPlane === 'undefined'
      ? (require('./reflection-plane.js') as OpticsReflectionPlaneApi)
      : ReflectionPlane;
  const { planeDistance, reflectedView, captureView } = reflection;
  const ripples =
    typeof RippleField === 'undefined' ? (require('./ripple-field.js') as OpticsRippleFieldApi) : RippleField;
  const { field: ripple, ringSampler } = ripples;
  const densities =
    typeof VolumeField === 'undefined' ? (require('./volume-field.js') as OpticsVolumeFieldApi) : VolumeField;
  const volumeLight =
    typeof VolumeLight === 'undefined' ? (require('./volume-light.js') as OpticsVolumeLightApi) : VolumeLight;
  const dot = (a: OpticsVector, b: OpticsVector): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const sub = (a: OpticsVector, b: OpticsVector): OpticsRgb => a.map((v, i) => v - b[i]) as OpticsRgb;
  const length = (v: readonly number[]): number => Math.hypot(...v);
  const point = (value: unknown, name: string): OpticsRgb => {
    if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite))
      throw new TypeError(name + ' must be a finite XYZ vector');
    return (value as number[]).slice() as OpticsRgb;
  };
  function unit(value: unknown, name: string): OpticsRgb {
    const v = point(value, name),
      size = length(v);
    if (!(size > 1e-9)) throw new RangeError(name + ' must be nonzero');
    return v.map(n => n / size) as OpticsRgb;
  }
  const positive = (n: number, name: string): number => {
    if (!(Number.isFinite(n) && n > 0)) throw new RangeError(name + ' must be positive');
    return n;
  };
  const nonnegative = (n: number, name: string): number => {
    if (!(Number.isFinite(n) && n >= 0)) throw new RangeError(name + ' must be nonnegative');
    return n;
  };

  function plane(
    {
      id,
      at = [0, 0, 0],
      normal = [0, 1, 0],
      bias = 0.001,
      select
    }: OpticsReflectionPlaneOptions = {} as OpticsReflectionPlaneOptions
  ): OpticsReflectionPlane {
    if (typeof id !== 'string' || !id.trim()) throw new TypeError('A reflection plane needs an ID');
    if (select !== undefined && typeof select !== 'function')
      throw new TypeError('Reflection selection must be a function');
    return {
      id,
      at: point(at, 'Reflection origin'),
      normal: unit(normal, 'Reflection normal'),
      bias: nonnegative(bias, 'Reflection bias'),
      select
    };
  }

  function volumeColor(value: OpticsColor, palette: OpticsPalette): OpticsRgb {
    if (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) value = parseInt(value.slice(1), 16);
    else if (Number.isInteger(value)) value = palette[value as number];
    else if (Array.isArray(value))
      return point(value, 'Volume colour').map(n => Math.max(0, Math.min(1, n))) as OpticsRgb;
    if (!Number.isInteger(value))
      throw new TypeError('Volume colour must be a palette index, hex colour or RGB triple');
    return [
      (((value as number) >> 16) & 255) / 255,
      (((value as number) >> 8) & 255) / 255,
      ((value as number) & 255) / 255
    ];
  }

  const common = ({ density = 0.2, color = '#99b1c4', near = 0, far }: OpticsVolumeOptions = {}): OpticsVolumeData => {
    nonnegative(near, 'Volume near distance');
    if (far !== undefined && (!Number.isFinite(far) || far <= near))
      throw new RangeError('Volume far distance must exceed near');
    return { density: nonnegative(density, 'Volume density'), color, near, far };
  };
  function fog(options: OpticsFogOptions = {}): OpticsFogVolume {
    const { bottom, top } = options;
    if (
      (bottom !== undefined && !Number.isFinite(bottom)) ||
      (top !== undefined && !Number.isFinite(top)) ||
      (bottom !== undefined && top !== undefined && bottom >= top)
    )
      throw new RangeError('Invalid height-fog range');
    return { type: 'fog', ...common(options), bottom, top };
  }
  function sphere(options: OpticsSphereOptions): OpticsSphereVolume {
    return {
      type: 'sphere',
      ...common(options),
      at: point(options.at, 'Mist centre'),
      radius: positive(options.radius, 'Mist radius')
    };
  }
  function box(options: OpticsBoxOptions): OpticsBoxVolume {
    const min = point(options.min, 'Volume minimum'),
      max = point(options.max, 'Volume maximum');
    if (min.some((n, i) => n >= max[i])) throw new RangeError('Volume bounds must have positive extent');
    return { type: 'box', ...common(options), min, max };
  }
  function shaft(options: OpticsShaftOptions): OpticsShaftVolume {
    const from = point(options.from, 'Shaft start'),
      to = point(options.to, 'Shaft end');
    unit(sub(to, from), 'Shaft direction');
    return { type: 'shaft', ...common(options), from, to, radius: positive(options.radius, 'Shaft radius') };
  }

  function field(options: OpticsFieldOptions = {} as OpticsFieldOptions): OpticsFieldVolume {
    const { field, step = 0.16, lit = true, anisotropy = 0.15, ramp, emissive = '#000000', emissiveGain = 0 } = options;
    if (typeof field?.sample !== 'function') throw new TypeError('Expected a bounded density field');
    const { min, max } = densities.bounds(field.bounds);
    if (
      !Number.isFinite(step) ||
      step <= 0 ||
      step > 100 ||
      typeof lit !== 'boolean' ||
      !Number.isFinite(anisotropy) ||
      Math.abs(anisotropy) > 0.85 ||
      !Number.isFinite(emissiveGain) ||
      emissiveGain < 0 ||
      emissiveGain > 64 ||
      (ramp !== undefined && (!Array.isArray(ramp) || !ramp.length || ramp.length > 32))
    )
      throw new RangeError('Invalid density march or optical settings');
    return { type: 'field', ...common(options), field, min, max, step, lit, anisotropy, ramp, emissive, emissiveGain };
  }

  const volumeKinds = { fog, sphere, box, shaft, field };
  function prepareVolumes(
    list: readonly OpticsVolumeDefinition[],
    palette: OpticsPalette = []
  ): OpticsPreparedVolume[] {
    if (!Array.isArray(list)) throw new TypeError('Atmosphere must be a list of volumes');
    return list
      .map((d: OpticsVolumeDefinition) => {
        if (!d || !Object.hasOwn(volumeKinds, d.type)) throw new TypeError('Unknown atmosphere volume');
        const volume = (volumeKinds[d.type] as (options: OpticsVolumeDefinition) => OpticsVolumeDefinition)(d);
        volume.rgb = volumeColor(volume.color, palette);
        if (volume.type === 'field') {
          volume.ramp = volume.ramp?.map(color => volumeColor(color, palette));
          volume.emissiveRgb = volumeColor(volume.emissive, palette);
        }
        if (volume.type === 'shaft') {
          const span = sub(volume.to, volume.from);
          volume.height = length(span);
          volume.axis = span.map(n => n / volume.height!) as OpticsRgb;
        }
        return volume as OpticsPreparedVolume;
      })
      .filter(d => d.density > 0);
  }

  // Intersect one slab of a ray with a [min,max] interval along an axis.
  function slab(range: OpticsInterval, position: number, direction: number, low: number, high: number): boolean {
    if (Math.abs(direction) < 1e-10) return position > low && position < high;
    const a = (low - position) / direction,
      b = (high - position) / direction;
    range[0] = Math.max(range[0], Math.min(a, b));
    range[1] = Math.min(range[1], Math.max(a, b));
    return range[1] > range[0];
  }
  function radial(range: OpticsInterval, a: number, b: number, c: number): boolean {
    if (a < 1e-10) return c < 0;
    const d = b * b - a * c;
    if (d <= 0) return false;
    const width = Math.sqrt(d);
    range[0] = Math.max(range[0], (-b - width) / a);
    range[1] = Math.min(range[1], (-b + width) / a);
    return range[1] > range[0];
  }

  function interval(
    volume: OpticsPreparedVolume,
    from: OpticsVector,
    dir: OpticsVector,
    stop: number
  ): OpticsInterval | null {
    const range: OpticsInterval = [volume.near, Math.min(stop, volume.far ?? stop)];
    if (range[1] <= range[0]) return null;
    switch (volume.type) {
      case 'fog':
        return slab(range, from[1], dir[1], volume.bottom ?? -Infinity, volume.top ?? Infinity) ? range : null;
      case 'box':
      case 'field':
        return [0, 1, 2].every(i => slab(range, from[i], dir[i], volume.min[i], volume.max[i])) ? range : null;
      case 'sphere': {
        const delta = sub(from, volume.at);
        return radial(range, 1, dot(delta, dir), dot(delta, delta) - volume.radius ** 2) ? range : null;
      }
      case 'shaft': {
        const delta = sub(from, volume.from);
        const p = dot(delta, volume.axis),
          d = dot(dir, volume.axis);
        if (!slab(range, p, d, 0, volume.height)) return null;
        return radial(range, 1 - d * d, dot(delta, dir) - p * d, dot(delta, delta) - p * p - volume.radius ** 2)
          ? range
          : null;
      }
    }
  }

  // Integrate overlapping constant-density media in front-to-back depth order.
  function trace(
    volumes: readonly OpticsPreparedVolume[],
    origin: OpticsVector,
    direction: OpticsVector,
    stop: number,
    result: number[] = [0, 0, 0, 1],
    options?: OpticsTraceOptions
  ): number[] {
    const hits: OpticsVolumeHit[] = [];
    for (const volume of volumes) {
      const range = interval(volume, origin, direction, stop);
      if (range) hits.push([range[0], volume, 1], [range[1], volume, -1]);
    }
    hits.sort((a, b) => a[0] - b[0]);
    if (hits.some(([, volume]) => volume.type === 'field'))
      return volumeLight.integrate(hits, origin, direction, stop, result, options);
    result[0] = result[1] = result[2] = 0;
    result[3] = 1;
    const rgb = [0, 0, 0];
    let density = 0,
      last = 0;
    for (const [t, volume, sign] of hits) {
      if (density > 1e-10 && t > last) {
        const alpha = -Math.expm1(-density * (t - last));
        for (let i = 0; i < 3; i++) result[i] += (result[3] * alpha * rgb[i]) / density;
        result[3] *= 1 - alpha;
      }
      density += volume.density * sign;
      for (let i = 0; i < 3; i++) rgb[i] += volume.rgb[i] * volume.density * sign;
      last = t;
    }
    return result;
  }

  return {
    plane,
    planeDistance,
    reflectedView,
    captureView,
    fog,
    sphere,
    box,
    shaft,
    field,
    prepareVolumes,
    trace,
    lighting: (settings: OpticsLightingSettings | null | undefined, palette: OpticsPalette) =>
      volumeLight.lighting(settings, volumeColor, palette),
    occluder: volumeLight.occluder,
    volumeHistory: volumeLight.history,
    ripple,
    ringSampler
  };
})();
if (typeof module !== 'undefined') module.exports = SceneOptics;
