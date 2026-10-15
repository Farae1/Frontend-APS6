// The face module: everything about finding the face and taking the two
// captures. The rest of the app imports only from here.
//
//   config.ts          every knob (oval sizes, tolerances, timings, model)
//   detector.ts        the face detection model (the only MediaPipe code)
//   geometry.ts        pure math: oval sizes, camera <-> screen, face fit
//   frames.ts          cropping frames, finding faces, taking the photo
//   FaceCapture.tsx    the capture screen (state machine + layout)
//   OvalOverlay.tsx    the green cover, the oval, the ring and the flash

export { default as FaceCapture, type FaceCaptures } from './FaceCapture'
export { loadFaceDetector as preloadFaceDetector } from './detector'
