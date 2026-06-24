import { useRef, useEffect, useState } from 'react';
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
    let isVisible = true;

    const obs = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0 });
    obs.observe(container);

    const animate = (time) => {
      if (isVisible) {
        const t = time * 0.001;
        uniforms.uTime.value = t;
        uniforms.uGradientMixer.value = (Math.sin(t * 0.25) + 1) / 2;

        mesh.rotation.y = t * 0.02;
        mesh.rotation.z = t * 0.01;

        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
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
    num: '01 / 02', chip: 'HAZARD ANALYSIS / 2025',
    title: 'Multi Hazard Dashboard',
    body: 'An interactive risk intelligence platform for spatial hazard assessment — visualising multi-layered threat data, risk zones and analytical outputs for informed decision-making.',
    meta: [['Type', 'Dashboard'], ['Domain', 'Hazard GIS'], ['Stack', 'MapLibre']],
    img: '/case-hazard-dashboard.jpg',
    url: 'https://nexira-spatial-map-service.vercel.app/',
  },
  {
    num: '02 / 02', chip: 'WEB MAPPING / 2025',
    title: 'GIS interactive webmap',
    body: 'A live web mapping platform for real-time hazard visualisation — integrating spatial data layers, custom cartography and geospatial analysis accessible from any browser.',
    meta: [['Type', 'Web Map'], ['Domain', 'Hazard GIS'], ['Stack', 'Leaflet']],
    img: '/case-hazard-webmap.jpg',
    url: 'https://web-map-v2.vercel.app/',
  },
];

