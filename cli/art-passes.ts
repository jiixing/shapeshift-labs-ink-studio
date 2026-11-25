type Vec3 = [number, number, number];
type Matrix3 = number[];
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
type ArtPassRequest = boolean | readonly string[] | null | undefined;
type PassArray = Float32Array | Uint8Array | Uint32Array;
type PassArrayConstructor<T extends PassArray> = new (length: number) => T;

interface CameraRay {
  origin: Vec3;
  direction: Vec3;
  axial: number;
}

type CameraRayAt = (x: number, y: number) => CameraRay;

interface MatrixApi {
  det(matrix: ArrayLike<number>): number;
  inv(matrix: ArrayLike<number>): Matrix3;
  tr(matrix: ArrayLike<number>): Matrix3;
  app(matrix: ArrayLike<number>, vector: Vec3): Vec3;
}

interface InkLibrary {
  KIT: {
    M: MatrixApi;
  };
}

interface InkIndex {
  load(): InkLibrary;
}

interface ArtPassesModule {
  channels: readonly ArtPassChannel[];
  select(request: ArtPassRequest): readonly ArtPassChannel[];
  over(value: number, below: number, alpha: number): number;
  ownsSurface(alpha: number, writesDepth: boolean, depth: number, nearest: number): boolean;
}

interface SurfaceLookModule {
  readonly STRIDE: number;
}

interface SceneOpticsCli {
  surfacePoint(ray: CameraRay, normal: Vec3, x: number, y: number, z: number, axialDepth: number, radius: number): Vec3;
}

interface RenderMetadata {
  normals?: Float32Array;
  objectIds?: ArrayLike<number>;
  materialIds?: ArrayLike<number>;
  objects?: readonly unknown[];
  materials?: readonly unknown[];
}

interface ArtPassRig {
  free?: ArrayLike<number>;
  bid: ArrayLike<number>;
  M: Float32Array;
}

interface ArtPassAnimation {
  rig?: ArtPassRig;
  bones?: Float32Array;
  base?: Float32Array;
}

interface ArtPassWorld {
  renderMetadata?: RenderMetadata;
  pix?: Float32Array;
  surfaceData?: Float32Array;
  anim?: ArtPassAnimation;
  data: Float32Array;
  rest?: Float32Array;
}

interface MatrixTransform {
  inverse: Matrix3;
  normal: Matrix3;
}

interface SampleFrame {
  normal: Vec3 | null;
  rest: Float32Array;
  localOffset(x: number, y: number, z: number): Vec3;
}

interface MotionReference {
  w: number;
  h: number;
  centers: Float32Array;
}

interface PassGeometry {
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  rayAt: CameraRayAt;
  span: number;
  detail: Uint8Array | null;
  sprM: Uint8Array | null;
  surfaceGlint: Uint8Array | null;
  centers: Float32Array | null;
  motionFrom?: MotionReference | null;
}

interface ArtPassResult {
  w: number;
  h: number;
  coverage?: Float32Array;
  emission?: Float32Array;
  emissionDepth?: Float32Array;
  protected?: Uint8Array;
  depth?: Float32Array;
  normal?: Float32Array;
  position?: Float32Array;
  objectPosition?: Float32Array;
  motion?: Float32Array;
  emissionMotion?: Float32Array;
  splatId?: Uint32Array;
  objectId?: Uint32Array;
  materialId?: Uint32Array;
  objects?: readonly unknown[];
  materials?: readonly unknown[];
  [channel: string]: unknown;
}

interface ArtPassBuilder {
  fragment(
    pixel: number,
    index: number,
    alpha: number,
    solid: boolean,
    depth: number,
    emits: boolean,
    r: number,
    g: number,
    b: number
  ): void;
  sprite(pixel: number, index: number, depth: number): void;
  finalize(world: ArtPassWorld, time: number, geometry: PassGeometry): ArtPassResult;
}

const ArtPasses = require('../src/art-passes.js') as ArtPassesModule;
const SurfaceLook = require('../src/surface-look.js') as SurfaceLookModule;
const { surfacePoint } = require('./scene-optics.js') as SceneOpticsCli;

