import React from 'react';
import { BedDouble, Phone, Calendar, Sparkles, Menu, X } from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';

interface MobileBottomBarProps {
  onOpenSpecials: () => void;
  onOpenTour: () => void;
  onToggleMenu?: () => void;
  isMenuOpen?: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onOpenSpecials,
  onOpenTour,
  onToggleMenu,
  isMenuOpen = false,
}) => {
  const { propertyInfo } = usePropertyData();

  const handleScrollToFloorPlans = () => {
    if (isMenuOpen && onToggleMenu) {
      onToggleMenu();
    }
    const el = document.getElementById('floor-plans');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      id="mobile-sticky-bottom-bar"
      aria-label="Quick Mobile Navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#17222d]/96 backdrop-blur-xl border-t border-[#233242] shadow-[0_-8px_25px_rgba(0,0,0,0.35)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 px-1.5 select-none"
    >
      <div className="grid grid-cols-5 items-center justify-between gap-0.5 max-w-md mx-auto">
        
        {/* 1. Floor Plans */}
        <button
          id="mobile-nav-plans-btn"
          type="button"
          onClick={handleScrollToFloorPlans}
          className="flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-slate-300 hover:text-white active:bg-white/10 active:scale-95 transition-all cursor-pointer min-h-[48px]"
        >
          <BedDouble className="w-5 h-5 text-slate-300 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">Plans</span>
        </button>

        {/* 2. Move-in Specials */}
        <button
          id="mobile-nav-specials-btn"
          type="button"
          onClick={onOpenSpecials}
          className="relative flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-slate-300 hover:text-white active:bg-white/10 active:scale-95 transition-all cursor-pointer min-h-[48px]"
        >
          {/* Micro gold badge */}
          <span className="absolute top-0 right-2 px-1 py-0.2 bg-[#c5a880] text-[#17222d] text-[8px] font-extrabold uppercase rounded-full tracking-wider leading-none shadow-xs">
            Free
          </span>
          <Sparkles className="w-5 h-5 text-[#FAF0D7] mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">Specials</span>
        </button>

        {/* 3. Center Highlighted Schedule Tour CTA Button */}
        <button
          id="mobile-nav-tour-btn"
          type="button"
          onClick={onOpenTour}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl bg-gradient-to-b from-[#FAF0D7] to-[#e6d8b5] text-[#17222d] shadow-lg border border-[#c5a880]/80 active:scale-95 transition-all cursor-pointer min-h-[50px] -mt-2"
        >
          <Calendar className="w-5 h-5 text-[#17222d] mb-0.5" />
          <span className="text-[10px] font-extrabold tracking-wider uppercase leading-none">Tour</span>
        </button>

        {/* 4. Direct Call */}
        <a
          id="mobile-nav-call-btn"
          href={`tel:${propertyInfo.phone}`}
          className="flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-slate-300 hover:text-white active:bg-white/10 active:scale-95 transition-all min-h-[48px]"
          title={`Call ${propertyInfo.displayPhone}`}
        >
          <Phone className="w-5 h-5 text-emerald-400 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">Call</span>
        </a>

        {/* 5. Mobile Menu Toggle */}
        <button
          id="mobile-nav-menu-btn"
          type="button"
          onClick={onToggleMenu}
          className="flex flex-col items-center justify-center py-1 px-0.5 rounded-xl text-slate-300 hover:text-white active:bg-white/10 active:scale-95 transition-all cursor-pointer min-h-[48px]"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {isMenuOpen ? (
            <X className="w-5 h-5 text-[#FAF0D7] mb-0.5" />
          ) : (
            <Menu className="w-5 h-5 text-slate-300 mb-0.5" />
          )}
          <span className="text-[10px] font-semibold tracking-tight">
            {isMenuOpen ? 'Close' : 'Menu'}
          </span>
        </button>

      </div>
    </nav>
  );
};

