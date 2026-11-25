/* Ordered material intervals in one coordinate axis. Geometry and renderers may
   share this selector; materials/patterns are JSON descriptors, not game assets. */
type P16MaterialBandsVec3 = [number, number, number];

interface P16MaterialBandsDescriptorInput {
  material: string;
  pattern?: string;
  id?: string;
  [key: string]: unknown;
}

interface P16MaterialBandsDescriptor {
  material: string;
  pattern: string;
  id?: string;
  [key: string]: unknown;
}

interface P16MaterialBandsLayerInput extends P16MaterialBandsDescriptorInput {
  min: number;
  max: number;
}

interface P16MaterialBandsLayer extends P16MaterialBandsDescriptor {
  min: number;
  max: number;
}

interface P16MaterialBandsSpec {
  layers: readonly P16MaterialBandsLayerInput[];
  axis?: number;
  direction?: P16MaterialBandsVec3;
  origin?: P16MaterialBandsVec3;
  period?: number;
  fallback: P16MaterialBandsDescriptorInput;
}

type P16MaterialBandsSegment = Readonly<P16MaterialBandsDescriptor & { min: number; max: number }>;

interface P16MaterialBandsSelector {
  axis: number | null;
  period: number | undefined;
  layers: readonly P16MaterialBandsLayer[];
  fallback: Readonly<P16MaterialBandsDescriptor>;
  at(point: number | readonly number[]): Readonly<P16MaterialBandsDescriptor>;
  atXYZ(x: number, y: number, z: number): Readonly<P16MaterialBandsDescriptor>;
  segments(min: number, max: number): readonly P16MaterialBandsSegment[];
}

type P16MaterialBandsFactory = (spec: P16MaterialBandsSpec) => Readonly<P16MaterialBandsSelector>;

interface P16MaterialBandsData {
  clone<T>(value: T): T;
  freeze<T>(value: T): Readonly<T>;
}

interface P16MaterialBandsPeriodicCoordinates {
  wrap(value: number, period: number): number;
}

interface P16MaterialBandsApi {
  data: P16MaterialBandsData;
  periodicCoordinates: P16MaterialBandsPeriodicCoordinates;
  materialBands: P16MaterialBandsFactory;
}

interface P16MaterialBandsKitHost {
  procedural: P16MaterialBandsApi;
  authoring: P16MaterialBandsApi;
}

declare const KIT: P16MaterialBandsKitHost;

