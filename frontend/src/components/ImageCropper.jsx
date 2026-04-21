import { useState, useRef, useCallback, useEffect } from "react";

/**
 * ImageCropper — lets the user draw a rectangle over a photo to select
 * just the book cover area, then crops and returns the result as a Blob.
 */
export default function ImageCropper({ imageSrc, onCrop, onCancel }) {
  const wrapperRef = useRef(null);
  const imgRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState(null);
  const [rect, setRect] = useState(null);
  const [imgSize, setImgSize] = useState(null);

  // Get pointer position relative to the image wrapper
  const getPos = useCallback((e) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return { x: 0, y: 0 };
    const bounds = wrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(clientX - bounds.left, bounds.width)),
      y: Math.max(0, Math.min(clientY - bounds.top, bounds.height)),
    };
  }, []);

  function handlePointerDown(e) {
    e.preventDefault();
    const pos = getPos(e);
    setStart(pos);
    setRect(null);
    setDragging(true);
  }

  const handlePointerMove = useCallback((e) => {
    if (!dragging || !start) return;
    e.preventDefault();
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const bounds = wrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const pos = {
      x: Math.max(0, Math.min(clientX - bounds.left, bounds.width)),
      y: Math.max(0, Math.min(clientY - bounds.top, bounds.height)),
    };
    setRect({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      w: Math.abs(pos.x - start.x),
      h: Math.abs(pos.y - start.y),
    });
  }, [dragging, start]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [dragging, handlePointerMove, handlePointerUp]);

  function onImgLoad() {
    const img = imgRef.current;
    if (img) {
      setImgSize({ w: img.clientWidth, h: img.clientHeight });
    }
  }

  function doCrop() {
    if (!rect || rect.w < 20 || rect.h < 20) return;
    const img = imgRef.current;
    if (!img) return;

    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(rect.w * scaleX);
    canvas.height = Math.round(rect.h * scaleY);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      img,
      Math.round(rect.x * scaleX),
      Math.round(rect.y * scaleY),
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (blob) onCrop(blob);
    }, "image/jpeg", 0.92);
  }

  function scanFull() {
    fetch(imageSrc)
      .then((r) => r.blob())
      .then((blob) => onCrop(blob));
  }

  const hasSelection = rect && rect.w > 20 && rect.h > 20;

  return (
    <div className="cropper-overlay">
      <div className="cropper-header">
        <p className="cropper-instructions">
          Drag a box around the book cover to crop, or scan the full image
        </p>
      </div>

      <div className="cropper-stage">
        {/* This wrapper sizes itself exactly to the rendered image */}
        <div
          className="cropper-wrapper"
          ref={wrapperRef}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          style={imgSize ? { width: imgSize.w, height: imgSize.h } : undefined}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            className="cropper-image"
            draggable={false}
            onLoad={onImgLoad}
          />

          {/* Dark overlay with cutout */}
          {hasSelection && (
            <svg className="crop-mask">
              <defs>
                <mask id="crop-hole">
                  <rect width="100%" height="100%" fill="white" />
                  <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#crop-hole)" />
            </svg>
          )}

          {/* Selection border + handles */}
          {hasSelection && (
            <div className="crop-selection" style={{
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
            }}>
              <div className="crop-handle tl" />
              <div className="crop-handle tr" />
              <div className="crop-handle bl" />
              <div className="crop-handle br" />
            </div>
          )}
        </div>
      </div>

      <div className="cropper-actions">
        {hasSelection ? (
          <button className="btn btn-primary" onClick={doCrop}>
            Scan Selected Area
          </button>
        ) : (
          <button className="btn btn-primary" onClick={scanFull}>
            Scan Full Image
          </button>
        )}
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        {hasSelection && (
          <button className="btn btn-ghost" onClick={() => setRect(null)}>
            Clear Selection
          </button>
        )}
      </div>
    </div>
  );
}
