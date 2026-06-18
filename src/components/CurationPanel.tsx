/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  X, Upload, Calendar, Plus, Download, RefreshCw, 
  Settings, Image as ImageIcon, Video, HelpCircle, Save,
  Trash2, FileText, Music, Key, LogOut, CheckCircle, AlertOctagon,
  Printer
} from 'lucide-react';
import { MemoryMedia, Song, Chapter } from '../types';
import { uploadMediaFile } from '../lib/firebase';

interface CurationPanelProps {
  mediaItems: MemoryMedia[];
  onUpdateMediaItem: (item: MemoryMedia) => Promise<void>;
  onAddMediaItem: (item: MemoryMedia) => Promise<void>;
  onDeleteMediaItem: (id: string) => Promise<void>;
  friendshipDate: string;
  onUpdateFriendshipDate: (date: string) => Promise<void>;
  onResetToDefaults: () => Promise<void>;
  onExportAlbum: () => void;
  onImportAlbum: (file: File) => Promise<void>;
  currentTheme: 'light' | 'dark';
  
  // Security + Admin states
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
  
  // Custom Content states
  songs: Song[];
  onUpdateSongs: (songs: Song[]) => Promise<void>;
  chapters: Chapter[];
  onUpdateChapter: (chapterId: number, title: string, subtitle: string, text: string) => Promise<void>;
  
  // Print Book capability
  onPrintBook?: () => void;

  // Firebase Publisher System
  onPublishChanges: () => Promise<void>;
  onUndoChanges: () => Promise<void>;
}

/**
 * Native canvas compression before storing JPEG pictures to storage
 */
