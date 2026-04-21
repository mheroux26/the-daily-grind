import logging
import re
from io import BytesIO
from typing import List, Tuple

from .ocr_correct import correct_words, get_corrected_and_original

logger = logging.getLogger("photo-to-tbr")

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

# Try EasyOCR first (better for scene text), fall back to Tesseract
try:
    import easyocr
    _reader = None  # Lazy-loaded on first use

    def _get_reader():
        global _reader
        if _reader is None:
            print("Loading EasyOCR model (first time only, may take a minute)...")
            _reader = easyocr.Reader(["en"], gpu=False)
            print("EasyOCR model loaded.")
        return _reader

    HAS_EASYOCR = True
except ImportError:
    HAS_EASYOCR = False

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False


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


def extract_text(image_bytes: bytes) -> str:
    """
    Run OCR on image bytes using the best available engine.
    EasyOCR is preferred (better at scene text / stylized fonts).
    Falls back to Tesseract.
    """
    image = Image.open(BytesIO(image_bytes))

    # Preprocess: resize, convert, enhance
    image = _preprocess(image)

    if HAS_EASYOCR:
        return _ocr_easyocr(image)
    elif HAS_TESSERACT:
        return _ocr_tesseract(image)
    else:
        raise RuntimeError(
            "No OCR engine available. Install easyocr or pytesseract."
        )


def extract_text_with_positions(image_bytes: bytes) -> List[Tuple[str, float, float, float]]:
    """
    Run OCR and return text with position info: (text, x_center, y_center, text_height).
    Positions are normalized 0-1 relative to image dimensions.
    This lets us prioritize text from the center of the image (likely the book).
    """
    image = Image.open(BytesIO(image_bytes))
    image = _preprocess(image)
    width, height = image.size

    if HAS_EASYOCR:
        reader = _get_reader()
        img_array = np.array(image)
        results = reader.readtext(img_array)

        texts_with_pos = []
        for (bbox, text, confidence) in results:
            if confidence < 0.3:
                continue
            # bbox is [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            xs = [p[0] for p in bbox]
            ys = [p[1] for p in bbox]
            x_center = (min(xs) + max(xs)) / 2 / width
            y_center = (min(ys) + max(ys)) / 2 / height
            text_height = (max(ys) - min(ys)) / height
            texts_with_pos.append((text, x_center, y_center, text_height))

        return texts_with_pos

    # Fallback: no position info from Tesseract basic mode
    text = _ocr_tesseract(image)
    return [(text, 0.5, 0.5, 0.05)]


def _preprocess(image: Image.Image) -> Image.Image:
    """Preprocess image for better OCR results."""
    # Resize if too large (speeds up OCR significantly)
    max_dim = 1600
    if max(image.size) > max_dim:
        ratio = max_dim / max(image.size)
        new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
        image = image.resize(new_size, Image.LANCZOS)

    # Convert to RGB
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Enhance contrast (helps with stylized text on colored backgrounds)
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.3)

    # Slight sharpening
    image = image.filter(ImageFilter.SHARPEN)

    return image


def _ocr_easyocr(image: Image.Image) -> str:
    """Run EasyOCR on a PIL image."""
    reader = _get_reader()
    img_array = np.array(image)
    results = reader.readtext(img_array)

    # Extract text from results, filtering low confidence
    texts = [text for (_, text, conf) in results if conf > 0.3]
    raw = " ".join(texts)
    return _clean(raw)


