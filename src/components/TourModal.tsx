import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Mail, Phone, Home, CheckCircle2, Send, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { usePropertyData } from '../context/PropertyDataContext';
import { TourBookingData, Enquiry, EmailDeliveryStatus } from '../types';

interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFloorPlanId?: string;
}

export const TourModal: React.FC<TourModalProps> = ({ isOpen, onClose, selectedFloorPlanId }) => {
  const { propertyInfo, floorPlans, submitEnquiry } = usePropertyData();
  const [formData, setFormData] = useState<TourBookingData>({
    tourType: 'in-person',
    preferredDate: '',
    preferredTime: '11:00 AM',
    floorPlanId: selectedFloorPlanId || 'all',
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<Enquiry | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailDeliveryStatus | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFloorPlanId) {
      setFormData((prev) => ({ ...prev, floorPlanId: selectedFloorPlanId }));
    }
  }, [selectedFloorPlanId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
      setSubmitted(false);
      setSubmittedEnquiry(null);
      setEmailStatus(null);
      setEmailError(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Set default date to tomorrow
  useEffect(() => {
    if (isOpen && !formData.preferredDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const iso = tomorrow.toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, preferredDate: iso }));
    }
  }, [isOpen, formData.preferredDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.name.trim() || !formData.phone.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      const floorPlanObj = floorPlans.find((f) => f.id === formData.floorPlanId);
      const floorPlanName = floorPlanObj ? `${floorPlanObj.code} - ${floorPlanObj.name}` : 'Any Available Floor Plan';
      const serviceName = formData.tourType === 'in-person' ? 'In-Person Guided Tour' : 'Live Virtual Tour';

      const result = await submitEnquiry({
        customerName: formData.name,
        phone: formData.phone,
        email: formData.email?.trim() || undefined,
        enquiryType: 'Tour Request',
        service: serviceName,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        floorPlanInterest: floorPlanName,
        message: formData.notes?.trim() || undefined,
        location: propertyInfo.address || 'The Ellis on Solon (Waxahachie, TX)',
      });

      setSubmittedEnquiry(result.enquiry);
      setEmailStatus(result.emailStatus);
      setEmailError(result.emailError || null);
      setSubmitted(true);
    } catch (err: unknown) {
      console.error('Failed to submit tour enquiry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = [
    '9:30 AM',
    '11:00 AM',
    '1:00 PM',
    '2:30 PM',
    '4:00 PM',
    '5:15 PM',
  ];

  return (
    <div 
      id="tour-modal-backdrop" 
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div 
        id="tour-modal-container"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92dvh] sm:max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17222d] via-[#233242] to-[#2e4357] text-white p-5 sm:p-6 relative shrink-0">
          <button
            id="close-tour-modal-btn"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-stone-200 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close tour modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-[#FAF0D7] uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4 text-[#c5a880]" />
            <span>Visit The Ellis on Solon</span>
          </div>
          <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#FAF0D7]">Schedule Your Tour</h2>
          <p className="text-slate-200 text-xs mt-1">
            Experience our newly upgraded homes, resort pool, and Waxahachie’s largest private dog park.
          </p>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-6 sm:p-8 text-center space-y-4 overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            
            <div>
              <div className="inline-block px-3 py-1 bg-stone-100 border border-stone-300 rounded-full text-xs font-mono font-bold text-[#233242] mb-2">
                Enquiry ID: {submittedEnquiry?.id}
              </div>
              <h3 className="text-xl font-bold text-stone-800">Tour Request Received!</h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mt-1">
                Your appointment request is saved in our leasing system. A leasing specialist will confirm your tour shortly.
              </p>
            </div>

            {/* Email Notification Status Banner */}
            <div className={`p-3 rounded-xl border text-left text-xs ${
              emailStatus === 'sent' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : emailStatus === 'failed'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-stone-50 border-stone-200 text-stone-700'
            }`}>
              <div className="font-semibold flex items-center gap-1.5">
                {emailStatus === 'sent' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Email Notification Sent to {submittedEnquiry?.emailRecipient || propertyInfo.email}</span>
                  </>
                ) : emailStatus === 'failed' ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Notification queued for staff review in Admin Portal</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-stone-500 shrink-0" />
                    <span>Notification processing</span>
                  </>
                )}
              </div>
              <div className="text-[11px] mt-1 opacity-90">
                {emailStatus === 'sent'
                  ? 'The leasing team has been notified with your complete booking information.'
                  : 'Your tour details are securely preserved in the property database.'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-left text-xs text-stone-700 space-y-1.5 max-w-sm mx-auto">
              <div><strong>Tour Date:</strong> {formData.preferredDate} at {formData.preferredTime}</div>
              <div><strong>Format:</strong> {formData.tourType === 'in-person' ? 'In-Person Guided' : 'Live Virtual'}</div>
              <div><strong>Floor Plan:</strong> {floorPlans.find((f) => f.id === formData.floorPlanId)?.name || 'General Tour'}</div>
              <div><strong>Contact:</strong> {formData.name} &bull; {formData.phone}</div>
              {formData.email && <div><strong>Email:</strong> {formData.email}</div>}
              <div><strong>Location:</strong> {propertyInfo.address}</div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
            {/* Tour Type Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                1. Select Tour Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'in-person', label: 'In-Person', sub: 'With Leasing Agent' },
                  { id: 'virtual', label: 'Live Virtual', sub: 'Via Video Call' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, tourType: type.id as any })}
                    className={`min-h-[48px] p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      formData.tourType === type.id
                        ? 'border-[#233242] bg-slate-100 text-[#233242] font-bold ring-2 ring-[#233242]/20'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-[10px] text-stone-500">{type.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Preferred Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#233242] focus:outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Preferred Time *</span>
                </label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#233242] focus:outline-none bg-white min-h-[42px]"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Floor Plan Interest */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-stone-400" />
                <span>Floor Plan Interest</span>
              </label>
              <select
                value={formData.floorPlanId}
                onChange={(e) => setFormData({ ...formData, floorPlanId: e.target.value })}
                className="w-full px-3 py-2 text-base sm:text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#233242] focus:outline-none bg-white min-h-[42px]"
              >
                <option value="all">Any Available / Show Me Options</option>
                {floorPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.code} - {plan.name} ({plan.bedrooms} Bed, {plan.bathrooms} Bath - {plan.sqft} sq ft, from ${plan.startingPrice}/mo)
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 pt-1 border-t border-stone-100">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#233242] focus:outline-none min-h-[42px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>Email Address (Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="sarah@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#233242] focus:outline-none min-h-[42px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(972) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#233242] focus:outline-none min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Target Move-in Date or Questions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Do you have pets? Specific floor preference or move-in timeline?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-base sm:text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#233242] focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Direct Email alternative note */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 pt-1 gap-1">
              <span>Or reach our team directly:</span>
              <a
                href={`mailto:${propertyInfo.email}`}
                className="text-[#233242] font-semibold underline hover:text-[#2e4357] flex items-center gap-1"
              >
                <span>{propertyInfo.email}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                id="submit-tour-booking-btn"
                disabled={submitting}
                className="w-full min-h-[48px] py-3 px-4 text-xs font-bold uppercase tracking-wider text-white bg-[#233242] hover:bg-[#2e4357] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#FAF0D7]" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Confirm Tour Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
