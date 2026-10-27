/* =========================================================
   HYDROGROW GROWTH PHOTO ANALYSIS
   BROWSER-SIDE FEATURE EXTRACTION

   Turns a crop photo into a compact numeric fingerprint
   (green coverage, canopy height, hue distribution) that the
   device-side classifier matches against the trained stage
   references. The exact same math produced the trained model,
   so keep this file in sync with it.
   ========================================================= */

export const FEATURE_SIZE = 64;

export const STAGE_NAMES = [
  "Seedling",
  "Vegetative",
  "Flowering",
  "Fruiting",
  "Mature",
];

export function extractGrowthFeatures(image) {
  const canvas = document.createElement("canvas");

  canvas.width = FEATURE_SIZE;
  canvas.height = FEATURE_SIZE;

  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  ctx.drawImage(image, 0, 0, FEATURE_SIZE, FEATURE_SIZE);

  const { data } = ctx.getImageData(
    0,
    0,
    FEATURE_SIZE,
    FEATURE_SIZE
  );

  const total = FEATURE_SIZE * FEATURE_SIZE;

  let greenCount = 0;
  let brownCount = 0;
  let brightCount = 0;
  let saturationSum = 0;

  const rowBuckets = new Array(8).fill(0);
  const rowDensity = new Array(FEATURE_SIZE).fill(0);
  const hueHistogram = new Array(12).fill(0);

  for (let y = 0; y < FEATURE_SIZE; y += 1) {
    let rowGreen = 0;

    for (let x = 0; x < FEATURE_SIZE; x += 1) {
      const index = (y * FEATURE_SIZE + x) * 4;

      const r = data[index] / 255;
      const g = data[index + 1] / 255;
      const b = data[index + 2] / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      const saturation =
        max === 0 ? 0 : (max - min) / max;

      saturationSum += saturation;

      if (max > 0.82) {
        brightCount += 1;
      }

      const isGreen =
        g > 0.16 && g > r * 1.08 && g > b * 1.08;

      if (isGreen) {
        greenCount += 1;
        rowGreen += 1;
        rowBuckets[Math.floor(y / 8)] += 1;
      }

      const isBrown =
        r > 0.25 &&
        r > g * 1.08 &&
        g > b * 1.05 &&
        r - b > 0.12;

      if (isBrown) {
        brownCount += 1;
      }

      let hue = 0;

      if (max !== min) {
        if (max === r) {
          hue = ((g - b) / (max - min)) % 6;
        } else if (max === g) {
          hue = (b - r) / (max - min) + 2;
        } else {
          hue = (r - g) / (max - min) + 4;
        }

        hue *= 60;

        if (hue < 0) {
          hue += 360;
        }
      }

      const bucket = Math.min(11, Math.floor(hue / 30));

      hueHistogram[bucket] += saturation;
    }

    rowDensity[y] = rowGreen / FEATURE_SIZE;
  }

  let canopyTop = 1;

  for (let y = 0; y < FEATURE_SIZE; y += 1) {
    if (rowDensity[y] > 0.12) {
      canopyTop = y / (FEATURE_SIZE - 1);

      break;
    }
  }

  const vector = [
    greenCount / total,
    brownCount / total,
    brightCount / total,
    saturationSum / total,
    canopyTop,
    ...rowBuckets.map((count) => count / (total / 8)),
    ...hueHistogram.map((sum) => sum / total),
  ];

  return vector.map((value) =>
    Math.round(value * 10000) / 10000
  );
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);

      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);

      reject(new Error("Could not read that image file."));
    };

    image.src = url;
  });
}
