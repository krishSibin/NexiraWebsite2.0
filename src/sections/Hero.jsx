import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BtnPrimary, BtnGhost } from '../components/Shared.jsx';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   STAR FIELD — crisp dot stars with scroll zoom
   ============================================================ */
function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    let W, H, dpr, raf;
    const progress = { v: 0 };

    /* 500 stars: mostly tiny faint dots, a few brighter ones */
    const STARS = Array.from({ length: 500 }, () => {
      const r = Math.random();
      return {
        x: Math.random(),
        y: Math.random(),
        z: Math.pow(Math.random(), 1.5),          // bias toward far
        r: r < 0.65 ? 0.2 + Math.random() * 0.3  // 65% tiny  0.2-0.5
          : r < 0.92 ? 0.5 + Math.random() * 0.4  // 27% small 0.5-0.9
            : 0.9 + Math.random() * 0.5, // 8%  bright 0.9-1.4
        o: r < 0.65 ? 0.12 + Math.random() * 0.3
          : r < 0.92 ? 0.35 + Math.random() * 0.35
            : 0.65 + Math.random() * 0.35,
        t: Math.random() * Math.PI * 2,
        ts: 0.08 + Math.random() * 0.18,
      };
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const st = ScrollTrigger.create({
      trigger: '.hero-wrap',
      start: 'top top',
      end: '+=300%',
      onUpdate: (self) => { progress.v = self.progress; },
      onRefresh: (self) => { progress.v = self.progress; },
    });

    let isVisible = true;
    const obs = new IntersectionObserver(([e]) => { isVisible = e.isIntersecting; }, { threshold: 0 });
    obs.observe(canvas);

    const render = () => {
      if (isVisible) {
        const zoom = progress.v * 2.5;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.setTransform(dpr, 0, 0, dpr, 0, 0);

        for (const s of STARS) {
          s.t += s.ts * 0.006;
          const twinkle = 0.88 + 0.12 * Math.sin(s.t);

          const ox = (s.x - 0.5) * W;
          const oy = (s.y - 0.5) * H;
          const factor = 1 + s.z * zoom;
          const px = W / 2 + ox * factor;
          const py = H / 2 + oy * factor;

          if (px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;

          const flyFade = Math.max(0, 1 - Math.max(0, s.z * zoom - 1.4));
          const alpha = s.o * twinkle * flyFade;
          if (alpha < 0.02) continue;

          c.beginPath();
          c.arc(px, py, Math.max(0.2, s.r), 0, Math.PI * 2);
          c.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
          c.fill();
        }
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener('resize', resize);
      st.kill();
    };
  }, []);

  return <canvas ref={canvasRef} className="hs-starfield" />;
}

/* ============================================================
   HERO v2 — Satellite + Earth pinned scroll
   ============================================================ */
const SLIDES = [
  {
    lines: [
      ['From orbit', ''],
      [<><span className="hl-fill">TO </span><span className="hl-earth">GROUND.</span></>, 'hl-accent'],
    ],
  },
  {
    lines: [
      ['Geospatial', ''],
      ['intelligence', ''],
      [<><span className="hl-fill">AT </span><span className="hl-scale">SCALE.</span></>, 'hl-accent'],
    ],
  },
  {
    lines: [
      ['NEXIRA_VIDEO', 'hl-accent'],
      ['Spatial', ''],
    ],
    cta: true,
  },
];

const NexiraVideoMask = ({ src }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let running = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      // Guard: only draw when video has valid decoded frames
      if (!w || !h || video.readyState < 2 || video.paused || !video.videoWidth || !video.videoHeight) return;

      ctx.clearRect(0, 0, w, h);

      // == Fix for iOS Safari Canvas Bug ==
      // Draw the video FIRST (source-over)
      const vR = video.videoWidth / video.videoHeight;
      const cR = w / h;
      let dx = 0, dy = 0, dw = w, dh = h;
      if (vR > cR) { dw = h * vR; dx = (w - dw) / 2; }
      else { dh = w / vR; dy = (h - dh) / 2; }

      ctx.globalCompositeOperation = 'source-over';
      try { ctx.drawImage(video, dx, dy, dw, dh); } catch (_) { }

      // Then use destination-in to clip the video to the text.
      // This works reliably on iOS Safari GPU, whereas source-in often fails and draws rectangles.
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = '#fff';

      // Size font to fill the canvas height, then auto-shrink to fit width
      let fontSize = h * 0.88;
      ctx.font = `900 ${fontSize}px "Big Shoulders Display"`;
      const m = ctx.measureText('NEXIRA');
      if (m.width > w * 0.92) {
        fontSize *= (w * 0.92) / m.width;
        ctx.font = `900 ${fontSize}px "Big Shoulders Display"`;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NEXIRA', w / 2, h / 2);

      // Reset
      ctx.globalCompositeOperation = 'source-over';
    };

    const loop = () => {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onPlay = async () => {
      await document.fonts.load(`900 100px "Big Shoulders Display"`).catch(() => { });
      resize();
      running = true;
      // Wait until video has actual frame data before showing canvas
      const waitForFrame = () => {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          setCanvasReady(true); // hide CSS text, show canvas
          loop();
        } else {
          setTimeout(waitForFrame, 80);
        }
      };
      waitForFrame();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    video.addEventListener('play', onPlay);
    video.play().catch(() => { });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      video.removeEventListener('play', onPlay);
    };
  }, [src]);

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        autoPlay
        playsInline
        preload="auto"
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />

      {/* ── CSS gradient NEXIRA — always shown, works on every browser/device ── */}
      <div
        className="hl-nexira-css"
        style={{ opacity: canvasReady ? 0 : 1, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        NEXIRA
      </div>

      {/* ── Canvas video mask — fades in only when desktop video is confirmed playing ── */}
      <canvas
        ref={canvasRef}
        className="hl-nexira-video-canvas"
        style={{ opacity: canvasReady ? 1 : 0, position: 'absolute', inset: 0 }}
      />
    </>
  );
};

