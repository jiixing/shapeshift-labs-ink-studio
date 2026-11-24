/* Renderer-independent travelling ripple fields. */
type RippleVector = readonly [number, number, number];
type RippleOutputVector = [number, number, number];
type RippleAxis = RippleVector | 'x' | 'y' | 'z';

interface RippleDropInput {
  at: RippleVector;
  start?: number;
  repeat?: number;
  strength?: number;
}

interface RipplePreparedDrop extends RippleDropInput {
  start: number;
  repeat: number | undefined;
  strength: number;
}

interface RippleWaveOptions {
  along: RippleVector;
  across: RippleVector;
  amplitude: number;
  scale: number;
  speed: number;
  width: number;
  damping: number;
}

type RippleSampler = (
  position: RippleVector,
  time?: number,
  footprint?: number,
  out?: RippleOutputVector
) => RippleOutputVector;

interface RippleFrame {
  axes: readonly [number, number, number, number, number, number];
  shape: readonly [number, number, number, number];
  drops: Float32Array;
  count: number;
}

interface RippleFieldOptions {
  axis?: RippleAxis;
  cross?: RippleAxis;
  amplitude?: number;
  scale?: number;
  speed?: number;
  width?: number;
  damping?: number;
  drops?: readonly RippleDropInput[];
  capacity?: number;
}

interface RippleNormal {
  type: 'rings';
  sample: RippleSampler;
}

interface RippleFieldInstance {
  add(drop: RippleDropInput): number;
  remove(id: number): boolean;
  clear(): void;
  prune(time: number, reach: number): number;
  frame(time: number, storage?: Float32Array): RippleFrame;
  readonly size: number;
  sample: RippleSampler;
  normal: RippleNormal;
}

