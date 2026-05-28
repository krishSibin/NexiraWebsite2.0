import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

/* ============================================================
   NEXIRA — hooks
   ============================================================ */

/* central scroll publisher */
const __scrollSubs = new Set();
let __scrollTicking = false;
function __pumpScroll() {
  if (__scrollTicking) return;
  __scrollTicking = true;
  requestAnimationFrame(() => {
    __scrollSubs.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    __scrollTicking = false;
  });
}
window.addEventListener('scroll', __pumpScroll, { passive: true });
window.addEventListener('resize', __pumpScroll);

function useScroll(fn) {
  useEffect(() => {
    __scrollSubs.add(fn);
    fn();
    return () => __scrollSubs.delete(fn);
  }, [fn]);
}

/* ---------- useIntersect ---------------------------------------- */
function useIntersect(opts = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { setInView(true); io.unobserve(e.target); }
        });
      },
      { threshold: opts.threshold ?? 0.15, rootMargin: opts.rootMargin ?? '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

/* ---------- Reveal ---------------------------------------------- */
const REVEAL_EASE = [0.16, 1, 0.3, 1];

function Reveal({ as: Tag = 'div', delay = 0, direction = 'up', className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });
  const MotionTag = motion[Tag] || motion.div;

  const hidden = {
    opacity: 0,
    y: direction === 'up' ? 40 : 0,
    x: direction === 'left' ? -60 : direction === 'right' ? 60 : 0,
    scale: direction === 'scale' ? 0.92 : 1,
  };
  const visible = { opacity: 1, y: 0, x: 0, scale: 1 };

  return (
    <MotionTag
      ref={ref}
      className={className}
      style={style}
      initial={hidden}
      animate={inView ? visible : hidden}
      transition={{ duration: 0.9, delay: delay / 1000, ease: REVEAL_EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/* ---------- SplitText ------------------------------------------- */
function SplitText({ text, mode = 'words', stagger, delay = 0, className = '', style, accentWord }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });
  const step = stagger != null ? stagger / 1000 : (mode === 'words' ? 0.06 : 0.028);

  const units = useMemo(() => {
    if (mode === 'chars') {
      return [...text].map((c, i) => ({ c, key: i, isSpace: c === ' ' }));
    }
    return text.split(/(\s+)/).filter(Boolean).map((w, i) => ({
      c: w, key: i, isSpace: /^\s+$/.test(w),
    }));
  }, [text, mode]);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: step, delayChildren: delay / 1000 } },
  };
  const itemVariants = {
    hidden:   { opacity: 0, y: '0.9em', rotate: 4 },
    visible:  { opacity: 1, y: 0, rotate: 0,
      transition: { duration: 0.7, ease: REVEAL_EASE } },
  };

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ display: 'inline-block', ...style }}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {units.map((u) => {
        if (u.isSpace) return <span key={u.key} style={{ display: 'inline-block', width: '0.28em' }} />;
        const isAccent = accentWord && u.c === accentWord;
        return (
          <motion.span
            key={u.key}
            variants={itemVariants}
            style={{
              display: 'inline-block',
              color: isAccent ? 'var(--accent)' : undefined,
            }}
          >
            {u.c}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

/* ---------- CountUp --------------------------------------------- */
function CountUp({ to, decimals = 0, suffix = '', duration = 1600 }) {
  const [ref, inView] = useIntersect();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const target = parseFloat(to);
    let raf;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setVal(target * e);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  const fmt = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return <span ref={ref}>{fmt}{suffix}</span>;
}

/* ---------- useParallax ----------------------------------------- */
function useParallax(speed = 0.2) {
  const ref = useRef(null);
  const fn = useCallback(() => {
    const el = ref.current; if (!el) return;
    const vh = window.innerHeight;
    const r = el.getBoundingClientRect();
    const center = r.top + r.height / 2;
    const delta = (center - vh / 2) / vh;
    const intensity = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--anim-intensity')) || 1;
    const y = -delta * speed * 140 * intensity;
    el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
  }, [speed]);
  useScroll(fn);
  return ref;
}

/* ---------- useScrollProgress ----------------------------------- */
function useScrollProgress() {
  const ref = useRef(null);
  const [p, setP] = useState(0);
  const fn = useCallback(() => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = el.offsetHeight - window.innerHeight;
    const v = Math.max(0, Math.min(1, -rect.top / Math.max(1, total)));
    setP(v);
  }, []);
  useScroll(fn);
  return [ref, p];
}

/* ---------- useElementScrollT ----------------------------------- */
function useElementScrollT() {
  const ref = useRef(null);
  const [t, setT] = useState(0);
  const fn = useCallback(() => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const start = vh * 0.85;
    const end = -rect.height + vh * 0.3;
    const v = Math.max(0, Math.min(1, (start - rect.top) / Math.max(1, (start - end))));
    setT(v);
  }, []);
  useScroll(fn);
  return [ref, t];
}

/* ---------- useTilt: mouse-driven 3D perspective tilt ----------- */
function useTilt(max = 10) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -max;
      const ry = (px - 0.5) * max;
      el.style.setProperty('--mx', (px * 100) + '%');
      el.style.setProperty('--my', (py * 100) + '%');
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 600);
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, [max]);
  return ref;
}

/* ---------- useMagnetic: spring-based cursor attraction --------- */
function useMagnetic(strength = 0.4) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.6 });

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = Math.max(r.width, r.height) * 1.2;
      if (dist < radius) {
        const force = (1 - dist / radius) * strength * 28;
        x.set(dx * force / radius);
        y.set(dy * force / radius);
      }
    };
    const onLeave = () => { x.set(0); y.set(0); };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [x, y, strength]);

  return { ref, sx, sy };
}

/* ---------- MaskReveal ------------------------------------------ */
function MaskReveal({ children, className = '', style }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' });

  return (
    <div ref={ref} className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      <motion.div
        initial={{ scale: 1.08 }}
        animate={inView ? { scale: 1 } : { scale: 1.08 }}
        transition={{ duration: 1.4, ease: REVEAL_EASE }}
        style={{ height: '100%' }}
      >
        {children}
      </motion.div>
      <motion.div
        initial={{ scaleY: 1 }}
        animate={inView ? { scaleY: 0 } : { scaleY: 1 }}
        transition={{ duration: 1.2, ease: REVEAL_EASE }}
        style={{
          position: 'absolute', inset: 0, background: 'var(--bg)',
          transformOrigin: 'bottom', zIndex: 2, pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export {
  useIntersect, useScroll, useParallax, useScrollProgress,
  useElementScrollT, useTilt, useMagnetic,
  Reveal, SplitText, CountUp, MaskReveal,
};
