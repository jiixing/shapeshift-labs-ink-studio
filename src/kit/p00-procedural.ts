/* Renderer-independent procedural primitives. */
type P00ProceduralJsonPrimitive = string | number | boolean | null;
type P00ProceduralJsonValue =
  P00ProceduralJsonPrimitive | P00ProceduralJsonValue[] | { [key: string]: P00ProceduralJsonValue };
interface P00ProceduralJsonObject {
  [key: string]: P00ProceduralJsonValue;
}

interface P00ProceduralData {
  clone(value: unknown, path?: string): P00ProceduralJsonValue;
  freeze<T>(value: T): T;
  merge(a: unknown, b: unknown): P00ProceduralJsonObject;
  hash(text: string, seed?: number): number;
  isImmutable(value: unknown): value is object;
}

interface P00ProceduralNamespace {
  data?: P00ProceduralData;
}

interface P00ProceduralKitHost {
  procedural: P00ProceduralNamespace;
}

declare const KIT: P00ProceduralKitHost;

(function (K: P00ProceduralKitHost) {
  const A: P00ProceduralNamespace = (K.procedural = {});
  function json(value: unknown, path?: string): P00ProceduralJsonValue {
    path = path || '$';
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (Array.isArray(value)) return Array.from(value, (v: unknown, i: number) => json(v, path + '[' + i + ']'));
    if (
      value &&
      typeof value === 'object' &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
    ) {
      const out: P00ProceduralJsonObject = {};
      for (const key of Object.keys(value)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error(path + ': unsafe key ' + key);
        out[key] = json((value as Record<string, unknown>)[key], path + '.' + key);
      }
      return out;
    }
    throw new Error(path + ': expected finite JSON data');
  }
  const frozenNodes = new WeakSet<object>();
  function freeze<T>(value: T): T {
    if (value && typeof value === 'object') {
      if (frozenNodes.has(value)) return value;
      for (const v of Object.values(value)) freeze(v);
      Object.freeze(value);
      frozenNodes.add(value);
    }
    return value;
  }
  function merge(a: unknown, b: unknown): P00ProceduralJsonObject {
    const out = json(a) as P00ProceduralJsonObject;
    for (const [key, v] of Object.entries(json(b) as P00ProceduralJsonObject)) {
      out[key] =
        v &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        out[key] &&
        typeof out[key] === 'object' &&
        !Array.isArray(out[key])
          ? merge(out[key], v)
          : v;
    }
    return out;
  }
  function hash(text: string, seed?: number): number {
    let h = seed === undefined ? 2166136261 : seed >>> 0;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  A.data = Object.freeze({
    clone: json,
    freeze,
    merge,
    hash,
    isImmutable: (value: unknown): value is object => frozenNodes.has(value as object)
  });
})(KIT);

export {};
