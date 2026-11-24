import type { Camera, CameraOptions, RenderFrame, SplatWorld, Vec3 } from './types';

const defaultFov = (38 * Math.PI) / 180;

export function makeCamera(world: SplatWorld, frame: RenderFrame, width: number, height: number): Camera {
  const camera: CameraOptions = {
    target: [0, 0, 0],
    dist: 12,
    yaw: 0,
    pitch: 0,
    ...world.cam,
    ...frame.camera
  };
  const { yaw, pitch, dist, target, fov = defaultFov, ortho = false } = camera;
  if (
    ![yaw, pitch, dist, fov, target?.[0], target?.[1], target?.[2]].every(Number.isFinite) ||
    dist <= 0 ||
    fov <= 0 ||
    fov >= Math.PI
  )
    throw new RangeError('The camera needs a finite orbit, positive distance, and field of view in (0, π)');
  const radius = world.radius ?? 14;
  const tanFov = Math.tan(fov / 2);
  const aspect = width / height;
  const zoomedDistance = dist / (world.anim?.zoom || 1);
  const viewHeight = zoomedDistance * tanFov;
  const distance = ortho ? zoomedDistance + 2 * radius + 4 : zoomedDistance;
  const xs = Math.sin(yaw);
  const cs = Math.cos(yaw);
  const cy = Math.cos(pitch);
  const zx = cy * xs;
  const zy = Math.sin(pitch);
  const zz = cy * cs;
  const xl = Math.hypot(zz, zx);
  const xx = xl ? zz / xl : cs;
  const xz = xl ? -zx / xl : -xs;
  const yx = zy * xz;
  const yy = zz * xx - zx * xz;
  const yz = -zy * xx;
  const kick = world.anim?.kick;
  const eye: Vec3 = [
    target[0] + (kick?.[0] ?? 0) + distance * zx,
    target[1] + (kick?.[1] ?? 0) + distance * zy,
    target[2] + (kick?.[2] ?? 0) + distance * zz
  ];
  const view = new Float32Array([
    xx,
    yx,
    zx,
    0,
    0,
    yy,
    zy,
    0,
    xz,
    yz,
    zz,
    0,
    -(xx * eye[0] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1
  ]);
  const near = 0.4;
  const far = 400;
  const scale = 1 / tanFov;
  const projection = ortho
    ? new Float32Array([
        1 / (viewHeight * aspect),
        0,
        0,
        0,
        0,
        1 / viewHeight,
        0,
        0,
        0,
        0,
        -2 / (far - near),
        0,
        0,
        0,
        -(far + near) / (far - near),
        1
      ])
    : new Float32Array([
        scale / aspect,
        0,
        0,
        0,
        0,
        scale,
        0,
        0,
        0,
        0,
        (far + near) / (near - far),
        -1,
        0,
        0,
        (2 * far * near) / (near - far),
        0
      ]);
  const depthCenter = ortho ? distance : dist;
  return {
    view,
    projection,
    eye,
    aspect,
    ortho,
    radius,
    tangent: ortho ? viewHeight : tanFov,
    footprint: (dist * 2 * tanFov) / height,
    clipNear: Math.max(0.4, 0.15 * dist),
    depthRange: [depthCenter - radius, depthCenter + radius]
  };
}

export function createDepthSorter(): (world: SplatWorld, view: Float32Array, time: number) => Int32Array {
  const counts = new Uint32Array(65536);
  let depth = new Float32Array(0);
  let keys = new Uint16Array(0);
  let order = new Int32Array(0);
  return function sort(world: SplatWorld, view: Float32Array, time: number): Int32Array {
    const { count, data } = world;
    if (order.length !== count) {
      depth = new Float32Array(count);
      keys = new Uint16Array(count);
      order = new Int32Array(count);
    }
    const m2 = view[2];
    const m6 = view[6];
    const m10 = view[10];
    const m14 = view[14];
    const project = (x: number, y: number, z: number): number => m2 * x + m6 * y + m10 * z + m14;
    for (let i = 0, o = 0; i < count; i++, o += 16) depth[i] = project(data[o], data[o + 1], data[o + 2]);
    for (const i of world.moving ?? []) {
      if (i >= count) continue;
      const o = i * 16;
      const kind = data[o + 11] % 16;
      const phase = data[o + 12];
      const speed = data[o + 13];
      const range = data[o + 14];
      let x = data[o];
      let y = data[o + 1];
      let z = data[o + 2];
      if (kind === 2 || kind === 3) {
        const f = (time * speed) / range + phase;
        y += (kind === 2 ? -1 : 1) * (f - Math.floor(f)) * range;
      } else if (kind === 5) {
        const theta = time * speed;
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const nx = c * x + s * z;
        z = -s * x + c * z;
        x = nx;
      } else y += Math.sin(time * speed + phase) * range;
      depth[i] = project(x, y, z);
    }
    const bones = world.anim?.bones;
    if (bones)
      for (const i of world.anim?.boned ?? []) {
        if (i >= count) continue;
        const o = i * 16;
        const x = data[o];
        const y = data[o + 1];
        const z = data[o + 2];
        const weight = data[o + 14];
        const primary = data[o + 12] * 12;
        const secondary = data[o + 13] * 12;
        const axis = (b: number, a: number): number =>
          bones[b + a * 3] * x + bones[b + a * 3 + 1] * y + bones[b + a * 3 + 2] * z + bones[b + 9 + a];
        const position = (a: number): number => {
          const p = axis(primary, a);
          return weight > 0 ? p + (axis(secondary, a) - p) * weight : p;
        };
        depth[i] = project(position(0), position(1), position(2));
      }
    let min = Infinity;
    let max = -Infinity;
    for (const z of depth) {
      if (z < min) min = z;
      if (z > max) max = z;
    }
    for (const i of world.back ?? []) if (i < count) depth[i] = min;
    const scale = 65535 / (max - min || 1);
    counts.fill(0);
    for (let i = 0; i < count; i++) counts[(keys[i] = ((depth[i] - min) * scale) | 0)]++;
    let next = 0;
    for (let bucket = 0; bucket < counts.length; bucket++) {
      const size = counts[bucket];
      counts[bucket] = next;
      next += size;
    }
    for (let i = 0; i < count; i++) order[counts[keys[i]]++] = i;
    return order;
  };
}
