/* Triangle geometry with optional owner, material and UV metadata. */
type P02ProceduralMeshVec2 = [number, number];
type P02ProceduralMeshVec3 = [number, number, number];
type P02ProceduralMeshMatrix = [number, number, number, number, number, number, number, number, number];
type P02ProceduralMeshTriangleVec2 = [P02ProceduralMeshVec2, P02ProceduralMeshVec2, P02ProceduralMeshVec2];
type P02ProceduralMeshQuadVec2 = [
  P02ProceduralMeshVec2,
  P02ProceduralMeshVec2,
  P02ProceduralMeshVec2,
  P02ProceduralMeshVec2
];
type P02ProceduralMeshTriangleVec3 = [P02ProceduralMeshVec3, P02ProceduralMeshVec3, P02ProceduralMeshVec3];
type P02ProceduralMeshQuadVec3 = [
  P02ProceduralMeshVec3,
  P02ProceduralMeshVec3,
  P02ProceduralMeshVec3,
  P02ProceduralMeshVec3
];

interface P02ProceduralMeshBounds {
  min: number[];
  max: number[];
}

interface P02ProceduralMeshMeta {
  owner?: string;
  surface?: string;
  material?: string;
}

interface P02ProceduralMeshGroup {
  owner: string;
  surface: string;
  material: string;
  start: number;
  count: number;
}

type P02ProceduralMeshNumbers = Float32Array | number[];

interface P02ProceduralMeshSurface {
  positions: P02ProceduralMeshNumbers;
  normals: P02ProceduralMeshNumbers;
  uv: P02ProceduralMeshNumbers;
  groups: readonly P02ProceduralMeshGroup[];
  bounds?: P02ProceduralMeshBounds | null;
}

interface P02ProceduralMeshPose {
  R: P02ProceduralMeshMatrix;
  t: P02ProceduralMeshVec3;
}

interface P02ProceduralMeshTransformInput {
  position?: P02ProceduralMeshVec3;
  rotation?: P02ProceduralMeshVec3 | number;
  scale?: P02ProceduralMeshVec3 | number;
}

interface P02ProceduralMeshKitMesh {
  pos: Float32Array;
  tri: Uint32Array;
  vcol: Float32Array | null;
  tmat: Uint16Array;
  mats: readonly { name: string; rgb: P02ProceduralMeshVec3 }[];
}

interface P02ProceduralMeshBuilder {
  triangle(
    a: P02ProceduralMeshVec3,
    b: P02ProceduralMeshVec3,
    c: P02ProceduralMeshVec3,
    meta?: P02ProceduralMeshMeta,
    coords?: [P02ProceduralMeshVec2, P02ProceduralMeshVec2, P02ProceduralMeshVec2],
    ns?: [P02ProceduralMeshVec3, P02ProceduralMeshVec3, P02ProceduralMeshVec3]
  ): void;
  quad(
    a: P02ProceduralMeshVec3,
    b: P02ProceduralMeshVec3,
    c: P02ProceduralMeshVec3,
    d: P02ProceduralMeshVec3,
    meta?: P02ProceduralMeshMeta,
    coords?: [P02ProceduralMeshVec2, P02ProceduralMeshVec2, P02ProceduralMeshVec2, P02ProceduralMeshVec2],
    ns?: [P02ProceduralMeshVec3, P02ProceduralMeshVec3, P02ProceduralMeshVec3, P02ProceduralMeshVec3]
  ): void;
  append(mesh: P02ProceduralMeshSurface, pose?: P02ProceduralMeshPose): void;
  finish(): P02ProceduralMeshSurface & {
    positions: Float32Array;
    normals: Float32Array;
    uv: Float32Array;
    groups: readonly P02ProceduralMeshGroup[];
    bounds: P02ProceduralMeshBounds | null;
  };
}

interface P02ProceduralMeshData {
  clone<T>(value: T): T;
  freeze<T>(value: T): Readonly<T>;
}

