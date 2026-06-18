/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Song } from '../types';

interface MusicPlayerProps {
  currentTheme: 'light' | 'dark';
  songs: Song[];
}

export function MusicPlayer({ currentTheme, songs }: MusicPlayerProps) {
  const [songIdx, setSongIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>([12, 18, 8, 24, 14, 20]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentSong = songs[songIdx] || songs[0] || {
    id: 'synth-bday',
    title: 'Nostalgic Music Box (Happy Birthday)',
    artist: 'Procedural Synth Engine',
    url: '',
    isSynthesized: true
  };

  // Procedural Web Audio API synthesizer for the "Happy Birthday" melody!
  const playBirthdaySynthNote = (frequency: number, duration: number, startTime: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // High quality sine or triangle wave for music box/bell sounds
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);

    // Warm bell envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.05); // low volume safe for eardrums
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const playSynthesizedBirthdayMelody = () => {
    if (synthIntervalRef.current) return; // already playing
    
    // Happy Birthday notes and frequencies (C4, D4, E4 etc.)
    const notes = [
      { f: 261.63, d: 0.35, r: 0.4 }, // C
      { f: 261.63, d: 0.15, r: 0.2 }, // C
      { f: 293.66, d: 0.5, r: 0.6 },  // D
      { f: 261.63, d: 0.5, r: 0.6 },  // C
      { f: 349.23, d: 0.5, r: 0.6 },  // F
      { f: 329.63, d: 1.0, r: 1.2 },  // E
      
      { f: 261.63, d: 0.35, r: 0.4 }, // C
      { f: 261.63, d: 0.15, r: 0.2 }, // C
      { f: 293.66, d: 0.5, r: 0.6 },  // D
      { f: 261.63, d: 0.5, r: 0.6 },  // C
      { f: 392.00, d: 0.5, r: 0.6 },  // G
      { f: 349.23, d: 1.0, r: 1.2 },  // F

      { f: 261.63, d: 0.35, r: 0.4 }, // C
      { f: 261.63, d: 0.15, r: 0.2 }, // C
      { f: 523.25, d: 0.5, r: 0.6 },  // C5
      { f: 440.00, d: 0.5, r: 0.6 },  // A
      { f: 349.23, d: 0.5, r: 0.6 },  // F
      { f: 329.63, d: 0.5, r: 0.6 },  // E
      { f: 293.66, d: 0.8, r: 1.0 },  // D

      { f: 466.16, d: 0.35, r: 0.4 }, // A#
      { f: 466.16, d: 0.15, r: 0.2 }, // A#
      { f: 440.00, d: 0.5, r: 0.6 },  // A
      { f: 349.23, d: 0.5, r: 0.6 },  // F
      { f: 392.00, d: 0.5, r: 0.6 },  // G
      { f: 349.23, d: 1.2, r: 1.5 },  // F
    ];

    let overallDuration = 0;
    notes.forEach((note) => {
      overallDuration += note.r;
    });

    const triggerMelody = () => {
      if (!isPlaying || currentSong.id !== 'synth-bday') return;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const now = audioContextRef.current.currentTime;
      let timeOffset = 0.2;

      notes.forEach((note) => {
        playBirthdaySynthNote(note.f, note.d, now + timeOffset);
        timeOffset += note.r;
      });
    };

    triggerMelody();
    // Loop the melody every time it finishes
    const loopIntervalMs = (overallDuration + 1) * 1000;
    const interval = window.setInterval(triggerMelody, loopIntervalMs);
    synthIntervalRef.current = interval;
  };

  const stopBirthdaySynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Handle switching between mp3 and procedurally synthesized music
    stopBirthdaySynth();

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (isPlaying) {
      if (currentSong.isSynthesized) {
        playSynthesizedBirthdayMelody();
      } else {
        const audio = new Audio(currentSong.url);
        audio.volume = isMuted ? 0 : volume;
        audio.loop = true;
        audio.play().catch((err) => console.log('Audio playback delayed:', err));
        audioRef.current = audio;
      }
    }

    return () => {
      stopBirthdaySynth();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [songIdx, isPlaying]);

  // Handle Vol changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Jump visualization bars
  useEffect(() => {
    if (!isPlaying) {
      setVisualizerHeights([4, 4, 4, 4, 4, 4]);
      return;
    }

    const timer = setInterval(() => {
      setVisualizerHeights(
        Array.from({ length: 6 }, () => Math.floor(Math.random() * 20) + 4)
      );
    }, 180);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setSongIdx((prev) => (prev + 1) % (songs.length || 1));
  };

  const handlePrev = () => {
    setSongIdx((prev) => (prev - 1 + (songs.length || 1)) % (songs.length || 1));
  };

  return (
    <div 
      className={`fixed bottom-6 left-6 z-[200] max-w-xs w-72 rounded-2xl p-4 transition-all duration-300 shadow-xl border backdrop-blur-md 
        ${currentTheme === 'dark' 
          ? 'bg-neutral-900/80 border-rose-500/30 text-white' 
          : 'bg-white/80 border-rose-200/50 text-neutral-800'
        }`}
      id="music-box-player"
    >
      <div className="flex items-center gap-3">
        {/* Spinning Vinyl/Heart Disc */}
        <div 
          className={`w-12 h-12 rounded-full flex items-center justify-center relative shadow-inner overflow-hidden border
            ${isPlaying ? 'animate-spin' : ''} 
            ${currentTheme === 'dark' ? 'bg-neutral-800 border-rose-500' : 'bg-rose-100 border-rose-300'}`}
          style={{ animationDuration: '4s' }}
        >
          <Music className={`w-5 h-5 ${currentTheme === 'dark' ? 'text-rose-400' : 'text-rose-500'}`} />
          <div className={`w-3 h-3 rounded-full absolute bg-white/90 border ${currentTheme === 'dark' ? 'border-zinc-900' : 'border-rose-100'}`} />
        </div>

        {/* Melody and volume details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold tracking-wide truncate flex items-center gap-1">
            {currentSong.isSynthesized && <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400 animate-pulse" />}
            {currentSong.title}
          </h4>
          <p className="text-[10px] opacity-70 truncate">{currentSong.artist}</p>
        </div>

        {/* Visualizer bars */}
        <div className="flex items-end gap-0.5 h-6 w-8 pb-1">
          {visualizerHeights.map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-t-full transition-all duration-150 ${currentTheme === 'dark' ? 'bg-rose-400' : 'bg-rose-500'}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3.5">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={handlePrev}
            className={`p-1.5 rounded-full transition hover:scale-105 ${currentTheme === 'dark' ? 'hover:bg-neutral-800' : 'hover:bg-rose-50'}`}
            title="Previous track"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button 
            type="button" 
            onClick={togglePlay}
            className={`p-2 rounded-full transition transform hover:scale-110 shadow-md ${currentTheme === 'dark' ? 'bg-rose-550 text-white hover:bg-rose-600' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button 
            type="button" 
            onClick={handleNext}
            className={`p-1.5 rounded-full transition hover:scale-105 ${currentTheme === 'dark' ? 'hover:bg-neutral-800' : 'hover:bg-rose-50'}`}
            title="Next track"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Volume section */}
        <div className="flex items-center gap-1.5 flex-1 max-w-[100px] justify-end">
          <button 
            type="button" 
            onClick={() => setIsMuted(!isMuted)}
            className="opacity-70 hover:opacity-100 p-1"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input 
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-12 h-1 accent-rose-500 rounded-lg cursor-pointer bg-neutral-300/40"
          />
        </div>
      </div>
    </div>
  );
}
