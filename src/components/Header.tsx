import React, { useState } from 'react';
import { MapPin, Phone, Menu, X, ExternalLink, Sparkles, Calendar } from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  onOpenSpecials: () => void;
  onOpenTour: () => void;
  onOpenCms?: () => void;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
  onFilterBedrooms?: (beds: number | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSpecials,
  onOpenTour,
  mobileMenuOpen: controlledMobileMenuOpen,
  setMobileMenuOpen: setControlledMobileMenuOpen,
}) => {
  const { propertyInfo } = usePropertyData();
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);

  const isMenuOpen = controlledMobileMenuOpen !== undefined ? controlledMobileMenuOpen : internalMenuOpen;
  const setIsMenuOpen = setControlledMobileMenuOpen || setInternalMenuOpen;

  const navLinks = [
    { name: 'Floor Plans', href: '#floor-plans' },
    { name: 'Amenities', href: '#amenities' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Neighborhood', href: '#neighborhood' },
  ];

  return (
    <header id="site-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-2xs">
      {/* Top micro-bar for announcement in Deep Slate Navy with safe-area support */}
      <div id="top-announcement-bar" className="bg-[#17222d] text-[#FAF0D7] text-xs pt-[max(0.375rem,env(safe-area-inset-top))] pb-1 px-3 sm:px-4 border-b border-[#233242]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 font-medium min-w-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#c5a880]/30 text-[#FAF0D7] border border-[#c5a880]/50 shrink-0">
              Special
            </span>
            <span className="hidden sm:inline truncate">Up to 1 Month Free on select 2 & 3 Bedroom Floor Plans!</span>
            <span className="sm:hidden text-[11px] truncate font-medium">Up to 1 Month Free on Select Units!</span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-4 text-[11px] shrink-0">
            <button
              id="announcement-view-specials-btn"
              onClick={onOpenSpecials}
              className="text-[#FAF0D7] hover:text-white font-bold underline decoration-[#c5a880] underline-offset-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              View Specials
            </button>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <button
              id="announcement-schedule-tour-btn"
              onClick={onOpenTour}
              className="text-[#FAF0D7] hover:text-[#c5a880] transition-colors cursor-pointer hidden md:inline font-semibold whitespace-nowrap"
            >
              Schedule a Tour
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-auto sm:py-3 gap-2">
          
          {/* Logo & Sub-header */}
          <div id="header-brand-container" className="flex flex-col min-w-0 pr-1">
            <a href="#" id="header-logo-link" className="group flex items-center gap-2">
              <BrandLogo className="h-8 sm:h-11 w-auto max-w-[155px] sm:max-w-none shadow-xs rounded-xs" variant="full-badge" />
            </a>
            
            {/* Property address & phone directly beneath the logo (Desktop & Tablet only) */}
            <div id="header-sub-info" className="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-600 mt-1">
              <a 
                id="header-address-link"
                href="https://maps.google.com/?q=1000+Solon+Place+Way,+Waxahachie,+TX+75165" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-1 hover:text-[#233242] transition-colors whitespace-nowrap"
                title="View on Google Maps"
              >
                <MapPin className="w-3 h-3 text-[#c5a880] shrink-0" />
                <span>{propertyInfo.address}</span>
              </a>
              <span className="text-stone-300">•</span>
              <a 
                id="header-phone-link"
                href={`tel:${propertyInfo.phone}`} 
                className="flex items-center gap-1 font-semibold text-[#233242] hover:text-[#324b64] transition-colors whitespace-nowrap"
                title="Call leasing office"
              >
                <Phone className="w-3 h-3 text-[#c5a880] shrink-0" />
                <span>{propertyInfo.displayPhone}</span>
              </a>
            </div>
          </div>

          {/* Desktop Navigation Links (Visible on Large Desktop >= 1024px) */}
          <nav id="desktop-nav-menu" className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                id={`nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                href={link.href}
                className="text-sm font-semibold text-stone-700 hover:text-[#233242] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#233242] hover:after:w-full after:transition-all"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Header Actions & Nav Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* CTA Buttons: Apply Now & Residents (Visible on Tablet and Desktop >= 640px) */}
            <div id="header-cta-group" className="hidden sm:flex items-center gap-2">
              <a
                id="header-apply-now-btn"
                href={propertyInfo.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-3.5 sm:px-4 py-2 text-xs uppercase tracking-wider font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-md shadow-xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <span>Apply Now</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-80" />
              </a>

              <a
                id="header-residents-btn"
                href={propertyInfo.residentsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-3 sm:px-3.5 py-2 text-xs uppercase tracking-wider font-bold text-[#233242] border border-[#233242]/35 hover:bg-[#233242]/5 rounded-md transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <span>Residents</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-70" />
              </a>
            </div>

            {/* Mobile-only Quick Tour CTA Button (< 640px) */}
            <button
              id="mobile-header-tour-btn"
              onClick={onOpenTour}
              className="sm:hidden inline-flex items-center justify-center px-3 py-1.5 text-[11px] uppercase font-bold tracking-wider text-white bg-[#233242] hover:bg-[#2e4357] rounded-full shadow-xs active:scale-95 transition-transform whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-3 h-3 text-[#FAF0D7] mr-1" />
              <span>Tour</span>
            </button>

            {/* Mobile & Tablet Hamburger Menu Toggle (< 1024px) */}
            <button
              id="mobile-menu-toggle-btn"
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-stone-700 hover:text-[#233242] hover:bg-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#233242] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6 text-[#233242]" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

