/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  X, Upload, Calendar, Plus, Download, RefreshCw, 
  Settings, Image as ImageIcon, Video, HelpCircle, Save 
} from 'lucide-react';
import { MemoryMedia } from '../types';

interface CurationPanelProps {
  mediaItems: MemoryMedia[];
  onUpdateMediaItem: (item: MemoryMedia) => void;
  friendshipDate: string;
  onUpdateFriendshipDate: (date: string) => void;
  onResetToDefaults: () => void;
  onExportAlbum: () => void;
  onImportAlbum: (file: File) => void;
  currentTheme: 'light' | 'dark';
}

export function CurationPanel({
  mediaItems,
  onUpdateMediaItem,
  friendshipDate,
  onUpdateFriendshipDate,
  onResetToDefaults,
  onExportAlbum,
  onImportAlbum,
  currentTheme
}: CurationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'config'>('photos');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      const existing = mediaItems.find((m) => m.id === id);
      if (existing) {
        onUpdateMediaItem({
          ...existing,
          url: base64Url,
          title: file.name.split('.')[0] || existing.title
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use URL.createObjectURL to avoid making huge base64 which could slow down storage
    const localUrl = URL.createObjectURL(file);
    const existing = mediaItems.find((m) => m.id === id);
    if (existing) {
      onUpdateMediaItem({
        ...existing,
        url: localUrl,
        title: file.name.split('.')[0] || existing.title
      });
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

  const photos = mediaItems.filter((m) => m.type === 'image');
  const videos = mediaItems.filter((m) => m.type === 'video');

  return (
    <>
      {/* Floating Curate Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed top-6 right-6 z-[150] px-4 py-2.5 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-2 text-xs font-bold tracking-widest uppercase hover:scale-105 active:scale-95 transition-all duration-300
          ${currentTheme === 'dark' 
            ? 'bg-neutral-900/80 border-rose-500/30 text-rose-450 hover:bg-neutral-800' 
            : 'bg-white/80 border-rose-200/50 text-rose-650 hover:bg-rose-50'}`}
        id="curate-button"
      >
        <Settings className="w-4 h-4 animate-spin-slow" />
        Curate & Upload
      </button>

      {/* Slide-out Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Custom Control panel drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md shadow-2xl z-[201] transition-transform duration-300 transform flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          ${currentTheme === 'dark' ? 'bg-neutral-950 text-white border-l border-neutral-800' : 'bg-rose-50/95 text-neutral-800 border-l border-rose-150'}`}
      >
        {/* Header */}
        <div className={`p-5 flex items-center justify-between border-b ${currentTheme === 'dark' ? 'border-neutral-800' : 'border-rose-100'}`}>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              Memory Hub
            </h2>
            <p className="text-[11px] opacity-75">Personalize Sonakshi’s friendship album</p>
          </div>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className={`p-1.5 rounded-full transition hover:scale-105 ${currentTheme === 'dark' ? 'hover:bg-neutral-800' : 'hover:bg-rose-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation tabs */}
        <div className="flex px-4 pt-3 border-b border-rose-100/20 text-sm gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex-1 pb-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2
              ${activeTab === 'photos' 
                ? 'border-rose-500 text-rose-500' 
                : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <ImageIcon className="w-4 h-4" /> Photos (10)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`flex-1 pb-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2
              ${activeTab === 'videos' 
                ? 'border-rose-500 text-rose-500' 
                : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <Video className="w-4 h-4" /> Videos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex-1 pb-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2
              ${activeTab === 'config' 
                ? 'border-rose-500 text-rose-500' 
                : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <Calendar className="w-4 h-4" /> Milestones
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="p-3 bg-rose-500/10 border border-rose-300/20 text-xs rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-450 leading-relaxed">
                <HelpCircle className="w-5 h-5 shrink-0" />
                <span>
                  Upload 10 beautiful photos to display across each chapter. If no custom image is set, Sonakshi will see our handpicked warm aesthetic illustrations.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3" id="photo-uploader-grid">
                {photos.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`p-2.5 rounded-xl border flex flex-col justify-between h-40 group relative overflow-hidden transition-all duration-300
                      ${currentTheme === 'dark' 
                        ? 'bg-neutral-900 border-neutral-800' 
                        : 'bg-white border-rose-100'}`}
                  >
                    {/* Tiny visual image preview background */}
                    <div 
                      className="absolute inset-0 opacity-40 group-hover:opacity-65 transition-all duration-300 bg-cover bg-center index-[-1]"
                      style={{ backgroundImage: `url(${item.url})` }}
                    />
                    
                    <span className="text-[10px] font-mono tracking-widest py-0.5 px-2 bg-black/60 rounded-full text-white self-start backdrop-blur-sm z-10">
                      PHOTO {idx + 1}
                    </span>

                    <div className="z-10 mt-auto pt-2 bg-black/30 p-1.5 rounded-lg backdrop-blur-xs flex flex-col">
                      <p className="text-[10px] text-white font-semibold truncate leading-tight select-none">
                        {item.title}
                      </p>
                      
                      <label className="mt-1.5 py-1 px-2 rounded bg-rose-500/85 hover:bg-rose-600 text-white text-[9px] font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1 transition">
                        <Upload className="w-3 h-3" /> Change
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(item.id, e)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div className="p-2.5 bg-rose-500/15 text-xs text-rose-600 dark:text-rose-450 rounded-xl leading-relaxed">
                Add beautiful memories via video uploads or paste public stock/cloud video URLs.
              </div>

              {videos.map((vid, idx) => (
                <div 
                  key={vid.id}
                  className={`p-4 rounded-xl border flex flex-col gap-3
                    ${currentTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-rose-100'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold tracking-widest text-rose-550 uppercase">
                      College / Future Memory Clip {idx + 1}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={vid.url}
                    onChange={(e) => handleVideoUrlInput(vid.id, e.target.value)}
                    placeholder="Enter custom cloud MP4 Video link"
                    className={`w-full text-xs p-2.5 rounded-lg border focus:ring-1 focus:ring-rose-500 focus:outline-none transition
                      ${currentTheme === 'dark' ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-rose-100'}`}
                  />

                  <div className="flex items-center gap-2">
                    <div className="h-px bg-rose-200/30 flex-1" />
                    <span className="text-[9px] font-bold uppercase opacity-60 tracking-wider">or upload local MP4</span>
                    <div className="h-px bg-rose-200/30 flex-1" />
                  </div>

                  <label className="py-2 px-3 rounded-lg border-2 border-dashed border-rose-300 hover:border-rose-500 bg-rose-500/5 transition cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-650">
                    <Upload className="w-4 h-4" /> Pick local Clip
                    <input
                      type="file"
                      accept="video/mp4"
                      className="hidden"
                      onChange={(e) => handleVideoUpload(vid.id, e)}
                    />
                  </label>

                  {vid.url && (
                    <video 
                      src={vid.url} 
                      className="w-full h-24 bg-black rounded-lg object-cover" 
                      controls 
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-5">
              {/* Friendship Counter Setup */}
              <div 
                className={`p-4 rounded-xl border flex flex-col gap-3
                  ${currentTheme === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-rose-100'}`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-extrabold tracking-tight">Our Friendship Date</span>
                </div>
                <p className="text-[11px] opacity-75">
                  Set the exact date when you first met Sonakshi. This directly powers the ticking live countdown clock!
                </p>

                <input
                  type="date"
                  value={friendshipDate}
                  onChange={(e) => onUpdateFriendshipDate(e.target.value)}
                  className={`p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs border w-full
                    ${currentTheme === 'dark' ? 'bg-neutral-950 border-neutral-800' : 'bg-rose-50/50 border-rose-150'}`}
                />
              </div>

              {/* Reset defaults or Download backup memory package */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500">
                  Data & Backups
                </h3>

                <button
                  type="button"
                  onClick={onExportAlbum}
                  className="w-full py-2.5 rounded-xl border border-rose-200 hover:border-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition hover:bg-rose-50"
                >
                  <Download className="w-4 h-4 text-rose-500" />
                  Download Memory Album (JSON)
                </button>

                <div 
                  onClick={() => importInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-rose-300/35 hover:border-rose-450 font-semibold text-xs flex items-center justify-center gap-2 transition hover:bg-rose-500/5 cursor-pointer leading-none"
                >
                  <Plus className="w-4 h-4 text-rose-550" />
                  <span>Import Memory Album File</span>
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

                <button
                  type="button"
                  onClick={onResetToDefaults}
                  className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset to Beautiful Defaults
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`p-4 text-center border-t text-[10px] opacity-75 ${currentTheme === 'dark' ? 'border-neutral-800' : 'border-rose-100'}`}>
          The changes are automatically persisted to your browser’s cache!
        </div>
      </div>
    </>
  );
}
