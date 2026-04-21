import asyncio
import logging
import re
from typing import List, Optional, Tuple
from urllib.parse import quote_plus

import httpx

from .config import settings
from .genre_tagger import auto_tag_genres
from .models import BookMatch

logger = logging.getLogger("photo-to-tbr")

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"


async def search_books(query: str) -> List[BookMatch]:
    """Search Google Books API with retry logic for rate limiting (429/503)."""
    params = {
        "q": query,
        "maxResults": str(settings.max_results),
    }
    if settings.google_books_api_key:
        params["key"] = settings.google_books_api_key

    async with httpx.AsyncClient(timeout=15) as client:
        for attempt in range(3):
            resp = await client.get(GOOGLE_BOOKS_URL, params=params)
            if resp.status_code in (429, 503):
                wait = 2 ** attempt  # 1s, 2s, 4s
                logger.info("  Rate limited (HTTP %d), retrying in %ds...", resp.status_code, wait)
                await asyncio.sleep(wait)
                continue
            resp.raise_for_status()
            data = resp.json()
            return _parse_items(data.get("items", []))

    # All retries failed — return empty instead of crashing
    logger.warning("  Google Books rate limited after 3 retries for query: %s", query)
    return []


def _fuzzy_match(query_word: str, result_word: str) -> float:
    """
    Fuzzy match an OCR word against a result word.
    Returns 1.0 for exact match, 0.0-0.9 for partial matches.
    Handles common OCR misreads like SAERAN→SAFRAN, JJONATHaN→JONATHAN.
    """
    if query_word == result_word:
        return 1.0

    # Substring match: if one contains the other (e.g., "FOER" in "foer")
    if query_word in result_word or result_word in query_word:
        return 0.9

    # Check if words share enough characters (OCR often swaps/doubles letters)
    # Use ratio of common characters to total characters
    if len(query_word) < 3 or len(result_word) < 3:
        return 0.0

    # Simple edit distance ratio: count matching chars in order
    # This catches SAERAN→SAFRAN (5/6 chars similar), JJONATHaN→JONATHAN
    shorter, longer = sorted([query_word, result_word], key=len)
    if len(longer) == 0:
        return 0.0

    # Count chars from shorter that appear in longer (order-independent)
    longer_chars = list(longer)
    matches = 0
    for c in shorter:
        if c in longer_chars:
            longer_chars.remove(c)
            matches += 1

    ratio = matches / len(longer)

    # Only count as a fuzzy match if very similar (>75% of chars match)
    if ratio >= 0.75 and abs(len(shorter) - len(longer)) <= 2:
        return ratio * 0.8  # Scale down so fuzzy < exact

    return 0.0


def _relevance_score(matches: List[BookMatch], query_words: List[str]) -> float:
    """
    Score how relevant a set of matches is to the query words.
    Higher = better match. Uses fuzzy matching to handle OCR misreads
    (e.g., SAERAN matching SAFRAN, JJONATHaN matching JONATHAN).
    Handles structured queries like 'intitle:BRIGHT inauthor:SARAH'.
    """
    if not matches or not query_words:
        return 0.0

    # Strip intitle:/inauthor: prefixes so we compare actual words
    cleaned_query = []
    for w in query_words:
        stripped = w
        for prefix in ("intitle:", "inauthor:"):
            if stripped.lower().startswith(prefix):
                stripped = stripped[len(prefix):]
                break
        if len(stripped) > 2:
            cleaned_query.append(stripped.lower())

    if not cleaned_query:
        return 0.0

    best_score = 0.0
    for match in matches:
        title_words = set(match.title.lower().split())
        author_words = set((match.authors or "").lower().split())
        all_words = title_words | author_words

        # For each query word, find the best match among result words
        total_match = 0.0
        for qw in cleaned_query:
            best_word_score = 0.0
            for rw in all_words:
                s = _fuzzy_match(qw, rw)
                best_word_score = max(best_word_score, s)
            total_match += best_word_score

        score = total_match / len(cleaned_query)
        best_score = max(best_score, score)

    # Penalize single-word queries — they match too broadly
    if len(cleaned_query) == 1:
        best_score *= 0.3

    return best_score


