import { useMemo } from "react";

export default function ProfilePage({ onBack, user, library, theme }) {
  const stats = useMemo(() => {
    const tbr = library.filter((b) => b.status === "tbr").length;
    const reading = library.filter((b) => b.status === "reading").length;
    const read = library.filter((b) => b.status === "read").length;
    const total = library.length;
    const rated = library.filter((b) => b.rating && b.rating > 0);
    const avgRating = rated.length > 0
      ? (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(1)
      : null;

    // Top genres
    const genreCounts = {};
    library.forEach((b) => {
      const genres = b.subGenres || b.sub_genres || b.categories || [];
      genres.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Top authors
    const authorCounts = {};
    library.forEach((b) => {
      const author = b.authors || b.author;
      if (author) {
        authorCounts[author] = (authorCounts[author] || 0) + 1;
      }
    });
    const topAuthors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { tbr, reading, read, total, avgRating, topGenres, topAuthors };
  }, [library]);

  const ratingLabels = theme?.ratings?.labels || ["1", "2", "3", "4", "5"];

  return (
    <div className="menu-page profile-page">
      <button className="menu-page-back" onClick={onBack}>← Back</button>

      <div className="profile-header">
        <div className="profile-avatar">
          {(user?.nickname || "?")[0].toUpperCase()}
        </div>
        <h1 className="profile-name">{user?.nickname || "Reader"}</h1>
        <p className="profile-tagline">
          {stats.total === 0
            ? "Your shelf is waiting..."
            : `${stats.total} book${stats.total !== 1 ? "s" : ""} on your shelf`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat">
          <span className="stat-number">{stats.tbr}</span>
          <span className="stat-label">TBR</span>
        </div>
        <div className="profile-stat">
          <span className="stat-number">{stats.reading}</span>
          <span className="stat-label">Reading</span>
        </div>
        <div className="profile-stat">
          <span className="stat-number">{stats.read}</span>
          <span className="stat-label">Read</span>
        </div>
        {stats.avgRating && (
          <div className="profile-stat">
            <span className="stat-number">{stats.avgRating}</span>
            <span className="stat-label">Avg Rating</span>
          </div>
        )}
      </div>

      {/* Top Genres */}
      {stats.topGenres.length > 0 && (
        <section className="profile-section">
          <h2>Your Top Genres</h2>
          <div className="profile-genre-list">
            {stats.topGenres.map(([genre, count]) => (
              <div key={genre} className="profile-genre-row">
                <span className="profile-genre-name">{genre}</span>
                <div className="profile-genre-bar-wrap">
                  <div
                    className="profile-genre-bar"
                    style={{
                      width: `${Math.round((count / stats.total) * 100)}%`,
                    }}
                  />
                </div>
                <span className="profile-genre-count">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Authors */}
      {stats.topAuthors.length > 0 && (
        <section className="profile-section">
          <h2>Most-Shelved Authors</h2>
          <div className="profile-author-list">
            {stats.topAuthors.map(([author, count]) => (
              <div key={author} className="profile-author-row">
                <span className="profile-author-name">{author}</span>
                <span className="profile-author-count">{count} book{count !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.total === 0 && (
        <div className="profile-empty">
          <p>Start scanning book covers or search by title to build your shelf and see your reading stats here.</p>
        </div>
      )}
    </div>
  );
}
