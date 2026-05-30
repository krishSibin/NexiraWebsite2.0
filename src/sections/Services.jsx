import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Reveal, CountUp } from '../hooks';
import { Eyebrow } from '../components/Shared.jsx';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   NEXIRA — Services / Stats / Process / Industries
   ============================================================ */

const SVC_GLYPHS = {
  gis: (
    <svg className="svc-glyph" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="26" stroke="var(--accent)" strokeWidth="1.5" />
      <path d="M6 32h52M32 6v52" stroke="var(--accent)" strokeWidth="1" opacity="0.45" />
      <path d="M16 22c6 4 12 4 18 0s12-4 18 0M16 42c6 4 12 4 18 0s12-4 18 0" stroke="var(--accent-2)" strokeWidth="1.2" />
      <circle cx="22" cy="18" r="2.5" fill="var(--accent)" />
      <circle cx="44" cy="46" r="2.5" fill="var(--accent-2)" />
    </svg>
  ),
  map: (
    <svg className="svc-glyph" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="10" width="48" height="44" rx="3" stroke="var(--accent)" strokeWidth="1.5" />
      <path d="M8 32h48M32 10v44" stroke="var(--accent)" strokeWidth="0.7" opacity="0.25" />
      <path d="M14 26c5-5 12-7 18-5s13 1 18-4" stroke="var(--accent)" strokeWidth="1.1" opacity="0.55" />
      <path d="M14 38c5 3 11 2 16-1s12-4 18-1" stroke="var(--accent)" strokeWidth="1.1" opacity="0.4" />
      <circle cx="32" cy="27" r="4.5" stroke="var(--accent-2)" strokeWidth="1.5" />
      <circle cx="32" cy="27" r="1.5" fill="var(--accent-2)" />
      <path d="M32 31.5v4" stroke="var(--accent-2)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  it: (
    <svg className="svc-glyph" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="14" width="48" height="32" rx="4" stroke="var(--accent)" strokeWidth="1.5" />
      <path d="M8 22h48" stroke="var(--accent)" strokeWidth="1" />
      <circle cx="14" cy="18" r="1.5" fill="var(--accent)" />
      <circle cx="20" cy="18" r="1.5" fill="var(--accent)" />
      <circle cx="26" cy="18" r="1.5" fill="var(--accent)" />
      <path d="M16 30l-4 4 4 4M28 30l4 4-4 4M22 28l-4 12" stroke="var(--accent-2)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M40 30h12M40 36h8M40 42h10" stroke="var(--accent)" strokeWidth="1.2" />
    </svg>
  ),
  model: (
    <svg className="svc-glyph" viewBox="0 0 64 64" fill="none">
      <path d="M12 52h40M12 12v40" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 42 L22 28 L32 33 L44 17 L52 21" stroke="var(--accent-2)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 42 L22 28 L32 33 L44 17 L52 21 L52 52 L12 52Z" fill="rgba(46,232,180,0.07)" />
      <circle cx="22" cy="28" r="2.5" fill="var(--accent-2)" />
      <circle cx="32" cy="33" r="2.5" fill="var(--accent-2)" />
      <circle cx="44" cy="17" r="2.5" fill="var(--accent)" />
      <path d="M44 20v8" stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
    </svg>
  ),
  ai: (
    <svg className="svc-glyph" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="6" fill="var(--accent)" />
      <g stroke="var(--accent)" strokeWidth="1.2" fill="none">
        <circle cx="14" cy="14" r="4" /><circle cx="50" cy="14" r="4" />
        <circle cx="14" cy="50" r="4" /><circle cx="50" cy="50" r="4" />
        <circle cx="32" cy="8" r="3" /><circle cx="32" cy="56" r="3" />
        <circle cx="8" cy="32" r="3" /><circle cx="56" cy="32" r="3" />
      </g>
      <g stroke="var(--accent-2)" strokeWidth="1" opacity="0.7">
        <line x1="32" y1="32" x2="14" y2="14" /><line x1="32" y1="32" x2="50" y2="14" />
        <line x1="32" y1="32" x2="14" y2="50" /><line x1="32" y1="32" x2="50" y2="50" />
        <line x1="32" y1="32" x2="32" y2="8" /><line x1="32" y1="32" x2="32" y2="56" />
        <line x1="32" y1="32" x2="8" y2="32" /><line x1="32" y1="32" x2="56" y2="32" />
      </g>
    </svg>
  ),
  intern: (
    <svg className="svc-glyph" viewBox="0 0 64 64" fill="none">
      <circle cx="22" cy="20" r="6.5" stroke="var(--accent)" strokeWidth="1.5" />
      <path d="M10 46c0-7 5-12 12-12s12 5 12 12" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="44" cy="20" r="6.5" stroke="var(--accent-2)" strokeWidth="1.5" />
      <path d="M32 46c0-7 5-12 12-12s12 5 12 12" stroke="var(--accent-2)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M29 20h6" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2" opacity="0.6" />
    </svg>
  ),
};

