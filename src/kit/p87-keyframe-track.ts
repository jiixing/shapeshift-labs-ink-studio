/* Validated, renderer-independent keyframe tracks on a seconds-based clock. */
type P87KeyframeMode = 'number' | 'vector' | 'radians' | 'positive';
type P87KeyframeEase = 'linear' | 'smooth' | 'step' | 'in-sine' | 'out-sine' | 'in-out-sine';
type P87KeyframeValue = number | readonly number[];
type P87KeyframeSchema = Record<string, P87KeyframeMode>;

interface P87Keyframe {
  readonly time: number;
  readonly value: Readonly<Record<string, P87KeyframeValue>>;
  readonly ease: P87KeyframeEase;
}

interface P87KeyframeColumn {
  name: string;
  mode: P87KeyframeMode;
  values: P87KeyframeValue[];
}

type P87KeyframeSample = Readonly<Record<string, P87KeyframeValue>>;

interface P87KeyframeTrack {
  readonly keys: readonly P87Keyframe[];
  readonly duration: number;
  sample(time: number): P87KeyframeSample | null;
}

interface P87KeyframeApi {
  readonly create: (schema: P87KeyframeSchema, input?: readonly unknown[]) => P87KeyframeTrack;
  readonly eases: readonly P87KeyframeEase[];
}

interface P87KeyframeKitHost {
  anim: {
    ease(time: number, name: string): number;
    keyframeTrack?: P87KeyframeApi;
  };
}

declare const KIT: P87KeyframeKitHost;

(function (K: P87KeyframeKitHost) {
  const modes: P87KeyframeMode[] = ['number', 'vector', 'radians', 'positive'];
  const eases: readonly P87KeyframeEase[] = Object.freeze([
    'linear',
    'smooth',
    'step',
    'in-sine',
    'out-sine',
    'in-out-sine'
  ]);
  const turn = 2 * Math.PI;
  const record = (value: unknown): value is Record<string, unknown> =>
    (value && typeof value === 'object' && !Array.isArray(value)) as boolean;
  const angle = (value: number) => Math.atan2(Math.sin(value), Math.cos(value));
  const blend = (a: number, b: number, t: number) => (1 - t) * a + t * b;

  function create(schema: P87KeyframeSchema, input: readonly unknown[] = []) {
    if (!record(schema) || !Array.isArray(input)) throw Error('Expected channel modes and a keyframe array');
    const entries = Object.entries(schema);
    if (!entries.length || entries.some(([name, mode]) => !name || !modes.includes(mode)))
      throw Error('Invalid keyframe channel schema');
    const lengths = new Map<string, number>();
    const keys: P87Keyframe[] = Array.from(input, (key): P87Keyframe => {
      if (
        !record(key) ||
        !Number.isFinite(key.time) ||
        (key.time as number) < 0 ||
        !record(key.value) ||
        Object.keys(key.value).length !== entries.length
      )
        throw Error('Each keyframe needs a nonnegative time and every channel');
      const ease = (key.ease ?? 'smooth') as P87KeyframeEase;
      if (!eases.includes(ease)) throw Error('Unknown keyframe easing');
      const pairs = entries.map<[string, P87KeyframeValue]>(([name, mode]) => {
        const value = Object.hasOwn(key.value as Record<string, unknown>, name)
          ? (key.value as Record<string, unknown>)[name]
          : undefined;
        if (mode === 'vector') {
          if (
            !Array.isArray(value) ||
            !value.length ||
            !Array.from(value).every(Number.isFinite) ||
            (lengths.has(name) && lengths.get(name) !== value.length)
          )
            throw Error('Invalid vector channel: ' + name);
          lengths.set(name, value.length);
          return [name, Object.freeze((value as number[]).slice())];
        }
        if (!Number.isFinite(value) || (mode === 'positive' && (value as number) <= 0))
          throw Error('Invalid keyframe channel: ' + name);
        return [name, value as number];
      });
      return Object.freeze({ time: key.time as number, value: Object.freeze(Object.fromEntries(pairs)), ease });
    }).sort((a, b) => a.time - b.time);
    if (keys.some((key, i) => i > 0 && keys[i - 1].time === key.time)) throw Error('Keyframe times must be unique');

    const columns: P87KeyframeColumn[] = entries.map(([name, mode]) => {
      let unwrapped = 0;
      const values = keys.map(key => {
        const value = key.value[name];
        if (mode !== 'radians') return value;
        const next = angle(value as number);
        const offset = next - (unwrapped % turn);
        unwrapped += angle(offset);
        return unwrapped;
      });
      return { name, mode, values };
    });

    const duration = keys.at(-1)?.time ?? 0;
    function sample(time: number): P87KeyframeSample | null {
      if (!Number.isFinite(time)) throw Error('Sample time must be finite');
      if (!keys.length) return null;
      const t = Math.max(keys[0].time, Math.min(duration, time));
      let low = 0,
        high = keys.length - 1;
      while (high - low > 1) {
        const mid = Math.floor((low + high) / 2);
        if (keys[mid].time <= t) low = mid;
        else high = mid;
      }
      const a = keys[low],
        b = keys[high];
      const u = t === a.time ? 0 : t === b.time ? 1 : K.anim.ease((t - a.time) / (b.time - a.time), a.ease);
      return Object.fromEntries(
        columns.map<[string, P87KeyframeValue]>(({ name, mode, values }) => {
          const start = values[low],
            end = values[high];
          if (mode === 'vector')
            return [name, (start as readonly number[]).map((v, i) => blend(v, (end as readonly number[])[i], u))];
          if (u === 0 || u === 1) return [name, u === 0 ? start : end];
          if (mode === 'positive')
            return [name, Math.exp(blend(Math.log(start as number), Math.log(end as number), u))];
          return [name, blend(start as number, end as number, u)];
        })
      );
    }
    return Object.freeze({ keys: Object.freeze(keys), duration, sample });
  }

  K.anim.keyframeTrack = Object.freeze({ create, eases });
})(KIT);

export {};
