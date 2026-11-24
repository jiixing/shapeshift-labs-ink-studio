module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'airflow',
  name: 'Pollen and the floating eye',
  seed: 6,
  build(seed) {
    const palette = [
      0x101a20, 0x203239, 0x354b4d, 0x587066, 0x82947a, 0xaeba91, 0x263544, 0x3d5364, 0x66808a, 0xa9c0bd, 0xe8ead8,
      0x4b4030, 0x80623b, 0xb88c48, 0xe1b968, 0xffdc8b, 0x15252b, 0x27464b, 0x4b807b, 0x8bc5ad, 0xd7efca
    ];
    const B = makeBuilder(seed, palette);
    const S = K.sculpt(makeSculpt(B));
    const rig = K.rig(B, S);
    const P = K.procedural;
    const airflow = P.airflow;
    const eyeRest = [-0.42, 1.48, 0];
    const tearRest = [-0.42, 1.23, 0.43];
    const eyePosition = t => [
      eyeRest[0] + 0.09 * Math.sin(t * 0.57 + seed * 0.13),
      eyeRest[1] + 0.13 * Math.sin(t * 1.07 + 0.4),
      eyeRest[2] + 0.055 * Math.sin(t * 0.83 + 1.2)
    ];

    S.pixel = true;
    S.amb = 0.2;
    S.sky = 0.24;
    S.sunK = 0.58;
    S.sun = K.V.norm([-0.48, 0.82, 0.38]);
    S.ground({ r: [1, 2, 3, 4] }, { rad: 3.55, zs: 0.72, edge: 0.12, res: 0.14 });
    for (const [x, z, radius] of [
      [-2.52, 0.74, 0.16],
      [-1.94, -1.21, 0.12],
      [1.92, 1.16, 0.2],
      [2.62, -0.62, 0.14],
      [0.92, -1.62, 0.1],
      [-0.74, 1.66, 0.13]
    ]) {
      S.rock([x, radius * 0.38, z], radius, { r: [2, 3, 4] }, { res: 0.075 });
    }

    const sclera = { r: [6, 7, 8, 9, 10] };
    const iris = { r: [11, 12, 13, 14, 15] };
    const pupil = { r: [0, 11, 16] };
    const body = S.ball([0, 0, 0], [0.72, 0.46, 0.42], sclera, { res: 0.058, tag: 'eye' });
    S.ball([0, 0.035, 0.395], [0.265, 0.265, 0.085], iris, { res: 0.042, tag: 'eye' });
    S.ball([0, 0.035, 0.468], [0.125, 0.15, 0.045], pupil, { res: 0.032, tag: 'eye' });
    S.ball([-0.055, 0.125, 0.511], 0.037, { r: [10, 10], em: true }, { res: 0.025, tag: 'eye' });
    S.stud(
      body,
      { view: [0, 0.12, 1], at: [0, -0.42], sink: 0.25 },
      0.055,
      { r: [17, 18, 19, 20], em: true },
      { res: 0.03, tag: 'eye' }
    );
    S.bake();

    // Procedural emitters are deterministic loops. Windborne samples advect
    // each particle by its age when sampled with the current airflow frame.
    const pollen = P.emitters.compile({
      id: 'ground-pollen',
      p: [0, 0.045, 0],
      color: [0.58, 0.82, 0.61],
      direction: [0.08, 1, 0.03],
      drift: [0.025, 0.015, -0.02],
      height: 0.92,
      speed: 0.3,
      spread: 1.52,
      growth: 1.45,
      opacity: 1.35,
      size: 0.027,
      count: 88,
      windborne: true,
      seed: seed + 101
    });
    const tears = P.emitters.compile({
      id: 'eye-tears',
      p: tearRest,
      color: [0.52, 0.86, 0.88],
      direction: [0.04, -0.42, 0.9],
      drift: [0, -0.035, 0],
      height: 0.88,
      speed: 0.48,
      spread: 0.075,
      growth: 0.85,
      opacity: 2,
      size: 0.025,
      count: 40,
      windborne: true,
      seed: seed + 211
    });

    let world;
    const particles = K.frameSplats(B, pollen.parameters.count + tears.parameters.count, (draw, dt, t) => {
      const speed = 0.9 + 0.55 * airflow.bend(t, 0.35, 0.92, 0.8);
      const wind = airflow.frame([1.18 * speed, -0.34 * speed]).velocity;
      world.anim.wind = wind;

      for (const sample of pollen.samples(t, { wind })) {
        if (sample.opacity > 0.025)
          draw.point(sample.p, {
            width: sample.size,
            density: sample.opacity * 1.9,
            rgb: pollen.parameters.color,
            emissive: false
          });
      }
      const at = eyePosition(t);
      const offset = at.map((value, i) => value - eyeRest[i]);
      for (const sample of tears.samples(t, { wind })) {
        if (sample.opacity <= 0.025) continue;
        draw.point(
          sample.p.map((value, i) => value + offset[i]),
          {
            width: sample.size,
            density: sample.opacity * 1.65,
            rgb: tears.parameters.color
          }
        );
      }
    });

    world = B.finish({
      cam: { target: [0, 0.78, 0], dist: 8, pitch: 0.24, yaw: 0.2 },
      detail: 22,
      radius: 5.4,
      dither: 0.2
    });
    const stage = K.stage(world);
    rig.bind(stage);
    stage.add({
      pre(dt, t) {
        const turn = 0.07 * Math.sin(t * 0.61 + 0.3);
        rig.set('eye', K.M.rot([0, 1, 0], turn), [0, 0, 0], eyePosition(t));
        rig.apply();
      }
    });
    stage.add(particles);
    return world;
  }
});
