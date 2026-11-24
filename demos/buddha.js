// A seated, low-poly Buddha modeled from the six-view turnaround in buddha.jpg.
// The sculpture is deliberately built from simple volumes so its silhouette and
// triangular light planes read clearly in the splat renderer.
function buddhaFacetNormals() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const vertices = [
    [-1, phi, 0],
    [1, phi, 0],
    [-1, -phi, 0],
    [1, -phi, 0],
    [0, -1, phi],
    [0, 1, phi],
    [0, -1, -phi],
    [0, 1, -phi],
    [phi, 0, -1],
    [phi, 0, 1],
    [-phi, 0, -1],
    [-phi, 0, 1]
  ].map(v => {
    const length = Math.hypot(...v);
    return v.map(n => n / length);
  });
  const faces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1]
  ];
  return faces.map(([ai, bi, ci]) => {
    const a = vertices[ai],
      b = vertices[bi],
      c = vertices[ci];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const length = Math.hypot(...n) || 1;
    n = n.map(value => value / length);
    const center = [a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]];
    if (n[0] * center[0] + n[1] * center[1] + n[2] * center[2] < 0) n = n.map(value => -value);
    return n;
  });
}

const BUDDHA_FACETS = buddhaFacetNormals();
const buddhaFacet = (x, y, z, nx, ny, nz) => {
  let best = BUDDHA_FACETS[0],
    score = -Infinity;
  for (const normal of BUDDHA_FACETS) {
    const dot = normal[0] * nx + normal[1] * ny + normal[2] * nz;
    if (dot > score) {
      score = dot;
      best = normal;
    }
  }
  return best;
};

