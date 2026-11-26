/* Caller-defined appearance profiles with ordered inheritance and material roles. */
type P22ProceduralStylesVec3 = [number, number, number];

interface P22ProceduralStylesMaterialDescriptor {
  alias?: unknown;
  color?: unknown;
  shade?: unknown;
  sun?: unknown;
  emissive?: unknown;
  [key: string]: unknown;
}

type P22ProceduralStylesMaterialInput =
  string | number | P22ProceduralStylesVec3 | P22ProceduralStylesMaterialDescriptor;

interface P22ProceduralStylesProfileInput {
  extends?: string | string[];
  materials?: Record<string, P22ProceduralStylesMaterialInput> | null;
  [key: string]: unknown;
}

interface P22ProceduralStylesRecord {
  [key: string]: unknown;
}

interface P22ProceduralStylesNormalizedProfile {
  profile: P22ProceduralStylesProfileInput;
  parents: string[];
}

interface P22ProceduralStylesMaterial extends P22ProceduralStylesRecord {
  color?: P22ProceduralStylesVec3;
  shade?: P22ProceduralStylesVec3;
  sun?: P22ProceduralStylesVec3;
  emissive?: P22ProceduralStylesVec3;
}

interface P22ProceduralStylesCatalog {
  names: readonly string[];
  resolve(...layers: (string | P22ProceduralStylesProfileInput)[]): P22ProceduralStylesProfileInput;
}

interface P22ProceduralStylesData {
  clone<T>(value: T): T;
  freeze<T>(value: T): T;
  merge(a: unknown, b: unknown): P22ProceduralStylesProfileInput;
}

interface P22ProceduralStylesMaterialReferences {
  reference(value: unknown): boolean;
  resolve(materials: Record<string, P22ProceduralStylesMaterialInput>, role: string): P22ProceduralStylesMaterial;
  recolor(
    value: P22ProceduralStylesMaterialInput | undefined,
    color: P22ProceduralStylesVec3
  ): P22ProceduralStylesMaterial;
}

interface P22ProceduralStylesApi {
  data: P22ProceduralStylesData;
  materialReferences: P22ProceduralStylesMaterialReferences;
  styles?: {
    catalog(definitions?: Record<string, P22ProceduralStylesProfileInput>): P22ProceduralStylesCatalog;
    compose: P22ProceduralStylesCatalog['resolve'];
    sample(profile: P22ProceduralStylesProfileInput, channels: readonly string[]): Readonly<Record<string, unknown>>;
    material(profile: P22ProceduralStylesProfileInput, role: string): P22ProceduralStylesMaterial;
    recolor(profile: P22ProceduralStylesProfileInput, role: string, color: unknown): P22ProceduralStylesMaterial;
    rgb(color: unknown): P22ProceduralStylesVec3;
  };
}

interface P22ProceduralStylesKitHost {
  procedural: P22ProceduralStylesApi;
  materialReferences: P22ProceduralStylesMaterialReferences;
}

declare const KIT: P22ProceduralStylesKitHost;

