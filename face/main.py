"""The face service: turns photos into face embeddings. It holds the model,
in its own container, apart from the API."""

import os

from fastapi import FastAPI, HTTPException, UploadFile

from engine import FaceEngine

engine = FaceEngine(
    detector_path=os.getenv("FACE_DETECTOR", "models/yunet.onnx"),
    embedder_path=os.getenv("FACE_EMBEDDER", "models/w600k_r50.onnx"),
    # Two threads per inference: a sign-in and a registration can run side by side.
    threads=int(os.getenv("FACE_THREADS", "2")),
    min_score=float(os.getenv("FACE_MIN_SCORE", "0.6")),
    # Smallest face accepted, in pixels (ArcFace works on 112x112 faces).
    min_size=int(os.getenv("FACE_MIN_SIZE", "40")),
)

app = FastAPI(title="face")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/embed")
def embed(images: list[UploadFile]):
    """One result per image, in order: the face found, or null when there is none."""
    results = []
    for image in images:
        try:
            face = engine.analyze(image.file.read())
        except ValueError:
            raise HTTPException(400, f"{image.filename}: not an image")
        results.append(
            None if face is None else {"embedding": face.embedding.tolist(), "score": face.score, "box": face.box}
        )
    return {"faces": results}
