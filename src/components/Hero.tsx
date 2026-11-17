import React, { useState } from 'react';
import { Sparkles, Calendar, Mouse, Shield, Dog, Waves, Search, Check } from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';

interface HeroProps {
  onOpenSpecials: () => void;
  onOpenTour: () => void;
  onFilterBedrooms: (beds: number | null) => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenSpecials, onOpenTour, onFilterBedrooms }) => {
  const { propertyInfo } = usePropertyData();
  const [selectedBeds, setSelectedBeds] = useState<string>('all');
  const [maxBudget, setMaxBudget] = useState<string>('all');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBeds === 'all') {
      onFilterBedrooms(null);
    } else {
      onFilterBedrooms(parseInt(selectedBeds, 10));
    }
    const el = document.getElementById('floor-plans');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const heroImage = (propertyInfo.images && propertyInfo.images.length > 0)
    ? propertyInfo.images[0]
    : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1920&q=80";

  return (
    <section id="hero-section" className="relative bg-stone-900 text-white overflow-hidden">
      {/* Background Image with warm gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt={`${propertyInfo.name} community living`}
          className="w-full h-full object-cover object-center opacity-45 transform scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101720] via-[#17222d]/70 to-[#233242]/40" />
        <div className="absolute inset-0 bg-[#233242]/30 mix-blend-multiply" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16 flex flex-col items-center text-center">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3 animate-in fade-in slide-in-from-bottom-3 duration-500 max-w-full">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#FAF0D7]/20 text-[#FAF0D7] border border-[#c5a880]/50 backdrop-blur-xs text-center">
            <Sparkles className="w-3.5 h-3.5 text-[#FAF0D7] shrink-0" />
            <span>Newly Renovated Interior Packages</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-800/80 text-slate-200 border border-slate-600/50 backdrop-blur-xs text-center">
            <Dog className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
            <span>Waxahachie’s Largest Dog Park</span>
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-serif-luxury text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-4xl text-white drop-shadow-md leading-[1.2] sm:leading-[1.15]">
          A Peaceful Texas Haven, <br className="hidden sm:inline" />
          <span className="italic font-normal text-[#FAF0D7]">Refined for Modern Living.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-sm sm:text-lg text-slate-200 max-w-2xl font-light leading-relaxed drop-shadow-xs px-1">
          Discover spacious 1, 2, and 3-bedroom apartment homes nestled on Solon Place Way in Waxahachie. Featuring granite countertops, resort pool, and immediate access to I-35E.
        </p>

        {/* Direct Action Buttons - Touch friendly on mobile */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto max-w-md sm:max-w-none">
          <a
            id="hero-explore-floorplans-btn"
            href="#floor-plans"
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-xs uppercase font-bold tracking-wider text-slate-950 bg-[#FAF0D7] hover:bg-white rounded-xl sm:rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center active:scale-95 text-center"
          >
            Explore Floor Plans
          </a>

          <button
            id="hero-schedule-tour-btn"
            onClick={onOpenTour}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-xs uppercase font-bold tracking-wider text-white bg-[#233242] hover:bg-[#2e4357] border border-slate-500/50 rounded-xl sm:rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
          >
            <Calendar className="w-4 h-4 text-[#FAF0D7]" />
            <span>Schedule a Tour</span>
          </button>

          <button
            id="hero-view-specials-btn"
            onClick={onOpenSpecials}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs uppercase font-bold tracking-wider text-[#FAF0D7] bg-white/10 hover:bg-white/20 border border-white/25 rounded-xl sm:rounded-lg backdrop-blur-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Current Specials</span>
          </button>
        </div>

        {/* Quick Availability Search Bar */}
        <div className="hidden mt-7 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl text-stone-800 border border-white/40">
          <div className="text-left text-xs font-bold uppercase tracking-wider text-stone-600 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#233242]">
              <Search className="w-3.5 h-3.5 text-[#c5a880]" />
              Find Your Ideal Floor Plan
            </span>
            <span className="text-[11px] text-[#233242] font-bold hidden sm:inline">
              1, 2 & 3 Bedrooms Available from $1,150/mo
            </span>
          </div>

          <form onSubmit={handleQuickSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 text-left">
                Bedrooms
              </label>
              <select
                value={selectedBeds}
                onChange={(e) => setSelectedBeds(e.target.value)}
                className="w-full text-base sm:text-xs font-medium px-3 py-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-[#233242] focus:outline-none min-h-[44px] sm:min-h-0"
              >
                <option value="all">All Floor Plans</option>
                <option value="1">1 Bedroom (from $1,150)</option>
                <option value="2">2 Bedrooms (from $1,390)</option>
                <option value="3">3 Bedrooms (from $1,695)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 text-left">
                Price Range
              </label>
              <select
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-full text-base sm:text-xs font-medium px-3 py-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-[#233242] focus:outline-none min-h-[44px] sm:min-h-0"
              >
                <option value="all">Any Price</option>
                <option value="1300">Under $1,300 / mo</option>
                <option value="1500">Under $1,500 / mo</option>
                <option value="1800">Under $1,800 / mo</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 text-left">
                Move-In Timeline
              </label>
              <select className="w-full text-base sm:text-xs font-medium px-3 py-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-[#233242] focus:outline-none min-h-[44px] sm:min-h-0">
                <option>Immediate / This Month</option>
                <option>Next 30 Days</option>
                <option>Next 60 Days</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                id="hero-filter-search-submit-btn"
                className="w-full min-h-[44px] py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Units</span>
              </button>
            </div>
          </form>
        </div>

        {/* Feature Highlights Ticker */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs text-stone-300 max-w-4xl w-full text-left">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-[#c5a880] shrink-0" />
            <span>Resort Pool & Sun Deck</span>
          </div>
          <div className="flex items-center gap-2">
            <Dog className="w-4 h-4 text-[#c5a880] shrink-0" />
            <span>Largest Dog Park in Town</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#c5a880] shrink-0" />
            <span>Perimeter Fencing</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#c5a880] shrink-0" />
            <span>Granite & Hardwood Planks</span>
          </div>
        </div>

      </div>

      {/* Bottom scroll cue with modern symbol */}
      <a
        href="#floor-plans"
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[#FAF0D7]/90 hover:text-white transition-colors flex items-center gap-2 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider bg-[#17222d]/70 hover:bg-[#17222d]/90 px-4 py-1.5 rounded-full border border-[#c5a880]/40 backdrop-blur-xs shadow-md group"
      >
        <Mouse className="w-3.5 h-3.5 text-[#c5a880] group-hover:scale-110 transition-transform" />
        <span>Explore Residences</span>
      </a>
    </section>
  );
};
