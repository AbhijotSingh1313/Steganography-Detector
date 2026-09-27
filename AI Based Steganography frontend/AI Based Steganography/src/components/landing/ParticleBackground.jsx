import React, { useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────
   StegXplore logo colours:
     Violet:  139,92,246  |  Lavender: 167,139,250  |  Deep purple: 124,58,237
     Orange:  255,126,29  |  Warm orange: 255,158,36  |  Indigo: 99,102,241
   ───────────────────────────────────────────────────────────── */
const PALETTES = {
  /* Falling data-packet snow — violet + logo orange mix */
  download: {
    dark:  ['167,139,250','139,92,246','255,126,29','255,158,36','196,181,253'],
    light: ['124,58,237', '109,40,217','234,88,12', '255,126,29','139,92,246'],
  },
  /* Floating network constellation — violet + indigo */
  features: {
    dark:  ['167,139,250','139,92,246','99,102,241','196,181,253','192,132,252'],
    light: ['124,58,237', '109,40,217','79,70,229', '139,92,246', '79,70,229'],
  },
  /* Dual-colour floating dots — emerald + violet (security palette) */
  security: {
    dark:  ['52,211,153','34,197,94','167,139,250','139,92,246','52,211,153'],
    light: ['5,150,105', '4,120,87', '109,40,217', '124,58,237','5,150,105'],
  },
  /* Browser forensics — violet + indigo + soft blue */
  webapp: {
    dark:  ['139,92,246','99,102,241','167,139,250','129,140,248','196,181,253'],
    light: ['79,70,229', '99,102,241','109,40,217', '139,92,246', '79,70,229'],
  },
  /* Home overview — full logo palette: violet + orange + lavender */
  home: {
    dark:  ['167,139,250','139,92,246','255,126,29','255,158,36','192,132,252'],
    light: ['124,58,237', '109,40,217','234,88,12', '255,126,29','139,92,246'],
  },
};

const COUNT  = { download: 62, features: 72, security: 58, webapp: 60, home: 70 };

function makeParticle(canvas, variant) {
  const falling = variant === 'download';
  const palette = PALETTES[variant];
  const colLen  = palette.dark.length;
  return {
    x: Math.random() * canvas.width,
    y: falling ? Math.random() * canvas.height - 20 : Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * (falling ? 0.28 : 0.42),
    vy: falling ? Math.random() * 0.65 + 0.22 : (Math.random() - 0.5) * 0.48,
    /* slightly thicker particles */
    r:  Math.random() < 0.2 ? Math.random() * 2.4 + 1.2 : Math.random() * 1.4 + 0.5,
    isSquare: variant === 'download' && Math.random() < 0.20,
    colIdx:   Math.floor(Math.random() * colLen),
    pulseOff: Math.random() * Math.PI * 2,
    pulseSp:  0.016 + Math.random() * 0.018,
    /* START at 50% max-opacity so they appear INSTANTLY on tab switch */
    opacity:  0.28,
  };
}

function rgb(variant, dark, idx) {
  return PALETTES[variant][dark ? 'dark' : 'light'][idx];
}

/* thin connecting lines (features & webapp only) */
function drawLinks(ctx, particles, dark) {
  const MAX = 120;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < MAX) {
        ctx.globalAlpha = (1 - d / MAX) * (dark ? 0.15 : 0.10);
        ctx.strokeStyle = dark ? 'rgba(167,139,250,1)' : 'rgba(109,40,217,1)';
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

/* ═══════════════════════════════════════════════════════════ */
export default function ParticleBackground({ variant = 'download' }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const dataRef   = useRef({ particles: [] });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      dataRef.current.particles = Array.from(
        { length: COUNT[variant] },
        () => makeParticle(canvas, variant),
      );
    };
    onResize();
    window.addEventListener('resize', onResize);

    /* re-fade (keep positions) when theme changes */
    const observer = new MutationObserver(() => {
      dataRef.current.particles.forEach(p => { p.opacity = 0.28; });
    });
    observer.observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme'],
    });

    const loop = () => {
      const { particles } = dataRef.current;
      const dark    = isDark();
      /* lower max opacity for subtlety */
      const maxOp   = dark ? 0.68 : 0.44;
      const falling = variant === 'download';

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        /* faster fade-in: reach full opacity in ~1 second */
        if (p.opacity < maxOp) p.opacity = Math.min(maxOp, p.opacity + 0.012);

        p.pulseOff += p.pulseSp;
        const alpha = p.opacity * (0.78 + 0.22 * Math.sin(p.pulseOff));

        p.x += p.vx;
        p.y += p.vy;

        if (falling) {
          if (p.y > canvas.height + 8) { p.y = -8; p.x = Math.random() * canvas.width; }
          if (p.x < -4) p.x = canvas.width + 4;
          if (p.x > canvas.width + 4) p.x = -4;
        } else {
          if (p.x < -4) p.x = canvas.width + 4;
          if (p.x > canvas.width + 4) p.x = -4;
          if (p.y < -4) p.y = canvas.height + 4;
          if (p.y > canvas.height + 4) p.y = -4;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle   = `rgba(${rgb(variant, dark, p.colIdx)},1)`;
        if (p.isSquare) {
          ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
      if (variant === 'features' || variant === 'webapp') {
        drawLinks(ctx, particles, dark);
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}