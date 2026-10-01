#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');

console.log('Building AR Trion production artifacts...');

// 1. Clean / create dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Copy static public assets
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, distDir, { recursive: true });
} else {
  // Fallback index.html if public does not exist
  fs.writeFileSync(
    path.join(distDir, 'index.html'),
    '<!DOCTYPE html><html><head><title>AR Trion</title></head><body><h1>AR Trion Build</h1></body></html>'
  );
}

// 3. Create build metadata
const buildMetadata = {
  name: 'ar-trion',
  version: '1.0.0',
  builtAt: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'production'
};

fs.writeFileSync(
  path.join(distDir, 'build-meta.json'),
  JSON.stringify(buildMetadata, null, 2)
);

console.log(`Build complete: Artifacts generated in ${distDir}`);