function Hero() {
  const wrapRef = useRef(null);
  const heroRef = useRef(null);
  const satRef = useRef(null);
  const earthRef = useRef(null);
  const cardRef = useRef(null);
  const slideRefs = useRef([]);

  useEffect(() => {
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top top',
          end: '+=300%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      /* ── initial slide states (tl.set at t=0 so scrub resets correctly) ── */
      tl.set(slideRefs.current[1], { opacity: 0, y: 36 }, 0);
      tl.set(slideRefs.current[2], { opacity: 0, y: 36 }, 0);

      /* ── images phase 1 (t=0→1.8): gentle drift, stay on screen ── */
      tl.fromTo(satRef.current,
        { x: 0, y: 0 },
        { x: -6 * vw, y: -5 * vh, ease: 'none', duration: 1.8 }, 0);
      tl.fromTo(earthRef.current,
        { x: 0, y: 0 },
        { x: 6 * vw, y: 5 * vh, ease: 'none', duration: 1.8 }, 0);

      /* ── images phase 2 (t=1.8→3): shrink into corners + fade ── */
      gsap.set(satRef.current, { transformOrigin: 'left top' });
      gsap.set(earthRef.current, { transformOrigin: 'right bottom' });
      tl.fromTo(satRef.current,
        { x: -6 * vw, y: -5 * vh, scale: 1, opacity: 1 },
        { x: -6 * vw, y: -5 * vh, scale: 0, opacity: 0, ease: 'power1.inOut', duration: 1.2 }, 1.8);
      tl.fromTo(earthRef.current,
        { x: 6 * vw, y: 5 * vh, scale: 1, opacity: 1 },
        { x: 6 * vw, y: 5 * vh, scale: 0, opacity: 0, ease: 'power1.inOut', duration: 1.2 }, 1.8);

      /* ── hero contracts to floating card on slide 3 (t=2.2→3) ── */
      tl.fromTo(heroRef.current,
        { borderRadius: '0px', scale: 1 },
        { borderRadius: '20px', scale: 0.88, ease: 'power2.inOut', duration: 0.8 }, 2.2);

      /* ── product card: rises from below on slide 3 (t=2.2→3) ── */
      tl.set(cardRef.current, { y: 220, opacity: 0, rotateX: 10 }, 0);
      tl.fromTo(cardRef.current,
        { y: 220, opacity: 0, rotateX: 10, transformPerspective: 900 },
        { y: 0, opacity: 1, rotateX: 0, ease: 'power3.out', duration: 0.7 }, 2.3);

      /* ── text: transitions centered exactly at t=1 and t=2 ── */
      tl.fromTo(slideRefs.current[0],
        { opacity: 1, y: 0 }, { opacity: 0, y: -32, duration: 0.25, ease: 'power2.in' }, 0.75);
      tl.fromTo(slideRefs.current[1],
        { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 1.00);

      tl.fromTo(slideRefs.current[1],
        { opacity: 1, y: 0 }, { opacity: 0, y: -32, duration: 0.25, ease: 'power2.in' }, 1.75);
      tl.fromTo(slideRefs.current[2],
        { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 2.00);

    }, wrapRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="hero-wrap" ref={wrapRef}>
      <header id="top" className="hero hero-v2" ref={heroRef} data-screen-label="01 Hero">

        {/* space-theme background glow */}
        <div className="hs-bg-glow" />

        {/* star field zoom */}
        <StarField />

        {/* satellite — top-left */}
        <img ref={satRef} src="/Satellite.png" alt="" className="hs-sat" draggable="false" />

        {/* earth — bottom-right */}
        <img ref={earthRef} src="/earth.png" alt="" className="hs-earth" draggable="false" />

        {/* radial vignette to keep center readable */}
        <div className="hs-vignette" />

        {/* center text slides */}
        <div className="hs-center">
          {SLIDES.map((s, i) => (
            <div key={i} ref={el => { slideRefs.current[i] = el; }} className="hs-slide">
              <h1 className="hs-headline">
                {s.lines.map(([text, cls], j) => (
                  text === 'NEXIRA_VIDEO' ? (
                    <div key={j} className="hl-nexira-video-canvas-container">
                      <NexiraVideoMask src="/nexira-video.mp4" />
                    </div>
                  ) : (
                    <span key={j} className={cls || undefined}>{text}</span>
                  )
                ))}
              </h1>
              {s.cta && (
                <div className="hs-cta-row">
                  <BtnPrimary href="#contact">Get Started</BtnPrimary>
                  <BtnGhost href="#cases">View Our Work</BtnGhost>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* product preview card — slides up on slide 3 */}
        <div ref={cardRef} className="hs-card">
          <div className="hsc-bar">
            <div className="hsc-live"><i className="hsc-dot" />LIVE</div>
            <span className="hsc-coords">23.4512° N &nbsp; 78.2341° E</span>
            <span className="hsc-meta">ALT 847m · ORBIT 412km · 12 SAT</span>
          </div>
          <div className="hsc-body">
            <div className="hsc-map">
              <div className="hsc-scan" />
              <div className="hsc-crosshair" />
              <div className="hsc-ring" />
              <span className="hsc-coord-tl">N 23°</span>
              <span className="hsc-coord-br">E 78°</span>
            </div>
            <div className="hsc-metrics">
              <div className="hsc-metric">
                <span>COVERAGE</span><strong>94.2%</strong>
              </div>
              <div className="hsc-metric">
                <span>RESOLUTION</span><strong>30cm</strong>
              </div>
              <div className="hsc-metric">
                <span>SATELLITES</span><strong>12 active</strong>
              </div>
              <div className="hsc-metric accent">
                <span>LAST SYNC</span><strong>2s ago</strong>
              </div>
            </div>
          </div>
        </div>

      </header>
    </div>
  );
}

/* ============================================================
   ABOUT — GSAP scrub word-by-word reveal
   ============================================================ */
function TerrainAboutBg() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, dpr, t = 0, raf;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let isVisible = true;
    const obs = new IntersectionObserver(([e]) => { isVisible = e.isIntersecting; }, { threshold: 0 });
    obs.observe(canvas);

    const render = () => {
      if (isVisible) {
        t += 0.0018;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const numC = 20, steps = 180;
        for (let i = 0; i < numC; i++) {
          const baseY = (i / (numC - 1)) * H;
          const cf = 1 - Math.abs((i / (numC - 1)) - 0.5) * 1.6;
          const alpha = Math.max(0, 0.05 + 0.04 * cf + 0.02 * Math.sin(i * 0.55 + t * 1.3));
          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const x = (s / steps) * W;
            const nx = x / W;
            const y = baseY
              + 22 * Math.sin(nx * 5.8 + t * 0.65 + i * 0.38)
              + 11 * Math.sin(nx * 14.2 - t * 0.42 + i * 0.82)
              + 32 * Math.sin(nx * 2.9 + t * 0.21 + i * 1.15)
              + 7 * Math.sin(nx * 28 + t * 1.1 + i * 0.25);
            s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(46,232,180,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
        const sx = ((t * 28) % (W + 80)) - 40;
        const sg = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0);
        sg.addColorStop(0, 'transparent');
        sg.addColorStop(0.5, 'rgba(46,232,180,0.025)');
        sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg; ctx.fillRect(sx - 30, 0, 60, H);
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(raf); obs.disconnect(); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} className="about-canvas" />;
}

function About() {
  const trackRef = useRef(null);
  const wordsWrapRef = useRef(null);
  const progressRef = useRef(null);

  const sentence = "We\'re a geospatial intelligence startup delivering custom GIS solutions, location analytics, and spatial data services — making location data work smarter for you.";
  const words = sentence.split(/\s+/);
  const accentSet = new Set(['smarter', 'intelligence', 'GIS', 'analytics']);

  /* scroll-scrubbed word-by-word opacity reveal */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const wordEls = wordsWrapRef.current?.querySelectorAll('.word');
      if (!wordEls?.length) return;

      /* build timeline: each word fades in as you scroll */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: trackRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
        },
      });

      wordEls.forEach((el, i) => {
        const targetColor = accentSet.has(words[i]) ? 'var(--accent)' : 'var(--text)';
        tl.to(el, { opacity: 1, color: targetColor, duration: 0.7, ease: 'power2.inOut' }, i * 0.14);
      });

      /* progress bar */
      if (progressRef.current) {
        gsap.to(progressRef.current, {
          scaleX: 1,
          ease: 'none',
          transformOrigin: 'left',
          scrollTrigger: {
            trigger: trackRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3,
          },
        });
      }
    }, trackRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about" id="about" data-screen-label="02 About">
      <div className="about-track" ref={trackRef}>
        <div className="about-sticky">
          <TerrainAboutBg />
          <div className="about-overlay" />
          <div className="about-content">
            <div className="eyebrow">A — Mission</div>
            <h2 className="about-words" ref={wordsWrapRef}>
              {words.map((w, i) => (
                <span key={i} className={`word${accentSet.has(w) ? ' accent' : ''}`}>
                  {w}{' '}
                </span>
              ))}
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

export { Hero, About };