interface P02ProceduralMeshVectorApi {
  sub(a: P02ProceduralMeshVec3, b: P02ProceduralMeshVec3): P02ProceduralMeshVec3;
  cross(a: P02ProceduralMeshVec3, b: P02ProceduralMeshVec3): P02ProceduralMeshVec3;
  norm(v: P02ProceduralMeshVec3): P02ProceduralMeshVec3;
  len(v: P02ProceduralMeshVec3): number;
}

interface P02ProceduralMeshMatrixApi {
  det(m: P02ProceduralMeshMatrix): number;
}

interface P02ProceduralMeshTransforms {
  local(raw?: P02ProceduralMeshTransformInput): P02ProceduralMeshPose;
  point(pose: P02ProceduralMeshPose, p: readonly number[]): P02ProceduralMeshVec3;
  normal(pose: P02ProceduralMeshPose, n: readonly number[]): P02ProceduralMeshVec3;
}

interface P02ProceduralMeshKitHost {
  procedural: {
    data: P02ProceduralMeshData;
    transforms: P02ProceduralMeshTransforms;
    geometry: {
      builder(): P02ProceduralMeshBuilder;
      toKitMesh(
        mesh: P02ProceduralMeshSurface,
        resolveMaterial: (owner: string, material: string) => P02ProceduralMeshVec3
      ): P02ProceduralMeshKitMesh;
    };
  };
  V: P02ProceduralMeshVectorApi;
  M: P02ProceduralMeshMatrixApi;
  mesh: {
    make(
      positions: number[],
      triangles: number[],
      vcol: null,
      tmat: number[],
      mats: { name: string; rgb: P02ProceduralMeshVec3 }[]
    ): P02ProceduralMeshKitMesh;
  };
}

declare const KIT: P02ProceduralMeshKitHost;

