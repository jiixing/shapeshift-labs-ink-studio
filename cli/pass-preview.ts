import fs = require('node:fs');
import path = require('node:path');

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
type PassChannel = 'color' | ArtPassChannel;
type PassBuffer = Float32Array | Uint8Array | Uint32Array;
type PassValue = PassBuffer | readonly unknown[] | undefined;

interface RenderPasses {
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
  [channel: string]: PassValue;
}

interface RenderFrame {
  w: number;
  h: number;
  px?: number;
  rgb: Uint8Array;
  alpha?: Uint8Array;
  passes: RenderPasses;
}

interface RasterImage {
  w: number;
  h: number;
  rgb: Uint8Array;
}

interface RendererBoundary {
  upscale(frame: RenderFrame, scale: number): RasterImage;
}

interface ArtPassesBoundary {
  channels: readonly ArtPassChannel[];
}

interface PNGBoundary {
  write(file: string, width: number, height: number, rgb: Uint8Array): void;
}

interface DepthRange {
  near: number;
  far: number;
}

interface PassManifest {
  width: number;
  height: number;
  scale: number;
  rows: 'top-down';
  files: Record<string, string>;
  objects?: readonly unknown[];
  materials?: readonly unknown[];
  depth?: DepthRange | null;
}

const PNG = require('./png.js') as PNGBoundary;
const { upscale } = require('./render.js') as RendererBoundary;
const { channels } = require('../src/art-passes.js') as ArtPassesBoundary;

const byte = (value: number): number => Math.round(Math.max(0, Math.min(1, value)) * 255);

function writePasses(directory: string, frame: RenderFrame, scale = 1): PassManifest {
  const passes = frame.passes;
  const manifest: PassManifest = { width: frame.w, height: frame.h, scale, rows: 'top-down', files: {} };
  if (passes.objects) manifest.objects = passes.objects;
  if (passes.materials) manifest.materials = passes.materials;
  let near = Infinity,
    far = -Infinity;
  if (passes.depth || passes.emissionDepth) {
    for (const depth of (passes.depth || passes.emissionDepth)!)
      if (Number.isFinite(depth)) {
        near = Math.min(near, depth);
        far = Math.max(far, depth);
      }
    manifest.depth = Number.isFinite(near) ? { near, far } : null;
  }
  fs.mkdirSync(directory, { recursive: true });
  for (const channel of ['color', ...channels] as PassChannel[]) {
    if (channel === 'position' || channel === 'objectPosition') continue;
    const data = (channel === 'color' ? frame.rgb : passes[channel]) as PassBuffer | undefined;
    if (!data) continue;
    let rgb: Uint8Array;
    if (channel === 'color') rgb = data as Uint8Array;
    else {
      rgb = new Uint8Array(frame.w * frame.h * 3);
      for (let p = 0; p < frame.w * frame.h; p++) {
        const q = p * 3;
        if (channel === 'coverage' || channel === 'protected') rgb.fill(byte(data[p]), q, q + 3);
        else if (channel === 'depth') {
          if (Number.isFinite(data[p])) rgb.fill(byte(1 - (0.85 * (data[p] - near)) / (far - near || 1)), q, q + 3);
        } else if (channel === 'normal') {
          if (data[q] || data[q + 1] || data[q + 2])
            for (let c = 0; c < 3; c++) rgb[q + c] = byte(data[q + c] * 0.5 + 0.5);
        } else if (channel === 'motion' || channel === 'emissionMotion') {
          rgb[q] = byte(0.5 + data[p * 2] / 8);
          rgb[q + 1] = byte(0.5 + data[p * 2 + 1] / 8);
        } else if (channel === 'emission') {
          for (let c = 0; c < 3; c++) rgb[q + c] = byte(data[q + c]);
        } else if (data[p]) {
          const hash = Math.imul(data[p], 0x9e3779b1);
          for (let c = 0; c < 3; c++) rgb[q + c] = 48 + ((hash >>> (8 * c)) & 191);
        }
      }
    }
    const image = scale === 1 ? { ...frame, rgb } : upscale({ ...frame, rgb }, scale);
    const file = channel + '.png';
    PNG.write(path.join(directory, file), image.w, image.h, image.rgb);
    manifest.files[channel] = file;
  }
  fs.writeFileSync(path.join(directory, 'passes.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

export = { writePasses };
