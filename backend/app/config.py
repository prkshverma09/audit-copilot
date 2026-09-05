import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "X-Ray Audit Copilot API"
    api_prefix: str = "/api/v1"
    debug: bool = False
    
    # CORS: Allow frontend dev servers (Next.js default 3000, vite 5173, or any in dev)
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "*"
    ]
    
    # Google GenAI Settings
    gemini_api_key: Optional[str] = None
    gemini_reasoning_model: str = "gemini-3.6-flash"
    gemini_fast_model: str = "gemini-3.6-flash"
    
    # Storage settings (Local directory cache / S3 emulator)
    storage_path: str = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "storage_cache")
    )
    
    # Qdrant Vector DB
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