function sampleFrames(world: ArtPassWorld, time: number): (index: number) => SampleFrame {
  const { renderMetadata, pix, surfaceData, anim, data, rest } = world;
  const rig = anim?.rig,
    bones = anim?.bones;
  const matrices = new Map<string, MatrixTransform | null>();
  const M = rig || bones ? (require('../index.js') as InkIndex).load().KIT.M : null;
  function sample(i: number): SampleFrame {
    const offset = i * 3,
      p = i * 8,
      surfaceOffset = i * SurfaceLook.STRIDE,
      q = i * 16;
    let normal: Vec3 | undefined;
    if (pix?.[p]) normal = [pix[p + 3], pix[p + 4], pix[p + 5]];
    else if (
      renderMetadata?.normals?.[offset] ||
      renderMetadata?.normals?.[offset + 1] ||
      renderMetadata?.normals?.[offset + 2]
    )
      normal = Array.from(renderMetadata.normals.subarray(offset, offset + 3)) as Vec3;
    else if (surfaceData?.[surfaceOffset])
      normal = [surfaceData[surfaceOffset + 1], surfaceData[surfaceOffset + 2], surfaceData[surfaceOffset + 3]];

    const packed = Math.round(data[q + 11]),
      kind = packed % 16;
    const part = rig?.free?.[i] ? 0 : rig?.bid[i] || 0;
    const restKind = Math.round(rest?.[q + 11] || 0) % 16;
    const skinned = bones && (restKind === 12 || restKind === 13);
    const matrix = part ? rig!.M : skinned ? bones : null;
    const bone = part || (skinned ? rest![q + 12] : 0);
    const blend = skinned ? rest![q + 14] : 0;
    const second = blend ? rest![q + 13] : 0;
    if (matrix) {
      const key = [part ? 'rig' : 'bones', bone, second, blend].join(',');
      if (!matrices.has(key)) {
        const rows = matrix.slice(bone * 12, bone * 12 + 9);
        if (blend) for (let j = 0; j < 9; j++) rows[j] += (matrix[second * 12 + j] - rows[j]) * blend;
        const inverse = Math.abs(M!.det(rows)) > 1e-8 ? M!.inv(rows) : null;
        matrices.set(key, inverse && { inverse, normal: M!.tr(inverse) });
      }
    }
    const transform = matrix ? matrices.get([part ? 'rig' : 'bones', bone, second, blend].join(',')) : null;
    const angle = kind === 5 ? time * data[q + 13] : 0;
    const c = Math.cos(angle),
      s = Math.sin(angle);
    if (normal && transform) normal = M!.app(transform.normal, normal);
    if (normal && angle) normal = [c * normal[0] + s * normal[2], normal[1], c * normal[2] - s * normal[0]];
    const length = normal && Math.hypot(...normal);
    return {
      normal: length !== undefined && length > 1e-8 ? (normal!.map(value => value / length) as Vec3) : null,
      rest: (skinned ? rest! : anim?.base instanceof Float32Array ? anim.base : rest || data).subarray(q, q + 3),
      localOffset(x, y, z) {
        const offset: Vec3 = [c * x - s * z, y, c * z + s * x];
        return transform ? M!.app(transform.inverse, offset) : offset;
      }
    };
  }
  return sample;
}