def _ocr_tesseract(image: Image.Image) -> str:
    """Run Tesseract OCR on a PIL image."""
    if not HAS_TESSERACT:
        raise RuntimeError("pytesseract is not installed.")

    raw = pytesseract.image_to_string(image, lang="eng")
    return _clean(raw)


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

    book_texts = []
    for (text, x_center, y_center, text_height) in texts_with_pos:
        if zoomed:
            # Relaxed zone: accept text across most of the image
            is_book_zone = (0.05 <= y_center <= 0.90) and (0.05 <= x_center <= 0.95)
        else:
            # Strict zone for social media screenshots
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
            book_texts.append((word, text_height, y_center))

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
    """
    zoomed = _is_zoomed_in(texts_with_pos)

    scored = []
    for (text, x_center, y_center, text_height) in texts_with_pos:
        if zoomed:
            # Relaxed zone for zoomed-in book photos
            is_book_zone = (0.05 <= y_center <= 0.90) and (0.05 <= x_center <= 0.95)
        else:
            # STRICT zone for social media screenshots
            is_book_zone = (0.35 <= y_center <= 0.75) and (0.15 <= x_center <= 0.85)

        # Skip anything outside the book zone entirely
        if not is_book_zone:
            continue

        cleaned = _clean(text)
        words = cleaned.split()

        for word in words:
            lower = word.lower()
            # Skip noise, short words, numbers
            if lower in NOISE_WORDS or len(word) <= 1 or word.isdigit():
                continue
            # Skip words that look like usernames (all lowercase, 8+ chars)
            if word.islower() and len(word) >= 8:
                continue
            # Skip short ALL-CAPS words (2-3 chars) that are likely OCR garbage
            # Real title words are usually 4+ chars. Short ones like "THF", "DAMC"
            # are almost always misreads of "THE", "DAMO", etc.
            if word.isupper() and len(word) <= 3 and word.lower() not in VALID_SHORT_WORDS:
                continue
            # Skip words that are pure consonants (likely OCR noise)
            vowels = set("aeiouAEIOU")
            if len(word) >= 3 and not any(c in vowels for c in word):
                continue

            # Score: bigger text = higher score (title is biggest)
            size_score = min(text_height * 15, 3.0)
            # Capitalized words more likely to be title/author
            cap_bonus = 2.0 if word[0].isupper() else 1.0
            # Longer words are more reliable reads
            length_bonus = 1.5 if len(word) >= 5 else 1.0

            scored.append((word, size_score * cap_bonus * length_bonus))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored


def build_query_variations_with_positions(
    texts_with_pos: List[Tuple[str, float, float, float]],
    ocr_text: str
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

    # === OCR SPELL CORRECTION ===
    # Correct common OCR misreads: BRIGHI→BRIGHT, NEARS→YEARS, CARAh→Sarah
    corrected_title, title_changed = get_corrected_and_original(title_words)
    corrected_author, author_changed = get_corrected_and_original(author_words)
    corrected_unique, unique_changed = get_corrected_and_original(unique_words)
    any_correction = title_changed or author_changed or unique_changed

    queries = []

    # === CORRECTED QUERIES FIRST (highest priority if corrections were made) ===
    if any_correction:
        # Corrected structured: intitle + inauthor with spell-corrected words
        if corrected_title and corrected_author:
            ct_parts = ["intitle:" + w for w in corrected_title[:3] if len(w) >= 4]
            ca_parts = ["inauthor:" + w for w in corrected_author[:2] if len(w) >= 4]
            parts = ct_parts + ca_parts
            if len(parts) >= 2:
                queries.append(" ".join(parts))

        # Corrected title only
        if corrected_title:
            long_ct = [w for w in corrected_title if len(w) >= 3]
            if long_ct:
                q = " ".join("intitle:" + w for w in long_ct[:3])
                if q not in queries:
                    queries.append(q)

        # Corrected plain text (no operators)
        if len(corrected_unique) >= 2:
            q = " ".join(corrected_unique[:4])
            if q not in queries:
                queries.append(q)

        # Corrected author as inauthor:
        if corrected_author:
            long_ca = [w for w in corrected_author if len(w) >= 4]
            if long_ca:
                q = " ".join("inauthor:" + w for w in long_ca[:2])
                if q not in queries:
                    queries.append(q)

    # === ORIGINAL (uncorrected) QUERIES as fallback ===

    # Query 1: STRUCTURED — use Google Books operators intitle: + inauthor:
    # Uses spaces (not +) to separate operators
    if title_words and author_words:
        title_parts = ["intitle:" + w for w in title_words[:3] if len(w) >= 4]
        author_parts = ["inauthor:" + w for w in author_words[:2] if len(w) >= 4]
        parts = title_parts + author_parts
        if len(parts) >= 2:
            q = " ".join(parts)
            if q not in queries:
                queries.append(q)

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
