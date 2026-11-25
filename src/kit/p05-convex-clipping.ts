/* Clip one closed convex mesh shell against half spaces n.dot(p) <= offset.
   Retained faces keep their material metadata; newly cut faces receive capMeta.
   This is convex volume clipping, not a boolean for arbitrary/disconnected meshes. */
type P05ConvexClippingVec2 = [number, number];
type P05ConvexClippingVec3 = [number, number, number];
type P05ConvexClippingNumbers = Float32Array | number[];

interface P05ConvexClippingMeta {
  owner: string;
  surface: string;
  material: string;
}

interface P05ConvexClippingGroup extends P05ConvexClippingMeta {
  start: number;
  count: number;
}

interface P05ConvexClippingMesh {
  positions: P05ConvexClippingNumbers;
  uv?: P05ConvexClippingNumbers | null;
  normals?: P05ConvexClippingNumbers | null;
  groups: P05ConvexClippingGroup[];
}

interface P05ConvexClippingPlane {
  normal: P05ConvexClippingVec3;
  offset: number;
}

interface P05ConvexClippingPolygon {
  meta: P05ConvexClippingMeta;
  points: P05ConvexClippingVec3[];
  coords?: P05ConvexClippingVec2[] | null;
  normals?: P05ConvexClippingVec3[] | null;
}

interface P05ConvexClippingBuilder {
  triangle(
    a: P05ConvexClippingVec3,
    b: P05ConvexClippingVec3,
    c: P05ConvexClippingVec3,
    meta?: P05ConvexClippingMeta,
    coords?: [P05ConvexClippingVec2, P05ConvexClippingVec2, P05ConvexClippingVec2] | null,
    normals?: [P05ConvexClippingVec3, P05ConvexClippingVec3, P05ConvexClippingVec3] | null
  ): void;
  finish(): P05ConvexClippingMesh;
}

interface P05ConvexClippingVectorApi {
  len(v: readonly number[]): number;
  mul(v: readonly number[], scale: number): P05ConvexClippingVec3;
  dot(a: readonly number[], b: readonly number[]): number;
  mad(origin: readonly number[], direction: readonly number[], distance: number): P05ConvexClippingVec3;
  sub(a: readonly number[], b: readonly number[]): P05ConvexClippingVec3;
  dist(a: readonly number[], b: readonly number[]): number;
  norm(v: readonly number[]): P05ConvexClippingVec3;
  add(a: readonly number[], b: readonly number[]): P05ConvexClippingVec3;
  cross(a: readonly number[], b: readonly number[]): P05ConvexClippingVec3;
}

interface P05ConvexClippingKitHost {
  procedural: {
    geometry: {
      builder(): P05ConvexClippingBuilder;
      clipConvex(
        mesh: P05ConvexClippingMesh,
        planes: P05ConvexClippingPlane[],
        capMeta?: Partial<P05ConvexClippingMeta> | null
      ): P05ConvexClippingMesh;
      clipSurface(mesh: P05ConvexClippingMesh, planes: P05ConvexClippingPlane[]): P05ConvexClippingMesh;
    };
  };
  V: P05ConvexClippingVectorApi;
}

declare const KIT: P05ConvexClippingKitHost;

