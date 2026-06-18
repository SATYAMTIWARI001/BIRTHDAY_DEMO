/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Heart, Sparkles, Image as ImageIcon, BookOpen, Clock, 
  ChevronDown, Sun, Moon, Volume2, Sparkle, RefreshCw, 
  ArrowRight, Award, GraduationCap, Video, Download, HelpCircle
} from 'lucide-react';

import { MemoryMedia } from './types';
import { 
  populateDefaultsIfEmpty, saveMediaItem, saveMetadata, 
  getMetadata, clearAllMedia, DEFAULT_PHOTOS 
} from './lib/indexedDb';

import { LoadingScreen } from './components/LoadingScreen';
import { CursorTrail } from './components/CursorTrail';
import { Fireworks } from './components/Fireworks';
import { Confetti } from './components/Confetti';
import { MusicPlayer } from './components/MusicPlayer';
import { CurationPanel } from './components/CurationPanel';
import { ChapterView } from './components/ChapterView';
import { GalleryView } from './components/GalleryView';

interface TimeDifference {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function App() {
  // Application Mounting Stages
  const [isLoading, setIsLoading] = useState(true);
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [viewMode, setViewMode] = useState<'story' | 'gallery'>('story');

  // Core Custom State
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [friendshipDate, setFriendshipDate] = useState('2022-06-17'); // June 17, 2022 default anniversary!
  const [mediaItems, setMediaItems] = useState<MemoryMedia[]>([]);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);

  // Celebratory triggers
  const [showFireworks, setShowFireworks] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [balloons, setBalloons] = useState<{ id: number; color: string; left: number; delay: number }[]>([]);
  const [isCandleLit, setIsCandleLit] = useState(true);

