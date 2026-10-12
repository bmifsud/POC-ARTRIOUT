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

const server = http.createServer((req, res) => {
  let rawUrl = req.url?.split('?')[0] || '/';
  if (rawUrl === '/') rawUrl = '/index.html';

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawUrl).replace(/\0/g, '');
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  const sanitizedRelPath = path.normalize(decodedPath).replace(/^[/\\]+/, '');

  const allowedDirs = [DIST_DIR, PUBLIC_DIR, ROOT_DIR];
  let resolvedFilePath = null;

  for (const baseDir of allowedDirs) {
    const targetPath = path.resolve(baseDir, sanitizedRelPath);
    if ((targetPath === baseDir || targetPath.startsWith(baseDir + path.sep)) && fs.existsSync(targetPath)) {
      try {
        const stat = fs.statSync(targetPath);
        if (stat.isFile()) {
          resolvedFilePath = targetPath;
          break;
        }
      } catch {
        // Skip on error
      }
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
