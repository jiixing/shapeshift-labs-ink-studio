/* Stable world-space candidates. Density reveals additional ranked slots rather
   than rerolling existing instances. A consumer supplies habitat/ownership data;
   this service knows nothing about vegetation, painting, terrain or rendering. */
type P14StablePopulationsVec2 = [number, number];
type P14StablePopulationsVec3 = [number, number, number];
type P14StablePopulationsCell = [number, number];

interface P14StablePopulationsBounds {
  min: P14StablePopulationsVec3;
  max: P14StablePopulationsVec3;
}

interface P14StablePopulationsExclusionInput {
  distance: number;
  maxDistance?: number;
  species?: Record<string, Record<string, number>>;
  maxComparisons?: number;
}

interface P14StablePopulationsExclusion {
  distance: number;
  maxDistance: number;
  species: Record<string, Record<string, number>>;
  maxComparisons: number;
}

interface P14StablePopulationsConfig {
  spacing?: number;
  jitter?: number;
  slots?: number;
  seed?: number;
  maxCandidates?: number;
  maxInstances?: number;
  exclusion?: P14StablePopulationsExclusionInput;
}

interface P14StablePopulationsParameters {
  spacing: number;
  jitter: number;
  slots: number;
  seed: number;
  maxCandidates: number;
  maxInstances: number;
  exclusion?: P14StablePopulationsExclusion;
}

interface P14StablePopulationsCandidate {
  key: string;
  index: P14StablePopulationsCell;
  slot: number;
  point: P14StablePopulationsVec2;
  rank: number;
  seed: number;
  yaw: number;
  scale: number;
}

interface P14StablePopulationsSample {
  density: number;
  minDistance?: number;
  species?: string;
  [key: string]: unknown;
}

type P14StablePopulationsEvaluator = (
  x: number,
  z: number,
  candidate: P14StablePopulationsCandidate
) => P14StablePopulationsSample | null | undefined;

interface P14StablePopulationsEligible {
  candidate: P14StablePopulationsCandidate;
  sample: P14StablePopulationsSample;
  minimum: number;
  kind: string;
}

interface P14StablePopulationsCellState {
  all: P14StablePopulationsCandidate[];
  eligible: P14StablePopulationsEligible[];
}

interface P14StablePopulationsSpacingFilter {
  at(x: number, z: number): P14StablePopulationsCellState;
  accept(current: P14StablePopulationsEligible): boolean;
  work(): { evaluated: number; comparisons: number };
}

interface P14StablePopulationsInstance extends P14StablePopulationsCandidate {
  sample: P14StablePopulationsSample;
}

interface P14StablePopulationsSampling {
  cells: number;
  candidates: number;
  evaluated?: number;
  comparisons?: number;
}

interface P14StablePopulationsLayout {
  parameters: P14StablePopulationsParameters;
  instances: P14StablePopulationsInstance[];
  sampling: P14StablePopulationsSampling;
}

type P14StablePopulationsParametersFunction = (raw?: P14StablePopulationsConfig) => P14StablePopulationsParameters;
type P14StablePopulationsLayoutFunction = (
  regions: readonly P14StablePopulationsBounds[],
  evaluate: P14StablePopulationsEvaluator,
  raw?: P14StablePopulationsConfig
) => P14StablePopulationsLayout;

interface P14StablePopulationsData {
  clone<T>(value: T): T;
  freeze<T>(value: T): T;
}

interface P14StablePopulationsApi {
  data: P14StablePopulationsData;
  populations: {
    parameters: P14StablePopulationsParametersFunction;
    layout: P14StablePopulationsLayoutFunction;
  };
}

interface P14StablePopulationsKitHost {
  procedural: P14StablePopulationsApi;
  hash(a: number, b?: number, c?: number): number;
}

declare const KIT: P14StablePopulationsKitHost;

