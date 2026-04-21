import { useState } from "react";
import BookCard from "./BookCard";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function BookMatches({ scanResult, library, onAddToLibrary, onClear, searchMode }) {
  const [extraMatches, setExtraMatches] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [noMore, setNoMore] = useState(false);

  if (!scanResult) return null;

  const allMatches = [...scanResult.matches, ...extraMatches];
  const libraryTitles = new Set(library.map((b) => b.title));

  // Only show "Load More" for text searches (not scan results)
  const canLoadMore = scanResult.query_used && !scanResult.ocr_text && !noMore;

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const nextIndex = allMatches.length;
      const res = await fetch(
        API_URL + "/search?q=" + encodeURIComponent(scanResult.query_used) +
        "&start_index=" + nextIndex
      );
      if (!res.ok) throw new Error("Failed to load more");
      const data = await res.json();
      if (data.matches.length === 0) {
        setNoMore(true);
      } else {
        setExtraMatches((prev) => [...prev, ...data.matches]);
      }
    } catch (e) {
      console.error("Load more failed:", e);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleClear() {
    setExtraMatches([]);
    setNoMore(false);
    onClear?.();
  }

  return (
    <div className="matches-section">
      <div className="matches-header">
        <div className="matches-title-row">
          <h2>Matches</h2>
          {onClear && (
            <button className="clear-results-btn" onClick={handleClear} title="Clear results">
              ✕ Clear
            </button>
          )}
        </div>
        <p className="ocr-hint">
          Searched for: <em>"{scanResult.query_used}"</em>
        </p>
      </div>

      {allMatches.length === 0 ? (
        <p className="no-matches">
          No matches found. Try a clearer photo of the cover.
        </p>
      ) : (
        <>
          <div className="matches-grid">
            {allMatches.map((book, i) => (
              <BookCard
                key={`${book.title}-${i}`}
                book={book}
                onAdd={onAddToLibrary}
                isInLibrary={libraryTitles.has(book.title)}
              />
            ))}
          </div>

          {canLoadMore && (
            <div className="load-more-container">
              <button
                className="btn btn-secondary load-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Show More Results"}
              </button>
            </div>
          )}

          {noMore && allMatches.length > scanResult.matches.length && (
            <p className="no-more-hint">No more results available.</p>
          )}
        </>
      )}
    </div>
  );
}
