import { useState } from "react";

export default function HamburgerMenu({ activePage, onNavigate, user }) {
  const [open, setOpen] = useState(false);

  const pages = [
    { id: "about", label: "About", icon: "☕" },
    { id: "profile", label: "My Profile", icon: "📖" },
    { id: "settings", label: "Settings", icon: "⚙️" },
    { id: "privacy", label: "Privacy & Terms", icon: "🔒" },
    { id: "contact", label: "Contact & Feedback", icon: "💬" },
  ];

  function handleNav(pageId) {
    onNavigate(pageId);
    setOpen(false);
  }

  return (
    <>
      <button
        className="hamburger-btn"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <span className={`hamburger-icon ${open ? "open" : ""}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Backdrop */}
      {open && <div className="menu-backdrop" onClick={() => setOpen(false)} />}

      {/* Drawer */}
      <div className={`menu-drawer ${open ? "open" : ""}`}>
        <div className="menu-drawer-header">
          <h2 className="menu-drawer-logo">
            the daily <em>grind</em>
          </h2>
          {user && (
            <span className="menu-drawer-user">{user.nickname || user.email}</span>
          )}
        </div>

        <nav className="menu-drawer-nav">
          {pages.map((page) => (
            <button
              key={page.id}
              className={`menu-drawer-item ${activePage === page.id ? "active" : ""}`}
              onClick={() => handleNav(page.id)}
            >
              <span className="menu-item-icon">{page.icon}</span>
              <span className="menu-item-label">{page.label}</span>
            </button>
          ))}
        </nav>

        <div className="menu-drawer-footer">
          <span className="menu-version">v1.0 — fueled by books & caffeine</span>
        </div>
      </div>
    </>
  );
}
