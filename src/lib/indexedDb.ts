/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemoryMedia } from '../types';

const DB_NAME = 'SonakshiBirthdaySurpriseDB';
const DB_VERSION = 1;
const STORE_MEDIA = 'memory_media';
const STORE_METADATA = 'app_metadata';

// Premium Unsplash placeholders that fit the vibe and coloring of the theme perfectly
export const DEFAULT_PHOTOS: Record<string, { url: string; title: string }> = {
  photo1: {
    url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1000',
    title: 'The Spark of Friendship'
  },
  photo2: {
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000',
    title: 'Walking Side by Side'
  },
  photo3: {
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000',
    title: 'Warm Shared Epics'
  },
  photo4: {
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000',
    title: 'Sparks of Joy'
  },
  photo5: {
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000',
    title: 'Campus Chronicles'
  },
  photo6: {
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000',
    title: 'Resilience and Growth'
  },
  photo7: {
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1000',
    title: 'Heartfelt Reflections'
  },
  photo8: {
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000',
    title: 'Pure Gratitude'
  },
  photo9: {
    url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1000',
    title: 'The Birthday Wishes'
  },
  photo10: {
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1000',
    title: 'Eternal Bond'
  }
};

export const DEFAULT_VIDEOS: Record<string, { url: string; title: string }> = {
  video1: {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4',
    title: 'Unbelievable Campus Sky'
  },
  video2: {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-gold-confetti-falling-on-a-black-background-34289-large.mp4',
    title: 'Endless Celebration Sparkles'
  }
};

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_METADATA)) {
        db.createObjectStore(STORE_METADATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaItem(item: MemoryMedia): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const trx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = trx.objectStore(STORE_MEDIA);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMediaItem(id: string): Promise<MemoryMedia | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const trx = db.transaction(STORE_MEDIA, 'readonly');
    const store = trx.objectStore(STORE_MEDIA);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllMediaItems(): Promise<MemoryMedia[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const trx = db.transaction(STORE_MEDIA, 'readonly');
    const store = trx.objectStore(STORE_MEDIA);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMetadata(key: string, value: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const trx = db.transaction(STORE_METADATA, 'readwrite');
    const store = trx.objectStore(STORE_METADATA);
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMetadata<T>(key: string): Promise<T | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const trx = db.transaction(STORE_METADATA, 'readonly');
    const store = trx.objectStore(STORE_METADATA);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result ? (request.result.value as T) : null);
    request.onerror = () => reject(request.error);
  });
}

export async function populateDefaultsIfEmpty(): Promise<MemoryMedia[]> {
  const existing = await getAllMediaItems();
  const existingMap = new Map(existing.map((item) => [item.id, item]));

  const updated: MemoryMedia[] = [];

  // Re-verify we have photos 1-10
  for (let i = 1; i <= 10; i++) {
    const id = `photo${i}`;
    let item = existingMap.get(id);
    if (!item) {
      const def = DEFAULT_PHOTOS[id] || { url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7', title: 'Special Memory' };
      item = {
        id,
        type: 'image',
        url: def.url,
        title: def.title,
        description: `This is your gorgeous placeholder for Photo ${i}. Change it anytime with the curation panel!`,
        chapterId: getChapterIdForPhoto(i)
      };
      await saveMediaItem(item);
    }
    updated.push(item);
  }

  // Videos 1-2
  for (let i = 1; i <= 2; i++) {
    const id = `video${i}`;
    let item = existingMap.get(id);
    if (!item) {
      const def = DEFAULT_VIDEOS[id] || { url: '', title: `Video ${i}` };
      item = {
        id,
        type: 'video',
        url: def.url,
        title: def.title,
        description: `Persistent memory clip ${i} to highlight college & wonderful moments together.`,
        chapterId: i === 1 ? 4 : 9 // Chapter 4 or Chapter 9
      };
      await saveMediaItem(item);
    }
    updated.push(item);
  }

  return updated;
}

function getChapterIdForPhoto(index: number): number {
  if (index === 1) return 1;
  if (index === 2) return 2;
  if (index === 3 || index === 4) return 3;
  if (index === 5) return 4;
  if (index === 6) return 5;
  if (index === 7) return 6;
  if (index === 8) return 7;
  if (index === 9) return 8;
  return 9; // Photo 10 in chapter 9
}

export async function clearAllMedia(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const trx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = trx.objectStore(STORE_MEDIA);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
