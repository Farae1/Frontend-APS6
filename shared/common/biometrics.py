"""The biometric rules."""

import numpy as np


def similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity of two normalized embeddings."""
    return float(a @ b)


def combine(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """One embedding for the two captures of a session (their normalized mean)."""
    mean = a + b
    return mean / np.linalg.norm(mean)