function createArtPasses(request: ArtPassRequest, w: number, h: number): ArtPassBuilder | null {
  const selected = new Set(ArtPasses.select(request));
  if (!selected.size) return null;
  const size = w * h;
  const coverage = selected.has('coverage') ? new Float32Array(size) : null;
  const emission = selected.has('emission') ? new Float32Array(size * 3) : null;
  const emissionOwner = selected.has('emissionMotion') ? new Int32Array(size).fill(-1) : null;
  const emissionDepth = selected.has('emissionDepth') || emissionOwner ? new Float32Array(size).fill(Infinity) : null;
  const needsOwner = [...selected].some(
    channel => !['emission', 'emissionDepth', 'emissionMotion', 'coverage', 'protected'].includes(channel)
  );
  const owner = needsOwner ? new Int32Array(size).fill(-1) : null;
  const depth = needsOwner ? new Float32Array(size).fill(Infinity) : null;

  function fragment(
    p: number,
    i: number,
    a: number,
    solid: boolean,
    z: number,
    emits: boolean,
    r: number,
    g: number,
    b: number
  ): void {
    if (coverage) coverage[p] = a + coverage[p] * (1 - a);
    if (emission) {
      const j = p * 3;
      if (emits || emission[j] || emission[j + 1] || emission[j + 2]) {
        emission[j] = ArtPasses.over(emits ? r : 0, emission[j], a);
        emission[j + 1] = ArtPasses.over(emits ? g : 0, emission[j + 1], a);
        emission[j + 2] = ArtPasses.over(emits ? b : 0, emission[j + 2], a);
      }
    }
    if (emissionDepth && a > 0.03) {
      if (emits && z <= emissionDepth[p]) {
        emissionDepth[p] = z;
        if (emissionOwner) emissionOwner[p] = i;
      } else if (!emits && solid && a > 0.97 && z <= emissionDepth[p]) {
        emissionDepth[p] = Infinity;
        if (emissionOwner) emissionOwner[p] = -1;
      }
    }
    if (owner && ArtPasses.ownsSurface(a, solid, z, depth![p])) {
      owner[p] = i;
      depth![p] = z;
    }
  }

  function sprite(p: number, i: number, z: number): void {
    if (coverage) coverage[p] = 1;
    if (emission) emission.fill(0, p * 3, p * 3 + 3);
    if (emissionDepth) emissionDepth[p] = Infinity;
    if (emissionOwner) emissionOwner[p] = -1;
    if (owner) {
      owner[p] = i;
      depth![p] = z;
    }
  }

  function finalize(world: ArtPassWorld, time: number, geometry: PassGeometry): ArtPassResult {
    const topDown = <T extends PassArray>(values: T, components: number): T => {
      const out = new (values.constructor as PassArrayConstructor<T>)(values.length);
      const row = w * components;
      for (let y = 0; y < h; y++) out.set(values.subarray(y * row, (y + 1) * row), (h - 1 - y) * row);
      return out;
    };
    const result: ArtPassResult = { w, h };
    if (coverage) result.coverage = topDown(coverage, 1);
    if (emission) result.emission = topDown(emission, 3);
    if (selected.has('emissionDepth')) result.emissionDepth = topDown(emissionDepth!, 1);
    if (selected.has('protected')) {
      const { detail, sprM, surfaceGlint } = geometry;
      result.protected = new Uint8Array(size);
      for (let p = 0; p < size; p++) {
        const bottom = (h - 1 - Math.floor(p / w)) * w + (p % w);
        result.protected[p] = Number(Boolean(detail?.[p] || sprM?.[bottom] || surfaceGlint?.[bottom]));
      }
    }
    if (selected.has('depth')) result.depth = topDown(depth!, 1);
    const normalOut = selected.has('normal') ? new Float32Array(size * 3) : null;
    const positionOut = selected.has('position') ? new Float32Array(size * 3) : null;
    const objectOut = selected.has('objectPosition') ? new Float32Array(size * 3) : null;
    if (normalOut || positionOut || objectOut) {
      const frames = new Map<number, SampleFrame>(),
        sample = sampleFrames(world, time);
      for (let p = 0; p < size; p++) {
        const i = owner![p];
        if (i < 0) continue;
        if (!frames.has(i)) frames.set(i, sample(i));
        const frame = frames.get(i)!;
        if (normalOut && frame.normal) normalOut.set(frame.normal, p * 3);
        if (!positionOut && !objectOut) continue;
        const x = geometry.x[i],
          y = geometry.y[i],
          z = geometry.z[i];
        const hit = frame.normal
          ? surfacePoint(
              geometry.rayAt((p % w) + 0.5, Math.floor(p / w) + 0.5),
              frame.normal,
              x,
              y,
              z,
              depth![p],
              geometry.span
            )
          : [x, y, z];
        if (positionOut) positionOut.set(hit, p * 3);
        if (objectOut) {
          const offset = frame.localOffset(hit[0] - x, hit[1] - y, hit[2] - z);
          for (let k = 0; k < 3; k++) objectOut[p * 3 + k] = (frame.rest[k] ?? 0) + offset[k];
        }
      }
      if (normalOut) result.normal = topDown(normalOut, 3);
      if (positionOut) result.position = topDown(positionOut, 3);
      if (objectOut) result.objectPosition = topDown(objectOut, 3);
    }
    for (const [channel, ids] of [
      ['motion', owner],
      ['emissionMotion', emissionOwner]
    ] as const) {
      if (!selected.has(channel)) continue;
      const vectors = new Float32Array(size * 2);
      const previous = geometry.motionFrom;
      const centers = geometry.centers!;
      if (previous?.w === w && previous.h === h && previous.centers.length === centers.length) {
        for (let p = 0; p < size; p++) {
          const i = ids![p] * 2;
          if (i < 0 || !Number.isFinite(previous.centers[i]) || !Number.isFinite(centers[i])) continue;
          vectors[p * 2] = centers[i] - previous.centers[i];
          vectors[p * 2 + 1] = centers[i + 1] - previous.centers[i + 1];
        }
      }
      result[channel] = topDown(vectors, 2);
    }
    if (selected.has('splatId'))
      result.splatId = topDown(
        Uint32Array.from(owner!, i => i + 1),
        1
      );
    for (const [channel, names] of [
      ['objectId', 'objects'],
      ['materialId', 'materials']
    ] as const) {
      if (!selected.has(channel)) continue;
      const ids = world.renderMetadata?.[channel === 'objectId' ? 'objectIds' : 'materialIds'];
      result[channel] = topDown(
        Uint32Array.from(owner!, i => ids?.[i] || 0),
        1
      );
      result[names] = world.renderMetadata?.[names] || [null];
    }
    return result;
  }

  return { fragment, sprite, finalize };
}

export = { createArtPasses, sampleFrames };
