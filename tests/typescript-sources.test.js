const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const library = require('..');

const migrated = [
  'airflow',
  'art-effects',
  'art-ink',
  'art-passes',
  'art-stability',
  'builder',
  'kit/kb-mesh',
  'kit/kc-data',
  'kit/km-ramp',
  'kit/kza-ascii',
  'light-schedule',
  'pixel-look',
  'reflection-plane',
  'ripple-field',
  'route-visibility',
  'sample-coverage',
  'sample-visibility',
  'scene-optics',
  'sculpt',
  'splat-effects',
  'splat-order',
  'surface-look',
  'swept-disc',
  'volume-field',
  'volume-light'
];
const toolkit = new Set(['kit/kb-mesh', 'kit/kc-data', 'kit/km-ramp', 'kit/kza-ascii']);
const root = path.join(__dirname, '..');
const relative = file => path.relative(root, file).split(path.sep).join('/');

test('migrated source modules keep their existing paths and generated implementations', () => {
  for (const name of migrated) {
    const facade = path.join(root, 'src', name + '.js');
    if (toolkit.has(name)) {
      assert.equal(
        fs.readFileSync(facade, 'utf8').trim(),
        `module.exports = require('./${path.basename(name)}.generated.js');`
      );
    } else assert.equal(require('../src/' + name + '.js'), require('../src/' + name + '.generated.js'));
  }
});

test('browser bundles use generated global scripts instead of CommonJS loaders', () => {
  const files = library.files().map(relative);
  for (const name of migrated) {
    assert(files.includes('src/' + name + '.generated.js'), name);
    assert(!files.includes('src/' + name + '.js'), name);
  }
  const context = vm.createContext({});
  vm.runInContext(library.bundle(), context);
  assert.equal(vm.runInContext(`[
    Airflow, ArtEffects, ArtInk, ArtPasses, ArtStability, LightSchedule, PixelLook,
    ReflectionPlane, RippleField, RouteVisibility, SampleCoverage, SampleVisibility,
    SceneOptics, SplatEffects, SplatOrder, SurfaceLook, SweptDisc, VolumeField, VolumeLight
  ].every(value => value && typeof value === 'object')`, context), true);
  assert.equal(vm.runInContext(`[
    typeof makeBuilder, typeof makeSculpt,
    typeof KIT.mesh.obj, typeof KIT.mesh.field,
    typeof KIT.diorama.check, typeof KIT.diorama.build,
    typeof KIT.ramp.make, typeof KIT.ascii.draw
  ].every(value => value === 'function')`, context), true);
});

test('migrated effect defaults and shader source remain stable', () => {
  const ArtEffects = require('../src/art-effects.js');
  const LightSchedule = require('../src/light-schedule.js');
  assert.equal(ArtEffects.prepare({ heat: {} }, []).haze.rate, 4);
  assert.equal(LightSchedule.glsl, `
float scheduledFalloff(vec3 delta, float radius, vec4 direction) {
  float radial = max(0.0, 1.0 - length(delta) / radius);
  float facing = direction.w > 0.5 ? smoothstep(-.07, .25, dot(delta, direction.xyz)) : 1.0;
  return radial * radial * facing;
}
`);
});
