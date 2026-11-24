// Build migrated TypeScript global scripts without changing their browser-facing shape.
const fs = require('node:fs');
const path = require('node:path');
const { transform } = require('esbuild');

const names = ['art-effects', 'airflow', 'light-schedule', 'reflection-plane', 'swept-disc'];
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
      const code = banner(name) + '\n' + result.code;
      if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== code) fs.writeFileSync(output, code);
      console.log(path.relative(root, output));
    })
  );
}

buildSources().catch(() => {
  process.exitCode = 1;
});