(function (K: P16MaterialBandsKitHost) {
  const A = K.procedural || K.authoring,
    { clone, freeze } = A.data,
    name = (s: unknown): s is string =>
      typeof s === 'string' && s.length > 0 && !['__proto__', 'prototype', 'constructor'].includes(s);
  const triplet = (v: unknown): v is P16MaterialBandsVec3 =>
    Array.isArray(v) && v.length === 3 && Array.from(v).every(Number.isFinite);
  A.materialBands = (spec: P16MaterialBandsSpec): Readonly<P16MaterialBandsSelector> => {
    if (
      !spec ||
      typeof spec !== 'object' ||
      !Array.isArray(spec.layers) ||
      spec.layers.length > 128 ||
      !Number.isInteger(spec.axis ?? 1) ||
      (spec.axis ?? 1) < 0 ||
      (spec.axis ?? 1) > 2
    )
      throw new Error('Material bands need an axis and at most 128 intervals');
    const { direction, origin = [0, 0, 0], period } = spec;
    if (period !== undefined && (!Number.isFinite(period) || period <= 0 || period > 1e6))
      throw new Error('Material intervals need a positive period within 1e6');
    if (!triplet(origin) || (direction !== undefined && (spec.axis !== undefined || !triplet(direction))))
      throw new Error('Material bands need a finite origin and one axis or direction');
    const length = direction ? Math.hypot(...direction) : 1;
    if (!Number.isFinite(length) || length < 1e-10) throw new Error('Material band direction must be nonzero');
    const axis = direction ? null : (spec.axis ?? 1);
    const normal: P16MaterialBandsVec3 = direction
      ? (direction.map(v => v / length) as P16MaterialBandsVec3)
      : ([0, 1, 2].map(i => Number(i === axis)) as P16MaterialBandsVec3);
    const originOffset = normal.reduce((n, v, i) => n + v * origin[i], 0);
    const { wrap }: Partial<P16MaterialBandsPeriodicCoordinates> = period === undefined ? {} : A.periodicCoordinates;
    const descriptor = <T extends P16MaterialBandsDescriptorInput>(raw: T): T & { pattern: string } => {
        const d = clone(raw);
        if (d && d.pattern === undefined) d.pattern = 'flat';
        if (!d || !name(d.material) || !name(d.pattern) || (d.id !== undefined && !name(d.id)))
          throw new Error('Material bands need named material/pattern descriptors');
        return d as T & { pattern: string };
      },
      fallback = freeze(descriptor(spec.fallback));
    const layers: readonly P16MaterialBandsLayer[] = spec.layers
      .map((raw: P16MaterialBandsLayerInput, i: number) => {
        const d = descriptor(raw);
        if (
          !Number.isFinite(d.min) ||
          !Number.isFinite(d.max) ||
          d.min >= d.max ||
          Math.abs(d.min) > 1e6 ||
          Math.abs(d.max) > 1e6
        )
          throw new Error('Material intervals need finite ordered bounds within 1e6');
        if (period !== undefined && (d.min < 0 || d.max > period))
          throw new Error('Periodic material intervals must lie within one period');
        d.id = d.id === undefined ? 'band-' + i : d.id;
        if (!name(d.id)) throw new Error('Material interval needs a valid id');
        return freeze(d);
      })
      .sort((a, b) => a.min - b.min);
    if (new Set(layers.map(d => d.id)).size !== layers.length || layers.some((d, i) => i && d.min < layers[i - 1].max))
      throw new Error('Material intervals must not overlap or repeat ids');
    function lookup(value: number): Readonly<P16MaterialBandsDescriptor> {
      if (!Number.isFinite(value)) throw new Error('Material lookup needs a finite coordinate');
      if (period !== undefined) value = wrap!(value, period);
      let low = 0,
        high = layers.length;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (value < layers[mid].min) high = mid;
        else if (value >= layers[mid].max) low = mid + 1;
        else return layers[mid];
      }
      return fallback;
    }
    function atXYZ(x: number, y: number, z: number): Readonly<P16MaterialBandsDescriptor> {
      return lookup(normal[0] * x + normal[1] * y + normal[2] * z - originOffset);
    }
    function at(point: number | readonly number[]): Readonly<P16MaterialBandsDescriptor> {
      if (typeof point === 'number') return lookup(point);
      if (axis !== null) return lookup(point?.[axis] - originOffset);
      return atXYZ(point?.[0], point?.[1], point?.[2]);
    }
    const edges: number[] = [
      ...new Set(layers.flatMap(d => [d.min, d.max]).map(n => (period === undefined ? n : wrap!(n, period))))
    ];
    function segments(min: number, max: number): readonly P16MaterialBandsSegment[] {
      if (!Number.isFinite(min) || !Number.isFinite(max) || min > max)
        throw new Error('Material segment range must be finite and ordered');
      const cuts = [min, max];
      if (period === undefined) {
        for (const edge of edges) if (edge > min && edge < max) cuts.push(edge);
      } else if (min < max && edges.length) {
        const cycles = Math.ceil((max - min) / period);
        if (cycles * edges.length > 4096 || min + period === min || max - period === max)
          throw new RangeError('Periodic material segments exceed the subdivision budget');
        const phase = wrap!(min, period);
        for (const edge of edges) {
          const start = edge > phase ? edge - phase : period + edge - phase;
          for (let i = 0; i <= cycles; i++) {
            const cut = min + start + i * period;
            if (cut >= max) break;
            if (cut > min) cuts.push(cut);
          }
        }
      }
      cuts.sort((a, b) => a - b);
      const out: P16MaterialBandsSegment[] = [];
      for (let i = 0; i + 1 < cuts.length; i++) {
        const lo = cuts[i],
          hi = cuts[i + 1];
        if (hi > lo) out.push(freeze({ ...lookup(lo + (hi - lo) * 0.5), min: lo, max: hi }));
      }
      return freeze(out);
    }
    return Object.freeze({ axis, period, layers: freeze(layers), fallback, at, atXYZ, segments });
  };
})(KIT);

export {};
