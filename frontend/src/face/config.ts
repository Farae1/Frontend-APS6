// Every knob of the face capture lives here: tweak the experience without
// touching the logic.

export const FACE_CONFIG = {
  /** The face detection model (see detector.ts). Paths are relative to the site root. */
  model: {
    wasmPath: 'mediapipe',
    modelPath: 'models/blaze_face_short_range.tflite',
    minConfidence: 0.6,
  },

  /** Camera resolution we ask for (the browser picks the closest it has). */
  camera: { width: 1280, height: 720 },

  /** The oval of each step. The second one is ~1.5x bigger, so the user moves closer. */
  oval: {
    /** Height / width: the shape of a face. */
    aspectRatio: 1.32,
    /** Vertical position of the oval center, as a fraction of the screen height. */
    centerY: 0.46,
    steps: {
      1: { widthFraction: 0.62, maxWidth: 290, heightFraction: 0.48 },
      2: { widthFraction: 0.86, maxWidth: 390, heightFraction: 0.64 },
    },
  },

  /** When a detected face counts as "well placed" inside the oval. */
  fit: {
    /**
     * Face box width / oval width accepted at each step. The ranges don't
     * overlap once the oval grows: whoever fit step 1 has to come closer.
     */
    sizeRange: { 1: [0.48, 0.98], 2: [0.72, 1.05] },
    /** How far the face center may drift from the oval center (fraction of the radius). */
    centerTolerance: 0.32,
    /** The oval includes forehead and hair, so the face box sits a bit below its center. */
    centerOffsetY: 0.06,
  },

  /** Faces are searched only around the oval, in a region this many radii wide/tall. */
  searchArea: { x: 1.6, y: 1.4 },

  timing: {
    /** How long the face must stay in place for a capture (the ring going around). */
    holdMs: 1200,
    /** A face that slips out for less than this keeps the ring where it is (detection flickers). */
    graceMs: 600,
    /** After the grace, the ring empties this many times slower than it fills. */
    emptySlowdown: 2,
    /** The oval growing from step 1 to step 2. */
    growMs: 1100,
    /** The pause showing "capture done" before moving on. */
    doneMs: 900,
  },

  snapshot: {
    /** Extra room around the oval in the photo, so chin and forehead aren't cut. */
    margin: 0.15,
    type: 'image/jpeg',
    quality: 0.92,
  },
} as const

export type Step = 1 | 2
