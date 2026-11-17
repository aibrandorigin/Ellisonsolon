import React, { useState } from 'react';
import { X, Check, Calculator, ExternalLink, Calendar, Square, BedDouble, Bath, Shield, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { FloorPlan } from '../types';
import { usePropertyData } from '../context/PropertyDataContext';

interface FloorPlanModalProps {
  plan: FloorPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenTour: (planId: string) => void;
}

export const FloorPlanModal: React.FC<FloorPlanModalProps> = ({ plan, isOpen, onClose, onOpenTour }) => {
  const { propertyInfo } = usePropertyData();
  const [hasPet, setHasPet] = useState(false);
  const [petCount, setPetCount] = useState(1);
  const [hasCarport, setHasCarport] = useState(false);
  const [leaseTerm, setLeaseTerm] = useState<'12' | '14' | '6'>('12');
  const [activeView, setActiveView] = useState<'schematic' | 'photos'>('photos');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  React.useEffect(() => {
    if (plan && ((plan.images && plan.images.length > 0) || plan.imageUrl)) {
      setActiveView('photos');
      setActivePhotoIdx(0);
    } else {
      setActiveView('schematic');
    }
  }, [plan, isOpen]);

  if (!isOpen || !plan) return null;

  const planImages = Array.isArray(plan.images) && plan.images.length > 0 
    ? plan.images 
    : (plan.imageUrl ? [plan.imageUrl] : []);

  // Monthly estimate calculation
  let termAdjustment = 0;
  if (leaseTerm === '14') termAdjustment = -30;
  if (leaseTerm === '6') termAdjustment = +85;

  const baseRent = plan.startingPrice + termAdjustment;
  const petRentTotal = hasPet ? petCount * 25 : 0;
  const parkingTotal = hasCarport ? 35 : 0;
  const estimatedUtilities = plan.bedrooms === 1 ? 95 : plan.bedrooms === 2 ? 125 : 155;
  const totalMonthlyEstimate = baseRent + petRentTotal + parkingTotal;

  return (
    <div 
      id="floor-plan-modal-backdrop" 
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="floor-plan-modal-container"
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92dvh] sm:max-h-[96vh]"
      >
        {/* Top Header - Sleek & Compact */}
        <div className="bg-[#233242] text-[#FAF0D7] px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between border-b border-slate-700/70 shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#FAF0D7] text-[#233242]">
              Plan {plan.code}
            </span>
            <h2 className="font-serif-luxury text-lg sm:text-2xl font-bold text-white tracking-wide">
              {plan.name}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-300 font-medium">
              <span>{plan.bedrooms} Bed</span>
              <span>•</span>
              <span>{plan.bathrooms} Bath</span>
              <span>•</span>
              <span>{plan.sqft.toLocaleString()} Sq. Ft.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-amber-300 font-bold">
                From ${plan.startingPrice.toLocaleString()}/mo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              id="modal-quick-apply-btn"
              href={propertyInfo.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#FAF0D7] hover:bg-[#f3e5c0] text-[#233242] rounded-lg transition-colors min-h-[36px]"
            >
              <span>Apply Now</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              id="close-floor-plan-modal-btn"
              onClick={onClose}
              className="p-2 sm:p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Arranged Side-by-Side to Fit With Smooth Scroll */}
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto">
          
          {/* Left Column: Blueprint Schematic + Features */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            
            {/* Architectural Blueprint / Photos View Switcher */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 relative flex flex-col items-center justify-center">
              <div className="w-full flex items-center justify-between mb-2 px-1">
                {planImages.length > 0 ? (
                  <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveView('schematic')}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                        activeView === 'schematic' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Schematic
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView('photos')}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                        activeView === 'photos' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Photos ({planImages.length})</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-stone-200">
                    Architectural Schematic • Plan {plan.code}
                  </span>
                )}

                {activeView === 'photos' && planImages.length > 0 && (
                  <span className="text-[10px] text-stone-500 font-medium">
                    {activePhotoIdx + 1} of {planImages.length} photos
                  </span>
                )}
              </div>

              {activeView === 'photos' && planImages.length > 0 ? (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full max-w-[480px] h-56 sm:h-64 rounded-xl overflow-hidden border border-stone-200 bg-white shadow-inner flex items-center justify-center p-2">
                    <img
                      src={planImages[activePhotoIdx] || planImages[0]}
                      alt={`${plan.name} floor plan layout ${activePhotoIdx + 1}`}
                      className="w-full h-full object-contain cursor-zoom-in hover:scale-105 transition-transform duration-300"
                      onClick={() => window.open(planImages[activePhotoIdx] || planImages[0], '_blank')}
                      title="Click to view full image in new tab"
                    />
                    {planImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActivePhotoIdx(prev => (prev > 0 ? prev - 1 : planImages.length - 1))}
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition-colors cursor-pointer shadow-md"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivePhotoIdx(prev => (prev < planImages.length - 1 ? prev + 1 : 0))}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition-colors cursor-pointer shadow-md"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-stone-900/80 text-white text-[10px] font-mono font-medium rounded-md backdrop-blur-xs">
                          {activePhotoIdx + 1} / {planImages.length}
                        </span>
                      </>
                    )}
                  </div>
                  {planImages.length > 1 && (
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto max-w-full py-1">
                      {planImages.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActivePhotoIdx(i)}
                          className={`w-10 h-10 rounded border-2 overflow-hidden shrink-0 cursor-pointer ${
                            activePhotoIdx === i ? 'border-[#233242] scale-105' : 'border-transparent opacity-70'
                          }`}
                        >
                          <img src={img} alt="thumb" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Scaled SVG blueprint representation */
                <svg 
                  viewBox="0 0 460 250" 
                  className="w-full max-w-[400px] h-44 sm:h-52 drop-shadow-xs select-none"
                  aria-label={`Schematic floor plan diagram for ${plan.name}`}
                >
                  {/* Exterior Walls */}
                  <rect x="15" y="15" width="430" height="220" rx="4" fill="#ffffff" stroke="#233242" strokeWidth="3.5" />
                  
                  {/* Patio/Balcony */}
                  <rect x="20" y="20" width="120" height="65" fill="#f5f5f4" stroke="#a8a29e" strokeDasharray="3,3" strokeWidth="1.5" />
                  <text x="80" y="50" textAnchor="middle" fill="#78716c" fontSize="10" fontWeight="600">Patio / Balcony</text>
                  <text x="80" y="65" textAnchor="middle" fill="#a8a29e" fontSize="8.5">{plan.dimensions.balcony}</text>

                  {/* Living / Dining Area */}
                  <rect x="145" y="20" width="295" height="120" fill="#fdfbf7" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="290" y="75" textAnchor="middle" fill="#233242" fontSize="12" fontWeight="bold">Living & Dining Room</text>
                  <text x="290" y="92" textAnchor="middle" fill="#64748b" fontSize="9.5">{plan.dimensions.living}</text>
                  
                  {/* Kitchen */}
                  <rect x="20" y="90" width="120" height="75" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x="80" y="125" textAnchor="middle" fill="#334155" fontSize="10.5" fontWeight="bold">Gourmet Kitchen</text>
                  <text x="80" y="140" textAnchor="middle" fill="#64748b" fontSize="8.5">Granite Breakfast Bar</text>
                  <line x1="110" y1="92" x2="110" y2="162" stroke="#c5a880" strokeWidth="2.5" />

                  {/* Master Bedroom */}
                  <rect x="145" y="145" width="180" height="85" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="235" y="185" textAnchor="middle" fill="#233242" fontSize="11" fontWeight="bold">
                    {plan.bedrooms === 1 ? 'Master Bedroom' : 'Primary Suite'}
                  </text>
                  <text x="235" y="200" textAnchor="middle" fill="#64748b" fontSize="9">{plan.dimensions.masterBed}</text>
                  
                  {/* Walk-in Closet */}
                  <rect x="330" y="145" width="110" height="42" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
                  <text x="385" y="170" textAnchor="middle" fill="#475569" fontSize="9.5" fontWeight="600">Walk-In Closet</text>

                  {/* Luxury Bathroom */}
                  <rect x="330" y="190" width="110" height="40" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
                  <text x="385" y="215" textAnchor="middle" fill="#475569" fontSize="9.5" fontWeight="600">
                    {plan.bathrooms > 1 ? 'Primary Bath' : 'Full Bath'}
                  </text>

                  {/* Utility Laundry Room */}
                  <rect x="20" y="170" width="120" height="60" fill="#fefce8" stroke="#fef08a" strokeWidth="1" />
                  <text x="80" y="198" textAnchor="middle" fill="#854d0e" fontSize="9.5" fontWeight="bold">W/D Laundry Room</text>
                  <text x="80" y="212" textAnchor="middle" fill="#a16207" fontSize="8">Full-Size Hookups</text>
                </svg>
              )}
            </div>

            {/* In-Home Features list - 2 Compact Columns */}
            <div className="bg-stone-50/70 p-3 rounded-xl border border-stone-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center justify-between">
                <span>Included Residence Amenities</span>
                <span className="text-[#233242] font-semibold">{plan.description}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-stone-700">
                {plan.features.slice(0, 4).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Pricing & Interactive Rent Calculator */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            
            {/* Compact Rent Estimator Card */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#233242] uppercase tracking-wider border-b border-stone-200 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>Monthly Estimate</span>
                </div>
                <span className="text-[11px] text-stone-500 font-normal lowercase">no hidden fees</span>
              </div>

              {/* Lease Term Options */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 mb-1">
                  <span>Lease Term</span>
                  <span className="text-[#c5a880] text-[10px]">14 mo saves $30/mo</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setLeaseTerm('14')}
                    className={`py-1 px-1 rounded border text-center transition-all cursor-pointer ${
                      leaseTerm === '14'
                        ? 'bg-[#233242] text-white border-[#233242] font-bold'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    14 Mo (-$30)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaseTerm('12')}
                    className={`py-1 px-1 rounded border text-center transition-all cursor-pointer ${
                      leaseTerm === '12'
                        ? 'bg-[#233242] text-white border-[#233242] font-bold'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    12 Mo (Std)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaseTerm('6')}
                    className={`py-1 px-1 rounded border text-center transition-all cursor-pointer ${
                      leaseTerm === '6'
                        ? 'bg-[#233242] text-white border-[#233242] font-bold'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    6 Mo
                  </button>
                </div>
              </div>

              {/* Add-ons in compact rows */}
              <div className="space-y-1.5 pt-1 text-xs">
                <label className="flex items-center justify-between text-stone-700 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={hasPet}
                      onChange={(e) => setHasPet(e.target.checked)}
                      className="rounded text-[#233242] focus:ring-[#233242]"
                    />
                    <span>Pet Fee ($25/mo)</span>
                  </span>
                  {hasPet && (
                    <select
                      value={petCount}
                      onChange={(e) => setPetCount(Number(e.target.value))}
                      className="text-[11px] border border-stone-300 rounded px-1 py-0.5 bg-white"
                    >
                      <option value={1}>1 Pet</option>
                      <option value={2}>2 Pets</option>
                    </select>
                  )}
                </label>

                <label className="flex items-center justify-between text-stone-700 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={hasCarport}
                      onChange={(e) => setHasCarport(e.target.checked)}
                      className="rounded text-[#233242] focus:ring-[#233242]"
                    />
                    <span>Reserved Covered Carport</span>
                  </span>
                  <span className="text-[11px] text-stone-500 font-semibold">+$35</span>
                </label>
              </div>

              {/* Cost Calculation Summary */}
              <div className="pt-2 border-t border-stone-200 space-y-1 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Base Rent ({leaseTerm} mo):</span>
                  <span className="font-semibold">${baseRent.toLocaleString()}</span>
                </div>
                {(hasPet || hasCarport) && (
                  <div className="flex justify-between text-stone-600">
                    <span>Selected Options:</span>
                    <span>+${petRentTotal + parkingTotal}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-stone-300 flex justify-between items-baseline text-stone-900 font-bold">
                  <span className="text-xs">Est. Monthly Total:</span>
                  <span className="text-lg text-[#233242]">${totalMonthlyEstimate.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Transparent TAA Guarantee note */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs text-slate-800">
              <Shield className="w-4 h-4 text-[#233242] shrink-0" />
              <p className="text-[11px] text-slate-600 leading-tight">
                Official <strong>TAA Lease Contracts</strong> powered by Blue Moon Forms. Fast, transparent leasing.
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                id="modal-plan-apply-now-btn"
                href={propertyInfo.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-[#233242] bg-[#FAF0D7] hover:bg-[#f3e5c0] rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 text-center border border-[#c5a880]/60 active:scale-98"
              >
                <span>Apply Online</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                id="modal-plan-schedule-tour-btn"
                onClick={() => {
                  onClose();
                  onOpenTour(plan.id);
                }}
                className="min-h-[44px] py-2.5 px-3 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <Calendar className="w-3.5 h-3.5 text-[#c5a880]" />
                <span>Schedule Tour</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
