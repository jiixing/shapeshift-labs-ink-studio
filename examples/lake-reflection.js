module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'lake-reflection',
  name: 'Mountain lake',
  seed: 12,
  build(seed) {
    const palette = [
      0x13252b, 0x1d4b2d, 0x2f6b35, 0x4b8a3f, 0x74ad4f, 0xa7cc62, 0x3f181b, 0x68231f, 0x963326, 0xc65335, 0xe98a55,
      0x7d2826, 0xb13e30, 0xdf6c49, 0xffa66e, 0x4a4c47, 0x686a61, 0x898a7d, 0xaaa696, 0xcac2aa, 0x0b2a4a, 0x114a78,
      0x1d6f9e, 0x3f9ac2, 0x83c8e3, 0x214f27, 0x3f7a2e, 0x67a63b, 0x9cc94d, 0xc0dc65
    ];
    const B = makeBuilder(seed, palette);
    const S = K.sculpt(makeSculpt(B));
    const P = K.procedural;
    const TAU = Math.PI * 2;
    const waterline = 0.04;
    const lakeCenterZ = 0.05;
    const lakeRadiusX = 3.8;
    const lakeRadiusZ = 2.15;
    const noise = P.fields.simplex({ dimension: 2, seed: seed + 41 });
    const random = (index, channel = 1) => K.hash(index, seed, channel);

    const lakeEdge = angle => 1 + 0.055 * Math.sin(angle * 3 + 0.4) + 0.035 * Math.sin(angle * 7 - 1.1);
    const lakeDistance = (x, z) => {
      const u = x / lakeRadiusX,
        v = (z - lakeCenterZ) / lakeRadiusZ,
        angle = Math.atan2(v, u);
      return (Math.hypot(u, v) - lakeEdge(angle)) * 1.8;
    };
    const groundHeight = (x, z) => {
      const shore = Math.max(0, lakeDistance(x, z));
      return (
        0.24 +
        0.19 * Math.sin(x * 0.62 + z * 0.48) +
        0.12 * Math.cos(x * 1.24 - z * 0.79) +
        0.22 * (1 - Math.exp(-shore * 2.4)) +
        0.055 * Math.max(0, -z - 2)
      );
    };
    const peaks = [
      [-4.25, -4.55, 3.25, 1.45],
      [-2.25, -4.9, 4.55, 1.3],
      [-0.35, -4.55, 5.25, 1.42],
      [1.75, -4.8, 4.35, 1.36],
      [3.75, -4.35, 3.55, 1.5],
      [5.45, -5.05, 2.65, 1.55]
    ];
    const mountainHeight = (x, z) => {
      let height = 0.3 + 0.22 * Math.sin(x * 0.8 + z * 0.45);
      for (const [px, pz, peak, width] of peaks) {
        const dx = (x - px) / width,
          dz = (z - pz) / (width * 1.12);
        height += peak * 0.84 * Math.exp(-(dx * dx + dz * dz));
      }
      const crag =
        0.2 * Math.sin(x * 2.7 + z * 1.8) + 0.12 * Math.sin(x * 4.9 - z * 2.1) + noise.value(x * 0.62, z * 0.62) * 0.32;
      return height + crag * (0.45 + Math.min(0.55, height * 0.12));
    };

    S.pixel = true;
    S.amb = 0.24;
    S.sky = 0.3;
    S.sunK = 0.64;
    S.sun = K.V.norm([-0.46, 0.82, 0.34]);

    const grass = {
      r: [1, 2, 3, 4, 5],
      materialId: 'grass',
      mod: (x, y, z) => (B.n3(x * 0.85, y * 0.85, z * 0.85) - 0.5) * 0.32
    };
    const blades = { r: [26, 27, 28, 29], materialId: 'grass' };
    const mountain = {
      r: [6, 7, 8, 9, 10],
      materialId: 'mountain',
      rf(x, y, z) {
        const highlightLine = 3.72 + 0.22 * Math.sin(x * 2.1 + z * 1.4);
        return y > highlightLine ? [8, 9, 10, 13, 14] : null;
      }
    };
    const stone = { r: [15, 16, 17, 18, 19], materialId: 'stone' };
    const wetStone = { r: [15, 16, 17, 20], materialId: 'stone' };
    const lakeBed = { r: [20, 21, 20], materialId: 'lake-bed' };

    S.terrain(grass, {
      x0: -6.8,
      x1: 6.8,
      z0: -5.8,
      z1: 4.8,
      h: groundHeight,
      keep: (x, z) => lakeDistance(x, z) > 0.025,
      res: 0.15,
      tag: 'grass'
    });
    S.implicitForm(
      {
        bounds: { min: [-6.8, -0.25, -6.25], max: [6.8, 5.65, -2.65] },
        sd: (x, y, z) => y - mountainHeight(x, z)
      },
      mountain,
      { res: 0.18, tag: 'mountain' }
    );
    S.implicitForm(
      {
        bounds: { min: [-4.15, -0.48, -2.75], max: [4.15, -0.04, 2.85] },
        sd: (x, y, z) => Math.max(lakeDistance(x, z), y + 0.02, -0.12 - y)
      },
      lakeBed,
      { res: 0.1 }
    );

    const addRock = (x, z, size, wet = false, stretch = 1) => {
      const y = groundHeight(x, z);
      S.rock(
        [x, y + size * 0.4, z],
        [size * stretch, size * (0.62 + random(Math.round(x * 31 + z * 17), 4) * 0.2), size],
        wet ? wetStone : stone,
        { res: Math.max(0.045, size * 0.3), tag: 'rocks' }
      );
    };

    for (const [x, z, size, stretch] of [
      [-3.42, 0.42, 0.48, 1.25],
      [3.28, 0.76, 0.41, 1.18],
      [-2.55, 1.58, 0.31, 1.35],
      [3.35, -1.38, 0.34, 1.1],
      [0.92, 2.18, 0.27, 1.4],
      [-4.42, -1.42, 0.38, 1.12]
    ]) {
      addRock(x, z, size, lakeDistance(x, z) < 0.7, stretch);
    }

    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * TAU + random(i, 2) * 0.16;
      const edge = lakeEdge(angle);
      const nx = Math.cos(angle) / lakeRadiusX,
        nz = Math.sin(angle) / lakeRadiusZ,
        length = Math.hypot(nx, nz);
      const offset = 0.12 + random(i, 3) * 0.26;
      const x = lakeRadiusX * edge * Math.cos(angle) + (nx / length) * offset;
      const z = lakeCenterZ + lakeRadiusZ * edge * Math.sin(angle) + (nz / length) * offset;
      if (z < -2.55) continue;
      addRock(x, z, 0.075 + random(i, 5) ** 2 * 0.24, true, 0.9 + random(i, 6) * 0.55);
    }

    for (let i = 0; i < 58; i++) {
      const x = (random(i, 7) - 0.5) * 11.6;
      const z = -2.35 + random(i, 8) * 6.8;
      if (lakeDistance(x, z) < 0.2 || Math.hypot(x, z - lakeCenterZ) < 0.1) continue;
      addRock(x, z, 0.055 + random(i, 9) ** 2 * 0.29, false, 0.85 + random(i, 10) * 0.75);
    }

    const addTuft = (x, z, height, index) => {
      const y = groundHeight(x, z);
      for (let blade = 0; blade < 3; blade++) {
        const lean = (blade - 1) * 0.055 + (random(index, blade + 11) - 0.5) * 0.07;
        const depth = (random(index, blade + 14) - 0.5) * 0.09;
        S.tube(
          [
            [x, y, z],
            [x + lean * 0.35, y + height * 0.58, z + depth * 0.4],
            [x + lean, y + height * (0.82 + random(index, blade + 17) * 0.22), z + depth]
          ],
          0.011 + random(index, blade + 20) * 0.006,
          0.007,
          blades,
          { res: 0.06, tag: 'grass' }
        );
      }
    };

    for (let i = 0; i < 72; i++) {
      const x = (random(i, 21) - 0.5) * 12.4;
      const z = -2.15 + random(i, 22) * 6.55;
      if (lakeDistance(x, z) < 0.24) continue;
      addTuft(x, z, 0.13 + random(i, 23) * 0.24, i);
    }
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * TAU + 0.12;
      const edge = lakeEdge(angle);
      const x = lakeRadiusX * edge * Math.cos(angle) * 1.07;
      const z = lakeCenterZ + lakeRadiusZ * edge * Math.sin(angle) * 1.07;
      if (z < -2.45) continue;
      addTuft(x, z, 0.28 + random(i, 24) * 0.28, i + 80);
    }

    S.bake();

    const ripples = K.ripple.field({
      amplitude: 0.16,
      scale: 0.72,
      speed: 0.78,
      width: 0.48,
      damping: 0.2,
      drops: [
        { at: [-1.15, waterline, 0.18], start: 0.15, repeat: 4.8, strength: 0.85 },
        { at: [1.28, waterline, -0.62], start: 1.35, repeat: 5.6, strength: 0.65 },
        { at: [0.24, waterline, 0.72], start: 2.5, repeat: 6.4, strength: 0.5 }
      ]
    });
    const mirror = K.reflection.plane({
      id: 'lake',
      at: [0, waterline, 0],
      normal: [0, 1, 0],
      bias: 0.035,
      select(index, x, y, z, world) {
        const id = world.renderMetadata?.objectIds?.[index];
        const object = world.renderMetadata?.objects?.[id];
        return object === 'mountain' || object === 'rocks';
      }
    });
    const water = K.reflection.material(
      K.surface.preset(
        'rippling-water',
        {
          r: [20, 21, 22, 23, 24],
          a: 1,
          materialId: 'water',
          rf(x, y, z) {
            const distance = Math.hypot((x - 0.65) / 3.1, (z - 0.25) / 1.55);
            const radius = 0.64 + 0.12 * Math.sin(x * 1.7) + 0.08 * Math.cos(z * 2.3);
            return distance < radius ? [8, 9, 10, 13, 14] : null;
          }
        },
        {
          normal: ripples.normal,
          layers: {
            sky: { sky: '#356f9e', horizon: '#9cc9df', ground: '#0a2745', f0: 0.04, strength: 0.42 },
            sun: { color: '#d9f2ff', roughness: [0.32, 0.18], strength: 0.4 },
            ripples: { color: '#78c9ef', strength: 0.3 }
          }
        }
      ),
      'lake',
      { f0: 0.18, power: 2, distortion: 5, blur: 0.25, color: '#ffffff', strength: 0.35 }
    );
    S.ground(water, {
      rad: 4.15,
      zs: 4.15 / 2.5,
      cx: 0,
      cz: lakeCenterZ,
      y: waterline,
      edge: 0,
      keep: (x, z) => lakeDistance(x, z) <= 0,
      res: 0.085,
      tag: 'water'
    });
    S.bake();

    return B.finish({
      cam: { target: [0, 0.9, -0.55], dist: 13.8, pitch: 0.58, yaw: 0.16, sway: 0 },
      detail: 22,
      radius: 8,
      dither: 0.22,
      reflections: [mirror],
      atmosphere: [
        K.atmosphere.fog({ top: 5.8, density: 0.038, color: '#a8c4d6', near: 10, far: 27 }),
        K.atmosphere.sphere({ at: [0, 0.48, -3.45], radius: 4.2, density: 0.03, color: '#b7ced8' })
      ],
      look: {
        pixel: true,
        outline: true,
        clean: true,
        splatOrder: 'surface',
        ink: {
          silhouette: { shadow: '#321c22', highlight: '#e3a074' },
          crease: { steps: 1, litSteps: 0 },
          boundary: { color: '#4a2d2a' },
          light: [-0.46, 0.82, 0.34],
          depthGap: 0.18,
          creaseCosine: 0.62,
          suppressSameMaterial: true,
          materials: {
            stone: { ramp: [15, 16, 17, 18, 19], boundary: { color: '#39443e' } },
            mountain: { ramp: [6, 7, 8, 9, 10] },
            grass: { boundary: false },
            'lake-bed': { silhouette: false, crease: false, boundary: false },
            water: { silhouette: false, crease: false, boundary: false }
          }
        },
        stable: {
          snap: true,
          dither: 'world',
          spacing: 0.1,
          resolve: 'native',
          threshold: 0.35,
          protect: ['rocks']
        }
      }
    });
  }
});
