import fs = require('node:fs');
import path = require('node:path');

interface PngRaster {
  w: number;
  h: number;
  max: number;
  data: Uint8Array | Uint16Array;
}

interface PNGBoundary {
  raster(file: string | Buffer): PngRaster;
}

type RasterFrameData = number[] | { data: number[]; [key: string]: unknown } | Uint8Array;
type RasterFrameSource = string | RasterFrameData;

interface RasterLayer {
  frames: RasterFrameSource[];
  opacity?: number;
  [key: string]: unknown;
}

interface RasterManifest {
  width: number;
  height: number;
  layers: Record<string, RasterLayer>;
  fps?: number;
  tags?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ResolvedRasterLayer extends Omit<RasterLayer, 'frames'> {
  frames: RasterFrameData[];
}

interface ResolvedRasterManifest extends Omit<RasterManifest, 'layers'> {
  layers: Record<string, ResolvedRasterLayer>;
}

const { raster } = require('./png.js') as PNGBoundary;

function readRasterAsset<T>(file: string, create: (manifest: ResolvedRasterManifest) => T): T {
  const location = path.resolve(file),
    directory = path.dirname(location);
  const manifest = JSON.parse(fs.readFileSync(location, 'utf8')) as RasterManifest;
  if (!manifest || typeof manifest.layers !== 'object' || !manifest.layers)
    throw new TypeError('Raster manifest needs layers');
  const { width, height } = manifest;
  let channels = 0;
  const layers: Record<string, ResolvedRasterLayer> = Object.fromEntries(
    Object.entries(manifest.layers).map(([name, layer]): [string, ResolvedRasterLayer] => {
      if (!Array.isArray(layer?.frames)) throw new TypeError('Raster layer needs frames: ' + name);
      const frames = layer.frames.map((frame): RasterFrameData => {
        if (typeof frame !== 'string') return frame;
        const image = raster(path.resolve(directory, frame));
        if (image.w !== width || image.h !== height)
          throw new RangeError('Raster image dimensions do not match manifest: ' + frame);
        channels += image.data.length;
        if (channels > 64e6) throw new RangeError('Raster manifest exceeds the pixel budget');
        return image.max === 255
          ? (image.data as Uint8Array)
          : Uint8Array.from(image.data, value => Math.round((value * 255) / image.max));
      });
      return [name, { ...layer, frames }];
    })
  );
  return create({ ...manifest, layers });
}

export = { readRasterAsset };
