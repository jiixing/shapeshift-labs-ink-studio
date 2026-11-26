/* Bounded shape grammar with named partitions, fitted repeats, pinned spans and sockets. */
type P41ShapeGrammarVec3 = [number, number, number];
type P41ShapeGrammarAxis = 'x' | 'y' | 'z';
type P41ShapeGrammarSide = 'min' | 'max';
type P41ShapeGrammarPath = (string | number)[];

interface P41ShapeGrammarBounds {
  min: number[];
  max: number[];
}

interface P41ShapeGrammarScope {
  id?: string;
  bounds: P41ShapeGrammarBounds;
  symbol: P41ShapeGrammarOperation;
}

interface P41ShapeGrammarNamedEntry {
  key: string;
  use: P41ShapeGrammarOperation;
}

interface P41ShapeGrammarSplitEntry extends P41ShapeGrammarNamedEntry {
  size?: number;
  weight?: number;
}

interface P41ShapeGrammarChoiceEntry extends P41ShapeGrammarNamedEntry {
  weight?: number;
}

interface P41ShapeGrammarRepeatPin {
  id: string;
  at: number;
  span: number;
  use?: P41ShapeGrammarOperation;
}

interface P41ShapeGrammarEmitOperation {
  op: 'emit';
  role: string;
  key?: string;
  data?: unknown;
}

interface P41ShapeGrammarSocketOperation {
  op: 'socket';
  name: string;
  key?: string;
  side?: P41ShapeGrammarSide;
  at?: P41ShapeGrammarVec3;
  axis?: P41ShapeGrammarAxis;
  data?: unknown;
}

interface P41ShapeGrammarGroupOperation {
  op: 'group';
  children: readonly P41ShapeGrammarNamedEntry[];
}

interface P41ShapeGrammarSplitOperation {
  op: 'split';
  axis: P41ShapeGrammarAxis;
  parts: readonly P41ShapeGrammarSplitEntry[];
}

interface P41ShapeGrammarRepeatOperation {
  op: 'repeat';
  axis: P41ShapeGrammarAxis;
  pitch: number;
  gap?: number;
  pinSet?: string;
  pins?: readonly P41ShapeGrammarRepeatPin[];
  pinUse?: P41ShapeGrammarOperation;
  use: P41ShapeGrammarOperation;
}

interface P41ShapeGrammarInsetOperation {
  op: 'inset';
  margin?: number | P41ShapeGrammarVec3;
  min?: P41ShapeGrammarVec3;
  max?: P41ShapeGrammarVec3;
  optional?: boolean;
  use: P41ShapeGrammarOperation;
}

interface P41ShapeGrammarChoiceOperation {
  op: 'choice';
  options: readonly P41ShapeGrammarChoiceEntry[];
}

interface P41ShapeGrammarUnknownOperation {
  op: 'unknown';
}

type P41ShapeGrammarOperation =
  | string
  | null
  | P41ShapeGrammarEmitOperation
  | P41ShapeGrammarSocketOperation
  | P41ShapeGrammarGroupOperation
  | P41ShapeGrammarSplitOperation
  | P41ShapeGrammarRepeatOperation
  | P41ShapeGrammarInsetOperation
  | P41ShapeGrammarChoiceOperation
  | P41ShapeGrammarUnknownOperation;

interface P41ShapeGrammarExpandOptions {
  seed?: number;
  pinSets?: Record<string, readonly P41ShapeGrammarRepeatPin[]>;
  maxSteps?: number;
  maxParts?: number;
  maxDepth?: number;
}

interface P41ShapeGrammarKeyed {
  key: string;
  path: P41ShapeGrammarPath;
}

interface P41ShapeGrammarPartData {
  role: string;
  bounds: P41ShapeGrammarBounds;
  center: number[];
  half: number[];
  data: unknown;
}

interface P41ShapeGrammarSocketData {
  name: string;
  point: number[];
  normal: number[];
  data: unknown;
}

interface P41ShapeGrammarPart extends P41ShapeGrammarKeyed, P41ShapeGrammarPartData {}
interface P41ShapeGrammarSocket extends P41ShapeGrammarKeyed, P41ShapeGrammarSocketData {}

interface P41ShapeGrammarLayout {
  parts: readonly P41ShapeGrammarPart[];
  sockets: readonly P41ShapeGrammarSocket[];
  work: { steps: number };
}

interface P41ShapeGrammarChild {
  key: string;
  type: string;
  parameters: P41ShapeGrammarPart | P41ShapeGrammarSocket;
}

interface P41ShapeGrammarChildrenOptions {
  partType?: string;
  socketType?: string;
}

