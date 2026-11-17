import React, { useState } from 'react';
import { Sparkles, Calendar, Facebook, Instagram, Phone, MessageSquare, Send, Check, X, MessageCircle, Loader2 } from 'lucide-react';
import { PROPERTY_INFO } from '../data/propertyData';
import { usePropertyData } from '../context/PropertyDataContext';

interface FloatingSidebarProps {
  onOpenSpecials: () => void;
  onOpenTour: () => void;
}

export const FloatingSidebar: React.FC<FloatingSidebarProps> = ({ onOpenSpecials, onOpenTour }) => {
  const { propertyInfo, submitEnquiry } = usePropertyData();
  const [isOpen, setIsOpen] = useState(false);
  const [quickQuestionOpen, setQuickQuestionOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickMsg, setQuickMsg] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickSentId, setQuickSentId] = useState<string | null>(null);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || quickSubmitting) return;

    setQuickSubmitting(true);
    try {
      const res = await submitEnquiry({
        customerName: quickName.trim(),
        phone: quickPhone.trim() || '(972) 938-0980 (Direct callback)',
        email: quickEmail.trim() || undefined,
        enquiryType: 'Quick Message',
        service: 'Quick Message Inquiry',
        message: quickMsg.trim(),
        location: 'The Ellis on Solon (Waxahachie, TX)',
      });

      setQuickSentId(res.enquiry.id);
      setTimeout(() => {
        setQuickQuestionOpen(false);
        setQuickSentId(null);
        setQuickName('');
        setQuickPhone('');
        setQuickEmail('');
        setQuickMsg('');
      }, 3500);
    } catch (err) {
      console.error('Failed to submit quick inquiry:', err);
    } finally {
      setQuickSubmitting(false);
    }
  };

  return (
    <aside 
      id="floating-message-widget" 
      aria-label="Leasing Assistance Widget"
      className="hidden sm:flex fixed bottom-6 right-6 z-30 flex-col items-end select-none"
    >
      {/* Expanded Quick Help Menu (Floats upward from bottom message icon) */}
      {isOpen && (
        <div 
          id="floating-help-card"
          className="mb-3 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-[#233242] text-[#FAF0D7] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-[#17222d] px-4 py-3 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FAF0D7]/15 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-[#FAF0D7]" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">How Can We Help?</h4>
                <p className="text-[10px] text-slate-300">The Ellis on Solon Leasing Team</p>
              </div>
            </div>
            <button
              id="close-floating-menu-btn"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              title="Close Menu"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Options */}
          <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">
            {/* Specials Button */}
            <button
              id="floating-specials-btn"
              onClick={() => {
                onOpenSpecials();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF0D7]/15 hover:bg-[#FAF0D7]/25 text-[#FAF0D7] border border-[#c5a880]/50 transition-all text-xs font-semibold text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#c5a880]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-white leading-tight">Leasing Specials</div>
                <div className="text-[10px] text-[#FAF0D7]/90">Up to 1 Month Free Rent on Select Units</div>
              </div>
            </button>

            {/* Schedule a Tour Button */}
            <button
              id="floating-tour-btn"
              onClick={() => {
                onOpenTour();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all text-xs font-semibold text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#17222d] border border-slate-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4 text-[#FAF0D7]" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold leading-tight">Schedule a Tour</div>
                <div className="text-[10px] text-slate-300">Book In-Person or Virtual Visit</div>
              </div>
            </button>

            {/* Call Office */}
            <a
              id="floating-call-btn"
              href={`tel:${propertyInfo.phone || PROPERTY_INFO.phone}`}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all text-xs font-semibold text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#17222d] border border-slate-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Phone className="w-4 h-4 text-[#FAF0D7]" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold leading-tight">Call Leasing Office</div>
                <div className="text-[10px] text-slate-300">{propertyInfo.displayPhone || propertyInfo.phone || '(972) 938-0980'} • Mon–Sat</div>
              </div>
            </a>

            {/* Email Leasing Team */}
            <a
              id="floating-mailto-link"
              href={`mailto:${propertyInfo.email || PROPERTY_INFO.email}?subject=${encodeURIComponent('Inquiry from The Ellis on Solon Website')}`}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs text-left"
            >
              <div className="w-7 h-7 rounded-md bg-[#17222d] flex items-center justify-center shrink-0">
                <Send className="w-3.5 h-3.5 text-[#FAF0D7]" />
              </div>
              <span className="truncate">Email {propertyInfo.email || PROPERTY_INFO.email}</span>
            </a>

            {/* Quick Ask Toggle */}
            <div className="pt-1">
              <button
                id="floating-quick-inquiry-btn"
                onClick={() => setQuickQuestionOpen(!quickQuestionOpen)}
                className="w-full py-1.5 px-3 text-center text-xs font-medium text-[#FAF0D7] bg-[#17222d] hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {quickQuestionOpen ? 'Hide Quick Question' : '💬 Send Quick Message'}
              </button>
            </div>

            {/* Inline Quick Message Form */}
            {quickQuestionOpen && (
              <div className="p-3 bg-[#17222d] rounded-xl border border-slate-700 animate-in fade-in duration-150 mt-1">
                {quickSentId ? (
                  <div className="p-3 text-center text-xs text-amber-200 bg-slate-800/90 rounded-lg border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Message Received!</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300">
                      ID: {quickSentId}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Notification dispatched to {propertyInfo.email || PROPERTY_INFO.email}.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleQuickSubmit} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      required
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#c5a880]"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number (e.g. 972-000-0000)"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#c5a880]"
                    />
                    <input
                      type="email"
                      placeholder="Email Address (Optional)"
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#c5a880]"
                    />
                    <textarea
                      placeholder="Your question or desired floor plan... *"
                      rows={2}
                      value={quickMsg}
                      onChange={(e) => setQuickMsg(e.target.value)}
                      required
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-[#c5a880] resize-none"
                    />
                    <button
                      type="submit"
                      disabled={quickSubmitting}
                      className="w-full py-1.5 text-xs font-bold bg-[#FAF0D7] text-[#17222d] hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {quickSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Socials */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
              <a
                id="floating-facebook-link"
                href={PROPERTY_INFO.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-blue-600/30 text-stone-200 hover:text-white transition-all text-xs font-medium"
              >
                <Facebook className="w-3.5 h-3.5 text-blue-400" />
                <span>Facebook</span>
              </a>

              <a
                id="floating-instagram-link"
                href={PROPERTY_INFO.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-pink-600/30 text-stone-200 hover:text-white transition-all text-xs font-medium"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Circular Message Icon at Bottom of Screen */}
      <button
        id="toggle-floating-message-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#233242] hover:bg-[#2e4357] text-[#FAF0D7] shadow-2xl border-2 border-[#c5a880] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label={isOpen ? 'Close message assistance' : 'Open message assistance'}
        title="Chat / How Can We Help?"
      >
        {/* Pulsing indicator badge */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[9px] font-bold text-slate-950 items-center justify-center">
            1
          </span>
        </span>

        {isOpen ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        ) : (
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#FAF0D7] group-hover:rotate-12 transition-transform" />
        )}
      </button>
    </aside>
  );
};
