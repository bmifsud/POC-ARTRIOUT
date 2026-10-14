import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const TARGET_DIR = path.resolve(__dirname, '../public/models');
const TARGET_FILE = path.join(TARGET_DIR, 'hand_landmarker.task');

async function fetchModels() {
  console.log(`Fetching MediaPipe hand landmarker model from:\n  ${MODEL_URL}`);

  await mkdir(TARGET_DIR, { recursive: true });

  const response = await fetch(MODEL_URL);
  if (!response.ok) {
    throw new Error(`Failed to download model: HTTP ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await writeFile(TARGET_FILE, buffer);
  console.log(`Successfully wrote ${buffer.length} bytes to ${TARGET_FILE}`);
}

fetchModels().catch((err) => {
  console.error('Error in fetch_models:', err);
  process.exit(1);
});
