import React, { useState } from 'react';
import { 
  Tag, Plus, Trash2, Edit3, Check, Upload, Image as ImageIcon, 
  ArrowLeft, ArrowRight, X, Loader2 
} from 'lucide-react';
import { usePropertyData } from '../../context/PropertyDataContext';
import { SpecialOffer } from '../../types';
import { compressImage } from '../../utils/imageCompressor';

interface CouponsTabProps {
  onNotify: (msg: string) => void;
}

export const CouponsTab: React.FC<CouponsTabProps> = ({ onNotify }) => {
  const { specialOffers, addSpecialOffer, updateSpecialOffer, deleteSpecialOffer } = usePropertyData();

  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponTitle, setCouponTitle] = useState('');
  const [couponBadge, setCouponBadge] = useState('Limited Time');
  const [couponType, setCouponType] = useState<'fixed' | 'percentage' | 'months_free' | 'fee_waiver'>('fixed');
  const [couponValue, setCouponValue] = useState('$500 Off');
  const [couponExpires, setCouponExpires] = useState('September 30, 2026');
  const [couponTerms, setCouponTerms] = useState('Requires 12+ month lease. Valid for new residents only.');
  const [couponDesc, setCouponDesc] = useState('');
  const [couponImages, setCouponImages] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteCouponId, setConfirmDeleteCouponId] = useState<string | null>(null);

  const handleStartEdit = (offer: SpecialOffer) => {
    setEditingCouponId(offer.id);
    setShowAddCoupon(true);
    setCouponCode(offer.highlightCode || '');
    setCouponTitle(offer.title);
    setCouponBadge(offer.badge);
    setCouponType(offer.discountType || 'fixed');
    setCouponValue(offer.discountValue || '');
    setCouponExpires(offer.expiresDate);
    setCouponTerms(offer.terms);
    setCouponDesc(offer.description);

    const existingImages = Array.isArray(offer.images) && offer.images.length > 0
      ? offer.images
      : (offer.image ? [offer.image] : []);
    setCouponImages([...existingImages]);
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    try {
      const fileArray = Array.from(files) as File[];
      const compressedList = await Promise.all(
        fileArray.map(file => compressImage(file, 880, 880, 0.65))
      );
      // Merge with existing images without dropping
      setCouponImages(prev => [...prev, ...compressedList]);
      onNotify(`Added ${compressedList.length} coupon image(s).`);
    } catch (err) {
      onNotify('Could not process some images.');
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setCouponImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleReorderImage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= couponImages.length) return;
    setCouponImages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponTitle.trim()) {
      onNotify('Please enter a coupon offer title.');
      return;
    }

    setIsSaving(true);
    try {
      const targetCode = couponCode.trim().toUpperCase();
      const primaryImage = couponImages[0] || '';

      if (editingCouponId) {
        await updateSpecialOffer(editingCouponId, {
          title: couponTitle.trim(),
          highlightCode: targetCode,
          badge: couponBadge.trim() || 'Promo Coupon',
          discountType: couponType,
          discountValue: couponValue.trim(),
          expiresDate: couponExpires.trim() || 'Limited Time',
          terms: couponTerms.trim(),
          description: couponDesc.trim(),
          image: primaryImage,
          images: couponImages,
        });
        onNotify(`Coupon updated with ${couponImages.length} image(s) and saved permanently!`);
      } else {
        const newCoupon: SpecialOffer = {
          id: 'coupon_' + Date.now(),
          title: couponTitle.trim(),
          highlightCode: targetCode || undefined,
          badge: couponBadge.trim() || 'Promo Coupon',
          discountType: couponType,
          discountValue: couponValue.trim(),
          expiresDate: couponExpires.trim() || 'Limited Time',
          terms: couponTerms.trim(),
          description: couponDesc.trim() || (targetCode ? `Special offer with code ${targetCode}.` : 'Special promotional offer.'),
          image: primaryImage || undefined,
          images: couponImages,
        };
        await addSpecialOffer(newCoupon);
        onNotify(`New discount coupon created with ${couponImages.length} image(s) and saved permanently!`);
      }

      setEditingCouponId(null);
      setShowAddCoupon(false);
      setCouponCode('');
      setCouponTitle('');
      setCouponDesc('');
      setCouponImages([]);
    } catch (err) {
      onNotify('Error saving coupon.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    await deleteSpecialOffer(id);
    setConfirmDeleteCouponId(null);
    onNotify('Coupon offer deleted.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#c5a880]" />
            <span>Discount Coupons & Promotional Flyers</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              {specialOffers.length} Active
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Upload promotional banners, seasonal flyers, and promo codes. Persists across refreshes.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddCoupon(!showAddCoupon);
            setEditingCouponId(null);
            setCouponImages([]);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddCoupon ? 'Cancel' : 'Create New Discount Coupon'}</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showAddCoupon && (
        <form onSubmit={handleCouponSubmit} className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
            {editingCouponId ? 'Edit Coupon & Upload Images' : 'Create New Promotional Offer'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Coupon Title *</label>
              <input
                type="text"
                value={couponTitle}
                onChange={(e) => setCouponTitle(e.target.value)}
                required
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Promo Code</label>
              <input
                type="text"
                placeholder="e.g. ELLISFALL26"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded uppercase font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Badge Text</label>
              <input
                type="text"
                value={couponBadge}
                onChange={(e) => setCouponBadge(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Discount Value</label>
              <input
                type="text"
                value={couponValue}
                onChange={(e) => setCouponValue(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">Expiration</label>
              <input
                type="text"
                value={couponExpires}
                onChange={(e) => setCouponExpires(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={couponDesc}
              onChange={(e) => setCouponDesc(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">Terms & Conditions</label>
            <input
              type="text"
              value={couponTerms}
              onChange={(e) => setCouponTerms(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
            />
          </div>

          {/* Unlimited Images for Coupons */}
          <div className="bg-white p-3.5 rounded-lg border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-stone-800">
                  Coupon Graphics & Promotional Flyers (Unlimited)
                </label>
                <p className="text-[11px] text-stone-500">
                  Upload promotional banners, flyers, social cards, or special voucher graphics.
                </p>
              </div>
              <label className="px-3 py-1.5 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadImages}
                  disabled={isProcessingImages}
                  className="hidden"
                />
              </label>
            </div>

            {isProcessingImages && (
              <div className="flex items-center gap-2 py-1 text-xs text-stone-600">
                <Loader2 className="w-4 h-4 animate-spin text-[#233242]" />
                <span>Optimizing coupon images...</span>
              </div>
            )}

            {couponImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                {couponImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative group aspect-4/3 rounded-lg border border-stone-200 overflow-hidden bg-stone-100 shadow-xs">
                    <img src={imgUrl} alt={`Coupon image ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 px-1 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleReorderImage(idx, 'left')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                        title="Move left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderImage(idx, 'right')}
                        disabled={idx === couponImages.length - 1}
                        className="p-1 rounded bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                        title="Move right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic py-1">No coupon images attached yet. (Optional)</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddCoupon(false);
                setEditingCouponId(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isProcessingImages}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{editingCouponId ? 'Save Coupon Changes' : 'Save New Coupon'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Coupons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {specialOffers.map((offer) => {
          const offerImages = Array.isArray(offer.images) && offer.images.length > 0
            ? offer.images
            : (offer.image ? [offer.image] : []);

          return (
            <div
              key={offer.id}
              className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                      {offer.badge}
                    </span>
                    {offer.highlightCode && (
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
                        {offer.highlightCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(offer)}
                      className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-[#233242] transition-colors cursor-pointer"
                      title="Edit coupon"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteCouponId(offer.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-stone-900 text-sm mb-1">{offer.title}</h4>
                <p className="text-xs text-stone-600 mb-2 line-clamp-2">{offer.description}</p>

                {/* Images Preview strip */}
                {offerImages.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 mb-2 scrollbar-thin">
                    {offerImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`${offer.title} flyer ${i + 1}`}
                        className="w-16 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
                      />
                    ))}
                    <span className="text-[10px] font-semibold text-stone-500 shrink-0">
                      {offerImages.length} image{offerImages.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-2 text-xs">
                <span className="font-bold text-emerald-700">{offer.discountValue || 'Special Incentive'}</span>
                <span className="text-stone-400">Expires: {offer.expiresDate}</span>
              </div>

              {/* In-card Delete Confirmation */}
              {confirmDeleteCouponId === offer.id && (
                <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs text-white p-4 rounded-xl flex flex-col items-center justify-center text-center z-10 animate-in fade-in">
                  <p className="text-xs font-bold text-red-300 mb-2">Delete coupon offer "{offer.title}"?</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteCoupon(offer.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 rounded text-white cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteCouponId(null)}
                      className="px-3 py-1.5 text-xs font-semibold bg-stone-700 hover:bg-stone-600 rounded text-stone-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
