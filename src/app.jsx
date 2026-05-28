import { Fragment, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Nav, Footer } from './components/Shared.jsx';
import { ScrollRay } from './components/ScrollRay.jsx';
import { Preloader } from './components/Preloader.jsx';
import { useTweaks, TweaksPanel, TweaksTrigger } from './components/Tweaks.jsx';
import { Hero, About } from './sections/Hero.jsx';
import { Services, Stats, Process, Industries } from './sections/Services.jsx';
import { Cases, Tech, Testimonials, CTA } from './sections/Cases.jsx';

gsap.registerPlugin(ScrollTrigger);


/* ── Custom cursor ── */
function Cursor() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 500, damping: 28, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 500, damping: 28, mass: 0.4 });
  const rx = useSpring(mx, { stiffness: 120, damping: 22, mass: 0.6 });
  const ry = useSpring(my, { stiffness: 120, damping: 22, mass: 0.6 });
  const scaleRef = useRef(1);
  const ringScale = useMotionValue(1);

  useEffect(() => {
    const onMove = (e) => { mx.set(e.clientX); my.set(e.clientY); };
    const onEnter = (e) => {
      const t = e.target.closest('a,button,[data-cursor="pointer"]');
      if (t) { ringScale.set(2.2); scaleRef.current = 2.2; }
    };
    const onLeave = () => { ringScale.set(1); scaleRef.current = 1; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onEnter);
    window.addEventListener('mouseout', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onEnter);
      window.removeEventListener('mouseout', onLeave);
    };
  }, [mx, my, ringScale]);

  return (
    <>
      {/* dot */}
      <motion.div className="cursor-dot" style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999,
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--accent)',
        x: sx, y: sy,
        translateX: '-50%', translateY: '-50%',
        mixBlendMode: 'screen',
      }} />
      {/* ring */}
      <motion.div className="cursor-ring" style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9998,
        width: 32, height: 32, borderRadius: '50%',
        border: '1px solid rgba(46,232,180,0.55)',
        x: rx, y: ry,
        translateX: '-50%', translateY: '-50%',
        scale: ringScale,
      }} transition={{ scale: { type: 'spring', stiffness: 300, damping: 22 } }} />
    </>
  );
}


/* ── App ── */
function App() {
  const { tweaks, set, open, close, toggle } = useTweaks();
  const stampRef = useRef(null);
  const stampTextRef = useRef(null);

  useEffect(() => {
    const fit = () => {
      const container = stampRef.current;
      const text = stampTextRef.current;
      if (!container || !text) return;

      const available = container.clientWidth * 0.92;

      text.style.fontSize = '16px';
      const textW = text.scrollWidth;
      if (textW > 0) {
        text.style.fontSize = Math.floor(16 * available / textW) + 'px';
      }
    };

    // Slight delay to ensure SVG dimensions are accounted for
    setTimeout(fit, 100);

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove();
    };
  }, []);

  return (
    <Fragment>
      <Preloader />
      <Cursor />

      {/* Brand stamp — fixed behind everything, revealed as page scrolls away */}
      <div className="foot-stamp" aria-hidden="true" ref={stampRef}>
        <span className="foot-stamp-text" ref={stampTextRef}>
          <span className="fst-bold">NEXIRA</span>
          <span className="fst-gap"> </span>
          <span className="fst-light">SPATIAL</span>
        </span>
      </div>

      {/* All scrollable page content lives in this wrapper, layered ABOVE the stamp */}
      <div className="page-content">
        <ScrollRay />
        <Nav />
        <Hero />
        <About />
        <Services />
        <Stats />
        <Process />
        <Industries />
        <Cases />
        <Tech />
        <Testimonials />

        <CTA />
        <Footer />
      </div>

      {/* Decorative silhouette edge — outside page-content so it can be transparent */}
      <div className="foot-silhouette" aria-hidden="true">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,0 L1440,0 L1440,180 Q720,60 0,180 Z"
            fill="#000"
          />
        </svg>
      </div>

      {/* Transparent spacer — creates scroll distance to fully reveal the stamp */}
      <div className="foot-spacer" aria-hidden="true" />

      <TweaksTrigger onClick={toggle} open={open} />
      <TweaksPanel tweaks={tweaks} set={set} open={open} close={close} />
    </Fragment>
  );
}

export default App;