interface P41ShapeGrammarFittedCourse {
  bounds: { min: [number, number]; max: [number, number] };
}

interface P41ShapeGrammarFittedCourses {
  cells: readonly P41ShapeGrammarFittedCourse[];
}

interface P41ShapeGrammarData {
  clone<T>(value: T): T;
  freeze<T>(value: T): Readonly<T>;
  hash(text: string, seed?: number): number;
}

interface P41ShapeGrammarApi {
  data: P41ShapeGrammarData;
  fittedCourses(spec: {
    width: number;
    height: number;
    unit: [number, number];
    budget: number;
  }): P41ShapeGrammarFittedCourses;
  grammar?: {
    expand(
      scope: P41ShapeGrammarScope,
      rules: Record<string, P41ShapeGrammarOperation>,
      options?: P41ShapeGrammarExpandOptions
    ): Readonly<P41ShapeGrammarLayout>;
    children(layout: P41ShapeGrammarLayout, options?: P41ShapeGrammarChildrenOptions): P41ShapeGrammarChild[];
  };
}

interface P41ShapeGrammarKitHost {
  procedural: P41ShapeGrammarApi;
}

declare const KIT: P41ShapeGrammarKitHost;

(function (K: P41ShapeGrammarKitHost) {
  const P = K.procedural,
    EPS = 1e-8,
    axes: P41ShapeGrammarAxis[] = ['x', 'y', 'z'],
    keyOK = (key: unknown): key is string => typeof key === 'string' && key.length > 0 && key.length <= 120,
    number = (x: unknown): x is number => Number.isFinite(x as number) && Math.abs(x as number) <= 1e6,
    count = (n: number, max: number): n is number => Number.isSafeInteger(n) && n >= 1 && n <= max,
    vector = (p: unknown): p is P41ShapeGrammarVec3 => Array.isArray(p) && p.length === 3 && p.every(number);
  function fail(message: string): never {
    throw new Error('Shape grammar: ' + message);
  }
  function axisOf(name: P41ShapeGrammarAxis): number {
    const axis = axes.indexOf(name);
    if (axis < 0) fail('expected x, y, or z axis');
    return axis;
  }
  function interval(bounds: P41ShapeGrammarBounds, axis: number, lo: number, hi: number): P41ShapeGrammarBounds {
    const min = bounds.min.slice(),
      max = bounds.max.slice();
    min[axis] = lo;
    max[axis] = hi;
    return { min, max };
  }
  function keys<T extends P41ShapeGrammarNamedEntry>(entries: readonly T[]): readonly T[] {
    if (
      !Array.isArray(entries) ||
      entries.length < 1 ||
      entries.length > 4096 ||
      entries.some(entry => !keyOK(entry?.key)) ||
      new Set(entries.map(entry => entry.key)).size !== entries.length
    )
      fail('operations need unique named entries');
    return entries;
  }
  function rootBounds(bounds: P41ShapeGrammarBounds): P41ShapeGrammarBounds {
    if (!vector(bounds?.min) || !vector(bounds?.max) || bounds.min.some((v, i) => bounds.max[i] - v <= EPS))
      fail('scope requires positive finite XYZ bounds');
    return { min: bounds.min.slice(), max: bounds.max.slice() };
  }
  const direction = (axis: number, value: number): number[] => [0, 1, 2].map(i => (i === axis ? value : 0));

  function expand(
    scope: P41ShapeGrammarScope,
    rules: Record<string, P41ShapeGrammarOperation>,
    { seed = 0, pinSets = {}, maxSteps = 30000, maxParts = 12000, maxDepth = 40 }: P41ShapeGrammarExpandOptions = {}
  ): Readonly<P41ShapeGrammarLayout> {
    if (
      !rules ||
      typeof rules !== 'object' ||
      Array.isArray(rules) ||
      !pinSets ||
      typeof pinSets !== 'object' ||
      Array.isArray(pinSets) ||
      !keyOK(scope?.id ?? 'scope') ||
      !Number.isSafeInteger(seed) ||
      !count(maxSteps, 200000) ||
      !count(maxParts, 40000) ||
      !count(maxDepth, 96)
    )
      fail('invalid rules, scope, seed, or work limits');
    const bounds = rootBounds(scope?.bounds),
      parts: P41ShapeGrammarPart[] = [],
      sockets: P41ShapeGrammarSocket[] = [],
      outputKeys = new Set<string>();
    let steps = 0;
    function output<T extends P41ShapeGrammarPartData | P41ShapeGrammarSocketData>(
      path: P41ShapeGrammarPath,
      label: string | undefined,
      value: T,
      list: (T & P41ShapeGrammarKeyed)[]
    ): void {
      if (label !== undefined) {
        if (!keyOK(label)) fail('output keys must be nonempty names');
        path = [...path, label];
      }
      const key = JSON.stringify(path);
      if (outputKeys.has(key)) fail('duplicate output key ' + key);
      if (parts.length + sockets.length >= maxParts) fail('output exceeds its part budget');
      outputKeys.add(key);
      list.push({ key, path, ...value });
    }
    function split(
      node: P41ShapeGrammarSplitOperation,
      box: P41ShapeGrammarBounds,
      path: P41ShapeGrammarPath,
      depth: number
    ): void {
      const axis = axisOf(node.axis),
        lo = box.min[axis],
        hi = box.max[axis],
        entries = keys(node.parts),
        portions = entries.map(entry => ({
          size: entry.size ?? 0,
          weight: entry.weight ?? (entry.size === undefined ? 1 : 0)
        }));
      if (
        portions.some(
          ({ size, weight }) => !number(size) || !number(weight) || size < 0 || weight < 0 || (!size && !weight)
        )
      )
        fail('split sizes and weights must be nonnegative with a positive contribution');
      const fixed = portions.reduce((sum, p) => sum + p.size, 0),
        weight = portions.reduce((sum, p) => sum + p.weight, 0),
        available = hi - lo - fixed;
      if (available < -EPS || (!weight && available > EPS)) fail('split dimensions do not fit the scope');
      let at = lo;
      for (const [i, entry] of entries.entries()) {
        const { size, weight: share } = portions[i],
          end = i === entries.length - 1 ? hi : at + size + (weight ? (Math.max(0, available) * share) / weight : 0);
        if (end - at > EPS) visit(entry.use, interval(box, axis, at, end), [...path, entry.key], depth + 1);
        at = end;
      }
    }
    function repeat(
      node: P41ShapeGrammarRepeatOperation,
      box: P41ShapeGrammarBounds,
      path: P41ShapeGrammarPath,
      depth: number
    ): void {
      const axis = axisOf(node.axis),
        pitch = node.pitch,
        gap = node.gap ?? 0,
        lo = box.min[axis],
        hi = box.max[axis];
      if (!number(pitch) || pitch <= EPS || !number(gap) || gap < 0)
        fail('repeat needs a positive pitch and nonnegative gap');
      if (node.pinSet !== undefined && (!keyOK(node.pinSet) || node.pins !== undefined))
        fail('repeat needs either a named pin set or inline pins');
      const specified =
        node.pinSet === undefined ? (node.pins ?? []) : Object.hasOwn(pinSets, node.pinSet) ? pinSets[node.pinSet] : [];
      if (!Array.isArray(specified) || specified.length > 4096) fail('repeat pins must be a bounded list');
      const ids = new Set<string>(),
        pins = specified
          .map(pin => {
            if (!keyOK(pin?.id) || ids.has(pin.id) || !number(pin.at) || !number(pin.span) || pin.span <= EPS)
              fail('repeat pins need unique IDs, positions and positive spans');
            ids.add(pin.id);
            return { ...pin, low: pin.at - pin.span / 2, high: pin.at + pin.span / 2 };
          })
          .sort((a, b) => a.low - b.low);
      for (const [i, pin] of pins.entries()) {
        if (pin.low < (pins[i - 1]?.high ?? lo) - EPS || pin.high > hi + EPS)
          fail('repeat pins overlap or leave the scope');
      }
      function bays(a: number, b: number, left: string | null, right: string | null): void {
        if (b - a <= EPS) return;
        const nx = Math.max(1, Math.round((b - a) / pitch));
        if (nx > maxSteps - steps || nx > 65536) fail('repeat exceeds its step budget');
        const { cells } = P.fittedCourses({ width: b - a, height: 1, unit: [pitch, 1], budget: nx });
        const fromHigh = !left && Boolean(right),
          namespace = JSON.stringify([left ?? null, right ?? null]);
        for (const [i, cell] of cells.entries()) {
          const low = a + cell.bounds.min[0] + (i > 0 ? gap * 0.5 : 0),
            high = a + cell.bounds.max[0] - (i < nx - 1 ? gap * 0.5 : 0);
          if (high - low <= EPS) fail('repeat gap consumes a fitted cell');
          const slot = fromHigh ? nx - i - 1 : i;
          visit(node.use, interval(box, axis, low, high), [...path, 'bay', namespace, slot], depth + 1);
        }
      }
      let at = lo,
        previous: string | null = null;
      for (const pin of pins) {
        const start = Math.max(lo, pin.low),
          end = Math.min(hi, pin.high);
        bays(at, start, previous, pin.id);
        visit(pin.use ?? node.pinUse ?? node.use, interval(box, axis, start, end), [...path, 'pin', pin.id], depth + 1);
        at = end;
        previous = pin.id;
      }
      bays(at, hi, previous, null);
    }
    function visit(
      operation: P41ShapeGrammarOperation,
      box: P41ShapeGrammarBounds,
      path: P41ShapeGrammarPath,
      depth: number
    ): void {
      if (++steps > maxSteps || depth > maxDepth) fail('execution exceeds its step or depth budget');
      if (operation === null) return;
      if (typeof operation === 'string') {
        if (!Object.hasOwn(rules, operation)) fail('unknown production ' + operation);
        visit(rules[operation], box, path, depth + 1);
        return;
      }
      if (!operation || typeof operation !== 'object' || Array.isArray(operation)) fail('invalid production');
      switch (operation.op) {
        case 'emit': {
          const { role, key, data = {} } = operation;
          if (!keyOK(role)) fail('emitted pieces need a role');
          const center = box.min.map((v, i) => (v + box.max[i]) * 0.5),
            half = box.min.map((v, i) => (box.max[i] - v) * 0.5);
          output(path, key, { role, bounds: box, center, half, data: P.data.clone(data) }, parts);
          break;
        }
        case 'socket': {
          const { name, key = name, side = 'max', at = [0.5, 0.5, 0.5], axis: which = 'z', data = {} } = operation,
            axis = axisOf(which);
          if (!keyOK(name) || !['min', 'max'].includes(side) || !vector(at) || at.some(v => v < 0 || v > 1))
            fail('sockets need a name, a face and normalized XYZ offsets');
          const point = box.min.map((v, i) => (i === axis ? box[side][i] : v + at[i] * (box.max[i] - v)));
          output(
            path,
            key,
            { name, point, normal: direction(axis, side === 'max' ? 1 : -1), data: P.data.clone(data) },
            sockets
          );
          break;
        }
        case 'group':
          for (const child of keys(operation.children)) visit(child.use, box, [...path, child.key], depth + 1);
          break;
        case 'split':
          split(operation, box, path, depth);
          break;
        case 'repeat':
          repeat(operation, box, path, depth);
          break;
        case 'inset': {
          const margin = operation.margin ?? 0,
            both = number(margin) ? [margin, margin, margin] : margin,
            low = operation.min ?? both,
            high = operation.max ?? both;
          if (!vector(low) || !vector(high) || [...low, ...high].some(v => v < 0))
            fail('insets need nonnegative XYZ margins');
          const next = {
            min: box.min.map((v, i) => v + low[i]),
            max: box.max.map((v, i) => v - high[i])
          };
          if (next.min.some((v, i) => next.max[i] - v <= EPS)) {
            if (!operation.optional) fail('inset consumes its scope');
          } else visit(operation.use, next, path, depth + 1);
          break;
        }
        case 'choice': {
          const options = keys(operation.options),
            weights = options.map(option => option.weight ?? 1);
          if (weights.some(w => !number(w) || w <= 0)) fail('choices need positive weights');
          const total = weights.reduce((sum, value) => sum + value, 0);
          let pick = (P.data.hash(JSON.stringify(path), seed >>> 0) / 4294967296) * total,
            chosen = options.at(-1)!;
          for (const [i, option] of options.entries()) {
            pick -= weights[i];
            if (pick >= 0) continue;
            chosen = option;
            break;
          }
          visit(chosen.use, box, [...path, chosen.key], depth + 1);
          break;
        }
        default:
          fail('unknown operation ' + operation.op);
      }
    }
    visit(scope.symbol, bounds, [scope.id ?? 'scope'], 0);
    return P.data.freeze({ parts, sockets, work: { steps } });
  }

  function children(
    layout: P41ShapeGrammarLayout,
    { partType = 'grammarPart', socketType = 'grammarSocket' }: P41ShapeGrammarChildrenOptions = {}
  ): P41ShapeGrammarChild[] {
    if (!Array.isArray(layout?.parts) || !Array.isArray(layout?.sockets) || !keyOK(partType) || !keyOK(socketType))
      fail('retained children need an expanded layout and named types');
    return [
      ...layout.parts.map(record => ({ key: record.key, type: partType, parameters: record })),
      ...layout.sockets.map(record => ({ key: record.key, type: socketType, parameters: record }))
    ];
  }

  P.grammar = { expand, children };
})(KIT);

export {};
