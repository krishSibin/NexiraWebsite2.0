import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMagnetic } from '../hooks/index.jsx';

/* ============================================================
   NEXIRA — shared UI components
   ============================================================ */

function MenuIcon() {
  return (
    <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden="true">
      <path d="M0 1h15M0 5h11M0 9h15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function Eyebrow({ children, className = '', style }) {
  return <span className={`eyebrow ${className}`} style={style}>{children}</span>;
}

/* ── Magnetic button wrapper ── */
function MagBtn({ children, href = '#', className = '', as: Tag = 'a', ...rest }) {
  const { ref, sx, sy } = useMagnetic(0.38);
  return (
    <motion.div ref={ref} style={{ display: 'inline-block', x: sx, y: sy }}>
      <Tag href={href} className={className} {...rest}>{children}</Tag>
    </motion.div>
  );
}

function BtnPrimary({ children, href = '#', as: Tag = 'a', ...rest }) {
  return (
    <MagBtn href={href} className="btn-primary" as={Tag} {...rest}>
      {children}
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </MagBtn>
  );
}

function BtnGhost({ children, href = '#', as: Tag = 'a', ...rest }) {
  return (
    <MagBtn href={href} className="btn-ghost" as={Tag} {...rest}>
      {children}
    </MagBtn>
  );
}

/* ── NAV ── */
const NAV_LINKS = ['services', 'process', 'cases', 'industries', 'contact'];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const check = () => {
      const heroWrap = document.querySelector('.hero-wrap');
      if (!heroWrap) { setScrolled(window.scrollY > window.innerHeight - 60); return; }
      /* GSAP wraps the pinned element in a .pin-spacer div whose height = full scroll distance */
      const parent = heroWrap.parentElement;
      const container = parent?.classList.contains('pin-spacer') ? parent : heroWrap;
      const threshold = container.offsetTop + container.offsetHeight - 60;
      setScrolled(window.scrollY > threshold);
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    check();
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  /* Track active section for mobile brand label */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 }
    );
    NAV_LINKS.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const smoothScroll = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    setMenuOpen(false);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* Mobile hamburger — single fixed element, never moves */}
      <button
        className="nav-float-ham"
        aria-label="Open menu"
        onClick={() => setMenuOpen(v => !v)}
      >
        <MenuIcon />
      </button>

      <div className="nav-center">
      <motion.nav
        className={`nav${scrolled ? ' is-scrolled' : ''}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: 1,
          y: 0,
          maxWidth: scrolled ? '860px' : '1160px',
          backgroundColor: scrolled ? 'rgba(4,16,12,0.55)' : 'rgba(0,0,0,0)',
          backdropFilter: scrolled ? 'blur(48px) saturate(320%) brightness(1.08)' : 'blur(0px)',
          borderColor: scrolled ? 'rgba(46,232,180,0.28)' : 'rgba(229,231,235,0)',
          boxShadow: scrolled
            ? '0 8px 48px -8px rgba(0,0,0,0.75), 0 0 24px -8px rgba(46,232,180,0.08), inset 0 1px 0 rgba(46,232,180,0.35), inset 0 -1px 0 rgba(46,232,180,0.06)'
            : '0 0px 0px 0px rgba(0,0,0,0)',
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 18, mass: 0.9 }}
      >
        {/* brand — scrolls to top; shows active section on mobile when scrolled */}
        <a className={`brand${scrolled && activeSection ? ' brand--section' : ''}`} href="#top" onClick={(e) => smoothScroll(e, 'top')}>
          <div className="wm">
            <span className="wm-nexira">NEXIRA</span>
            <small className="wm-spatial">SPATIAL</small>
            <span className="wm-sec">{activeSection ? activeSection.charAt(0).toUpperCase() + activeSection.slice(1) : ''}</span>
          </div>
        </a>

        {/* desktop links */}
        <div className="nav-links">
          {NAV_LINKS.map(id => (
            <a key={id} href={`#${id}`} onClick={(e) => smoothScroll(e, id)}>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
        </div>

        {/* desktop cta */}
        <div className="nav-right">
          <a className="nav-cta" href="#contact" onClick={(e) => smoothScroll(e, 'contact')}>
            Connect Now
          </a>
        </div>

      </motion.nav>
      </div>

      {/* mobile sidebar — portalled to body so it's above all stacking contexts */}
      {createPortal(
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                className="nav-sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                className="nav-sidebar"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {/* Header */}
                <div className="nsd-head">
                  <div className="nsd-brand">
                    <span>NEXIRA</span>
                    <small>SPATIAL</small>
                  </div>
                  <button className="nsd-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {/* Links */}
                <nav className="nsd-links">
                  {NAV_LINKS.map((id, i) => (
                    <motion.a
                      key={id}
                      href={`#${id}`}
                      onClick={(e) => smoothScroll(e, id)}
                      initial={{ opacity: 0, x: 28 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 + 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="nsd-num">0{i + 1}</span>
                      <span className="nsd-label">{id.charAt(0).toUpperCase() + id.slice(1)}</span>
                      <svg className="nsd-arrow" width="13" height="10" viewBox="0 0 13 10" fill="none">
                        <path d="M1 5h11M7 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.a>
                  ))}
                </nav>

                {/* Footer */}
                <div className="nsd-foot">
                  <a className="nsd-cta" href="#contact" onClick={(e) => smoothScroll(e, 'contact')}>
                    Connect Now
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

/* ── FOOTER ── */
const SOCIALS = [
  { label: 'LinkedIn', d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { label: 'Twitter / X', d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { label: 'GitHub', d: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' },
];

function Footer() {
  return (
    <footer>
      <div className="foot-top">
        <div className="foot-brand">
          <img src="/logo.png" alt="Nexira Spatial" className="foot-logo" />
          <div className="foot-socials">
            {SOCIALS.map((s) => (
              <a key={s.label} href="#" className="foot-social-link" aria-label={s.label}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={s.d} /></svg>
              </a>
            ))}
          </div>
        </div>
        <div className="foot-col">
          <h6>Practice</h6>
          <ul>
            <li><a href="#services">Web GIS & Mapping</a></li>
            <li><a href="#services">Remote Sensing & Analytics</a></li>
            <li><a href="#services">Training & Internships</a></li>
            <li><a href="#process">Our Process</a></li>
          </ul>
        </div>
        <div className="foot-col">
          <h6>Company</h6>
          <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#cases">Sample Work</a></li>
            <li><a href="#blog">Field Notes</a></li>
            <li><a href="#contact">Careers</a></li>
          </ul>
        </div>
        <div className="foot-col">
          <h6>Contact</h6>
          <ul>
            <li><a href="mailto:nexiraspatial@gmail.com">nexiraspatial@gmail.com</a></li>
            <li><a href="tel:+917736459090">+91 7736459090</a></li>
            <li>North Kalamassery, Kochi</li>
            <li>Kerala 683104 · IN</li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        <div>© 2026 Nexira Spatial · All rights reserved</div>
      </div>
    </footer>
  );
}

export { Eyebrow, BtnPrimary, BtnGhost, Nav, Footer };
