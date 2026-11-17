import React from 'react';
import { MapPin, Phone, Mail, Facebook, Instagram, ArrowUp, ExternalLink, Lock } from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onOpenSpecials: () => void;
  onOpenTour: () => void;
  onOpenCms?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSpecials, onOpenTour, onOpenCms }) => {
  const { propertyInfo } = usePropertyData();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="site-footer" className="bg-[#121b24] text-slate-300 border-t border-[#233242]">
      
      {/* Top Footer Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Contact Info */}
          <div className="space-y-4">
            <a href="#" className="inline-block" aria-label="The Ellis on Solon Home">
              <BrandLogo variant="full-badge" className="h-14 w-auto drop-shadow-md" />
            </a>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Warm hospitality and refined apartment living in Waxahachie, Texas. Offering newly upgraded 1, 2, and 3-bedroom residences.
            </p>

            <div className="space-y-2 text-xs text-slate-300 pt-2">
              <a 
                href="https://maps.google.com/?q=1000+Solon+Place+Way,+Waxahachie,+TX+75165"
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 hover:text-[#FAF0D7] transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#FAF0D7] shrink-0 mt-0.5" />
                <span>{propertyInfo.address}</span>
              </a>

              <a 
                href={`tel:${propertyInfo.phone}`}
                className="flex items-center gap-2 hover:text-white transition-colors font-semibold text-[#FAF0D7]"
              >
                <Phone className="w-4 h-4 text-[#FAF0D7] shrink-0" />
                <span>{propertyInfo.displayPhone}</span>
              </a>

              <a 
                href={`mailto:${propertyInfo.email}`}
                className="flex items-center gap-2 hover:text-[#FAF0D7] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#FAF0D7] shrink-0" />
                <span>{propertyInfo.email}</span>
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={propertyInfo.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#1877F2] flex items-center justify-center text-white transition-colors"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={propertyInfo.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E4405F] flex items-center justify-center text-white transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Office Hours */}
          <div>
            <h4 className="font-serif-luxury text-sm font-bold uppercase tracking-wider text-[#FAF0D7] mb-4">
              Leasing Office Hours
            </h4>
            <div className="space-y-2 text-xs">
              {propertyInfo.hours.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-[#233242]">
                  <span className="text-slate-300 font-medium">{item.days}</span>
                  <span className="text-[#FAF0D7] font-semibold">{item.time}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#1a2633] border border-[#233242] text-[11px] text-[#FAF0D7]/90">
              *Tours and appointments can be scheduled online anytime.
            </div>
          </div>

          {/* Col 3: Navigation & Quick Links */}
          <div>
            <h4 className="font-serif-luxury text-sm font-bold uppercase tracking-wider text-[#FAF0D7] mb-4">
              Explore Community
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#floor-plans" className="hover:text-[#FAF0D7] transition-colors">Floor Plans & Pricing</a>
              </li>
              <li>
                <a href="#amenities" className="hover:text-[#FAF0D7] transition-colors">Resort Amenities & Pet Park</a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-[#FAF0D7] transition-colors">Interactive Photo Gallery</a>
              </li>
              <li>
                <a href="#neighborhood" className="hover:text-[#FAF0D7] transition-colors">Waxahachie Neighborhood</a>
              </li>
              <li>
                <button 
                  onClick={onOpenSpecials}
                  className="text-[#FAF0D7] font-semibold hover:underline cursor-pointer text-left"
                >
                  Current Move-In Specials
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenTour}
                  className="hover:text-[#FAF0D7] transition-colors cursor-pointer text-left"
                >
                  Schedule a Tour
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Resident & Leasing Portals */}
          <div className="space-y-4">
            <h4 className="font-serif-luxury text-sm font-bold uppercase tracking-wider text-[#FAF0D7] mb-2">
              Resident & Leasing Portals
            </h4>
            
            <a
              id="footer-apply-now-btn"
              href={propertyInfo.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 text-xs uppercase font-bold tracking-wider text-slate-950 bg-[#FAF0D7] hover:bg-white rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-center"
            >
              <span>Apply Online (Blue Moon)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              id="footer-residents-btn"
              href={propertyInfo.residentsUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 text-xs uppercase font-bold tracking-wider text-[#FAF0D7] border border-[#FAF0D7]/40 hover:bg-[#FAF0D7]/10 rounded-lg transition-all flex items-center justify-center gap-2 text-center"
            >
              <span>Resident Portal (ResMan)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <p className="text-[11px] text-slate-400">
              Current residents can submit maintenance tickets and pay rent 24/7 via the ResMan tenant portal.
            </p>
          </div>

        </div>
      </div>

      {/* Bottom Legal, Equal Housing Bar */}
      <div className="border-t border-[#1a2633] bg-[#0c1219] py-6 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] sm:pb-6 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Equal Housing */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-center md:text-left">
            <button 
              onClick={onOpenCms}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer outline-none"
              title="Admin Dashboard Login"
            >
              <span className="font-bold border border-slate-500 px-1.5 py-0.5 rounded text-[10px]">
                EHO
              </span>
              <span className="underline decoration-transparent hover:decoration-slate-400 underline-offset-2">Equal Housing Opportunity</span>
            </button>
            <span>•</span>
            <span>Waxahachie, Ellis County, Texas</span>
          </div>

          {/* Middle: Crafted with passion by BrandOrigin */}
          <div className="text-center">
            <span className="text-stone-300 text-xs tracking-wide">
              Crafted with passion by{' '}
              <a
                href="https://brandorigin.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FAF0D7] hover:text-white font-bold underline decoration-[#c5a880] underline-offset-2 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Visit BrandOrigin (https://brandorigin.in/)"
              >
                <span>BrandOrigin</span>
                <ExternalLink className="w-3 h-3 text-[#c5a880]" />
              </a>
            </span>
          </div>

          {/* Right: Copyright and Back to Top */}
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} The Ellis on Solon. All rights reserved.</span>
            <button
              id="back-to-top-btn"
              onClick={scrollToTop}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

    </footer>
  );
};
