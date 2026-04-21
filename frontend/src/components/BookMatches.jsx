import BookCard from "./BookCard";

export default function BookMatches({ scanResult, library, onAddToLibrary, onClear }) {
  if (!scanResult) return null;

  const libraryTitles = new Set(library.map((b) => b.title));

  return (
    <div className="matches-section">
      <div className="matches-header">
        <div className="matches-title-row">
          <h2>Matches</h2>
          {onClear && (
            <button className="clear-results-btn" onClick={onClear} title="Clear results">
              ✕ Clear
            </button>
          )}
        </div>
        <p className="ocr-hint">
          Searched for: <em>"{scanResult.query_used}"</em>
        </p>
      </div>

      {scanResult.matches.length === 0 ? (
        <p className="no-matches">
          No matches found. Try a clearer photo of the cover.
        </p>
      ) : (
        <div className="matches-grid">
          {scanResult.matches.map((book, i) => (
            <BookCard
              key={`${book.title}-${i}`}
              book={book}
              onAdd={onAddToLibrary}
              isInLibrary={libraryTitles.has(book.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
