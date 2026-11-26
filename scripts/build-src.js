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
  'kit/p31-surface-cell-loft',
  'kit/p33-panel-frames',
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