function Cases() {
  const sectionRef = useRef(null);

  return (
    <section className="cases" id="products" data-screen-label="07 Products" ref={sectionRef}>
      {CASES.map((c, i) => (
        <div key={i} className="case-portal">
          <div className="wrap portal-content" style={{
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            gap: '32px',
            paddingTop: 'clamp(140px, 15vh, 180px)',
            paddingBottom: '80px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header Content */}
            <div className="portal-head" style={{ textAlign: 'center', width: '100%', marginBottom: '20px' }}>
              <Reveal>
                <Eyebrow style={{ letterSpacing: '0.4em', justifyContent: 'center' }}>OUR PRODUCTS</Eyebrow>
              </Reveal>
            </div>

            {/* The "Main Card" */}
            <div className="portal-card-wrap" style={{ width: '100%', maxWidth: '1000px' }}>
              <div className="portal-card-inner" style={{ maxHeight: '50vh', overflow: 'hidden', borderRadius: '12px' }}>
                <img src={c.img} alt={c.title} className="portal-card-img" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />

                {/* Centered Button Overlay (shows on hover) */}
                <div className="portal-card-hover-overlay">
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="portal-btn">
                    LAUNCH PLATFORM
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Outside Bottom Content Area */}
            <div className="portal-foot" style={{ textAlign: 'center', width: '100%', marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Reveal delay={100}>
                <h2 className="portal-title" style={{
                  fontSize: 'clamp(20px, 3.5vw, 32px)',
                  color: '#fff',
                  marginBottom: '12px',
                  textTransform: 'uppercase'
                }}>
                  {c.title}
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="portal-desc" style={{
                  maxWidth: '700px',
                  color: 'rgba(255,255,255,0.75)',
                  margin: '0 auto',
                  fontSize: 'clamp(14px, 1.2vw, 16px)',
                  lineHeight: '1.6'
                }}>
                  {c.body}
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      ))}
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
    // Marquee is now handled by CSS animation for better performance
    // No JS loop or scroll listeners needed
  }, []);

  /* Duplicate for seamless loop */
  const items = [...STACK, ...STACK];

  return (
    <section className="tech" id="tech" data-screen-label="08 Stack" ref={sectionRef}>

      {/* section heading */}
      <div className="wrap" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Reveal><Eyebrow style={{ justifyContent: 'center' }}>OUR TECHNOLOGIES</Eyebrow></Reveal>
      </div>

      {/* detail head */}
      <div className="wrap tech-head">
        <div>
          <Reveal delay={80}><h2 className="display h2">Standards in.<br />Decisions out</h2></Reveal>
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
   WHY CHOOSE US (Replacing Testimonials)
   ============================================================ */
const REASONS = [
  {
    h: 'Local Expertise, Global Standards',
    q: 'Born in Kerala, built for the world.',
    av: 'linear-gradient(135deg, var(--accent), var(--accent-2))'
  },
  {
    h: 'Custom GIS Platforms',
    q: 'Solutions tailored to your specific use case.',
    av: 'linear-gradient(135deg, var(--accent-2), var(--accent))'
  },
  {
    h: 'Data Accuracy & Quality',
    q: 'Precision you can trust for decision-making.',
    av: 'linear-gradient(135deg, #ffb858, var(--accent))'
  },
  {
    h: 'Technology-Driven Team',
    q: 'Leveraging AI, cloud, and spatial analytics.',
    av: 'linear-gradient(135deg, #4d7cff, #2ee8b4)'
  },
  {
    h: 'Government & Enterprise',
    q: 'Proven results in real-world GIS applications.',
    av: 'linear-gradient(135deg, #ffb858, #4d7cff)'
  },
];

function Testimonials() {
  const sectionRef = useRef(null);
  const slidesRef = useRef([]);
  const namesRef = useRef([]);
  const N = REASONS.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const slides = slidesRef.current.filter(Boolean);
    const names = namesRef.current.filter(Boolean);

    if (!slides.length) return;

    // Immediately set first slide visible BEFORE any GSAP batching
    gsap.set(slides, { autoAlpha: 0, y: 60 });
    gsap.set(slides[0], { autoAlpha: 1, y: 0 });
    if (names.length) {
      gsap.set(names, { opacity: 0.3 });
      gsap.set(names[0], { opacity: 1 });
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${(N - 1) * window.innerHeight * 0.8}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.8,
        },
      });

      slides.forEach((slide, i) => {
        if (i === N - 1) return;
        tl.to(slide, { autoAlpha: 0, y: -50, ease: 'power2.in', duration: 0.4 }, i)
          .to(names[i], { opacity: 0.3, ease: 'none', duration: 0.4 }, i)
          .fromTo(slides[i + 1], { autoAlpha: 0, y: 60 },
            { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.4 }, i + 0.4)
          .to(names[i + 1], { opacity: 1, ease: 'none', duration: 0.3 }, i + 0.4);
      });
    }, section);

    return () => ctx.revert();
  }, [N]);

  return (
    <section className="testimonials" id="why-choose-us" data-screen-label="09 Choose Us" ref={sectionRef}>

      {/* 1. Global centered header */}
      <div className="wrap" style={{ paddingTop: '160px', textAlign: 'center' }}>
        <div className="test-head" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Eyebrow style={{ marginBottom: 24, justifyContent: 'center' }}>Why Choose Us</Eyebrow>
          <p style={{ color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 auto', lineHeight: 1.6, maxWidth: '60ch' }}>
            Built on local roots with global capabilities — practical, precise, and proven.
          </p>
        </div>
      </div>

      {/* 2. Split content inner grid */}
      <div className="test-inner wrap">
        {/* left column — desktop feature list */}
        <div className="test-left-column" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          <div className="test-names">
            <div className="test-carousel">
              {REASONS.map((t, i) => (
                <div key={i} className="test-name-row" ref={el => { namesRef.current[i] = el; }}>
                  <span className="test-name-num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <div className="test-name-text" style={{ fontSize: '20px' }}>{t.h}</div>
                    <div className="test-mobile-q" style={{ marginTop: '12px', fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                      {t.q}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right — stage */}
        <div className="test-stage">
          {REASONS.map((t, i) => (
            <div key={i} className="test-slide" style={{ alignItems: 'center', textAlign: 'center' }} ref={el => { slidesRef.current[i] = el; }}>
              <div aria-hidden="true" style={{ marginBottom: 28, opacity: 0.35 }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Isometric outline */}
                  <path d="M32 10 L54 22 V42 L32 54 L10 42 V22 Z" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" opacity="0.6" />
                  <path d="M32 10 V33" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" opacity="0.6" />
                  <path d="M54 22 L32 33 L10 22" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" opacity="0.6" />
                  {/* Floating data nodes */}
                  <circle cx="32" cy="10" r="3.5" fill="var(--accent)" />
                  <circle cx="54" cy="22" r="3.5" fill="var(--accent)" />
                  <circle cx="10" cy="22" r="3.5" fill="var(--accent)" />
                  <circle cx="54" cy="42" r="3.5" fill="var(--accent)" />
                  <circle cx="10" cy="42" r="3.5" fill="var(--accent)" />
                  <circle cx="32" cy="54" r="3.5" fill="var(--accent)" />
                  <circle cx="32" cy="33" r="4" fill="#fff" />
                </svg>
              </div>
              <div className="test-q" style={{ fontSize: 'clamp(22px, 2.8vw, 38px)', lineHeight: 1.45, fontWeight: 400, maxWidth: '28ch', margin: '0 auto', textAlign: 'center' }}>
                <div className="test-slide-heading" style={{ color: 'var(--accent)', fontSize: 'clamp(12px, 4vw, 16px)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>
                  {String(i + 1).padStart(2, '0')} <span style={{ opacity: 0.5 }}>/</span> {t.h}
                </div>
                {t.q}
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
            <Reveal><Eyebrow>Field notes</Eyebrow></Reveal>
            <Reveal delay={120}><h2 className="display h2">From the field</h2></Reveal>
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
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'clamp(14px,1.6vw,18px)', maxWidth: '54ch', margin: '0 auto var(--spacing-40)', lineHeight: 1.7 }}>
            Suite No 290B, Heiley Offices, Basement Floor,<br />
            Pallath Square, North Kalamassery, Kochi, Kerala 683104
          </p>
        </Reveal>

        <Reveal delay={600}>
          <div className="cta-row" style={{ display: 'flex', gap: 'var(--spacing-20)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:info@nexiraspatial.com" className="atmos-explore-btn btn-revealer" data-hover="info@nexiraspatial.com" style={{ margin: 0 }}>
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