function sceneBuddha(seed) {
  const K = KIT;
  const B = makeBuilder(seed, [0xe4ded0, 0x58402d, 0x715039, 0x8c6243, 0xa87a52, 0xc39667, 0xd9b47f, 0xecd2a5]);
  const S = K.sculpt(makeSculpt(B));
  const clay = { r: [1, 2, 3, 4, 5, 6, 7], form: buddhaFacet };
  const planarClay = { r: [1, 2, 3, 4, 5, 6, 7] };
  const robe = { r: [2, 3, 4, 5, 6, 7], form: buddhaFacet };
  const ground = { r: [0], em: true };

  S.sun = B.norm([-0.55, 0.82, 0.62]);
  S.amb = 0.22;
  S.sky = 0.2;
  S.sunK = 1;
  S.aoK = 0.48;
  S.aoR = 0.38;
  S.shK = 0.7;
  S.res = 0.115;
  S.fat = 0.56;
  S.wob = 0;

  S.ground(ground, { y: -0.025, rad: 18, zs: 1.15, res: 0.28 });
  S.ball([0, 0.002, 0.18], [2.88, 0.025, 2.05], { r: [1], a: 0.2 }, { res: 0.18, ghost: true });

  // Lotus pedestal: a twelve-sided drum with two staggered rings of petals.
  S.lathe([0, -0.01, 0], 0.4, [2.56, 2.34], planarClay, { n: 12, res: 0.105 });
  S.ball([0, 0.52, 0], [1.86, 0.25, 1.86], planarClay, { res: 0.11 });
  const petal = (count, radius, y, rx, ry, rz, tilt, phase) => {
    const outline = [
      [-rx * 0.78, 0],
      [-rx * 0.24, rz * 0.78],
      [rx * 0.58, rz * 0.52],
      [rx, 0],
      [rx * 0.58, -rz * 0.52],
      [-rx * 0.24, -rz * 0.78]
    ];
    for (let i = 0; i < count; i++) {
      const angle = phase + (i * Math.PI * 2) / count;
      const radial = [Math.cos(angle) * Math.cos(tilt), Math.sin(tilt), Math.sin(angle) * Math.cos(tilt)];
      const tangent = [-Math.sin(angle), 0, Math.cos(angle)];
      const up = [-Math.cos(angle) * Math.sin(tilt), Math.cos(tilt), -Math.sin(angle) * Math.sin(tilt)];
      S.extrude([outline], [Math.cos(angle) * radius, y, Math.sin(angle) * radius], ry * 2, planarClay, {
        ax: [radial, tangent, up],
        res: 0.095
      });
    }
  };
  petal(16, 1.86, 0.42, 0.92, 0.16, 0.32, -0.13, 0);
  petal(12, 1.3, 0.7, 0.76, 0.2, 0.29, 0.18, Math.PI / 12);
  S.lathe([0, 0.75, 0], 0.22, [1.4, 1.24], planarClay, { n: 12, res: 0.1 });

  // Crossed legs and the broad seated mass.
  S.ball([0, 1.62, 0.02], [1.62, 0.38, 0.88], clay, { res: 0.12 });
  S.ball([0, 1.64, 0.48], [1.48, 0.32, 0.7], planarClay, { res: 0.115 });
  for (const side of [-1, 1]) {
    S.tube(
      [
        [side * 0.58, 1.9, -0.02],
        [side * 1.32, 1.61, 0.38],
        [side * 1.65, 1.39, 0.86]
      ],
      t => 0.46 - 0.12 * t,
      0,
      clay,
      { res: 0.115 }
    );
    S.tube(
      [
        [side * 1.65, 1.39, 0.86],
        [side * 0.72, 1.24, 1.17],
        [-side * 0.66, 1.23, 1.24]
      ],
      t => 0.33 - 0.1 * t,
      0,
      clay,
      { res: 0.11 }
    );
    S.ball([side * 0.86, 1.24, 1.31], [0.46, 0.17, 0.29], clay, {
      ax: [
        [1, 0, 0],
        [0, 1, 0],
        [side * 0.18, 0, 1]
      ],
      res: 0.105
    });
  }

  // Torso, shoulders, neck and head. The torso is planar; the clay normals form broad light planes.
  const torsoProfile = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 12;
    return [Math.cos(angle), Math.sin(angle) * 0.64];
  });
  const torso = K.procedural.forms.loft([
    { y: 2.18, profile: torsoProfile, scale: 0.74, roll: 0.04 },
    { y: 2.65, profile: torsoProfile, scale: 0.88, roll: -0.03 },
    { y: 3.25, profile: torsoProfile, scale: 1.06, roll: 0.05 },
    { y: 3.85, profile: torsoProfile, scale: 1.16, roll: -0.04 },
    { y: 4.18, profile: torsoProfile, scale: 1.08, roll: 0.03 },
    { y: 4.37, profile: torsoProfile, scale: 0.5, roll: 0 }
  ]);
  S.implicitForm(torso, planarClay, { res: 0.105, cell: 0.1 });
  S.ball([0, 4.43, 0], [0.34, 0.32, 0.32], clay, { res: 0.105 });
  S.ball([0, 5.0, 0.035], [0.46, 0.58, 0.43], clay, { res: 0.075 });
  S.ball([0, 5.43, -0.06], [0.47, 0.23, 0.42], clay, { res: 0.07 });
  S.ball([0, 5.7, -0.055], [0.28, 0.3, 0.27], clay, { res: 0.065 });
  for (const side of [-1, 1]) {
    S.ball([side * 0.49, 4.94, 0.01], [0.11, 0.28, 0.11], clay, { res: 0.08 });
    S.tube(
      [
        [side * 1.06, 4.0, 0.02],
        [side * 1.24, 3.28, 0.18],
        [side * 1.0, 2.57, 0.56],
        [side * 0.4, 2.06, 0.99]
      ],
      t => 0.3 - 0.12 * t,
      0,
      clay,
      { res: 0.11 }
    );
  }

  // A folded robe over one shoulder and a diagonal sash across the torso.
  S.ball([-0.76, 3.98, 0.12], [0.48, 0.56, 0.39], robe, { res: 0.11 });
  S.ball([0, 3.46, 0.59], [1.18, 0.23, 0.065], robe, {
    ax: [
      [0.55, -0.835, 0],
      [0.835, 0.55, 0],
      [0, 0, 1]
    ],
    res: 0.095
  });

  // Hands resting together in dhyana mudra.
  for (const side of [-1, 1]) {
    S.ball([side * 0.15, 2.06, 1.06], [0.21, 0.095, 0.26], clay, {
      ax: [
        [1, 0, 0],
        [0, 1, 0],
        [side * 0.16, 0, 1]
      ],
      res: 0.085
    });
    S.ball([side * 0.065, 2.13, 1.24], [0.065, 0.11, 0.1], clay, { res: 0.07 });
  }

  // Closed eyes and lips are carved into the clay; the nose and urna catch light.
  for (const side of [-1, 1])
    S.tube(
      [
        [side * 0.08, 5.17, 0.448],
        [side * 0.27, 5.15, 0.368]
      ],
      0.012,
      0.009,
      clay,
      { neg: true, res: 0.028 }
    );
  S.tube(
    [
      [-0.1, 4.86, 0.455],
      [0.1, 4.86, 0.455]
    ],
    0.011,
    0.008,
    clay,
    { neg: true, res: 0.028 }
  );
  S.ball([0, 4.98, 0.49], [0.06, 0.14, 0.09], clay, { res: 0.05 });
  S.ball([0, 5.36, 0.375], [0.02, 0.02, 0.018], clay, { res: 0.03 });

  S.bake();
  return B.finish({
    cam: { target: [0, 3.0, 0], dist: 10.5, pitch: 0.08, yaw: 0 },
    detail: 28,
    dither: 0.05,
    look: { clean: true },
    palName: 'Buddha clay',
    radius: 7
  });
}

SCENES.push({
  id: 'buddha',
  name: 'Seated Buddha',
  blurb: 'A faceted clay Buddha in dhyana mudra on a lotus pedestal.',
  seed: 4,
  build: sceneBuddha
});
