#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const ROOT_DIR = path.resolve('.');
const PUBLIC_DIR = path.resolve('public');
const DIST_DIR = path.resolve('dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.ts': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary'
};

function sanitizeRelativePath(urlPath) {
  if (!urlPath) return 'index.html';
  let decoded = urlPath;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  decoded = decoded.replace(/\0/g, '');
  const normalized = path.normalize(decoded).replace(/^([./\\])+/, '');
  if (normalized.includes('..')) {
    return null;
  }
  return normalized || 'index.html';
}

function resolveSafeFile(baseDir, relPath) {
  const targetPath = path.resolve(baseDir, relPath);
  const rel = path.relative(baseDir, targetPath);
  if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
    if (fs.existsSync(targetPath)) {
      try {
        const stat = fs.statSync(targetPath);
        if (stat.isFile()) {
          return targetPath;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  const rawUrl = req.url?.split('?')[0] || '/';
  const cleanUrl = rawUrl === '/' ? '/index.html' : rawUrl;

  const safeRelPath = sanitizeRelativePath(cleanUrl);
  if (!safeRelPath) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  const allowedDirs = [DIST_DIR, PUBLIC_DIR, ROOT_DIR];
  let resolvedFilePath = null;

  for (const baseDir of allowedDirs) {
    resolvedFilePath = resolveSafeFile(baseDir, safeRelPath);
    if (resolvedFilePath) {
      break;
    }
  }

  if (!resolvedFilePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  fs.readFile(resolvedFilePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    const ext = path.extname(resolvedFilePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`AR Trion static server running at http://localhost:${PORT}`);
});
