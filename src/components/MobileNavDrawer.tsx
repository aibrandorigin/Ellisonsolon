import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Sparkles, 
  Calendar, 
  BedDouble, 
  Waves, 
  Camera, 
  MapPin, 
  Phone, 
  Clock, 
  ChevronRight, 
  ExternalLink 
} from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';
import { BrandLogo } from './BrandLogo';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSpecials: () => void;
  onOpenTour: () => void;
  onFilterBedrooms?: (beds: number | null) => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSpecials,
  onOpenTour,
  onFilterBedrooms,
}) => {
  const { propertyInfo } = usePropertyData();

  // Prevent background scroll and attach Escape key listener
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const navLinks = [
    { name: 'Floor Plans', href: '#floor-plans', icon: BedDouble, desc: '1, 2 & 3 Bedroom Layouts' },
    { name: 'Amenities', href: '#amenities', icon: Waves, desc: 'Resort Pool, Fitness & Clubhouse' },
    { name: 'Gallery', href: '#gallery', icon: Camera, desc: 'Interior & Exterior Photos' },
    { name: 'Neighborhood', href: '#neighborhood', icon: MapPin, desc: 'Waxahachie Dining & Schools' },
  ];

  const handleNavClick = (href: string) => {
    onClose();
    const targetId = href.replace('#', '');
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBedroomFilterClick = (beds: number | null) => {
    if (onFilterBedrooms) {
      onFilterBedrooms(beds);
    }
    onClose();
    const el = document.getElementById('floor-plans');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Portal to document.body with z-[100] ensuring it renders strictly in FRONT of all banners and headers
  return createPortal(
    <div 
      id="mobile-navigation-modal-root"
      className="fixed inset-0 z-[100] flex justify-end select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      {/* High-contrast dark backdrop overlay */}
      <div 
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel - sits completely in front of all banners and bars */}
      <div 
        id="mobile-menu-drawer" 
        className="relative w-full max-w-[340px] xs:max-w-[365px] h-full bg-white text-stone-900 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out border-l border-stone-200"
      >
        {/* Drawer Header with Official Brand Badge & Close Button */}
        <div className="flex items-center justify-between px-4 py-3 sm:py-3.5 border-b border-stone-200 bg-stone-50/90 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <BrandLogo className="h-8 w-auto max-w-[160px]" variant="full-badge" />
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-200/80 rounded-full transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5 text-[#233242]" />
          </button>
        </div>

        {/* Scrollable Drawer Body with safe bottom padding */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]">
          
          {/* Move-In Specials Callout Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF0D7] to-[#f4e7c7] border border-[#c5a880]/70 shadow-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#233242] flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4 text-[#FAF0D7]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wider font-extrabold text-[#17222d]">
                  Limited Time Special
                </div>
                <div className="text-xs font-bold text-[#233242] mt-0.5 leading-snug">
                  Up to 1 Month Free Rent on Select Units
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSpecials();
              }}
              className="w-full mt-2.5 py-2 px-3 bg-[#233242] hover:bg-[#2e4357] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Specials & Coupons</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#FAF0D7]" />
            </button>
          </div>

          {/* Primary Navigation Links */}
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 px-1 mb-1.5">
              Explore Property
            </div>
            <div className="space-y-1">
              {navLinks.map((link) => {
                const IconComp = link.icon;
                return (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => handleNavClick(link.href)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 group-hover:bg-[#233242] group-hover:text-white text-[#233242] flex items-center justify-center shrink-0 transition-colors">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900 group-hover:text-[#233242]">
                          {link.name}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {link.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 group-hover:text-stone-700 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Bedroom Jump Filter */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-2">
              Browse by Bedroom
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleBedroomFilterClick(1)}
                className="py-2 px-1 rounded-lg bg-white hover:bg-[#233242] text-stone-800 hover:text-white text-xs font-bold border border-stone-200/90 text-center transition-colors shadow-2xs cursor-pointer"
              >
                1 Bed
              </button>
              <button
                type="button"
                onClick={() => handleBedroomFilterClick(2)}
                className="py-2 px-1 rounded-lg bg-white hover:bg-[#233242] text-stone-800 hover:text-white text-xs font-bold border border-stone-200/90 text-center transition-colors shadow-2xs cursor-pointer"
              >
                2 Beds
              </button>
              <button
                type="button"
                onClick={() => handleBedroomFilterClick(3)}
                className="py-2 px-1 rounded-lg bg-white hover:bg-[#233242] text-stone-800 hover:text-white text-xs font-bold border border-stone-200/90 text-center transition-colors shadow-2xs cursor-pointer"
              >
                3 Beds
              </button>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-1 border-t border-stone-200">
            <button
              id="drawer-schedule-tour-btn"
              type="button"
              onClick={() => {
                onClose();
                onOpenTour();
              }}
              className="w-full py-3 px-4 text-xs uppercase tracking-wider font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all min-h-[44px] cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#FAF0D7]" />
              <span>Schedule a Tour</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                id="drawer-apply-now-btn"
                href={propertyInfo.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center py-2.5 px-3 text-xs uppercase tracking-wider font-bold text-[#233242] bg-amber-50 hover:bg-amber-100 border border-amber-300/80 rounded-xl transition-colors min-h-[42px] cursor-pointer"
              >
                <span>Apply Online</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-75" />
              </a>

              <a
                id="drawer-residents-btn"
                href={propertyInfo.residentsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center py-2.5 px-3 text-xs uppercase tracking-wider font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl transition-colors min-h-[42px] cursor-pointer"
              >
                <span>Resident Portal</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-60" />
              </a>
            </div>
          </div>

          {/* Direct Leasing Office Contact & Hours */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-[11px] text-stone-600">
            <a
              href={`tel:${propertyInfo.phone}`}
              className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{propertyInfo.displayPhone}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Call Office</span>
            </a>

            <a
              href="https://maps.google.com/?q=1000+Solon+Place+Way,+Waxahachie,+TX+75165"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 p-1 text-stone-600 hover:text-[#233242] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#c5a880] shrink-0 mt-0.5" />
              <span>{propertyInfo.address}</span>
            </a>

            <div className="flex items-center gap-2 p-1 text-stone-500">
              <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>Mon–Fri: 9am–6pm • Sat: 10am–4pm</span>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
