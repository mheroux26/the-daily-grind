import { useState, useRef, useEffect } from "react";

// Channel emoji mapping by genre keyword
const GENRE_EMOJIS = {
  lofi: "🎧", jazz: "🎷", ambient: "🌙", classical: "🎻", study: "📚",
  baroque: "🎼", pop: "🎤", hiphop: "🎹", edm: "⚡", country: "🤠",
  bluegrass: "🪕", americana: "🏜️", indie: "🎸", surf: "🏄", ocean: "🌊",
  folk: "🌿", acoustic: "🪶", nature: "🌳",
};

export default function MusicPlayer({ theme }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  // Build channels from theme
  const channels = (theme?.music || []).map((m, i) => ({
    id: m.genre || `ch${i}`,
    label: m.name,
    emoji: GENRE_EMOJIS[m.genre] || "🎵",
    url: m.url,
    fallback: m.fallback,
  }));

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    audio.addEventListener("error", () => {
      const channel = channels.find((c) => c.url === audio.src);
      if (channel?.fallback && audio.src !== channel.fallback) {
        audio.src = channel.fallback;
        audio.play().catch(() => {});
      }
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // When theme changes, stop any playing audio and reset state
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setIsPlaying(false);
    setActiveChannel(null);
  }, [theme?.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  function selectChannel(channel) {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeChannel?.id === channel.id) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      audio.src = channel.url;
      audio.play().catch(() => {
        if (channel.fallback) {
          audio.src = channel.fallback;
          audio.play().catch(() => {});
        }
      });
      setActiveChannel(channel);
      setIsPlaying(true);
    }
  }

  function stopMusic() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setIsPlaying(false);
    setActiveChannel(null);
  }

  return (
    <div className="music-inline">
      <div className="music-inline-header">
        <span className="music-inline-title">
          {isPlaying && <span className="music-eq">♪</span>}
          Vibe Check
        </span>
        {activeChannel && isPlaying && (
          <button className="music-inline-stop" onClick={stopMusic} title="Stop">
            ■
          </button>
        )}
      </div>

      <div className="music-inline-channels">
        {channels.map((channel) => (
          <button
            key={channel.id}
            className={`music-inline-ch ${activeChannel?.id === channel.id ? "active" : ""} ${activeChannel?.id === channel.id && isPlaying ? "playing" : ""}`}
            onClick={() => selectChannel(channel)}
          >
            <span className="ch-emoji">{channel.emoji}</span>
            <span className="ch-label">{channel.label}</span>
            {activeChannel?.id === channel.id && isPlaying && (
              <span className="channel-bars">
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
              </span>
            )}
          </button>
        ))}
      </div>

      {activeChannel && (
        <div className="music-inline-vol">
          <input
            type="range"
            className="music-volume"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
          <span className="music-vol-icon">{volume === 0 ? "🔇" : volume < 0.4 ? "🔈" : "🔊"}</span>
        </div>
      )}
    </div>
  );
}
