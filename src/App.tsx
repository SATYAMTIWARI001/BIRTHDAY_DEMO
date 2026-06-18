/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Heart, Sparkles, Image as ImageIcon, BookOpen, Clock, 
  ChevronDown, Sun, Moon, Volume2, Sparkle, RefreshCw, 
  ArrowRight, Award, GraduationCap, Video, Download, HelpCircle,
  Lock, KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { MemoryMedia, Song, Chapter } from './types';
import { DEFAULT_PHOTOS, DEFAULT_VIDEOS } from './lib/indexedDb';
import { INITIAL_CHAPTERS } from './lib/initialChapters';
import { 
  fetchPublishedState, 
  fetchDraftState, 
  saveDraftState, 
  publishState, 
  isOwnerEmail, 
  auth 
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Fallback silently if storage is blocked
    }
  },
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Fallback silently if storage is blocked
    }
  }
};

import { LoadingScreen } from './components/LoadingScreen';
import { CursorTrail } from './components/CursorTrail';
import { Fireworks } from './components/Fireworks';
import { Confetti } from './components/Confetti';
import { MusicPlayer } from './components/MusicPlayer';
import { CurationPanel } from './components/CurationPanel';
import { ChapterView } from './components/ChapterView';
import { GalleryView } from './components/GalleryView';
import { AdminLoginModal } from './components/AdminLoginModal';

