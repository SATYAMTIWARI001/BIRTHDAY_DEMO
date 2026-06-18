/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, ZoomIn, X, ChevronLeft, ChevronRight, MessageCircle, Star } from 'lucide-react';
import { MemoryMedia } from '../types';

interface GalleryViewProps {
  mediaItems: MemoryMedia[];
  onTriggerConfetti: () => void;
  currentTheme: 'light' | 'dark';
}

export function GalleryView({ mediaItems, onTriggerConfetti, currentTheme }: GalleryViewProps) {
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number | null>(null);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Get only images for polaroid gallery grid
  const photos = mediaItems.filter((m) => m.type === 'image');

  const handleAddReaction = (id: string, e: React.MouseEvent) => {
    // Increment reaction count
    setReactions((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));

    // Trigger floating hearts in the lightbox
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newHeart = {
      id: Date.now(),
      x,
      y
    };

    setFloatingHearts((prev) => [...prev, newHeart]);
    // Clear floating heart after 1s
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);

    // Micro trigger standard confetti on multi clicks
    if ((reactions[id] || 0) % 5 === 0) {
      onTriggerConfetti();
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIdx === null) return;
    setSelectedPhotoIdx((prev) => (prev! + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
    if (selectedPhotoIdx === null) return;
    setSelectedPhotoIdx((prev) => (prev! - 1 + photos.length) % photos.length);
  };

  const currentSelectedPhoto = selectedPhotoIdx !== null ? photos[selectedPhotoIdx] : null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-0 py-8" id="polaroid-gallery-container">
      {/* Intro visual header */}
      <div className="text-center mb-10 space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-slate-900 dark:text-rose-50">
          The Polaroid Exhibition
        </h2>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
          Hover over each Polaroid frame of Sonakshi’s memories. Click to zoom and read their heartwarming stories.
        </p>
      </div>

      {/* Grid of Polaroid cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {photos.map((photo, index) => {
          // Generate customized playful rotations for real physical-feeling polaroid look!
          const rotation = (index % 3 === 0) ? 'rotate-2' : (index % 2 === 0) ? '-rotate-2' : 'rotate-1';
          return (
            <div
              key={photo.id}
              onClick={() => setSelectedPhotoIdx(index)}
              className={`p-4 rounded-lg shadow-lg border hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 transform/perspective cursor-zoom-in group select-none
                ${currentTheme === 'dark' 
                  ? 'bg-neutral-900 border-neutral-800 text-white' 
                  : 'bg-white border-rose-100/40 text-neutral-800'}
                ${rotation}`}
            >
              <div className="relative aspect-square overflow-hidden rounded bg-neutral-100">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white scale-90 group-hover:scale-100 transition-transform" />
                </div>
              </div>

              {/* Hand-written styled typography footer decoration */}
              <div className="pt-4 pb-2 text-center">
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-400 block mb-1">
                  Photo {index + 1}
                </span>
                <h3 className="text-sm font-bold truncate tracking-wide text-rose-600 dark:text-rose-400">
                  {photo.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / zoom Modal dialog */}
      {selectedPhotoIdx !== null && currentSelectedPhoto && (
        <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setSelectedPhotoIdx(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hover:scale-115 transition"
            title="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handlePrevPhoto}
            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white hover:scale-110 transition hidden md:block"
            title="Previous Photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Core Card Structure */}
          <div 
            className={`max-w-3xl w-full rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-2xl relative border
              ${currentTheme === 'dark' 
                ? 'bg-neutral-900 border-neutral-800 text-white' 
                : 'bg-white border-rose-100 text-neutral-800'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual media half */}
            <div className="relative rounded-2xl overflow-hidden aspect-square md:aspect-auto md:h-[400px] bg-neutral-100 border border-rose-100/30">
              <img
                src={currentSelectedPhoto.url}
                alt={currentSelectedPhoto.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Description/Reactions details half */}
            <div className="flex flex-col justify-between py-2 min-h-[300px]">
              <div className="space-y-4">
                <span className="text-[10px] tracking-widest text-rose-500 font-mono uppercase block font-bold">
                  Memory Polaroid #{selectedPhotoIdx + 1}
                </span>
                
                <h2 className="text-2xl font-bold tracking-tight font-serif text-slate-900 dark:text-rose-50">
                  {currentSelectedPhoto.title}
                </h2>

                <p className="text-sm opacity-90 leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {currentSelectedPhoto.description}
                </p>
              </div>

              {/* Heart reaction trigger */}
              <div className="mt-8 border-t border-rose-100/20 pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleAddReaction(currentSelectedPhoto.id, e)}
                  className="relative group px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition overflow-hidden scale-100 hover:scale-102 active:scale-95"
                >
                  <Heart className="w-4 h-4 fill-rose-500 animate-pulse text-rose-500" />
                  <span>Send Love</span>
                  <span className="font-mono bg-rose-550/15 py-0.5 px-2 rounded-full ml-1">
                    {reactions[currentSelectedPhoto.id] || 0}
                  </span>

                  {/* Render flying micro-hearts on click */}
                  {floatingHearts.map((h) => (
                    <span
                      key={h.id}
                      className="absolute text-rose-550 font-bold pointer-events-none animate-float-heart"
                      style={{
                        left: `${h.x - 30}px`,
                        top: `${h.y - 40}px`
                      }}
                    >
                      💖
                    </span>
                  ))}
                </button>

                <div className="flex gap-2 text-[10px] tracking-widest uppercase text-neutral-400 font-mono items-center select-none">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400 animate-spin" style={{ animationDuration: '6s' }} />
                  Magical Record
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextPhoto}
            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white hover:scale-110 transition hidden md:block"
            title="Next Photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
