export default function AboutPage({ onBack }) {
  return (
    <div className="menu-page about-page">
      <button className="menu-page-back" onClick={onBack}>← Back</button>

      <div className="about-hero">
        <h1 className="about-title">the daily <em>grind</em></h1>
        <p className="about-subtitle">snap a cover. build your shelf. find your vibe.</p>
      </div>

      <section className="about-section">
        <h2>The Story</h2>
        <p>
          I built The Daily Grind because I kept losing track of books. I'd see
          a cover on BookTok, screenshot it, and then forget about it two days
          later. Sound familiar?
        </p>
        <p>
          So I made the app I wished existed — snap a photo of any book cover
          (or a screenshot from social media), and it finds the title instantly.
          One tap and it's on your shelf. No more lost recommendations.
        </p>
      </section>

      <section className="about-section">
        <h2>How It Works</h2>
        <div className="about-steps">
          <div className="about-step">
            <span className="about-step-num">1</span>
            <div>
              <strong>Snap or Upload</strong>
              <p>Take a photo of a book cover or upload a screenshot from BookTok, Instagram, or anywhere.</p>
            </div>
          </div>
          <div className="about-step">
            <span className="about-step-num">2</span>
            <div>
              <strong>Instant Match</strong>
              <p>Our scanner reads the cover and finds the book — title, author, description, and buy links.</p>
            </div>
          </div>
          <div className="about-step">
            <span className="about-step-num">3</span>
            <div>
              <strong>Build Your Shelf</strong>
              <p>Add books to your TBR, track what you're reading, rate them when you're done, and discover your taste.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Set the Vibe</h2>
        <p>
          Every reader has a vibe. Pick yours — from Espresso Bar lo-fi to
          Coastal Chill surf rock — and the whole app transforms: colors,
          fonts, background, and music. Because reading should feel like
          <em> your </em> thing.
        </p>
      </section>

      <section className="about-section">
        <h2>Built for the Community</h2>
        <p>
          The Daily Grind is made by a reader, for readers. No ads in your
          face, no data sold. Just a clean space to collect your books and
          share what you're reading.
        </p>
        <p>
          If you love it, share it. That's how we grow — one recommendation
          at a time, just like the books themselves.
        </p>
      </section>
    </div>
  );
}
