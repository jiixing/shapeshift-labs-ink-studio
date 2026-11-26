type GalleryVec2 = [number, number];
type GalleryVec3 = [number, number, number];
type GalleryMatrix = [number, number, number, number, number, number, number, number, number];
type GalleryNumbers = Float32Array | number[];
type GalleryField = (point: GalleryVec3) => number;

interface GalleryBounds {
  min: GalleryVec3;
  max: GalleryVec3;
}

interface GalleryMeta {
  owner?: string;
  key?: string;
  surface?: string;
  material?: string;
}

interface GalleryGroup {
  owner: string;
  surface: string;
  material: string;
  start: number;
  count: number;
}

interface GalleryMesh {
  positions: GalleryNumbers;
  normals: GalleryNumbers;
  uv: GalleryNumbers;
  groups: readonly GalleryGroup[];
  bounds?: GalleryBounds | null;
}

interface GalleryPiece extends GalleryBounds {
  mesh: GalleryMesh;
  distance(point: GalleryVec3): number;
}

interface GalleryGeometryBuilder {
  quad(a: GalleryVec3, b: GalleryVec3, c: GalleryVec3, d: GalleryVec3, meta?: GalleryMeta): void;
  finish(): GalleryMesh;
}

interface GalleryCourseCell {
  id: string;
  row: number;
  column: number;
  bounds: { min: GalleryVec2; max: GalleryVec2 };
  inset: { min: GalleryVec2; max: GalleryVec2 };
}

interface GalleryPrismCell {
  bounds: GalleryBounds;
  fragments: GalleryVec2[][];
  boundary: Array<[GalleryVec2, GalleryVec2]>;
  distance(x: number, z: number): number;
}

interface GalleryMaskSpec {
  id: string;
  points: GalleryVec2[];
  radii?: number[];
  width?: number;
  operation?: 'add' | 'erase';
  order?: number;
}

interface GalleryRouteSample {
  point: GalleryVec3;
  side: GalleryVec3;
  normal: GalleryVec3;
  tangent: GalleryVec3;
}

interface GalleryRoute {
  length: number;
  breaks: readonly number[];
  sample(value: number): GalleryRouteSample;
}

type GallerySurfaceCellInput =
  | { key: string; polygon: GalleryVec2[] }
  | { key?: string; id?: string; inset: { min: GalleryVec2; max: GalleryVec2 } };

interface GallerySurfaceCell {
  key: string;
  fragments: GalleryVec2[][];
}

interface GalleryContactIndex {
  bounds: GalleryBounds | null;
  crossings(a: GalleryVec3, b: GalleryVec3): number[];
  contains(point: GalleryVec3, boundaryInside?: boolean): boolean;
}

