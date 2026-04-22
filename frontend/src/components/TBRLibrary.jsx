import { useState } from "react";
import Bookshelf from "./Bookshelf";
import AmazonBadges from "./AmazonBadges";

const STATUSES = ["tbr", "reading", "read"];
const STATUS_LABELS = { tbr: "TBR", reading: "Reading", read: "Read" };

// Default rating labels (overridden by theme)
const DEFAULT_RATING_LABELS = ["meh", "it was fine", "solid", "obsessed", "unputdownable"];

// Sub-genres organized by parent category
const SUB_GENRE_MAP = {
  "Fiction": [
    "Literary Fiction", "Historical Fiction", "Contemporary Fiction",
    "Magical Realism", "Satire", "Southern Gothic", "Domestic Fiction",
  ],
  "Romance": [
    "Contemporary Romance", "Historical Romance", "Romantic Comedy",
    "Dark Romance", "Paranormal Romance", "Romantasy", "Second Chance",
  ],
  "Fantasy": [
    "Epic Fantasy", "Dark Fantasy", "Urban Fantasy", "Romantasy",
    "Cozy Fantasy", "Grimdark", "Fairy Tale Retelling", "Mythological",
  ],
  "Science Fiction": [
    "Dystopian", "Space Opera", "Cyberpunk", "Time Travel",
    "Hard Sci-Fi", "Post-Apocalyptic", "Climate Fiction",
  ],
  "Mystery": [
    "Cozy Mystery", "Police Procedural", "Noir", "Whodunit",
    "Amateur Sleuth", "Historical Mystery", "Locked Room",
  ],
  "Thriller": [
    "Psychological Thriller", "Legal Thriller", "Medical Thriller",
    "Domestic Thriller", "Espionage", "Techno-Thriller",
  ],
  "Horror": [
    "Gothic Horror", "Cosmic Horror", "Slasher", "Haunted House",
    "Folk Horror", "Body Horror", "Supernatural",
  ],
  "Nonfiction": [
    "Memoir", "Biography", "True Crime", "Self-Help", "History",
    "Science", "Psychology", "Business", "Essays", "Philosophy",
  ],
  "Young Adult": [
    "YA Fantasy", "YA Romance", "YA Dystopian", "YA Contemporary",
    "Coming of Age", "YA Thriller",
  ],
  "Other": [
    "Poetry", "Graphic Novel", "Short Stories", "Book Club Pick",
    "Debut Novel", "Translated", "Classic",
  ],
};

const ALL_SUB_GENRES = Object.values(SUB_GENRE_MAP).flat();