const SERVICES = [
  {
    key: 'gis', num: '01', title: 'Web GIS & Mapping',
    desc: 'Custom interactive map applications built on modern web stacks — bespoke GIS front-ends, web mapping platforms, and spatial data visualisation tools.',
    items: ['Custom Web GIS applications', 'Interactive map platforms', 'Spatial data visualisation', 'Map APIs & integrations', 'Bespoke GIS front-ends'],
    img: '/svc-1.jpeg',
  },
  {
    key: 'map', num: '02', title: 'Geospatial Cartography',
    desc: 'High-quality cartographic design and tile generation — transforming raw geodata into publication-ready maps for web, print, and multi-scale series.',
    items: ['High-quality cartographic design', 'Map tile generation', 'Print-ready map production', 'Multi-scale map series', 'Thematic & topographic maps'],
    img: '/svc-2.jpeg',
  },
  {
    key: 'it', num: '03', title: 'Remote Sensing & Imagery',
    desc: 'Satellite and aerial imagery processing with cutting-edge classification pipelines — turning raw sensor data into actionable insights and change detection reports.',
    items: ['Satellite & aerial imagery', 'Classification & change detection', 'NDVI & spectral analysis', 'Image preprocessing pipelines', 'Land use & land cover mapping'],
    img: '/svc-3.jpeg',
  },
  {
    key: 'model', num: '04', title: 'Modelling & Analytics',
    desc: 'Spatial analytics, suitability modelling, and predictive geospatial workflows — converting raw location data into strategic decisions grounded in real-world evidence.',
    items: ['Spatial analytics & statistics', 'Suitability & site modelling', 'Predictive geospatial workflows', 'Network & proximity analysis', 'Geodatabase management'],
    img: '/svc-4.jpeg',
  },
  {
    key: 'ai', num: '05', title: 'Training & Capacity Building',
    desc: 'Structured GIS training programmes and workshops designed for teams, institutions, and government bodies — elevating geospatial competency at every level.',
    items: ['GIS software training', 'Custom workshop design', 'Institutional capacity building', 'Online & on-site delivery', 'Assessment & certification support'],
    img: '/svc-5.jpeg',
  },
  {
    key: 'intern', num: '06', title: 'Internships & Mentorship',
    desc: 'Hands-on internship placements for students and early-career professionals — real-world project exposure with structured mentorship from our senior GIS team.',
    items: ['Structured internship programs', 'Real-world project exposure', 'One-on-one mentorship', 'Portfolio development', 'Career pathway guidance'],
    img: '/svc-6.jpeg',
  },
];

function ServiceCard({ s }) {
  return (
    <article className={`svc svc-${s.key}`}>
      <img src={s.img} alt={s.title} loading="lazy" className="svc-bg" />
      <div className="svc-overlay">
        <span className="svc-num-badge">0{s.num}</span>
        <div className="svc-info">
          {SVC_GLYPHS[s.key]}
          <h3 className="svc-title">{s.title}</h3>
        </div>
      </div>
    </article>
  );
}

