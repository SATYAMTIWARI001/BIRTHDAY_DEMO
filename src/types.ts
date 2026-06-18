/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MemoryMedia {
  id: string; // "photo1", "photo2" ... "photo10" or "video1", "video2"
  type: 'image' | 'video';
  url: string; // Data URI, Object URL, or Unsplash placeholder
  title: string;
  description: string;
  chapterId: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  isSynthesized?: boolean;
}

export interface Chapter {
  id: number;
  title: string;
  subtitle?: string;
  text: string;
  photoIds: string[]; // references MemoryMedia ids
  videoIds?: string[]; // references MemoryMedia ids
  isGlassMessage?: boolean; // Chapter 6 glowing style
  hasTrigger?: 'fireworks' | 'confetti' | 'balloons' | 'all';
}