(function (K: P02ProceduralMeshKitHost) {
  const A = K.procedural,
    { clone, freeze } = A.data,
    V = K.V,
    M = K.M;
  const EPS = 1e-8,
    vector = (p: unknown): p is P02ProceduralMeshVec3 => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite);
  const { local, point, normal } = A.transforms;
  function builder() {
    const positions: number[] = [],
      normals: number[] = [],
      uv: number[] = [],
      groups: P02ProceduralMeshGroup[] = [];
    function triangle(
      a: P02ProceduralMeshVec3,
      b: P02ProceduralMeshVec3,
      c: P02ProceduralMeshVec3,
      meta?: P02ProceduralMeshMeta,
      coords?: [P02ProceduralMeshVec2, P02ProceduralMeshVec2, P02ProceduralMeshVec2],
      ns?: [P02ProceduralMeshVec3, P02ProceduralMeshVec3, P02ProceduralMeshVec3]
    ) {
      if (
        ![a, b, c].every(vector) ||
        (ns && (!Array.isArray(ns) || ns.length !== 3 || !ns.every(vector))) ||
        (coords &&
          (!Array.isArray(coords) ||
            coords.length !== 3 ||
            !coords.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))))
      ) {
        throw new Error('Geometry vertices and attributes must be finite');
      }
      const cross = V.cross(V.sub(b, a), V.sub(c, a));
      if (V.len(cross) < EPS * EPS) return;
      const n = V.norm(cross),
        info = Object.assign({ owner: '', surface: '', material: 'default' }, meta),
        start = positions.length / 3;
      for (const [i, p] of [a, b, c].entries()) {
        positions.push(...p);
        normals.push(...(ns ? ns[i] : n));
        uv.push(...(coords ? coords[i] : [0, 0]));
      }
      const last = groups[groups.length - 1];
      if (
        last &&
        last.owner === info.owner &&
        last.surface === info.surface &&
        last.material === info.material &&
        last.start + last.count === start
      )
        last.count += 3;
      else groups.push(Object.assign(info, { start, count: 3 }));
    }
    function quad(
      a: P02ProceduralMeshVec3,
      b: P02ProceduralMeshVec3,
      c: P02ProceduralMeshVec3,
      d: P02ProceduralMeshVec3,
      meta?: P02ProceduralMeshMeta,
      coords?: [P02ProceduralMeshVec2, P02ProceduralMeshVec2, P02ProceduralMeshVec2, P02ProceduralMeshVec2],
      ns?: [P02ProceduralMeshVec3, P02ProceduralMeshVec3, P02ProceduralMeshVec3, P02ProceduralMeshVec3]
    ) {
      const u = coords || [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0]
      ];
      triangle(a, b, c, meta, [u[0], u[1], u[2]], ns && [ns[0], ns[1], ns[2]]);
      triangle(a, c, d, meta, [u[0], u[2], u[3]], ns && [ns[0], ns[2], ns[3]]);
    }
    function append(mesh: P02ProceduralMeshSurface, pose?: P02ProceduralMeshPose) {
      const p = pose || local(),
        mirrored = M.det(p.R) < 0;
      for (const g of mesh.groups)
        for (let i = g.start; i < g.start + g.count; i += 3) {
          const order = mirrored ? [i, i + 2, i + 1] : [i, i + 1, i + 2];
          const ps = order.map(j =>
              point(p, Array.from(mesh.positions.slice(j * 3, j * 3 + 3)))
            ) as P02ProceduralMeshTriangleVec3,
            ns = order.map(j =>
              normal(p, Array.from(mesh.normals.slice(j * 3, j * 3 + 3)))
            ) as P02ProceduralMeshTriangleVec3,
            coords = order.map(j => Array.from(mesh.uv.slice(j * 2, j * 2 + 2))) as P02ProceduralMeshTriangleVec2;
          triangle(...ps, g, coords, ns);
        }
    }
    function finish() {
      const min: number[] = [Infinity, Infinity, Infinity],
        max: number[] = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < positions.length; i++) {
        const k = i % 3;
        min[k] = Math.min(min[k], positions[i]);
        max[k] = Math.max(max[k], positions[i]);
      }
      return {
        positions: Float32Array.from(positions),
        normals: Float32Array.from(normals),
        uv: Float32Array.from(uv),
        groups: freeze(clone(groups)),
        bounds: positions.length ? { min, max } : null
      };
    }
    return { triangle, quad, append, finish };
  }
  function toKitMesh(
    mesh: P02ProceduralMeshSurface,
    resolveMaterial: (owner: string, material: string) => P02ProceduralMeshVec3
  ) {
    if (typeof resolveMaterial !== 'function') throw new Error('A material resolver is required');
    const positions: number[] = [],
      triangles: number[] = [],
      tmat: number[] = [],
      mats: { name: string; rgb: P02ProceduralMeshVec3 }[] = [],
      vertices = new Map<string, number>(),
      materials = new Map<string, number>();
    for (const g of mesh.groups) {
      const key = JSON.stringify([g.owner, g.material]);
      if (!materials.has(key)) {
        const color = resolveMaterial(g.owner, g.material);
        if (!vector(color) || color.some(v => v < 0 || v > 1))
          throw new Error('Material resolver must return normalized RGB');
        materials.set(key, mats.length);
        mats.push({ name: key, rgb: color.slice() as P02ProceduralMeshVec3 });
      }
      for (let i = g.start; i < g.start + g.count; i++) {
        const p = Array.from(mesh.positions.slice(i * 3, i * 3 + 3)),
          vkey = p.join(',');
        if (!vertices.has(vkey)) {
          vertices.set(vkey, positions.length / 3);
          positions.push(...p);
        }
        triangles.push(vertices.get(vkey)!);
        if ((i - g.start) % 3 === 0) tmat.push(materials.get(key)!);
      }
    }
    return K.mesh.make(positions, triangles, null, tmat, mats);
  }
  A.geometry = { builder, toKitMesh };
})(KIT);

export {};
