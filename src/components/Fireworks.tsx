/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  gravity: number;
  trail: { x: number; y: number }[];
}

interface Spark {
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  exploded: boolean;
}

interface FireworksProps {
  isActive: boolean;
  intensity?: 'high' | 'normal' | 'low';
}

export function Fireworks({ isActive, intensity = 'normal' }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let sparks: Spark[] = [];
    let particles: Particle[] = [];

    const colors = [
      '#F43F5E', // Rose pink
      '#EC4899', // Hot Pink
      '#D946EF', // Fuchsia
      '#A855F7', // Magenta Purple
      '#8B5CF6', // Purple-Violet
      '#FBBF24', // Delicate Gold
      '#34D399', // Soft Mint
      '#38BDF8'  // Soft Cyan
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const createExplosion = (x: number, y: number, color: string) => {
      const particleCount = intensity === 'high' ? 80 : intensity === 'normal' ? 50 : 25;
      
      const isHeartShape = Math.random() > 0.4; // 60% chance of standard star shell, 40% of heart shells!

      for (let i = 0; i < particleCount; i++) {
        let vx = 0;
        let vy = 0;

        if (isHeartShape) {
          // Heart path equation plotted inside vector velocities
          const t = (i / particleCount) * Math.PI * 2;
          const scale = (Math.random() * 0.4 + 0.8) * 4;
          vx = scale * (16 * Math.pow(Math.sin(t), 3)) / 12;
          vy = -scale * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) / 12;
        } else {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5 + 2;
          vx = Math.sin(angle) * speed;
          vy = Math.cos(angle) * speed;
        }

        particles.push({
          x,
          y,
          vx,
          vy,
          color,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.008,
          size: Math.random() * 2 + 1.2,
          gravity: 0.08,
          trail: []
        });
      }
    };

    const spawnSpark = () => {
      const x = Math.random() * (canvas.width - 200) + 100;
      const y = canvas.height;
      const targetY = Math.random() * (canvas.height * 0.5) + canvas.height * 0.1;
      const vy = -(Math.random() * 6 + 7);
      const color = colors[Math.floor(Math.random() * colors.length)];

      sparks.push({
        x,
        y,
        targetY,
        vy,
        color,
        exploded: false
      });
    };

    let frame = 0;
    const interval = intensity === 'high' ? 15 : intensity === 'normal' ? 30 : 60;

    const render = () => {
      frame++;
      // Semi-transparent overlay to create beautiful particle dragging trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (frame % interval === 0) {
        spawnSpark();
      }

      // Update rockets
      sparks.forEach((s, idx) => {
        s.y += s.vy;
        
        // Draw ascending sparkles
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = s.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        if (s.y <= s.targetY) {
          s.exploded = true;
          createExplosion(s.x, s.y, s.color);
        }
      });
      sparks = sparks.filter((s) => !s.exploded);

      // Update particles
      particles.forEach((p) => {
        // Gravitational drag
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        // Remember trail coordinates
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();

        // Draw particle trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.lineWidth = p.size;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Draw active head
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });
      particles = particles.filter((p) => p.alpha > 0);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [isActive, intensity]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      id="fireworks-canvas"
    />
  );
}
