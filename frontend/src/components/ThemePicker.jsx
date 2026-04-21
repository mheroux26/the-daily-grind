import { useState } from "react";
import { useTheme, THEME_LIST } from "../ThemeContext";

export default function ThemePicker() {
  const { theme, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="theme-picker-wrap">
      {/* Always-visible toggle button */}
      <button
        className="theme-toggle-btn"
        onClick={() => setOpen(!open)}
        title="Change vibe"
        aria-label="Change theme"
      >
        <span className="theme-toggle-emoji">{theme.emoji}</span>
        <span className="theme-toggle-label">Vibe</span>
      </button>

      {/* Expanded picker panel */}
      {open && (
        <>
          <div className="theme-picker-backdrop" onClick={() => setOpen(false)} />
          <div className="theme-picker-panel">
            <div className="theme-picker-header">
              <h3>Choose your vibe</h3>
              <button className="theme-picker-close" onClick={() => setOpen(false)}>
                &times;
              </button>
            </div>
            <div className="theme-picker-grid">
              {THEME_LIST.map((t) => {
                const active = t.id === theme.id;
                return (
                  <button
                    key={t.id}
                    className={`theme-option ${active ? "active" : ""}`}
                    onClick={() => {
                      setThemeId(t.id);
                      setOpen(false);
                    }}
                    style={{
                      "--opt-accent": t.colors.accent,
                      "--opt-bg": t.colors.bg,
                    }}
                  >
                    <div
                      className="theme-option-preview"
                      style={{
                        backgroundImage: `linear-gradient(${t.colors.overlayStart}, ${t.colors.overlayEnd}), url('${t.background}')`,
                      }}
                    >
                      <span className="theme-option-emoji">{t.emoji}</span>
                    </div>
                    <span className="theme-option-name">{t.name}</span>
                    <span className="theme-option-desc">{t.description}</span>
                    {active && <span className="theme-option-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
