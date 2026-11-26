/* Ordered swept-disc masks with optional feathering, taper and source ownership. */
type P17SweptMasksVec2 = [number, number];
type P17SweptMasksVec3 = [number, number, number];
type P17SweptMasksOperation = 'add' | 'erase';
type P17SweptMasksDistance = (x: number, y: number, wantRadius?: boolean) => number;

interface P17SweptMasksStrokeInput {
  id: string;
  points: P17SweptMasksVec2[];
  radii?: number[];
  layer?: string;
  operation?: P17SweptMasksOperation;
  order?: number;
  width?: number;
  softness?: number;
  elevation?: number;
  material?: string;
  pattern?: string;
  [key: string]: unknown;
}

interface P17SweptMasksParameters extends P17SweptMasksStrokeInput {
  radii: number[];
  layer: string;
  operation: P17SweptMasksOperation;
  order: number;
  width: number;
  softness: number;
  elevation: number;
  material: string;
  pattern: string;
}

interface P17SweptMasksBounds {
  min: P17SweptMasksVec3;
  max: P17SweptMasksVec3;
}

interface P17SweptMasksSample {
  distance: number;
  weight: number;
  owner: string | null;
}

interface P17SweptMasksStroke {
  readonly owner: string;
  readonly parameters: Readonly<P17SweptMasksParameters>;
  readonly bounds: Readonly<P17SweptMasksBounds>;
  distance(q: P17SweptMasksVec2, wantRadius?: boolean): number;
  radius(q: P17SweptMasksVec2): number;
  weight(q: P17SweptMasksVec2): number;
}

interface P17SweptMasksComposeOptions {
  layer?: string;
}

interface P17SweptMasksComposition {
  radiusSmooth(q: P17SweptMasksVec2, blend?: number): number;
  strokes: readonly P17SweptMasksStroke[];
  bounds: Readonly<P17SweptMasksBounds> | null;
  sample(q: P17SweptMasksVec2): P17SweptMasksSample;
  distance(q: P17SweptMasksVec2): number;
  distanceAt(x: number, y: number, ceiling?: number): number;
  weight(q: P17SweptMasksVec2): number;
  contains(q: P17SweptMasksVec2): boolean;
  visibleDistance(id: string, q: P17SweptMasksVec2): number;
  radius(q: P17SweptMasksVec2): number;
  owner(q: P17SweptMasksVec2): string | null;
}

interface P17SweptMasksData {
  clone<T>(value: T): T;
  freeze<T>(value: T): Readonly<T>;
  isImmutable(value: unknown): boolean;
}

interface P17SweptMasksSpatial {
  boxOf(points: readonly P17SweptMasksVec3[]): P17SweptMasksBounds;
}

interface P17SweptMasksApi {
  data: P17SweptMasksData;
  spatial: P17SweptMasksSpatial;
  masks: {
    stroke(spec: P17SweptMasksStrokeInput): P17SweptMasksStroke;
    compose(
      specs: readonly P17SweptMasksStrokeInput[],
      options?: P17SweptMasksComposeOptions
    ): P17SweptMasksComposition;
  };
}

interface P17SweptMasksKitHost {
  procedural: P17SweptMasksApi;
}

interface P17SweptMasksDisc {
  compile(points: readonly P17SweptMasksVec2[], radii: readonly number[]): P17SweptMasksDistance;
}

declare const KIT: P17SweptMasksKitHost;
declare const SweptDisc: P17SweptMasksDisc;

