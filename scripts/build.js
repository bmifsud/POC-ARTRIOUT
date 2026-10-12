#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');

console.log('Building AR Trion production artifacts...');

execSync('node scripts/init-assets.js', { stdio: 'inherit' });

console.log('Executing Vite build...');
execSync('npx vite build', { stdio: 'inherit' });

const distWasm = path.join(distDir, 'wasm');
const distModels = path.join(distDir, 'models');
const publicWasm = path.join(publicDir, 'wasm');
const publicModels = path.join(publicDir, 'models');

if (!fs.existsSync(distWasm) && fs.existsSync(publicWasm)) {
  fs.cpSync(publicWasm, distWasm, { recursive: true });
}
if (!fs.existsSync(distModels) && fs.existsSync(publicModels)) {
  fs.cpSync(publicModels, distModels, { recursive: true });
}

const indexJsContent = `#!/usr/bin/env node
import '../scripts/serve.js';
`;
fs.writeFileSync(path.join(distDir, 'index.js'), indexJsContent);

const buildMetadata = {
  name: 'ar-trion',
  version: '1.3.0',
  builtAt: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'production',
  edgeOptimized: true,
  assets: {
    wasm: fs.existsSync(distWasm) ? fs.readdirSync(distWasm) : [],
    models: fs.existsSync(distModels) ? fs.readdirSync(distModels) : []
  }
};

fs.writeFileSync(
  path.join(distDir, 'build-meta.json'),
  JSON.stringify(buildMetadata, null, 2)
);

console.log(`Build complete: Edge-optimized artifacts generated in ${distDir}`);
