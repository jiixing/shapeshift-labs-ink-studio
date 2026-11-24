/* Optional camera and sampling controls in native art pixels. */
type StabilityVector = readonly [number, number, number];
type StabilityDither = 'screen' | 'world' | 'object';
type StabilityResolve = 'native' | 'coverage' | 'clusters';
type StabilityColor = readonly [number, number, number];
type StabilityPalette = readonly StabilityColor[];

interface ArtStabilitySettings {
  snap?: boolean;
  anchor?: StabilityVector;
  dither?: StabilityDither;
  spacing?: number;
  resolve?: StabilityResolve;
  threshold?: number;
  protect?: readonly (string | number)[];
}

type ArtStabilityDefinition = boolean | ArtStabilitySettings | null | undefined;

interface PreparedArtStability {
  snap: boolean;
  anchor: StabilityVector;
  dither: StabilityDither;
  spacing: number;
  resolve: StabilityResolve;
  threshold: number;
  protect: Set<string>;
}

interface StabilityPasses {
  [channel: string]: unknown;
  coverage?: Float32Array;
  splatId?: Uint32Array;
  position?: Float32Array;
  objectPosition?: Float32Array;
  objectId?: Uint32Array;
  materialId?: Uint32Array;
  objects?: readonly unknown[];
  materials?: readonly unknown[];
  emission?: Float32Array;
  protected?: Uint8Array;
}

interface StabilityNativeFrame {
  w: number;
  h: number;
  color: Uint8Array;
  passes: StabilityPasses;
  detail?: Uint8Array;
}

interface StabilitySamplePasses {
  coverage: Float32Array;
}

interface StabilitySampleFrame {
  w: number;
  h: number;
  color: Uint8Array;
  alpha?: Uint8Array;
  passes: StabilitySamplePasses;
}

interface StabilityLocalOutput {
  packed: number[];
  rows: readonly (readonly number[])[];
}

interface StabilityLocalPalettes {
  at: ArrayLike<number>;
  palettes: readonly StabilityPalette[];
  output: StabilityLocalOutput;
}

interface StabilityTone {
  cutoff: number;
  stops: readonly (readonly [number, string])[];
  width: number;
  height: number;
  thresholds: ArrayLike<number>;
  palette: number[];
}

interface StabilityPixelLook {
  bayerRank(x: number, y: number): number;
  nearest(shade: readonly number[], palette: StabilityPalette, solid: boolean): number;
  toneIndex(tone: StabilityTone, r: number, g: number, b: number, x: number, y: number): number;
}

interface StabilityResolveOptions {
  local?: StabilityLocalPalettes | null;
  grade?: ArrayLike<number> | null;
  tone?: StabilityTone | null;
}

interface ResolvedStabilityFrame {
  w: number;
  h: number;
  rgb: Uint8Array;
  use: Uint32Array;
  detail: Uint8Array;
  palette?: readonly number[];
}

