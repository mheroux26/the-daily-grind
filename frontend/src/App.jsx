import { useState, useEffect } from "react";
import PhotoUpload from "./components/PhotoUpload";
import BookMatches from "./components/BookMatches";
import TBRLibrary from "./components/TBRLibrary";
import MusicPlayer from "./components/MusicPlayer";
import BookTokFeed from "./components/BookTokFeed";
import ThemePicker from "./components/ThemePicker";
import NicknameLogin from "./components/NicknameLogin";
import HamburgerMenu from "./components/HamburgerMenu";
import AboutPage from "./components/AboutPage";
import ProfilePage from "./components/ProfilePage";
import SettingsPage from "./components/SettingsPage";
import PrivacyPage from "./components/PrivacyPage";
import ContactPage from "./components/ContactPage";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { useUser } from "./UserContext";
import { useLibrary } from "./useLibrary";
import { autoTagGenres } from "./genreMap";
import "./App.css";

// Sample trending data for homepage — Open Library ISBN covers with Google Books fallback
const TRENDING_BOOKS = [
  { title: "Intermezzo", authors: "Sally Rooney", cover_url: "https://covers.openlibrary.org/b/isbn/9780374602635-L.jpg", cover_fallback: "https://books.google.com/books/content?id=VYbcEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api", sub_genres: ["Literary Fiction"], categories: ["Literary Fiction"], amazon_url: "https://www.amazon.com/s?k=Intermezzo+Sally+Rooney" },
  { title: "A Court of Thorns and Roses", authors: "Sarah J. Maas", cover_url: "https://covers.openlibrary.org/b/isbn/9781635575569-L.jpg", cover_fallback: "https://books.google.com/books/content?id=y3UIEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api", sub_genres: ["Romantasy"], categories: ["Fantasy", "Romance"], amazon_url: "https://www.amazon.com/s?k=Court+of+Thorns+and+Roses" },
  { title: "The Secret History", authors: "Donna Tartt", cover_url: "https://covers.openlibrary.org/b/isbn/9781400031702-L.jpg", cover_fallback: "https://books.google.com/books/content?id=xVPqfDIx1kEC&printsec=frontcover&img=1&zoom=1&source=gbs_api", sub_genres: ["Dark Academia"], categories: ["Literary Fiction"], amazon_url: "https://www.amazon.com/s?k=The+Secret+History" },
  { title: "Tomorrow, and Tomorrow, and Tomorrow", authors: "Gabrielle Zevin", cover_url: "https://covers.openlibrary.org/b/isbn/9780593321201-L.jpg", cover_fallback: "https://books.google.com/books/content?id=Bo09EAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api", sub_genres: ["Literary Fiction"], categories: ["Literary Fiction"], amazon_url: "https://www.amazon.com/s?k=Tomorrow+and+Tomorrow+Gabrielle+Zevin" },
  { title: "Happy Place", authors: "Emily Henry", cover_url: "https://covers.openlibrary.org/b/isbn/9780593441275-L.jpg", cover_fallback: "https://books.google.com/books/content?id=tOiHEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api", sub_genres: ["Contemporary Romance"], categories: ["Romance"], amazon_url: "https://www.amazon.com/s?k=Happy+Place+Emily+Henry" },
  { title: "Remarkably Bright Creatures", authors: "Shelby Van Pelt", cover_url: "https://covers.openlibrary.org/b/isbn/9780063204157-L.jpg", cover_fallback: "https://books.google.com/books/content?id=ZDdREAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api", sub_genres: ["Contemporary Fiction"], categories: ["Literary Fiction"], amazon_url: "https://www.amazon.com/s?k=Remarkably+Bright+Creatures" },
];

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  const { theme } = useTheme();
  const { user, logout } = useUser();
  const {
    library,
    addToLibrary: dbAddToLibrary,
    updateStatus: dbUpdateStatus,
    updateRating: dbUpdateRating,
    updateSubGenres: dbUpdateSubGenres,
    removeFromLibrary: dbRemove,
  } = useLibrary(user?.id);

  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [menuPage, setMenuPage] = useState(null); // null = show tabs, string = show menu page
  const [readingGoal, setReadingGoal] = useState(() => {
    try {
      const saved = localStorage.getItem("dailygrind_reading_goal");
      return saved ? parseInt(saved, 10) : null;
    } catch { return null; }
  });

  function handleSetGoal(goal) {
    setReadingGoal(goal);
    try { localStorage.setItem("dailygrind_reading_goal", goal); } catch {}
  }

  // Auto-tag genres on library updates
  useEffect(() => {
    // Genre auto-tagging runs client-side for display purposes
  }, [library.length]);

  function addToLibrary(book) {
    dbAddToLibrary(book);
  }

  // These callbacks receive the index from TBRLibrary — map to library IDs
  function updateStatus(index, status) {
    const entry = library[index];
    if (entry?.libraryId) dbUpdateStatus(entry.libraryId, status);
  }

  function updateTeaRating(index, rating) {
    const entry = library[index];
    if (entry?.libraryId) dbUpdateRating(entry.libraryId, rating);
  }

  function updateSubGenres(index, subGenres) {
    const entry = library[index];
    if (entry?.bookId) dbUpdateSubGenres(entry.bookId, subGenres);
  }

  function removeFromLibrary(index) {
    const entry = library[index];
    if (entry?.libraryId) dbRemove(entry.libraryId);
  }

  function isInLibrary(book) {
    return library.some((b) => b.title === book.title);
  }

  // Show login screen if no user
  if (!user) {
    return <NicknameLogin />;
  }

  const recentAdds = library.slice(-3).reverse();
  const readingNow = library.filter((b) => b.status === "reading");

  return (
    <div className="app">
      {/* ── Header with Hamburger ── */}
      <header className="app-header">
        <HamburgerMenu activePage={menuPage} onNavigate={setMenuPage} user={user} />
        <div className="header-text">
          <h1 className="logo-wordmark" onClick={() => setMenuPage(null)}>
            the daily <em>grind</em>
          </h1>
          <p className="tagline">{theme.tagline}</p>
        </div>
      </header>

      <ThemePicker />
      <MusicPlayer theme={theme} />

      <nav className="tab-bar">
        <button
          className={`tab ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          Home
        </button>
        <button
          className={`tab ${activeTab === "booktok" ? "active" : ""}`}
          onClick={() => setActiveTab("booktok")}
        >
          BookTok
        </button>
        <button
          className={`tab ${activeTab === "library" ? "active" : ""}`}
          onClick={() => setActiveTab("library")}
        >
          My Shelf {library.length > 0 && `(${library.length})`}
        </button>
      </nav>

      <main className="main-content">
        {/* ── Menu Pages (overlay main tabs) ── */}
        {menuPage === "about" && (
          <AboutPage onBack={() => setMenuPage(null)} />
        )}
        {menuPage === "profile" && (
          <ProfilePage onBack={() => setMenuPage(null)} user={user} library={library} theme={theme} />
        )}
        {menuPage === "settings" && (
          <SettingsPage onBack={() => setMenuPage(null)} user={user} logout={logout} readingGoal={readingGoal} onSetGoal={handleSetGoal} />
        )}
        {menuPage === "privacy" && (
          <PrivacyPage onBack={() => setMenuPage(null)} />
        )}
        {menuPage === "contact" && (
          <ContactPage onBack={() => setMenuPage(null)} />
        )}

        {/* ── Regular Tabs (hidden when a menu page is open) ── */}
        {!menuPage && activeTab === "home" && (
          <div className="home-page">
            {/* Compact scan area */}
            <section className="scan-section">
              <PhotoUpload
                onScanComplete={setScanResult}
                isScanning={isScanning}
                setIsScanning={setIsScanning}
              />
              <BookMatches
                scanResult={scanResult}
                library={library}
                onAddToLibrary={addToLibrary}
                onClear={() => setScanResult(null)}
              />
            </section>

            {/* Announcement / Sponsor banner */}
            <section className="promo-banner">
              <div className="promo-content">
                <span className="promo-badge">New</span>
                <p className="promo-text">
                  BookTok is here — see what creators are reading and add to your shelf in one tap
                </p>
                <button className="promo-cta" onClick={() => setActiveTab("booktok")}>
                  Explore →
                </button>
              </div>
            </section>

            {/* Trending on BookTok */}
            <section className="home-section">
              <div className="section-header">
                <h2>Trending on BookTok</h2>
                <button className="section-link" onClick={() => setActiveTab("booktok")}>
                  See all →
                </button>
              </div>
              <div className="trending-scroll">
                {TRENDING_BOOKS.map((book) => (
                  <div key={book.title} className="trending-card">
                    <div className="trending-cover">
                      <img
                        src={book.cover_url}
                        alt=""
                        onError={(e) => {
                          if (book.cover_fallback && !e.target.dataset.triedFallback) {
                            e.target.dataset.triedFallback = "true";
                            e.target.src = book.cover_fallback;
                          } else {
                            e.target.style.display = "none";
                          }
                        }}
                      />
                    </div>
                    <span className="trending-title">{book.title}</span>
                    <span className="trending-author">{book.authors}</span>
                    {book.sub_genres?.[0] && (
                      <span className="trending-genre">{book.sub_genres[0]}</span>
                    )}
                    {isInLibrary(book) ? (
                      <span className="trending-on-shelf">✓ On shelf</span>
                    ) : (
                      <button className="trending-add" onClick={() => addToLibrary(book)}>
                        + Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Your shelf activity */}
            {library.length > 0 && (
              <section className="home-section">
                <div className="section-header">
                  <h2>Your Shelf</h2>
                  <button className="section-link" onClick={() => setActiveTab("library")}>
                    View all →
                  </button>
                </div>

                {readingNow.length > 0 && (
                  <div className="shelf-activity">
                    <h3 className="activity-label">Currently Reading</h3>
                    <div className="activity-books">
                      {readingNow.map((book) => (
                        <div key={book.title} className="activity-card">
                          {book.cover_url && (
                            <img src={book.cover_url} alt="" className="activity-cover" />
                          )}
                          <div className="activity-info">
                            <span className="activity-title">{book.title}</span>
                            <span className="activity-author">{book.authors}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recentAdds.length > 0 && (
                  <div className="shelf-activity">
                    <h3 className="activity-label">Recently Added</h3>
                    <div className="activity-books">
                      {recentAdds.map((book) => (
                        <div key={book.title} className="activity-card">
                          {book.cover_url && (
                            <img src={book.cover_url} alt="" className="activity-cover" />
                          )}
                          <div className="activity-info">
                            <span className="activity-title">{book.title}</span>
                            <span className="activity-author">{book.authors}</span>
                            <span className={`activity-status ${book.status}`}>
                              {book.status === "tbr" ? "TBR" : book.status === "reading" ? "Reading" : "Read"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Sponsor placeholder */}
            <section className="sponsor-slot">
              <span className="sponsor-label">Sponsored</span>
              <div className="sponsor-placeholder">
                Your ad here — reach readers who discover their next favorite book every day
              </div>
            </section>
          </div>
        )}

        {!menuPage && activeTab === "booktok" && (
          <BookTokFeed library={library} onAddToLibrary={addToLibrary} />
        )}

        {!menuPage && activeTab === "library" && (
          <TBRLibrary
            library={library}
            onUpdateStatus={updateStatus}
            onUpdateTeaRating={updateTeaRating}
            onUpdateSubGenres={updateSubGenres}
            onRemove={removeFromLibrary}
            theme={theme}
            readingGoal={readingGoal}
            onSetGoal={handleSetGoal}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>the daily grind — fueled by books & caffeine</p>
      </footer>

    </div>
  );
}