// Theme-aware rating icons
function RatingIcon({ filled, iconType = "cup" }) {
  const f = filled;
  const a = "var(--accent)";
  const ah = "var(--accent-hover)";
  const d = "currentColor";
  const o = f ? 1 : 0.3;
  const s = (props) => ({ fill: f ? a : "none", stroke: f ? a : d, strokeWidth: 1.5, opacity: o, strokeLinejoin: "round", strokeLinecap: "round", ...props });

  const icons = {
    // ☕ Espresso cup — handle on right, steam wisps
    cup: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={`cup-svg ${f ? "filled" : ""}`}>
        <path d="M4 7h12v9a4 4 0 01-4 4H8a4 4 0 01-4-4V7z" {...s()} />
        <path d="M16 9h1a3 3 0 010 6h-1" {...s({ fill: "none" })} />
        {f && <>
          <path d="M8 4c0-1 1-2 0-3" stroke={a} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M12 4c0-1 1-2 0-3" stroke={a} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <rect x="5.5" y="10" width="9" height="6" rx="1" fill={ah} opacity="0.4" />
        </>}
      </svg>
    ),

    // 🪶 Open book — two pages, spine in center
    quill: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={`cup-svg ${f ? "filled" : ""}`}>
        <path d="M12 6C10 4 7 3 2 3v14c5 0 8 1 10 3" {...s()} />
        <path d="M12 6c2-2 5-3 10-3v14c-5 0-8 1-10 3" {...s()} />
        <line x1="12" y1="6" x2="12" y2="20" stroke={f ? a : d} strokeWidth="1.5" opacity={o} />
        {f && <>
          <line x1="5" y1="8" x2="9" y2="8" stroke={ah} strokeWidth="1" opacity="0.5" />
          <line x1="5" y1="11" x2="9" y2="11" stroke={ah} strokeWidth="1" opacity="0.4" />
          <line x1="15" y1="8" x2="19" y2="8" stroke={ah} strokeWidth="1" opacity="0.5" />
          <line x1="15" y1="11" x2="19" y2="11" stroke={ah} strokeWidth="1" opacity="0.4" />
        </>}
      </svg>
    ),

    // 🔥 Lightning bolt — zig-zag bolt shape
    fire: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={`cup-svg ${f ? "filled" : ""}`}>
        <path d="M13 2L4 14h6l-2 8 11-12h-6l2-8z" {...s()} />
        {f && <path d="M10 14l-2 8 5-5.5" fill={ah} opacity="0.3" />}
      </svg>
    ),

    // 🤠 Cowboy hat — wide brim, creased crown
    boot: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={`cup-svg ${f ? "filled" : ""}`}>
        {/* Brim */}
        <ellipse cx="12" cy="16" rx="11" ry="3" {...s()} />
        {/* Crown */}
        <path d="M7 16c0-3 0.5-5 1-6.5S9.5 7 10 6c.5-1 1-2.5 2-2.5s1.5 1.5 2 2.5.5 2 1 3.5S16 13 16 16"
          {...s({ fill: f ? a : "none" })} />
        {f && <path d="M9 11c1-1 2-1.5 3-1.5s2 .5 3 1.5" stroke={ah} strokeWidth="1" opacity="0.4" fill="none" />}
      </svg>
    ),

    // 🌊 Seashell — spiral shell shape
    wave: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={`cup-svg ${f ? "filled" : ""}`}>
        {/* Shell body */}
        <path d="M12 3C7 3 3 7 3 12c0 3 1.5 5.5 4 7.5C9 21 10.5 21 12 21c5 0 9-4 9-9S17 3 12 3z" {...s()} />
        {/* Spiral lines */}
        <path d="M12 6c-3 0-5.5 2.5-5.5 5.5S9 17 12 17c2.5 0 4.5-2 4.5-4.5S14.5 8 12 8c-2 0-3 1-3 2.5s1.5 2.5 3 2.5"
          stroke={f ? a : d} strokeWidth="1.2" fill="none" opacity={o} strokeLinecap="round" />
      </svg>
    ),

    // 🌸 Sunflower — round center with petals around it
    flower: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={`cup-svg ${f ? "filled" : ""}`}>
        {/* Petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <ellipse key={angle} cx="12" cy="5.5" rx="2" ry="3.5"
            fill={f ? a : "none"} stroke={f ? a : d} strokeWidth="1"
            opacity={o} transform={`rotate(${angle} 12 12)`} />
        ))}
        {/* Center */}
        <circle cx="12" cy="12" r="4" fill={f ? ah : "none"} stroke={f ? a : d} strokeWidth="1.5" opacity={o} />
        {/* Seeds pattern */}
        {f && <>
          <circle cx="11" cy="11" r="0.7" fill={a} opacity="0.6" />
          <circle cx="13" cy="11" r="0.7" fill={a} opacity="0.6" />
          <circle cx="12" cy="13" r="0.7" fill={a} opacity="0.6" />
        </>}
      </svg>
    ),

    // 📚 Bookmark — ribbon/flag shape for indie bookshop
    bookmark: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={`cup-svg ${f ? "filled" : ""}`}>
        <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" {...s()} />
        {f && <>
          <path d="M9 8h6" stroke={ah} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M9 11h4" stroke={ah} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </>}
      </svg>
    ),
  };

  return icons[iconType] || icons.cup;
}

