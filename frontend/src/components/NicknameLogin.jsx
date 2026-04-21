import { useState } from "react";
import { useUser } from "../UserContext";

export default function NicknameLogin() {
  const { loginWithNickname } = useUser();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await loginWithNickname(nickname);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="nickname-login-backdrop">
      <div className="nickname-login-card">
        <h1 className="nickname-logo">
          the daily <em>grind</em>
        </h1>
        <p className="nickname-subtitle">snap a cover, build your shelf</p>

        <form onSubmit={handleSubmit} className="nickname-form">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="pick a nickname..."
            className="nickname-input"
            maxLength={24}
            autoFocus
            disabled={loading}
          />
          <button type="submit" className="nickname-btn" disabled={loading || !nickname.trim()}>
            {loading ? "..." : "Let's go"}
          </button>
        </form>

        {error && <p className="nickname-error">{error}</p>}

        <p className="nickname-hint">
          Just a nickname so we can save your books. No password needed.
        </p>
      </div>
    </div>
  );
}
