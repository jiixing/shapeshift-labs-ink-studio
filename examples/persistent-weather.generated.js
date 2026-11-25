// Generated from examples/persistent-weather.ts by npm run build:examples. Do not edit.
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: "persistent-weather",
  name: "A freeze and thaw courtyard",
  seed: 3,
  build(seed) {
    const B = makeBuilder(
      24,
      [
        1648687,
        3424067,
        5398109,
        7502960,
        10001281,
        3822666,
        6059098,
        8482129,
        11179377,
        12692866,
        5402486,
        7838106,
        11123378,
        13686980,
        15527386,
        2838101,
        4024685,
        6523018,
        9220264,
        5325111,
        8083266,
        10250315,
        12947051,
        4676942,
        7243622,
        10134651
      ]
    ), S = K.sculpt(makeSculpt(B)), M = K.procedural.motion, width = 42, height = 35, cell = 0.088, origin = [-width * cell / 2, -height * cell / 2], ground = (x, z) => 0.19 + 0.19 * Math.exp(-((x + 0.62) ** 2 + (z + 0.43) ** 2) * 1.55) + 0.12 * Math.exp(-((x - 0.9) ** 2 + (z - 0.43) ** 2) * 3.5) + 0.045 * Math.cos(x * 2 - z * 2.1), n = (x, z) => K.V.norm([ground(x - 0.016, z) - ground(x + 0.016, z), 0.032, ground(x, z - 0.016) - ground(x, z + 0.016)]), shadow = (x, z) => Math.max(0, 0.83 - 0.48 * Math.hypot(x + 0.62, z + 0.68)), weather = M.surfaceWeather({
      width,
      height,
      cell,
      origin,
      maxRunoff: 0.23,
      normal: n,
      initial: (x, z) => ({ wetness: 0.23 + 0.05 * Math.sin(x * 2.3 + z * 3.5), temperature: -3.8 }),
      heatDiffusion: 8e-3,
      wetDiffusion: 0.012
    }), cold = weather.step(2.3, {
      forcing: (x, z) => ({
        air: -6.3 + 7.3 * Math.max(0, x - 0.15),
        light: 0.34,
        shelter: shadow(x, z),
        snowfall: 0.29 * (0.8 + 0.18 * Math.sin(x * 3.1 - z * 4.1)),
        rain: 0.021,
        wind: 0.16
      })
    }), thaw = weather.step(2 + 0.19 * ((seed >>> 0) % 6), {
      forcing: (x, z) => ({
        air: 8.6 + 4 * Math.max(0, x),
        light: 0.84,
        shelter: shadow(x, z) * 0.74,
        rain: x < -0.2 ? 0.095 : 0,
        runoff: [0.11, 0.075],
        wind: 0.45,
        humidity: 0.48
      })
    }), shell = { r: [1, 2, 3, 4] }, paved = { r: [7, 8, 9, 13] }, moss = { r: [23, 24, 25] };
    const machine = {
      initial: "dry",
      states: {
        dry: { r: [7, 8, 9, 14] },
        wet: { r: [15, 16, 17, 18] },
        muddy: { r: [19, 20, 21, 22] },
        cracked: { r: [8, 9, 12, 13] }
      },
      transitions: [
        { id: "rain", from: "dry", event: "rain", to: "wet", when: ({ payload }) => payload.wet > 0.16 },
        { id: "track", from: "wet", event: "walk", to: "muddy" },
        { id: "dry", from: "muddy", event: "sun", to: "cracked", minAge: 0.8 }
      ]
    }, tiles = M.materialStateGraph(machine, [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }]), wet = thaw.sample(-0.48, 0.2).wetness;
    tiles.advance(3.8, [
      { at: 0.6, type: "rain", target: ["b", "c", "d"], payload: { wet } },
      { at: 1.3, type: "walk", target: ["c", "d"] },
      { at: 3.8, type: "sun", target: "d" }
    ]);
    for (const [i, data] of [cold, thaw].entries()) {
      const at = i ? 2 : -2, surface = (x, z) => data.sample(x - at, z), grass = {
        r: [5, 6, 7, 8],
        rf(x, y, z) {
          const s = surface(x, z);
          if (!s) return null;
          if (s.snow > 0.25) return [10, 11, 12, 13, 14];
          if (s.frost > 0.16) return [10, 11, 12, 13];
          if (s.wetness > 0.36) return [5, 15, 16, 17];
          if (s.wetness > 0.19) return [5, 6, 16, 23, 24];
          return [6, 7, 8, 24, 25];
        },
        mod(x, y, z) {
          return (B.n3(x * 9, y * 9, z * 9) - 0.5) * 0.23;
        }
      };
      S.box([at, -0.144, 0], [1.87, 0.22, 1.62], shell, { rd: 0.12, res: 0.072 });
      S.implicitForm(
        {
          bounds: { min: [at - 1.77, -0.03, -1.5], max: [at + 1.77, 0.53, 1.5] },
          sd(x, y, z) {
            const a = x - at, s = surface(x, z), top = ground(a, z) + 0.13 * Math.min(0.72, s?.snow ?? 0);
            return Math.max(Math.abs(a) - 1.77, Math.abs(z) - 1.5, -y - 0.03, y - top);
          }
        },
        grass,
        { res: 0.061 }
      );
      for (const [x, z, r] of [
        [-0.84, -0.7, 0.32],
        [-0.45, -0.82, 0.24],
        [-1.37, 0.72, 0.18],
        [0.97, -0.68, 0.3]
      ]) {
        const sample = surface(at + x, z), y = ground(x, z) + r * 0.26;
        S.rock([at + x, y, z], r, sample?.snow > 0.26 ? { r: [2, 10, 11, 12, 13] } : shell, { res: 0.06 });
      }
      for (const [j, x] of [-1.06, -0.36, 0.36, 1.06].entries()) {
        const id = "abcd"[j], y = ground(x, 1.16) + 0.067 + (data.sample(x, 1.16)?.snow ?? 0) * 0.035, mat = i ? tiles.get(id).material : paved;
        S.box([at + x, y, 1.16], [0.298, 0.072, 0.223], mat, { rd: 0.034, res: 0.049 });
        if (i && tiles.get(id).state === "cracked") {
          S.tube(
            [
              [at + x - 0.23, y + 0.072, 1.08],
              [at + x - 0.02, y + 0.072, 1.13],
              [at + x + 0.04, y + 0.072, 1.28]
            ],
            0.018,
            0.014,
            { r: [19, 20, 21] },
            { res: 0.049 }
          );
        }
      }
      for (const [x, z] of [
        [1.38, -1.06],
        [1.27, -0.95],
        [0.85, 0.73],
        [-0.96, 0.65]
      ]) {
        if ((surface(at + x, z)?.snow ?? 0) > 0.27) continue;
        S.tube(
          [
            [at + x, ground(x, z), z],
            [at + x + 0.12, ground(x, z) + 0.24, z - 0.06]
          ],
          0.035,
          0.018,
          moss,
          { res: 0.051 }
        );
      }
    }
    S.bake();
    return B.finish({
      cam: { target: [0, 0.29, 0], dist: 10.3, pitch: 0.96, yaw: 0.15 },
      detail: 23,
      radius: 4.45,
      dither: 0.18
    });
  }
});
