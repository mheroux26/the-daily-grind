/**
 * AmazonBadges — Kindle, Audible, and Amazon availability links
 *
 * Generates deep links into Amazon for Kindle Unlimited, Audible,
 * and paperback/hardcover using title + author search queries.
 * These are affiliate-ready (add ?tag=YOUR_TAG when you join Associates).
 */

function buildAmazonLinks(book) {
  const q = encodeURIComponent(
    (book.title || "") + (book.authors ? " " + book.authors : "")
  );

  return {
    kindle: `https://www.amazon.com/s?k=${q}&i=digital-text&rh=p_n_feature_nineteen_browse-bin%3A9045887011`,
    audible: `https://www.amazon.com/s?k=${q}&i=audible`,
    amazon: book.amazon_url || `https://www.amazon.com/s?k=${q}&i=stripbooks`,
  };
}

export default function AmazonBadges({ book, size = "sm" }) {
  const links = buildAmazonLinks(book);

  return (
    <div className={`amazon-badges ${size === "lg" ? "amazon-badges-lg" : ""}`}>
      <a
        href={links.kindle}
        target="_blank"
        rel="noopener noreferrer"
        className="amazon-badge kindle-badge"
        title="Check Kindle Unlimited"
      >
        <span className="badge-icon">📱</span>
        <span className="badge-label">Kindle</span>
      </a>
      <a
        href={links.audible}
        target="_blank"
        rel="noopener noreferrer"
        className="amazon-badge audible-badge"
        title="Check on Audible"
      >
        <span className="badge-icon">🎧</span>
        <span className="badge-label">Audible</span>
      </a>
      <a
        href={links.amazon}
        target="_blank"
        rel="noopener noreferrer"
        className="amazon-badge amazon-buy-badge"
        title="View on Amazon"
      >
        <span className="badge-icon">📦</span>
        <span className="badge-label">Amazon</span>
      </a>
    </div>
  );
}

export { buildAmazonLinks };
