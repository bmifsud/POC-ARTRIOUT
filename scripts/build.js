#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');

console.log('Building AR Trion production artifacts...');

// 1. Ensure public assets exist
execSync('node scripts/init-assets.js', { stdio: 'inherit' });

// 1.5. Compile Renderer WASM Artifacts
console.log('Compiling WASM renderer...');
execSync('npx tsx packages/rendering/scripts/build-wasm.js', { stdio: 'inherit' });

// 2. Execute Vite build for edge-optimized bundling (fail hard if build errors occur)
console.log('Executing Vite build...');
execSync('npx vite build', { stdio: 'inherit' });

// 3. Ensure wasm and models directories are mapped to final distribution folder
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

// 4. Create dist/index.js wrapper for legacy entry points
const indexJsContent = `#!/usr/bin/env node
import '../scripts/serve.js';
`;
fs.writeFileSync(path.join(distDir, 'index.js'), indexJsContent);

// 5. Create build metadata
const buildMetadata = {
  name: 'ar-trion',
  version: '1.4.0',
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
