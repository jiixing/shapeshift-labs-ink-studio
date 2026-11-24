/* Shared art-pixel buffer names and splat ownership rules for CPU and shader hosts. */
type ArtPassChannel =
  | 'coverage'
  | 'depth'
  | 'normal'
  | 'objectId'
  | 'materialId'
  | 'emission'
  | 'splatId'
  | 'position'
  | 'objectPosition'
  | 'protected'
  | 'emissionDepth'
  | 'motion'
  | 'emissionMotion';

type ArtPassRequest = boolean | readonly ArtPassChannel[] | null | undefined;

interface ArtPassDimensions {
  w: number;
  h: number;
}

interface ArtPassBuffers extends ArtPassDimensions {
  [channel: string]: unknown;
  coverage?: Float32Array;
  depth?: Float32Array;
  normal?: Float32Array;
  objectId?: Uint32Array;
  materialId?: Uint32Array;
  emission?: Float32Array;
  splatId?: Uint32Array;
  position?: Float32Array;
  objectPosition?: Float32Array;
  protected?: Uint8Array;
  emissionDepth?: Float32Array;
  motion?: Float32Array;
  emissionMotion?: Float32Array;
  objects?: readonly unknown[];
  materials?: readonly unknown[];
}

const ArtPasses = (() => {
  const channels = Object.freeze([
    'coverage',
    'depth',
    'normal',
    'objectId',
    'materialId',
    'emission',
    'splatId',
    'position',
    'objectPosition',
    'protected',
    'emissionDepth',
    'motion',
    'emissionMotion'
  ] as const);
  const cutoff = 0.5;
  const ownsSurface = (alpha: number, writesDepth: boolean, depth: number, nearest: number): boolean =>
    writesDepth && alpha > cutoff && depth <= nearest;
  const over = (value: number, below: number, alpha: number): number => value * alpha + below * (1 - alpha);

  function select(request: ArtPassRequest): readonly ArtPassChannel[] {
    if (!request) return [];
    if (request === true) return channels;
    if (!Array.isArray(request) || request.some(channel => !channels.includes(channel)))
      throw new RangeError('Unknown art pass. Available passes: ' + channels.join(', '));
    return [...new Set(request)];
  }

  function subset(passes: ArtPassBuffers, selected: readonly ArtPassChannel[]): ArtPassBuffers {
    const output: ArtPassBuffers = { w: passes.w, h: passes.h };
    for (const channel of selected) output[channel as string] = passes[channel as string];
    if (output.objectId) output.objects = passes.objects;
    if (output.materialId) output.materials = passes.materials;
    return output;
  }

  const glsl = `
bool inkOwnsSurface(float alpha, bool writesDepth, float depth, float nearestDepth) {
  return writesDepth && alpha > 0.5 && depth <= nearestDepth;
}
float inkCoverageOver(float alpha, float below) { return alpha + below * (1.0 - alpha); }
vec3 inkEmissionOver(vec3 emission, vec3 below, float alpha) {
  return emission * alpha + below * (1.0 - alpha);
}
`;

  return Object.freeze({ channels, select, subset, cutoff, ownsSurface, over, glsl });
})();
if (typeof module !== 'undefined') module.exports = ArtPasses;
