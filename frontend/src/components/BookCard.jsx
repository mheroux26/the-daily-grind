import { useTheme } from "../ThemeContext";

function buyLink(book, theme) {
  if (theme?.buyUrl) {
    const q = encodeURIComponent(book.title + (book.authors ? " " + book.authors : ""));
    return { url: `${theme.buyUrl}/search/site/${q}`, label: theme.buyLabel || "Shop Indie" };
  }
  return { url: book.amazon_url, label: "Buy" };
}

export default function BookCard({ book, onAdd, isInLibrary }) {
  const { theme } = useTheme();
  const buy = buyLink(book, theme);

  return (
    <div className="book-card">
      {book.cover_url && (
        <img
          src={book.cover_url}
          alt={`Cover of ${book.title}`}
          className="book-cover"
        />
      )}
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        {book.authors && <p className="book-authors">{book.authors}</p>}
        {book.published_date && (
          <p className="book-meta">{book.published_date}</p>
        )}
        {book.description && (
          <p className="book-desc">
            {book.description.length > 200
              ? book.description.slice(0, 200) + "..."
              : book.description}
          </p>
        )}
        {book.categories?.length > 0 && (
          <div className="book-tags">
            {book.categories.map((cat) => (
              <span key={cat} className="tag">{cat}</span>
            ))}
          </div>
        )}
        {book.sub_genres?.length > 0 && (
          <div className="book-tags sub-genre-auto-tags">
            {book.sub_genres.map((sg) => (
              <span key={sg} className="tag sub-genre-auto">{sg}</span>
            ))}
          </div>
        )}
        <div className="book-actions">
          {!isInLibrary ? (
            <button className="btn btn-primary" onClick={() => onAdd(book)}>
              + Add to Shelf
            </button>
          ) : (
            <span className="in-library-badge">On your shelf</span>
          )}
          <a
            href={buy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            {buy.label}
          </a>
          {book.info_link && (
            <a
              href={book.info_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              More info
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
