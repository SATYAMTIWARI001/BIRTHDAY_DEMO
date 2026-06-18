/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemoryMedia } from '../types';

const DB_NAME = 'SonakshiBirthdaySurpriseDB';
const DB_VERSION = 1;
const STORE_MEDIA = 'memory_media';
const STORE_METADATA = 'app_metadata';

// Premium local snapshots with nostalgic high-school memories and beautiful captions
export const DEFAULT_PHOTOS: Record<string, { url: string; title: string; description: string }> = {
  photo1: {
    url: '/images/classroom_selfie.jpg',
    title: 'Classroom Selfie Spark',
    description: 'Benches full of laughter and a blackboard full of scribbled notes. Throwback to goofing around together, taking our very first group selfie during the morning recess.'
  },
  photo2: {
    url: '/images/plaid_classmates.jpg',
    title: 'Checkered Uniform Smiles',
    description: 'Chilling in our red-and-black checkered plaid uniforms. No matter how tough the school tests got, these smiles and inside jokes always made everything easier.'
  },
  photo3: {
    url: '/images/friends_outdoors.jpg',
    title: 'The Outing Core Crew',
    description: 'Hanging out together under the warm sun, wearing our proud green and maroon shirts. This is the core squad that got through high school together, side-by-side.'
  },
  photo4: {
    url: '/images/class_trip_datestamp.jpg',
    title: 'Class Excursion',
    description: 'That unforgettable walk along the path under the tall trees at 14:39 PM on February 13, 2025. A sweet retro digital camera timestamp of a great adventure.'
  },
  photo5: {
    url: '/images/lake_selfie.jpg',
    title: 'Floating Lake Excursion',
    description: 'Our wild boat-house stop where we sat tightly together on those bright blue dock stairs, resting our feet near the cool, sparkling lake waters.'
  },
  photo6: {
    url: '/images/river_bank_selfie.jpg',
    title: 'Riverbank Golden Memories',
    description: 'As the sun set gracefully on the sandy riverbank, we promised to stay linked forever despite life taking us down different pathways after school.'
  },
  photo7: {
    url: '/images/funny_classroom_pout.jpg',
    title: 'Hilarious Classroom Candids',
    description: 'A priceless capture of her legendary exaggerated drama face while trying to snack on her cookie inside the classroom. Real moments, zero filters!'
  },
  photo8: {
    url: '/images/classroom_selfie.jpg',
    title: 'Studying & Smiling Together',
    description: 'The late evenings spent writing project file notes together on those wooden class desks. The best exam preparation was always just talking and laughing.'
  },
  photo9: {
    url: '/images/plaid_classmates.jpg',
    title: 'Classroom Reunion Reflection',
    description: 'Looking back, those classroom walls witnessed our greatest dreams, our silent fears, and our deepest school bonds.'
  },
  photo10: {
    url: '/images/friends_outdoors.jpg',
    title: 'An Eternal Bond of Friends',
    description: 'From school bells to life milestones, in school uniforms or our best clothes – this group has a bond that time can never fade away.'
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
    try {
      if (typeof indexedDB === 'undefined') {
        throw new Error('IndexedDB is not supported in this user environment');
      }
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
      request.onerror = () => reject(request.error || new Error('IndexedDB request error'));
    } catch (err) {
      reject(err);
    }
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

export async function deleteMediaItem(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const trx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = trx.objectStore(STORE_MEDIA);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

