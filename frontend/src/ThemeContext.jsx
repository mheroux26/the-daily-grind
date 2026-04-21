import { createContext, useContext, useState, useEffect } from "react";

// ─── Theme Definitions ───────────────────────────────────────
// Each theme is a full "experience shift": colors, fonts, background,
// music channels, rating icons/labels, and tagline.

export const THEMES = {
  espresso: {
    id: "espresso",
    name: "Espresso Bar",
    emoji: "☕",
    description: "Lo-fi & lavender",
    tagline: "snap · shelf · sip",
    colors: {
      bg: "#0e0c10",
      surface: "rgba(20, 18, 24, 0.82)",
      surfaceSolid: "#1a1720",
      accent: "#B388FF",
      accentBright: "#D4BBFF",
      accentHover: "#9B6FE8",
      accentMuted: "rgba(179, 136, 255, 0.10)",
      border: "rgba(179, 136, 255, 0.06)",
      text: "#e8e2f0",
      textMuted: "rgba(232, 226, 240, 0.55)",
      overlayStart: "rgba(14, 12, 16, 0.55)",
      overlayEnd: "rgba(14, 12, 16, 0.48)",
    },
    background: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80",
    fonts: {
      heading: "'Space Grotesk', sans-serif",
      body: "'DM Sans', sans-serif",
    },
    music: [
      { name: "Lo-fi Chill", genre: "lofi", url: "https://streams.ilovemusic.de/iloveradio17.mp3", fallback: "https://play.streamafrica.net/lofiradio" },
      { name: "Jazz Cafe", genre: "jazz", url: "https://streaming.radio.co/s774887f7b/listen", fallback: "https://stream.0nlineradio.com/jazz" },
      { name: "Ambient", genre: "ambient", url: "https://streams.ilovemusic.de/iloveradio20.mp3", fallback: "https://stream.0nlineradio.com/ambient" },
    ],
    ratings: {
      icon: "cup",
      labels: ["meh", "it was fine", "solid", "obsessed", "unputdownable"],
    },
  },

  darkacademia: {
    id: "darkacademia",
    name: "Dark Academia",
    emoji: "🪶",
    description: "Gothic gold & classical",
    tagline: "snap · shelf · ponder",
    colors: {
      bg: "#0d0f0b",
      surface: "rgba(18, 22, 16, 0.84)",
      surfaceSolid: "#161a14",
      accent: "#C9A96E",
      accentBright: "#E0C98A",
      accentHover: "#B8943E",
      accentMuted: "rgba(201, 169, 110, 0.10)",
      border: "rgba(201, 169, 110, 0.06)",
      text: "#ede8df",
      textMuted: "rgba(237, 232, 223, 0.55)",
      overlayStart: "rgba(13, 15, 11, 0.58)",
      overlayEnd: "rgba(13, 15, 11, 0.50)",
    },
    background: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80",
    fonts: {
      heading: "'Playfair Display', serif",
      body: "'Lora', serif",
    },
    music: [
      { name: "Classical", genre: "classical", url: "https://streams.ilovemusic.de/iloveradio28.mp3", fallback: "https://stream.0nlineradio.com/classical" },
      { name: "Study Ambience", genre: "study", url: "https://streams.ilovemusic.de/iloveradio17.mp3", fallback: "https://stream.0nlineradio.com/ambient" },
      { name: "Americana", genre: "americana", url: "https://ice6.somafm.com/folkfwd-128-mp3", fallback: "https://streams.ilovemusic.de/iloveradio17.mp3" },
    ],
    ratings: {
      icon: "quill",
      labels: ["dull", "passable", "engrossing", "brilliant", "magnum opus"],
    },
  },

  neonpop: {
    id: "neonpop",
    name: "Main Character",
    emoji: "⚡",
    description: "Hot pink & good vibes",
    tagline: "snap · shelf · vibe",
    colors: {
      bg: "#0a0a14",
      surface: "rgba(16, 14, 28, 0.84)",
      surfaceSolid: "#12101e",
      accent: "#FF6B9D",
      accentBright: "#FF9EC0",
      accentHover: "#E84580",
      accentMuted: "rgba(255, 107, 157, 0.10)",
      border: "rgba(255, 107, 157, 0.06)",
      text: "#f0e8f4",
      textMuted: "rgba(240, 232, 244, 0.55)",
      overlayStart: "rgba(10, 10, 20, 0.55)",
      overlayEnd: "rgba(10, 10, 20, 0.48)",
    },
    background: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=80",
    fonts: {
      heading: "'Outfit', sans-serif",
      body: "'Inter', sans-serif",
    },
    music: [
      { name: "Pop Hits", genre: "pop", url: "https://streams.ilovemusic.de/iloveradio1.mp3", fallback: "https://stream.0nlineradio.com/pop" },
      { name: "Hip-Hop", genre: "hiphop", url: "https://streams.ilovemusic.de/iloveradio3.mp3", fallback: "https://stream.0nlineradio.com/hiphop" },
      { name: "EDM", genre: "edm", url: "https://streams.ilovemusic.de/iloveradio2.mp3", fallback: "https://stream.0nlineradio.com/dance" },
    ],
    ratings: {
      icon: "fire",
      labels: ["meh", "mid", "ate", "no sleep", "canon event"],
    },
  },

  country: {
    id: "country",
    name: "Country Cottage",
    emoji: "🤠",
    description: "Warm amber & country",
    tagline: "snap · shelf · unwind",
    colors: {
      bg: "#100d0a",
      surface: "rgba(24, 20, 14, 0.84)",
      surfaceSolid: "#1a1610",
      accent: "#D4A574",
      accentBright: "#E8C4A0",
      accentHover: "#C08A50",
      accentMuted: "rgba(212, 165, 116, 0.10)",
      border: "rgba(212, 165, 116, 0.06)",
      text: "#f0e8df",
      textMuted: "rgba(240, 232, 223, 0.55)",
      overlayStart: "rgba(16, 13, 10, 0.56)",
      overlayEnd: "rgba(16, 13, 10, 0.48)",
    },
    background: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80",
    fonts: {
      heading: "'Bitter', serif",
      body: "'Source Sans 3', sans-serif",
    },
    music: [
      { name: "Country", genre: "country", url: "https://streams.ilovemusic.de/iloveradio24.mp3", fallback: "https://stream.0nlineradio.com/country" },
      { name: "Bluegrass", genre: "bluegrass", url: "https://ice64.securenetsystems.net/WAMU_BLUEGRASS", fallback: "https://streams.ilovemusic.de/iloveradio24.mp3" },
      { name: "Acoustic", genre: "acoustic", url: "https://ice6.somafm.com/folkfwd-128-mp3", fallback: "https://stream.0nlineradio.com/folk" },
    ],
    ratings: {
      icon: "boot",
      labels: ["pass", "alright", "good read", "page-turner", "all-time fave"],
    },
  },

  coastal: {
    id: "coastal",
    name: "Coastal Chill",
    emoji: "🌊",
    description: "Ocean blue & indie vibes",
    tagline: "snap · shelf · drift",
    colors: {
      bg: "#0a0e12",
      surface: "rgba(14, 20, 28, 0.82)",
      surfaceSolid: "#101820",
      accent: "#64B5F6",
      accentBright: "#90CAF9",
      accentHover: "#42A5F5",
      accentMuted: "rgba(100, 181, 246, 0.10)",
      border: "rgba(100, 181, 246, 0.06)",
      text: "#e4eef6",
      textMuted: "rgba(228, 238, 246, 0.55)",
      overlayStart: "rgba(10, 14, 18, 0.52)",
      overlayEnd: "rgba(10, 14, 18, 0.44)",
    },
    background: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80",
    fonts: {
      heading: "'Quicksand', sans-serif",
      body: "'Nunito', sans-serif",
    },
    music: [
      { name: "Indie Chill", genre: "indie", url: "https://streams.ilovemusic.de/iloveradio16.mp3", fallback: "https://stream.0nlineradio.com/indie" },
      { name: "Surf Rock", genre: "surf", url: "https://ice6.somafm.com/suburbsofgoa-128-mp3", fallback: "https://streams.ilovemusic.de/iloveradio16.mp3" },
      { name: "Ocean Waves", genre: "ocean", url: "https://ice6.somafm.com/dronezone-128-mp3", fallback: "https://ice6.somafm.com/deepspaceone-128-mp3" },
    ],
    ratings: {
      icon: "wave",
      labels: ["meh", "okay", "good vibes", "hooked", "life-changing"],
    },
  },

  cottagecore: {
    id: "cottagecore",
    name: "Cottagecore",
    emoji: "🌸",
    description: "Soft rose & folk acoustic",
    tagline: "snap · shelf · bloom",
    colors: {
      bg: "#100c0e",
      surface: "rgba(24, 18, 20, 0.82)",
      surfaceSolid: "#1c1518",
      accent: "#F48FB1",
      accentBright: "#F8BBD0",
      accentHover: "#EC407A",
      accentMuted: "rgba(244, 143, 177, 0.10)",
      border: "rgba(244, 143, 177, 0.06)",
      text: "#f4e8ee",
      textMuted: "rgba(244, 232, 238, 0.55)",
      overlayStart: "rgba(16, 12, 14, 0.55)",
      overlayEnd: "rgba(16, 12, 14, 0.48)",
    },
    background: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80",
    fonts: {
      heading: "'Cormorant Garamond', serif",
      body: "'Nunito Sans', sans-serif",
    },
    music: [
      { name: "Folk", genre: "folk", url: "https://streams.ilovemusic.de/iloveradio17.mp3", fallback: "https://stream.0nlineradio.com/folk" },
      { name: "Acoustic", genre: "acoustic", url: "https://stream.0nlineradio.com/folk", fallback: "https://streams.ilovemusic.de/iloveradio17.mp3" },
      { name: "Nature Sounds", genre: "nature", url: "https://streams.ilovemusic.de/iloveradio20.mp3", fallback: "https://stream.0nlineradio.com/ambient" },
    ],
    ratings: {
      icon: "flower",
      labels: ["wilted", "budding", "blooming", "flourishing", "enchanting"],
    },
  },

  indieshop: {
    id: "indieshop",
    name: "Indie Bookshop",
    emoji: "🐘",
    description: "Bright & bookish, community vibes",
    tagline: "snap · shelf · linger",
    light: true, // signals this is a light theme
    colors: {
      bg: "#f7f4ef",
      surface: "rgba(255, 255, 255, 0.88)",
      surfaceSolid: "#ffffff",
      surfaceHover: "rgba(240, 235, 226, 0.92)",
      surfaceElevated: "rgba(245, 240, 232, 0.95)",
      accent: "#C28840",
      accentBright: "#A87230",
      accentHover: "#9E6E28",
      accentMuted: "rgba(194, 136, 64, 0.10)",
      accentGlow: "rgba(194, 136, 64, 0.15)",
      border: "rgba(120, 100, 70, 0.12)",
      borderLight: "rgba(120, 100, 70, 0.20)",
      text: "#1a1408",
      textSecondary: "#3d3428",
      textMuted: "rgba(26, 20, 8, 0.55)",
      overlayStart: "rgba(247, 244, 239, 0.65)",
      overlayEnd: "rgba(247, 244, 239, 0.55)",
      shadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
      shadowLg: "0 12px 48px rgba(0, 0, 0, 0.12)",
    },
    // Bright airy bookstore interior — white walls, wood shelves
    background: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80",
    fonts: {
      heading: "'Bitter', serif",
      body: "'Lora', serif",
    },
    buyUrl: "https://anunlikelystory.indiecommerce.com",
    buyLabel: "Shop Indie",
    music: [
      { name: "Indie Folk", genre: "folk", url: "https://ice6.somafm.com/folkfwd-128-mp3", fallback: "https://stream.0nlineradio.com/folk" },
      { name: "Coffee House", genre: "acoustic", url: "https://streams.ilovemusic.de/iloveradio17.mp3", fallback: "https://stream.0nlineradio.com/folk" },
      { name: "Jazz Trio", genre: "jazz", url: "https://streaming.radio.co/s774887f7b/listen", fallback: "https://stream.0nlineradio.com/jazz" },
    ],
    ratings: {
      icon: "bookmark",
      labels: ["shelf it", "decent find", "staff pick", "can't put down", "instant classic"],
    },
  },
};

