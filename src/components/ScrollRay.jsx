import { useRef, useEffect } from 'react';

export function ScrollRay() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, dpr, time = 0;

    /* live state that persists across frames */
    let dispX = 0;   // displayed head X (lerped)
    let dispY = 0;   // displayed head Y (lerped)
    let velY = 0;   // smoothed velocity (px/frame)
    let prevTgtY = 0;
    let initiated = false;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const sY = window.scrollY;
      time += 0.016;

      ctx.clearRect(0, 0, W, H);

      const maxScroll = document.documentElement.scrollHeight - H;
      const progress = maxScroll > 0 ? sY / maxScroll : 0;

      const fadeIn = Math.min(1, progress / 0.015);
      if (fadeIn < 0.01) { raf = requestAnimationFrame(render); return; }

      /* ── SVG destination (stable absolute Y) ── */
      const procTrack = document.querySelector('.process-track');
      let svgAbsY = maxScroll * 0.72;
      let svgViewX = W / 2;
      if (procTrack) {
        const r = procTrack.getBoundingClientRect();
        svgAbsY = r.top + sY + 60;
        // On narrow viewports the process section is always full-width → keep center
        svgViewX = W < 900 ? W / 2 : r.left + r.width / 2;
      }

      const arrivalScroll = Math.max(1, svgAbsY - H * 0.55);
      const beamT = Math.max(0, Math.min(1, sY / arrivalScroll));

      /* ── Target position (what scroll says it should be) ── */
      const tgtX = W * 0.5 + (svgViewX - W * 0.5) * beamT;
      const tgtY = beamT * svgAbsY - sY;

      /* ── Seed on first visible frame so there's no initial snap ── */
      if (!initiated) { dispX = tgtX; dispY = tgtY; initiated = true; }

      /* ── Velocity: smoothed frame-to-frame delta of target ── */
      const rawVel = tgtY - prevTgtY;
      velY = velY * 0.72 + rawVel * 0.28;   // exponential smoothing
      prevTgtY = tgtY;

      /* ── Lerp display toward target — this creates the lag/momentum ── */
      const lerpK = 0.10;                        // 10% per frame ≈ natural drift
      dispX += (tgtX - dispX) * lerpK;
      dispY += (tgtY - dispY) * lerpK;

      const headVX = dispX;
      const headVY = dispY;

      /* ── Trail: stretches with speed, always vertical ── */
      const speed = Math.abs(velY);
      const trailLen = 120 + speed * 6 + beamT * 80;   // longer when fast
      const tailVX = headVX;
      const tailVY = headVY - trailLen;

      /* ── Alpha ── */
      const fadeOut = Math.max(0, (beamT - 0.88) / 0.12);
      const alpha = fadeIn * (1 - fadeOut);
      if (alpha < 0.01) { raf = requestAnimationFrame(render); return; }

      /* ── Brightness boost when moving fast ── */
      const speedBoost = Math.min(speed * 0.012, 0.3);

      ctx.save();
      ctx.globalAlpha = alpha;

      /* ── Blue beam layers ── */
      const draw = (w, c0, c1) => {
        const g = ctx.createLinearGradient(tailVX, tailVY, headVX, headVY);
        g.addColorStop(0, c0);
        g.addColorStop(1, c1);
        ctx.beginPath();
        ctx.moveTo(tailVX, tailVY);
        ctx.lineTo(headVX, headVY);
        ctx.strokeStyle = g;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.stroke();
      };

      draw(10, 'rgba(30,90,255,0)', `rgba(30,90,255,${0.10 + speedBoost})`);
      draw(4, 'rgba(70,130,255,0)', `rgba(70,130,255,${0.38 + speedBoost})`);
      draw(1.4, 'rgba(190,215,255,0)', `rgba(210,230,255,${0.95})`);

      /* ── Tip bloom — pulses subtly, flares with speed ── */
      const pulse = 1 + 0.07 * Math.sin(time * 5.5);
      const orbR = (5 + beamT * 3 + speed * 0.15) * pulse;
      const orb = ctx.createRadialGradient(headVX, headVY, 0, headVX, headVY, orbR * 2.5);
      orb.addColorStop(0, `rgba(220,235,255,${0.88 + speedBoost})`);
      orb.addColorStop(0.3, `rgba(80,130,255,${0.30 + speedBoost * 0.5})`);
      orb.addColorStop(1, 'rgba(30,80,255,0)');
      ctx.beginPath();
      ctx.arc(headVX, headVY, orbR * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = orb;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(headVX, headVY, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ddeeff';
      ctx.fill();

      ctx.restore();
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