function compressImage(file: File, isBase64Fallback = false): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = isBase64Fallback ? 600 : 800;
        const MAX_HEIGHT = isBase64Fallback ? 600 : 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', isBase64Fallback ? 0.45 : 0.65); // extra compression for base64 to ensure it stays in Firestore's 1MB limit
        } else {
          resolve(file);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function CurationPanel({
  mediaItems,
  onUpdateMediaItem,
  onAddMediaItem,
  onDeleteMediaItem,
  friendshipDate,
  onUpdateFriendshipDate,
  onResetToDefaults,
  onExportAlbum,
  onImportAlbum,
  currentTheme,
  isAdminLoggedIn,
  onLogoutAdmin,
  songs,
  onUpdateSongs,
  chapters,
  onUpdateChapter,
  onPrintBook,
  onPublishChanges,
  onUndoChanges
}: CurationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'media' | 'texts' | 'music' | 'settings'>('media');
  
  // Upload status and progress indicators
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Form details
  const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editBody, setEditBody] = useState('');

  // Add custom memory fields
  const [newMemoryType, setNewMemoryType] = useState<'image' | 'video'>('image');
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryDesc, setNewMemoryDesc] = useState('');
  const [newMemoryChapter, setNewMemoryChapter] = useState(1);
  const [newMemoryFile, setNewMemoryFile] = useState<File | null>(null);
  const [newMemoryUrl, setNewMemoryUrl] = useState('');
  const [addMemoryError, setAddMemoryError] = useState('');
  const [addMemorySuccess, setAddMemorySuccess] = useState('');

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRefForAdd = useRef<HTMLInputElement | null>(null);

  // If not logged in, DO NOT render anything: 100% hidden experience for visitors
  if (!isAdminLoggedIn) {
    return null;
  }

  // Pre-load text fields when chapter changed
  const handleSelectChapterForEditing = (id: number) => {
    setSelectedChapterId(id);
    const chap = chapters.find(c => c.id === id);
    if (chap) {
      setEditTitle(chap.title || '');
      setEditSubtitle(chap.subtitle || '');
      setEditBody(chap.text || '');
    }
  };

  const initializeTextFields = () => {
    const chap = chapters.find(c => c.id === selectedChapterId);
    if (chap) {
      setEditTitle(chap.title || '');
      setEditSubtitle(chap.subtitle || '');
      setEditBody(chap.text || '');
    }
  };

  // Upload limits
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB

  const validateFile = (file: File, allowedType: 'image' | 'video'): string | null => {
    if (allowedType === 'image') {
      if (!file.type.startsWith('image/')) {
        return 'Invalid file type. Please select a valid Image file (PNG, JPG, WebP)';
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return 'File is too large. Image upload is limited to 5MB max.';
      }
    } else {
      if (!file.type.startsWith('video/')) {
        return 'Invalid type. Please upload a valid MP4 or video clip.';
      }
      if (file.size > MAX_VIDEO_SIZE) {
        return 'File is too large. Video upload is limited to 25MB max.';
      }
    }
    return null;
  };

  // Live swap photo handler via Firebase Storage
  const handlePhotoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, 'image');
    if (error) {
      alert(error);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(15);
      
      const compressed = await compressImage(file);
      setUploadProgress(40);

      let downloadUrl;
      try {
        downloadUrl = await uploadMediaFile(compressed);
      } catch (uploadErr) {
        console.warn('Firebase Storage upload failed, falling back to offline Base64 compression:', uploadErr);
        const extraCompressed = await compressImage(file, true);
        downloadUrl = await fileToBase64(extraCompressed);
      }
      setUploadProgress(70);

      const existing = mediaItems.find((m) => m.id === id);
      if (existing) {
        await onUpdateMediaItem({
          ...existing,
          url: downloadUrl,
          title: file.name.split('.')[0] || existing.title
        });
      }
      setUploadProgress(100);
    } catch (err: any) {
      alert('Upload & Save failed: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Alternate local video selector
  const handleVideoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, 'video');
    if (error) {
      alert(error);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(30);

      const downloadUrl = await uploadMediaFile(file);
      setUploadProgress(100);

      const existing = mediaItems.find((m) => m.id === id);
      if (existing) {
        onUpdateMediaItem({
          ...existing,
          url: downloadUrl,
          title: file.name.split('.')[0] || existing.title
        });
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoUrlInput = (id: string, url: string) => {
    const existing = mediaItems.find((m) => m.id === id);
    if (existing) {
      onUpdateMediaItem({
        ...existing,
        url: url
      });
    }
  };

  // Drag over drop event helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Native drag/drop for single or multiple files
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setAddMemoryError('');
    setAddMemorySuccess('');

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Detect multiple uploads or single
    if (files.length > 1) {
      await uploadMultipleFiles(files);
    } else {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setNewMemoryType('image');
        setNewMemoryFile(file);
        setNewMemoryTitle(file.name.split('.')[0]);
      } else if (file.type.startsWith('video/')) {
        setNewMemoryType('video');
        setNewMemoryFile(file);
        setNewMemoryTitle(file.name.split('.')[0]);
      } else {
        setAddMemoryError('File format not supported. Drag JPEG, PNG, MP4 files.');
      }
    }
  };

  const uploadMultipleFiles = async (files: FileList) => {
    try {
      setIsUploading(true);
      let successCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        if (!isImage && !isVideo) continue;

        // Visual progress feedback of the sequence
        setUploadProgress(Math.round((i / files.length) * 100));

        let resolvedUrl = '';
        if (isImage) {
          const comp = await compressImage(file);
          try {
            resolvedUrl = await uploadMediaFile(comp);
          } catch (uploadErr) {
            console.warn('Storage failed in batch upload, collapsing to Base64:', uploadErr);
            const extraComp = await compressImage(file, true);
            resolvedUrl = await fileToBase64(extraComp);
          }
        } else {
          resolvedUrl = await uploadMediaFile(file);
        }

        const uId = `custom_${Date.now()}_${i}`;
        const newMedia: MemoryMedia = {
          id: uId,
          type: isImage ? 'image' : 'video',
          url: resolvedUrl,
          title: file.name.split('.')[0] || `Album Media ${i + 1}`,
          description: 'A beautiful memory uploaded during multiple file drag-and-drop curation.',
          chapterId: Number(newMemoryChapter)
        };
        await onAddMediaItem(newMedia);
        successCount++;
      }
      setAddMemorySuccess(`Successfully uploaded ${successCount} memory assets!`);
    } catch (err: any) {
      setAddMemoryError('Multi-upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Add new Custom memory Polaroid
  const handleAddNewMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemoryError('');
    setAddMemorySuccess('');

    if (!newMemoryTitle.trim()) {
      setAddMemoryError('Please enter a nostalgic title for the Polaroid');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      let resolvedUrl = newMemoryUrl.trim();

      if (newMemoryType === 'image') {
        if (!newMemoryFile && !resolvedUrl) {
          setAddMemoryError('Please select a local image file to upload OR paste a direct Image URL link below.');
          setIsUploading(false);
          return;
        }

        if (newMemoryFile) {
          const err = validateFile(newMemoryFile, 'image');
          if (err) {
            setAddMemoryError(err);
            setIsUploading(false);
            return;
          }

          setUploadProgress(30);
          const compressed = await compressImage(newMemoryFile);
          setUploadProgress(60);
          try {
            resolvedUrl = await uploadMediaFile(compressed);
          } catch (uploadErr) {
            console.warn('Firebase Storage upload failed, falling back to offline Base64 compression:', uploadErr);
            const extraCompressed = await compressImage(newMemoryFile, true);
            resolvedUrl = await fileToBase64(extraCompressed);
          }
          setUploadProgress(100);
        }
      } else {
        // For video
        if (newMemoryFile) {
          const err = validateFile(newMemoryFile, 'video');
          if (err) {
            setAddMemoryError(err);
            setIsUploading(false);
            return;
          }
          setUploadProgress(40);
          resolvedUrl = await uploadMediaFile(newMemoryFile);
          setUploadProgress(100);
        } else if (!resolvedUrl) {
          setAddMemoryError('Please select a local MP4 file or paste a live Video Stream URL');
          setIsUploading(false);
          return;
        }
      }

      const uId = `custom_${Date.now()}`;
      const newMedia: MemoryMedia = {
        id: uId,
        type: newMemoryType,
        url: resolvedUrl,
        title: newMemoryTitle.trim(),
        description: newMemoryDesc.trim() || 'A wunderschön dynamic memory added during live surprise curation.',
        chapterId: Number(newMemoryChapter)
      };

      await onAddMediaItem(newMedia);
      setAddMemorySuccess('Memory added safely! View it in the Polaroid Gallery.');
      
      // Reset inputs
      setNewMemoryTitle('');
      setNewMemoryDesc('');
      setNewMemoryFile(null);
      setNewMemoryUrl('');
      if (fileInputRefForAdd.current) {
        fileInputRefForAdd.current.value = '';
      }
    } catch (err: any) {
      setAddMemoryError('Add & Save failed: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateSongProperty = (songId: string, property: 'title' | 'artist' | 'url', value: string) => {
    const updatedSongs = songs.map(s => {
      if (s.id === songId) {
        return { ...s, [property]: value };
      }
      return s;
    });
    onUpdateSongs(updatedSongs);
  };

  const photos = mediaItems.filter((m) => m.type === 'image');
  const videos = mediaItems.filter((m) => m.type === 'video');

  return (
    <>
      {/* Small floating button on the bottom-right corner */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          initializeTextFields();
        }}
        className={`fixed bottom-6 right-6 z-[150] w-12 h-12 rounded-full shadow-lg border backdrop-blur-md flex items-center justify-center text-rose-450 hover:text-rose-300 bg-neutral-900/80 hover:bg-neutral-850 border-rose-500/30 hover:shadow-rose-500/10 active:scale-95 transition-all duration-300 cursor-pointer`}
        id="curate-button"
        title="Open Admin Curation Panel"
      >
        <Settings className="w-5 h-5 animate-spin-slow text-rose-500" />
      </button>

      {/* Slide-out Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Custom Control panel drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-xl shadow-2xl z-[201] transition-transform duration-300 ease-out transform flex flex-col bg-neutral-950 text-white border-l border-neutral-800`}
        style={isOpen ? { transform: 'translateX(0)' } : { transform: 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-neutral-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="py-0.5 px-2 bg-rose-500/15 text-rose-400 text-[10px] font-mono rounded font-bold border border-rose-500/20">SATYAM ACCESS</span>
              <h2 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">
                Admin Panel Drawer
              </h2>
            </div>
            <p className="text-[11px] text-neutral-400">Design, curate, and protect Sonakshi’s surprise album</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onLogoutAdmin();
                setIsOpen(false);
              }}
              title="Logout from admin session"
              className="p-1.5 rounded-full border border-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition flex items-center gap-1 text-[10px] items-center"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full border border-neutral-800 text-neutral-400 hover:bg-neutral-900 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STAGING & ACTIVE CHANGES ROOM */}
        <div className="p-4 bg-neutral-900 border-b border-neutral-850 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] tracking-widest font-mono text-neutral-400 uppercase font-bold">Staged Changes Controller</span>
            <div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono text-[9px] font-bold border border-amber-500/20 animate-pulse">
              Pre-Publish Admin View
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                await onPublishChanges();
                triggerCelebrityEffect();
              }}
              className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-505 text-white text-xs font-extrabold tracking-wider rounded-xl shadow-lg shadow-emerald-950/20 active:scale-95 transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer relative z-50"
            >
              <CheckCircle className="w-4 h-4" />
              Publish Changes
            </button>
            <button
              type="button"
              onClick={onUndoChanges}
              className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-250 border border-neutral-700 text-xs font-bold tracking-wider rounded-xl active:scale-95 transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer relative z-50 animate-glow border-rose-500/10"
              title="Undo all unpublished items and load back the current live page"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Undo changes
            </button>
          </div>
        </div>

        {/* Dynamic Navigation tabs */}
        <div className="flex px-4 pt-3 border-b border-neutral-905 text-xs gap-1">
          {[
            { id: 'media', label: 'Media Manager', icon: ImageIcon },
            { id: 'texts', label: 'Chapter Text', icon: FileText },
            { id: 'music', label: 'Music Streams', icon: Music },
            { id: 'settings', label: 'Anniversary Date', icon: Key }
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id as any);
                  if (t.id === 'texts') handleSelectChapterForEditing(selectedChapterId);
                }}
                className={`flex-1 pb-2.5 pt-1.5 flex items-center justify-center gap-1.5 font-bold transition border-b-2
                  ${activeTab === t.id 
                    ? 'border-rose-500 text-rose-400 opacity-100' 
                    : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <Icon className="w-3.5 h-3.5 text-rose-550" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Global Progress Bar for File Uploads */}
        {isUploading && (
          <div className="p-4 mx-4 mt-4 bg-rose-950/20 border border-rose-500/25 rounded-2xl space-y-2 animate-pulse">
            <div className="flex justify-between items-center text-xs">
              <span className="text-rose-400 font-bold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                Staging Memory Assets to Cloud Storage...
              </span>
              <span className="text-rose-400 font-mono font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 h-1.5 transition-all duration-300" 
                style={{ width: `${uploadProgress || 10}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* TAB 1: MEDIA MANAGER */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              
              {/* SECTION: ADD NEW MEMORY POLAROID with DRAG AND DROP */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 gap-4 flex flex-col">
                <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-2 text-rose-400">
                  <Plus className="w-4.5 h-4.5" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Upload Custom Polaroid Photo</h3>
                </div>

                <form onSubmit={handleAddNewMemory} className="space-y-4">
                  {addMemoryError && (
                    <p className="p-2.5 bg-red-950/30 text-red-400 text-xs border border-red-900/40 rounded-lg flex items-center gap-1">
                      <AlertOctagon className="w-4 h-4 shrink-0" /> {addMemoryError}
                    </p>
                  )}
                  {addMemorySuccess && (
                    <p className="p-2.5 bg-emerald-950/30 text-emerald-400 text-xs border border-emerald-900/45 rounded-lg flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 shrink-0" /> {addMemorySuccess}
                    </p>
                  )}

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRefForAdd.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-xl transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      isDragging 
                        ? 'border-rose-500 bg-rose-950/20 text-rose-400' 
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-450'
                    }`}
                  >
                    <Upload className="w-7 h-7 text-rose-500 animate-pulse" />
                    <span className="text-xs font-semibold text-neutral-200">
                      {newMemoryFile ? `Selected: ${newMemoryFile.name}` : "Drag & drop photos or scroll down"}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      Supports JPG, PNG, MP4 up to 25MB. Drop multiple to upload in batch!
                    </span>
                    <input
                      type="file"
                      ref={fileInputRefForAdd}
                      className="hidden"
                      accept={newMemoryType === 'image' ? "image/*" : "video/*"}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewMemoryFile(file);
                          if (!newMemoryTitle) {
                            setNewMemoryTitle(file.name.split('.')[0]);
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] opacity-70 uppercase tracking-widest font-mono">Attachment Type</label>
                      <select
                        value={newMemoryType}
                        onChange={(e) => setNewMemoryType(e.target.value as any)}
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                      >
                        <option value="image">Polaroid Photo (Image)</option>
                        <option value="video">Memory Video Clip</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] opacity-70 uppercase tracking-widest font-mono">Bind To Chapter</label>
                      <select
                        value={newMemoryChapter}
                        onChange={(e) => setNewMemoryChapter(Number(e.target.value))}
                        className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                      >
                        {chapters.map(c => (
                          <option key={c.id} value={c.id}>
                            Ch {c.id}: {c.title.substring(0, 20)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] opacity-70 uppercase tracking-widest font-mono">Memory Card Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Walking under autumn trees..."
                      value={newMemoryTitle}
                      onChange={(e) => setNewMemoryTitle(e.target.value)}
                      className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] opacity-70 uppercase tracking-widest font-mono">Captions / Description (Optional)</label>
                    <textarea
                      placeholder="Add an internal memory comment describing this magic instant..."
                      value={newMemoryDesc}
                      onChange={(e) => setNewMemoryDesc(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] opacity-70 uppercase tracking-widest font-mono">
                      {newMemoryType === 'image' 
                        ? 'Or paste Polaroid Image URL (Unsplash, Imgur, or direct web link)' 
                        : 'Or paste Video URL (MP4 stream, YouTube, Vimeo, etc.)'}
                    </label>
                    <input
                      type="url"
                      placeholder={newMemoryType === 'image' ? "https://images.unsplash.com/..." : "https://example.com/stream.mp4"}
                      value={newMemoryUrl}
                      onChange={(e) => setNewMemoryUrl(e.target.value)}
                      className="w-full text-xs p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-700 focus:outline-none focus:border-rose-550 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs rounded-xl hover:shadow-lg hover:shadow-rose-950/20 active:scale-98 transition flex items-center justify-center gap-1.5 uppercase tracking-wider"
                  >
                    <Plus className="w-4 h-4" />
                    {isUploading ? 'Uploading assets...' : 'Add custom Polaroid'}
                  </button>
                </form>
              </div>

              {/* LIST & EDIT EXISTING SYSTEM PHOTOS */}
              <div className="space-y-3">
                <div className="border-b border-neutral-850 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">List & Edit Photos ({photos.length})</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {photos.map((item) => {
                    return (
                      <div 
                        key={item.id} 
                        className="p-3.5 rounded-xl border border-neutral-850 hover:border-neutral-700 bg-neutral-900 flex flex-col sm:flex-row gap-3 transition duration-300"
                      >
                        {/* Left/Top: Image Preview & Swap */}
                        <div className="w-full sm:w-28 flex flex-col gap-2 shrink-0">
                          <div className="aspect-square bg-neutral-955 rounded-lg overflow-hidden flex items-center justify-center border border-neutral-800 shrink-0 select-none relative group">
                            {item.url ? (
                              <img 
                                src={item.url} 
                                alt={item.title} 
                                className="object-cover w-full h-full"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-[10px] text-neutral-600 font-mono">No photo</span>
                            )}
                          </div>
                          
                          <label className="py-1.5 px-2 rounded bg-neutral-950 border border-neutral-800 hover:border-rose-500/50 hover:text-rose-400 text-neutral-400 text-[8px] font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1 transition">
                            <Upload className="w-2.5 h-2.5" /> Swap File
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(item.id, e)}
                            />
                          </label>
                        </div>

                        {/* Right/Bottom: Editable fields */}
                        <div className="flex-1 flex flex-col justify-between space-y-2">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] text-neutral-500 font-mono bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-850">Ref: {item.id}</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`Delete polaroid memory: "${item.title}"?`)) {
                                    try {
                                      await onDeleteMediaItem(item.id);
                                    } catch (err: any) {
                                      alert('Failed to delete memory: ' + err.message);
                                    }
                                  }
                                }}
                                className="text-[9px] font-bold text-neutral-400 hover:text-red-400 uppercase tracking-widest transition"
                              >
                                Delete
                              </button>
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[8px] uppercase tracking-widest text-neutral-500 font-bold font-mono">Polaroid Title</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => onUpdateMediaItem({ ...item, title: e.target.value })}
                                className="w-full p-1.5 bg-neutral-955 border border-neutral-800 rounded text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                                placeholder="Edit title..."
                              />
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[8px] uppercase tracking-widest text-neutral-500 font-bold font-mono">Caption Narrative</label>
                              <textarea
                                value={item.description || ''}
                                onChange={(e) => onUpdateMediaItem({ ...item, description: e.target.value })}
                                className="w-full p-1.5 bg-neutral-955 border border-neutral-800 rounded text-[11px] text-white focus:outline-none focus:border-rose-500 h-10 resize-none font-serif leading-none"
                                placeholder="Write description/caption..."
                              />
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[8px] uppercase tracking-widest text-neutral-500 font-bold font-mono">Direct image Link</label>
                              <input
                                type="text"
                                value={item.url}
                                onChange={(e) => onUpdateMediaItem({ ...item, url: e.target.value })}
                                className="w-full p-1.5 bg-neutral-955 border border-neutral-800 rounded text-[10.5px] text-neutral-350 font-mono focus:outline-none focus:border-rose-500"
                                placeholder="https://..."
                              />
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[8px] uppercase tracking-widest text-neutral-500 font-bold font-mono">Target Chapter</label>
                              <select
                                value={item.chapterId}
                                onChange={(e) => onUpdateMediaItem({ ...item, chapterId: Number(e.target.value) })}
                                className="w-full p-1.5 text-xs bg-neutral-955 border border-neutral-800 rounded text-white cursor-pointer"
                              >
                                {chapters.map(c => (
                                  <option key={c.id} value={c.id}>
                                    Ch {c.id}: {c.title.substring(0, 18)}...
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LIST & EDIT EXISTING VIDEOS */}
              <div className="space-y-3">
                <div className="border-b border-neutral-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">Manage Video Clips ({videos.length})</h3>
                </div>

                <div className="space-y-4">
                  {videos.map((vid, idx) => (
                    <div 
                      key={vid.id}
                      className="p-4 rounded-xl bg-neutral-900 border border-neutral-850 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-500 font-mono">Ref id: {vid.id}</span>
                          <span className="text-[9px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-1.5 rounded font-bold uppercase">Bound Ch {vid.chapterId}</span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Delete video option "${vid.title}"?`)) {
                              try {
                                await onDeleteMediaItem(vid.id);
                              } catch (err: any) {
                                alert('Failed to delete video: ' + err.message);
                              }
                            }
                          }}
                          className="text-[9px] font-bold text-neutral-400 hover:text-red-400 uppercase tracking-widest transition"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-0.5">
                          <label className="text-[9px] opacity-60 font-mono">Display Title</label>
                          <input
                            type="text"
                            value={vid.title}
                            onChange={(e) => onUpdateMediaItem({ ...vid, title: e.target.value })}
                            className="w-full p-2 bg-neutral-950 border border-neutral-850 rounded text-xs text-white"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[9px] opacity-60 font-mono">Bound Chapter number</label>
                          <select
                            value={vid.chapterId}
                            onChange={(e) => onUpdateMediaItem({ ...vid, chapterId: Number(e.target.value) })}
                            className="w-full p-2 bg-neutral-950 border border-neutral-850 rounded text-xs text-white"
                          >
                            {chapters.map(c => (
                              <option key={c.id} value={c.id}>Ch {c.id}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="text-xs space-y-2">
                        <div className="space-y-0.5">
                          <label className="text-[9px] opacity-60 font-mono">Direct Video File Upload (MP4)</label>
                          <label className="py-2.5 px-3 border border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-950 rounded flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold transition">
                            <Upload className="w-3.5 h-3.5 text-rose-500" />
                            <span>Upload Local MP4 File</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => handleVideoUpload(vid.id, e)}
                            />
                          </label>
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[9px] opacity-60 font-mono">Or paste Video URL Link</label>
                          <input
                            type="url"
                            value={vid.url}
                            onChange={(e) => handleVideoUrlInput(vid.id, e.target.value)}
                            placeholder="Video Stream URL (eg. Mixkit clip or YouTube)"
                            className="w-full p-2 bg-neutral-950 border border-neutral-850 rounded text-[11px] text-neutral-300 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TEXT MANAGER */}
          {activeTab === 'texts' && (
            <div className="space-y-5">
              <div className="p-4 bg-neutral-900 border border-neutral-850 rounded-xl space-y-3">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-70 font-mono">Select Story Chapter To Edit</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => handleSelectChapterForEditing(Number(e.target.value))}
                  className="w-full text-xs p-3 bg-neutral-950 border border-neutral-850 rounded-xl text-white"
                >
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      Chapter {c.id}: {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div className="flex items-center gap-1.5 pb-2 text-rose-400 border-b border-neutral-850">
                  <FileText className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Modify Chapter {selectedChapterId} Content</h3>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest font-mono">Primary Header title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-xs p-3 bg-neutral-955 border border-neutral-800 rounded-lg text-white"
                      placeholder="Chapter title"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest font-mono">Secondary Subtitle / Place / Date</label>
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={(e) => setEditSubtitle(e.target.value)}
                      className="w-full text-xs p-3 bg-neutral-955 border border-neutral-800 rounded-lg text-white"
                      placeholder="e.g. October 2021 | The library stairwell"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest font-mono">Story / Memory Narrative Text</label>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={6}
                      className="w-full text-xs p-3 bg-neutral-955 border border-neutral-800 rounded-lg text-white font-serif leading-relaxed"
                      placeholder="Write the deep romantic nostalgia story..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateChapter(selectedChapterId, editTitle.trim(), editSubtitle.trim(), editBody.trim());
                      alert(`Chapter ${selectedChapterId} text staged successfully! Review on screen, then click Publish.`);
                    }}
                    className="w-full py-3 bg-neutral-800 hover:bg-neutral-750 text-rose-400 font-bold text-xs rounded-lg transition uppercase tracking-wider flex items-center justify-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" /> Stage Text updates
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MUSIC STREAM CONFIGURING */}
          {activeTab === 'music' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-900 border border-neutral-850 rounded-2xl flex flex-col gap-1.5 mb-2">
                <h4 className="text-xs font-bold text-rose-450 uppercase tracking-widest">Nostalgic Soundtrack Curation</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">Customize the exact audio tracks Sonakshi listens to as she browses the scrapbook chapters.</p>
              </div>

              {songs.map((song, i) => (
                <div key={song.id} className="p-5 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-850 pb-2">
                    <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider block">Soundtrack Track #{i+1}</span>
                    <span className="text-[10px] font-mono text-neutral-500">Ref: {song.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-mono opacity-65">Track Title</label>
                      <input
                        type="text"
                        value={song.title}
                        onChange={(e) => handleUpdateSongProperty(song.id, 'title', e.target.value)}
                        className="w-full text-xs p-2.5 bg-neutral-955 border border-neutral-805 rounded-lg text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-mono opacity-65">Artist Name</label>
                      <input
                        type="text"
                        value={song.artist}
                        onChange={(e) => handleUpdateSongProperty(song.id, 'artist', e.target.value)}
                        className="w-full text-xs p-2.5 bg-neutral-955 border border-neutral-805 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest font-mono opacity-65">Stream URL (Direct MP3, YouTube, or synthesis fallback)</label>
                    <input
                      type="text"
                      value={song.url}
                      onChange={(e) => handleUpdateSongProperty(song.id, 'url', e.target.value)}
                      className="w-full text-xs p-2.5 bg-neutral-955 border border-neutral-805 rounded-lg text-neutral-350 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: DATE METRICS & ANNIVERSARY */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div className="flex items-center gap-1.5 pb-2 text-rose-405 border-b border-neutral-850">
                  <Calendar className="w-4.5 h-4.5" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Set First Meeting Date</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    This triggers the beautiful real-time ticking ticker in the top right which displays years, months, days, minutes, and seconds of your wonderful lifetime connection.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono tracking-widest font-bold text-neutral-500">Select Anniversary Date</label>
                    <input
                      type="date"
                      value={friendshipDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          onUpdateFriendshipDate(e.target.value);
                        }
                      }}
                      className="w-full text-xs p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono focus:outline-none focus:border-rose-450"
                    />
                  </div>
                </div>
              </div>

              {/* DOWNLOAD & IMPORT ALBUMS BACKUPS */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-850 text-rose-400">
                  <Download className="w-4.5 h-4.5" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Album Portability & Backup</h3>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Download the current state as a single portable JSON layout to transfer layouts, or lock backups.
                </p>

                <button
                  type="button"
                  onClick={onExportAlbum}
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded-lg transition text-white border border-neutral-700 flex items-center justify-center gap-1.5 uppercase"
                >
                  <Download className="w-4 h-4" /> Export Album JSON
                </button>

                <div 
                  onClick={() => importInputRef.current?.click()}
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-705 border border-dashed border-rose-500/20 rounded text-xs text-neutral-350 flex items-center justify-center gap-1.5 transition cursor-pointer leading-none font-bold tracking-wider uppercase"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-550" />
                  <span>Import Surprises (JSON)</span>
                  <input
                    type="file"
                    ref={importInputRef}
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImportAlbum(file);
                    }}
                  />
                </div>

                {onPrintBook && (
                  <div className="pt-2 border-t border-neutral-850 mt-2">
                    <button
                      type="button"
                      onClick={onPrintBook}
                      className="w-full py-2 bg-gradient-to-r from-rose-600/20 to-pink-600/20 text-rose-350 text-[10px] font-extrabold tracking-wider flex items-center justify-center gap-1.5 hover:bg-rose-500/10 border border-rose-500/20 rounded transition uppercase"
                    >
                      <Printer className="w-3.5 h-3.5" /> Convert Album to Printable PDF Book
                    </button>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onResetToDefaults}
                    className="w-full py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded text-[9px] font-extrabold tracking-wider flex items-center justify-center gap-1.5 transition uppercase"
                  >
                    <RefreshCw className="w-3" /> Revert all to premium defaults
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 text-center border-t border-neutral-850 text-[10px] opacity-75 text-neutral-400 font-mono">
          🔒 Active changes auto-synchronized to memory persistence layer
        </div>
      </div>
    </>
  );
}

// Simple local helper to play celebratory confetti/balloons during publish
function triggerCelebrityEffect() {
  const customEvent = new CustomEvent('curation_celebrate');
  window.dispatchEvent(customEvent);
}