function Services() {
  const sectionRef = useRef(null);
  const marqueeRef = useRef(null);

  useEffect(() => {
    // Marquee is now handled by CSS animation for better performance
  }, []);



  return (
    <section className="services" id="services" data-screen-label="03 Services" ref={sectionRef}>
      <div className="wrap">
        <div className="section-head">
          <Reveal><Eyebrow>B — Practice areas</Eyebrow></Reveal>
          <Reveal delay={120}>
            <h2 className="display h2">
              Six&nbsp;specialisations.<br />
              One&nbsp;<span style={{ color: 'var(--accent)' }}>spatial system</span>.
            </h2>
          </Reveal>
        </div>
      </div>
      <div className="svc-track">
        <div className="svc-marquee" ref={marqueeRef}>
          {SERVICES.map((s) => <ServiceCard key={s.key} s={s} />)}
          {/* duplicate for seamless loop */}
          {SERVICES.map((s) => <ServiceCard key={`${s.key}-2`} s={s} />)}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   STATS — premium cards with GSAP stagger
   ============================================================ */
function Stats() {
  const sectionRef = useRef(null);

  const items = [
    { v: 50, suffix: '+', lbl: 'Projects delivered', ctx: 'Across government, business & community', decimals: 0 },
    { v: 6, suffix: '', lbl: 'Core services', ctx: 'GIS · Mapping · Remote Sensing · AI', decimals: 0 },
    { v: 100, suffix: '+', lbl: 'Datasets processed', ctx: 'Satellite · aerial · sensor feeds', decimals: 0 },
    { v: 100, suffix: '%', lbl: 'Client focus', ctx: 'Tailored solutions for every workflow', decimals: 0 },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stat-card', {
        y: 40, opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 76%',
          once: true,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="stats" ref={sectionRef} data-screen-label="04 Stats">
      <div className="wrap">
        <div className="stats-intro">
          <Reveal><Eyebrow>— Impact</Eyebrow></Reveal>
          <Reveal delay={100}>
            <h2 className="display h3">
              Ground truth{' '}
              <span style={{ color: 'var(--accent)' }}>in numbers</span>.
            </h2>
          </Reveal>
        </div>
        <div className="stats-grid">
          {items.map((it, i) => (
            <div key={i} className="stat-card">
              <div className="lbl">{it.lbl}</div>
              <div className="num">
                <CountUp to={it.v} decimals={it.decimals} />
                {it.suffix && <span className="suf">{it.suffix}</span>}
              </div>
              <p className="ctx">{it.ctx}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PROCESS — tall scroll, SVG draws across full height, steps as natural panels
   ============================================================ */
function Process() {
  const trackRef = useRef(null);
  const pathRef = useRef(null);
  const slideRefs = useRef([]);
  /* single atomic state — prevents viewBox/path desync between renders */
  const [svg, setSvg] = useState({ w: 1000, h: 1600, pathD: '', wLens: [] });
  const [len, setLen] = useState(0);

  const steps = [
    { n: '01', h: 'Discover', p: 'We sit with stakeholders to understand your location challenges and frame the spatial questions that matter most.', coord: '10.02°N · 76.31°E' },
    { n: '02', h: 'Capture', p: 'Satellite, aerial and sensor data — collected, georeferenced and quality-controlled to build a clean spatial data foundation.', coord: '12.97°N · 77.59°E' },
    { n: '03', h: 'Model', p: 'Spatial analytics and suitability modelling transform raw data into actionable insight — forecasts, risk surfaces and decision maps.', coord: '19.07°N · 72.88°E' },
    { n: '04', h: 'Deliver', p: 'Custom Web GIS apps, interactive dashboards and reports — built into the daily workflow of your teams and decision-makers.', coord: '22.57°N · 88.36°E' },
  ];

  /* Build path from actual DOM positions so it hits each slide center */
  const buildPath = () => {
    if (!trackRef.current) return;
    const W = trackRef.current.offsetWidth;
    const H = trackRef.current.offsetHeight;
    if (!W || !H) return;

    const waypoints = slideRefs.current
      .filter(Boolean)
      .map(el => el.offsetTop + el.offsetHeight / 2);
    if (!waypoints.length) return;

    const cx = W / 2;
    const amp = Math.min(W * 0.13, 160); // gentle swing capped at 160px
    const topY = 60;
    const botY = H - 60;

    /* xs alternate left/right per step index */
    const xs = waypoints.map((_, i) => i % 2 === 0 ? cx - amp : cx + amp);

    let d = `M ${cx} ${topY}`;

    /* top-center → first peak */
    const yM0 = (topY + waypoints[0]) / 2;
    d += ` C ${cx} ${yM0}, ${xs[0]} ${yM0}, ${xs[0]} ${waypoints[0]}`;

    /* peak → peak — smooth S-curves via midpoint y control points */
    for (let i = 1; i < waypoints.length; i++) {
      const yM = (waypoints[i - 1] + waypoints[i]) / 2;
      d += ` C ${xs[i - 1]} ${yM}, ${xs[i]} ${yM}, ${xs[i]} ${waypoints[i]}`;
    }

    /* last peak → bottom center */
    const last = waypoints.length - 1;
    const yME = (waypoints[last] + botY) / 2;
    d += ` C ${xs[last]} ${yME}, ${cx} ${yME}, ${cx} ${botY}`;

    /* Measure path length at each waypoint via a temporary off-screen path */
    const tmpSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const tmpPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tmpSvg.style.cssText = 'position:fixed;opacity:0;pointer-events:none;top:0;left:0;width:1px;height:1px';
    tmpSvg.appendChild(tmpPath);
    document.body.appendChild(tmpSvg);

    const wLens = waypoints.map((_, i) => {
      let pd = `M ${cx} ${topY}`;
      const ym0 = (topY + waypoints[0]) / 2;
      pd += ` C ${cx} ${ym0}, ${xs[0]} ${ym0}, ${xs[0]} ${waypoints[0]}`;
      for (let j = 1; j <= i; j++) {
        const ym = (waypoints[j - 1] + waypoints[j]) / 2;
        pd += ` C ${xs[j - 1]} ${ym}, ${xs[j]} ${ym}, ${xs[j]} ${waypoints[j]}`;
      }
      tmpPath.setAttribute('d', pd);
      return tmpPath.getTotalLength();
    });

    document.body.removeChild(tmpSvg);

    setSvg({ w: W, h: H, pathD: d, wLens });
  };

  /* Measure once on mount + watch resize */
  useEffect(() => {
    const id = requestAnimationFrame(buildPath);
    const ro = new ResizeObserver(buildPath);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, []);

  /* Recalculate total length whenever path changes */
  useEffect(() => {
    if (pathRef.current && svg.pathD) setLen(pathRef.current.getTotalLength());
  }, [svg.pathD]);

  /* GSAP scroll draw — color-charge reveal when line hits each waypoint */
  useEffect(() => {
    if (!len || !svg.pathD || !svg.wLens.length) return;

    /* titles start white; connector/num/desc/coord hidden until first pass */
    slideRefs.current.forEach(el => {
      if (!el) return;
      gsap.set(el.querySelector('.proc-slide-title'), { color: '#ffffff' });
      gsap.set(el.querySelector('.proc-connector'), { scaleY: 0, transformOrigin: 'top center' });
      gsap.set(el.querySelector('.proc-slide-num'), { opacity: 0 });
      gsap.set(el.querySelector('.proc-slide-desc'), { opacity: 0, y: 16 });
      gsap.set(el.querySelector('.proc-slide-coord'), { opacity: 0 });
    });

    /* per-slide: isBlue tracks bidirectional color; shown is one-time */
    const state = svg.wLens.map(() => ({ isBlue: false, shown: false }));

    const ctx = gsap.context(() => {
      gsap.fromTo(pathRef.current,
        { strokeDashoffset: len },
        {
          strokeDashoffset: 0,
          ease: 'none',
          /* onUpdate fires every RAF frame — reads actual animated offset,
             so color trigger is pixel-perfect with the visual path tip */
          onUpdate() {
            const drawn = len - (gsap.getProperty(pathRef.current, 'strokeDashoffset') || 0);

            svg.wLens.forEach((wl, i) => {
              const el = slideRefs.current[i];
              if (!el) return;
              const title = el.querySelector('.proc-slide-title');
              const nowBlue = drawn >= wl;

              /* bidirectional title color */
              if (nowBlue !== state[i].isBlue) {
                state[i].isBlue = nowBlue;
                gsap.to(title, {
                  color: nowBlue ? '#5b8eff' : '#ffffff',
                  duration: 0.3, ease: 'power2.out', overwrite: 'auto',
                });
              }

              /* one-time reveal of supporting elements */
              if (nowBlue && !state[i].shown) {
                state[i].shown = true;
                const conn = el.querySelector('.proc-connector');
                const num = el.querySelector('.proc-slide-num');
                const desc = el.querySelector('.proc-slide-desc');
                const coord = el.querySelector('.proc-slide-coord');
                gsap.timeline()
                  .to(conn, { scaleY: 1, duration: 0.3, ease: 'power2.out' })
                  .to(num, { opacity: 1, duration: 0.25 }, '<')
                  .to(desc, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.15')
                  .to(coord, { opacity: 0.45, duration: 0.3 }, '-=0.2');
              }
            });
          },
          scrollTrigger: {
            trigger: trackRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            /* scrub: true = direct 1:1 on mobile (no lag), smooth on desktop */
            scrub: window.innerWidth <= 800 ? true : 0.6,
          },
        }
      );
    }, trackRef);
    return () => ctx.revert();
  }, [len, svg]);

  return (
    <section className="process" id="process" data-screen-label="05 Process">
      <div className="process-track" ref={trackRef}>

        {/* SVG: viewBox matches actual pixel dims → 1:1 coords, no distortion */}
        <svg
          className="process-path-svg"
          viewBox={`0 0 ${svg.w} ${svg.h}`}
          preserveAspectRatio="none"
          style={{ visibility: (!svg.pathD || !len) ? 'hidden' : 'visible' }}
        >
          <defs>
            <filter id="proc-glow" x="-60%" y="-10%" width="220%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="22" result="b3" />
              <feMerge>
                <feMergeNode in="b3" />
                <feMergeNode in="b2" />
                <feMergeNode in="b1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {svg.pathD && (
            <>
              {/* faint ghost track */}
              <path d={svg.pathD} stroke="rgba(77,124,255,0.10)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              {/* glowing animated path */}
              <path
                ref={pathRef}
                d={svg.pathD}
                stroke="#5b8eff"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={len || undefined}
                filter="url(#proc-glow)"
              />
            </>
          )}
        </svg>

        {/* Header */}
        <div className="process-head">
          <div className="wrap">
            <Reveal><Eyebrow>C — How we work</Eyebrow></Reveal>
            <Reveal delay={120}>
              <h2 className="display h2">
                From{' '}
                <span style={{ color: 'var(--accent)' }}>pixels</span>
                <br />to decisions.
              </h2>
            </Reveal>
          </div>
        </div>

        {/* Step panels — each 100vh, natural scroll */}
        <div className="process-steps">
          {steps.map((s, i) => (
            <div key={s.n} ref={el => slideRefs.current[i] = el} className="process-slide">
              <div className="proc-slide-inner">
                <div className="proc-connector" />
                <div className="proc-slide-num">{s.n} / 04</div>
                <h3 className="proc-slide-title">{s.h}</h3>
                <p className="proc-slide-desc">{s.p}</p>
                <div className="proc-slide-coord">{s.coord}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

/* ============================================================
   INDUSTRIES — image mask grid
   ============================================================ */
const INDUSTRIES = [
  { n: '01', h: 'Urban & Smart Cities', p: 'Digital twins, mobility, planning — the city as a live model.', img: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80', cls: 'ind-1', coords: '40.7128° N  74.0060° W', tag: 'D-TWIN' },
  { n: '02', h: 'Agriculture', p: 'Crop health, yield forecasting and precision input maps.', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&q=80', cls: 'ind-2', coords: '23.4512° N  78.2341° E', tag: 'NDVI' },
  { n: '03', h: 'Environment', p: 'Forests, water, biodiversity, climate adaptation.', img: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=900&q=80', cls: 'ind-3', coords: '51.5074° N  0.1278° W', tag: 'CLAS' },
  { n: '04', h: 'Utilities & Energy', p: 'Network inventory, vegetation risk, grid intelligence.', img: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=900&q=80', cls: 'ind-4', coords: '35.6762° N  139.6503° E', tag: 'VEGR' },
  { n: '05', h: 'Mining & Resources', p: 'Volumetrics, change detection, tenement compliance.', img: 'https://images.unsplash.com/photo-1494412519320-aa613df615a3?w=900&q=80', cls: 'ind-5', coords: '25.2744° S  133.7751° E', tag: 'VOL' },
  { n: '06', h: 'Defence & Security', p: 'Mission planning, terrain analysis, situational awareness.', img: 'https://images.unsplash.com/photo-1474900078985-faab2a3df5cc?w=900&q=80', cls: 'ind-6', coords: '55.7558° N  37.6173° E', tag: 'MSIV' },
];

function Industries() {
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const progRefs = useRef([]);
  const N = INDUSTRIES.length;

  useEffect(() => {
    const track = trackRef.current;
    const cards = cardRefs.current.filter(Boolean);
    if (!track || cards.length !== N) return;

    const ctx = gsap.context(() => {
      /* card 0 is visible from the start; cards 1–5 hidden */
      gsap.set(cards[0], { clipPath: 'inset(0% 0% 0% 0% round 16px)' });
      gsap.set(cards.slice(1), { clipPath: 'inset(100% 0% 0% 0% round 16px)' });

      /* mark first item active immediately */
      if (progRefs.current[0]) progRefs.current[0].classList.add('active');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2,
          onUpdate(self) {
            const idx = Math.min(N - 1, Math.round(self.progress * (N - 1)));
            progRefs.current.forEach((el, i) => {
              if (!el) return;
              el.classList.toggle('active', i === idx);
              el.classList.toggle('done', i < idx);
            });
          },
        },
      });

      /* 5 transitions: card 1 covers 0, card 2 covers 1, … */
      for (let i = 1; i < N; i++) {
        const t = i - 1;
        /* new card rises up */
        tl.to(cards[i],
          { clipPath: 'inset(0% 0% 0% 0% round 16px)', ease: 'power3.inOut', duration: 0.75 },
          t
        );
        tl.fromTo(cards[i].querySelector('.ind-img'),
          { scale: 1.1 },
          { scale: 1.0, ease: 'power2.out', duration: 0.75 },
          t
        );
        /* previous card recedes */
        tl.to(cards[i - 1],
          { scale: 0.91, yPercent: -2.5, ease: 'power2.inOut', duration: 0.75 },
          t
        );
      }
    }, trackRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="industries" id="industries" data-screen-label="06 Industries">
      <div ref={trackRef} className="ind-track">
        <div className="ind-pin">
          <div className="ind-head">
            <Reveal><Eyebrow>D — Industries</Eyebrow></Reveal>
            <Reveal delay={120}>
              <h2 className="display h2">Built for the<br />ground beneath you.</h2>
            </Reveal>
          </div>
          <div className="ind-stack">
            {INDUSTRIES.map((it, i) => (
              <div
                key={it.n}
                ref={el => { cardRefs.current[i] = el; }}
                className="ind-card"
                style={{ zIndex: i + 1 }}
              >
                <div className="ind-img" style={{ backgroundImage: `url('${it.img}')` }} />
                <div className="ind-overlay" />
                <span className="ind-n">{it.n}</span>
                <span className="ind-tag">{it.tag}</span>
                <div className="ind-bot">
                  <span className="ind-coords">{it.coords}</span>
                  <h4 className="ind-h">{it.h}</h4>
                  <p className="ind-p">{it.p}</p>
                </div>
              </div>
            ))}
          </div>
          {/* progress tracker */}
          <div className="ind-progress">
            {INDUSTRIES.map((it, i) => (
              <div
                key={it.n}
                ref={el => { progRefs.current[i] = el; }}
                className="ind-prog-item"
              >
                <div className="ind-prog-bar"><div className="ind-prog-fill" /></div>
                <span className="ind-prog-label">{it.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { Services, Stats, Process, Industries };
