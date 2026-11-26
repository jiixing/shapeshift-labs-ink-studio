/* A bounded arbitrary profile extruded through an affine frame. */
type P18ProfiledCutsVec2 = [number, number];
type P18ProfiledCutsVec3 = [number, number, number];
type P18ProfiledCutsMatrix = [number, number, number, number, number, number, number, number, number];
type P18ProfiledCutsDistance2D = (x: number, y: number) => number;
type P18ProfiledCutsDistance3D = (point: P18ProfiledCutsVec3) => number;

interface P18ProfiledCutsBounds {
  min: P18ProfiledCutsVec3;
  max: P18ProfiledCutsVec3;
}

interface P18ProfiledCutsFrame {
  R: P18ProfiledCutsMatrix;
  t: P18ProfiledCutsVec3;
}

interface P18ProfiledCutsPose {
  R: number[];
  t: P18ProfiledCutsVec3;
}

interface P18ProfiledCutsInput {
  profile: P18ProfiledCutsVec2[];
  span: [number, number];
  frame?: P18ProfiledCutsFrame;
}

interface P18ProfiledCutsResult {
  readonly bounds: Readonly<P18ProfiledCutsBounds>;
  distance: P18ProfiledCutsDistance3D;
  subtract(solidDistance: P18ProfiledCutsDistance3D): P18ProfiledCutsDistance3D;
  lining(thickness: number, solidDistance?: P18ProfiledCutsDistance3D): P18ProfiledCutsDistance3D;
  sample(point: P18ProfiledCutsVec3): P18ProfiledCutsVec3;
  project(point: P18ProfiledCutsVec3): P18ProfiledCutsVec3;
}

interface P18ProfiledCutsData {
  clone<T>(value: T): T;
  freeze<T>(value: T): Readonly<T>;
}

interface P18ProfiledCutsGeometry {
  triangulate2D(points: P18ProfiledCutsVec2[]): unknown;
  profileDistance(points: readonly P18ProfiledCutsVec2[]): P18ProfiledCutsDistance2D;
}

interface P18ProfiledCutsTransforms {
  local(): P18ProfiledCutsFrame;
  distanceScale(frame: P18ProfiledCutsFrame): number;
  point(frame: P18ProfiledCutsPose, point: P18ProfiledCutsVec3): P18ProfiledCutsVec3;
}

interface P18ProfiledCutsSpatial {
  boxOf(points: readonly P18ProfiledCutsVec3[]): P18ProfiledCutsBounds;
}

interface P18ProfiledCutsApi {
  data: P18ProfiledCutsData;
  geometry: P18ProfiledCutsGeometry;
  transforms: P18ProfiledCutsTransforms;
  spatial: P18ProfiledCutsSpatial;
  profileCut(input: P18ProfiledCutsInput): P18ProfiledCutsResult;
}

interface P18ProfiledCutsVectorApi {
  sub(a: readonly number[], b: readonly number[]): P18ProfiledCutsVec3;
}

interface P18ProfiledCutsMatrixApi {
  inv(frame: P18ProfiledCutsMatrix): P18ProfiledCutsMatrix;
  app(frame: P18ProfiledCutsMatrix, point: readonly number[]): P18ProfiledCutsVec3;
}

interface P18ProfiledCutsKitHost {
  procedural: P18ProfiledCutsApi;
  V: P18ProfiledCutsVectorApi;
  M: P18ProfiledCutsMatrixApi;
}

declare const KIT: P18ProfiledCutsKitHost;

(function (K: P18ProfiledCutsKitHost) {
  const P = K.procedural;
  const { V, M } = K;

  function polygonDistance(points: P18ProfiledCutsVec2[]): P18ProfiledCutsDistance2D {
    if (
      !Array.isArray(points) ||
      points.length < 3 ||
      points.length > 256 ||
      !points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))
    ) {
      throw new Error('Cut profiles need 3 to 256 finite planar points');
    }
    const profile = P.data.clone(points);
    P.geometry.triangulate2D(profile);
    for (let i = 0; i < profile.length; i++) {
      const a = profile[i];
      const b = profile[(i + 1) % profile.length],
        x = b[0] - a[0],
        y = b[1] - a[1];
      const lengthSquared = x * x + y * y;
      if (!(lengthSquared > 0) || !Number.isFinite(lengthSquared)) throw new Error('Cut profile has an invalid edge');
    }
    return P.geometry.profileDistance(profile);
  }

  function profileCut({ profile, span, frame = P.transforms.local() }: P18ProfiledCutsInput): P18ProfiledCutsResult {
    const distance2D = polygonDistance(profile);
    if (
      !Array.isArray(span) ||
      span.length !== 2 ||
      !span.every(Number.isFinite) ||
      span[0] >= span[1] ||
      !Array.isArray(frame?.t) ||
      frame.t.length !== 3 ||
      !frame.t.every(Number.isFinite)
    ) {
      throw new Error('Profile extrusions need finite ordered depth and a finite frame');
    }
    const depth = span.slice(),
      scale = P.transforms.distanceScale(frame),
      inverse = M.inv(frame.R);
    const pose: P18ProfiledCutsPose = { R: Array.from(frame.R), t: frame.t.slice() as P18ProfiledCutsVec3 };
    const inversePoint = (point: P18ProfiledCutsVec3): P18ProfiledCutsVec3 => M.app(inverse, V.sub(point, pose.t));
    const localDistance = ([x, y, z]: P18ProfiledCutsVec3, thickness = 0): number =>
      Math.max(distance2D(x, y) - thickness, depth[0] - z, z - depth[1]);
    const distance = (point: P18ProfiledCutsVec3): number => localDistance(inversePoint(point)) * scale;
    const bounds = P.spatial.boxOf(profile.flatMap(([x, y]) => depth.map(z => P.transforms.point(pose, [x, y, z]))));

    function subtract(solidDistance: P18ProfiledCutsDistance3D): P18ProfiledCutsDistance3D {
      if (typeof solidDistance !== 'function') throw new Error('Profile subtraction needs a solid distance field');
      return point => Math.max(solidDistance(point), -distance(point));
    }
    function lining(
      thickness: number,
      solidDistance: P18ProfiledCutsDistance3D = () => -Infinity
    ): P18ProfiledCutsDistance3D {
      if (!Number.isFinite(thickness) || thickness <= 0 || typeof solidDistance !== 'function') {
        throw new Error('Profile lining needs positive local thickness and an optional solid field');
      }
      // The longitudinal extent remains fixed. Lining runs on the profile boundary.
      return point =>
        Math.max(solidDistance(point), -distance(point), localDistance(inversePoint(point), thickness) * scale);
    }
    return Object.freeze({
      bounds: P.data.freeze(bounds),
      distance,
      subtract,
      lining,
      sample: (point: P18ProfiledCutsVec3): P18ProfiledCutsVec3 => P.transforms.point(pose, point),
      project: inversePoint
    });
  }
  P.profileCut = profileCut;
})(KIT);

export {};
