-- The vector database: one face embedding per capture (two per employee).
-- Runs once, when the database volume is created.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE face_embeddings (
    id          bigserial PRIMARY KEY,
    -- The employee id in the regular database.
    employee_id text NOT NULL,
    -- ArcFace embedding, normalized (512 numbers).
    embedding   vector(512) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX face_embeddings_employee ON face_embeddings (employee_id);
-- Nearest-neighbour search by cosine distance.
CREATE INDEX face_embeddings_search ON face_embeddings USING hnsw (embedding vector_cosine_ops);