export interface GalleryKit {
  V: {
    norm(vector: ArrayLike<number>): GalleryVec3;
    cross(a: ArrayLike<number>, b: ArrayLike<number>): GalleryVec3;
    dot(a: ArrayLike<number>, b: ArrayLike<number>): number;
    sub(a: ArrayLike<number>, b: ArrayLike<number>): GalleryVec3;
    mad(origin: ArrayLike<number>, direction: ArrayLike<number>, distance: number): GalleryVec3;
    add(a: ArrayLike<number>, b: ArrayLike<number>): GalleryVec3;
  };
  M: {
    cols(x: readonly number[], y: readonly number[], z: readonly number[]): GalleryMatrix;
  };
  procedural: {
    pieces: {
      box(center: GalleryVec3, half: GalleryVec3, frame: GalleryMatrix, meta?: GalleryMeta): GalleryPiece;
      tube(a: GalleryVec3, b: GalleryVec3, radius: number, meta?: GalleryMeta, sides?: number): GalleryPiece;
      beam(a: GalleryVec3, b: GalleryVec3, width: number, depth: number, meta?: GalleryMeta): GalleryPiece;
      convex(vertices: GalleryVec3[], polygons: readonly number[][], meta?: GalleryMeta): GalleryPiece;
      boxFaces: readonly number[][];
    };
    fittedCourses(options: { width: number; height: number; unit: GalleryVec2; joint?: number; stagger?: number }): {
      cells: readonly GalleryCourseCell[];
    };
    planarCells: {
      layout(
        bounds: GalleryBounds,
        mask: (x: number, z: number) => number,
        options: { size: number; seed: number }
      ): { cells: readonly GalleryPrismCell[] };
      prism(
        cell: GalleryPrismCell,
        options: { bottom: number; top: number; material: string }
      ): { mesh(): GalleryMesh };
    };
    supportSkirt(options: {
      ground: {
        height(x: number, z: number): number;
        slopeBound: number;
        bounds: GalleryBounds;
      };
      outline: GalleryVec3[];
      overlap?: number;
    }): { mesh(options: { material: string; surface: string }): GalleryMesh };
    proximity: {
      connect(
        sockets: readonly { id: string; point: GalleryVec3; group?: string }[]
      ): readonly { a: string; b: string; distance: number }[];
    };
    spans: {
      catenary(
        start: GalleryVec3,
        end: GalleryVec3,
        options: { sag: number }
      ): {
        sample(value: number): {
          point: GalleryVec3;
          tangent: GalleryVec3;
          side: GalleryVec3;
          normal: GalleryVec3;
          t: number;
        };
      };
    };
    geometry: {
      builder(): GalleryGeometryBuilder;
      clipConvex(
        mesh: GalleryMesh,
        planes: readonly { normal: GalleryVec3; offset: number }[],
        capMeta?: GalleryMeta
      ): GalleryMesh;
      implicitSurface(
        field: GalleryField,
        bounds: GalleryBounds,
        options: { resolution: number; meta: GalleryMeta }
      ): GalleryMesh;
    };
    populations: {
      layout(
        regions: readonly GalleryBounds[],
        evaluate: (x: number, z: number) => { density: number },
        options: { spacing: number; slots: number; seed: number }
      ): {
        instances: readonly {
          point: GalleryVec2;
          scale: number;
          rank: number;
        }[];
      };
    };
    masks: {
      compose(specs: readonly GalleryMaskSpec[]): { distance(point: GalleryVec2): number };
    };
    profileCut(options: { profile: GalleryVec2[]; span: [number, number] }): {
      bounds: GalleryBounds;
      distance(point: GalleryVec3): number;
      subtract(solidDistance: GalleryField): GalleryField;
      lining(thickness: number, solidDistance: GalleryField): GalleryField;
    };
    clearance: {
      field(solids: readonly (GalleryBounds & { id: string; distance: GalleryField })[]): {
        probe(bounds: GalleryBounds): {
          clear: boolean;
          tested: number;
          contacts: readonly { id: string; point: GalleryVec3; distance: number }[];
        };
      };
    };
    emitters: {
      compile(options: {
        id: string;
        p: GalleryVec3;
        color: GalleryVec3;
        height: number;
        speed: number;
        spread: number;
        growth: number;
        count: number;
        direction: GalleryVec3;
      }): {
        samples(time: number): readonly { p: GalleryVec3; size: number; opacity: number }[];
      };
    };
    styles: {
      catalog(
        definitions: Readonly<
          Record<
            string,
            {
              extends?: string;
              construction?: { pitch: number; gap: number; depth: number; width: number };
              materials?: Readonly<Record<string, string | { color?: string | number | GalleryVec3 }>>;
            }
          >
        >
      ): {
        resolve(name: string): {
          construction: { pitch: number; gap: number; depth: number; width: number };
          materials: Readonly<Record<string, string | { color?: string | number | GalleryVec3 }>>;
        };
      };
      material(
        profile: {
          construction: { pitch: number; gap: number; depth: number; width: number };
          materials: Readonly<Record<string, string | { color?: string | number | GalleryVec3 }>>;
        },
        role: string
      ): { color: GalleryVec3 };
    };
    routes: {
      aroundConvex(
        outline: GalleryVec2[],
        start: GalleryVec3,
        end: GalleryVec3,
        options: { offset: number }
      ): GalleryRoute;
      layout(
        route: GalleryRoute,
        options: { pitch: number; gap: number }
      ): readonly {
        length: number;
        frame: GalleryRouteSample;
      }[];
    };
    contacts: {
      index(mesh: GalleryMesh): GalleryContactIndex;
      intersections(
        a: GalleryContactIndex,
        b: GalleryContactIndex
      ): readonly { surfaceA: string; surfaceB: string; points: GalleryVec3[] }[];
      clipCurve(
        points: GalleryVec3[],
        solids: readonly { id: string; index: GalleryContactIndex; boundaryInside?: boolean }[]
      ): readonly { points: GalleryVec3[] }[];
    };
    fittedRibbon(options: {
      inner: GalleryVec2[];
      outer: GalleryVec2[];
      pitch: number;
      gap: number;
      closed: boolean;
    }): {
      cells: readonly {
        key: string;
        index: number;
        fragments: readonly {
          points: GalleryVec2[];
          edge: number;
          from: number;
          to: number;
        }[];
      }[];
    };
    surfaceCells: {
      clip(
        cells: readonly GallerySurfaceCellInput[],
        options: { boundary?: GalleryVec2[]; holes?: readonly (readonly GalleryVec2[])[] }
      ): { cells: readonly GallerySurfaceCell[] };
      loft(
        cells: { cells: readonly GallerySurfaceCell[] },
        options: {
          levels: [number, number];
          step: number;
          sample: (point: GalleryVec2, level: number, key: string) => GalleryVec3;
          metadata: GalleryMeta | ((key: string) => GalleryMeta);
        }
      ): GalleryGeometryBuilder;
    };
    panelFrames(options: {
      width: number;
      height: number;
      unit: GalleryVec2;
      beam: number;
      braceWidth: number;
      braces: 'none' | 'ascending' | 'descending' | 'alternating' | 'cross';
    }): {
      parts: readonly { key: string; role: string; polygon: GalleryVec2[] }[];
    };
  };
}

export interface RetainedExampleHost {
  canvas: HTMLCanvasElement;
  status: HTMLOutputElement;
  resize: HTMLButtonElement;
  undo: HTMLButtonElement;
  redo: HTMLButtonElement;
  draw(canvas: HTMLCanvasElement, meshes: readonly GalleryMesh[]): void;
}
