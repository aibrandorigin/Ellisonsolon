import React, { useState } from 'react';
import { 
  Waves, Dog, Dumbbell, UtensilsCrossed, Sparkles, ShieldCheck, Clock, Users,
  ChefHat, Home, Shirt, Sun, FolderKanban, Trees, Flame, Wind, CheckCircle2, Award, 
  Eye, Check, HeartHandshake, X, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';
import { Amenity } from '../types';

interface AmenitiesProps {
  onOpenTour: () => void;
}

export const Amenities: React.FC<AmenitiesProps> = ({ onOpenTour }) => {
  const { amenities, propertyInfo } = usePropertyData();
  const [selectedAmenityModal, setSelectedAmenityModal] = useState<Amenity | null>(null);
  const [activeModalImgIdx, setActiveModalImgIdx] = useState(0);

  // Dynamic highlights ribbon: strictly derived from live active amenities
  const highlightedAmenities = amenities.filter(a => a.highlight);
  const displayRibbonAmenities = highlightedAmenities.length > 0 
    ? highlightedAmenities 
    : amenities;

  const getIcon = (name?: string) => {
    switch (name) {
      case 'Waves': return <Waves className="w-4 h-4 text-[#c5a880]" />;
      case 'Dog': return <Dog className="w-4 h-4 text-[#c5a880]" />;
      case 'Dumbbell': return <Dumbbell className="w-4 h-4 text-[#c5a880]" />;
      case 'UtensilsCrossed': return <UtensilsCrossed className="w-4 h-4 text-[#c5a880]" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-[#c5a880]" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-[#c5a880]" />;
      case 'Clock': return <Clock className="w-4 h-4 text-[#c5a880]" />;
      case 'Users': return <Users className="w-4 h-4 text-[#c5a880]" />;
      case 'ChefHat': return <ChefHat className="w-4 h-4 text-[#c5a880]" />;
      case 'Home': return <Home className="w-4 h-4 text-[#c5a880]" />;
      case 'Shirt': return <Shirt className="w-4 h-4 text-[#c5a880]" />;
      case 'Sun': return <Sun className="w-4 h-4 text-[#c5a880]" />;
      case 'FolderKanban': return <FolderKanban className="w-4 h-4 text-[#c5a880]" />;
      case 'Trees': return <Trees className="w-4 h-4 text-[#c5a880]" />;
      case 'Flame': return <Flame className="w-4 h-4 text-[#c5a880]" />;
      case 'Wind': return <Wind className="w-4 h-4 text-[#c5a880]" />;
      default: return <Sparkles className="w-4 h-4 text-[#c5a880]" />;
    }
  };

  return (
    <section id="amenities" className="py-12 sm:py-14 bg-stone-50 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#c5a880]">
            Everyday Convenience & Leisure
          </span>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#233242] mt-1">
            Resort-Inspired Amenities & Finishes
          </h2>
          <p className="text-stone-600 text-sm mt-3 leading-relaxed max-w-2xl mx-auto">
            From Waxahachie’s largest dedicated dog park to our sparkling resort swimming pool and designer granite kitchens, life at The Ellis on Solon is tailored for effortless comfort.
          </p>

          {/* Dynamic Highlights Ribbon (swipeable on mobile, wrapped on desktop) */}
          {displayRibbonAmenities.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-2.5 mt-5 sm:mt-7 overflow-x-auto scrollbar-none pb-2 sm:pb-0 px-2 sm:px-0 -mx-4 sm:mx-0 sm:flex-wrap sm:justify-center">
              {displayRibbonAmenities.map((item, idx) => (
                <span
                  key={item.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold shadow-2xs border shrink-0 whitespace-nowrap ${
                    idx % 3 === 2
                      ? 'bg-[#FAF0D7] text-[#233242] border-[#c5a880]/50'
                      : 'bg-[#233242] text-[#FAF0D7] border-slate-700/60'
                  }`}
                >
                  <span className={idx % 3 === 2 ? 'text-[#233242] text-sm' : 'text-[#c5a880] text-sm'}>★</span>
                  {item.title}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* GALLERY STYLE PRESENTATION OF ALL AMENITIES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {amenities.map((item) => (
            <div
              key={item.id}
              id={`amenity-gallery-card-${item.id}`}
              onClick={() => {
                setSelectedAmenityModal(item);
                setActiveModalImgIdx(0);
              }}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer transform hover:-translate-y-1 active:scale-[0.99]"
            >
              {/* Image Frame */}
              <div className="relative h-48 w-full overflow-hidden bg-stone-900">
                <img
                  src={item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80'}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/20" />
                
                {/* Category & Icon Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#233242]/90 backdrop-blur-xs text-[#FAF0D7] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20">
                  {getIcon(item.icon)}
                  <span>{item.category === 'community' ? 'Community Perk' : 'In-Residence'}</span>
                </div>

                {item.highlight && (
                  <div className="absolute top-3 right-3 bg-[#FAF0D7] text-[#233242] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-[#c5a880] shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#c5a880]" />
                    <span>Featured</span>
                  </div>
                )}

                {item.images && item.images.length > 1 && (
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded-md backdrop-blur-xs">
                    +{item.images.length - 1} photos
                  </span>
                )}

                {/* Mobile tap indicator */}
                <div className="sm:hidden absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-[#FAF0D7] text-[10px] font-semibold backdrop-blur-xs">
                  Tap to view
                </div>

                {/* Desktop hover view button */}
                <div className="hidden sm:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-2xs">
                  <span className="flex items-center gap-1.5 bg-white/95 text-[#233242] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Amenity</span>
                  </span>
                </div>
              </div>

              {/* Text Information */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif-luxury text-base font-bold text-[#233242] group-hover:text-[#c5a880] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-medium">
                  <span className="text-[#233242] font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Available to All Residents
                  </span>
                  <span className="text-stone-400 text-xs group-hover:text-[#233242] group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pet Policy Feature Card */}
        <div className="mt-12 sm:mt-14 bg-gradient-to-r from-[#17222d] via-[#233242] to-[#2b3e52] rounded-2xl p-5 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 border border-slate-700/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FAF0D7]/15 border border-[#c5a880]/60 flex items-center justify-center shrink-0">
              <Dog className="w-6 h-6 sm:w-7 sm:h-7 text-[#FAF0D7]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#FAF0D7]">
                  Pet-Friendly Community
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF0D7] text-[#233242]">
                  Dogs & Cats Welcome
                </span>
              </div>
              <h3 className="font-serif-luxury text-lg sm:text-2xl font-bold mt-1 text-white">
                Waxahachie’s Largest Private Dog Park On-Site
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl">
                We love your pets! Enjoy expansive off-leash canine exercise zones, shady trees, and waste stations. Up to 2 pets per apartment home with breed restrictions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={onOpenTour}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 bg-[#FAF0D7] hover:bg-[#f3e5c0] text-[#233242] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center active:scale-95 text-center"
            >
              Schedule a Pet Tour
            </button>
          </div>
        </div>

      </div>

      {/* Selected Amenity Lightbox / Detail Modal */}
      {selectedAmenityModal && (() => {
        const modalImages = Array.isArray(selectedAmenityModal.images) && selectedAmenityModal.images.length > 0
          ? selectedAmenityModal.images
          : [selectedAmenityModal.image || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80'];
        const currentImg = modalImages[activeModalImgIdx] || modalImages[0];

        return (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setSelectedAmenityModal(null)}
          >
            <div 
              className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-56 sm:h-64 w-full bg-stone-900 flex items-center justify-center">
                <img
                  src={currentImg}
                  alt={selectedAmenityModal.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedAmenityModal(null)}
                  className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 hover:bg-black text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center z-10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-3 bg-[#233242] text-[#FAF0D7] text-xs font-bold px-3 py-1 rounded-full border border-slate-600 z-10">
                  {selectedAmenityModal.category === 'community' ? 'Community Amenity' : 'In-Home Finish'}
                </div>

                {modalImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveModalImgIdx(prev => (prev > 0 ? prev - 1 : modalImages.length - 1))}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors cursor-pointer z-10"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModalImgIdx(prev => (prev < modalImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors cursor-pointer z-10"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/75 text-white text-[10px] font-mono rounded backdrop-blur-xs z-10">
                      {activeModalImgIdx + 1} / {modalImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {modalImages.length > 1 && (
                <div className="flex gap-2 p-2 bg-stone-100 border-b border-stone-200 overflow-x-auto">
                  {modalImages.map((thumb, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveModalImgIdx(idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activeModalImgIdx === idx ? 'border-[#233242] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={thumb} alt={`thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

            <div className="p-5 sm:p-6">
              <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#233242]">
                {selectedAmenityModal.title}
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm mt-2.5 sm:mt-3 leading-relaxed">
                {selectedAmenityModal.description}
              </p>

              <div className="mt-5 sm:mt-6 pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <span className="text-xs text-stone-500 font-medium text-center sm:text-left">Included with all residence leases</span>
                <button
                  onClick={() => {
                    setSelectedAmenityModal(null);
                    onOpenTour();
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-[#233242] hover:bg-[#2e4357] text-[#FAF0D7] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center active:scale-95"
                >
                  Tour This Amenity
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

    </section>
  );
};
