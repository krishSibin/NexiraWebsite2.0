import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';

/* ============================================================
   NEXIRA — Tweaks panel (React)
   ============================================================ */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "default",
  "theme": "dark",
  "hero": "split",
  "intensity": 1
}/*EDITMODE-END*/;

function useTweaks() {
  const [tweaks, setTweaks] = useState(() => ({ ...TWEAK_DEFAULTS }));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-palette", tweaks.palette);
    root.setAttribute("data-theme", tweaks.theme);
    root.style.setProperty("--anim-intensity", tweaks.intensity);
  }, [tweaks]);

  const set = useCallback((patch) => {
    setTweaks(t => {
      const next = { ...t, ...patch };
      try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits: patch }, "*"); } catch (e) { }
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const d = e.data || {};
      if (d.type === "__activate_edit_mode") setOpen(true);
      else if (d.type === "__deactivate_edit_mode") setOpen(false);
    };
    window.addEventListener("message", handler);
    try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) { }
    return () => window.removeEventListener("message", handler);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try { window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); } catch (e) { }
  }, []);

  const toggle = useCallback(() => setOpen(v => !v), []);

  return { tweaks, set, open, close, toggle };
}

/* ---- PillToggle: two-option pill selector ---- */
function PillToggle({ value, onChange, options }) {
  return (
    <div className="twk-pill">
      {options.map(o => (
        <button
          key={o.v}
          className={`twk-pill-btn${value === o.v ? ' on' : ''}`}
          onClick={() => onChange(o.v)}
        >
          {o.icon && <span className="twk-pill-icon">{o.icon}</span>}
          {o.l}
        </button>
      ))}
    </div>
  );
}

/* ---- PaletteGrid: 2×2 palette selector ---- */
function PaletteGrid({ value, onChange, options }) {
  return (
    <div className="twk-palette-grid">
      {options.map(o => (
        <button
          key={o.v}
          className={`twk-pal${value === o.v ? ' on' : ''}`}
          onClick={() => onChange(o.v)}
          title={o.title}
        >
          <span className="twk-pal-swatch" style={{ background: o.bg }} />
          <span className="twk-pal-name">{o.title}</span>
          {value === o.v && (
            <span className="twk-pal-check">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---- IntensitySlider: custom track ---- */
function IntensitySlider({ value, onChange }) {
  const trackRef = useRef(null);
  const pct = (value / 2) * 100;

  const handleTrackClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const raw = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onChange(parseFloat((raw * 2).toFixed(1)));
  };

  const labels = ['0.0', '0.5', '1.0', '1.5', '2.0'];

  return (
    <div className="twk-slider-wrap">
      <div className="twk-slider-track" ref={trackRef} onClick={handleTrackClick}>
        <div className="twk-slider-fill" style={{ width: `${pct}%` }} />
        <div
          className="twk-slider-thumb"
          style={{ left: `${pct}%` }}
        />
        <input
          className="twk-slider-input"
          type="range" min="0" max="2" step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="twk-slider-ticks">
        {labels.map(l => (
          <span key={l} className="twk-slider-tick">{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ---- Section label ---- */
function TwkLabel({ children }) {
  return <div className="twk-label">{children}</div>;
}

/* ---- Divider ---- */
function TwkDivider() {
  return <div className="twk-divider" />;
}

function TweaksPanel({ tweaks, set, open, close }) {
  return (
    <div className={`twk-panel${open ? ' show' : ''}`} role="dialog" aria-label="Design tweaks">
      {/* corner decoration */}
      <div className="twk-corner twk-corner-tl" />
      <div className="twk-corner twk-corner-tr" />

      {/* header */}
      <div className="twk-header">
        <div className="twk-header-left">
          <div className="twk-dot" />
          <span className="twk-title">TWEAKS</span>
        </div>
        <button className="twk-close" onClick={close} aria-label="Close panel">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <TwkDivider />

      {/* palette */}
      <div className="twk-section">
        <TwkLabel>Color Palette</TwkLabel>
        <PaletteGrid
          value={tweaks.palette}
          onChange={(v) => set({ palette: v })}
          options={[
            { v: "default", title: "Mint", bg: "linear-gradient(135deg,#2ee8b4,#4d7cff)" },
            { v: "cyber",   title: "Cyber",  bg: "linear-gradient(135deg,#00ffe0,#ff2ec4)" },
            { v: "solar",   title: "Solar",  bg: "linear-gradient(135deg,#ffd166,#c45cff)" },
            { v: "terra",   title: "Terra",  bg: "linear-gradient(135deg,#c8ff4b,#57e2c4)" },
          ]}
        />
      </div>

      <TwkDivider />

      {/* theme */}
      <div className="twk-section">
        <TwkLabel>Theme</TwkLabel>
        <PillToggle
          value={tweaks.theme}
          onChange={(v) => set({ theme: v })}
          options={[
            { v: "dark",  l: "Dark",  icon: "◐" },
            { v: "light", l: "Light", icon: "○" },
          ]}
        />
      </div>

      <TwkDivider />

      {/* hero variation */}
      <div className="twk-section">
        <TwkLabel>Hero Scene</TwkLabel>
        <PillToggle
          value={tweaks.hero}
          onChange={(v) => set({ hero: v })}
          options={[
            { v: "split", l: "Satellite", icon: "⬡" },
            { v: "globe", l: "Globe",     icon: "◎" },
          ]}
        />
      </div>

      <TwkDivider />

      {/* intensity */}
      <div className="twk-section">
        <div className="twk-section-row">
          <TwkLabel>Animation</TwkLabel>
          <span className="twk-val">{Number(tweaks.intensity).toFixed(1)}×</span>
        </div>
        <IntensitySlider
          value={tweaks.intensity}
          onChange={(v) => set({ intensity: v })}
        />
        <div className="twk-intensity-ends">
          <span>Subtle</span>
          <span>Dramatic</span>
        </div>
      </div>

      {/* footer tag */}
      <div className="twk-footer">
        <span>NX — DESIGN SYSTEM</span>
      </div>
    </div>
  );
}

/* ---- TweaksTrigger: floating button to open the panel ---- */
function TweaksTrigger({ onClick, open }) {
  return (
    <button
      className={`twk-trigger${open ? ' active' : ''}`}
      onClick={onClick}
      aria-label="Open design tweaks"
      title="Design tweaks"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

export { useTweaks, TweaksPanel, TweaksTrigger };
