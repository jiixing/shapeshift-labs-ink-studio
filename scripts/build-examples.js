// Build typed CommonJS examples while keeping their .js paths as stable facades.
const fs = require('node:fs');
const path = require('node:path');
const { transform } = require('esbuild');

const names = [
  'adaptive-surface',
  'art-effects',
  'branching-networks',
  'cloth',
  'colony-patterns',
  'constraint-tiles',
  'depth-map',
  'dual-surface-studies',
  'flow-wake',
  'particles',
  'persistent-weather',
  'poisson-patches',
  'rooms-and-caves',
  'sampling-detail',
  'sculpt',
  'splat-effects',
  'terrain-route',
  'transport-morph',
  'watershed',
  'weighted-roof'
];
const root = path.join(__dirname, '..');
const banner = name => `// Generated from examples/${name}.ts by npm run build:examples. Do not edit.`;

async function buildExamples() {
  await Promise.all(
    names.map(async name => {
      const source = path.join(root, 'examples', name + '.ts');
      const output = path.join(root, 'examples', name + '.generated.js');
      const result = await transform(fs.readFileSync(source, 'utf8'), {
        loader: 'ts',
        target: 'es2020',
        sourcefile: path.relative(root, source),
        format: 'cjs'
      });
      const code = banner(name) + '\n' + result.code;
      if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== code) fs.writeFileSync(output, code);
      console.log(path.relative(root, output));
    })
  );
}

buildExamples().catch(() => {
  process.exitCode = 1;
});
