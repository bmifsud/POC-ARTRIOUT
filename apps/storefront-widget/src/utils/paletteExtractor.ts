export interface ExtractedPalette {
  primary: string;
  secondary: string;
  accent: string;
  rawHexes: string[];
}

export async function extractPaletteFromImage(
  imageSource: File | Blob | string | HTMLImageElement,
  maxSizeMB: number = 40
): Promise<ExtractedPalette> {
  let img: HTMLImageElement;

  if (typeof imageSource === 'string') {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSource;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
  } else if (imageSource instanceof File || imageSource instanceof Blob) {
    if (imageSource.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File size exceeds maximum permitted limit of ${maxSizeMB} MB`);
    }
    const url = URL.createObjectURL(imageSource);
    img = new Image();
    img.src = url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    URL.revokeObjectURL(url);
  } else {
    img = imageSource;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable for palette extraction');
  }

  const sampleSize = 100;
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

  const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
  const colorBuckets = new Map<string, number>();

  for (let i = 0; i < imgData.length; i += 16) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const a = imgData[i + 3];

    if (a < 128) continue;

    const qr = Math.floor(r / 32) * 32;
    const qg = Math.floor(g / 32) * 32;
    const qb = Math.floor(b / 32) * 32;

    const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;
    colorBuckets.set(hex, (colorBuckets.get(hex) || 0) + 1);
  }

  const sortedColors = Array.from(colorBuckets.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);

  const defaultPalette = ['#e63946', '#f1faee', '#457b9d'];
  const hexes = [
    sortedColors[0] || defaultPalette[0],
    sortedColors[1] || sortedColors[0] || defaultPalette[1],
    sortedColors[2] || sortedColors[1] || sortedColors[0] || defaultPalette[2]
  ];

  return {
    primary: hexes[0],
    secondary: hexes[1],
    accent: hexes[2],
    rawHexes: hexes
  };
}
