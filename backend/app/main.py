import logging
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from .models import ScanResponse
from .ocr import (
    extract_text,
    extract_text_with_positions,
    build_query_variations,
    build_query_variations_with_positions,
)
from .search import search_books, search_books_with_fallback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("photo-to-tbr")

app = FastAPI(
    title="Photo-to-TBR API",
    version="0.5.0",
    description="Upload a book cover photo or search by title → get matched books with buy links",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/scan", response_model=ScanResponse)
async def scan_book_cover(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Upload must be an image file")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 10 MB")

    # Step 1: OCR with position data
    try:
        texts_with_pos = extract_text_with_positions(image_bytes)
        ocr_text = extract_text(image_bytes)
    except RuntimeError as e:
        raise HTTPException(500, str(e))
    except Exception as e:
        raise HTTPException(
            500,
            "Image processing failed: {}. Try a clearer photo.".format(str(e))
        )

    # === DEBUG LOGGING ===
    logger.info("=" * 60)
    logger.info("RAW OCR TEXT: %s", ocr_text)
    logger.info("TEXT WITH POSITIONS:")
    for (text, x, y, h) in texts_with_pos:
        zone = "BOOK" if 0.35 <= y <= 0.80 else ("OVERLAY" if 0.15 <= y < 0.35 else "UI")
        logger.info("  [%s] y=%.2f x=%.2f h=%.3f: '%s'", zone, y, x, h, text)
    # =====================

    if not ocr_text.strip() and not texts_with_pos:
        raise HTTPException(
            422,
            "Couldn't read any text from this image. "
            "Try the search bar instead — just type the book title."
        )

    # Step 2: Build smart queries using positions + text
    if texts_with_pos:
        queries = build_query_variations_with_positions(texts_with_pos, ocr_text)
    else:
        queries = build_query_variations(ocr_text)

    # === DEBUG LOGGING ===
    logger.info("QUERIES TO TRY:")
    for i, q in enumerate(queries):
        logger.info("  Query %d: '%s'", i + 1, q)
    logger.info("=" * 60)
    # =====================

    if not queries or all(not q.strip() for q in queries):
        raise HTTPException(
            422,
            "Couldn't build a search query. "
            "Try the search bar instead — just type the book title."
        )

    # Step 3: Search with fallback
    try:
        matches, query_used = await search_books_with_fallback(queries)
    except Exception as e:
        raise HTTPException(502, "Book search failed: {}".format(e))

    logger.info("FINAL QUERY USED: '%s' -> %d matches", query_used, len(matches))

    return ScanResponse(
        ocr_text=ocr_text,
        query_used=query_used,
        matches=matches,
    )


@app.get("/search", response_model=ScanResponse)
async def search_by_text(q: str, mode: str = "title"):
    """
    Search for books. Mode determines how the query is interpreted:
      - "title": search by book title (intitle:)
      - "author": search by author name (inauthor:)
      - "both": search with title + author (use "by" to separate, e.g. "Bright Years by Sarah Dame")
    """
    if not q.strip():
        raise HTTPException(400, "Search query cannot be empty")

    raw = q.strip()
    query = _build_query_for_mode(raw, mode)
    logger.info("TEXT SEARCH [mode=%s]: '%s' -> query='%s'", mode, raw, query)

    try:
        matches = await search_books(query)

        # If structured query returns nothing, fall back to raw text
        if not matches and query != raw:
            logger.info("  Structured query empty, falling back to raw: '%s'", raw)
            matches = await search_books(raw)
            query = raw
    except Exception as e:
        raise HTTPException(502, "Book search failed: {}".format(e))

    logger.info("TEXT SEARCH RESULT: query='%s' -> %d matches", query, len(matches))

    return ScanResponse(
        ocr_text="",
        query_used=query,
        matches=matches,
    )


def _build_query_for_mode(text: str, mode: str) -> str:
    """
    Build a Google Books query based on the user's chosen search mode.

    Mode "title":  "The Bright Years"       -> intitle:Bright intitle:Years
    Mode "author": "Elin Hilderbrand"       -> inauthor:Elin inauthor:Hilderbrand
    Mode "both":   "Bright Years by Sarah"  -> intitle:Bright intitle:Years inauthor:Sarah
    """
    import re

    words = text.split()

    if mode == "author":
        # All words treated as author name
        author_words = [w for w in words if len(w) >= 2]
        if author_words:
            return " ".join("inauthor:" + w for w in author_words[:4])
        return text

    if mode == "title":
        # All words treated as title
        title_words = [w for w in words if len(w) >= 2 and w.lower() not in ("the", "a", "an")]
        if title_words:
            return " ".join("intitle:" + w for w in title_words[:5])
        return text

    if mode == "both":
        # Check for "by" separator
        by_match = re.split(r'\s+by\s+', text, maxsplit=1, flags=re.IGNORECASE)
        if len(by_match) == 2:
            title_part, author_part = by_match
            parts = []
            for w in title_part.split():
                if len(w) >= 2 and w.lower() not in ("the", "a", "an"):
                    parts.append("intitle:" + w)
            for w in author_part.split():
                if len(w) >= 2:
                    parts.append("inauthor:" + w)
            if parts:
                return " ".join(parts)

        # No "by" — just do a plain combined search
        return text

    # Unknown mode — plain search
    return text
