"""
OCR post-correction: fix common character misreads using
character-substitution + spell checking.

EasyOCR frequently confuses visually similar characters:
  I↔T, N↔Y, C↔S, H↔N, O↔D, B↔D, E↔F, c↔e, etc.

Strategy for each OCR word:
  1. Generate variants by swapping one character at a time using
     a confusion map of visually similar characters
  2. Filter variants to only known English words (via pyspellchecker)
  3. Rank by word frequency (most common English word wins)
  4. Return the top correction if it beats the original

This turns "BRIGHI" → "BRIGHT", "NEARS" → "YEARS", "CARAh" → "SARAH".
"""

import logging
from typing import List, Tuple

logger = logging.getLogger("photo-to-tbr")

try:
    from spellchecker import SpellChecker
    _spell = SpellChecker()
    HAS_SPELL = True
except ImportError:
    HAS_SPELL = False
    logger.warning("pyspellchecker not installed — OCR correction disabled")

# Characters that EasyOCR commonly confuses (uppercase)
# Each key maps to characters it's often misread as (or misread from)
CONFUSIONS_UPPER = {
    'A': ['O', 'R'],
    'B': ['D', 'R', 'P', '8'],
    'C': ['G', 'S', 'O', 'Q'],
    'D': ['O', 'B', 'P', 'Q'],
    'E': ['F', 'L', 'C', 'B'],
    'F': ['E', 'P', 'T'],
    'G': ['C', 'O', 'Q', 'S', '6'],
    'H': ['N', 'K', 'M', 'B'],
    'I': ['T', 'L', 'J', '1'],
    'J': ['I', 'T'],
    'K': ['H', 'R', 'X'],
    'L': ['I', '1', 'T'],
    'M': ['N', 'H', 'W'],
    'N': ['Y', 'H', 'M'],
    'O': ['Q', 'D', 'C', '0', 'U'],
    'P': ['D', 'B', 'R', 'F'],
    'Q': ['O', 'G', 'D'],
    'R': ['B', 'P', 'K', 'A'],
    'S': ['C', '5', 'G'],
    'T': ['I', 'Y', 'F', 'J'],
    'U': ['V', 'O', 'J'],
    'V': ['Y', 'W', 'U'],
    'W': ['M', 'V'],
    'X': ['K', 'H'],
    'Y': ['N', 'V', 'T'],
    'Z': ['2'],
}


def _generate_variants(word: str) -> List[str]:
    """
    Generate plausible alternative readings by swapping one character
    at a time using the OCR confusion map.
    """
    upper = word.upper()
    variants = set()

    for i, char in enumerate(upper):
        if char in CONFUSIONS_UPPER:
            for sub in CONFUSIONS_UPPER[char]:
                variant = upper[:i] + sub + upper[i + 1:]
                variants.add(variant.lower())

    return list(variants)


def correct_word(word: str) -> str:
    """
    Try to correct a single OCR-misread word.
    Returns the most likely correct spelling, or the original word.
    """
    if not HAS_SPELL or len(word) <= 2:
        return word

    lower = word.lower()

    # Generate character-substitution variants
    variants = _generate_variants(word)

    # Also add the spell checker's own candidates
    spell_candidates = _spell.candidates(lower)
    if spell_candidates:
        variants.extend(spell_candidates)

    # Add the original word
    variants.append(lower)

    # Filter to only known English words
    known = [v for v in set(variants) if v in _spell]

    if not known:
        return word

    # Rank by word frequency — pick the most common word
    known.sort(key=lambda v: _spell.word_usage_frequency(v), reverse=True)
    best = known[0]

    # Only replace if the correction is significantly more common
    # (avoids replacing valid but less-common words unnecessarily)
    original_freq = _spell.word_usage_frequency(lower)
    best_freq = _spell.word_usage_frequency(best)

    if best == lower:
        return word  # No change needed

    # If original isn't a known word, always use correction
    if lower not in _spell:
        corrected = _apply_case(best, word)
        logger.info("  OCR-CORRECT: '%s' -> '%s' (original unknown)", word, corrected)
        return corrected

    # If original IS known but correction is 10x+ more common, prefer correction
    # This catches NEARS (valid but rare) → YEARS (valid and very common)
    if best_freq > original_freq * 10:
        corrected = _apply_case(best, word)
        logger.info("  OCR-CORRECT: '%s' -> '%s' (freq %.2e vs %.2e)",
                     word, corrected, best_freq, original_freq)
        return corrected

    return word


def _apply_case(corrected: str, original: str) -> str:
    """Apply the case pattern from original to corrected."""
    if original.isupper():
        return corrected.upper()
    elif original[0].isupper():
        return corrected.capitalize()
    return corrected


def correct_words(words: List[str]) -> List[str]:
    """Correct a list of OCR words."""
    if not HAS_SPELL:
        return words
    return [correct_word(w) for w in words]


def get_corrected_and_original(words: List[str]) -> Tuple[List[str], bool]:
    """
    Correct words and return (corrected_words, any_changed).
    Useful for building both original and corrected query variations.
    """
    if not HAS_SPELL:
        return words, False

    corrected = correct_words(words)
    changed = any(c.lower() != o.lower() for c, o in zip(corrected, words))
    return corrected, changed
