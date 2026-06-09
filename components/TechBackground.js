'use client';
import { useEffect, useRef } from 'react';

const SYMBOL_CONFIG = [
  { sym: '01',    x: '4%',  y: '18%', dur: '9s',  delay: '0s',   violet: false },
  { sym: '//',    x: '14%', y: '68%', dur: '12s', delay: '-3s',  violet: true  },
  { sym: '{ }',  x: '24%', y: '38%', dur: '10s', delay: '-5s',  violet: false },
  { sym: '</>',  x: '41%', y: '82%', dur: '14s', delay: '-2s',  violet: true  },
  { sym: '&&',   x: '58%', y: '12%', dur: '11s', delay: '-7s',  violet: false },
  { sym: '=>',   x: '71%', y: '52%', dur: '13s', delay: '-1s',  violet: true  },
  { sym: 'fn()', x: '83%', y: '28%', dur: '9s',  delay: '-4s',  violet: false },
  { sym: 'async',x: '89%', y: '72%', dur: '15s', delay: '-6s',  violet: true  },
  { sym: '0xff', x: '33%', y: '57%', dur: '12s', delay: '-8s',  violet: false },
  { sym: 'git',  x: '51%', y: '44%', dur: '8s',  delay: '-9s',  violet: true  },
  { sym: 'null', x: '7%',  y: '85%', dur: '11s', delay: '-2s',  violet: false },
  { sym: 'λ',    x: '78%', y: '88%', dur: '10s', delay: '-5s',  violet: true  },
];

export default function TechBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let rafId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();

    const COUNT = window.innerWidth < 768 ? 35 : 65;
    const DIST = 155;

    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.5 + 0.5,
      cyan: Math.random() > 0.38,
      a: Math.random() * 0.35 + 0.1,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.cyan
          ? `rgba(0,240,255,${p.a})`
          : `rgba(138,43,226,${p.a})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,240,255,${(1 - d / DIST) * 0.11})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div className="tech-grid-overlay" aria-hidden="true" />

      <div className="tech-symbols" aria-hidden="true">
        {SYMBOL_CONFIG.map(({ sym, x, y, dur, delay, violet }, i) => (
          <span
            key={i}
            className="tech-symbol"
            style={{
              left: x,
              top: y,
              animationDuration: dur,
              animationDelay: delay,
              color: violet ? 'var(--neon-violet)' : 'var(--neon-cyan)',
              textShadow: violet
                ? '0 0 10px rgba(138,43,226,0.6)'
                : '0 0 10px rgba(0,240,255,0.6)',
            }}
          >
            {sym}
          </span>
        ))}
      </div>
    </>
  );
}
