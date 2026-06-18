/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'heart';
  rotation: number;
  rotationSpeed: number;
  vx: number;
  vy: number;
}

interface ConfettiProps {
  isActive: boolean;
}

export function Confetti({ isActive }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let pieces: ConfettiPiece[] = [];

    const colors = [
      '#FF8A9F', // Pastel pink
      '#FFD275', // Golden yellow
      '#D2B4DE', // Light lavender
      '#F1948A', // Soft red
      '#AED6F1', // Baby blue
      '#A9DFBF', // Sage green
      '#FADBD8', // Blush pink
      '#FCF3CF'  // Warm cream
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const initConfetti = () => {
      pieces = [];
      const count = 180;
      for (let i = 0; i < count; i++) {
        const shapeRand = Math.random();
        const shape = shapeRand < 0.4 ? 'circle' : shapeRand < 0.7 ? 'square' : 'heart';
        pieces.push({
          x: Math.random() * canvas.width,
          y: Math.random() * -canvas.height - 20,
          size: Math.random() * 12 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 3 + 2
        });
      }
    };

    initConfetti();

    // Draw little custom heart shapes
    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.beginPath();
      c.moveTo(x, y + size / 4);
      c.quadraticCurveTo(x, y, x + size / 2, y);
      c.quadraticCurveTo(x + size, y, x + size, y + size / 3);
      c.quadraticCurveTo(x + size, y + (size * 2) / 3, x + size / 2, y + size);
      c.quadraticCurveTo(x, y + (size * 2) / 3, x, y + size / 3);
      c.quadraticCurveTo(x, y, x, y + size / 4);
      c.closePath();
      c.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.rotation += p.rotationSpeed;

        // Sideways gentle winding wave
        p.vx += Math.sin(p.y / 30) * 0.05;

        // Loop pieces to top if they fall off the frame
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
          p.vy = Math.random() * 3 + 2;
          p.vx = (Math.random() - 0.5) * 3;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'heart') {
          drawHeart(ctx, -p.size / 2, -p.size / 2, p.size);
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      id="confetti-canvas"
    />
  );
}
