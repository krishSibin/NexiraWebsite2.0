import { useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';

export function AlliancesPage({ onBack }) {
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;

        if (window.lenis) {
            window.lenis.scrollTo(0, { immediate: true, force: true });
            const timer = setTimeout(() => {
                window.lenis.scrollTo(0, { immediate: true, force: true });
                window.lenis.resize();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <section ref={containerRef} className="alliances-page" style={{
            minHeight: '100vh',
            background: '#000',
            color: '#fff',
            position: 'relative',
            zIndex: 1000,
            overflowX: 'hidden',
            display: 'block'
        }}>
            {/* Grid Pattern */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(ellipse at center, black, transparent 90%)',
                opacity: 0.5,
                pointerEvents: 'none'
            }} />

            <div className="wrap" style={{
                paddingTop: '0px',
                paddingBottom: '60px',
                position: 'relative',
                zIndex: 10,
                maxWidth: '1200px',
                margin: '0 auto',
                paddingLeft: 'var(--gutter)',
                paddingRight: 'var(--gutter)'
            }}>

                {/* Back Button - Fixed Top Left */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={onBack}
                    className="btn-ghost"
                    style={{
                        position: 'fixed',
                        top: '15px',
                        left: '15px',
                        zIndex: 2000,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '9px',
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        width: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <span style={{ fontSize: '11px' }}>←</span> HOME
                </motion.button>

                {/* Hero Header */}
                <div style={{ marginBottom: '20px', textAlign: 'center', marginTop: '-30px' }}>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            fontSize: 'clamp(48px, 10vw, 110px)',
                            lineHeight: 0.85,
                            fontFamily: '"Big Shoulders Display", sans-serif',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            color: '#fff',
                            marginBottom: '32px'
                        }}
                    >
                        Nexira <br />
                        <span style={{ color: 'rgba(46, 232, 180, 0.4)', fontSize: '0.6em', verticalAlign: 'middle', display: 'block', margin: '4px 0' }}>×</span>
                        <span style={{ background: 'linear-gradient(90deg, #fff, #2ee8b4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dot Cube Labs</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            fontSize: 'clamp(16px, 1.4vw, 20px)',
                            maxWidth: '650px',
                            lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.65)',
                            margin: '0 auto'
                        }}
                    >
                        Empowering the next generation of geospatial infrastructure. A joint venture dedicated to pioneering high-performance cloud solutions and AI-driven spatial intelligence.
                    </motion.p>
                </div>

                {/* Feature Grid - Restored Simpler Style */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '24px',
                    marginBottom: '80px'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '40px',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <h3 style={{ marginBottom: '20px', color: '#2ee8b4', fontSize: '24px', fontFamily: '"Outfit", sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>The Partnership</h3>
                        <p style={{ opacity: 0.6, fontSize: '16px', lineHeight: 1.7, color: '#fff' }}>
                            By combining Nexira's deep domain expertise in GIS and remote sensing with Dot Cube Labs' cutting-edge cloud engineering, we deliver scalable solutions that transform raw data into actionable intelligence.
                        </p>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '40px',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <h3 style={{ marginBottom: '20px', color: '#2ee8b4', fontSize: '24px', fontFamily: '"Outfit", sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capabilities</h3>
                        <ul style={{ paddingLeft: '20px', opacity: 0.6, fontSize: '16px', lineHeight: 1.8, color: '#fff' }}>
                            <li style={{ marginBottom: '8px' }}>Cloud-Native Geospatial Pipelines</li>
                            <li style={{ marginBottom: '8px' }}>Real-time Earth Observation Data</li>
                            <li style={{ marginBottom: '8px' }}>AI-Enhanced Land Analysis</li>
                            <li style={{ marginBottom: '8px' }}>Sustainable Digital Infrastructure</li>
                        </ul>
                    </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <a href="https://dotcubelabs.com/" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none' }}>
                        VISIT DOT CUBE LABS
                    </a>
                </div>
            </div>
        </section>
    );
}