(function (K: P05ConvexClippingKitHost) {
  const A = K.procedural,
    V = K.V,
    EPS = 1e-7;
  function clip(
    mesh: P05ConvexClippingMesh,
    planes: P05ConvexClippingPlane[],
    capMeta: Partial<P05ConvexClippingMeta> | null | undefined,
    closed: boolean
  ): P05ConvexClippingMesh {
    if (
      !mesh ||
      !mesh.positions ||
      mesh.positions.length % 9 ||
      !mesh.positions.every(Number.isFinite) ||
      !Array.isArray(mesh.groups) ||
      !Array.isArray(planes)
    )
      throw new Error('Convex clipping requires finite triangle geometry and half spaces');
    if (
      (mesh.uv && (mesh.uv.length !== (mesh.positions.length / 3) * 2 || !mesh.uv.every(Number.isFinite))) ||
      (mesh.normals && (mesh.normals.length !== mesh.positions.length || !mesh.normals.every(Number.isFinite)))
    )
      throw new Error('Convex clipping attributes must be finite and match vertices');
    let polygons: P05ConvexClippingPolygon[] = [];
    for (const g of mesh.groups) {
      if (
        !Number.isSafeInteger(g.start) ||
        !Number.isSafeInteger(g.count) ||
        g.start < 0 ||
        g.count < 0 ||
        g.start % 3 ||
        g.count % 3 ||
        g.start + g.count > mesh.positions.length / 3
      )
        throw new Error('Invalid convex clipping group');
      for (let i = g.start; i < g.start + g.count; i += 3)
        polygons.push({
          meta: { owner: g.owner, surface: g.surface, material: g.material },
          points: [0, 1, 2].map(
            j => Array.from(mesh.positions.slice((i + j) * 3, (i + j + 1) * 3)) as P05ConvexClippingVec3
          ),
          coords:
            mesh.uv &&
            [0, 1, 2].map(j => Array.from(mesh.uv!.slice((i + j) * 2, (i + j + 1) * 2)) as P05ConvexClippingVec2),
          normals:
            mesh.normals &&
            [0, 1, 2].map(j => Array.from(mesh.normals!.slice((i + j) * 3, (i + j + 1) * 3)) as P05ConvexClippingVec3)
        });
    }
    const cap: P05ConvexClippingMeta = Object.assign({}, polygons[0]?.meta, { surface: 'cut' }, capMeta);
    for (const raw of planes) {
      if (
        !raw ||
        !Array.isArray(raw.normal) ||
        raw.normal.length !== 3 ||
        !raw.normal.every(Number.isFinite) ||
        V.len(raw.normal) < EPS ||
        !Number.isFinite(raw.offset)
      )
        throw new Error('Convex clipping needs finite nonzero plane normals and offsets');
      const length = V.len(raw.normal),
        normal = V.mul(raw.normal, 1 / length),
        offset = raw.offset / length,
        next: P05ConvexClippingPolygon[] = [],
        cuts: P05ConvexClippingVec3[] = [];
      for (const poly of polygons) {
        const points: P05ConvexClippingVec3[] = [],
          coords: P05ConvexClippingVec2[] = [],
          normals: P05ConvexClippingVec3[] = [];
        for (let i = 0; i < poly.points.length; i++) {
          const a = poly.points[i],
            b = poly.points[(i + 1) % poly.points.length],
            da = V.dot(normal, a) - offset,
            db = V.dot(normal, b) - offset,
            inside = da <= EPS,
            other = db <= EPS;
          if (inside) {
            points.push(a);
            if (poly.coords) coords.push(poly.coords[i]);
            if (poly.normals) normals.push(poly.normals[i]);
          }
          if (inside !== other) {
            const point = V.mad(a, V.sub(b, a), Math.max(0, Math.min(1, da / (da - db))));
            points.push(point);
            const t = Math.max(0, Math.min(1, da / (da - db))),
              j = (i + 1) % poly.points.length;
            if (poly.coords)
              coords.push(poly.coords[i].map((v, k) => v + (poly.coords![j][k] - v) * t) as P05ConvexClippingVec2);
            if (poly.normals) normals.push(V.norm(V.mad(poly.normals[i], V.sub(poly.normals[j], poly.normals[i]), t)));
            if (closed && !cuts.some(p => V.dist(p, point) < EPS)) cuts.push(point);
          }
        }
        const indices = points.map((p, i) => i).filter(i => !i || V.dist(points[i], points[i - 1]) > EPS);
        if (indices.length > 2 && V.dist(points[indices[0]], points[indices[indices.length - 1]]) < EPS) indices.pop();
        if (indices.length >= 3)
          next.push({
            meta: poly.meta,
            points: indices.map(i => points[i]),
            coords: poly.coords && indices.map(i => coords[i]),
            normals: poly.normals && indices.map(i => normals[i])
          });
      }
      if (closed && cuts.length >= 3) {
        const center = cuts.reduce((p, q) => V.add(p, V.mul(q, 1 / cuts.length)), [0, 0, 0]),
          X = V.norm(V.cross(Math.abs(normal[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0], normal)),
          Y = V.cross(normal, X),
          angle = (p: P05ConvexClippingVec3) => {
            const d = V.sub(p, center);
            return Math.atan2(V.dot(d, Y), V.dot(d, X));
          };
        cuts.sort((a, b) => angle(a) - angle(b));
        next.push({
          meta: cap,
          points: cuts,
          coords: cuts.map(p => {
            const d = V.sub(p, center);
            return [V.dot(d, X), V.dot(d, Y)];
          }),
          normals: cuts.map(() => normal)
        });
      }
      polygons = next;
    }
    const builder = A.geometry.builder();
    for (const poly of polygons) {
      if (closed && poly.points.length > 3) {
        // Preserve all boundary subdivisions, including collinear cut vertices.
        // A fan rooted at a boundary vertex can skip an edge at a flat corner.
        const average = (vectors: readonly (readonly number[])[]): number[] =>
          vectors[0].map((_, axis) => vectors.reduce((sum, v) => sum + v[axis], 0) / vectors.length);
        const center = average(poly.points) as P05ConvexClippingVec3;
        const uv = poly.coords && (average(poly.coords) as P05ConvexClippingVec2);
        const normal = poly.normals && V.norm(average(poly.normals));
        for (let i = 0; i < poly.points.length; i++) {
          const j = (i + 1) % poly.points.length;
          builder.triangle(
            center,
            poly.points[i],
            poly.points[j],
            poly.meta,
            uv && [uv, poly.coords![i], poly.coords![j]],
            normal && [normal, poly.normals![i], poly.normals![j]]
          );
        }
        continue;
      }
      for (let i = 1; i < poly.points.length - 1; i++)
        builder.triangle(
          poly.points[0],
          poly.points[i],
          poly.points[i + 1],
          poly.meta,
          poly.coords && [poly.coords[0], poly.coords[i], poly.coords[i + 1]],
          poly.normals && [poly.normals[0], poly.normals[i], poly.normals[i + 1]]
        );
    }
    return builder.finish();
  }
  A.geometry.clipConvex = (mesh, planes, capMeta) => clip(mesh, planes, capMeta, true);
  A.geometry.clipSurface = (mesh, planes) => clip(mesh, planes, null, false);
})(KIT);

export {};
