import base64
import logging
import re
from typing import List, Tuple

import httpx

logger = logging.getLogger("photo-to-tbr")

# Google Cloud Vision API endpoint (uses same API key as Books API)
VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate"


# Common social media / UI noise words to filter out
NOISE_WORDS = {
    "follow", "like", "share", "comment", "comments", "reply", "repost",
    "save", "saved", "send", "more", "view", "views", "likes", "shares",
    "reels", "reel", "post", "posts", "story", "stories", "explore",
    "home", "search", "profile", "menu", "settings", "notifications",
    "message", "messages", "dm", "dms", "edit", "delete", "report",
    "block", "mute", "hide", "pin", "unpin", "bookmark", "bookmarks",
    "following", "followers", "followed", "mutual", "suggested",
    "trending", "viral", "fyp", "foryou", "foryoupage",
    "tiktok", "instagram", "retweet", "tweet", "thread", "threads",
    "booktok", "bookstagram", "booktwitter", "bookish",
    "ad", "sponsored", "promoted", "verified", "original", "audio",
    "ago", "hrs", "min", "sec", "hour", "hours", "minutes", "days",
    "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep",
    "oct", "nov", "dec", "am", "pm",
    "www", "com", "http", "https", "org", "net",
    "novel", "book", "edition", "books",
    # BookTok/Bookstagram overlay text
    "star", "stars", "review", "reviews", "rating", "ratings",
    "audiobook", "audiobooks", "ebook", "ebooks",
    "fiction", "nonfiction", "romance", "thriller", "mystery", "fantasy",
    "historical", "contemporary", "literary", "horror", "scifi",
    "recommendation", "recommendations", "recommend", "recommended",
    "reading", "read", "reads", "reader", "readers",
    "tbr", "haul", "wrap", "wrapup", "recap",
    "favorite", "favorites", "favourite", "favourites", "best",
    "new", "release", "releases", "upcoming",
    "chapter", "chapters", "page", "pages",
    "author", "writer", "bestseller", "bestselling",
    "york", "times", "list",
    "friends", "reels",
    "add", "comment", "alannagrace", "bradylockerby",
    # Generic overlay phrases
    "must", "need", "every", "these", "those", "most", "only",
    "really", "love", "loved", "amazing", "great", "good", "perfect",
    # Social media caption / review phrases
    "ride", "brilliant", "compelling", "writing", "smart", "funny",
    "filled", "deep", "emotion", "characters", "nothing", "short",
    "beautiful", "stunning", "incredible", "highly", "cannot",
    "college", "meet", "lives", "dive", "right", "into",
    "from", "there", "they", "their", "which", "with", "what",
    "this", "that", "have", "been", "will", "just", "your",
    "about", "also", "very", "much", "well", "here", "over",
    "some", "than", "them", "then", "when", "would", "could",
    "should", "being", "still", "after", "before", "while",
}

# Common short English words that ARE valid in book titles
# (don't filter these out even though they're ≤3 chars uppercase)
VALID_SHORT_WORDS = {
    "the", "and", "for", "her", "his", "not", "one", "two", "old",
    "new", "all", "war", "art", "end", "man", "men", "boy", "god",
    "red", "bad", "big", "day", "way", "out", "off", "who", "why",
    "how", "she", "our", "sea", "sun", "ice", "sky", "eye", "lie",
    "die", "run", "cry", "fly", "try", "ask", "say", "let", "cut",
    "sin", "joy", "age", "law", "fox", "dog", "cat", "six", "ten",
}

NOISE_PATTERNS = [
    r"@\w+",
    r"#\w+",
    r"\d+:\d+",
    r"\d+[kKmM]\b",
    r"\d+\s*(likes?|views?|comments?|shares?|followers?)",
    r"https?://\S+",
    r"\b\d{1,2}/\d{1,2}/\d{2,4}\b",
]


