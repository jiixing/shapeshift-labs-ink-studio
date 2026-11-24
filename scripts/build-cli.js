// Build the CommonJS CLI entry while leaving runtime-loaded JavaScript modules external.
const path = require('node:path');
const { build } = require('esbuild');

build({
  absWorkingDir: path.join(__dirname, '..'),
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
  banner: { js: '// Generated from cli/ink-studio.ts by npm run build:cli. Do not edit.' },
  logLevel: 'info'
}).catch(() => {
  process.exitCode = 1;
});