const INITIAL_SONGS: Song[] = [
  {
    id: 'synth-bday',
    title: 'Nostalgic Music Box (Happy Birthday)',
    artist: 'Procedural Synth Engine',
    url: '',
    isSynthesized: true,
  },
  {
    id: 'piano-ambient',
    title: 'Soft Piano Instrumental',
    artist: 'Ethereal Melodies',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    isSynthesized: false,
  },
  {
    id: 'acoustic-journey',
    title: 'Acoustic Guitar Whispers',
    artist: 'Warm Strings Ambient',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    isSynthesized: false,
  }
];

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
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');
  const [friendshipDate, setFriendshipDate] = useState('2022-06-17'); // June 17, 2022 default anniversary!
  const [mediaItems, setMediaItems] = useState<MemoryMedia[]>([]);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);

  // Administrative & Security Authentication states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminPasswordHash, setAdminPasswordHash] = useState('Satyam@2026'); // Secret default owner passcode
  const [lockClickCount, setLockClickCount] = useState(0);

  // Editable Chapter descriptions & Custom Songs state
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);

  // Celebratory triggers
  const [showFireworks, setShowFireworks] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [balloons, setBalloons] = useState<{ id: number; color: string; left: number; delay: number }[]>([]);
  const [isCandleLit, setIsCandleLit] = useState(true);

  // Physical A4 Printable state
  const [printTarget, setPrintTarget] = useState<MemoryMedia | null>(null);
  const [printAll, setPrintAll] = useState(false);

  // Time metrics
  const [friendshipDuration, setFriendshipDuration] = useState<TimeDifference>({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Load customizations and media assets from Firebase Firestore
  useEffect(() => {
    let unsubscribeAuth: (() => void) | null = null;

    async function loadScrapbookState(email: string | null) {
      try {
        const isOwner = isOwnerEmail(email);
        setIsAdminLoggedIn(isOwner);

        let data = null;
        if (isOwner) {
          data = await fetchDraftState();
        } else {
          data = await fetchPublishedState();
        }

        // Bootstrap Firestore with pristine defaults if it's completely empty!
        if (!data) {
          const initialMedia: MemoryMedia[] = [];
          for (let i = 1; i <= 10; i++) {
            const id = `photo${i}`;
            const def = DEFAULT_PHOTOS[id] || { url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7', title: 'Special Memory', description: '' };
            
            let chapterId = 9;
            if (i === 1) chapterId = 1;
            else if (i === 2) chapterId = 2;
            else if (i === 3 || i === 4) chapterId = 3;
            else if (i === 5) chapterId = 4;
            else if (i === 6) chapterId = 5;
            else if (i === 7) chapterId = 6;
            else if (i === 8) chapterId = 7;
            else if (i === 9) chapterId = 8;

            initialMedia.push({
              id,
              type: 'image',
              url: def.url,
              title: def.title,
              description: def.description || `This is our warm school memory ${i}.`,
              chapterId
            });
          }
          for (let i = 1; i <= 2; i++) {
            const id = `video${i}`;
            const def = DEFAULT_VIDEOS[id] || { url: '', title: `Video ${i}` };
            initialMedia.push({
              id,
              type: 'video',
              url: def.url,
              title: def.title,
              description: `Persistent memory clip ${i} to highlight college & wonderful moments together.`,
              chapterId: i === 1 ? 4 : 9
            });
          }

          const defaultState = {
            mediaItems: initialMedia,
            chapters: INITIAL_CHAPTERS,
            songs: INITIAL_SONGS,
            friendshipDate: '2022-06-17'
          };

          // Seed default configurations
          if (isOwner) {
            try {
              await publishState(defaultState);
            } catch (seedErr) {
              console.error('Fail to seed default Firestore configuration:', seedErr);
            }
          }
          data = defaultState;
        }

        const loadedMedia = data.mediaItems || [];
        let needsSyncSave = false;
        const upgradedMedia = loadedMedia.map((item) => {
          if (item.type === 'image') {
            const def = DEFAULT_PHOTOS[item.id];
            if (def) {
              let updated = { ...item };
              let changed = false;
              if (!item.url || item.url.includes('unsplash.com')) {
                updated.url = def.url;
                changed = true;
              }
              if (!item.title || item.title === 'Special Memory' || item.title.startsWith('The Spark') || item.title.startsWith('Walking Side') || item.title.startsWith('Warm Shared') || item.title.startsWith('Sparks of Joy') || item.title.startsWith('Campus Chronicles') || item.title.startsWith('Resilience and') || item.title.startsWith('Heartfelt') || item.title.startsWith('Pure Gratitude') || item.title.startsWith('The Birthday') || item.title.startsWith('Eternal') || item.title.startsWith('Classroom Smiles')) {
                updated.title = def.title;
                changed = true;
              }
              if (!item.description || item.description.includes('placeholder') || item.description.includes('This is your gorgeous') || item.description.includes('gorgeous placeholder') || item.description.includes('college & wonderful')) {
                updated.description = def.description;
                changed = true;
              }
              if (changed) {
                needsSyncSave = true;
                return updated;
              }
            }
          }
          return item;
        });

        setMediaItems(upgradedMedia);
        setChapters(data.chapters || []);
        setSongs(data.songs || []);
        setFriendshipDate(data.friendshipDate || '2022-06-17');

        if (needsSyncSave && isOwner) {
          try {
            await syncDraftToFirebase(upgradedMedia, data.chapters || INITIAL_CHAPTERS, data.songs || INITIAL_SONGS, data.friendshipDate || '2022-06-17');
          } catch (syncErr) {
            console.warn('Silent upgrade syncing to Firebase:', syncErr);
          }
        }
      } catch (err) {
        console.error('Firebase state synchronization error, using memory fallback:', err);
        // Fallback states
        setChapters(INITIAL_CHAPTERS);
        setSongs(INITIAL_SONGS);
        setFriendshipDate('2022-06-17');
        
        const fallbackMedia: MemoryMedia[] = [];
        for (let i = 1; i <= 10; i++) {
          const id = `photo${i}`;
          const def = DEFAULT_PHOTOS[id] || { url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7', title: 'Special Memory', description: '' };
          
          let chapterId = 9;
          if (i === 1) chapterId = 1;
          else if (i === 2) chapterId = 2;
          else if (i === 3 || i === 4) chapterId = 3;
          else if (i === 5) chapterId = 4;
          else if (i === 6) chapterId = 5;
          else if (i === 7) chapterId = 6;
          else if (i === 8) chapterId = 7;
          else if (i === 9) chapterId = 8;

          fallbackMedia.push({
            id,
            type: 'image',
            url: def.url,
            title: def.title,
            description: def.description || `Special memory snapshot ${i}`,
            chapterId
          });
        }
        for (let i = 1; i <= 2; i++) {
          const id = `video${i}`;
          const def = DEFAULT_VIDEOS[id] || { url: '', title: `Video ${i}` };
          fallbackMedia.push({
            id,
            type: 'video',
            url: def.url,
            title: def.title,
            description: `Persistent memory clip ${i} to highlight college & wonderful moments together.`,
            chapterId: i === 1 ? 4 : 9
          });
        }
        setMediaItems(fallbackMedia);
      } finally {
        setIsLoading(false);
      }
    }

    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email && isOwnerEmail(user.email)) {
        loadScrapbookState(user.email);
      } else {
        loadScrapbookState(null);
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
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

  // Central draft state synchronization helper
  const syncDraftToFirebase = async (newMedia: MemoryMedia[], newChaps: Chapter[], newSongs: Song[], newDate: string) => {
    try {
      await saveDraftState({
        mediaItems: newMedia,
        chapters: newChaps,
        songs: newSongs,
        friendshipDate: newDate
      });
    } catch (err) {
      console.error('Error saving draft state:', err);
    }
  };

  // Listen for custom curation celebration events triggered by the admin drawer
  useEffect(() => {
    const handleCurationCelebrant = () => {
      triggerCelebration();
    };
    window.addEventListener('curation_celebrate', handleCurationCelebrant);
    return () => {
      window.removeEventListener('curation_celebrate', handleCurationCelebrant);
    };
  }, []);

  // Handle single media edits saving to Firebase
  const handleUpdateMediaItem = async (updatedItem: MemoryMedia) => {
    // 1. Update media items array
    const originalItem = mediaItems.find(m => m.id === updatedItem.id);
    const updated = mediaItems.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    setMediaItems(updated);

    // 2. Adjust chapters if the chapterId was changed
    let updatedChapters = chapters;
    if (originalItem && originalItem.chapterId !== updatedItem.chapterId) {
      // Detach from previous chapter
      updatedChapters = updatedChapters.map(c => {
        if (c.id === originalItem.chapterId) {
          return {
            ...c,
            photoIds: c.photoIds.filter(pid => pid !== updatedItem.id),
            videoIds: c.videoIds ? c.videoIds.filter(vid => vid !== updatedItem.id) : []
          };
        }
        return c;
      });

      // Attach to new chapter
      updatedChapters = updatedChapters.map(c => {
        if (c.id === updatedItem.chapterId) {
          if (updatedItem.type === 'image') {
            const pIds = c.photoIds.includes(updatedItem.id) ? c.photoIds : [...c.photoIds, updatedItem.id];
            return { ...c, photoIds: pIds };
          } else {
            const vIds = c.videoIds ? (c.videoIds.includes(updatedItem.id) ? c.videoIds : [...c.videoIds, updatedItem.id]) : [updatedItem.id];
            return { ...c, videoIds: vIds };
          }
        }
        return c;
      });
      setChapters(updatedChapters);
    }

    await syncDraftToFirebase(updated, updatedChapters, songs, friendshipDate);
  };

  // Modify friendship counter date
  const handleUpdateFriendshipDate = async (newDate: string) => {
    setFriendshipDate(newDate);
    await syncDraftToFirebase(mediaItems, chapters, songs, newDate);
  };

  // Switch Theme modes local only (Locked to dark mode)
  const toggleTheme = () => {
    setCurrentTheme('dark');
  };

  // 1. Session Logging
  const handleLogoutAdmin = async () => {
    try {
      await auth.signOut();
      setIsAdminLoggedIn(false);
      safeSessionStorage.removeItem('surprises_admin_session');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setShowAdminLoginModal(false);
    safeSessionStorage.setItem('surprises_admin_session', 'true');
    triggerCelebration();
  };

  // 2. Custom photo/video insertions
  const handleAddMediaItem = async (item: MemoryMedia) => {
    const updatedMedia = [...mediaItems, item];
    setMediaItems(updatedMedia);

    // update corresponding chapter
    const updatedChapters = chapters.map(c => {
      if (c.id === item.chapterId) {
        if (item.type === 'image') {
          const pIds = c.photoIds.includes(item.id) ? c.photoIds : [...c.photoIds, item.id];
          return { ...c, photoIds: pIds };
        } else {
          const vIds = c.videoIds ? (c.videoIds.includes(item.id) ? c.videoIds : [...c.videoIds, item.id]) : [item.id];
          return { ...c, videoIds: vIds };
        }
      }
      return c;
    });
    setChapters(updatedChapters);
    await syncDraftToFirebase(updatedMedia, updatedChapters, songs, friendshipDate);
  };

  const handleDeleteMediaItem = async (id: string) => {
    const updatedMedia = mediaItems.filter(m => m.id !== id);
    setMediaItems(updatedMedia);

    // detach reference from any chapters
    const updatedChapters = chapters.map(c => ({
      ...c,
      photoIds: c.photoIds.filter(pid => pid !== id),
      videoIds: c.videoIds ? c.videoIds.filter(vid => vid !== id) : []
    }));
    setChapters(updatedChapters);
    await syncDraftToFirebase(updatedMedia, updatedChapters, songs, friendshipDate);
  };

  // 3. Songs modifications
  const handleUpdateSongs = async (songsList: Song[]) => {
    setSongs(songsList);
    await syncDraftToFirebase(mediaItems, chapters, songsList, friendshipDate);
  };

  // 4. Chapter descriptions updating
  const handleUpdateChapter = async (chapterId: number, title: string, subtitle: string, text: string) => {
    const updated = chapters.map(c => (c.id === chapterId ? { ...c, title, subtitle, text } : c));
    setChapters(updated);
    await syncDraftToFirebase(mediaItems, updated, songs, friendshipDate);
  };

  // 5. Change credential password (Deprecated in favor of Firebase Auth)
  const handleChangeAdminPassword = async (newPass: string) => {
    setAdminPasswordHash(newPass);
  };

  // 6. Handle print triggers
  const handlePrintCard = (item: MemoryMedia) => {
    setPrintTarget(item);
    setPrintAll(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handlePrintAllCards = () => {
    setPrintTarget(null);
    setPrintAll(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // 7. Cleanup after print dialog closes
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintTarget(null);
      setPrintAll(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Query parameter listener for secret dashboard URLs
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('admin') === 'true' || query.has('login') || query.has('admin')) {
      setShowAdminLoginModal(true);
    }
  }, []);

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

  // Revert memory variables back to premium defaults
  const handleResetToDefaults = async () => {
    if (window.confirm('Are you sure you want to revert all text changes, custom music streams, and photos/videos back to premium defaults?')) {
      const initialMedia: MemoryMedia[] = [];
      for (let i = 1; i <= 10; i++) {
        const id = `photo${i}`;
        const def = DEFAULT_PHOTOS[id] || { url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7', title: 'Special Memory', description: '' };
        
        let chapterId = 9;
        if (i === 1) chapterId = 1;
        else if (i === 2) chapterId = 2;
        else if (i === 3 || i === 4) chapterId = 3;
        else if (i === 5) chapterId = 4;
        else if (i === 6) chapterId = 5;
        else if (i === 7) chapterId = 6;
        else if (i === 8) chapterId = 7;
        else if (i === 9) chapterId = 8;

        initialMedia.push({
          id,
          type: 'image',
          url: def.url,
          title: def.title,
          description: def.description || `Special school snapshot ${i}`,
          chapterId
        });
      }
      for (let i = 1; i <= 2; i++) {
        const id = `video${i}`;
        const def = DEFAULT_VIDEOS[id] || { url: '', title: `Video ${i}` };
        initialMedia.push({
          id,
          type: 'video',
          url: def.url,
          title: def.title,
          description: `Persistent memory clip ${i} to highlight college & wonderful moments together.`,
          chapterId: i === 1 ? 4 : 9
        });
      }

      setMediaItems(initialMedia);
      setFriendshipDate('2022-06-17');
      setChapters(INITIAL_CHAPTERS);
      setSongs(INITIAL_SONGS);

      await syncDraftToFirebase(initialMedia, INITIAL_CHAPTERS, INITIAL_SONGS, '2022-06-17');
      alert('All configurations reverted fully back to initial state defaults!');
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
        url: m.url, 
        title: m.title,
        description: m.description,
        chapterId: m.chapterId
      })),
      chapters,
      songs
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
        const loadedDate = parsed.friendshipDate || '2022-06-17';
        const loadedMedia = Array.isArray(parsed.mediaItems) ? parsed.mediaItems : mediaItems;
        const loadedChapters = Array.isArray(parsed.chapters) ? parsed.chapters : chapters;
        const loadedSongs = Array.isArray(parsed.songs) ? parsed.songs : songs;

        setFriendshipDate(loadedDate);
        setMediaItems(loadedMedia);
        setChapters(loadedChapters);
        setSongs(loadedSongs);

        await syncDraftToFirebase(loadedMedia, loadedChapters, loadedSongs, loadedDate);
        alert('Friendship Album successfully loaded and staged to draft queue!');
      } catch (err) {
        alert('Invalid file format. Please upload a valid JSON album exported from this surprise tool!');
      }
    };
    reader.readAsText(file);
  };

  // Publish draft state changes to the live viewing audience
  const handlePublishChanges = async () => {
    try {
      const liveState = {
        mediaItems,
        chapters,
        songs,
        friendshipDate
      };
      await publishState(liveState);
      alert('Congratulations, Satyam! Your beautiful memory scrapbook additions are now live for Sonakshi and everyone to see!');
    } catch (err: any) {
      alert('Failed to publish changes: ' + err.message);
    }
  };

  // Revert the staged draft state back to the last published live version
  const handleUndoChanges = async () => {
    if (window.confirm('Revert all unpublished edits? This will restore the current live version.')) {
      try {
        const liveState = await fetchPublishedState();
        if (liveState) {
          setMediaItems(liveState.mediaItems || []);
          setChapters(liveState.chapters || []);
          setSongs(liveState.songs || []);
          setFriendshipDate(liveState.friendshipDate || '2022-06-17');
          // Re-sync draft so it matches published
          await saveDraftState(liveState);
          alert('Successfully reverted all staged changes to alignment with published state.');
        } else {
          alert('No live published state found to revert to.');
        }
      } catch (err: any) {
        alert('Reversion error: ' + err.message);
      }
    }
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
      <MusicPlayer currentTheme={currentTheme} songs={songs} />

      {/* Admin Preview Mode badge */}
      {isAdminLoggedIn && (
        <div className="fixed top-6 left-6 z-[140] flex items-center gap-2 bg-amber-500 text-neutral-950 text-[10px] tracking-wider font-extrabold font-mono px-3 py-1.5 rounded-full shadow-lg border border-amber-400 select-none animate-pulse">
          <span className="w-2 h-2 rounded-full bg-neutral-950" />
          <span>STAGED ADMIN PREVIEW MODE</span>
        </div>
      )}

      {/* Persistent Settings, Exporter hub */}
      <CurationPanel 
        mediaItems={mediaItems}
        onUpdateMediaItem={handleUpdateMediaItem}
        onAddMediaItem={handleAddMediaItem}
        onDeleteMediaItem={handleDeleteMediaItem}
        friendshipDate={friendshipDate}
        onUpdateFriendshipDate={handleUpdateFriendshipDate}
        onResetToDefaults={handleResetToDefaults}
        onExportAlbum={handleExportAlbum}
        onImportAlbum={handleImportAlbum}
        currentTheme={currentTheme}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogoutAdmin={handleLogoutAdmin}
        songs={songs}
        onUpdateSongs={handleUpdateSongs}
        chapters={chapters}
        onUpdateChapter={handleUpdateChapter}
        onPrintBook={handlePrintAllCards}
        onPublishChanges={handlePublishChanges}
        onUndoChanges={handleUndoChanges}
      />

      {/* Creator Authenticate dialog */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />



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

      <AnimatePresence mode="wait">
        {!isJourneyStarted ? (
          /* LANDING PAGE GREETINGS HERO SECTION */
          <motion.main
            key="landing"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -15 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-4xl mx-auto px-6 py-20 min-h-[92vh] flex flex-col justify-center items-center text-center space-y-12 relative z-20"
          >
          
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
          </motion.main>
        ) : (
          /* SURPRISE CORE BODY ROUTING */
          <motion.main
            key="scrapbook-body"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-6xl mx-auto px-4 md:px-6 pt-12 relative z-25"
          >
          {/* Header Dashboard panel */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight font-serif text-slate-900 dark:text-rose-50">
                  Sonakshi’s Friendship Surprises
                </h2>
                <p className="text-xs opacity-75 font-medium">Curated with memories, love, and gratitude</p>
              </div>
              {!isAdminLoggedIn && (
                <button
                  type="button"
                  onClick={() => setShowAdminLoginModal(true)}
                  className="px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-850/80 text-[10px] uppercase font-mono tracking-widest text-rose-300 font-bold transition duration-200 flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer z-50 hover:border-rose-500/30"
                  title="Unlock photo adding option (Authorized access only)"
                >
                  <Lock className="w-3 h-3 text-rose-400" /> Creator Mode
                </button>
              )}
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

          {/* Primary View mount with smooth transition */}
          <AnimatePresence mode="wait">
            {viewMode === 'story' ? (
              <motion.div
                key="story"
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -10 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <ChapterView 
                  currentChapterIdx={currentChapterIdx}
                  onSetChapterIdx={setCurrentChapterIdx}
                  mediaItems={mediaItems}
                  onTriggerFireworks={() => setShowFireworks(true)}
                  onTriggerConfetti={() => setShowConfetti(true)}
                  currentTheme={currentTheme}
                  chapters={chapters}
                />
              </motion.div>
            ) : (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -10 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <GalleryView 
                  mediaItems={mediaItems}
                  onTriggerConfetti={() => setShowConfetti(true)}
                  currentTheme={currentTheme}
                  onPrintCard={handlePrintCard}
                />
              </motion.div>
            )}
          </AnimatePresence>

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
            <div 
              onClick={() => {
                const nextCount = lockClickCount + 1;
                if (nextCount >= 5) {
                  setShowAdminLoginModal(true);
                  setLockClickCount(0);
                } else {
                  setLockClickCount(nextCount);
                }
              }}
              title="A message from Satyam"
              className="max-w-md mx-auto p-8 rounded-3xl bg-neutral-900/10 dark:bg-rose-500/10 border border-rose-300/20 backdrop-blur-md shadow-2xl relative cursor-pointer select-none"
            >
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
          </motion.main>
        )}
      </AnimatePresence>

      {/* Elegant, A4-Sized physical print scrapbook compilation (Hidden on screen view, activated on print mode) */}
      <div id="printable-a4-album" className="hidden print:block" style={{ contentVisibility: 'auto' }}>
        {(() => {
          const itemsToPrint = printAll 
            ? mediaItems.filter(m => m.type === 'image') 
            : (printTarget ? [printTarget] : []);

          if (itemsToPrint.length === 0) return null;

          return itemsToPrint.map((item) => {
            const chapter = chapters.find(c => c.id === item.chapterId);
            return (
              <div key={item.id} className="print-card-page bg-white text-neutral-900 flex flex-col justify-between" style={{ contentVisibility: 'auto' }}>
                {/* Vintage Journal Header */}
                <div className="w-full flex justify-between items-center border-b-2 border-neutral-850 pb-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
                    Chapter {item.chapterId} • Memory Archive
                  </span>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
                    Surprise Scrapbook Page
                  </span>
                </div>

                {/* Polaroid Frame */}
                <div className="flex-1 flex flex-col items-center justify-center my-6">
                  <div className="p-6 bg-white border-2 border-neutral-100 shadow-xl rounded flex flex-col items-center w-[120mm] max-w-full">
                    {/* Centered Graphic Photo */}
                    <div className="w-full aspect-square overflow-hidden bg-neutral-100 border border-neutral-200">
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Script style title label */}
                    <div className="pt-6 pb-2 text-center w-full">
                      <h3 className="font-serif italic text-3xl font-medium tracking-wide text-neutral-850 truncate">
                        {item.title}
                      </h3>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mt-1">
                        Captured Reflection
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hand-written styled Backstory / Narrative */}
                <div className="w-full max-w-xl mx-auto text-center space-y-3 mb-6 px-4">
                  <div className="text-rose-500 text-3xl font-serif leading-none">“</div>
                  <p className="text-sm font-serif leading-relaxed text-neutral-800 whitespace-pre-line italic text-center">
                    {item.description || (chapter ? chapter.text : "A beautiful moment frozen in time, keeping the warmth of our journey alive forever.")}
                  </p>
                  <div className="text-rose-500 text-3xl font-serif leading-none">”</div>
                </div>

                {/* Footer and ownership markers */}
                <div className="w-full flex justify-between items-center border-t border-dashed border-neutral-350 pt-4 mt-auto">
                  <span className="text-[10px] font-mono text-neutral-400">
                    Presented with love & laughter — Satyam
                  </span>
                  <span className="text-[10px] font-mono text-neutral-450 font-bold">
                    For Sonakshi • Lifetime Keepsake
                  </span>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
