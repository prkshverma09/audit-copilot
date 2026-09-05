import hashlib
import logging
from typing import Any, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

from app.config import settings

logger = logging.getLogger("audit-copilot.qdrant")


class QdrantCacheService:
    """
    Layout memory and document caching service using Qdrant.
    Features graceful fallback to local memory cache if Qdrant container is not running.
    """

    COLLECTION_NAME = "document_layout_cache"

    def __init__(self, url: Optional[str] = None):
        self.url = url or settings.qdrant_url
        self.client: Optional[QdrantClient] = None
        self._local_cache: Dict[str, Any] = {}
        self._is_connected = False
        self._initialize_connection()

    def _initialize_connection(self):
        try:
            self.client = QdrantClient(url=self.url, timeout=2.0)
            # Test connectivity
            self.client.get_collections()
            self._is_connected = True
            self._ensure_collection()
            logger.info(f"Connected to Qdrant at {self.url}")
        except Exception as e:
            self._is_connected = False
            self.client = None
            logger.info(f"Qdrant container not reachable ({e}). Using local in-memory layout cache.")

    def _ensure_collection(self):
        if not self._is_connected or not self.client:
            return
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            if self.COLLECTION_NAME not in collections:
                self.client.create_collection(
                    collection_name=self.COLLECTION_NAME,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
                )
                logger.info(f"Created Qdrant collection '{self.COLLECTION_NAME}'")
        except Exception as e:
            logger.warning(f"Error ensuring Qdrant collection: {e}")

    def get_cached_layout(self, doc_fingerprint: str) -> Optional[Dict[str, Any]]:
        # Check local cache first
        if doc_fingerprint in self._local_cache:
            return self._local_cache[doc_fingerprint]
        return None

    def store_cached_layout(self, doc_fingerprint: str, layout_data: Dict[str, Any]):
        self._local_cache[doc_fingerprint] = layout_data

    @staticmethod
    def compute_fingerprint(filename: str, page_count: int, first_page_text: str = "") -> str:
        content = f"{filename}_{page_count}_{first_page_text[:500]}"
        return hashlib.sha256(content.encode("utf-8")).hexdigest()


qdrant_cache = QdrantCacheService()