def _call_vision_api(image_bytes: bytes) -> dict:
    """Call Google Cloud Vision API for text detection."""
    from .config import settings

    if not settings.google_books_api_key:
        raise RuntimeError("No Google API key configured. Set GOOGLE_BOOKS_API_KEY.")

    # Encode image as base64
    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "requests": [{
            "image": {"content": b64_image},
            "features": [{"type": "TEXT_DETECTION"}],
        }]
    }

    resp = httpx.post(
        VISION_API_URL,
        params={"key": settings.google_books_api_key},
        json=payload,
        timeout=30,
    )

    if resp.status_code != 200:
        logger.error("Vision API error %d: %s", resp.status_code, resp.text[:500])
        raise RuntimeError(f"Vision API returned {resp.status_code}")

    data = resp.json()
    responses = data.get("responses", [{}])
    if not responses:
        return {}

    result = responses[0]
    if "error" in result:
        raise RuntimeError(f"Vision API error: {result['error'].get('message', '')}")

    return result


def extract_ocr(image_bytes: bytes) -> Tuple[str, List[Tuple[str, float, float, float]], str]:
    """
    Run OCR on image bytes using Google Cloud Vision API.
    Returns (cleaned_text, texts_with_positions, raw_text) in a single API call.
    texts_with_positions is a list of (text, x_center, y_center, text_height)
    with positions normalized 0-1 relative to image dimensions.
    raw_text is the unprocessed OCR output (used for @mention extraction).
    """
    result = _call_vision_api(image_bytes)
    annotations = result.get("textAnnotations", [])
    if not annotations:
        return "", [], ""

    # First annotation is the full text block
    raw = annotations[0].get("description", "")
    ocr_text = _clean(raw)

    # Get image dimensions from the full text annotation bounding box
    full_verts = annotations[0].get("boundingPoly", {}).get("vertices", [])
    if full_verts:
        xs = [v.get("x", 0) for v in full_verts]
        ys = [v.get("y", 0) for v in full_verts]
        width = max(xs) if max(xs) > 0 else 1
        height = max(ys) if max(ys) > 0 else 1
    else:
        width, height = 1, 1

    texts_with_pos = []
    # Skip first annotation (full text), process individual words
    for ann in annotations[1:]:
        text = ann.get("description", "").strip()
        if not text:
            continue

        verts = ann.get("boundingPoly", {}).get("vertices", [])
        if not verts:
            continue

        word_xs = [v.get("x", 0) for v in verts]
        word_ys = [v.get("y", 0) for v in verts]

        x_center = (min(word_xs) + max(word_xs)) / 2 / width
        y_center = (min(word_ys) + max(word_ys)) / 2 / height
        text_height = (max(word_ys) - min(word_ys)) / height

        texts_with_pos.append((text, x_center, y_center, text_height))

    return ocr_text, texts_with_pos, raw




