/* A planar level masked into an existing height carrier. The bed and inside
   bank are one continuous cut; the retained source is never raised or mutated.
   Water is a consumer, not a requirement of the operation. */
type P11BasinCarrierVec3 = [number, number, number];

interface P11BasinCarrierBounds {
  min: P11BasinCarrierVec3;
  max: P11BasinCarrierVec3;
}

interface P11BasinCarrierParameters {
  level: number;
  depth: number;
  shore: number;
}

interface P11BasinCarrierBase {
  height(x: number, z: number): number;
  normal(x: number, z: number): P11BasinCarrierVec3;
  inside(x: number, z: number): boolean;
  bounds: P11BasinCarrierBounds;
  slopeBound?: number;
}

interface P11BasinCarrierSample {
  height: number;
  raw: number;
  distance: number;
  wet: boolean;
  affected: boolean;
}

interface P11BasinCarrierSurface {
  base: P11BasinCarrierBase;
  parameters: Readonly<P11BasinCarrierParameters>;
  height(x: number, z: number): number;
  normal(x: number, z: number): P11BasinCarrierVec3;
  sample(x: number, z: number): P11BasinCarrierSample;
  inside(x: number, z: number): boolean;
  slopeBound: number;
  distanceScale(): number;
  minimumDistanceScale: number;
  bounds: P11BasinCarrierBounds;
}

interface P11BasinCarrierData {
  clone<T>(value: T): T;
  freeze<T>(value: T): Readonly<T>;
}

interface P11BasinCarrierNamespace {
  data: P11BasinCarrierData;
  basins?: {
    parameters(raw?: unknown): Readonly<P11BasinCarrierParameters>;
    surface(base: P11BasinCarrierBase, mask: (x: number, z: number) => number, raw?: unknown): P11BasinCarrierSurface;
  };
}

interface P11BasinCarrierVectorApi {
  norm(v: readonly number[]): P11BasinCarrierVec3;
}

interface P11BasinCarrierKitHost {
  procedural: P11BasinCarrierNamespace;
  V: P11BasinCarrierVectorApi;
}

declare const KIT: P11BasinCarrierKitHost;

(function (K: P11BasinCarrierKitHost) {
  const A = K.procedural,
    V = K.V,
    clamp = (x: number) => Math.max(0, Math.min(1, x)),
    smooth = (x: number) => {
      x = clamp(x);
      return x * x * (3 - 2 * x);
    };
  function parameters(raw: unknown = {}): Readonly<P11BasinCarrierParameters> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Basins need configuration');
    const p = Object.assign({ level: -0.18, depth: 0.55, shore: 0.45 }, A.data.clone(raw));
    if (
      !(['level', 'depth', 'shore'] as const).every(k => Number.isFinite(p[k])) ||
      Math.abs(p.level) > 24 ||
      p.depth < 0.05 ||
      p.depth > 12 ||
      p.shore < 0.08 ||
      p.shore > 8
    )
      throw new Error('Basins need a finite level, depth .05..12 and shore .08..8');
    return A.data.freeze(p);
  }
  function surface(
    base: P11BasinCarrierBase,
    mask: (x: number, z: number) => number,
    raw?: unknown
  ): P11BasinCarrierSurface {
    const p = parameters(raw);
    if (
      !base ||
      typeof base.height !== 'function' ||
      typeof base.normal !== 'function' ||
      typeof base.inside !== 'function' ||
      ![base.bounds?.min, base.bounds?.max].every(
        v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)
      ) ||
      base.bounds.min.some((v, i) => v > base.bounds.max[i]) ||
      (base.slopeBound !== undefined && (!Number.isFinite(base.slopeBound) || base.slopeBound < 0)) ||
      typeof mask !== 'function'
    )
      throw new Error('Basins need a bounded height carrier and signed mask distance');
    function sample(x: number, z: number): P11BasinCarrierSample {
      if (!Number.isFinite(x) || !Number.isFinite(z)) throw new Error('Basin queries need finite XZ coordinates');
      const d = mask(x, z),
        h = base.height(x, z);
      if ((!Number.isFinite(d) && d !== Infinity) || !Number.isFinite(h))
        throw new Error('Basin masks and heights must be finite (an empty mask may return Infinity)');
      const weight = smooth(-d / p.shore),
        height = h - weight * Math.max(0, h - p.level + p.depth);
      return { height, raw: h, distance: d, wet: d < 0 && height < p.level - 1e-6, affected: height < h - 1e-8 };
    }
    const height = (x: number, z: number) => sample(x, z).height,
      normal = (x: number, z: number) => {
        const e = 0.002;
        return V.norm([height(x - e, z) - height(x + e, z), 2 * e, height(x, z - e) - height(x, z + e)]);
      },
      bound =
        (base.slopeBound || 0) +
        (1.5 * (Math.max(Math.abs(base.bounds.min[1] - p.level), Math.abs(base.bounds.max[1] - p.level)) + p.depth)) /
          p.shore;
    return {
      base,
      parameters: p,
      height,
      normal,
      sample,
      inside: base.inside,
      slopeBound: bound,
      distanceScale: () => 1 / Math.sqrt(1 + bound * bound),
      minimumDistanceScale: 1 / Math.sqrt(1 + bound * bound),
      bounds: {
        min: [base.bounds.min[0], Math.min(base.bounds.min[1], p.level - p.depth), base.bounds.min[2]],
        max: base.bounds.max.slice() as P11BasinCarrierVec3
      }
    };
  }
  A.basins = { parameters, surface };
})(KIT);

export {};
