import { useState } from "react";

export default function ContactPage({ onBack }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("feedback");
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // For now, open a mailto link. Replace with a form endpoint later.
    const subject = encodeURIComponent(
      `[Daily Grind ${type}] from ${name || "a reader"}`
    );
    const body = encodeURIComponent(message);
    window.open(`mailto:melaniecheroux@gmail.com?subject=${subject}&body=${body}`);
    setSent(true);
  }

  return (
    <div className="menu-page contact-page">
      <button className="menu-page-back" onClick={onBack}>← Back</button>

      <h1 className="contact-title">Contact & Feedback</h1>
      <p className="contact-intro">
        Got a feature idea? Found a bug? Just want to say hi? I'd love to hear
        from you — this app is built by readers, for readers.
      </p>

      {sent ? (
        <div className="contact-thanks">
          <span className="contact-thanks-icon">💌</span>
          <h2>Thanks for reaching out!</h2>
          <p>Your email client should have opened with your message. If not, feel free to email me directly.</p>
          <button className="contact-again" onClick={() => setSent(false)}>
            Send another
          </button>
        </div>
      ) : (
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-field">
            <label htmlFor="contact-type">What's this about?</label>
            <select
              id="contact-type"
              className="contact-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="feedback">General Feedback</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
              <option value="question">Question</option>
              <option value="collab">Collaboration / Partnership</option>
            </select>
          </div>

          <div className="contact-field">
            <label htmlFor="contact-name">Your Name (optional)</label>
            <input
              id="contact-name"
              type="text"
              className="contact-input"
              placeholder="How should I address you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-msg">Message</label>
            <textarea
              id="contact-msg"
              className="contact-textarea"
              placeholder="Tell me what's on your mind..."
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="contact-submit">
            Send Message
          </button>
        </form>
      )}

      <div className="contact-alt">
        <p>You can also reach me on social media or email me directly at <strong>melaniecheroux@gmail.com</strong></p>
      </div>
    </div>
  );
}
