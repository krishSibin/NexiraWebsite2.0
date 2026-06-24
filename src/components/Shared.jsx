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
      <path d="M0 1h15M0 5h11M0 9h15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function Eyebrow({ children, className = '', style }) {
  const defaultStyle = {
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent)',
    fontSize: 'clamp(18px, 2vw, 24px)',
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    fontWeight: 400,
    display: 'flex',
    alignItems: 'center',
    margin: 0,
  };
  return <span className={`eyebrow ${className}`} style={{ ...defaultStyle, ...style }}>{children}</span>;
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
const NAV_LINKS = ['about', 'services', 'process', 'industries', 'products', 'blog', 'alliances'];
const TRACKED_SECTIONS = [...NAV_LINKS, 'tech', 'why-choose-us', 'contact'];

const SECTION_LABELS = {
  'about': 'About Us',
  'services': 'Services',
  'process': 'Our Process',
  'industries': 'Industries',
  'products': 'Our Work',
  'tech': 'Tech Stack',
  'why-choose-us': 'Why Nexira',
  'blog': 'Field Notes',
  'alliances': 'Alliances',
  'contact': 'Connect'
};

function Nav({ onPageChange, currentView }) {
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
    TRACKED_SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const smoothScroll = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (e) e.preventDefault();
    setMenuOpen(false);
    if (window.lenis) {
      window.lenis.scrollTo(el);
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

      <AnimatePresence>
        {!scrolled && (
          <motion.a
            href="#top"
            onClick={(e) => { onPageChange?.('home'); smoothScroll(e, 'top'); }}
            className="fixed-brand-logo"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{
              position: 'fixed',
              zIndex: 1000,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '18px'
            }}
          >
            <img
              src="/circle%20logo.png"
              alt="Nexira Logo"
              style={{
                height: '90px',
                width: 'auto'
              }}
            />
          </motion.a>
        )}
      </AnimatePresence>

      <div className="nav-center">
        <motion.nav
          className={`nav${scrolled ? ' is-scrolled' : ''}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 1,
            y: 0,
            maxWidth: scrolled ? '1100px' : '1280px',
            backgroundColor: scrolled ? 'rgba(4,16,12,0.55)' : 'rgba(0,0,0,0)',
            backdropFilter: scrolled ? 'blur(48px) saturate(320%) brightness(1.08)' : 'blur(0px)',
            borderColor: scrolled ? 'rgba(46,232,180,0.28)' : 'rgba(229,231,235,0)',
            boxShadow: scrolled
              ? '0 8px 48px -8px rgba(0,0,0,0.75), 0 0 24px -8px rgba(46,232,180,0.08), inset 0 1px 0 rgba(46,232,180,0.35), inset 0 -1px 0 rgba(46,232,180,0.06)'
              : '0 0px 0px 0px rgba(0,0,0,0)',
          }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          {/* brand — scrolls to top; shows active section on mobile when scrolled */}
          <a className={`brand${scrolled && activeSection ? ' brand--section' : ''}`} href="#top" onClick={(e) => { onPageChange?.('home'); smoothScroll(e, 'top'); }}>
            {scrolled && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="wm"
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}
              >
                <span className="wm-nexira">NEXIRA</span>
                <small className="wm-spatial">SPATIAL</small>
                {(currentView === 'alliances' ? 'alliances' : activeSection) && (
                  <span className="wm-sec">
                    {SECTION_LABELS[currentView === 'alliances' ? 'alliances' : activeSection] || activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                  </span>
                )}
              </motion.div>
            )}
          </a>

          <div className="nav-links">
            {NAV_LINKS.map(id => (
              <a
                key={id}
                href={id === 'blog' || id === 'alliances' ? '#' : `#${id}`}
                onClick={(e) => {
                  if (id === 'blog') { e.preventDefault(); return; }
                  if (id === 'alliances') { e.preventDefault(); onPageChange?.('alliances'); setMenuOpen(false); return; }
                  onPageChange?.('home');
                  smoothScroll(e, id);
                }}
                style={id === 'blog' ? { cursor: 'default' } : undefined}
              >
                {id === 'about' ? 'About Us' : id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
          </div>

          {/* desktop cta */}
          <div className="nav-right">
            <a className="nav-cta" href="#contact" onClick={(e) => smoothScroll(e, 'contact')}>
              Contact Us
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
                  <img src="/circle%20logo.png" alt="Logo" className="nav-logo" style={{ height: '48px' }} />
                  <button className="nsd-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <nav className="nsd-links">
                  {NAV_LINKS.map((id, i) => (
                    <motion.a
                      key={id}
                      href={id === 'blog' || id === 'alliances' ? '#' : `#${id}`}
                      onClick={(e) => {
                        if (id === 'blog') { e.preventDefault(); return; }
                        if (id === 'alliances') { e.preventDefault(); onPageChange?.('alliances'); setMenuOpen(false); return; }
                        onPageChange?.('home');
                        smoothScroll(e, id);
                      }}
                      initial={{ opacity: 0, x: 28 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 + 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="nsd-num">0{i + 1}</span>
                      <span className="nsd-label">{id === 'about' ? 'About Us' : id.charAt(0).toUpperCase() + id.slice(1)}</span>
                      <svg className="nsd-arrow" width="13" height="10" viewBox="0 0 13 10" fill="none">
                        <path d="M1 5h11M7 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.a>
                  ))}
                </nav>

                {/* Footer */}
                <div className="nsd-foot">
                  <a className="nsd-cta" href="#contact" onClick={(e) => smoothScroll(e, 'contact')}>
                    Contact Us
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence >,
        document.body
      )
      }
    </>
  );
}

/* ── FOOTER ── */
const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/nexira-spatial/', d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { label: 'Instagram', href: 'https://www.instagram.com/nexiraspatial/', d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61585941132696', d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
];

function Footer() {
  return (
    <footer>
      <div className="foot-top">
        <div className="foot-brand">
          <img src="/logo.png?v=3" alt="Nexira Spatial" className="foot-logo" />
          <div className="foot-socials">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="foot-social-link" aria-label={s.label}>
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
            <li><a href="#about" onClick={(e) => { e.preventDefault(); const el = document.getElementById('about'); if (el) window.lenis?.scrollTo(el); }}>About</a></li>
            <li><a href="#products" onClick={(e) => { e.preventDefault(); const el = document.getElementById('products'); if (el) window.lenis?.scrollTo(el); }}>Products</a></li>
            <li><a href="#" onClick={(e) => e.preventDefault()}>Field Notes</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); const el = document.getElementById('contact'); if (el) window.lenis?.scrollTo(el); }}>Careers</a></li>
          </ul>
        </div>
        <div className="foot-col">
          <h6>Contact</h6>
          <ul>
            <li><a href="mailto:info@nexiraspatial.com">info@nexiraspatial.com</a></li>
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