(function (K: P14StablePopulationsKitHost) {
  const A = K.procedural;
  function parameters(raw: P14StablePopulationsConfig = {}): P14StablePopulationsParameters {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Populations need configuration');
    const p = Object.assign(
      { spacing: 0.42, jitter: 0.9, slots: 4, seed: 0, maxCandidates: 160000, maxInstances: 16000 },
      A.data.clone(raw)
    );
    if (
      !Number.isFinite(p.spacing) ||
      p.spacing < 0.1 ||
      p.spacing > 8 ||
      !Number.isFinite(p.jitter) ||
      p.jitter < 0 ||
      p.jitter > 1 ||
      !Number.isSafeInteger(p.slots) ||
      p.slots < 1 ||
      p.slots > 8 ||
      !Number.isSafeInteger(p.seed) ||
      Math.abs(p.seed) > 4294967295 ||
      !Number.isSafeInteger(p.maxCandidates) ||
      p.maxCandidates < 1 ||
      p.maxCandidates > 500000 ||
      !Number.isSafeInteger(p.maxInstances) ||
      p.maxInstances < 1 ||
      p.maxInstances > 50000
    )
      throw new Error('Invalid population spacing, slots, seed or budgets');
    if (p.exclusion !== undefined) {
      const { distance, maxDistance = distance, species = {}, maxComparisons = 3000000 } = p.exclusion ?? {};
      const separation = (n: number) => Number.isFinite(n) && n >= 0 && n <= maxDistance;
      const table = (o: unknown) => o && typeof o === 'object' && !Array.isArray(o);
      if (
        !table(p.exclusion) ||
        !separation(distance) ||
        !Number.isFinite(maxDistance) ||
        maxDistance > 64 * p.spacing ||
        !table(species) ||
        Object.values(species).some(row => !table(row) || Object.values(row).some(n => !separation(n))) ||
        !Number.isSafeInteger(maxComparisons) ||
        maxComparisons < 1 ||
        maxComparisons > 30000000
      )
        throw new Error('Invalid population exclusion distances or comparison budget');
      p.exclusion = { distance, maxDistance, species, maxComparisons };
    }
    return A.data.freeze(p) as P14StablePopulationsParameters;
  }
  function bounds(b: P14StablePopulationsBounds): P14StablePopulationsBounds {
    if (
      !b ||
      ![b.min, b.max].every(q => Array.isArray(q) && q.length === 3 && q.every(Number.isFinite)) ||
      b.min.some((v, i) => v > b.max[i]) ||
      [b.min[0], b.min[2], b.max[0], b.max[2]].some(v => Math.abs(v) > 1e6)
    )
      throw new Error('Populations need finite ordered bounds within the coordinate budget');
    return b;
  }
  function candidateAt(
    x: number,
    z: number,
    slot: number,
    p: P14StablePopulationsParameters
  ): P14StablePopulationsCandidate {
    const seed = p.seed + slot * 1291,
      point: P14StablePopulationsVec2 = [
        (x + 0.5 + (K.hash(x, z, seed + 17) - 0.5) * p.jitter) * p.spacing,
        (z + 0.5 + (K.hash(x, z, seed + 59) - 0.5) * p.jitter) * p.spacing
      ];
    return A.data.freeze({
      key: x + ':' + z + ':' + slot,
      index: [x, z] as P14StablePopulationsCell,
      slot,
      point,
      rank: (slot + K.hash(x, z, seed + 103)) / p.slots,
      seed: Math.floor(K.hash(x, z, seed + 137) * 2147483647),
      yaw: K.hash(x, z, seed + 173) * Math.PI * 2,
      scale: 0.8 + 0.4 * K.hash(x, z, seed + 211)
    });
  }

  function sampleAt(
    candidate: P14StablePopulationsCandidate,
    evaluate: P14StablePopulationsEvaluator
  ): P14StablePopulationsSample | null {
    const sample = evaluate(...candidate.point, candidate);
    if (sample == null) return null;
    if (
      typeof sample !== 'object' ||
      Array.isArray(sample) ||
      !Number.isFinite(sample.density) ||
      sample.density < 0 ||
      sample.density > 1
    )
      throw new Error('Population samples need a density from zero to one');
    return candidate.rank < sample.density ? sample : null;
  }

  function spacingFilter(
    p: P14StablePopulationsParameters,
    evaluate: P14StablePopulationsEvaluator
  ): P14StablePopulationsSpacingFilter {
    const { distance, maxDistance, species, maxComparisons } = p.exclusion!,
      radius = maxDistance ? Math.floor(maxDistance / p.spacing) + 1 : 0,
      states = new Map<string, P14StablePopulationsCellState>(),
      cellKey = (x: number, z: number) => x + ':' + z;
    let comparisons = 0;
    function compare() {
      if (++comparisons > maxComparisons) throw new Error('Population exclusion exceeds its comparison budget');
    }
    function at(x: number, z: number): P14StablePopulationsCellState {
      const key = cellKey(x, z);
      if (states.has(key)) return states.get(key)!;
      if ((states.size + 1) * p.slots > p.maxCandidates)
        throw new Error('Population exclusion halo exceeds its candidate budget');
      const all: P14StablePopulationsCandidate[] = [],
        eligible: P14StablePopulationsEligible[] = [];
      for (let slot = 0; slot < p.slots; slot++) {
        const candidate = candidateAt(x, z, slot, p),
          sample = sampleAt(candidate, evaluate);
        all.push(candidate);
        if (!sample) continue;
        const minimum = sample.minDistance ?? distance,
          kind = sample.species ?? '';
        if (!Number.isFinite(minimum) || minimum < 0 || minimum > maxDistance || typeof kind !== 'string')
          throw new Error('Population sample has an invalid exclusion distance or species');
        eligible.push({ candidate, sample: A.data.clone(sample), minimum, kind });
      }
      const cell = { all, eligible };
      states.set(key, cell);
      return cell;
    }
    function precedes(a: P14StablePopulationsCandidate, b: P14StablePopulationsCandidate) {
      if (a.rank !== b.rank) return a.rank < b.rank;
      if (a.index[1] !== b.index[1]) return a.index[1] < b.index[1];
      if (a.index[0] !== b.index[0]) return a.index[0] < b.index[0];
      return a.slot < b.slot;
    }
    function speciesDistance(a: string, b: string) {
      return Object.hasOwn(species, a) && Object.hasOwn(species[a], b) ? species[a][b] : 0;
    }
    function accept(current: P14StablePopulationsEligible) {
      if (!radius) return true;
      const { candidate, minimum, kind } = current,
        [x, z] = candidate.index,
        [px, pz] = candidate.point;
      // A higher-priority eligible slot blocks the current slot even if it was itself blocked.
      // That local rule avoids chains of decisions crossing work-region boundaries.
      for (let v = z - radius; v <= z + radius; v++) {
        for (let u = x - radius; u <= x + radius; u++) {
          compare();
          for (const neighbor of at(u, v).eligible) {
            compare();
            if (!precedes(neighbor.candidate, candidate)) continue;
            const required = Math.max(
                minimum,
                neighbor.minimum,
                speciesDistance(kind, neighbor.kind),
                speciesDistance(neighbor.kind, kind)
              ),
              [qx, qz] = neighbor.candidate.point;
            if ((qx - px) ** 2 + (qz - pz) ** 2 < required ** 2) return false;
          }
        }
      }
      return true;
    }
    return { at, accept, work: () => ({ evaluated: states.size * p.slots, comparisons }) };
  }

  function layout(
    regions: readonly P14StablePopulationsBounds[],
    evaluate: P14StablePopulationsEvaluator,
    raw: P14StablePopulationsConfig = {}
  ): P14StablePopulationsLayout {
    const p = parameters(raw);
    if (!Array.isArray(regions) || regions.length > 4096 || typeof evaluate !== 'function')
      throw new Error('Populations need bounded work regions and an evaluator');
    const cells = new Map<string, P14StablePopulationsCell>(),
      instances: P14StablePopulationsInstance[] = [],
      filter = p.exclusion ? spacingFilter(p, evaluate) : null;
    let candidates = 0;
    for (const region of regions as readonly P14StablePopulationsBounds[]) {
      const b = bounds(region),
        x0 = Math.floor(b.min[0] / p.spacing),
        x1 = Math.floor(b.max[0] / p.spacing),
        z0 = Math.floor(b.min[2] / p.spacing),
        z1 = Math.floor(b.max[2] / p.spacing);
      if ((x1 - x0 + 1) * (z1 - z0 + 1) * p.slots > p.maxCandidates)
        throw new Error('Population region exceeds its candidate budget');
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          cells.set(x + ':' + z, [x, z]);
          if (cells.size * p.slots > p.maxCandidates) throw new Error('Population exceeds its candidate budget');
        }
    }
    function inRegion([x, z]: P14StablePopulationsCell) {
      return regions.some(
        (b: P14StablePopulationsBounds) => x >= b.min[0] && x <= b.max[0] && z >= b.min[2] && z <= b.max[2]
      );
    }
    function emit(candidate: P14StablePopulationsCandidate, sample: P14StablePopulationsSample) {
      if (instances.length >= p.maxInstances) throw new Error('Population exceeds its instance budget');
      instances.push(A.data.freeze({ ...candidate, sample }));
    }
    for (const [x, z] of [...cells.values()].sort((a, b) => a[1] - b[1] || a[0] - b[0])) {
      if (filter) {
        const { all, eligible } = filter.at(x, z);
        for (const candidate of all) if (inRegion(candidate.point)) candidates++;
        for (const entry of eligible) {
          if (inRegion(entry.candidate.point) && filter.accept(entry)) emit(entry.candidate, entry.sample);
        }
        continue;
      }
      for (let slot = 0; slot < p.slots; slot++) {
        const candidate = candidateAt(x, z, slot, p);
        if (!inRegion(candidate.point)) continue;
        candidates++;
        const sample = sampleAt(candidate, evaluate);
        if (sample) emit(candidate, A.data.clone(sample));
      }
    }
    return A.data.freeze({ parameters: p, instances, sampling: { cells: cells.size, candidates, ...filter?.work() } });
  }
  A.populations = { parameters, layout };
})(KIT);

export {};