async def search_books_with_fallback(queries: List[str]) -> Tuple[List[BookMatch], str]:
    """
    Try multiple queries. Instead of stopping at the first one with results,
    score each result set for relevance and pick the best one.
    This handles the case where an early query returns results that are
    completely wrong (e.g. searching "VESTERHEAR BURKE" returns books about
    Burke family history instead of "Yesteryear" by Caro Claire Burke).
    """
    best_matches = []
    best_query = ""
    best_score = -1.0

    # Cap queries to avoid burning through API rate limits
    capped_queries = queries[:6]

    for i, query in enumerate(capped_queries):
        if not query.strip():
            continue
        # Small delay between API calls to avoid rate limiting
        if i > 0:
            await asyncio.sleep(0.5)
        try:
            matches = await search_books(query)
            if not matches:
                continue

            query_words = query.split()
            score = _relevance_score(matches, query_words)
            logger.info("  Query '%s' -> %d matches, relevance=%.2f", query, len(matches), score)

            if score > best_score:
                best_score = score
                best_matches = matches
                best_query = query

            # If we find a high-confidence match, stop early
            # Threshold 0.8 — 0.6 was too low, caused early stops on bad matches
            if score >= 0.8:
                break

        except Exception:
            continue

    # If Google Books didn't score well, try Open Library
    if best_score < 0.5:
        logger.info("Google Books best score=%.2f (low), trying Open Library...", best_score)
        for i, query in enumerate(capped_queries):
            if not query.strip():
                continue
            if i > 0:
                await asyncio.sleep(0.3)
            try:
                ol_matches = await search_open_library(query)
                if not ol_matches:
                    continue
                query_words = query.split()
                ol_score = _relevance_score(ol_matches, query_words)
                logger.info("  OpenLibrary '%s' -> %d matches, relevance=%.2f", query, len(ol_matches), ol_score)

                if ol_score > best_score:
                    best_score = ol_score
                    best_matches = ol_matches
                    best_query = query + " (via Open Library)"

                if ol_score >= 0.6:
                    break
            except Exception:
                continue

    # If still nothing, last resort: return any results
    if not best_matches and queries:
        for query in queries:
            if not query.strip():
                continue
            try:
                matches = await search_books(query)
                if matches:
                    return matches, query
            except Exception:
                continue

    return best_matches, best_query


def _parse_items(items: list) -> List[BookMatch]:
    """Parse Google Books API items into BookMatch objects."""
    matches = []

    for item in items:
        info = item.get("volumeInfo", {})
        title = info.get("title", "Unknown")
        authors = ", ".join(info.get("authors", []))
        cover = info.get("imageLinks", {}).get("thumbnail")

        if cover and cover.startswith("http://"):
            cover = cover.replace("http://", "https://", 1)

        description = info.get("description")
        categories = info.get("categories", [])
        sub_genres = auto_tag_genres(categories, title, description)
        logger.info("  AUTO-TAG: '%s' categories=%s -> sub_genres=%s", title, categories, sub_genres)

        matches.append(
            BookMatch(
                title=title,
                authors=authors or None,
                published_date=info.get("publishedDate"),
                description=description,
                cover_url=cover,
                info_link=info.get("infoLink"),
                amazon_url=_amazon_link(title, authors),
                page_count=info.get("pageCount"),
                categories=categories,
                sub_genres=sub_genres,
            )
        )

    return matches


async def search_open_library(query: str) -> List[BookMatch]:
    """Search Open Library as a fallback when Google Books doesn't find the book."""
    # Strip intitle:/inauthor: prefixes for Open Library (it uses plain text search)
    clean_query = re.sub(r"(intitle:|inauthor:)", "", query).strip()
    if not clean_query:
        return []

    params = {
        "q": clean_query,
        "limit": str(settings.max_results),
        "fields": "title,author_name,first_publish_year,cover_i,subject,number_of_pages_median,key",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(OPEN_LIBRARY_SEARCH_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    docs = data.get("docs", [])
    return _parse_open_library(docs)


def _parse_open_library(docs: list) -> List[BookMatch]:
    """Parse Open Library search results into BookMatch objects."""
    matches = []
    for doc in docs:
        title = doc.get("title", "Unknown")
        authors = ", ".join(doc.get("author_name", []))
        cover_id = doc.get("cover_i")
        cover_url = "https://covers.openlibrary.org/b/id/{}-M.jpg".format(cover_id) if cover_id else None
        ol_key = doc.get("key", "")
        info_link = "https://openlibrary.org{}".format(ol_key) if ol_key else None
        subjects = doc.get("subject", [])[:3]
        year = doc.get("first_publish_year")
        published = str(year) if year else None

        sub_genres = auto_tag_genres(subjects, title, None)

        matches.append(
            BookMatch(
                title=title,
                authors=authors or None,
                published_date=published,
                description=None,
                cover_url=cover_url,
                info_link=info_link,
                amazon_url=_amazon_link(title, authors),
                page_count=doc.get("number_of_pages_median"),
                categories=subjects,
                sub_genres=sub_genres,
            )
        )
    return matches


def _amazon_link(title: str, authors: Optional[str]) -> str:
    """Build Amazon search link, optionally with affiliate tag."""
    search_term = "{} {}".format(title, authors or "").strip()
    encoded = quote_plus(search_term)
    url = "https://www.amazon.com/s?k={}".format(encoded)
    if settings.amazon_affiliate_tag:
        url += "&tag={}".format(settings.amazon_affiliate_tag)
    return url
