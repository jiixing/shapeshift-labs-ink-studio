/* Assign a repeatable height profile to fitted cells. Clipping the footprint or
   wrapping the layout leaves the profile's original cell coordinates intact. */
type P09CourseReliefVec2 = [number, number];

interface P09CourseReliefBounds {
  min: P09CourseReliefVec2;
  max: P09CourseReliefVec2;
}

interface P09CourseReliefCell {
  id: string;
  row: number;
  column: number;
  inset: P09CourseReliefBounds;
}

interface P09CourseReliefLayout {
  width: number;
  height: number;
  unit: P09CourseReliefVec2;
  joint: number;
  stagger: number;
  periodic: boolean;
  cells: readonly P09CourseReliefCell[];
  at(u: number, v: number): P09CourseReliefCell | null;
  jointDistance(u: number, v: number): number;
}

interface P09CourseReliefOptions {
  profile?: (u: number, v: number, cell: P09CourseReliefCell) => number;
  rise?: number;
  slope?: P09CourseReliefVec2;
}

interface P09CourseRelief {
  height(u: number, v: number, key?: string): number;
  top(u: number, v: number): number;
  slope: readonly [number, number];
  rise: number;
}

interface P09CourseReliefProceduralApi {
  courseRelief?: (layout: P09CourseReliefLayout, options?: P09CourseReliefOptions) => P09CourseRelief;
}

type P09CourseReliefKitHost =
  | { procedural: P09CourseReliefProceduralApi; authoring?: P09CourseReliefProceduralApi }
  | { procedural?: P09CourseReliefProceduralApi; authoring: P09CourseReliefProceduralApi };

declare const KIT: P09CourseReliefKitHost;

(function (K: P09CourseReliefKitHost) {
  const P = K.procedural || K.authoring;
  const clamp = (x: number) => Math.max(0, Math.min(1, x));

  function courseRelief(
    layout: P09CourseReliefLayout,
    { profile, rise, slope }: P09CourseReliefOptions = {}
  ): P09CourseRelief {
    if (
      typeof layout?.at !== 'function' ||
      typeof layout?.jointDistance !== 'function' ||
      typeof profile !== 'function' ||
      !Number.isFinite(rise) ||
      rise! <= 0 ||
      !Array.isArray(slope) ||
      slope.length !== 2 ||
      !slope.every(n => Number.isFinite(n) && n >= 0)
    )
      throw new Error('Course relief needs fitted courses, a bounded profile and positive height');

    const [dx, dy] = layout.unit;
    const pitchX = dx - layout.joint,
      pitchY = dy - layout.joint;
    const keys = new Map<string, P09CourseReliefCell>();
    let shortest = pitchX;
    for (const cell of layout.cells) {
      keys.set(cell.id, cell);
      if (!layout.periodic) shortest = Math.min(shortest, cell.inset.max[0] - cell.inset.min[0]);
    }
    const derivative: P09CourseReliefVec2 = [(rise! * slope![0]) / shortest, (rise! * slope![1]) / pitchY];

    function height(u: number, v: number, key?: string): number {
      const cell = key === undefined ? layout.at(u, v) : keys.get(key);
      if (!cell) return 0;
      let lo = cell.inset.min[0],
        hi = cell.inset.max[0];
      if (layout.periodic) {
        if (key === undefined || u < 0 || u > layout.width) u = ((u % layout.width) + layout.width) % layout.width;
        const phase = cell.row % 2 ? layout.stagger : 0;
        lo = (cell.column + phase) * dx + layout.joint / 2;
        hi = lo + pitchX;
        u += Math.round(((lo + hi) / 2 - u) / layout.width) * layout.width;
      }
      const s = clamp((u - lo) / (hi - lo));
      const t = clamp((v - cell.inset.min[1]) / (cell.inset.max[1] - cell.inset.min[1]));
      const value = profile!(s, t, cell);
      if (!Number.isFinite(value) || value < 0 || value > 1)
        throw new Error('Course relief profile values must be within zero and one');
      return rise! * value;
    }
    function top(u: number, v: number) {
      return layout.jointDistance(u, v) <= 0 ? height(u, v) : 0;
    }
    return { height, top, slope: Object.freeze(derivative), rise: rise! };
  }

  P!.courseRelief = courseRelief;
})(KIT);

export {};