const RippleField = (() => {
  const dot = (a: RippleVector, b: RippleVector): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const length = (v: RippleVector): number => Math.hypot(...v);
  const point = (value: unknown, name: string): RippleVector => {
    if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite))
      throw new TypeError(name + ' must be a finite XYZ vector');
    return value.slice() as unknown as RippleVector;
  };
  function unit(value: unknown, name: string): RippleVector {
    const v = point(value, name),
      size = length(v);
    if (!(size > 1e-9)) throw new RangeError(name + ' must be nonzero');
    return v.map(n => n / size) as unknown as RippleVector;
  }
  const clamp = (n: number): number => Math.max(0, Math.min(1, n));
  const smooth = (n: number): number => {
    const t = clamp(n);
    return t * t * (3 - 2 * t);
  };
  const positive = (n: number, name: string): number => {
    if (!(Number.isFinite(n) && n > 0)) throw new RangeError(name + ' must be positive');
    return n;
  };
  const nonnegative = (n: number, name: string): number => {
    if (!(Number.isFinite(n) && n >= 0)) throw new RangeError(name + ' must be nonnegative');
    return n;
  };

  const cardinal: Readonly<Record<'x' | 'y' | 'z', RippleVector>> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const axisVector = (v: RippleAxis | undefined, fallback: RippleVector): unknown =>
    typeof v === 'string' && Object.hasOwn(cardinal, v) ? cardinal[v as 'x' | 'y' | 'z'] : (v ?? fallback);
  function dropOf({ at, start = 0, repeat, strength = 1 }: RippleDropInput): RipplePreparedDrop {
    if (!Number.isFinite(start) || !Number.isFinite(strength))
      throw new TypeError('Ripple start and strength must be finite');
    if (repeat !== undefined) positive(repeat, 'Ripple repeat');
    return { at: point(at, 'Ripple source'), start, repeat, strength };
  }

  function wavefront(drop: RippleDropInput, time: number, speed: number): number {
    const age = time - (drop.start ?? 0);
    return age < 0 ? -1 : speed * (drop.repeat ? age % drop.repeat : age);
  }

  function ringFactor(radius: number, front: number, scale: number, width: number, damping: number): number {
    const travel = radius - front;
    if (radius < 1e-8 || Math.abs(travel) >= width) return 0;
    return (
      (Math.sin((2 * Math.PI * travel) / scale) *
        (1 - smooth((Math.abs(travel) / width - 0.2) / 0.8)) *
        smooth(front / (scale * 0.25)) *
        Math.exp(-damping * radius)) /
      radius
    );
  }

  function ringSampler(
    drops: () => Iterable<RippleDropInput>,
    { along, across, amplitude, scale, speed, width, damping }: RippleWaveOptions
  ): RippleSampler {
    return function sample(
      position: RippleVector,
      time = 0,
      footprint = 0,
      out: RippleOutputVector = [0, 0, 0]
    ): RippleOutputVector {
      const amp = amplitude * (1 - smooth((footprint / scale - 0.35) / 0.5));
      let dx = 0,
        dz = 0;
      if (amp) {
        const x = dot(position, along),
          y = dot(position, across);
        for (const drop of drops()) {
          const front = wavefront(drop, time, speed);
          if (front < 0) continue;
          const u = x - dot(drop.at, along),
            v = y - dot(drop.at, across);
          const k = ringFactor(Math.hypot(u, v), front, scale, width, damping) * (drop.strength ?? 1);
          dx += u * k;
          dz += v * k;
        }
      }
      for (let i = 0; i < 3; i++) out[i] = amp * (along[i] * dx + across[i] * dz);
      return out;
    };
  }
  function field({
    axis,
    cross,
    amplitude = 0.3,
    scale = 0.3,
    speed = 1,
    width = scale * 2.5,
    damping = 0.3,
    drops = [],
    capacity = 64
  }: RippleFieldOptions = {}): RippleFieldInstance {
    const along = unit(axisVector(axis, cardinal.x), 'Ripple axis');
    const across = unit(axisVector(cross, cardinal.z), 'Ripple cross axis');
    if (Math.abs(dot(along, across)) > 1e-5) throw new RangeError('Ripple axes must be perpendicular');
    nonnegative(amplitude, 'Ripple amplitude');
    nonnegative(damping, 'Ripple damping');
    positive(scale, 'Ripple wavelength');
    positive(speed, 'Ripple speed');
    positive(width, 'Ripple packet width');
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 64)
      throw new RangeError('Ripple capacity must be 1–64');
    if (!Array.isArray(drops) || drops.length > capacity) throw new TypeError('Ripple drops exceed the field capacity');
    const active = new Map<number, RipplePreparedDrop>();
    let serial = 0;
    function add(drop: RippleDropInput): number {
      if (active.size >= capacity) throw new RangeError('A ripple field can have up to ' + capacity + ' sources');
      const id = ++serial;
      active.set(id, dropOf(drop));
      return id;
    }
    drops.forEach(add);
    const sample = ringSampler(() => active.values(), { along, across, amplitude, scale, speed, width, damping });
    function prune(time: number, reach: number): number {
      if (!Number.isFinite(time)) throw new TypeError('Ripple time must be finite');
      nonnegative(reach, 'Ripple reach');
      let removed = 0;
      for (const [id, drop] of active) {
        if (!drop.repeat && (time - drop.start) * speed > reach + width) {
          active.delete(id);
          removed++;
        }
      }
      return removed;
    }
    const axes = Object.freeze([...along, ...across]) as readonly [number, number, number, number, number, number];
    const shape = Object.freeze([amplitude, scale, width, damping]) as readonly [number, number, number, number];
    function frame(time: number, storage = new Float32Array(active.size * 4)): RippleFrame {
      if (!Number.isFinite(time)) throw new TypeError('Ripple time must be finite');
      if (!amplitude || !active.size) return { axes, shape, drops: storage, count: 0 };
      let count = 0;
      for (const drop of active.values()) {
        const front = wavefront(drop, time, speed);
        if (front <= 0 || !drop.strength) continue;
        const offset = count * 4;
        if (offset + 4 > storage.length) throw new RangeError('Ripple frame storage is too small');
        storage[offset] = dot(drop.at, along);
        storage[offset + 1] = dot(drop.at, across);
        storage[offset + 2] = front;
        storage[offset + 3] = drop.strength;
        count++;
      }
      return { axes, shape, drops: storage, count };
    }
    return {
      add,
      remove: (id: number): boolean => active.delete(id),
      clear: (): void => active.clear(),
      prune,
      frame,
      get size(): number {
        return active.size;
      },
      sample,
      normal: { type: 'rings', sample }
    };
  }

  function sampleFrame(
    frame: RippleFrame,
    [x, y, z]: RippleVector,
    footprint = 0,
    out: RippleOutputVector = [0, 0, 0]
  ): RippleOutputVector {
    const { axes, shape, drops, count } = frame;
    const [ux, uy, uz, vx, vy, vz] = axes;
    const [amplitude, scale, width, damping] = shape;
    const amp = amplitude * (1 - smooth((footprint / scale - 0.35) / 0.5));
    let du = 0,
      dv = 0;
    if (amp) {
      const u = x * ux + y * uy + z * uz,
        v = x * vx + y * vy + z * vz;
      for (let i = 0; i < count * 4; i += 4) {
        const a = u - drops[i],
          b = v - drops[i + 1];
        const k = ringFactor(Math.hypot(a, b), drops[i + 2], scale, width, damping) * drops[i + 3];
        du += a * k;
        dv += b * k;
      }
    }
    out[0] = amp * (ux * du + vx * dv);
    out[1] = amp * (uy * du + vy * dv);
    out[2] = amp * (uz * du + vz * dv);
    return out;
  }

  // A frame stores each moving front once. Backends sum this kernel in tangent coordinates.
  const glsl = `
vec2 inkRippleSlope(vec2 position, vec4 drop, vec4 shape, float footprint) {
  vec2 offset = position - drop.xy;
  float radius = length(offset), travel = radius - drop.z;
  if (radius < 1e-8 || abs(travel) >= shape.z) return vec2(0.0);
  float amplitude = shape.x * (1.0 - smoothstep(0.35, 0.85, footprint / shape.y));
  float envelope = (1.0 - smoothstep(0.2, 1.0, abs(travel) / shape.z))
    * smoothstep(0.0, shape.y * 0.25, drop.z) * exp(-shape.w * radius);
  return offset * (amplitude * drop.w * sin(6.283185307179586 * travel / shape.y) * envelope / radius);
}`;

  return { field, ringSampler, sampleFrame, glsl };
})();
if (typeof module !== 'undefined') module.exports = RippleField;
