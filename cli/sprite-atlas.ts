import fs = require('node:fs');
import path = require('node:path');

type Vec3 = [number, number, number];
type AtlasMap = 'depth' | 'normal' | 'emission';
type AtlasDepthRange = [number, number];

interface AtlasWorld {
  cam: {
    target: Vec3;
    yaw: number;
    [key: string]: unknown;
  };
  anim?: {
    update(dt: number, time: number): void;
    [key: string]: unknown;
  };
  volumeQuality?: {
    jitter?: string;
  };
  [key: string]: unknown;
}

interface AtlasHistoryFrame {
  time: number;
  w: number;
  h: number;
  passes: AtlasPasses;
  world?: AtlasWorld;
}

interface ArtHistory {
  push(frame: AtlasHistoryFrame): void;
  previous(time: number, width: number, height: number, world?: AtlasWorld): AtlasHistoryFrame[];
  clear(): void;
}

interface VolumeHistory {
  filter<T extends ArrayLike<number> & { slice(): T }>(
    color: T,
    depth: ArrayLike<number>,
    time: number,
    key: unknown
  ): T;
  clear(): void;
}

interface AtlasRenderOptions {
  t?: number;
  w?: number;
  h?: number;
  px?: number;
  yaw?: number;
  ortho?: boolean;
  target?: Vec3;
  transparent?: boolean;
  passes?: readonly AtlasMap[];
  artHistory?: ArtHistory;
  volumeHistory?: VolumeHistory;
  volumeQuality?: {
    jitter?: string;
  };
  [key: string]: unknown;
}

interface AtlasPasses {
  depth?: Float32Array;
  normal?: Float32Array;
  emission?: Float32Array;
}

interface AtlasRenderFrame {
  w: number;
  h: number;
  rgb: Uint8Array;
  alpha: Uint8Array;
  passes: AtlasPasses;
}

interface AtlasOptions {
  width?: number;
  height?: number;
  directions?: number;
  times?: number[];
  fps?: number;
  columns?: number;
  pivot?: Vec3;
  yaw?: number;
  maps?: AtlasMap[];
  pose?: (world: AtlasWorld, time: number) => void;
  view?: AtlasRenderOptions;
  depthRange?: AtlasDepthRange;
}

interface AtlasImages {
  color: Uint8Array;
  depth?: Uint8Array;
  normal?: Uint8Array;
  emission?: Uint8Array;
}

interface AtlasFrameEntry {
  frame: number;
  direction: number;
  yaw: number;
  time: number;
  duration: number;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  pivot: {
    x: number;
    y: number;
  };
}

interface AtlasMetadata {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  directions: number;
  fps: number;
  pivot: Vec3;
  frames: AtlasFrameEntry[];
  encodings: {
    color: string;
    depth?: {
      range: AtlasDepthRange | null;
      encoding: string;
    };
    normal?: string;
    emission?: string;
  };
}

interface AtlasResult {
  images: AtlasImages;
  metadata: AtlasMetadata;
}

interface RendererBoundary {
  render(world: AtlasWorld, options: AtlasRenderOptions): AtlasRenderFrame;
}

interface ArtEffectsBoundary {
  history(options: { frames?: number }): ArtHistory;
}

interface SceneOpticsBoundary {
  volumeHistory(): VolumeHistory;
}

interface PNGBoundary {
  encode(width: number, height: number, pixels: Uint8Array, channels?: 3 | 4): Buffer;
}

const PNG = require('./png.js') as PNGBoundary;
const { render } = require('./render.js') as RendererBoundary;
const ArtEffects = require('../src/art-effects.js') as ArtEffectsBoundary;

const mapNames: readonly AtlasMap[] = ['depth', 'normal', 'emission'];
const byte = (value: number): number => Math.round(Math.max(0, Math.min(1, value)) * 255);
const integer = (value: number, lo: number, hi: number): boolean =>
  Number.isSafeInteger(value) && value >= lo && value <= hi;

