// Build migrated TypeScript global scripts without changing their browser-facing shape.
const fs = require('node:fs');
const path = require('node:path');
const { transform } = require('esbuild');

const names = [
  'airflow',
  'art-effects',
  'art-ink',
  'art-passes',
  'art-stability',
  'builder',
  'kit/k0-math',
  'kit/k4-art',
  'kit/k5-fields',
  'kit/k7-particles',
  'kit/k8-light',
  'kit/ka-build',
  'kit/kb-mesh',
  'kit/kc-data',
  'kit/ke-volume',
  'kit/kf-creature',
  'kit/km-ramp',
  'kit/kn-effects',
  'kit/kn-frame-splats',
  'kit/kp-curve',
  'kit/kq-surface-presets',
  'kit/kr-tex',
  'kit/ks-xpbd',
  'kit/kt-nodes',
  'kit/ku-motion',
  'kit/kz-weather',
  'kit/kza-ascii',
  'kit/p28-depth-map',
  'kit/p29-sdf-conversion',
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
const root = path.join(__dirname, '..');
const banner = name => '// Generated from src/' + name + '.ts by npm run build:src. Do not edit.';

async function buildSources() {
  await Promise.all(
    names.map(async name => {
      const source = path.join(root, 'src', name + '.ts');
      const output = path.join(root, 'src', name + '.generated.js');
      const result = await transform(fs.readFileSync(source, 'utf8'), {
        loader: 'ts',
        target: 'es2020',
        sourcefile: path.relative(root, source)
      });
      // Toolkit sources use module scope only to keep their KIT declarations
      // isolated during type-checking; the browser still loads plain scripts.
      const code = banner(name) + '\n' + result.code.replace(/\nexport \{\};\n?$/, '\n');
      if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== code) fs.writeFileSync(output, code);
      console.log(path.relative(root, output));
    })
  );
}

buildSources().catch(() => {
  process.exitCode = 1;
});
