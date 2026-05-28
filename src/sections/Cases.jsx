import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Reveal, SplitText, CountUp } from '../hooks';
import { Eyebrow, BtnPrimary, BtnGhost } from '../components/Shared.jsx';
import * as THREE from 'three';

/* ── Animated ATMOS sky with Three.js Shaders ── */
function AtmosSky() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const vertexShader = `
      varying vec3 vPos;
      varying vec2 vUv;
      void main() {
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        vPos = position;
        vUv = uv;
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform float uGradientMixer;
      uniform float uYCompression;
      varying vec3 vPos;
      varying vec2 vUv;

      vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

      float cnoise(vec2 P){
        vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
        vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
        Pi = mod(Pi, 289.0);
        vec4 ix = Pi.xzxz; vec4 iy = Pi.yyww;
        vec4 fx = Pf.xzxz; vec4 fy = Pf.yyww;
        vec4 i = permute(permute(ix) + iy);
        vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
        vec4 gy = abs(gx) - 0.5;
        vec4 tx = floor(gx + 0.5);
        gx = gx - tx;
        vec2 g00 = vec2(gx.x,gy.x); vec2 g10 = vec2(gx.y,gy.y);
        vec2 g01 = vec2(gx.z,gy.z); vec2 g11 = vec2(gx.w,gy.w);
        vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
        g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
        float n00 = dot(g00, vec2(fx.x, fy.x));
        float n10 = dot(g10, vec2(fx.y, fy.y));
        float n01 = dot(g01, vec2(fx.z, fy.z));
        float n11 = dot(g11, vec2(fx.w, fy.w));
        vec2 fade_xy = fade(Pf.xy);
        vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
        return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
      }

      vec3 rgb(int r, int g, int b) { return vec3(float(r)/255.0, float(g)/255.0, float(b)/255.0); }

      vec3 gradientMultimix(vec3 elements[8], float v) {
        int i1 = int(v);
        float completion = mod(v, 1.0);
        if (i1 == 0) return mix(elements[0], elements[1], completion);
        if (i1 == 1) return mix(elements[1], elements[2], completion);
        if (i1 == 2) return mix(elements[2], elements[3], completion);
        if (i1 == 3) return mix(elements[3], elements[4], completion);
        if (i1 == 4) return mix(elements[4], elements[5], completion);
        if (i1 == 5) return mix(elements[5], elements[6], completion);
        if (i1 == 6) return mix(elements[6], elements[7], completion);
        return elements[7];
      }

      vec3 gradient(vec3 colorTop, vec3 colorBottom, vec3 colorNoise, float yFactor, float noise) {
        vec3 vertical_gradient = mix(colorTop, colorBottom, yFactor);
        return mix(vertical_gradient, colorNoise, noise * (1. - yFactor));
      }

      void main() {
        float yFactor = (.5 - (vPos.y * uYCompression) / 2. );
        float speed = .2;
        float noise = cnoise(vPos.xy * .025 + uTime * speed);
        noise += cnoise(vPos.xy * .025 - uTime * speed);
        noise = clamp(noise, 0., 1.2);

        vec3 gs[8];
        gs[0] = gradient(rgb(10, 20, 80),  rgb(2, 6, 23),    rgb(30, 60, 150),  yFactor, noise);
        gs[1] = gradient(rgb(25, 10, 60),  rgb(5, 5, 20),     rgb(80, 20, 120),  yFactor, noise);
        gs[2] = gradient(rgb(5, 40, 60),   rgb(2, 10, 15),    rgb(20, 100, 140), yFactor, noise);
        gs[3] = gradient(rgb(30, 30, 50),  rgb(10, 10, 25),   rgb(60, 60, 90),   yFactor, noise);
        gs[4] = gradient(rgb(180, 190, 210), rgb(40, 50, 90), rgb(220, 220, 240), yFactor, noise);
        gs[5] = gradient(rgb(40, 20, 80),  rgb(15, 5, 30),    rgb(120, 60, 180), yFactor, noise);
        gs[6] = gradient(rgb(10, 60, 40),  rgb(2, 15, 10),    rgb(30, 150, 100), yFactor, noise);
        gs[7] = gradient(rgb(10, 30, 60),  rgb(2, 6, 23),     rgb(30, 60, 150),  yFactor, noise);
        
        vec3 color = gradientMultimix(gs, uGradientMixer * 7.0);
        gl_FragColor = vec4(color, 1.0);
      }
    `;


    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 0.1; // almost centered

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(50, 64, 32);
    const uniforms = {
      uTime: { value: 0 },
      uGradientMixer: { value: 0 },
      uYCompression: { value: 0.05 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      uniforms,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const W = container.clientWidth;
      const H = container.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      uniforms.uYCompression.value = W > H ? 0.045 : 0.07;
    };
    window.addEventListener('resize', resize);
    resize();

    let raf;
    const animate = (time) => {
      const t = time * 0.001;
      uniforms.uTime.value = t;
      uniforms.uGradientMixer.value = (Math.sin(t * 0.25) + 1) / 2; // morphing cycle

      mesh.rotation.y = t * 0.02;
      mesh.rotation.z = t * 0.01;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}


gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   NEXIRA — Cases / Tech / Testimonials / Blog / CTA
   ============================================================ */

const CASES = [
  {
    num: 'SAMPLE / 01', chip: 'WEB GIS / 2025',
    title: 'Custom Web GIS Platform',
    body: 'An end-to-end interactive web mapping platform built for a government agency — integrating live spatial data layers, custom cartography and an intuitive GIS front-end accessible from any browser.',
    meta: [['Layers', '24+'], ['Users', 'Govt'], ['Stack', 'MapLibre']],
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&q=80',
  },
  {
    num: 'SAMPLE / 02', chip: 'REMOTE SENSING / 2024',
    title: 'Satellite Imagery Analysis',
    body: 'Multi-temporal satellite and aerial imagery classification for land use and change detection — delivering high-accuracy LULC maps to support environmental planning and resource management.',
    meta: [['Accuracy', '92%+'], ['Coverage', 'Kerala'], ['Source', 'Sentinel-2']],
    img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1400&q=80',
  },
  {
    num: 'SAMPLE / 03', chip: 'ANALYTICS / 2024',
    title: 'Spatial Suitability Modelling',
    body: 'Predictive geospatial workflows combining field surveys, satellite data and spatial analytics to produce suitability models — helping organizations identify optimal locations for operations and investment.',
    meta: [['Model', 'Suitability'], ['Region', 'South India'], ['Output', 'Risk Surface']],
    img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=80',
  },
];

function Cases() {
  const wrapRef = useRef(null);
  const stackRef = useRef(null);
  const cardRefs = useRef([]);
  const N = CASES.length;

  useEffect(() => {
    const section = wrapRef.current;
    if (!section) return;
    const cards = cardRefs.current.filter(Boolean);
    if (cards.length !== N) return;

    const ctx = gsap.context(() => {
      /* Card 0 sits at full size. Cards 1..N-1 start hidden BELOW the viewport */
      gsap.set(cards[0], { yPercent: 0, zIndex: 1 });
      cards.slice(1).forEach((card, i) => {
        gsap.set(card, { yPercent: 100, zIndex: i + 2 });
      });

      /* Pin section for (N-1) extra screens */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${(N - 1) * window.innerHeight}`,
          pin: true,
          pinSpacing: true,
          scrub: 1,
        },
      });

      /* Each step: slide next card up from 100% to 0% */
      cards.slice(1).forEach((card) => {
        tl.to(card, { yPercent: 0, ease: 'none', duration: 1 });
      });

    }, section);

    return () => ctx.revert();
  }, [N]);

  return (
    <section className="cases" id="cases" data-screen-label="07 Cases" ref={wrapRef}>
      <div className="cases-stack" ref={stackRef}>
        {CASES.map((c, i) => (
          <div
            key={i}
            className="case-card"
            ref={el => { cardRefs.current[i] = el; }}
          >
            <div className="case-card-bg" style={{ backgroundImage: 'url(' + c.img + ')' }} />
            <div className="case-card-scrim" />

            <div className="case-card-topbar">
              <span className="case-card-chip">{c.chip}</span>
              <span className="case-card-num">{c.num}</span>
            </div>

            {/* eyebrow only on first card */}
            {i === 0 && (
              <div className="case-card-eyebrow">
                <Eyebrow>E — Selected work</Eyebrow>
              </div>
            )}

            <div className="case-card-body">
              <div className="case-card-left">
                <h3 className="case-card-title">{c.title}</h3>
                <p className="case-card-desc">{c.body}</p>
                <BtnGhost>View Case Study</BtnGhost>
              </div>
              <div className="case-card-stats">
                {c.meta.map(([l, v]) => (
                  <div key={l} className="case-card-stat">
                    <span className="case-card-stat-v">{v}</span>
                    <span className="case-card-stat-l">{l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="case-card-idx">
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span className="case-card-idx-total">/ {String(N).padStart(2, '0')}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   TECH STACK
   ============================================================ */
const TECH = [
  { n: 'QGIS / ArcGIS', g: <><circle cx="16" cy="16" r="13" stroke="var(--accent)" /><path d="M3 16h26M16 3v26" stroke="var(--accent)" opacity="0.5" /></> },
  { n: 'PostGIS', g: <><rect x="4" y="6" width="24" height="20" stroke="var(--accent)" rx="2" /><path d="M4 12h24" stroke="var(--accent)" /></> },
  { n: 'Mapbox / MapLibre', g: <path d="M6 22l5-12 5 12M11 18h0M20 10v12M20 16h6" stroke="var(--accent)" strokeLinecap="round" strokeWidth="2" /> },
  { n: 'Google Earth Engine', g: <path d="M4 16c4-8 20-8 24 0M4 16c4 8 20 8 24 0" stroke="var(--accent)" /> },
  { n: 'Python', g: <><circle cx="16" cy="16" r="3" fill="var(--accent)" /><circle cx="16" cy="16" r="10" stroke="var(--accent)" /></> },
  { n: 'PyTorch', g: <path d="M8 8h16v16H8z M8 16h16M16 8v16" stroke="var(--accent)" /> },
  { n: 'React / Three.js', g: <><circle cx="10" cy="16" r="5" stroke="var(--accent)" /><circle cx="22" cy="16" r="5" stroke="var(--accent)" /></> },
  { n: 'Docker / K8s', g: <rect x="6" y="6" width="20" height="20" stroke="var(--accent)" strokeDasharray="2 3" /> },
  { n: 'AWS', g: <><path d="M4 20c3-2 6-3 12-3s9 1 12 3" stroke="var(--accent)" strokeLinecap="round" /><path d="M16 4v16M10 10l6-6 6 6" stroke="var(--accent)" strokeLinecap="round" /></> },
  { n: 'FastAPI', g: <><path d="M6 12l10-6 10 6v8l-10 6L6 20z" stroke="var(--accent)" /><path d="M16 6v20" stroke="var(--accent)" opacity="0.4" /></> },
  { n: 'Flutter', g: <><path d="M6 16L16 6l10 10M10 20l6-6 10 10H16" stroke="var(--accent)" strokeLinecap="round" strokeLinejoin="round" /></> },
  { n: 'MongoDB', g: <><path d="M16 4c0 0-7 6-7 13a7 7 0 0 0 14 0C23 10 16 4 16 4z" stroke="var(--accent)" /><path d="M16 8v16" stroke="var(--accent)" opacity="0.5" /></> },
  { n: 'Node.js', g: <><path d="M16 4l11 6v12l-11 6L5 22V10z" stroke="var(--accent)" /><path d="M16 4v24M5 10l11 6 11-6" stroke="var(--accent)" opacity="0.4" /></> },
];

/* ── Tech stack items with real brand SVG logos ── */
const STACK = [
  {
    n: 'QGIS',
    logo: <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#589632" /><circle cx="32" cy="32" r="18" fill="#93b023" /><circle cx="32" cy="32" r="8" fill="#fff" /><path d="M32 10v8M32 46v8M10 32h8M46 32h8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></svg>,
  },
  {
    n: 'PostGIS',
    logo: <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="14" width="48" height="36" rx="6" fill="#336791" /><path d="M20 26h24M20 32h24M20 38h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /><circle cx="46" cy="20" r="6" fill="#fff" opacity="0.9" /><path d="M44 20h4M46 18v4" stroke="#336791" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  },
  {
    n: 'Mapbox',
    logo: <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#1a1a1a" /><circle cx="32" cy="32" r="14" fill="none" stroke="#4264fb" strokeWidth="3" /><circle cx="32" cy="20" r="4" fill="#4264fb" /><path d="M32 24v16" stroke="#4264fb" strokeWidth="2.5" strokeLinecap="round" /></svg>,
  },
  {
    n: 'Google Earth',
    logo: <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#4285F4" /><ellipse cx="32" cy="32" rx="12" ry="28" stroke="#fff" strokeWidth="2" fill="none" /><path d="M8 24h48M8 40h48" stroke="#fff" strokeWidth="2" /><circle cx="32" cy="32" r="28" stroke="#fff" strokeWidth="2" fill="none" /></svg>,
  },
  {
    n: 'Python',
    logo: <svg viewBox="0 0 64 64" fill="none"><path d="M32 8c-8 0-14 3-14 8v8h14v2H18c-6 0-10 4-10 10v10c0 6 6 10 14 10h4v-8h-4c-2 0-4-1-4-3v-8c0-2 2-3 4-3h20c4 0 6-3 6-7V16c0-5-6-8-16-8z" fill="#3776ab" /><path d="M32 56c8 0 14-3 14-8v-8H32v-2h14c6 0 10-4 10-10V18c0-6-6-10-14-10h-4v8h4c2 0 4 1 4 3v8c0 2-2 3-4 3H22c-4 0-6 3-6 7v12c0 5 6 8 16 8z" fill="#ffd43b" /><circle cx="25" cy="18" r="3" fill="#fff" /><circle cx="39" cy="46" r="3" fill="#fff" /></svg>,
  },
  {
    n: 'PyTorch',
    logo: <svg viewBox="0 0 64 64" fill="none"><path d="M32 6L14 24c-10 10-10 26 0 36 10 10 26 10 36 0 10-10 10-26 0-36L42 14l-4 4c6 6 6 16 0 22s-16 6-22 0-6-16 0-22L32 6z" fill="#EE4C2C" /><circle cx="42" cy="20" r="4" fill="#EE4C2C" /></svg>,
  },
  {
    n: 'React',
    logo: <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="5" fill="#61DAFB" /><ellipse cx="32" cy="32" rx="26" ry="10" stroke="#61DAFB" strokeWidth="2.5" fill="none" /><ellipse cx="32" cy="32" rx="26" ry="10" stroke="#61DAFB" strokeWidth="2.5" fill="none" transform="rotate(60 32 32)" /><ellipse cx="32" cy="32" rx="26" ry="10" stroke="#61DAFB" strokeWidth="2.5" fill="none" transform="rotate(120 32 32)" /></svg>,
  },
  {
    n: 'Three.js',
    logo: <svg viewBox="0 0 64 64" fill="none"><path d="M32 6L6 54h52L32 6z" stroke="#fff" strokeWidth="2.5" fill="none" /><path d="M19 38l13-22 13 22H19z" fill="#fff" opacity="0.15" /><path d="M19 38h26M25.5 27l13 0M32 16v0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  },
  {
    n: 'Docker',
    logo: <svg viewBox="0 0 64 64" fill="none"><rect x="10" y="22" width="10" height="8" rx="1" fill="#2496ED" /><rect x="22" y="22" width="10" height="8" rx="1" fill="#2496ED" /><rect x="34" y="22" width="10" height="8" rx="1" fill="#2496ED" /><rect x="22" y="12" width="10" height="8" rx="1" fill="#2496ED" /><rect x="34" y="12" width="10" height="8" rx="1" fill="#2496ED" /><path d="M8 34s2 8 12 8h24c8 0 12-6 12-6" stroke="#2496ED" strokeWidth="2" fill="none" /><circle cx="50" cy="28" r="4" fill="#2496ED" /><path d="M54 28h4" stroke="#2496ED" strokeWidth="2" /></svg>,
  },
  {
    n: 'AWS',
    logo: <svg viewBox="0 0 64 64" fill="none"><path d="M20 36c-4 2-8 6-8 10 0 4 4 6 10 4l20-8" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" /><path d="M44 28c4-2 8-6 8-10 0-4-4-6-10-4L22 22" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" /><path d="M18 24l6-10 6 10M21 22h6" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M34 40l4-8 4 8M35 38h6" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    n: 'FastAPI',
    logo: <svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="26" fill="#009688" /><path d="M34 12l-12 22h12l-2 18 12-22H32l2-18z" fill="#fff" /></svg>,
  },
  {
    n: 'Flutter',
    logo: <svg viewBox="0 0 64 64" fill="none"><path d="M14 32L32 8h18L32 32" fill="#54C5F8" /><path d="M14 32l18 24h18L32 32" fill="#01579B" /><path d="M32 32l8 10-8 10" fill="#29B6F6" /></svg>,
  },
  {
    n: 'MongoDB',
    logo: <svg viewBox="0 0 64 64" fill="none"><path d="M32 6c0 0-14 12-14 26a14 14 0 0 0 28 0C46 18 32 6 32 6z" fill="#47A248" /><path d="M32 10v38" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" /></svg>,
  },
  {
    n: 'Node.js',
    logo: <svg viewBox="0 0 64 64" fill="none"><path d="M32 6l22 12v24L32 54 10 42V18L32 6z" fill="#339933" /><path d="M32 6l22 12-22 12L10 18 32 6z" fill="#fff" opacity="0.1" /><path d="M28 26v8l4 2 4-2v-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
];

function Tech() {
  const sectionRef = useRef(null);
  const track1Ref = useRef(null);

  useEffect(() => {
    const track = track1Ref.current;
    if (!track) return;

    /* Total width of ONE set (half the duplicated track) */
    const totalW = track.scrollWidth / 2;
    let x = 0;
    let speed = 1;       // px per frame at base
    let targetSpeed = 1;
    let raf;

    const BASE = 0.6;    // px/frame idle
    const MAX = 2.2;    // px/frame at full scroll boost

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      speed = lerp(speed, targetSpeed, 0.05);
      targetSpeed = lerp(targetSpeed, BASE, 0.03);

      x -= speed;
      if (x <= -totalW) x += totalW; // seamless wrap

      track.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    function onScroll() {
      targetSpeed = Math.min(MAX, targetSpeed + 0.18);
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  /* Duplicate for seamless loop */
  const items = [...STACK, ...STACK];

  return (
    <section className="tech" id="tech" data-screen-label="08 Stack" ref={sectionRef}>

      {/* header */}
      <div className="wrap tech-head">
        <div>
          <Reveal><Eyebrow>F — Toolchain</Eyebrow></Reveal>
          <Reveal delay={80}><h2 className="display h2">Standards in.<br />Decisions out.</h2></Reveal>
        </div>
        <Reveal delay={200} className="tech-head-right">
          <p className="lede" style={{ maxWidth: '34ch', margin: 0 }}>
            An open, opinionated stack — from raw imagery to live decision surface.
          </p>
        </Reveal>
      </div>

      {/* single marquee row */}
      <div className="tmq-rows">
        <div className="tmq-track-wrap">
          <div className="tmq-track tmq-fwd" ref={track1Ref}>
            {items.map((t, i) => (
              <div key={i} className="tmq-item">
                <div className="tmq-logo">{t.logo}</div>
                <span className="tmq-name">{t.n}</span>
                <span className="tmq-sep" aria-hidden="true">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */
const TESTIMONIALS = [
  { q: "They didn't sell us a dashboard, they sold us a way of thinking about our coastline. Six months on, every relocation case starts in their atlas.", n: 'Dr. Anjali Mahapatra', r: 'Director · OSDMA', av: 'linear-gradient(135deg, var(--accent), var(--accent-2))' },
  { q: "Best geospatial team we've worked with. They speak ag, they speak ML, and they ship.", n: 'Vikram Reddy', r: 'VP Data · AgriCore', av: 'linear-gradient(135deg, var(--accent-2), var(--accent))' },
  { q: 'From the first workshop they were asking the questions our planners had been avoiding for a decade.', n: 'Priya Iyer', r: 'Chief Urban Designer · BMRDA', av: 'linear-gradient(135deg, #ffb858, var(--accent))' },
];

function Testimonials() {
  const sectionRef = useRef(null);
  const slidesRef = useRef([]);
  const namesRef = useRef([]);
  const N = TESTIMONIALS.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const slides = slidesRef.current.filter(Boolean);
    const names = namesRef.current.filter(Boolean);

    // On mobile the section is height:auto and slides are stacked via CSS
    if (window.innerWidth <= 860) return;

    /* all slides start invisible except first */
    gsap.set(slides, { autoAlpha: 0, y: 60 });
    gsap.set(slides[0], { autoAlpha: 1, y: 0 });
    gsap.set(names, { opacity: 0.3 });
    gsap.set(names[0], { opacity: 1 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${(N - 1) * window.innerHeight}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.8,
        },
      });

      slides.forEach((slide, i) => {
        if (i === N - 1) return;
        /* fade out current */
        tl.to(slide, { autoAlpha: 0, y: -50, ease: 'power2.in', duration: 0.4 }, i)
          .to(names[i], { opacity: 0.3, ease: 'none', duration: 0.4 }, i)
          /* fade in next */
          .fromTo(slides[i + 1], { autoAlpha: 0, y: 60 },
            { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.4 }, i + 0.4)
          .to(names[i + 1], { opacity: 1, ease: 'none', duration: 0.3 }, i + 0.4);
      });
    }, section);

    return () => ctx.revert();
  }, [N]);

  return (
    <section className="testimonials" id="testimonials" data-screen-label="09 Voices" ref={sectionRef}>
      <div className="test-inner wrap">

        {/* left — name list */}
        <div className="test-names">
          <Eyebrow style={{ marginBottom: 40 }}>G — Voices</Eyebrow>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="test-name-row" ref={el => { namesRef.current[i] = el; }}>
              <span className="test-name-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="test-name-text">{t.n}</div>
                <div className="test-name-role">{t.r}</div>
              </div>
            </div>
          ))}
        </div>

        {/* right — quote stage */}
        <div className="test-stage">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="test-slide" ref={el => { slidesRef.current[i] = el; }}>
              <div className="test-bigquote" aria-hidden="true">"</div>
              <blockquote className="test-q">{t.q}</blockquote>
              <div className="test-attr">
                <div className="test-av" style={{ background: t.av }}>{t.n.charAt(0)}</div>
                <div>
                  <div className="test-attr-name">{t.n}</div>
                  <div className="test-attr-role">{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

/* ============================================================
   BLOG
   ============================================================ */
const POSTS = [
  { cat: 'GIS · Method', h: 'Why we stopped treating raster and vector as separate worlds.', d: 'May 2026', r: '6 min', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&q=80' },
  { cat: 'AI · Research', h: 'Foundation models for earth observation: what\'s actually working.', d: 'Apr 2026', r: '11 min', img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900&q=80' },
  { cat: 'Field · Notes', h: 'What a paddy field taught us about model uncertainty.', d: 'Mar 2026', r: '8 min', img: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=900&q=80' },
];

function Blog() {
  return (
    <section className="blog" id="blog" data-screen-label="10 Field Notes">
      <div className="wrap">
        <div className="section-head" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'end', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Reveal><Eyebrow>H — Field notes</Eyebrow></Reveal>
            <Reveal delay={120}><h2 className="display h2">From the field.</h2></Reveal>
          </div>
          <Reveal delay={240}><BtnGhost href="#">All Articles →</BtnGhost></Reveal>
        </div>
        <div className="blog-grid">
          {POSTS.map((p, i) => (
            <Reveal key={i} as="article" className="post" delay={i * 120}>
              <div className="img" style={{ backgroundImage: `url('${p.img}')` }} />
              <div className="cat">{p.cat}</div>
              <h4>{p.h}</h4>
              <div className="meta-row"><span>{p.d}</span><span>{p.r}</span></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA
   ============================================================ */
function CTA() {
  return (
    <section className="atmos-container" id="contact" data-screen-label="11 Connect" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AtmosSky />

      <div className="wrap" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <Reveal>
          <h1 className="atmos-headline" style={{ fontSize: 'clamp(60px, 12vw, 120px)', marginBottom: 'var(--spacing-30)' }}>
            LET'S CONNECT
          </h1>
        </Reveal>

        <Reveal delay={300}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'clamp(14px,1.6vw,18px)', maxWidth: '42ch', margin: '0 auto var(--spacing-40)', lineHeight: 1.7 }}>
            Suite No 290B, Heiley Offices, Basement Floor,<br />
            Pallath Square, North Kalamassery, Kochi, Kerala 683104
          </p>
        </Reveal>

        <Reveal delay={600}>
          <div className="cta-row" style={{ display: 'flex', gap: 'var(--spacing-20)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:nexiraspatial@gmail.com" className="atmos-explore-btn btn-revealer" data-hover="nexiraspatial@gmail.com" style={{ margin: 0 }}>
              <span className="btn-label">Email Us</span>
            </a>
            <a href="tel:+917736459090" className="atmos-explore-btn btn-revealer" data-hover="+91 7736459090" style={{ margin: 0 }}>
              <span className="btn-label">Call Us</span>
            </a>
          </div>
        </Reveal>

      </div>
    </section>
  );
}

export { Cases, Tech, Testimonials, Blog, CTA };
