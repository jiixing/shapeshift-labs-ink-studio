const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { transform } = require('esbuild');

const names = [
  'adaptive-surface',
  'art-effects',
  'branching-networks',
  'cloth',
  'colony-patterns',
  'composed-fields',
  'constraint-tiles',
  'contact-masks',
  'depth-map',
  'dual-surface-studies',
  'fluid-grids',
  'flow-wake',
  'material-masks',
  'particles',
  'persistent-weather',
  'poisson-patches',
  'preview-lod',
  'rooms-and-caves',
  'route-fields',
  'sampling-detail',
  'sculpt',
  'splat-effects',
  'street-layouts',
  'surface-advection',
  'surface-gallery',
  'terrain-route',
  'texture-synthesis',
  'transport-morph',
  'watershed',
  'weighted-roof'
];
const root = path.join(__dirname, '..');

test('typed examples keep their existing CommonJS paths and generated implementations', () => {
  for (const name of names) {
    const facade = path.join(root, 'examples', name + '.js');
    assert.equal(
      fs.readFileSync(facade, 'utf8').trim(),
      `module.exports = require('./${name}.generated.js');`
    );
    assert.equal(require('../examples/' + name + '.js'), require('../examples/' + name + '.generated.js'));
    assert.equal(typeof require('../examples/' + name + '.js'), 'function');
  }
  assert.equal(typeof require('../examples/depth-map.js').input, 'function');
});

test('typed example implementations match their TypeScript build', async () => {
  for (const name of names) {
    const source = `examples/${name}.ts`;
    const typed = fs.readFileSync(path.join(root, source), 'utf8');
    assert.match(typed, /import type \{/);
    const result = await transform(typed, {
      loader: 'ts',
      target: 'es2020',
      sourcefile: source,
      format: 'cjs'
    });
    const expected = `// Generated from ${source} by npm run build:examples. Do not edit.\n` + result.code;
    assert.equal(fs.readFileSync(path.join(root, 'examples', name + '.generated.js'), 'utf8'), expected, name);
  }
});
