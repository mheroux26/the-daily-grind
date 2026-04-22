export default function PrivacyPage({ onBack }) {
  return (
    <div className="menu-page privacy-page">
      <button className="menu-page-back" onClick={onBack}>← Back</button>

      <h1 className="privacy-title">Privacy Policy & Terms</h1>
      <p className="privacy-updated">Last updated: April 2026</p>

      <section className="privacy-section">
        <h2>What We Collect</h2>
        <p>
          The Daily Grind collects the minimum data needed to make the app
          work for you: your display name, the books on your shelf, your
          ratings, and your reading status. When you scan a book cover, the
          image is processed to identify the book and is not stored afterward.
        </p>
      </section>

      <section className="privacy-section">
        <h2>How We Use It</h2>
        <p>
          Your data powers your personal bookshelf — that's it. We don't sell
          your information, we don't share it with advertisers, and we don't
          build profiles on you for third parties. Your reading habits are
          yours.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Third-Party Services</h2>
        <p>
          We use Google Books API to look up book information and Google Cloud
          Vision to read book covers. These services process data according
          to their own privacy policies. We also include Amazon affiliate
          links — when you buy a book through our link, we earn a small
          commission at no extra cost to you.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Music Streams</h2>
        <p>
          The vibe music comes from free, publicly available internet radio
          streams (SomaFM, WAMU Bluegrass Country, and others). We don't
          control the content of these streams.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Data Storage</h2>
        <p>
          Your shelf data is stored securely. You can delete your account and
          all associated data at any time by contacting us.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Terms of Use</h2>
        <p>
          The Daily Grind is provided as-is. We do our best to keep it
          running smoothly, but we can't guarantee 100% uptime or perfect
          book matches. Use the app for personal, non-commercial purposes.
          Don't do anything illegal or harmful with it. That's pretty much it.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Changes</h2>
        <p>
          If we update this policy, we'll note the date above. Continued use
          of the app means you're okay with the current terms.
        </p>
      </section>

      <section className="privacy-section">
        <h2>Questions?</h2>
        <p>
          Reach out anytime — see the Contact & Feedback page for how to get
          in touch.
        </p>
      </section>
    </div>
  );
}
