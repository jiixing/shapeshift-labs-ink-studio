// Generated from examples/poisson-patches.ts by npm run build:examples. Do not edit.
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: "poisson-patches",
  name: "Pebble bed",
  seed: 0,
  build(seed) {
    const palette = [
      1582892,
      3879983,
      5916474,
      7889223,
      10256473,
      11968114,
      3620156,
      6648689,
      8886927,
      12698791,
      4865340,
      8412235,
      11304293,
      14067584
    ];
    const B = makeBuilder(18, palette), S = K.sculpt(makeSculpt(B)), { populations, sampling } = K.procedural;
    const patch = (x, z) => Math.hypot(x / 3.6, z / 2.4) < 1 && Math.hypot(x + 0.4, z - 0.15) > 0.72, radius = 0.41, height = (x, z) => 0.08 * Math.cos(x * 0.8 + z * 0.2) + 0.035 * Math.sin(z * 1.7);
    let points;
    if (seed % 2) {
      points = sampling.poisson({
        bounds: { min: [-3.6, -2.4], max: [3.6, 2.4] },
        radius,
        mask: ([x, z]) => patch(x, z),
        seed: 18
      }).samples.map((sample) => sample.point);
    } else {
      const chunks = [
        { min: [-3.6, -1, -2.4], max: [0, 1, 2.4] },
        { min: [0, -1, -2.4], max: [3.6, 1, 2.4] }
      ];
      const evaluate = (x, z) => patch(x, z) ? { density: 1 } : null, config = { spacing: 0.29, slots: 4, seed: 18, exclusion: { distance: radius } };
      points = chunks.flatMap((region) => populations.layout([region], evaluate, config).instances.map((p) => p.point));
    }
    const soil = {
      r: [1, 2, 3, 4, 5],
      mod: (x, y, z) => (B.n3(x * 2, y * 2, z * 2) - 0.5) * 0.18
    }, rocks = [{ r: [6, 7, 8, 9] }, { r: [10, 11, 12, 13] }];
    S.ground(soil, { h: height, rad: 3.98, edge: 0.04, zs: 1.44, res: 0.103 });
    for (const [x, z] of points) {
      const v = K.hash(Math.round(x * 120), Math.round(z * 120), 117), size = 0.12 + 0.038 * v;
      S.ball([x, height(x, z) + 0.034, z], [size, size * 0.7, size * (0.73 + 0.21 * v)], rocks[+(v > 0.84)], {
        res: 0.056
      });
    }
    S.bake();
    return B.finish({
      cam: { target: [0, 0.05, 0], dist: 9.9, pitch: 0.94, yaw: 0.16 },
      detail: 19,
      dither: 0.22,
      radius: 4.1
    });
  }
});
