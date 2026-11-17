import React, { useEffect, useState } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight, Tag, Calendar, Copy, Check } from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';

interface SpecialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTour: () => void;
}

export const SpecialsModal: React.FC<SpecialsModalProps> = ({ isOpen, onClose, onOpenTour }) => {
  const { specialOffers, propertyInfo } = usePropertyData();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
  }, [isOpen, onClose]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="specials-modal-backdrop" 
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="specials-modal-container"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92dvh] sm:max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header Banner */}
        <div className="bg-gradient-to-r from-[#17222d] via-[#233242] to-[#2e4357] text-white p-5 sm:p-6 relative shrink-0">
          <button
            id="close-specials-modal-btn"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-stone-200 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF0D7]/20 text-[#FAF0D7] border border-[#c5a880]/40 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Exclusive Resident Incentives & Coupons</span>
          </div>

          <h2 className="font-serif-luxury text-xl sm:text-3xl font-bold text-[#FAF0D7]">
            Current Move-In Specials
          </h2>
          <p className="text-slate-200 text-xs sm:text-sm mt-1">
            Apply these verified promotional codes during leasing or mention to our staff on your tour.
          </p>
        </div>

        {/* Modal Body: Offers List */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {specialOffers.map((special) => (
            <div
              key={special.id}
              id={`special-offer-card-${special.id}`}
              className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/70 transition-all flex flex-col gap-2.5 relative group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900">
                    {special.badge}
                  </span>
                  {special.highlightCode && (
                    <button
                      onClick={() => handleCopyCode(special.highlightCode!)}
                      className="min-h-[36px] flex items-center gap-1.5 text-xs font-mono font-bold text-[#233242] bg-white hover:bg-stone-50 px-3 py-1 rounded border border-stone-300 shadow-2xs transition-colors cursor-pointer active:scale-95"
                      title="Click to copy coupon code"
                    >
                      <Tag className="w-3.5 h-3.5 text-[#c5a880]" />
                      <span>{special.highlightCode}</span>
                      {copiedCode === special.highlightCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
                      )}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-stone-500">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Valid: {special.expiresDate}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-[#233242]">
                {special.title}
              </h3>

              {/* Coupon Visual Graphics & Flyers */}
              {((special.images && special.images.length > 0) || special.image) && (
                <div className="flex gap-2 overflow-x-auto py-1">
                  {(special.images && special.images.length > 0 ? special.images : [special.image!]).map((imgUrl, i) => (
                    <img
                      key={i}
                      src={imgUrl}
                      alt={`${special.title} voucher ${i + 1}`}
                      className="h-28 sm:h-36 rounded-lg object-cover border border-amber-200 shadow-xs shrink-0"
                    />
                  ))}
                </div>
              )}

              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {special.description}
              </p>

              <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-stone-500 italic">
                  {special.terms}
                </span>
                <a
                  href={propertyInfo.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#233242] hover:text-[#2e4357] flex items-center gap-1 shrink-0 ml-auto min-h-[36px]"
                >
                  <span>Claim Online</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}

          {/* Additional Perks Box */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-2">
            <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#233242]" />
              <span>Standard Resident Benefits Included with Every Lease:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
              <div>✓ Access to Waxahachie’s Largest Dog Park</div>
              <div>✓ Resort Swimming Pool with Sundeck</div>
              <div>✓ Modern Fitness Studio & Playground</div>
              <div>✓ Full-Size Washer/Dryer Connections</div>
              <div>✓ High-Speed Internet & Cable Pre-Wired</div>
              <div>✓ 24-Hour Emergency Maintenance Team</div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <button
            id="specials-schedule-tour-btn"
            onClick={() => {
              onClose();
              onOpenTour();
            }}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs uppercase font-bold tracking-wider text-[#233242] hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center active:scale-95"
          >
            Schedule a Tour to Claim
          </button>

          <a
            id="specials-apply-now-btn"
            href={propertyInfo.applyUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-xs uppercase font-bold tracking-wider text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg shadow-md transition-colors cursor-pointer text-center flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Apply Now with Specials</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
