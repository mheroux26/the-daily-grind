import os
from pathlib import Path

from pydantic_settings import BaseSettings

# Find .env relative to this file (backend/app/config.py → backend/.env)
_env_path = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    google_books_api_key: str = ""  # Optional – works without key at low volume
    amazon_affiliate_tag: str = ""  # e.g. "yourtag-20"
    max_results: int = 10
    ocr_lang: str = "eng"

    class Config:
        env_file = str(_env_path)


settings = Settings()

# Log whether the key was loaded
if settings.google_books_api_key:
    print(f"Google Books API key loaded (ends with ...{settings.google_books_api_key[-6:]})")
else:
    print("WARNING: No Google Books API key found — rate limits will be very low")