function spriteAtlas(world: AtlasWorld, options: AtlasOptions = {}): AtlasResult {
  const {
    width = 96,
    height = 96,
    directions = 8,
    times = [0],
    fps = 12,
    columns = directions,
    pivot = world.cam.target,
    yaw = world.cam.yaw,
    maps = [],
    pose,
    view = {},
    depthRange
  } = options;
  if (
    !integer(width, 1, 2048) ||
    !integer(height, 1, 2048) ||
    !integer(directions, 1, 64) ||
    !integer(columns, 1, 256) ||
    !Number.isFinite(fps) ||
    fps <= 0 ||
    fps > 240 ||
    !Array.isArray(times) ||
    !times.length ||
    times.length > 512 ||
    times.some((time, i) => !Number.isFinite(time) || time < 0 || (i && time <= times[i - 1])) ||
    !Array.isArray(pivot) ||
    pivot.length !== 3 ||
    !pivot.every(Number.isFinite) ||
    !Number.isFinite(yaw) ||
    !Array.isArray(maps) ||
    maps.some(map => !mapNames.includes(map)) ||
    (pose !== undefined && typeof pose !== 'function')
  )
    throw new RangeError('Invalid sprite atlas dimensions, timing, directions, pivot or maps');
  const requested = [...new Set(maps)];
  const count = times.length * directions,
    cols = Math.min(count, columns);
  const rows = Math.ceil(count / cols),
    w = width * cols,
    h = height * rows;
  if (w * h * (requested.length + 1) > 32e6) throw new RangeError('Sprite atlas exceeds its pixel budget');
  if (
    depthRange &&
    (!Array.isArray(depthRange) ||
      depthRange.length !== 2 ||
      !depthRange.every(Number.isFinite) ||
      depthRange[0] >= depthRange[1])
  )
    throw new RangeError('Sprite depth range must be an increasing finite pair');

  const images: AtlasImages = {
    color: new Uint8Array(w * h * 4),
    ...Object.fromEntries(requested.map(name => [name, new Uint8Array(w * h * 4)]))
  };
  const depths = requested.includes('depth') ? new Float32Array(w * h).fill(Infinity) : null;
  let minDepth = Infinity,
    maxDepth = -Infinity;
  const entries: AtlasFrameEntry[] = [];
  const history = Array.from({ length: directions }, () => ArtEffects.history({ frames: 24 }));
  const { volumeHistory } = require('../src/scene-optics.js') as SceneOpticsBoundary;
  const volumes =
    view.volumeQuality?.jitter === 'spatiotemporal' || world.volumeQuality?.jitter === 'spatiotemporal'
      ? Array.from({ length: directions }, () => volumeHistory())
      : [];
  const orientation = Array.from({ length: directions }, (_, i) => yaw + (i * Math.PI * 2) / directions);
  for (let f = 0; f < times.length; f++) {
    const time = times[f];
    if (pose) pose(world, time);
    else world.anim?.update?.(f ? time - times[f - 1] : 0, time);
    const duration = f + 1 < times.length ? times[f + 1] - time : 1 / fps;
    for (let direction = 0; direction < directions; direction++) {
      const i = f * directions + direction,
        ox = (i % cols) * width,
        oy = Math.floor(i / cols) * height;
      const image = render(world, {
        ...view,
        t: time,
        w: width,
        h: height,
        px: 1,
        yaw: orientation[direction],
        ortho: true,
        target: pivot,
        transparent: true,
        passes: requested,
        artHistory: history[direction],
        volumeHistory: volumes[direction]
      });
      const data = image.passes;
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const p = y * width + x,
            q = (y + oy) * w + x + ox,
            j = p * 3,
            k = q * 4;
          const alpha = image.alpha[p];
          if (alpha) {
            images.color[k] = image.rgb[j];
            images.color[k + 1] = image.rgb[j + 1];
            images.color[k + 2] = image.rgb[j + 2];
          }
          images.color[k + 3] = alpha;
          if (depths && Number.isFinite(data.depth![p])) {
            minDepth = Math.min(minDepth, data.depth![p]);
            maxDepth = Math.max(maxDepth, data.depth![p]);
            depths[q] = data.depth![p];
          }
          if (images.normal && (data.normal![j] || data.normal![j + 1] || data.normal![j + 2])) {
            for (let c = 0; c < 3; c++) images.normal[k + c] = byte(0.5 + data.normal![j + c] * 0.5);
            images.normal[k + 3] = 255;
          }
          if (images.emission) {
            for (let c = 0; c < 3; c++) images.emission[k + c] = byte(data.emission![j + c]);
            images.emission[k + 3] = Math.max(images.emission[k], images.emission[k + 1], images.emission[k + 2]);
          }
        }
      entries.push({
        frame: f,
        direction,
        yaw: orientation[direction],
        time,
        duration,
        rect: { x: ox, y: oy, width, height },
        pivot: { x: width / 2, y: height / 2 }
      });
    }
  }
  const range: AtlasDepthRange | null =
    depths && (depthRange || (Number.isFinite(minDepth) ? [minDepth, maxDepth] : null));
  if (range) {
    const [near, far] = range;
    for (let p = 0; p < depths!.length; p++)
      if (Number.isFinite(depths![p])) {
        const z = Math.round(0xffffff * Math.max(0, Math.min(1, (depths![p] - near) / (far - near || 1))));
        const q = p * 4;
        images.depth![q] = z >> 16;
        images.depth![q + 1] = (z >> 8) & 255;
        images.depth![q + 2] = z & 255;
        images.depth![q + 3] = 255;
      }
  }
  const metadata: AtlasMetadata = {
    width: w,
    height: h,
    tileWidth: width,
    tileHeight: height,
    directions,
    fps,
    pivot: pivot.slice() as Vec3,
    frames: entries,
    encodings: {
      color: 'straight RGBA',
      ...(images.depth && { depth: { range, encoding: 'camera-axis distance as RGB24, alpha marks a surface' } }),
      ...(images.normal && { normal: 'world XYZ mapped from [-1,1] to RGB, alpha marks a normal' }),
      ...(images.emission && { emission: 'visible premultiplied emissive RGB, alpha is max RGB' })
    }
  };
  return { images, metadata };
}

function writeAtlas(directory: string, { images, metadata }: AtlasResult) {
  fs.mkdirSync(directory, { recursive: true });
  const files: Record<string, string> = {};
  for (const [name, rgba] of Object.entries(images)) {
    const file = name + '.png';
    fs.writeFileSync(path.join(directory, file), PNG.encode(metadata.width, metadata.height, rgba, 4));
    files[name] = file;
  }
  fs.writeFileSync(path.join(directory, 'atlas.json'), JSON.stringify({ ...metadata, files }, null, 2) + '\n');
}

export = { spriteAtlas, writeAtlas };
