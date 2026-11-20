"""
Semantic embedding generator and vector similarity module.
Provides a thread-safe singleton wrapper around sentence-transformers/all-MiniLM-L6-v2.
"""

import threading
import logging
from typing import List, Union, Dict
import numpy as np

logger = logging.getLogger(__name__)

DEFAULT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class LocalSentenceEmbedder:
    """
    Thread-safe singleton managing the local SentenceTransformer model.
    Caches embeddings in memory for rapid repeated similarity evaluations.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(LocalSentenceEmbedder, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_name: str = DEFAULT_MODEL_NAME):
        if self._initialized:
            return
        with self._lock:
            if self._initialized:
                return
            self.model_name = model_name
            self._model = None
            self._cache: Dict[str, np.ndarray] = {}
            self._cache_lock = threading.Lock()
            self._initialized = True

    def _load_model(self):
        """Lazy load SentenceTransformer into memory."""
        if self._model is None:
            with self._lock:
                if self._model is None:
                    try:
                        logger.info("Loading SentenceTransformer model '%s'...", self.model_name)
                        from sentence_transformers import SentenceTransformer
                        # Uses CPU/GPU automatically depending on device availability
                        self._model = SentenceTransformer(self.model_name)
                        logger.info("SentenceTransformer model '%s' loaded successfully.", self.model_name)
                    except Exception as e:
                        logger.error("Failed to load SentenceTransformer model '%s': %s", self.model_name, e)
                        raise e

    def get_embedding(self, text: str) -> np.ndarray:
        """
        Computes 384-dimensional dense semantic embedding for input text.
        Leverages in-memory cache for repeated text strings.
        """
        clean = (text or "").strip()
        if not clean:
            # Return zero vector for empty text
            return np.zeros(384, dtype=np.float32)

        # Check memory cache
        with self._cache_lock:
            if clean in self._cache:
                return self._cache[clean]

        self._load_model()
        vec = self._model.encode(clean, convert_to_numpy=True, normalize_embeddings=True)
        vec = vec.astype(np.float32)

        with self._cache_lock:
            # Prevent unbounded memory growth: keep max 10,000 cached vectors
            if len(self._cache) > 10000:
                # Remove oldest items
                self._cache.clear()
            self._cache[clean] = vec

        return vec

    def get_batch_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Computes dense semantic embeddings for a batch of strings.
        """
        if not texts:
            return np.empty((0, 384), dtype=np.float32)

        # Separate cached from uncached
        uncached_indices = []
        uncached_texts = []
        results = [None] * len(texts)

        with self._cache_lock:
            for idx, raw_t in enumerate(texts):
                t = (raw_t or "").strip()
                if not t:
                    results[idx] = np.zeros(384, dtype=np.float32)
                elif t in self._cache:
                    results[idx] = self._cache[t]
                else:
                    uncached_indices.append(idx)
                    uncached_texts.append(t)

        if uncached_texts:
            self._load_model()
            encoded_batch = self._model.encode(
                uncached_texts,
                batch_size=32,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            ).astype(np.float32)

            with self._cache_lock:
                for idx, text, vec in zip(uncached_indices, uncached_texts, encoded_batch):
                    self._cache[text] = vec
                    results[idx] = vec

        return np.array(results, dtype=np.float32)

    @staticmethod
    def compute_cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """
        Computes cosine similarity between two vectors.
        Assumes normalized vectors from encode(normalize_embeddings=True).
        Returns a float between 0.0 and 1.0 (clamped).
        """
        if vec_a is None or vec_b is None:
            return 0.0
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        dot = float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
        # Clamp to [0.0, 1.0] for similarity interpretation
        return max(0.0, min(1.0, dot))


def get_embedder() -> LocalSentenceEmbedder:
    """Helper factory returning the singleton embedder."""
    return LocalSentenceEmbedder()