  // Time metrics
  const [friendshipDuration, setFriendshipDuration] = useState<TimeDifference>({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Load customizations and media assets from local storage
  useEffect(() => {
    async function loadData() {
      try {
        const loadedMedia = await populateDefaultsIfEmpty();
        setMediaItems(loadedMedia);

        const savedDate = await getMetadata<string>('friendship_date');
        if (savedDate) {
          setFriendshipDate(savedDate);
        }

        const savedTheme = await getMetadata<'light' | 'dark'>('theme_mode');
        if (savedTheme) {
          setCurrentTheme(savedTheme);
        }
      } catch (err) {
        console.error('IndexedDB loading error, falling back:', err);
      }
    }
    loadData();
  }, []);

  // Update theme html flags
  useEffect(() => {
    const root = window.document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme]);

  // Compute live counter ticking
  useEffect(() => {
    const interval = setInterval(() => {
      const meetDate = new Date(friendshipDate);
      const now = new Date();
      let diffMs = now.getTime() - meetDate.getTime();

      if (diffMs < 0) {
        // Future date selected boundary
        setFriendshipDuration({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      let years = now.getFullYear() - meetDate.getFullYear();
      let months = now.getMonth() - meetDate.getMonth();
      let days = now.getDate() - meetDate.getDate();

      if (days < 0) {
        months--;
        // Get remaining days from previous month
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
      }

      if (months < 0) {
        years--;
        months += 12;
      }

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      setFriendshipDuration({
        years,
        months,
        days,
        hours,
        minutes,
        seconds
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [friendshipDate]);

  // Handle single media edits saving to IndexedDB
  const handleUpdateMediaItem = async (updatedItem: MemoryMedia) => {
    setMediaItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    await saveMediaItem(updatedItem);
  };

  // Modify friendship counter date
  const handleUpdateFriendshipDate = async (newDate: string) => {
    setFriendshipDate(newDate);
    await saveMetadata('friendship_date', newDate);
  };

  // Switch Theme modes
  const toggleTheme = async () => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(nextTheme);
    await saveMetadata('theme_mode', nextTheme);
  };

  // Trigger high intensity celebration
  const triggerCelebration = () => {
    setShowFireworks(true);
    setShowConfetti(true);

    // Spawn 10 delightful floating balloons rising
    const balloonColors = ['#FF8A9F', '#FFD275', '#D2B4DE', '#AED6F1', '#A9DFBF'];
    const newBalloons = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      color: balloonColors[i % balloonColors.length],
      left: Math.random() * 85 + 5,
      delay: Math.random() * 2
    }));
    setBalloons(newBalloons);

    // Remove balloons after they exit screen
    setTimeout(() => {
      setBalloons([]);
    }, 10000);

    // Turn off canvas particle triggers to protect server cycles
    setTimeout(() => {
      setShowFireworks(false);
      setShowConfetti(false);
    }, 14000);
  };

  // Tap Cake blowout candle action
  const handleBlowCandle = () => {
    setIsCandleLit(false);
    triggerCelebration();
    // Relight after 5s so they can blow it again!
    setTimeout(() => {
      setIsCandleLit(true);
    }, 6000);
  };

  // Reset helper
  const handleResetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all custom uploaded photos & videos back to premium defaults?')) {
      await clearAllMedia();
      const freshMedia = await populateDefaultsIfEmpty();
      setMediaItems(freshMedia);
      setFriendshipDate('2022-06-17');
      await saveMetadata('friendship_date', '2022-06-17');
      alert('Reset completed successfully!');
    }
  };

  // Download entire album curation as single JSON
  const handleExportAlbum = () => {
    const packageData = {
      version: '1.0',
      friendshipDate,
      mediaItems: mediaItems.map(m => ({
        id: m.id,
        type: m.type,
        url: m.url, // Base64 encoding captured automatically
        title: m.title,
        description: m.description,
        chapterId: m.chapterId
      }))
    };

    const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `Sonakshis_Birthday_Memory_Album.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  // Read upload JSON configuration
  const handleImportAlbum = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.friendshipDate) {
          await handleUpdateFriendshipDate(parsed.friendshipDate);
        }
        if (Array.isArray(parsed.mediaItems)) {
          for (const item of parsed.mediaItems) {
            await handleUpdateMediaItem(item);
          }
        }
        alert('Friendship Album successfully loaded from file!');
        window.location.reload();
      } catch (err) {
        alert('Invalid file format. Please upload a valid JSON album exported from this surprise tool!');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div 
      className={`min-h-screen relative font-sans transition-colors duration-500 overflow-x-hidden pb-24
        ${currentTheme === 'dark' 
          ? 'bg-gradient-to-tr from-neutral-950 via-zinc-900 to-indigo-950 text-white' 
          : 'text-slate-800'}`}
      style={currentTheme === 'light' ? { background: 'linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 100%)' } : undefined}
    >
      {/* Absolute floating butterflies & falling cherry blossom petals */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Falling petals */}
        <div className="cherry-petal" style={{ left: '10%', animationDelay: '0s', animationDuration: '10s', width: '12px', height: '10px' }} />
        <div className="cherry-petal" style={{ left: '30%', animationDelay: '2s', animationDuration: '14s', width: '15px', height: '12px' }} />
        <div className="cherry-petal" style={{ left: '55%', animationDelay: '4s', animationDuration: '11s', width: '11px', height: '9px' }} />
        <div className="cherry-petal" style={{ left: '75%', animationDelay: '1s', animationDuration: '16s', width: '16px', height: '13px' }} />
        <div className="cherry-petal" style={{ left: '90%', animationDelay: '6s', animationDuration: '12s', width: '13px', height: '11px' }} />
      </div>

      {/* Floating Sparkles Canvas particle layers */}
      <Fireworks isActive={showFireworks || currentChapterIdx === 7} intensity={currentChapterIdx === 7 ? 'high' : 'normal'} />
      <Confetti isActive={showConfetti || currentChapterIdx === 7} />

      {/* Heart trail overlay */}
      <CursorTrail />

      {/* Floating audio chimes bar */}
      <MusicPlayer currentTheme={currentTheme} />

      {/* Persistent Settings, Exporter hub */}
      <CurationPanel 
        mediaItems={mediaItems}
        onUpdateMediaItem={handleUpdateMediaItem}
        friendshipDate={friendshipDate}
        onUpdateFriendshipDate={handleUpdateFriendshipDate}
        onResetToDefaults={handleResetToDefaults}
        onExportAlbum={handleExportAlbum}
        onImportAlbum={handleImportAlbum}
        currentTheme={currentTheme}
      />

      {/* Theme Toggle float button */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`fixed top-6 right-54 z-[150] p-3 rounded-full shadow-lg border backdrop-blur-md hover:scale-110 active:scale-95 transition-all
          ${currentTheme === 'dark' 
            ? 'bg-neutral-900/80 border-rose-500/30 text-yellow-400 hover:bg-neutral-800' 
            : 'bg-white/80 border-rose-200/50 text-slate-800 hover:bg-rose-50'}`}
        title="Toggle background theme setting"
      >
        {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Visual Rising Balloons rendering on trigger */}
      <div className="fixed inset-0 pointer-events-none z-[160] overflow-hidden">
        {balloons.map((b) => (
          <div
            key={b.id}
            className="absolute bottom-[-100px] flex flex-col items-center select-none"
            style={{
              left: `${b.left}%`,
              animation: `petal-fall 8s forwards ease-in-out`,
              animationDelay: `${b.delay}s`,
              transform: 'rotate(180deg)', // inverted to ascend
            }}
          >
            {/* Balloon Latex bulb */}
            <div 
              className="w-16 h-20 rounded-full relative shadow-md"
              style={{ 
                backgroundColor: b.color,
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%'
              }}
            >
              {/* Highlight flare reflection */}
              <div className="absolute top-3 left-4 w-3 h-6 bg-white/40 rounded-full" />
              {/* Knot bottom */}
              <div 
                className="absolute bottom-[-4px] left-[26px] w-4 h-2 border-t-4"
                style={{ borderTopColor: b.color }}
              />
            </div>
            {/* String ribbon tail */}
            <div className="w-0.5 h-16 bg-neutral-400/60" />
          </div>
        ))}
      </div>

      {!isJourneyStarted ? (
        /* LANDING PAGE GREETINGS HERO SECTION */
        <main className="max-w-4xl mx-auto px-6 py-20 min-h-[92vh] flex flex-col justify-center items-center text-center space-y-12 relative z-20">
          
          <div className="space-y-4 animate-bounce-slow">
            {/* Glowing Rose Mini-badge */}
            <span className="px-4 py-1.5 rounded-full border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-300 text-xs font-semibold tracking-widest uppercase inline-flex items-center gap-1.5 shadow-sm">
              <Sparkle className="w-3 h-3 fill-current animate-pulse text-rose-500" />
              Happy Birthday Sonakshi
            </span>

            <h1 className="text-5xl md:text-7xl tracking-tight leading-none text-slate-900 dark:text-rose-50 font-serif">
              <span className="italic font-normal block mb-1">Sonakshi’s</span>
              <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-violet-600 bg-clip-text text-transparent font-extrabold">
                Surprise
              </span>
              <br />
              <span className="text-lg md:text-xl font-normal tracking-wide opacity-80 font-sans block mt-5 max-w-xl mx-auto text-neutral-600 dark:text-neutral-300">
                A premium storybook of friendship, memories, growth, and gratitude.
              </span>
            </h1>
          </div>

          <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-300 max-w-xl mx-auto leading-relaxed">
            “Every friendship begins with a simple hello, but some become unforgettable chapters of our lives.”
          </p>

          {/* Interactive Birthday Cake visual widget */}
          <div className="relative group p-6 rounded-3xl bg-white/20 dark:bg-neutral-900/40 border border-white/30 dark:border-neutral-800 backdrop-blur-md shadow-xl max-w-sm w-full select-none transform hover:scale-102 transition duration-300">
            <span className="text-[10px] font-mono tracking-widest uppercase text-rose-500 dark:text-rose-400 block mb-3 font-semibold">
              Tap the candles to blow! 🕯️
            </span>

            {/* Custom SVG Cake illustration */}
            <div className="flex flex-col items-center justify-center cursor-pointer" onClick={handleBlowCandle}>
              <div className="flex gap-2 justify-center mb-1 h-12 items-end">
                {/* 3 candle sticks */}
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center relative">
                    {isCandleLit ? (
                      <div className="w-3 h-5 bg-gradient-to-t from-yellow-300 via-orange-400 to-transparent rounded-full animate-pulse absolute -top-5" />
                    ) : (
                      <div className="w-1 h-3 bg-neutral-400 absolute -top-3" />
                    )}
                    <div className="w-2.5 h-10 bg-gradient-to-b from-blue-300 to-indigo-400 rounded-t-sm" />
                  </div>
                ))}
              </div>

              {/* Frosting / Fondant deck tiers */}
              <div className="w-48 h-8 bg-gradient-to-r from-rose-300 to-pink-400 rounded-t-xl relative shadow flex items-center justify-center">
                {/* Sprinkles decoration */}
                <div className="absolute inset-x-2 gap-3 flex justify-around">
                  <span className="w-1.5 h-1.5 bg-yellow-300 rounded" />
                  <span className="w-1.5 h-1.5 bg-blue-300 rounded" />
                  <span className="w-1.5 h-1.5 bg-purple-300 rounded" />
                </div>
              </div>

              <div className="w-56 h-12 bg-gradient-to-r from-pink-400 via-indigo-200 to-purple-400 rounded-b-xl relative shadow flex items-center justify-center">
                <span className="text-white text-xs font-bold font-display tracking-widest drop-shadow-sm uppercase">SONAKSHI</span>
              </div>

              {/* Platters base */}
              <div className="w-64 h-2.5 bg-slate-300 dark:bg-zinc-800 rounded-full mt-1" />
            </div>
          </div>

          {/* Real-time ticking friendship duration summary */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-mono text-neutral-400 text-center font-bold">
              Time Spent Laughing Together
            </h3>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-2xl mx-auto" id="meet-countdown">
              {[
                { label: 'Years', v: friendshipDuration.years },
                { label: 'Months', v: friendshipDuration.months },
                { label: 'Days', v: friendshipDuration.days },
                { label: 'Hours', v: friendshipDuration.hours },
                { label: 'Mins', v: friendshipDuration.minutes },
                { label: 'Secs', v: friendshipDuration.seconds }
              ].map((m, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center shadow-inner
                    ${currentTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-rose-100'}`}
                >
                  <span className="text-2xl md:text-3xl font-black font-mono text-rose-550 dark:text-rose-450">
                    {String(m.v).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-65 mt-1">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsJourneyStarted(true);
              triggerCelebration();
            }}
            className="group relative px-10 py-5 bg-gradient-to-r from-rose-500 via-pink-650 to-indigo-650 text-white rounded-full font-bold tracking-widest uppercase text-xs hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shine" />
            <span className="relative flex items-center gap-2">
              Start Friendship Journey <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </span>
          </button>
        </main>
      ) : (
        /* SURPRISE CORE BODY ROUTING */
        <main className="max-w-6xl mx-auto px-4 md:px-6 pt-12 relative z-25">
          {/* Header Dashboard panel */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold tracking-tight font-serif text-slate-900 dark:text-rose-50">
                Sonakshi’s Friendship Surprises
              </h2>
              <p className="text-xs opacity-75 font-medium">Curated with memories, love, and gratitude</p>
            </div>

            {/* Mode selection toggle bars */}
            <div className="flex bg-rose-200/20 dark:bg-neutral-900 border border-rose-300/30 p-1 rounded-full text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('story')}
                className={`py-2 px-4 rounded-full flex items-center gap-1.5 tracking-wide transition ${viewMode === 'story' ? 'bg-rose-500 text-white shadow' : 'opacity-70 hover:opacity-100'}`}
              >
                <BookOpen className="w-4 h-4" /> Story Book
              </button>
              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                className={`py-2 px-4 rounded-full flex items-center gap-1.5 tracking-wide transition ${viewMode === 'gallery' ? 'bg-rose-500 text-white shadow' : 'opacity-70 hover:opacity-100'}`}
              >
                <ImageIcon className="w-4 h-4" /> Polaroid Gallery
              </button>
            </div>
          </div>

          {/* Primary View mount */}
          {viewMode === 'story' ? (
            <ChapterView 
              currentChapterIdx={currentChapterIdx}
              onSetChapterIdx={setCurrentChapterIdx}
              mediaItems={mediaItems}
              onTriggerFireworks={() => setShowFireworks(true)}
              onTriggerConfetti={() => setShowConfetti(true)}
              currentTheme={currentTheme}
            />
          ) : (
            <GalleryView 
              mediaItems={mediaItems}
              onTriggerConfetti={() => setShowConfetti(true)}
              currentTheme={currentTheme}
            />
          )}

          {/* Friendship Live anniversary counter on sub-deck */}
          <div className="max-w-xl mx-auto mt-16 p-6 rounded-3xl bg-rose-500/5 border border-rose-300/10 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-rose-500">
              <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-xs font-extrabold tracking-widest uppercase font-mono">Our Friendship Clock</span>
            </div>

            <p className="text-xs opacity-75">
              Live metrics elapsed since we first met on <span className="font-bold underline text-rose-500">{friendshipDate}</span>:
            </p>

            <div className="flex justify-around items-center gap-2 text-rose-600 dark:text-rose-400 font-mono font-bold text-sm">
              <div>{friendshipDuration.years}y</div>
              <div>{friendshipDuration.months}m</div>
              <div>{friendshipDuration.days}d</div>
              <div>{friendshipDuration.hours}h</div>
              <div>{friendshipDuration.minutes}m</div>
              <div>{friendshipDuration.seconds}s</div>
            </div>
          </div>

          {/* FINAL THANK YOU GORGEOUS HERO PAGE */}
          <section className="mt-24 pt-16 border-t border-rose-100/10 text-center space-y-10" id="final-tribute-page">
            <div className="space-y-3">
              <span className="text-rose-500 text-4xl animate-bounce inline-block">🌸</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-serif text-slate-900 dark:text-rose-50">
                Thank You For Being Part Of My Journey
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-rose-500 to-indigo-500 mx-auto rounded-full" />
            </div>

            <p className="text-sm md:text-base opacity-90 text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto leading-relaxed italic">
              “From the first memory to this very moment, every chapter has been special because you were a part of it.”
            </p>

            {/* Glowing sentiment box */}
            <div className="max-w-md mx-auto p-8 rounded-3xl bg-neutral-900/10 dark:bg-rose-500/10 border border-rose-300/20 backdrop-blur-md shadow-2xl relative">
              <div className="absolute top-2 right-2 text-rose-300 animate-pulse text-2xl">✨</div>
              <p className="text-sm md:text-sm font-semibold tracking-wide text-neutral-800 dark:text-rose-50 italic">
                “I may not always be the perfect friend, but I will always be a genuine one. 💙”
              </p>
            </div>

            {/* Huge double congratulation button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={triggerCelebration}
                className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs tracking-widest uppercase rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                Explode Fireworks!
              </button>

              <button
                type="button"
                onClick={handleExportAlbum}
                className={`px-8 py-4 border border-rose-300 hover:bg-rose-50 rounded-full font-bold text-xs tracking-widest uppercase transition flex items-center gap-2
                  ${currentTheme === 'dark' ? 'text-rose-300 border-rose-500/30' : 'text-rose-650'}`}
              >
                <Download className="w-4 h-4 text-rose-500" />
                Download Memory Album PDF/JSON
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
