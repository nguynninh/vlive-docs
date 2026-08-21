"use client";

import { useEffect, useRef, useState } from "react";
import { Mermaid } from "@theguild/remark-mermaid/mermaid";

function FlowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3v12a3 3 0 0 0 3 3h9" />
      <path d="M18 3l3 3-3 3" />
      <circle cx="6" cy="15" r="2" />
      <circle cx="6" cy="3" r="2" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function MermaidFrame({ chart, title }: { chart: string; title?: string }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const stageInnerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const posRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const heading = title || "Sơ đồ luồng";

  function applyTransform() {
    if (stageInnerRef.current) {
      const { x, y } = posRef.current;
      stageInnerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }
  }

  useEffect(applyTransform, [scale, fullscreen]);

  function openFullscreen() {
    const svg = bodyRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.removeAttribute("width");
    clone.removeAttribute("height");
    clone.removeAttribute("role");
    clone.removeAttribute("style");
    clone.style.width = "auto";
    clone.style.height = "80vh";
    clone.style.maxWidth = "none";
    clone.style.maxHeight = "none";
    clone.style.display = "block";
    setSvgMarkup(clone.outerHTML);
    posRef.current = { x: 0, y: 0 };
    setScale(1);
    setFullscreen(true);
  }

  function closeFullscreen() {
    setFullscreen(false);
  }

  function zoomBy(delta: number) {
    setScale((s) => Math.min(6, Math.max(0.3, s + delta)));
  }

  function resetView() {
    posRef.current = { x: 0, y: 0 };
    setScale(1);
    applyTransform();
  }

  useEffect(() => {
    if (!fullscreen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeFullscreen();
      if (e.key === "+" || e.key === "=") zoomBy(0.2);
      if (e.key === "-") zoomBy(-0.2);
      if (e.key === "0") resetView();
    }

    function onMouseMove(e: MouseEvent) {
      if (!draggingRef.current) return;
      posRef.current = {
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      };
      applyTransform();
    }

    function onMouseUp() {
      draggingRef.current = false;
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen]);

  function onOverlayWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoomBy(-e.deltaY * 0.0015);
  }

  function onOverlayMouseDown(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("[data-overlay-controls]")) return;
    if (target.hasAttribute("data-overlay-backdrop")) {
      closeFullscreen();
      return;
    }
    draggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
  }

  return (
    <div className="mermaid-frame">
      <div className="mermaid-frame-header">
        <div className="mermaid-frame-title">
          <FlowIcon />
          <span>{heading}</span>
        </div>
        <button type="button" className="mermaid-frame-fullscreen" onClick={openFullscreen}>
          <ExpandIcon />
          <span>Fullscreen</span>
        </button>
      </div>
      <div className="mermaid-frame-body" ref={bodyRef}>
        <Mermaid chart={chart} />
      </div>

      {fullscreen && svgMarkup && (
        <div
          className="mermaid-overlay"
          data-overlay-backdrop="true"
          role="dialog"
          aria-label={heading}
          onWheel={onOverlayWheel}
          onMouseDown={onOverlayMouseDown}
        >
          <div className="mermaid-overlay-topbar" data-overlay-controls="true">
            <div className="mermaid-overlay-title">
              <FlowIcon />
              <span>{heading}</span>
            </div>
            <div className="mermaid-overlay-controls">
              <button type="button" aria-label="Thu nhỏ" onClick={() => zoomBy(-0.2)}>
                <MinusIcon />
              </button>
              <div className="mermaid-overlay-percent">{Math.round(scale * 100)}%</div>
              <button type="button" aria-label="Phóng to" onClick={() => zoomBy(0.2)}>
                <PlusIcon />
              </button>
              <button type="button" aria-label="Đặt lại" onClick={resetView}>
                <ResetIcon />
              </button>
              <button type="button" aria-label="Đóng" onClick={closeFullscreen}>
                <CloseIcon />
              </button>
            </div>
          </div>
          <div className="mermaid-overlay-stage">
            <div
              ref={stageInnerRef}
              className="mermaid-overlay-stage-inner"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          </div>
          <div className="mermaid-overlay-hint">
            Kéo Di chuyển · +/- Zoom · 0 Đặt lại · Esc Đóng
          </div>
        </div>
      )}
    </div>
  );
}