export const THEME_LIST = Object.values(THEMES);

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try {
      return localStorage.getItem("dailygrind_theme") || "espresso";
    } catch {
      return "espresso";
    }
  });

  const theme = THEMES[themeId] || THEMES.espresso;

  useEffect(() => {
    try {
      localStorage.setItem("dailygrind_theme", themeId);
    } catch {}
  }, [themeId]);

  // Apply theme CSS custom properties to :root
  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;

    root.style.setProperty("--bg", c.bg);
    root.style.setProperty("--surface", c.surface);
    root.style.setProperty("--surface-solid", c.surfaceSolid);
    root.style.setProperty("--accent", c.accent);
    root.style.setProperty("--accent-bright", c.accentBright);
    root.style.setProperty("--accent-hover", c.accentHover);
    root.style.setProperty("--accent-muted", c.accentMuted);
    root.style.setProperty("--border", c.border);
    root.style.setProperty("--text", c.text);
    root.style.setProperty("--text-muted", c.textMuted);
    // On mobile, reduce overlay so the vibe background is more visible
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
      root.style.setProperty("--overlay-start", c.overlayStart.replace(/[\d.]+\)$/, m => {
        const v = parseFloat(m); return Math.max(0.15, v - 0.20).toFixed(2) + ")";
      }));
      root.style.setProperty("--overlay-end", c.overlayEnd.replace(/[\d.]+\)$/, m => {
        const v = parseFloat(m); return Math.max(0.10, v - 0.20).toFixed(2) + ")";
      }));
    } else {
      root.style.setProperty("--overlay-start", c.overlayStart);
      root.style.setProperty("--overlay-end", c.overlayEnd);
    }
    root.style.setProperty("--font-heading", theme.fonts.heading);
    root.style.setProperty("--font-body", theme.fonts.body);
    root.style.setProperty("--bg-image", `url('${theme.background}')`);

    // Extended vars for light themes (fall back to dark defaults when not set)
    if (c.surfaceHover) root.style.setProperty("--surface-hover", c.surfaceHover);
    else root.style.setProperty("--surface-hover", "rgba(30, 26, 36, 0.88)");
    if (c.surfaceElevated) root.style.setProperty("--surface-elevated", c.surfaceElevated);
    else root.style.setProperty("--surface-elevated", "rgba(36, 32, 42, 0.88)");
    if (c.textSecondary) root.style.setProperty("--text-secondary", c.textSecondary);
    else root.style.setProperty("--text-secondary", "#b0a8bc");
    if (c.borderLight) root.style.setProperty("--border-light", c.borderLight);
    else root.style.setProperty("--border-light", "rgba(179, 136, 255, 0.12)");
    if (c.accentGlow) root.style.setProperty("--accent-glow", c.accentGlow);
    else root.style.setProperty("--accent-glow", "rgba(179, 136, 255, 0.15)");
    if (c.shadow) root.style.setProperty("--shadow", c.shadow);
    else root.style.setProperty("--shadow", "0 4px 24px rgba(0, 0, 0, 0.3)");
    if (c.shadowLg) root.style.setProperty("--shadow-lg", c.shadowLg);
    else root.style.setProperty("--shadow-lg", "0 12px 48px rgba(0, 0, 0, 0.5)");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
