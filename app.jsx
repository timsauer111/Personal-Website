// Personal Website Template — interactive layer
// Static HTML lives in index.html for easy direct-editing.
// This file owns: nav active-section highlight, smooth scroll, dark mode,
// CV modal, scroll-reveal, live clock, and the Tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C2562B",
  "fontPair": "instrument-geist",
  "density": "regular",
  "dark": false,
  "showStatus": true
}/*EDITMODE-END*/;

const FONT_PAIRS = {
  "instrument-geist": {
    display: '"Instrument Serif", Georgia, serif',
    sans:    '"Geist", ui-sans-serif, system-ui, sans-serif',
    mono:    '"Geist Mono", ui-monospace, Menlo, monospace',
    label:   "Instrument · Geist",
  },
  "newsreader-mono": {
    display: '"Newsreader", Georgia, serif',
    sans:    '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
    mono:    '"IBM Plex Mono", ui-monospace, Menlo, monospace',
    label:   "Newsreader · Plex",
  },
  "playfair-work": {
    display: '"Playfair Display", Georgia, serif',
    sans:    '"Work Sans", ui-sans-serif, system-ui, sans-serif',
    mono:    '"JetBrains Mono", ui-monospace, Menlo, monospace',
    label:   "Playfair · Work Sans",
  },
};

const ACCENTS = [
  "#C2562B",  // terracotta
  "#5C7A5F",  // sage
  "#4A5BA7",  // indigo
  "#1F1B16",  // ink (monochrome)
];

// ─────────────────────────── App ───────────────────────────

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [cvOpen, setCvOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("hero");
  const [now, setNow] = React.useState(() => formatClock(new Date()));

  // Apply theme + density to <html>
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = t.dark ? "dark" : "light";
    root.dataset.density = t.density;
  }, [t.dark, t.density]);

  // Apply accent + font tokens via CSS variables on :root
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", t.accent);
    // Pick legible text color over the accent
    root.style.setProperty("--accent-ink", contrastInk(t.accent));
    const pair = FONT_PAIRS[t.fontPair] || FONT_PAIRS["instrument-geist"];
    root.style.setProperty("--font-display", pair.display);
    root.style.setProperty("--font-sans", pair.sans);
    root.style.setProperty("--font-mono", pair.mono);
  }, [t.accent, t.fontPair]);

  // Live clock in hero meta
  React.useEffect(() => {
    const i = setInterval(() => setNow(formatClock(new Date())), 30000);
    return () => clearInterval(i);
  }, []);

  // Scroll-spy nav
  React.useEffect(() => {
    const ids = ["hero", "about", "work", "experience", "now", "contact"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Scroll-reveal
  React.useEffect(() => {
    const items = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // CV: download triggers a hidden link click
  const downloadCV = () => {
    const a = document.createElement("a");
    a.href = "cv.pdf";
    a.download = "CV.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Wire up the static buttons in index.html
  React.useEffect(() => {
    const openBtns = document.querySelectorAll('[data-action="open-cv"]');
    const dlBtns = document.querySelectorAll('[data-action="download-cv"]');
    const openHandler = (e) => { e.preventDefault(); setCvOpen(true); };
    const dlHandler = (e) => { e.preventDefault(); downloadCV(); };
    openBtns.forEach((b) => b.addEventListener("click", openHandler));
    dlBtns.forEach((b) => b.addEventListener("click", dlHandler));
    return () => {
      openBtns.forEach((b) => b.removeEventListener("click", openHandler));
      dlBtns.forEach((b) => b.removeEventListener("click", dlHandler));
    };
  }, []);

  // Sync nav active state into the static DOM
  React.useEffect(() => {
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const id = a.getAttribute("href")?.replace("#", "");
      a.classList.toggle("active", id === activeSection);
    });
  }, [activeSection]);

  // Sync clock into static DOM
  React.useEffect(() => {
    const el = document.getElementById("hero-clock");
    if (el) el.textContent = now;
  }, [now]);

  // Theme toggle button in nav
  React.useEffect(() => {
    const btn = document.querySelector(".nav-theme");
    if (!btn) return;
    const onClick = () => setTweak("dark", !t.dark);
    btn.addEventListener("click", onClick);
    btn.innerHTML = t.dark ? sunSvg() : moonSvg();
    return () => btn.removeEventListener("click", onClick);
  }, [t.dark, setTweak]);

  // Hide "available" dot if showStatus is false
  React.useEffect(() => {
    const dot = document.querySelector(".nav-mark .dot");
    if (dot) dot.style.display = t.showStatus ? "" : "none";
    const navStatus = document.getElementById("nav-status-text");
    if (navStatus) navStatus.textContent = t.showStatus ? "Available" : "Portfolio";
  }, [t.showStatus]);

  // Esc closes modal
  React.useEffect(() => {
    if (!cvOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setCvOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cvOpen]);

  return (
    <>
      {/* CV modal — rendered into a portal-like fixed overlay */}
      <div className={`cv-modal ${cvOpen ? "open" : ""}`}
           onClick={(e) => { if (e.target === e.currentTarget) setCvOpen(false); }}>
        <div className="cv-sheet" role="dialog" aria-modal="true" aria-label="Curriculum Vitae">
          <div className="cv-head">
            <span className="title">Curriculum Vitae — Your Name</span>
            <div className="actions">
              <button onClick={downloadCV} className="download">
                <DownloadIcon /> Download PDF
              </button>
              <button onClick={() => setCvOpen(false)} aria-label="Close">
                <CloseIcon />
              </button>
            </div>
          </div>
          <div className="cv-body">
            {cvOpen && <iframe src="cv.pdf#toolbar=0&navpanes=0" title="CV preview" />}
          </div>
        </div>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Color">
          <TweakColor label="Accent" value={t.accent} options={ACCENTS}
                      onChange={(v) => setTweak("accent", v)} />
          <TweakToggle label="Dark mode" value={t.dark}
                       onChange={(v) => setTweak("dark", v)} />
        </TweakSection>
        <TweakSection label="Typography">
          <TweakSelect label="Font pairing" value={t.fontPair}
                       options={Object.entries(FONT_PAIRS).map(([k, v]) => ({ value: k, label: v.label }))}
                       onChange={(v) => setTweak("fontPair", v)} />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Density" value={t.density}
                      options={["compact", "regular", "comfy"]}
                      onChange={(v) => setTweak("density", v)} />
          <TweakToggle label="Show 'Available'" value={t.showStatus}
                       onChange={(v) => setTweak("showStatus", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

// ─────────────────────────── helpers ───────────────────────────

function formatClock(d) {
  // Local time in a deliberately neutral format
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) + " local";
}

function contrastInk(hex) {
  const h = String(hex).replace("#", "");
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, "0");
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return "#FFFFFF";
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000 ? "#1F1B16" : "#FFFFFF";
}

// Inline icons
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v8m0 0L3.5 5.5M7 9l3.5-3.5M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function sunSvg() {
  return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="2.6" stroke="currentColor" stroke-width="1.3"/>
    <path d="M7 1.2v1.4M7 11.4v1.4M1.2 7h1.4M11.4 7h1.4M2.9 2.9l1 1M10.1 10.1l1 1M2.9 11.1l1-1M10.1 3.9l1-1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`;
}
function moonSvg() {
  return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M11.5 8.3A4.8 4.8 0 0 1 5.7 2.5a.5.5 0 0 0-.7-.6 5.5 5.5 0 1 0 7.1 7.1.5.5 0 0 0-.6-.7z" fill="currentColor"/>
  </svg>`;
}

// Mount
ReactDOM.createRoot(document.getElementById("app-root")).render(<App />);
