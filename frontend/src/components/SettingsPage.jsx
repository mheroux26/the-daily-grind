import { useState } from "react";
import { useTheme, THEME_LIST } from "../ThemeContext";

export default function SettingsPage({ onBack, user, logout, readingGoal, onSetGoal }) {
  const { themeId, setThemeId } = useTheme();
  const [goalInput, setGoalInput] = useState(readingGoal || "");

  function handleGoalSave() {
    const val = parseInt(goalInput, 10);
    if (val > 0) onSetGoal(val);
  }

  function handleClearGoal() {
    onSetGoal(null);
    setGoalInput("");
  }

  return (
    <div className="menu-page settings-page">
      <button className="menu-page-back" onClick={onBack}>← Back</button>

      <h1 className="settings-title">Settings</h1>

      {/* Account */}
      <section className="settings-section">
        <h2>Account</h2>
        <div className="settings-row">
          <span className="settings-label">Logged in as</span>
          <span className="settings-value">{user?.nickname || user?.email || "Guest"}</span>
        </div>
        <button className="settings-logout" onClick={logout}>
          Log Out
        </button>
      </section>

      {/* Default Vibe */}
      <section className="settings-section">
        <h2>Default Vibe</h2>
        <p className="settings-hint">Choose which vibe loads when you open the app.</p>
        <div className="settings-vibe-grid">
          {THEME_LIST.map((t) => (
            <button
              key={t.id}
              className={`settings-vibe-option ${themeId === t.id ? "active" : ""}`}
              onClick={() => setThemeId(t.id)}
            >
              <span className="settings-vibe-emoji">{t.emoji}</span>
              <span className="settings-vibe-name">{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Reading Goal */}
      <section className="settings-section">
        <h2>Reading Goal</h2>
        <p className="settings-hint">Set a yearly reading goal to track on your shelf.</p>
        <div className="settings-goal-row">
          <input
            type="number"
            className="settings-goal-input"
            placeholder="e.g. 24"
            min="1"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
          />
          <span className="settings-goal-label">books this year</span>
          <button className="settings-goal-save" onClick={handleGoalSave}>Save</button>
          {readingGoal && (
            <button className="settings-goal-clear" onClick={handleClearGoal}>Clear</button>
          )}
        </div>
      </section>
    </div>
  );
}
