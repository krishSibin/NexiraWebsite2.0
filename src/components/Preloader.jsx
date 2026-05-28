import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EASE_OUT   = [0.16, 1, 0.3, 1];
const EASE_SPLIT = [0.77, 0, 0.18, 1];

const STAGES = [
  { word: 'IDEA',    from: 0  },
  { word: 'PROCESS', from: 35 },
  { word: 'NEXIRA',  from: 68 },
];

function getStage(pct) {
  let s = STAGES[0];
  for (const stage of STAGES) if (pct >= stage.from) s = stage;
  return s;
}

function MorphWord({ word, isNexira }) {
  return (
    <div className={`pl-word${isNexira ? ' pl-word--brand' : ''}`}>
      {[...word].map((char, i) => (
        <AnimatePresence key={i} mode="wait">
          <motion.span
            key={word + i}
            className="pl-char"
            data-char={char}
            initial={{ opacity: 0, y: 22,  filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0,   filter: 'blur(0px)'  }}
            exit={{    opacity: 0, y: -18,  filter: 'blur(10px)' }}
            transition={{ duration: 0.26, delay: i * 0.042, ease: EASE_OUT }}
            style={{ display: 'inline-block', '--char-delay': `${i * 0.042}s` }}
          >
            {char}
          </motion.span>
        </AnimatePresence>
      ))}
    </div>
  );
}

function Preloader() {
  const [mounted] = useState(() => {
    try { return !sessionStorage.getItem('nexira-pl-shown'); }
    catch { return true; }
  });

  const [pct,    setPct]    = useState(0);
  const [fading, setFading] = useState(false);
  const [split,  setSplit]  = useState(false);
  const [gone,   setGone]   = useState(false);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.overflow = 'hidden';
  }, [mounted]);

  useEffect(() => {
    if (fading) document.documentElement.style.overflow = '';
  }, [fading]);

  useEffect(() => {
    if (!mounted) return;
    const dur = 4200;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      setPct(Math.round(t * (2 - t) * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPct(100);
        setTimeout(() => {
          setFading(true);
          setTimeout(() => setSplit(true), 300);
          setTimeout(() => {
            setGone(true);
            try { sessionStorage.setItem('nexira-pl-shown', '1'); } catch {}
          }, 1200);
        }, 700);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  if (!mounted || gone) return null;

  const stage    = getStage(pct);
  const isNexira = stage.word === 'NEXIRA';

  return (
    <div className="pl-root" aria-hidden="true">

      <motion.div className="pl-panel pl-panel-top"
        animate={{ y: split ? '-101%' : 0 }}
        transition={{ duration: 0.92, ease: EASE_SPLIT }}
      />
      <motion.div className="pl-panel pl-panel-bot"
        animate={{ y: split ? '101%' : 0 }}
        transition={{ duration: 0.92, ease: EASE_SPLIT }}
      />

      <motion.div className="pl-content"
        animate={{ opacity: fading ? 0 : 1 }}
        transition={{ duration: 0.28 }}
      >
        {/* top bar */}
        <div className="pl-bar">
          <motion.span className="pl-mono pl-dim"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            NEXIRA · SPATIAL
          </motion.span>
          <motion.span className="pl-mono pl-dim"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            {String(pct).padStart(3, '0')} %
          </motion.span>
        </div>

        {/* center */}
        <div className="pl-stage">
          <MorphWord word={stage.word} isNexira={isNexira} />

          <AnimatePresence>
            {isNexira && (
              <motion.p className="pl-spatial-text"
                initial={{ opacity: 0, letterSpacing: '0.06em' }}
                animate={{ opacity: 1, letterSpacing: '0.58em' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: EASE_OUT }}
              >
                SPATIAL
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!isNexira && (
              <motion.span key={stage.word + '_label'} className="pl-stage-label"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                {stage.word === 'IDEA'    && 'every project begins with one'}
                {stage.word === 'PROCESS' && 'engineered with precision'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* bottom info only */}
        <div className="pl-bottom">
          <div className="pl-bar">
            <span className="pl-mono pl-dim">SAT-LINK · <span className="pl-accent">STABLE</span></span>
            <span className="pl-mono pl-dim">SYSTEM v6.2</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

export { Preloader };
