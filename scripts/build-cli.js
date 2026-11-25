// Build the CommonJS CLI entry and migrated modules while keeping .js dependency paths external.
const path = require('node:path');
const { build } = require('esbuild');

const modules = [
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
const root = path.join(__dirname, '..');
const banner = name => `// Generated from cli/${name}.ts by npm run build:cli. Do not edit.`;

async function buildCli() {
  await Promise.all([
    ...modules.map(name =>
      build({
        absWorkingDir: root,
        entryPoints: [`cli/${name}.ts`],
        outfile: `cli/${name}.generated.js`,
        bundle: false,
        format: 'cjs',
        platform: 'node',
        target: 'node18',
        banner: { js: banner(name) },
        logLevel: 'silent'
      }).then(() => console.log(`cli/${name}.generated.js`))
    ),
    build({
      absWorkingDir: root,
      entryPoints: ['cli/ink-studio.ts'],
      outfile: 'cli/ink-studio.generated.js',
      bundle: true,
      format: 'cjs',
      platform: 'node',
      target: 'node18',
      packages: 'external',
      plugins: [
        {
          name: 'external-javascript-dependencies',
          setup(build) {
            build.onResolve({ filter: /^\.{1,2}\// }, args =>
              args.kind === 'entry-point' ? undefined : { path: args.path, external: true }
            );
          }
        }
      ],
      banner: { js: banner('ink-studio') },
      logLevel: 'info'
    })
  ]);
}

buildCli().catch(() => {
  process.exitCode = 1;
});
