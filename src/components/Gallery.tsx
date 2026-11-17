import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';
import { GalleryItem } from '../types';

interface GalleryProps {
  onOpenLightbox: (items: GalleryItem[], index: number) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ onOpenLightbox }) => {
  const { galleryItems, galleryCategories } = usePropertyData();

  const categories = galleryCategories && galleryCategories.length > 0
    ? galleryCategories
    : [
        { id: 'all', label: 'All Photos' },
        { id: 'outdoor', label: 'Outdoor' },
        { id: 'interiors', label: 'Interiors' },
        { id: 'community', label: 'Pool & Outdoor' },
        { id: 'fitness', label: 'Clubhouse & Fitness' },
        { id: 'grounds', label: 'Grounds & Dog Park' },
        { id: 'pool', label: 'Pool' },
      ];

  // Helper to find the outside / outdoor category
  const findOutsideCategory = (cats: Array<{ id: string; label: string }>) => {
    return cats.find((c) =>
      c.id.toLowerCase() === 'outdoor' ||
      c.id.toLowerCase() === 'outside' ||
      c.label.toLowerCase().includes('outside') ||
      c.label.toLowerCase().includes('outdoor')
    );
  };

  const initialOutsideCat = findOutsideCategory(categories);
  const defaultFilterId = initialOutsideCat ? initialOutsideCat.id : 'outdoor';

  const [filter, setFilter] = useState<string>(defaultFilterId);
  const [userInteracted, setUserInteracted] = useState<boolean>(false);

  // Keep outside photos section active by default unless user manually selects another filter
  useEffect(() => {
    if (!userInteracted) {
      const match = findOutsideCategory(categories);
      if (match && filter !== match.id) {
        setFilter(match.id);
      }
    }
  }, [categories, userInteracted, filter]);

  const filteredItems = galleryItems.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  return (
    <section id="gallery" className="py-12 sm:py-14 bg-stone-100/60 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#c5a880] flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Visual Tour
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#233242] mt-1">
              Photo Gallery
            </h2>
            <p className="text-stone-600 text-sm max-w-xl mt-2 leading-relaxed">
              Take a closer look at our newly upgraded residences, resort-style amenities, and scenic tree-lined grounds at 1000 Solon Place Way.
            </p>
          </div>

          {/* Category Filters (Horizontally scrollable on mobile, wrapped on desktop) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 sm:pb-0 px-1 -mx-4 sm:mx-0 sm:flex-wrap sm:justify-start">
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`gallery-filter-${cat.id}`}
                onClick={() => {
                  setFilter(cat.id as any);
                  setUserInteracted(true);
                }}
                className={`px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[38px] flex items-center justify-center ${
                  filter === cat.id
                    ? 'bg-[#233242] text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              id={`gallery-thumb-${item.id}`}
              onClick={() => onOpenLightbox(filteredItems, index)}
              className="group relative rounded-2xl overflow-hidden bg-stone-200 aspect-4/3 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 active:scale-[0.99]"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>

        {/* Bottom prompt to tour in person */}
        <div className="mt-10 text-center text-xs text-stone-500">
          Photos represent current renovated models and community areas at The Ellis on Solon.{' '}
          <span className="ml-1 text-[#233242] font-semibold underline cursor-pointer" onClick={() => onOpenLightbox(galleryItems, 0)}>
            Click any photo to launch full-screen tour.
          </span>
        </div>

      </div>
    </section>
  );
};