def _clean(text: str) -> str:
    """Strip noise patterns and collapse whitespace."""
    for pattern in NOISE_PATTERNS:
        text = re.sub(pattern, " ", text, flags=re.IGNORECASE)
    text = re.sub(r"[^A-Za-z0-9 ]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build_query(ocr_text: str) -> str:
    """Build a search query prioritizing likely title/author words."""
    words = ocr_text.split()

    filtered = []
    for word in words:
        lower = word.lower()
        if lower in NOISE_WORDS:
            continue
        if len(word) <= 1:
            continue
        if word.isdigit():
            continue
        filtered.append(word)

    if not filtered:
        return " ".join(words[:8])

    capitalized = [w for w in filtered if w[0].isupper() and len(w) > 1]
    lowercase = [w for w in filtered if not w[0].isupper()]

    priority_words = capitalized + lowercase
    return " ".join(priority_words[:8])


def _is_zoomed_in(texts_with_pos: List[Tuple[str, float, float, float]]) -> bool:
    """
    Detect if the image is a zoomed-in/cropped book photo vs a full
    social media screenshot. Zoomed-in images have text spread across
    the full vertical range with large text heights (big book title).
    """
    if not texts_with_pos:
        return False

    # Check how many items fall inside vs outside the strict book zone
    strict_zone_count = 0
    total_count = 0
    max_text_height = 0.0

    for (text, x_center, y_center, text_height) in texts_with_pos:
        cleaned = _clean(text).strip()
        if not cleaned or len(cleaned) <= 1:
            continue
        total_count += 1
        max_text_height = max(max_text_height, text_height)
        if (0.35 <= y_center <= 0.75) and (0.15 <= x_center <= 0.85):
            strict_zone_count += 1

    if total_count == 0:
        return False

    # If very few items survive strict filtering, or the text is very large
    # (meaning the book fills the frame), consider it zoomed in
    strict_ratio = strict_zone_count / total_count
    is_zoomed = strict_ratio < 0.4 or max_text_height > 0.08

    return is_zoomed


def _extract_title_and_author(texts_with_pos: List[Tuple[str, float, float, float]]) -> Tuple[List[str], List[str]]:
    """
    Separate book-zone text into likely TITLE words and AUTHOR words
    based on text size and vertical position.

    On a book cover:
    - Title text is LARGER and usually HIGHER
    - Author text is SMALLER and usually LOWER

    Returns (title_words, author_words).
    """
    zoomed = _is_zoomed_in(texts_with_pos)

    # First pass: collect candidates and find max text height
    raw_book_texts = []
    for (text, x_center, y_center, text_height) in texts_with_pos:
        if zoomed:
            is_book_zone = (0.05 <= y_center <= 0.90) and (0.05 <= x_center <= 0.95)
        else:
            is_book_zone = (0.35 <= y_center <= 0.75) and (0.15 <= x_center <= 0.85)
        if not is_book_zone:
            continue

        cleaned = _clean(text)
        words = cleaned.split()
        for word in words:
            lower = word.lower()
            if lower in NOISE_WORDS or len(word) <= 1 or word.isdigit():
                continue
            if word.islower() and len(word) >= 8:
                continue
            if word.isupper() and len(word) <= 3 and word.lower() not in VALID_SHORT_WORDS:
                continue
            vowels = set("aeiouAEIOU")
            if len(word) >= 3 and not any(c in vowels for c in word):
                continue
            raw_book_texts.append((word, text_height, y_center))

    if not raw_book_texts:
        return [], []

    # Size-based filtering: drop caption-sized text (< 20% of max height)
    max_h = max(h for _, h, _ in raw_book_texts)
    min_h_threshold = max_h * 0.20
    book_texts = [(w, h, y) for w, h, y in raw_book_texts if h >= min_h_threshold]

    if not book_texts:
        return [], []

    # Find the median text height to separate title (large) from author (small)
    heights = sorted(set(h for _, h, _ in book_texts))
    if len(heights) >= 2:
        median_h = heights[len(heights) // 2]
    else:
        median_h = heights[0]

    title_words = []
    author_words = []
    seen = set()

    for word, height, y_pos in book_texts:
        lower = word.lower()
        if lower in seen:
            continue
        seen.add(lower)

        # Larger text = likely title, smaller = likely author
        if height >= median_h:
            title_words.append(word)
        else:
            author_words.append(word)

    return title_words, author_words


def _extract_book_zone_words(texts_with_pos: List[Tuple[str, float, float, float]]) -> List[Tuple[str, float]]:
    """
    Extract only words from the BOOK zone (center of image, not edges).
    Returns (word, score) tuples sorted by relevance.
    Filters out UI elements, overlay text, and noise.
    Automatically detects zoomed-in images and relaxes the zone.

    KEY: Uses text-height filtering to separate book cover text (large)
    from social media caption text (small). On Instagram/TikTok screenshots,
    the book title is 3-10x larger than caption text below it.
    """
    zoomed = _is_zoomed_in(texts_with_pos)

    # First pass: collect all candidate words WITH their text heights
    candidates = []
    for (text, x_center, y_center, text_height) in texts_with_pos:
        if zoomed:
            is_book_zone = (0.05 <= y_center <= 0.90) and (0.05 <= x_center <= 0.95)
        else:
            is_book_zone = (0.35 <= y_center <= 0.75) and (0.15 <= x_center <= 0.85)

        if not is_book_zone:
            continue

        cleaned = _clean(text)
        words = cleaned.split()

        for word in words:
            lower = word.lower()
            if lower in NOISE_WORDS or len(word) <= 1 or word.isdigit():
                continue
            if word.islower() and len(word) >= 8:
                continue
            if word.isupper() and len(word) <= 3 and word.lower() not in VALID_SHORT_WORDS:
                continue
            vowels = set("aeiouAEIOU")
            if len(word) >= 3 and not any(c in vowels for c in word):
                continue

            candidates.append((word, text_height))

    if not candidates:
        return []

    # Size-based filtering: drop words whose text height is less than 20%
    # of the maximum text in the zone. On social media screenshots, book
    # cover text (title/author) is MUCH larger than caption text below it.
    # This eliminates Instagram captions, usernames, and review text while
    # keeping the actual book title and author from the cover.
    max_h = max(h for _, h in candidates)
    min_h_threshold = max_h * 0.20

    scored = []
    for word, text_height in candidates:
        if text_height < min_h_threshold:
            logger.debug("  SIZE-FILTERED (h=%.4f < %.4f): '%s'", text_height, min_h_threshold, word)
            continue

        size_score = min(text_height * 15, 3.0)
        cap_bonus = 2.0 if word[0].isupper() else 1.0
        length_bonus = 1.5 if len(word) >= 5 else 1.0

        scored.append((word, size_score * cap_bonus * length_bonus))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored


def _extract_at_mentions(raw_text: str) -> List[str]:
    """
    Extract @mentions from raw OCR text as potential author names.
    Instagram captions often @mention the actual author, which is a
    strong signal for book search even when the cover text is hard to read.
    """
    mentions = re.findall(r'@(\w+)', raw_text)
    results = []
    for mention in mentions:
        # Skip very short handles
        if len(mention) < 4:
            continue
        # Try to split concatenated names: "emilynemens" -> try as-is
        # (Google Books is good at fuzzy matching concatenated author names)
        results.append(mention)
    return results


def build_query_variations_with_positions(
    texts_with_pos: List[Tuple[str, float, float, float]],
    ocr_text: str,
    raw_text: str = "",
) -> List[str]:
    """
    Build multiple query variations using position-aware analysis.

    Strategy: ONLY use text from the book zone (center of image).
    Try multiple combinations from most specific to most broad.
    Each query should be SHORT (3-5 words max) to avoid polluting
    the Google Books search with noise.
    """
    zoomed = _is_zoomed_in(texts_with_pos)
    logger.info("Image type: %s", "ZOOMED-IN (relaxed zone)" if zoomed else "SCREENSHOT (strict zone)")

    book_words = _extract_book_zone_words(texts_with_pos)

    if not book_words:
        # Fallback to basic query building if no book-zone text found
        return build_query_variations(ocr_text)

    # Deduplicate while keeping score order
    seen = set()
    unique_words = []
    for word, score in book_words:
        lower = word.lower()
        if lower not in seen:
            seen.add(lower)
            unique_words.append(word)

    # Also extract structured title/author separation
    title_words, author_words = _extract_title_and_author(texts_with_pos)

    queries = []

    # Query 1: STRUCTURED — use Google Books operators intitle: + inauthor:
    # Uses spaces (not +) to separate operators
    if title_words and author_words:
        title_parts = ["intitle:" + w for w in title_words[:3] if len(w) >= 4]
        author_parts = ["inauthor:" + w for w in author_words[:2] if len(w) >= 4]
        parts = title_parts + author_parts
        if len(parts) >= 2:
            queries.append(" ".join(parts))

    # Query 2: STRUCTURED — title only with ALL title words (in case author is misread)
    if title_words:
        long_title = [w for w in title_words if len(w) >= 3]
        if long_title:
            q = " ".join("intitle:" + w for w in long_title[:3])
            if q not in queries:
                queries.append(q)

    # Query 2b: STRUCTURED — just top 2 longest title words (minimal, avoids OCR garbage)
    if title_words:
        by_length = sorted(title_words, key=len, reverse=True)
        top2 = [w for w in by_length[:2] if len(w) >= 4]
        if len(top2) == 2:
            q = " ".join("intitle:" + w for w in top2)
            if q not in queries:
                queries.append(q)

    # Query 3: STRUCTURED — author only (in case title is misread)
    if author_words:
        long_author = [w for w in author_words if len(w) >= 4]
        if long_author:
            q = " ".join("inauthor:" + w for w in long_author[:2])
            if q not in queries:
                queries.append(q)

    # Query 3b: SWAPPED — treat title words AS author (common on covers where
    # author name is biggest text, e.g. "TOM FELTON" bigger than "Beyond the Wand")
    if title_words:
        long_title_as_author = [w for w in title_words if len(w) >= 4]
        if long_title_as_author:
            q = " ".join("inauthor:" + w for w in long_title_as_author[:2])
            if q not in queries:
                queries.append(q)

    # Query 3c: Plain top 2 most prominent words (no prefix — let Google figure it out)
    if len(unique_words) >= 2:
        q = " ".join(unique_words[:2])
        if q not in queries:
            queries.append(q)

    # Query 4: Plain text — top book-zone words combined
    if len(unique_words) >= 2:
        q = " ".join(unique_words[:4])
        if q not in queries:
            queries.append(q)

    # Query 5: Skip first word (might be misread title)
    if len(unique_words) >= 3:
        q = " ".join(unique_words[1:4])
        if q not in queries:
            queries.append(q)

    # Query 6: Only 5+ character words (most reliable)
    long_only = [w for w in unique_words if len(w) >= 5]
    if len(long_only) >= 2:
        q = " ".join(long_only[:4])
        if q not in queries:
            queries.append(q)

    # Query 7: Just the largest text (likely title alone)
    if unique_words:
        q = unique_words[0]
        if len(q) >= 4 and q not in queries:
            queries.append(q)

    # @mention queries: Instagram/TikTok captions often @mention the author.
    # Use these as author-search fallbacks combined with top cover words.
    if raw_text:
        at_mentions = _extract_at_mentions(raw_text)
        for mention in at_mentions[:2]:
            # Combine @mention (as author) with top cover word (as title)
            if unique_words:
                q = f"inauthor:{mention} intitle:{unique_words[0]}"
                if q not in queries:
                    queries.append(q)
            # Also try just the @mention as author
            q = f"inauthor:{mention}"
            if q not in queries:
                queries.append(q)

    # Final fallback: basic text query
    basic = build_query(ocr_text)
    if basic and basic not in queries:
        queries.append(basic)

    return queries


def build_query_variations(ocr_text: str) -> List[str]:
    """Build multiple query variations for fallback searching."""
    words = ocr_text.split()
    filtered = [
        w for w in words
        if w.lower() not in NOISE_WORDS and len(w) > 1 and not w.isdigit()
    ]
    capitalized = [w for w in filtered if w[0].isupper() and len(w) > 1]

    queries = []

    primary = build_query(ocr_text)
    if primary:
        queries.append(primary)

    if len(capitalized) >= 2:
        cap_query = " ".join(capitalized[:6])
        if cap_query not in queries:
            queries.append(cap_query)

    long_words = [w for w in filtered if len(w) >= 4]
    if long_words:
        long_query = " ".join(long_words[:6])
        if long_query not in queries:
            queries.append(long_query)

    return queries
