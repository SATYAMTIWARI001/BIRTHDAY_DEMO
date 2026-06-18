/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  vx: number;
  vy: number;
  opacity: number;
}

export function CursorTrail() {
  const [particles, setParticles] = useState<HeartParticle[]>([]);

  useEffect(() => {
    // Disable trail on touch devices to ensure beautiful mobile performance
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    let particleId = 0;
    const colors = [
      'rgba(244, 63, 94, 0.7)',  // Rose pink
      'rgba(236, 72, 153, 0.7)', // Pink
      'rgba(217, 70, 239, 0.7)', // Fuchsia
      'rgba(168, 85, 247, 0.7)', // Purple
      'rgba(139, 92, 246, 0.7)', // Violet
      'rgba(251, 191, 36, 0.6)'  // Amber Gold
    ];

    const handleMouseMove = (e: MouseEvent) => {
      // Spawn standard heart particles representing Sonakshi's premium vibe
      const size = Math.random() * 14 + 10;
      const rotation = Math.random() * 360;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Multi-directional micro-velocity
      const vx = (Math.random() - 0.5) * 1.5;
      const vy = -Math.random() * 1.5 - 0.5; // slight upward drift

      const newParticle: HeartParticle = {
        id: particleId++,
        x: e.clientX,
        y: e.clientY,
        color,
        size,
        rotation,
        vx,
        vy,
        opacity: 1
      };

      setParticles((prev) => [...prev.slice(-35), newParticle]); // keep max 35 particles
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation physics loop
    let animId: number;
    const updateLoop = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.02,
            rotation: p.rotation + p.vx * 2
          }))
          .filter((p) => p.opacity > 0)
      );
      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" id="cursor-heart-trail">
      {particles.map((p) => (
        <svg
          key={p.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-opacity"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            opacity: p.opacity,
            width: `${p.size}px`,
            height: `${p.size}px`,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.opacity})`,
            fill: p.color,
          }}
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ))}
    </div>
  );
}
