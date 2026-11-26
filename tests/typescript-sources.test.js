const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { transform } = require('esbuild');
const library = require('..');

const migrated = [
  'airflow',
  'art-effects',
  'art-ink',
  'art-passes',
  'art-stability',
  'builder',
  'kit/k0-math',
  'kit/k1-stage',
  'kit/k2-motion',
  'kit/k3-shapes',
  'kit/k4-art',
  'kit/k5-fields',
  'kit/k6-voxels',
  'kit/k7-particles',
  'kit/k8-light',
  'kit/k9-matter',
  'kit/ka-build',
  'kit/kb-mesh',
  'kit/kc-data',
  'kit/kd-mpm',
  'kit/ke-volume',
  'kit/kf-creature',
  'kit/kg-play',
  'kit/kh-animate',
  'kit/ki-deform',
  'kit/kj-acts',
  'kit/kk-character',
  'kit/kl-vox',
  'kit/km-ramp',
  'kit/kn-effects',
  'kit/kn-frame-splats',
  'kit/kn-scene-optics',
  'kit/ko-grow',
  'kit/kp-curve',
  'kit/kpx-pixel',
  'kit/kq-sandbox',
  'kit/kq-surface-presets',
  'kit/kr-tex',
  'kit/ks-xpbd',
  'kit/kt-nodes',
  'kit/ku-motion',
  'kit/kv-form',
  'kit/ky-built',
  'kit/kz-weather',
  'kit/kza-ascii',
  'kit/p00-procedural',
  'kit/p01-procedural-surfaces',
  'kit/p02-procedural-mesh',
  'kit/p03-surface-sampling',
  'kit/p04-profile-triangulation',
  'kit/p05-convex-clipping',
  'kit/p06-implicit-meshing',
  'kit/p06-route-stations',
  'kit/p07-convex-solids',
  'kit/p07-folded-ribbon',
  'kit/p08-fitted-courses',
  'kit/p09-course-relief',
  'kit/p09-planar-cells',
  'kit/p10-gravity-support',
  'kit/p10a-support-courses',
  'kit/p10b-height-clipping',
  'kit/p11-basin-carrier',
  'kit/p12-terraced-carrier',
  'kit/p13-flexible-spans',
  'kit/p14-stable-populations',
  'kit/p15-socket-matching',
  'kit/p16-material-bands',
  'kit/p17-swept-masks',
  'kit/p18-profiled-cuts',
  'kit/p19-clearance-probes',
  'kit/p20-visual-emitters',
  'kit/p21-routes',
  'kit/p22-procedural-styles',
  'kit/p27-surface-contacts',
  'kit/p28-depth-map',
  'kit/p28-fitted-ribbons',
  'kit/p29-sdf-conversion',
  'kit/p30-surface-cells',
  'kit/p31-procedural-heap',
  'kit/p31-surface-cell-loft',
  'kit/p33-panel-frames',
  'kit/p41-shape-grammar',
  'kit/p63-socket-assembly',
  'kit/p64-assembly-damage',
  'kit/p65-load-paths',
  'kit/p87-keyframe-track',
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
const cliMigrated = [
  'art-passes',
  'crisp',
  'depth',
  'pass-preview',
  'png',
  'raster-asset',
  'scene-optics',
  'splat-sampling',
  'sprite-atlas',
  'surface-shading'
];
const toolkit = new Set([
  'kit/k0-math',
  'kit/k1-stage',
  'kit/k2-motion',
  'kit/k3-shapes',
  'kit/k4-art',
  'kit/k5-fields',
  'kit/k6-voxels',
  'kit/k7-particles',
  'kit/k8-light',
  'kit/k9-matter',
  'kit/ka-build',
  'kit/kb-mesh',
  'kit/kc-data',
  'kit/kd-mpm',
  'kit/ke-volume',
  'kit/kf-creature',
  'kit/kg-play',
  'kit/kh-animate',
  'kit/ki-deform',
  'kit/kj-acts',
  'kit/kk-character',
  'kit/kl-vox',
  'kit/km-ramp',
  'kit/kn-effects',
  'kit/kn-frame-splats',
  'kit/kn-scene-optics',
  'kit/ko-grow',
  'kit/kp-curve',
  'kit/kpx-pixel',
  'kit/kq-sandbox',
  'kit/kq-surface-presets',
  'kit/kr-tex',
  'kit/ks-xpbd',
  'kit/kt-nodes',
  'kit/ku-motion',
  'kit/kv-form',
  'kit/ky-built',
  'kit/kz-weather',
  'kit/kza-ascii',
  'kit/p00-procedural',
  'kit/p01-procedural-surfaces',
  'kit/p02-procedural-mesh',
  'kit/p03-surface-sampling',
  'kit/p04-profile-triangulation',
  'kit/p05-convex-clipping',
  'kit/p06-implicit-meshing',
  'kit/p06-route-stations',
  'kit/p07-convex-solids',
  'kit/p07-folded-ribbon',
  'kit/p08-fitted-courses',
  'kit/p09-course-relief',
  'kit/p09-planar-cells',
  'kit/p10-gravity-support',
  'kit/p10a-support-courses',
  'kit/p10b-height-clipping',
  'kit/p11-basin-carrier',
  'kit/p12-terraced-carrier',
  'kit/p13-flexible-spans',
  'kit/p14-stable-populations',
  'kit/p15-socket-matching',
  'kit/p16-material-bands',
  'kit/p17-swept-masks',
  'kit/p18-profiled-cuts',
  'kit/p19-clearance-probes',
  'kit/p20-visual-emitters',
  'kit/p21-routes',
  'kit/p22-procedural-styles',
  'kit/p27-surface-contacts',
  'kit/p28-depth-map',
  'kit/p28-fitted-ribbons',
  'kit/p29-sdf-conversion',
  'kit/p30-surface-cells',
  'kit/p31-procedural-heap',
  'kit/p31-surface-cell-loft',
  'kit/p33-panel-frames',
  'kit/p41-shape-grammar',
  'kit/p63-socket-assembly',
  'kit/p64-assembly-damage',
  'kit/p65-load-paths',
  'kit/p87-keyframe-track'
]);
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

test('migrated source implementations match their TypeScript build', async () => {
  for (const name of migrated) {
    const source = `src/${name}.ts`;
    const result = await transform(fs.readFileSync(path.join(root, source), 'utf8'), {
      loader: 'ts',
      target: 'es2020',
      sourcefile: source
    });
    const expected =
      `// Generated from ${source} by npm run build:src. Do not edit.\n` +
      result.code.replace(/\nexport \{\};\n?$/, '\n');
    assert.equal(fs.readFileSync(path.join(root, 'src', name + '.generated.js'), 'utf8'), expected, name);
  }
});

test('migrated CLI modules keep their existing paths and generated implementations', () => {
  for (const name of cliMigrated) {
    const facade = path.join(root, 'cli', name + '.js');
    assert.equal(
      fs.readFileSync(facade, 'utf8').trim(),
      `module.exports = require('./${name}.generated.js');`
    );
    assert.equal(require('../cli/' + name + '.js'), require('../cli/' + name + '.generated.js'));
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
  assert.equal(vm.runInContext(`[
    typeof KIT.V.add, typeof KIT.field, typeof KIT.tex.noise, typeof KIT.sdfgrid,
    typeof KIT.art, typeof KIT.build.pillar, typeof KIT.flow.sum, typeof KIT.light.capture,
    typeof KIT.look.glass, typeof KIT.creature, typeof KIT.windowLight, typeof KIT.frameSplats,
    typeof KIT.curve.line, typeof KIT.surface.preset, typeof KIT.xpbd.sim, typeof KIT.weather.fall,
    typeof KIT.depth.fromMap, typeof KIT.sdf.toMesh, typeof KIT.anim.keyframeTrack.create
  ].every(value => value === 'function')`, context), true);
  assert.equal(vm.runInContext(`[
    typeof KIT.stage, typeof KIT.spine, typeof KIT.sculpt, typeof KIT.voxels,
    typeof KIT.breaker, typeof KIT.mpm, typeof KIT.play.debris, typeof KIT.anim.clip,
    typeof KIT.deform.apply, typeof KIT.acts.clip, typeof VOX.parse, typeof KIT.reflection.plane,
    typeof KIT.grow.scatter, typeof KIT.pixel.evaluators, typeof KIT.sandbox.attach,
    typeof KIT.form.crystal, typeof KIT.form.wall, typeof KIT.procedural.data.clone,
    typeof KIT.procedural.spatial.bounds, typeof KIT.procedural.geometry.builder
  ].every(value => value === 'function')`, context), true);
  assert.equal(vm.runInContext(`[
    typeof KIT.character, typeof KIT.procedural.geometry.samplePatch,
    typeof KIT.procedural.geometry.triangulate2D, typeof KIT.procedural.geometry.clipConvex,
    typeof KIT.procedural.geometry.implicitSurface, typeof KIT.procedural.routeStations.remap,
    typeof KIT.procedural.pieces.convex, typeof KIT.procedural.foldedRibbon.compile,
    typeof KIT.procedural.fittedCourses, typeof KIT.procedural.courseRelief,
    typeof KIT.procedural.planarCells.cell, typeof KIT.procedural.supportSkirt,
    typeof KIT.procedural.supportCourses, typeof KIT.procedural.geometry.clipHeightMesh,
    typeof KIT.procedural.basins.surface, typeof KIT.procedural.terraces.surface,
    typeof KIT.procedural.spans.catenary, typeof KIT.procedural.populations.layout,
    typeof KIT.procedural.proximity.connect, typeof KIT.procedural.materialBands
  ].every(value => value === 'function')`, context), true);
  assert.equal(vm.runInContext(`[
    typeof KIT.procedural.masks.compose, typeof KIT.procedural.profileCut,
    typeof KIT.procedural.clearance.field, typeof KIT.procedural.emitters.compile,
    typeof KIT.procedural.routes.aroundConvex, typeof KIT.procedural.styles.catalog,
    typeof KIT.procedural.contacts.intersections, typeof KIT.procedural.fittedRibbon,
    typeof KIT.procedural.surfaceCells.clip, typeof KIT.procedural.surfaceCells.loft,
    typeof KIT.procedural.panelFrames
  ].every(value => value === 'function')`, context), true);
  assert.equal(vm.runInContext(`[
    typeof ProceduralHeap, typeof KIT.procedural.grammar.expand,
    typeof KIT.procedural.grammar.assemble, typeof KIT.procedural.construct.loadPaths,
    typeof KIT.procedural.construct.damage
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
