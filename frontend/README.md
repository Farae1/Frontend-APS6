# Frontend

The web app of the face biometrics access (see the [main README](../README.md)
for the whole system and the API). React + TypeScript + Vite; the user
interface is in Portuguese. Face detection in the browser uses the
[MediaPipe Face Detector](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector),
only to guide the capture: recognition happens in the backend.

## Running

In Docker, it is the `frontend` container of `compose.yaml` (nginx serving the
build and proxying `/api` to the API).

For development, with hot reload (Node.js 20.19 or newer):

```bash
npm install        # also copies MediaPipe's files to public/mediapipe
npm run dev        # http://localhost:5173
npm run dev:phone  # HTTPS on the local network, to test on a phone
```

Without `VITE_API_URL`, a **mocked backend** answers (`src/api/mock.ts`; any
password of 8+ characters signs in as the base minister). To demo a specific
outcome, add it to the URL: `?mock=analyst`, `?mock=manager`,
`?mock=minister`, `?mock=not-recognized`, `?mock=pending-approval`,
`?mock=already-registered` or `?mock=server-error`.

To use the real API in development, start the stack (`docker compose up -d`)
and create `.env.local` with `VITE_API_URL=http://localhost:8080/api`.

Other commands: `npm run build`, `npm run lint`.

## Flows

- **Entrar:** capture → validating → identity confirmed → the vault. In the
  vault, the arrows (or a swipe) move between levels, each level scrolls
  down, and a secret opens in a modal. The gear ⚙ opens the approvals.
- **Registrar:** name and level → capture → sending → registration received
  (under review).
- **The gear ⚙ on the start screen:** the base minister's password (encrypted
  in the browser, `src/api/crypto.ts`) → approvals of ministers.

A session lasts 10 minutes; when it ends, the app goes back to the start.

**The capture** starts on its own: a green cover with an oval, and the camera
shows only inside it. When the face is well placed, a ring fills around the
oval; when it closes, the photo is taken (the oval flashes). Then the oval
grows smoothly, the user comes closer and the second photo is taken the same
way.

## The face capture module (`src/face`)

Everything about finding the face and taking the captures lives in
`src/face`; the rest of the app imports only from `src/face/index.ts`:

```tsx
<FaceCapture title="Cadastre sua biometria" onComplete={(captures) => ...} onCancel={...} />
// captures: { first: Blob, second: Blob }  (JPEG)
```

| file | what it does |
|------|--------------|
| `config.ts` | **every knob**: oval sizes, fit tolerances, timings, model, photo quality |
| `detector.ts` | the face detection model; the only MediaPipe code (runs on the CPU, ~11 ms per frame on the Pi) |
| `geometry.ts` | pure math: oval sizes, camera ↔ screen pixels, whether the face fits |
| `frames.ts` | cropping camera frames, finding faces around the oval, taking the photo |
| `FaceCapture.tsx` | the capture screen: the step-by-step flow and its texts |
| `OvalOverlay.tsx` | the green cover, the oval, the progress ring and the flash |
| `useCamera.ts`, `useFaceDetector.ts`, `useAnimatedOval.ts`, `useScreenSize.ts` | the hooks behind it |

## Layout

```
src/
  App.tsx          the screens of both flows
  face/            the face capture module
  api/             backend calls (client.ts), password encryption (crypto.ts), mock, types
  screens/         Home, RegisterForm, Processing, IdentityConfirmed, Vault,
                   BaseSignIn, Approvals, RegistrationReceived, Failure
  components/      icons, the gear, the secret modal, the status seal, the crystal
public/models/     the browser face detection model (BlazeFace)
scripts/copy-mediapipe.mjs   copies MediaPipe's WebAssembly on npm install
```
