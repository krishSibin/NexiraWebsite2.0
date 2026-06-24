import { Fragment, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Nav, Footer } from './components/Shared.jsx';
import { ScrollRay } from './components/ScrollRay.jsx';
import { Preloader } from './components/Preloader.jsx';

import { Hero, About } from './sections/Hero.jsx';
import { Services, Stats, Process, Industries } from './sections/Services.jsx';
import { Cases, Tech, Testimonials, CTA } from './sections/Cases.jsx';
import { AlliancesPage } from './sections/Alliances.jsx';

gsap.registerPlugin(ScrollTrigger);

const isTouchDevice = typeof window !== 'undefined'
  && (window.matchMedia('(hover: none) and (pointer: coarse)').matches
    || 'ontouchstart' in window);

function Cursor() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 500, damping: 28, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 500, damping: 28, mass: 0.4 });
  const rx = useSpring(mx, { stiffness: 120, damping: 22, mass: 0.6 });
  const ry = useSpring(my, { stiffness: 120, damping: 22, mass: 0.6 });
  const ringScale = useMotionValue(1);

  useEffect(() => {
    const onMove = (e) => { mx.set(e.clientX); my.set(e.clientY); };
    const onEnter = (e) => {
      const t = e.target.closest('a,button,[data-cursor="pointer"]');
      if (t) ringScale.set(2.2);
    };
    const onLeave = () => ringScale.set(1);
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
      <motion.div className="cursor-dot" style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999,
        width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
        x: sx, y: sy, translateX: '-50%', translateY: '-50%', mixBlendMode: 'screen',
      }} />
      <motion.div className="cursor-ring" style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9998,
        width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(46,232,180,0.55)',
        x: rx, y: ry, translateX: '-50%', translateY: '-50%', scale: ringScale,
      }} transition={{ scale: { type: 'spring', stiffness: 300, damping: 22 } }} />
    </>
  );
}

function App() {
  const [view, setView] = useState('home');
  const stampRef = useRef(null);
  const stampTextRef = useRef(null);

  useEffect(() => {
    const fit = () => {
      const el = stampTextRef.current;
      const cont = stampRef.current;
      if (!el || !cont) return;
      const avail = cont.clientWidth * 0.92;
      el.style.fontSize = '16px';
      const w = el.scrollWidth;
      if (w > 0) {
        const size = Math.floor(16 * avail / w);
        el.style.fontSize = Math.min(size, 180) + 'px';
      }
    };
    setTimeout(fit, 100);
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    if (view === 'alliances') {
      // Kill all scroll triggers only when entering Alliances to prevent pins from covering the screen
      ScrollTrigger.getAll().forEach(trigger => trigger.revert());
      ScrollTrigger.refresh();
    }
  }, [view]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    window.lenis = lenis;
    const ticker = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);
    return () => {
      lenis.destroy();
      gsap.ticker.remove(ticker);
    };
  }, []);

  return (
    <Fragment>
      <Preloader />
      {!isTouchDevice && <Cursor />}

      <div className="foot-stamp" ref={stampRef}>
        <span className="foot-stamp-text" ref={stampTextRef}>
          <span className="fst-bold">NEXIRA</span> <span className="fst-light">SPATIAL</span>
        </span>
      </div>

      <div className="page-content">
        <ScrollRay />
        <Nav onPageChange={setView} currentView={view} />

        {view === 'home' ? (
          <div key="home-view" className="home-content-wrap">
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
          </div>
        ) : (
          <AlliancesPage key="alliances-view" onBack={() => setView('home')} />
        )}

        <Footer />
      </div>

      <div className="foot-silhouette">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path d="M0,0 L1440,0 L1440,140 L0,140 Z" fill="#000" />
        </svg>
      </div>

      <div className="foot-spacer" />
    </Fragment>
  );
}

export default App;
