import type { ExampleKit, ExampleScene } from './example-types.js';

module.exports = ({ makeBuilder }: ExampleKit): ExampleScene => ({
  id: 'art-effects',
  name: 'Art-pixel emission sequence',
  seed: 1,
  build(seed) {
    const B = makeBuilder(seed, [0x121323, 0x20304a, 0x324858, 0x9e785a, 0xd7a350, 0xffe8a4]);
    const backdrop = B.count();
    for (let y = -8; y <= 8; y++)
      for (let x = -15; x <= 15; x++) {
        B.disc(x * 0.16, y * 0.16, -2.6, [0, 0, 1], 0.107, 0.016, B.P[x % 3 === 0 ? 2 : 1], 2.6);
      }
    B.describeSplats(backdrop, B.count(), { object: 'wall', material: 'water' });
    for (let d = 0; d < 3; d++) {
      B.disc(0.65 + d * 0.39, 0.15 + d * 0.15, 0.25, [0, 0, 1], 0.076 - d * 0.008, 0.02, B.P[5], 1.8, {
        em: true,
        k: 5,
        sp: 2.7
      });
    }
    B.describeSplats(B.count() - 3, B.count(), { object: 'spark', material: 'ember' });
    B.box(-1.12, -0.8, 0.7, 0.32, 0.95, 0.22, [3, 3, 4, 4], { res: 0.065 });
    return B.finish({
      cam: { target: [0, -0.04, 0], dist: 6.9, yaw: 0.04, pitch: 0.08 },
      dither: 0,
      look: {
        effects: {
          glow: { radius: 3, bands: 2, threshold: 0.28, colors: ['#583649', '#965749'] },
          heat: { radius: 8, up: 4, pixels: 2, rate: 9 },
          emitter: { colors: ['#ffb860', '#fff0a6'], rate: 2 },
          trail: { frames: 6, duration: 0.5, colors: ['#41445d', '#b57a5c'] },
          smear: { frames: 3, steps: 8, duration: 0.35, colors: ['#784759', '#da9070'] },
          cycle: { colors: [1, 2], rate: 2, material: 'water' }
        }
      }
    });
  }
});
