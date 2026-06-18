/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const MESSAGES = [
  'Gathering unforgettable memories...',
  'Polishing Polaroid snaps...',
  'Weaving the sweet friendship chords...',
  'Stretching the virtual balloons...',
  'Lighting up standard sparkles ✨',
  'Writing the heartfelt words...',
  'Preparing the birthday candles...',
  'Putting love into every pixel ❤️'
];

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Increment loading progress simulated nicely
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoaded(true);
          return 100;
        }
        const step = Math.floor(Math.random() * 8) + 3;
        return Math.min(prev + step, 100);
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) return;
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [progress]);

  return (
    <div className="fixed inset-0 bg-gradient-to-tr from-rose-50 via-pink-50 to-indigo-50 z-[99999] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Absolute floating hearts & flowers backgrounds for sweet vibe */}
      <div className="absolute inset-0 opacity-15 pointer-events-none select-none">
        <div className="absolute top-10 left-10 text-rose-300 text-4xl animate-bounce">🌸</div>
        <div className="absolute top-24 right-20 text-indigo-300 text-4xl animate-pulse">✨</div>
        <div className="absolute bottom-12 left-1/4 text-pink-300 text-5xl animate-bounce">🎈</div>
        <div className="absolute bottom-32 right-1/4 text-rose-300 text-6xl animate-pulse">💖</div>
      </div>

      <div className="max-w-md w-full relative z-10 flex flex-col items-center">
        {/* Pulsating Glowing Circle */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          <div className="absolute inset-0 bg-rose-200 rounded-full blur-xl opacity-60 animate-pulse" />
          <div className="relative bg-white/85 p-6 rounded-full border border-rose-150/70 shadow-lg animate-bounce duration-1000">
            <Heart className="w-14 h-14 text-rose-550 fill-rose-500 animate-pulse" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-500 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* Name Header with Luxurious Gold Accent Style */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-rose-500 via-pink-650 to-indigo-650 bg-clip-text text-transparent drop-shadow-sm mb-3">
          Sonakshi’s Journey
        </h1>
        
        <p className="text-xs tracking-widest text-indigo-400 font-mono uppercase mb-8">
          A Premium Friendship Surprise
        </p>

        {/* Progress Display Bar and Status messages */}
        {!isLoaded ? (
          <div className="w-full">
            <div className="h-2 w-full bg-rose-200/40 rounded-full overflow-hidden mb-4 shadow-sm border border-rose-100/30">
              <div 
                className="h-full bg-gradient-to-r from-rose-450 via-pink-400 to-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <span className="text-2xl font-black font-mono text-rose-550">
              {progress}%
            </span>
            
            <p className="text-sm italic text-neutral-500 font-medium tracking-wide mt-2 animate-fade-in-out">
              {MESSAGES[msgIdx]}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="group relative px-8 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 text-white rounded-full font-bold tracking-wider hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shine" />
            <span className="relative flex items-center gap-2">
              Reveal the Surprise <Heart className="w-5 h-5 fill-white group-hover:rotate-12 transition-transform" />
            </span>
          </button>
        )}
      </div>

      {/* Styled bottom text with elegant note */}
      <div className="absolute bottom-6 text-[10px] text-neutral-400 uppercase tracking-widest select-none">
        Crafted with love for the best birthday ever
      </div>
    </div>
  );
}
