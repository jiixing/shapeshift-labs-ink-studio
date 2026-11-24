const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('..');
const { render } = require('../cli/render.js');

test('the built-in Buddha builds and renders as a faceted splat sculpture', () => {
  const kit = core.load();
  const scene = kit.SCENES.find(entry => entry.id === 'buddha');
  assert(scene, 'the Buddha scene is registered');
  const world = scene.build(scene.seed);
  assert(world.count > 1000, 'the sculpture contains splats');
  assert(world.data instanceof Float32Array);
  assert.equal(world.cam.yaw, 0);

  const image = render(world, { w: 180, h: 135 });
  assert.equal(image.rgb.length, image.w * image.h * 3);
  assert(image.rgb.some((value, index) => index % 3 === 0 && value !== image.rgb[0]));
});
