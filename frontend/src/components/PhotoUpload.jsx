import { useState, useRef } from "react";
import ImageCropper from "./ImageCropper";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function PhotoUpload({ onScanComplete, isScanning, setIsScanning }) {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchMode, setSearchMode] = useState("title"); // "title", "author", "both"
  const [isSearching, setIsSearching] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const fileRef = useRef(null);

  // Step 1: User picks an image → show the cropper
  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    setShowCropper(true);
  }

  // Step 2: User crops (or scans full) → send to backend
  async function handleCroppedImage(blob) {
    setShowCropper(false);
    setIsScanning(true);

    const form = new FormData();
    form.append("file", blob, "cropped.jpg");

    try {
      const res = await fetch(API_URL + "/scan", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const detail = err.detail || "";
        if (res.status === 422) {
          setError("Couldn't read the title from this photo. Try cropping tighter around the cover, or type the title below.");
        } else {
          setError(detail || "Scan failed. Try typing the book title below instead.");
        }
        return;
      }
      const data = await res.json();
      console.log("SCAN RESPONSE:", JSON.stringify(data.matches?.[0], null, 2));

      if (data.matches.length === 0) {
        setError("No matches found. Try cropping tighter or typing the book title below.");
      } else {
        onScanComplete(data);
      }
    } catch (e) {
      setError("Something went wrong. Try typing the book title below instead.");
    } finally {
      setIsScanning(false);
    }
  }

  function handleCropCancel() {
    setShowCropper(false);
    setPreview(null);
  }

  async function handleTextSearch(e) {
    e.preventDefault();
    if (!searchText.trim()) return;

    setError(null);
    setIsSearching(true);

    try {
      const res = await fetch(API_URL + "/search?q=" + encodeURIComponent(searchText.trim()) + "&mode=" + searchMode);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Search failed");
      }
      const data = await res.json();
      if (data.matches.length === 0) {
        setError("No matches found. Try a different spelling or add the author name.");
      } else {
        onScanComplete(data);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSearching(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // Show the cropper when an image is selected
  if (showCropper && preview) {
    return (
      <div className="upload-section">
        <ImageCropper
          imageSrc={preview}
          onCrop={handleCroppedImage}
          onCancel={handleCropCancel}
        />
        {error && <p className="error-msg">{error}</p>}
      </div>
    );
  }

  return (
    <div className="upload-section">
      {/* Photo upload */}
      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""} ${preview && !showCropper ? "has-preview" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        {preview && !showCropper ? (
          <img src={preview} alt="Book cover preview" className="preview-img" />
        ) : (
          <div className="drop-prompt">
            <span className="drop-icon">📷</span>
            <p><strong>Drop a book cover photo here</strong></p>
            <p className="hint">or click to browse — you can crop before scanning</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {isScanning && (
        <div className="scanning-indicator">
          <div className="spinner" />
          <span>Scanning cover...</span>
        </div>
      )}

      {/* Divider */}
      <div className="divider">
        <span>or search by title or author</span>
      </div>

      {/* Search mode toggle */}
      <div className="search-mode-toggle">
        {[
          { key: "title", label: "Title" },
          { key: "author", label: "Author" },
          { key: "both", label: "Both" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`search-mode-chip ${searchMode === key ? "active" : ""}`}
            onClick={() => setSearchMode(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Manual search bar */}
      <form className="search-bar" onSubmit={handleTextSearch}>
        <input
          type="text"
          placeholder={
            searchMode === "author"
              ? 'e.g. "Elin Hilderbrand"'
              : searchMode === "title"
              ? 'e.g. "The Bright Years"'
              : 'e.g. "Bright Years by Sarah Dame"'
          }
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
        <button
          type="submit"
          className="btn btn-primary search-btn"
          disabled={isSearching || !searchText.trim()}
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}
