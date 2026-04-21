import { useState } from "react";

// Generate a consistent color from a string (title)
function stringToColor(str) {
  const colors = [
    "#B388FF", "#9B6FE8", "#D4BBFF", "#7C6BC4",
    "#E891B9", "#91C4E8", "#E8C491", "#91E8B3",
    "#C491E8", "#E89191", "#91D4E8", "#B8E891",
    "#E8B891", "#9191E8", "#E891D4", "#91E8D4",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Generate a consistent height variation for book spines
function stringToHeight(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 3) - hash);
  }
  return 120 + (Math.abs(hash) % 50); // 120-170px
}

function BookSpine({ book, onClick }) {
  const color = stringToColor(book.title);
  const height = stringToHeight(book.title);
  const isRead = book.status === "read";
  const isReading = book.status === "reading";

  const width = 28 + (book.title.length % 16);

  return (
    <div
      className={`shelf-spine ${book.status}`}
      style={{
        height: `${height}px`,
        width: `${Math.min(width, 52)}px`,
        "--spine-color": color,
      }}
      onClick={() => onClick?.(book)}
      title={`${book.title} — ${book.authors || "Unknown"}`}
    >
      <span className="spine-title">{book.title}</span>
      {isRead && book.teaRating && (
        <span className="spine-rating">{"☕".repeat(book.teaRating)}</span>
      )}
      {isReading && <span className="spine-progress">📖</span>}
    </div>
  );
}

// Thermometer progress — fills from bottom to top like a fundraiser thermometer
function GoalThermometer({ readCount, goal, onEdit }) {
  const pct = goal > 0 ? Math.min((readCount / goal) * 100, 100) : 0;
  const isComplete = readCount >= goal;
  // Show milestone ticks at 25%, 50%, 75%
  const ticks = [25, 50, 75];

  return (
    <div className="thermo-wrap" onClick={onEdit} title="Click to change goal">
      <div className="thermo-label-top">
        {isComplete ? "🎉" : `${goal}`}
      </div>
      <div className="thermo-tube">
        <div className="thermo-fill" style={{ height: `${pct}%` }}>
          {isComplete && <div className="thermo-glow" />}
        </div>
        {ticks.map((t) => (
          <div key={t} className="thermo-tick" style={{ bottom: `${t}%` }}>
            <span className="thermo-tick-label">{Math.round(goal * t / 100)}</span>
          </div>
        ))}
      </div>
      <div className="thermo-bulb">
        <span className="thermo-bulb-num">{readCount}</span>
      </div>
      <div className="thermo-caption">
        {isComplete ? "Goal hit!" : `${readCount} of ${goal}`}
      </div>
    </div>
  );
}

export default function Bookshelf({ library, onBookClick, readingGoal, onSetGoal }) {
  const [shelfView, setShelfView] = useState("all");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(readingGoal || 24);

  const booksToShow = shelfView === "all"
    ? library
    : library.filter((b) => b.status === shelfView);

  const shelvesData = [];
  const perShelf = 8;
  for (let i = 0; i < booksToShow.length; i += perShelf) {
    shelvesData.push(booksToShow.slice(i, i + perShelf));
  }
  while (shelvesData.length < 2) {
    shelvesData.push([]);
  }

  const readCount = library.filter((b) => b.status === "read").length;
  const totalCount = library.length;

  function saveGoal() {
    const val = parseInt(goalInput, 10);
    if (val > 0) onSetGoal(val);
    setEditingGoal(false);
  }

  return (
    <div className="bookshelf-container">
      <div className="bookshelf-header">
        <div className="bookshelf-stats">
          <span className="shelf-stat-main">{readCount}/{totalCount}</span>
          <span className="shelf-stat-label">books read</span>
        </div>
        <div className="bookshelf-filters">
          {[
            { key: "all", label: "All" },
            { key: "read", label: "Read" },
            { key: "reading", label: "Reading" },
            { key: "tbr", label: "TBR" },
          ].map((f) => (
            <button
              key={f.key}
              className={`shelf-filter ${shelfView === f.key ? "active" : ""}`}
              onClick={() => setShelfView(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shelf + thermometer side by side */}
      <div className="shelf-with-thermo">
        <div className="bookshelf">
          {shelvesData.map((shelfBooks, si) => (
            <div key={si} className="shelf-row">
              <div className="shelf-books">
                {shelfBooks.map((book, bi) => (
                  <BookSpine key={`${book.title}-${bi}`} book={book} onClick={onBookClick} />
                ))}
                {shelfBooks.length === 0 && (
                  <div className="shelf-empty-hint">
                    {si === 0 ? "Scan a cover to start filling your shelf" : ""}
                  </div>
                )}
              </div>
              <div className="shelf-plank"></div>
            </div>
          ))}
        </div>

        {/* Thermometer sits alongside the shelf */}
        {readingGoal ? (
          <GoalThermometer
            readCount={readCount}
            goal={readingGoal}
            onEdit={() => setEditingGoal(true)}
          />
        ) : (
          <div className="thermo-wrap thermo-empty" onClick={() => setEditingGoal(true)}>
            <div className="thermo-tube thermo-tube-empty" />
            <div className="thermo-bulb thermo-bulb-empty" />
            <div className="thermo-caption">Set goal</div>
          </div>
        )}
      </div>

      {/* Goal edit modal */}
      {editingGoal && (
        <div className="goal-modal-backdrop" onClick={() => setEditingGoal(false)}>
          <div className="goal-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Reading Goal</h4>
            <p className="goal-modal-desc">How many books do you want to read?</p>
            <input
              type="number"
              className="goal-modal-input"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveGoal()}
              min="1"
              max="365"
              autoFocus
            />
            <div className="goal-modal-actions">
              <button className="goal-modal-save" onClick={saveGoal}>Set Goal</button>
              <button className="goal-modal-cancel" onClick={() => setEditingGoal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="shelf-legend">
        <span className="legend-item"><span className="legend-dot read"></span> Read</span>
        <span className="legend-item"><span className="legend-dot reading"></span> Reading</span>
        <span className="legend-item"><span className="legend-dot tbr"></span> TBR</span>
      </div>
    </div>
  );
}