(function (K: P17SweptMasksKitHost) {
  const A = K.procedural,
    evaluators = new WeakMap<P17SweptMasksStroke, P17SweptMasksDistance>(),
    EPS = 1e-9;
  const clamp = (x: number): number => Math.max(0, Math.min(1, x)),
    weight = (d: number, soft: number): number => {
      if (!soft) return d <= 0 ? 1 : 0;
      const t = clamp(0.5 - d / (2 * soft));
      return t * t * (3 - 2 * t);
    };
  function parameters(spec: P17SweptMasksStrokeInput): P17SweptMasksParameters {
    const p = Object.assign(
      {
        layer: 'default',
        operation: 'add',
        order: 0,
        width: 1.2,
        softness: 0.06,
        elevation: 0,
        material: 'default',
        pattern: 'flat'
      },
      A.data.clone(spec)
    );
    if (
      typeof p.layer !== 'string' ||
      !p.layer ||
      !['add', 'erase'].includes(p.operation) ||
      !Number.isSafeInteger(p.order) ||
      p.order < 0 ||
      !Number.isFinite(p.width) ||
      p.width <= 0 ||
      p.width > 128 ||
      !Number.isFinite(p.softness) ||
      p.softness < 0 ||
      p.softness > 32 ||
      !Number.isFinite(p.elevation) ||
      typeof p.material !== 'string' ||
      !p.material ||
      typeof p.pattern !== 'string' ||
      !p.pattern
    )
      throw new Error('Invalid brush layer, operation, order, width or appearance');
    if (
      !Array.isArray(p.points) ||
      !p.points.length ||
      p.points.length > 65536 ||
      !p.points.every(a => Array.isArray(a) && a.length === 2 && a.every(v => Number.isFinite(v) && Math.abs(v) <= 1e6))
    )
      throw new Error('Brush strokes require finite 2D points');
    p.points = p.points.map(a => a.slice() as P17SweptMasksVec2);
    if (
      p.radii !== undefined &&
      (!Array.isArray(p.radii) ||
        p.radii.length !== p.points.length ||
        !p.radii.every(r => Number.isFinite(r) && r > 0 && r <= 64))
    )
      throw new Error('Brush radii must match the points and be positive');
    p.radii = p.radii ? p.radii.slice() : p.points.map(() => p.width / 2);
    return A.data.freeze(p) as P17SweptMasksParameters;
  }
  function point(value: P17SweptMasksVec2): P17SweptMasksVec2 {
    if (!Array.isArray(value) || value.length !== 2 || !Number.isFinite(value[0]) || !Number.isFinite(value[1]))
      throw new Error('Brush queries need a finite 2D point');
    return value;
  }
  const compiledStrokes = new WeakMap<P17SweptMasksStrokeInput, P17SweptMasksStroke>();
  function stroke(spec: P17SweptMasksStrokeInput): P17SweptMasksStroke {
    if (!spec || typeof spec.id !== 'string' || !spec.id) throw Error('A mask stroke needs a stable id');
    const retained = A.data.isImmutable(spec);
    if (retained && compiledStrokes.has(spec)) return compiledStrokes.get(spec)!;
    const p = parameters(spec),
      evaluate = SweptDisc.compile(p.points, p.radii),
      minimum = [Infinity, Infinity],
      maximum = [-Infinity, -Infinity];
    for (let i = 0; i < p.points.length; i++) {
      const a = p.points[i],
        r = p.radii[i] + p.softness;
      for (let j = 0; j < 2; j++) {
        minimum[j] = Math.min(minimum[j], a[j] - r);
        maximum[j] = Math.max(maximum[j], a[j] + r);
      }
    }
    const distance = (q: P17SweptMasksVec2, wantRadius = false): number => {
        point(q);
        return evaluate(q[0], q[1], wantRadius);
      },
      result: P17SweptMasksStroke = {
        owner: spec.id,
        parameters: p,
        bounds: A.data.freeze({
          min: [minimum[0], p.elevation - 0.01, minimum[1]],
          max: [maximum[0], p.elevation + 0.01, maximum[1]]
        }),
        distance,
        radius: q => distance(q, true),
        weight: q => weight(distance(q), p.softness)
      };
    evaluators.set(result, evaluate);
    Object.freeze(result);
    if (retained) compiledStrokes.set(spec, result);
    return result;
  }
  function compose(
    specs: readonly P17SweptMasksStrokeInput[],
    options: P17SweptMasksComposeOptions = {}
  ): P17SweptMasksComposition {
    if (!Array.isArray(specs) || specs.length > 4096) throw Error('Mask composition needs at most 4096 strokes');
    const ids = new Set<string>();
    const selected: P17SweptMasksStroke[] = [];
    let points = 0;
    for (const spec of specs) {
      if (options.layer && spec?.layer !== undefined && spec.layer !== options.layer) continue;
      points += Array.isArray(spec?.points) ? spec.points.length : 0;
      if (points > 262144) throw Error('Mask composition exceeds its point budget');
      const compiled = stroke(spec);
      if (options.layer && compiled.parameters.layer !== options.layer) continue;
      if (ids.has(compiled.owner)) throw Error('Mask stroke ids must be unique');
      ids.add(compiled.owner);
      selected.push(compiled);
    }
    if (new Set(selected.map(s => s.parameters.layer)).size > 1) throw Error('Select one brush layer for composition');
    selected.sort(
      (a, b) => a.parameters.order - b.parameters.order || (a.owner < b.owner ? -1 : a.owner > b.owner ? 1 : 0)
    );
    const strokes = selected,
      fast = strokes.map(s => evaluators.get(s)!),
      adds = strokes.map(s => s.parameters.operation === 'add'),
      limits = strokes.map(s => {
        const b = [s.bounds.min[0], s.bounds.max[0], s.bounds.min[2], s.bounds.max[2]];
        return b.concat(Number.EPSILON * 8 * Math.max(1, ...b.map(Math.abs)));
      }),
      bounds = strokes.length ? A.spatial.boxOf(strokes.flatMap(s => [s.bounds.min, s.bounds.max])) : null,
      byId = new Map<string, number>(strokes.map((s, i) => [s.owner, i]));
    let last: P17SweptMasksVec2 | null = null,
      lastValue: P17SweptMasksSample | null = null,
      distanceX: number | undefined,
      distanceY: number | undefined,
      distanceValue: number | undefined,
      distanceCeiling: number | undefined;
    // Signed L-infinity distance to the expanded box is a lower bound on the
    // swept-disc distance, including inside it. Keep a rounding margin so this
    // rejection never substitutes a box distance for the actual stroke field.
    const lower = (i: number, x: number, y: number): number => {
      const b = limits[i];
      return Math.max(b[0] - x, x - b[1], b[2] - y, y - b[3]) - b[4];
    };
    const irrelevant = (i: number, x: number, y: number, threshold: number): boolean =>
      threshold === -Infinity ||
      (threshold !== Infinity && lower(i, x, y) > threshold + 1e-12 * (1 + Math.abs(threshold)));
    function rememberDistance(x: number, y: number, d: number, ceiling = Infinity): number {
      distanceX = x;
      distanceY = y;
      distanceValue = d;
      distanceCeiling = d < ceiling ? Infinity : ceiling;
      return d;
    }
    // Min and max both commute with an upper clamp. Keep the exact field
    // inside that limit while skipping distant add and erase operations.
    function distanceAt(x: number, y: number, ceiling = Infinity): number {
      if (!Number.isFinite(x) || !Number.isFinite(y) || typeof ceiling !== 'number' || Number.isNaN(ceiling)) {
        throw new Error('Brush queries need a finite 2D point and a numeric ceiling');
      }
      if (x === distanceX && y === distanceY && ceiling <= distanceCeiling!) return Math.min(distanceValue!, ceiling);
      let d = ceiling;
      for (let i = 0; i < fast.length; i++) {
        if (adds[i]) {
          if (!irrelevant(i, x, y, d)) d = Math.min(d, fast[i](x, y));
        } else if (d < ceiling && !irrelevant(i, x, y, -d)) {
          d = Math.min(ceiling, Math.max(d, -fast[i](x, y)));
        }
      }
      return rememberDistance(x, y, d, ceiling);
    }
    function distance(q: P17SweptMasksVec2): number {
      point(q);
      return distanceAt(q[0], q[1]);
    }
    function sample(q: P17SweptMasksVec2): P17SweptMasksSample {
      point(q);
      if (last && q.every((v, i) => v === last![i])) return Object.assign({}, lastValue!);
      let d = Infinity,
        owner: string | null = null,
        coverage = 0;
      for (let i = 0; i < strokes.length; i++) {
        const s = strokes[i],
          sd = fast[i](q[0], q[1]),
          w = weight(sd, s.parameters.softness);
        if (s.parameters.operation === 'add') {
          d = Math.min(d, sd);
          coverage = 1 - (1 - coverage) * (1 - w);
          if (sd <= s.parameters.softness) {
            owner = s.owner;
          }
        } else {
          d = Math.max(d, -sd);
          coverage *= 1 - w;
        }
      }
      if (coverage < EPS) owner = null;
      last = q.slice() as P17SweptMasksVec2;
      lastValue = { distance: rememberDistance(q[0], q[1], d), weight: coverage, owner };
      return Object.assign({}, lastValue);
    }
    function visibleDistance(id: string, q: P17SweptMasksVec2): number {
      point(q);
      const i = byId.get(id);
      if (i === undefined || !adds[i]) return Infinity;
      const [x, y] = q;
      let d = fast[i](x, y);
      for (let j = i + 1; j < strokes.length; j++) if (!irrelevant(j, x, y, -d)) d = Math.max(d, -fast[j](x, y));
      return d;
    }
    const radiusDistances = new Float64Array(strokes.length),
      radiusValues = new Float64Array(strokes.length);
    function radiusSmooth(q: P17SweptMasksVec2, blend = 0.2): number {
      point(q);
      if (!Number.isFinite(blend) || blend <= 0) throw new Error('Radius blending needs a positive distance');
      const [x, y] = q;
      let nearest = Infinity;
      for (let i = 0; i < strokes.length; i++) {
        if (!adds[i] || irrelevant(i, x, y, nearest + blend)) {
          radiusDistances[i] = Infinity;
          continue;
        }
        const d = fast[i](x, y);
        radiusDistances[i] = d;
        radiusValues[i] = fast[i](x, y, true);
        nearest = Math.min(nearest, d);
      }
      let sum = 0,
        value = 0;
      for (let i = 0; i < strokes.length; i++) {
        const w = Math.max(0, 1 - (radiusDistances[i] - nearest) / blend) ** 2;
        if (w > 0) {
          sum += w;
          value += w * radiusValues[i];
        }
      }
      return sum ? value / sum : 1;
    }
    return {
      radiusSmooth,
      strokes: A.data.freeze(strokes.slice()),
      bounds: bounds && A.data.freeze(bounds),
      sample,
      distance,
      distanceAt,
      weight: q => sample(q).weight,
      contains(q) {
        point(q);
        return distanceAt(q[0], q[1], 0) < 0;
      },
      visibleDistance,
      radius(q) {
        point(q);
        let best = Infinity,
          radius = 1;
        for (let i = 0; i < strokes.length; i++) {
          if (adds[i] && !irrelevant(i, q[0], q[1], best)) {
            const d = fast[i](q[0], q[1]);
            if (d < best) {
              best = d;
              radius = fast[i](q[0], q[1], true);
            }
          }
        }
        return radius;
      },
      owner(q) {
        point(q);
        for (let i = strokes.length - 1; i >= 0; i--) {
          const s = strokes[i],
            b = s.bounds;
          if (q[0] < b.min[0] || q[0] > b.max[0] || q[1] < b.min[2] || q[1] > b.max[2]) continue;
          if (fast[i](q[0], q[1]) <= 0) return adds[i] ? s.owner : null;
        }
        return null;
      }
    };
  }
  A.masks = { stroke, compose };
})(KIT);

export {};
