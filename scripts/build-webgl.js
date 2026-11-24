// Build the browser entry from the TypeScript WebGL sources.
const path = require('node:path');
const { build } = require('esbuild');

build({
  absWorkingDir: path.join(__dirname, '..'),
  entryPoints: ['webgl.ts'],
  outfile: 'webgl.mjs',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  banner: { js: '// Generated from webgl.ts by npm run build:webgl. Do not edit.' },
  logLevel: 'info'
}).catch(() => {
  process.exitCode = 1;
});
