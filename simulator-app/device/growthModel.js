/* =========================================================
   HYDROGROW GROWTH PHOTO ANALYSIS
   TRAINED STAGE CLASSIFIER (device-side)

   The model below was trained from 5 reference stage photos
   per crop (planting → mature) using the exact feature
   extractor in simulator-app/src/growthFeatures.js.
   Classification is nearest-neighbour over cosine similarity
   of the photo fingerprints, so adding a new crop only means
   appending trained reference vectors here.

   Schedule expectation = crop life fraction boundaries:
   stage 1 < 12%, stage 2 < 40%, stage 3 < 65%,
   stage 4 < 85%, stage 5 = remainder of the cycle.
   ========================================================= */

export const STAGE_NAMES = [
  "Seedling",
  "Vegetative",
  "Flowering",
  "Fruiting",
  "Mature",
];

export const STAGE_BOUNDS = [0.12, 0.4, 0.65, 0.85];

export const CROP_PROFILES = {
  tomato: {
    key: "tomato",
    name: "Tomato",
    cropId: "HG012",
    cycleDays: 120,
    fruitColor: "#e03e2f",
  },

  capsicum: {
    key: "capsicum",
    name: "Capsicum",
    cropId: "HG014",
    cycleDays: 120,
    fruitColor: "#d94f30",
  },
};

/* Trained reference fingerprints — see growthFeatures.js */
export const GROWTH_MODEL = {
  version: 1,
  trainedAt: "2026-10-13T00:00:00.000Z",
  crops: {
    tomato: [
      {
        stage: 1,
        features: [0.0188, 0.0107, 0.1379, 0.0665, 0.9365, 0, 0.0156, 0.0215, 0.0195, 0.0039, 0, 0, 0.0898, 0.0042, 0.0202, 0.0141, 0.0022, 0.0003, 0.0002, 0.0159, 0.0079, 0.0014, 0.0001, 0, 0],
      },
      {
        stage: 2,
        features: [0.0645, 0, 0.0542, 0.0572, 0.2063, 0, 0.0664, 0.2559, 0.1504, 0.0391, 0, 0.0039, 0, 0, 0.0003, 0.0131, 0.0175, 0.0009, 0.003, 0.0207, 0.0016, 0, 0, 0, 0],
      },
      {
        stage: 3,
        features: [0.2366, 0.0037, 0.0671, 0.1595, 0.1905, 0, 0.1484, 0.5039, 0.4375, 0.5078, 0.291, 0, 0.0039, 0.0025, 0.0023, 0.0157, 0.089, 0.0028, 0.0016, 0.0432, 0.0024, 0, 0, 0, 0],
      },
      {
        stage: 4,
        features: [0.1919, 0.0017, 0.095, 0.1227, 0.1746, 0.0313, 0.2207, 0.1465, 0.2285, 0.3574, 0.3652, 0.1699, 0.0156, 0.0008, 0.0149, 0.0169, 0.0713, 0.0065, 0.0028, 0.0073, 0.0009, 0.0007, 0.0001, 0.0001, 0.0002],
      },
      {
        stage: 5,
        features: [0.1978, 0.0764, 0.0762, 0.2029, 0, 0.1348, 0.2109, 0.2148, 0.2891, 0.3652, 0.2383, 0.1289, 0, 0.0556, 0.0176, 0.0433, 0.0428, 0.0044, 0.0014, 0.0376, 0, 0, 0, 0, 0],
      },
    ],

    capsicum: [
      {
        stage: 1,
        features: [0.0176, 0, 0.0386, 0.0768, 0.4286, 0, 0, 0.0059, 0.0684, 0.0664, 0, 0, 0, 0, 0.0003, 0.0131, 0.0012, 0.0007, 0.0008, 0.0514, 0.0091, 0.0001, 0, 0, 0],
      },
      {
        stage: 2,
        features: [0.0515, 0.0044, 0.1331, 0.0715, 0.127, 0.0078, 0.1406, 0.1309, 0.0664, 0.0078, 0.0195, 0.0293, 0.0098, 0.0014, 0.0082, 0.0282, 0.0058, 0.003, 0.0052, 0.0151, 0.004, 0.0006, 0.0001, 0, 0],
      },
      {
        stage: 3,
        features: [0.2671, 0.0017, 0.1321, 0.1746, 0.1429, 0.002, 0.1953, 0.5488, 0.5742, 0.4102, 0.3574, 0.0488, 0, 0, 0.0034, 0.009, 0.1001, 0.0209, 0.0033, 0.0263, 0.0116, 0, 0, 0, 0],
      },
      {
        stage: 4,
        features: [0.2673, 0.009, 0.051, 0.1551, 0.0635, 0.1309, 0.4863, 0.4824, 0.4375, 0.2344, 0.3047, 0.0469, 0.0156, 0.0052, 0.0013, 0.0631, 0.0649, 0.0008, 0.0003, 0.0147, 0.0044, 0.0004, 0, 0, 0],
      },
      {
        stage: 5,
        features: [0.2141, 0.0859, 0.2124, 0.2315, 0.0635, 0.1074, 0.373, 0.5391, 0.3379, 0.1387, 0.1602, 0.0566, 0, 0.0343, 0.0505, 0.0385, 0.063, 0.0014, 0.0006, 0.0217, 0.0082, 0.0001, 0, 0, 0.0133],
      },
    ],
  },
};

export function expectedStageForProgress(progress) {
  const fraction = Math.min(Math.max(progress, 0), 1);

  for (let index = 0; index < STAGE_BOUNDS.length; index += 1) {
    if (fraction < STAGE_BOUNDS[index]) {
      return index + 1;
    }
  }

  return 5;
}

function toUnitVector(vector) {
  let magnitude = 0;

  for (const value of vector) {
    magnitude += value * value;
  }

  magnitude = Math.sqrt(magnitude) || 1;

  return vector.map((value) => value / magnitude);
}

function cosineSimilarity(a, b) {
  let dot = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
  }

  return dot;
}

export function classifyFeatures(cropKey, features) {
  const references = GROWTH_MODEL.crops[cropKey] || [];

  if (references.length === 0) {
    return {
      ok: false,
      error: "No trained model for this crop.",
    };
  }

  const observed = toUnitVector(features);

  const scored = references
    .map((reference) => ({
      stage: reference.stage,
      name: STAGE_NAMES[reference.stage - 1],
      similarity: cosineSimilarity(
        observed,
        toUnitVector(reference.features)
      ),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const best = scored[0];
  const runnerUp = scored[1] || best;

  const confidence = Math.round(
    Math.min(
      99,
      Math.max(40, best.similarity * 100)
    )
  );

  return {
    ok: true,
    stage: best.stage,
    stageName: best.name,
    confidence,
    similarity: Number(best.similarity.toFixed(4)),
    margin: Number(
      (best.similarity - runnerUp.similarity).toFixed(4)
    ),
    alternatives: scored.slice(0, 3).map((entry) => ({
      stage: entry.stage,
      name: entry.name,
      similarity: Number(entry.similarity.toFixed(4)),
    })),
  };
}