const ArtStability = (() => {
  function prepare(definition: ArtStabilityDefinition): PreparedArtStability | null {
    if (!definition) return null;
    const settings: ArtStabilitySettings = definition === true ? { snap: true } : definition;
    if (typeof settings !== 'object' || Array.isArray(settings))
      throw new TypeError('Expected pixel stability settings');
    const {
      snap = false,
      anchor = [0, 0, 0],
      dither = 'screen',
      spacing = 0.08,
      resolve = 'native',
      threshold = 0.4,
      protect = []
    } = settings;
    if (
      typeof snap !== 'boolean' ||
      !Array.isArray(anchor) ||
      anchor.length !== 3 ||
      !anchor.every(Number.isFinite) ||
      !['screen', 'world', 'object'].includes(dither) ||
      !Number.isFinite(spacing) ||
      spacing <= 0 ||
      !['native', 'coverage', 'clusters'].includes(resolve) ||
      !Number.isFinite(threshold) ||
      threshold <= 0 ||
      threshold > 1 ||
      !Array.isArray(protect) ||
      !protect.every(value => typeof value === 'string' || Number.isSafeInteger(value))
    )
      throw new RangeError('Invalid pixel stability settings');
    return { snap, anchor, dither, spacing, resolve, threshold, protect: new Set(protect.map(String)) };
  }

  function snapView(view: readonly number[], pixelsPerUnit: number, anchor: StabilityVector): number[] {
    const result = view.slice();
    for (let row = 0; row < 2; row++) {
      const position = anchor[0] * view[row] + anchor[1] * view[4 + row] + anchor[2] * view[8 + row] + view[12 + row];
      const snapped = Math.round(position * pixelsPerUnit) / pixelsPerUnit;
      result[row + 12] += snapped - position;
    }
    return result;
  }

  const modulo = (n: number, size: number): number => ((n % size) + size) % size;
  function ditherCoordinates(
    settings: PreparedArtStability | null | undefined,
    passes: StabilityPasses | null | undefined,
    p: number,
    x: number,
    y: number
  ): [number, number] {
    if (!settings || settings.dither === 'screen' || !passes?.splatId![p]) return [x, y];
    const coordinates = settings.dither === 'object' ? passes.objectPosition! : passes.position!;
    const q = p * 3;
    const ix = Math.floor(coordinates[q] / settings.spacing);
    const iy = Math.floor(coordinates[q + 1] / settings.spacing);
    const iz = Math.floor(coordinates[q + 2] / settings.spacing);
    // Mixing the three integer axes lets any axis-aligned surface use both pattern dimensions.
    return [ix + 3 * iy + 2 * iz, 2 * ix + iy + 3 * iz];
  }

  function protectedPixel(
    settings: PreparedArtStability | null | undefined,
    passes: StabilityPasses | null | undefined,
    p: number
  ): boolean {
    if (!settings || !passes) return false;
    const object = passes.objectId?.[p],
      material = passes.materialId?.[p];
    return (
      (object! > 0 && settings.protect.has(String(passes.objects![object!] ?? object))) ||
      (material! > 0 && settings.protect.has(String(passes.materials![material!] ?? material)))
    );
  }

  function resolve(
    native: StabilityNativeFrame,
    samples: StabilitySampleFrame,
    settings: PreparedArtStability,
    palette: StabilityPalette,
    pixelLook: StabilityPixelLook,
    dither: number,
    { local, grade, tone }: StabilityResolveOptions = {}
  ): ResolvedStabilityFrame {
    const { w, h, color, passes } = native,
      sw = samples.w;
    const rgb = new Uint8Array(w * h * 3),
      use = new Uint32Array(local?.output.packed.length ?? palette.length);
    const coverage = new Float32Array(w * h),
      detail = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = y * w + x,
          s = (y * sw + x) * 2;
        coverage[p] =
          (samples.passes.coverage[s] +
            samples.passes.coverage[s + 1] +
            samples.passes.coverage[s + sw] +
            samples.passes.coverage[s + sw + 1]) *
          0.25;
        const n = p * 3,
          light = passes.emission;
        detail[p] = !!(
          native.detail?.[p] ||
          passes.protected?.[p] ||
          protectedPixel(settings, passes, p) ||
          (light && Math.max(light[n], light[n + 1], light[n + 2]) > 0.12)
        ) as unknown as number;
      }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = y * w + x,
          s = (y * sw + x) * 2,
          q = p * 3;
        const c = ((h - 1 - y) * w + x) * 3;
        const [dx, dy] = ditherCoordinates(settings, passes, p, x, y);
        const bias = (pixelLook.bayerRank(dx, dy) - 0.5) * dither;
        const localId = local?.at[(h - 1 - y) * w + x];
        if (localId && (detail[p] || coverage[p] >= settings.threshold)) {
          const nativeShade: StabilityColor = [color[c] / 255, color[c + 1] / 255, color[c + 2] / 255];
          const index =
            local.output.rows[localId - 1][pixelLook.nearest(nativeShade, local.palettes[localId - 1], false)];
          use[index]++;
          const packed = local.output.packed[index];
          rgb[q] = packed >> 16;
          rgb[q + 1] = (packed >> 8) & 255;
          rgb[q + 2] = packed & 255;
          continue;
        }
        let threshold = settings.threshold,
          chosen = 0;
        if (settings.resolve === 'clusters' && coverage[p] > 0 && coverage[p] < 1) {
          const neighbor =
            (x > 0 && coverage[p - 1] >= threshold) ||
            (x + 1 < w && coverage[p + 1] >= threshold) ||
            (y > 0 && coverage[p - w] >= threshold) ||
            (y + 1 < h && coverage[p + w] >= threshold);
          threshold += neighbor ? -0.12 : 0.1;
        }
        if (detail[p] || coverage[p] >= threshold) {
          const votes = new Map<number, number>();
          if (coverage[p] < 0.98 && !detail[p]) {
            for (const j of [s, s + 1, s + sw, s + sw + 1]) {
              const weight = samples.passes.coverage[j];
              if (weight < 0.06) continue;
              const iy = (sw * (samples.h - 1 - Math.floor(j / sw)) + (j % sw)) * 3,
                a = weight || 1;
              // The raw samples are composited against palette zero. Recover the foreground.
              const shade = palette[0].map((bg, k) => {
                const value = samples.color[iy + k] / 255;
                const foreground = samples.alpha ? value : (value - bg * (1 - a)) / a;
                return Math.max(0, Math.min(1, foreground + bias));
              }) as unknown as StabilityColor;
              const index = tone
                ? pixelLook.toneIndex(tone, ...shade, dx, dy)
                : pixelLook.nearest(shade, palette, true);
              votes.set(index, (votes.get(index) || 0) + weight);
            }
          }
          const shade: StabilityColor = [color[c] / 255, color[c + 1] / 255, color[c + 2] / 255];
          chosen = tone
            ? pixelLook.toneIndex(tone, ...shade, dx, dy)
            : pixelLook.nearest(
                shade.map(value => value + bias),
                palette,
                !detail[p]
              );
          let best = votes.get(chosen) || 0;
          for (const [index, weight] of votes)
            if (weight > best) {
              chosen = index;
              best = weight;
            }
        }
        use[chosen]++;
        for (let k = 0; k < 3; k++) rgb[q + k] = Math.round((grade ? grade[chosen * 3 + k] : palette[chosen][k]) * 255);
      }
    return {
      w,
      h,
      rgb,
      use,
      detail,
      ...((local || tone) && { palette: local?.output.packed || tone!.palette })
    };
  }

  return Object.freeze({ prepare, snapView, modulo, ditherCoordinates, protectedPixel, resolve });
})();
if (typeof module !== 'undefined') module.exports = ArtStability;
