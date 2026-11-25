// node scripts/check.js : the comment guard over the library's own sources
const fs = require('node:fs'),
  path = require('node:path'),
  lib = require('..'),
  webgl = path.join(__dirname, '../src/webgl'),
  cli = path.join(__dirname, '../cli'),
  cliFiles = fs
    .readdirSync(cli)
    .filter(file => file.endsWith('.ts') || file.endsWith('.generated.js'))
    .map(file => path.join(cli, file)),
  gpuFiles = fs
    .readdirSync(webgl)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(webgl, file)),
  bad = lib.lint(
    lib
      .files()
      .concat(lib.demoFiles(), path.join(__dirname, '../webgl.ts'), cliFiles, gpuFiles)
      .flatMap(file => (file.endsWith('.generated.js') ? [file, file.replace(/\.generated\.js$/, '.ts')] : [file]))
  );
if (bad.length) {
  console.error('code after a // comment on the same line (it would never run):\n  ' + bad.join('\n  '));
  process.exit(1);
}
console.log('clean');
