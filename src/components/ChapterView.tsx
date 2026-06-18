/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Heart, Sparkles, ChevronLeft, ChevronRight, Play, Pause, AlertCircle, Quote } from 'lucide-react';
import { MemoryMedia, Chapter } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ChapterViewProps {
  currentChapterIdx: number;
  onSetChapterIdx: (idx: number) => void;
  mediaItems: MemoryMedia[];
  onTriggerFireworks: () => void;
  onTriggerConfetti: () => void;
  currentTheme: 'light' | 'dark';
  chapters: Chapter[];
}

// Typing effect helper for Chapter 6
function TypedMessage({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    // Reset typing on text load
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 28); // gentle reading pace

    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="whitespace-pre-line text-neutral-800 dark:text-rose-50 text-xs md:text-sm leading-relaxed font-medium tracking-wide font-sans">
      {displayed}
      <span className="inline-block w-1.5 h-4 bg-rose-500 animate-pulse ml-0.5" />
    </div>
  );
}

export function ChapterView({
  currentChapterIdx,
  onSetChapterIdx,
  mediaItems,
  onTriggerFireworks,
  onTriggerConfetti,
  currentTheme,
  chapters
}: ChapterViewProps) {
  const [autoPlay, setAutoPlay] = useState(false);

  const currentChapter = chapters[currentChapterIdx];

  // Auto Slideshow trigger
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      if (currentChapterIdx < chapters.length - 1) {
        onSetChapterIdx(currentChapterIdx + 1);
      } else {
        // Loop back to index 0 or turn autoplay off
        onSetChapterIdx(0);
      }
    }, 7000); // 7 seconds per slide

    return () => clearInterval(timer);
  }, [autoPlay, currentChapterIdx]);

  // Trigger page-specific celebratory particle effects
  useEffect(() => {
    if (currentChapter?.hasTrigger === 'all') {
      onTriggerFireworks();
      onTriggerConfetti();
    }
  }, [currentChapterIdx]);

  const handleNext = () => {
    if (currentChapterIdx < chapters.length - 1) {
      onSetChapterIdx(currentChapterIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentChapterIdx > 0) {
      onSetChapterIdx(currentChapterIdx - 1);
    }
  };

  const renderMediaForChapter = (id: string, type: 'image' | 'video') => {
    const asset = mediaItems.find((m) => m.id === id);
    if (!asset || !asset.url) return null;

    if (type === 'video') {
      return (
        <div key={id} className="relative rounded-2xl overflow-hidden shadow-lg border border-rose-200/40 w-full aspect-video bg-black">
          <video 
            src={asset.url} 
            className="w-full h-full object-cover" 
            controls 
            playsInline
            muted
          />
          <div className="absolute top-3 left-3 bg-black/60 px-3 py-1 rounded-full text-[10px] text-white font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-rose-400 animate-spin" /> {asset.title}
          </div>
        </div>
      );
    }

    return (
      <div 
        key={id} 
        className="group relative rounded-2xl overflow-hidden shadow-lg border border-rose-200/40 w-full h-[280px] bg-neutral-100 dark:bg-neutral-900 transition-transform duration-500 hover:scale-[1.02] cursor-zoom-in"
      >
        <img
          src={asset.url}
          alt={asset.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div>
            <h4 className="text-white text-sm font-bold">{asset.title}</h4>
            <p className="text-white/80 text-[10px] truncate max-w-xs">{asset.description}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0 py-8 relative" id="storybook-container">
      {/* Auto Slideshow Controls */}
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => setAutoPlay(!autoPlay)}
          className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-sm border transition duration-300
            ${autoPlay 
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse' 
              : currentTheme === 'dark' 
                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-rose-400' 
                : 'bg-white hover:bg-rose-50 border-rose-100 text-rose-600'
            }`}
        >
          {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          {autoPlay ? 'Auto Playing' : 'Auto Slideshow'}
        </button>
      </div>

      {/* Main Chapter Display Book */}
      <div 
        className={`rounded-3xl p-6 md:p-10 border transition-all duration-300 backdrop-blur-md shadow-2xl relative min-h-[500px] flex flex-col justify-between
          ${currentTheme === 'dark' 
            ? 'bg-neutral-900/40 border-neutral-800 text-white' 
            : 'bg-white/60 border-rose-100/50 text-neutral-800'}`}
      >
        {/* Sparkles / Floral indicators in back */}
        <div className="absolute right-6 top-6 text-rose-300/30 text-5xl pointer-events-none select-none animate-pulse">🌸</div>
        <div className="absolute left-6 bottom-6 text-pink-300/30 text-6xl pointer-events-none select-none animate-bounce">🦋</div>

        {/* Story content layout splits beautifully on desk, column on mobile with smooth transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentChapterIdx}
            initial={{ opacity: 0, scale: 0.98, x: 15 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: -15 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start my-auto"
          >
            {/* Text Section */}
            <div className="md:col-span-7 space-y-4">
              <span className="text-[10px] tracking-widest font-mono uppercase text-rose-550 block font-bold">
                {currentChapter?.subtitle}
              </span>
              
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-serif text-slate-900 dark:text-rose-50">
                {currentChapter?.title}
              </h2>

              {currentChapter?.isGlassMessage ? (
                // Glass apology beautiful cards
                <div className="relative p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-200/30 dark:border-rose-500/20 shadow-md backdrop-blur-lg overflow-hidden my-4">
                  <Quote className="absolute -top-1 -left-1 w-10 h-10 text-rose-300/20" />
                  <TypedMessage text={currentChapter.text} />
                </div>
              ) : (
                <p className="text-sm md:text-sm leading-relaxed opacity-90 font-medium whitespace-pre-line text-neutral-600 dark:text-neutral-300">
                  {currentChapter?.text}
                </p>
              )}
            </div>

            {/* Media visual column */}
            <div className="md:col-span-5 space-y-4 flex flex-col items-center justify-center">
              {currentChapter?.photoIds.map((pid) => renderMediaForChapter(pid, 'image'))}
              {currentChapter?.videoIds?.map((vid) => renderMediaForChapter(vid, 'video'))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Foot navigation */}
        <div className="mt-8 pt-6 flex items-center justify-between border-t border-rose-100/10">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentChapterIdx === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1.5 transition disabled:opacity-30 disabled:pointer-events-none
              ${currentTheme === 'dark' ? 'hover:bg-neutral-800 text-rose-400' : 'hover:bg-rose-50 text-rose-600'}`}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {/* Progress dots */}
          <div className="flex gap-1.5 overflow-x-auto max-w-[120px] md:max-w-none py-1">
            {chapters.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSetChapterIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentChapterIdx ? 'w-6 bg-rose-550' : 'bg-rose-250/50'}`}
                title={`Go to chapter ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentChapterIdx === chapters.length - 1}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1.5 transition disabled:opacity-30 disabled:pointer-events-none
              ${currentTheme === 'dark' ? 'hover:bg-neutral-800 text-rose-400' : 'hover:bg-rose-50 text-rose-600'}`}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