function EspressoRating({ rating, onRate, interactive = true, theme }) {
  const [hovered, setHovered] = useState(null);

  if (!interactive && !rating) return null;

  const display = hovered || rating || 0;
  const labels = theme?.ratings?.labels || DEFAULT_RATING_LABELS;
  const iconType = theme?.ratings?.icon || "cup";
  const currentLabel = display > 0 ? labels[display - 1] : null;

  return (
    <div className="espresso-rating">
      <div className="espresso-cups">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            className={`espresso-cup ${v <= display ? "filled" : ""} ${!interactive ? "static" : ""}`}
            onClick={() => interactive && onRate(v === rating ? null : v)}
            onMouseEnter={() => interactive && setHovered(v)}
            onMouseLeave={() => interactive && setHovered(null)}
            disabled={!interactive}
            title={labels[v - 1]}
          >
            <RatingIcon filled={v <= display} iconType={iconType} />
          </button>
        ))}
      </div>
      {display > 0 && currentLabel && (
        <span className="espresso-label">{currentLabel}</span>
      )}
    </div>
  );
}

function SubGenrePicker({ book, originalIndex, onUpdateSubGenres }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const subGenres = book.subGenres || [];

  function toggleGenre(genre) {
    if (subGenres.includes(genre)) {
      onUpdateSubGenres(originalIndex, subGenres.filter((g) => g !== genre));
    } else {
      onUpdateSubGenres(originalIndex, [...subGenres, genre]);
    }
  }

  const filteredGenres = search.trim()
    ? ALL_SUB_GENRES.filter((g) => g.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div className="sub-genre-picker">
      {subGenres.length > 0 && (
        <div className="sub-genre-tags">
          {subGenres.map((g) => (
            <span key={g} className="sub-genre-tag" onClick={() => toggleGenre(g)}>
              {g} ×
            </span>
          ))}
        </div>
      )}

      <button
        className="btn btn-sm btn-ghost add-genre-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "Done" : "+ Genre"}
      </button>

      {isOpen && (
        <div className="genre-dropdown">
          <input
            type="text"
            className="genre-search"
            placeholder="Search genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {filteredGenres ? (
            <div className="genre-list">
              {filteredGenres.map((genre) => (
                <button
                  key={genre}
                  className={`genre-option ${subGenres.includes(genre) ? "selected" : ""}`}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </button>
              ))}
              {filteredGenres.length === 0 && (
                <p className="genre-empty">No matching genres</p>
              )}
            </div>
          ) : (
            <div className="genre-categories">
              {Object.entries(SUB_GENRE_MAP).map(([category, genres]) => (
                <div key={category} className="genre-category">
                  <h5 className="genre-cat-label">{category}</h5>
                  <div className="genre-cat-options">
                    {genres.map((genre) => (
                      <button
                        key={genre}
                        className={`genre-option ${subGenres.includes(genre) ? "selected" : ""}`}
                        onClick={() => toggleGenre(genre)}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TBRLibrary({
  library, onUpdateStatus, onUpdateTeaRating, onUpdateSubGenres, onRemove, theme,
  readingGoal, onSetGoal,
}) {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // When a spine is clicked, scroll to that book's card in the list
  function handleSpineClick(book) {
    const idx = library.indexOf(book);
    if (idx >= 0) {
      const el = document.getElementById(`lib-card-${idx}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("lib-card-highlight");
        setTimeout(() => el.classList.remove("lib-card-highlight"), 1500);
      }
    }
  }

  const allGenres = [...new Set(
    library.flatMap((b) => [...(b.categories || []), ...(b.subGenres || [])])
  )].sort();

  let filtered =
    filter === "all" ? library : library.filter((b) => b.status === filter);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((b) => {
      const title = (b.title || "").toLowerCase();
      const authors = (b.authors || "").toLowerCase();
      const genres = (b.categories || []).join(" ").toLowerCase();
      const subGenres = (b.subGenres || []).join(" ").toLowerCase();
      return title.includes(q) || authors.includes(q) || genres.includes(q) || subGenres.includes(q);
    });
  }

  const readBooks = library.filter((b) => b.status === "read" && b.teaRating);
  const avgEspresso = readBooks.length
    ? (readBooks.reduce((sum, b) => sum + b.teaRating, 0) / readBooks.length).toFixed(1)
    : null;

  if (library.length === 0) {
    return (
      <div className="library-section">
        <h2>Your Shelf</h2>
        <p className="empty-state">
          No books yet — scan a cover to start brewing your library ☕
        </p>
      </div>
    );
  }

  return (
    <div className="library-section">
      {/* Visual bookshelf */}
      <Bookshelf
        library={library}
        onBookClick={handleSpineClick}
        readingGoal={readingGoal}
        onSetGoal={onSetGoal}
      />

      <div className="library-header">
        <h2>Your Shelf</h2>
        <span className="book-count">
          {library.length} books
          {avgEspresso && <span className="avg-espresso"> · Avg: {avgEspresso} ☕</span>}
        </span>
      </div>

      <div className="library-search">
        <input
          type="text"
          placeholder="Search your shelf..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {STATUS_LABELS[s]} ({library.filter((b) => b.status === s).length})
          </button>
        ))}
      </div>

      {allGenres.length > 0 && (
        <div className="genre-bar">
          {allGenres.map((genre) => (
            <button
              key={genre}
              className={`genre-chip ${searchQuery.toLowerCase() === genre.toLowerCase() ? "active" : ""}`}
              onClick={() =>
                setSearchQuery(
                  searchQuery.toLowerCase() === genre.toLowerCase() ? "" : genre
                )
              }
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {searchQuery.trim() && (
        <p className="search-result-count">
          {filtered.length} {filtered.length === 1 ? "book" : "books"} found
          <button className="clear-search" onClick={() => setSearchQuery("")}>
            Clear
          </button>
        </p>
      )}

      <div className="library-list">
        {filtered.map((book) => {
          const originalIndex = library.indexOf(book);
          const allBookGenres = [...(book.categories || []), ...(book.subGenres || [])];

          return (
            <div key={`${book.title}-${originalIndex}`} id={`lib-card-${originalIndex}`} className="lib-card">
              {/* Cover */}
              <div className="lib-cover-wrap">
                {book.cover_url ? (
                  <img src={book.cover_url} alt="" className="lib-cover" />
                ) : (
                  <div className="lib-no-cover">
                    <span>{book.title}</span>
                  </div>
                )}
              </div>

              {/* Main info */}
              <div className="lib-body">
                <div className="lib-top-row">
                  <div className="lib-title-block">
                    <h4 className="lib-title">{book.title}</h4>
                    <p className="lib-author">{book.authors || "Unknown"}</p>
                  </div>
                  <span className={`lib-status-pill ${book.status}`}>
                    {STATUS_LABELS[book.status]}
                  </span>
                </div>

                {/* Genre tags row */}
                {allBookGenres.length > 0 && (
                  <div className="lib-genre-row">
                    {allBookGenres.map((g) => (
                      <span
                        key={g}
                        className="lib-genre-pill"
                        onClick={() => setSearchQuery(g)}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sub-genre picker */}
                <SubGenrePicker
                  book={book}
                  originalIndex={originalIndex}
                  onUpdateSubGenres={onUpdateSubGenres}
                />

                {/* Espresso rating — only for "read" books */}
                {book.status === "read" && (
                  <div className="lib-espresso-row">
                    <span className="espresso-prompt">
                      {book.teaRating ? "your rating" : "rate this brew"}
                    </span>
                    <EspressoRating
                      rating={book.teaRating}
                      onRate={(r) => onUpdateTeaRating(originalIndex, r)}
                      theme={theme}
                    />
                  </div>
                )}

                {/* Kindle / Audible / Amazon */}
                <AmazonBadges book={book} size="sm" />

                {/* Actions row */}
                <div className="lib-actions-row">
                  <select
                    value={book.status}
                    onChange={(e) => onUpdateStatus(originalIndex, e.target.value)}
                    className="lib-status-select"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <a
                    href={theme?.buyUrl
                      ? `${theme.buyUrl}/search/site/${encodeURIComponent(book.title + (book.authors ? " " + book.authors : ""))}`
                      : book.amazon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary"
                  >
                    {theme?.buyLabel || "Buy"}
                  </a>
                  <a
                    href={`https://www.goodreads.com/search?q=${encodeURIComponent((book.title || "") + " " + (book.authors || ""))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary"
                  >
                    Goodreads
                  </a>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => onRemove(originalIndex)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && searchQuery.trim() && (
        <p className="empty-state">No books match your search.</p>
      )}
    </div>
  );
}
