import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { GalleryItem } from '../types';

interface GalleryLightboxProps {
  items: GalleryItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const currentItem = items[currentIndex];
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      onNavigate((currentIndex + 1) % items.length);
    } else if (isRightSwipe) {
      onNavigate((currentIndex - 1 + items.length) % items.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        onNavigate((currentIndex + 1) % items.length);
      }
      if (e.key === 'ArrowLeft') {
        onNavigate((currentIndex - 1 + items.length) % items.length);
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentIndex, items.length, onClose, onNavigate]);

  if (!isOpen || !currentItem) return null;

  return (
    <div 
      id="gallery-lightbox-backdrop"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 pb-safe pt-safe select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between text-white z-10 pt-2 sm:pt-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-[11px] sm:text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-white/20 text-stone-200">
            {currentItem.categoryLabel}
          </span>
          <span className="text-xs text-stone-400">
            Photo {currentIndex + 1} of {items.length}
          </span>
        </div>

        <button
          id="close-lightbox-btn"
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Close lightbox"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Viewport with Next/Prev Controls */}
      <div className="relative flex-1 flex items-center justify-center my-2 sm:my-4 overflow-hidden">
        <button
          id="lightbox-prev-btn"
          onClick={() => onNavigate((currentIndex - 1 + items.length) % items.length)}
          className="absolute left-1 sm:left-4 z-10 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="max-h-[75vh] max-w-5xl w-full flex flex-col items-center justify-center px-1">
          <img
            src={currentItem.imageUrl}
            alt={currentItem.title}
            className="max-h-[60vh] sm:max-h-[65vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
          <div className="mt-3 text-center max-w-2xl px-2 sm:px-4">
            <h3 className="text-base sm:text-lg font-bold text-white">{currentItem.title}</h3>
          </div>
        </div>

        <button
          id="lightbox-next-btn"
          onClick={() => onNavigate((currentIndex + 1) % items.length)}
          className="absolute right-1 sm:right-4 z-10 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="hidden sm:flex items-center justify-center gap-2 overflow-x-auto py-2 z-10">
        {items.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => onNavigate(idx)}
            className={`relative rounded-md overflow-hidden shrink-0 transition-all cursor-pointer ${
              idx === currentIndex ? 'ring-2 ring-[#c5a880] scale-105 opacity-100' : 'opacity-40 hover:opacity-80'
            }`}
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-16 h-12 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};