(function (K: P22ProceduralStylesKitHost) {
  const P = K.procedural;
  const { clone, freeze, merge } = P.data;
  const compiled = new WeakSet<object>(),
    materialCache = new WeakMap<object, Map<string, P22ProceduralStylesMaterial>>();
  const name = (value: unknown): value is string =>
    typeof value === 'string' && value.length > 0 && !['__proto__', 'constructor', 'prototype'].includes(value);
  const record = (value: unknown): value is P22ProceduralStylesRecord =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
  const colorFields = ['color', 'shade', 'sun', 'emissive'] as const;

  function rgb(color: unknown): P22ProceduralStylesVec3 {
    if (Array.isArray(color) && color.length === 3 && color.every(v => Number.isFinite(v) && v >= 0 && v <= 1))
      return color.slice() as P22ProceduralStylesVec3;
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) color = Number.parseInt(color.slice(1), 16);
    if (Number.isInteger(color) && (color as number) >= 0 && (color as number) <= 0xffffff) {
      return [(color as number) >> 16, ((color as number) >> 8) & 255, (color as number) & 255].map(
        v => v / 255
      ) as P22ProceduralStylesVec3;
    }
    throw new Error('Expected #rrggbb, a 24-bit color or three normalized color components');
  }

  function normalize(value: P22ProceduralStylesProfileInput): P22ProceduralStylesNormalizedProfile {
    const profile = clone(value);
    if (!record(profile)) throw new Error('A style profile must be a JSON record');
    const parents =
      profile.extends === undefined ? [] : Array.isArray(profile.extends) ? profile.extends : [profile.extends];
    if (parents.length > 32 || !parents.every(name)) throw new Error('Style extends needs up to 32 names');
    delete profile.extends;
    if (profile.materials !== undefined && profile.materials !== null) {
      if (!record(profile.materials)) throw new Error('Style materials must be a record or null');
      for (const [role, value] of Object.entries(profile.materials)) {
        if (!name(role)) throw new Error('Invalid material role');
        if (typeof value === 'string' && !value.startsWith('#')) {
          if (!name(value)) throw new Error('Invalid material alias');
        } else if (record(value)) {
          if (value.alias !== undefined && !K.materialReferences.reference(value.alias))
            throw new Error('Invalid material alias');
          for (const key of colorFields) if (value[key] !== undefined) rgb(value[key]);
        } else {
          rgb(value);
          profile.materials[role] = { color: value };
        }
      }
    }
    return { profile, parents };
  }

  function material(profile: P22ProceduralStylesProfileInput, role: string): P22ProceduralStylesMaterial {
    if (!record(profile) || !name(role)) throw new Error('Material resolution needs a profile and a role');
    const own = role,
      saved = materialCache.get(profile);
    if (saved?.has(own)) return saved.get(own)!;
    const result = K.materialReferences.resolve(profile.materials || {}, role);
    for (const key of colorFields) if (key === 'color' || result[key] !== undefined) result[key] = rgb(result[key]);
    freeze(result);
    if (compiled.has(profile)) {
      if (!saved) materialCache.set(profile, new Map([[own, result]]));
      else saved.set(own, result);
    }
    return result;
  }

  function catalog(definitions: Record<string, P22ProceduralStylesProfileInput> = {}): P22ProceduralStylesCatalog {
    if (!record(definitions) || Object.keys(definitions).length > 512)
      throw new Error('A style catalog needs up to 512 profiles');
    const entries = new Map<string, P22ProceduralStylesNormalizedProfile>();
    for (const [id, value] of Object.entries(definitions)) {
      if (!name(id)) throw new Error('Invalid style name');
      entries.set(id, normalize(value));
    }
    const named = new Map<string, P22ProceduralStylesProfileInput>(),
      cache = new Map<string, P22ProceduralStylesProfileInput>(),
      active = new Set<string>();
    function load(id: string): P22ProceduralStylesProfileInput {
      if (named.has(id)) return named.get(id)!;
      if (active.has(id)) throw new Error('Cyclic style inheritance: ' + [...active, id].join(' → '));
      const entry = entries.get(id);
      if (!entry) throw new Error('Unknown style: ' + id);
      active.add(id);
      try {
        const value = finish(flatten(entry));
        named.set(id, value);
        return value;
      } finally {
        active.delete(id);
      }
    }
    function flatten({ profile, parents }: P22ProceduralStylesNormalizedProfile): P22ProceduralStylesProfileInput {
      const base = parents.reduce((out, id) => merge(out, load(id)), {});
      return merge(base, profile);
    }
    function finish(result: P22ProceduralStylesProfileInput): P22ProceduralStylesProfileInput {
      freeze(result);
      compiled.add(result);
      return result;
    }
    for (const id of entries.keys()) load(id);

    function resolve(...layers: (string | P22ProceduralStylesProfileInput)[]): P22ProceduralStylesProfileInput {
      if (layers.length > 128) throw new Error('A style stack supports up to 128 layers');
      if (layers.length === 1 && typeof layers[0] === 'string') return load(layers[0]);
      const values = layers.map(layer => (typeof layer === 'string' ? load(layer) : flatten(normalize(layer))));
      const key = JSON.stringify(values);
      if (cache.has(key)) return cache.get(key)!;
      const value = finish(values.reduce((out, layer) => merge(out, layer), {}));
      cache.set(key, value);
      if (cache.size > 256) cache.delete(cache.keys().next().value!);
      return value;
    }
    return Object.freeze({ names: Object.freeze([...entries.keys()]), resolve });
  }

  function sample(
    profile: P22ProceduralStylesProfileInput,
    channels: readonly string[]
  ): Readonly<Record<string, unknown>> {
    if (!record(profile) || !Array.isArray(channels) || !channels.every(name)) {
      throw new Error('Style sampling needs a profile and named channels');
    }
    return freeze(
      Object.fromEntries(
        channels
          .filter(key => Object.prototype.hasOwnProperty.call(profile, key))
          .map(key => [key, clone(profile[key])])
      )
    );
  }

  const empty = catalog();
  function recolor(
    profile: P22ProceduralStylesProfileInput,
    role: string,
    color: unknown
  ): P22ProceduralStylesMaterial {
    if (!record(profile) || !name(role)) throw Error('Recoloring needs a profile and a material role');
    return freeze(K.materialReferences.recolor(profile.materials?.[role], rgb(color)));
  }
  P.styles = { catalog, compose: empty.resolve, sample, material, recolor, rgb };
})(KIT);

export {};
