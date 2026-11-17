import React, { useState, useEffect } from 'react';
import { 
  Building2, Check, Phone, Mail, MapPin, ExternalLink, 
  Upload, Image as ImageIcon, ArrowLeft, ArrowRight, Trash2, Loader2,
  Clock, PawPrint, Share2
} from 'lucide-react';
import { usePropertyData } from '../../context/PropertyDataContext';
import { compressImage } from '../../utils/imageCompressor';

interface PropertyTabProps {
  onNotify: (msg: string) => void;
}

export const PropertyTab: React.FC<PropertyTabProps> = ({ onNotify }) => {
  const { propertyInfo, updatePropertyInfo } = usePropertyData();

  const [name, setName] = useState(propertyInfo.name || 'The Ellis on Solon');
  const [tagline, setTagline] = useState(propertyInfo.tagline || 'Modern Luxury Apartment Living in Waxahachie');
  const [address, setAddress] = useState(propertyInfo.address || '100 Solon Rd');
  const [cityStateZip, setCityStateZip] = useState(propertyInfo.cityStateZip || 'Waxahachie, TX 75165');
  const [phone, setPhone] = useState(propertyInfo.phone || '(972) 937-1234');
  const [email, setEmail] = useState(propertyInfo.email || 'ellisonsolon@gmail.com');
  const [applyUrl, setApplyUrl] = useState(propertyInfo.applyUrl || '');
  const [residentsUrl, setResidentsUrl] = useState(propertyInfo.residentsUrl || '');
  const [facebookUrl, setFacebookUrl] = useState(propertyInfo.facebookUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(propertyInfo.instagramUrl || '');

  // Pet Policy fields
  const [petAllowed, setPetAllowed] = useState(propertyInfo.petPolicy?.allowed || 'Dogs and Cats Allowed');
  const [petMaxPets, setPetMaxPets] = useState(propertyInfo.petPolicy?.maxPets || 2);
  const [petMaxWeight, setPetMaxWeight] = useState(propertyInfo.petPolicy?.maxWeight || '75 lbs');
  const [petRent, setPetRent] = useState(propertyInfo.petPolicy?.monthlyRent || '$35/month');
  const [petDeposit, setPetDeposit] = useState(propertyInfo.petPolicy?.deposit || '$300 ($150 refundable)');
  const [petHighlight, setPetHighlight] = useState(propertyInfo.petPolicy?.highlight || 'Pet friendly with on-site dog park and washing station');

  // Office Hours
  const defaultHours = propertyInfo.hours && propertyInfo.hours.length > 0 
    ? propertyInfo.hours 
    : [
        { days: 'Monday - Friday', time: '9:00 AM - 6:00 PM' },
        { days: 'Saturday', time: '10:00 AM - 5:00 PM' },
        { days: 'Sunday', time: 'Closed' }
      ];
  const [hoursMonFri, setHoursMonFri] = useState(defaultHours[0]?.time || '9:00 AM - 6:00 PM');
  const [hoursSat, setHoursSat] = useState(defaultHours[1]?.time || '10:00 AM - 5:00 PM');
  const [hoursSun, setHoursSun] = useState(defaultHours[2]?.time || 'Closed');

  // Property Details Unlimited Images
  const [propertyImages, setPropertyImages] = useState<string[]>(propertyInfo.images || []);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize local form state with propertyInfo updates
  useEffect(() => {
    if (!isSaving && propertyInfo) {
      if (propertyInfo.name) setName(propertyInfo.name);
      if (propertyInfo.tagline) setTagline(propertyInfo.tagline);
      if (propertyInfo.address) setAddress(propertyInfo.address);
      if (propertyInfo.cityStateZip) setCityStateZip(propertyInfo.cityStateZip);
      if (propertyInfo.phone || propertyInfo.displayPhone) setPhone(propertyInfo.phone || propertyInfo.displayPhone);
      if (propertyInfo.email) setEmail(propertyInfo.email);
      if (propertyInfo.applyUrl !== undefined) setApplyUrl(propertyInfo.applyUrl);
      if (propertyInfo.residentsUrl !== undefined) setResidentsUrl(propertyInfo.residentsUrl);
      if (propertyInfo.facebookUrl !== undefined) setFacebookUrl(propertyInfo.facebookUrl);
      if (propertyInfo.instagramUrl !== undefined) setInstagramUrl(propertyInfo.instagramUrl);
      if (propertyInfo.petPolicy) {
        if (propertyInfo.petPolicy.allowed !== undefined) setPetAllowed(propertyInfo.petPolicy.allowed);
        if (propertyInfo.petPolicy.maxPets !== undefined) setPetMaxPets(propertyInfo.petPolicy.maxPets);
        if (propertyInfo.petPolicy.maxWeight !== undefined) setPetMaxWeight(propertyInfo.petPolicy.maxWeight);
        if (propertyInfo.petPolicy.monthlyRent !== undefined) setPetRent(propertyInfo.petPolicy.monthlyRent);
        if (propertyInfo.petPolicy.deposit !== undefined) setPetDeposit(propertyInfo.petPolicy.deposit);
        if (propertyInfo.petPolicy.highlight !== undefined) setPetHighlight(propertyInfo.petPolicy.highlight);
      }
      if (propertyInfo.hours && propertyInfo.hours.length >= 3) {
        setHoursMonFri(propertyInfo.hours[0]?.time || '9:00 AM - 6:00 PM');
        setHoursSat(propertyInfo.hours[1]?.time || '10:00 AM - 5:00 PM');
        setHoursSun(propertyInfo.hours[2]?.time || 'Closed');
      }
      if (Array.isArray(propertyInfo.images)) {
        setPropertyImages(propertyInfo.images);
      }
    }
  }, [propertyInfo, isSaving]);

  // Upload multi images
  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    try {
      const fileArray = Array.from(files) as File[];
      const compressedList = await Promise.all(
        fileArray.map(file => compressImage(file, 880, 880, 0.65))
      );
      // Merge with existing images
      setPropertyImages(prev => [...prev, ...compressedList]);
      onNotify(`Added ${compressedList.length} property photo(s). Click "Save Property Information" to commit.`);
    } catch (err) {
      onNotify('Failed to process some property images.');
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setPropertyImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleReorderImage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= propertyImages.length) return;
    setPropertyImages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePropertyInfo({
        name: name.trim(),
        tagline: tagline.trim(),
        address: address.trim(),
        cityStateZip: cityStateZip.trim(),
        phone: phone.trim(),
        displayPhone: phone.trim(),
        email: email.trim(),
        applyUrl: applyUrl.trim(),
        residentsUrl: residentsUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        hours: [
          { days: 'Monday - Friday', time: hoursMonFri.trim() },
          { days: 'Saturday', time: hoursSat.trim() },
          { days: 'Sunday', time: hoursSun.trim() },
        ],
        petPolicy: {
          allowed: petAllowed.trim(),
          maxPets: Number(petMaxPets),
          maxWeight: petMaxWeight.trim(),
          monthlyRent: petRent.trim(),
          deposit: petDeposit.trim(),
          highlight: petHighlight.trim(),
        },
        images: propertyImages,
      });
      onNotify(`Property details and photos saved successfully!`);
    } catch (err) {
      onNotify('Failed to save property information.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#c5a880]" />
            <span>Property Information, Pet Policy & Photos</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              {propertyImages.length} Property Photos
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Updates leasing office contact info, office hours, pet policy, portal links, and property photos in one operation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-stone-50 p-5 rounded-xl border border-stone-200">
        {/* Basic Brand / Overview */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Property Branding & Header</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Community Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Tagline / Headline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-3 pt-2 border-t border-stone-200">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Contact Details & Location</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">City, State & ZIP</label>
              <input
                type="text"
                value={cityStateZip}
                onChange={(e) => setCityStateZip(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Leasing Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Leasing Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Office Hours */}
        <div className="space-y-3 pt-2 border-t border-stone-200">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Leasing Office Hours</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Monday - Friday</label>
              <input
                type="text"
                value={hoursMonFri}
                onChange={(e) => setHoursMonFri(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Saturday</label>
              <input
                type="text"
                value={hoursSat}
                onChange={(e) => setHoursSat(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Sunday</label>
              <input
                type="text"
                value={hoursSun}
                onChange={(e) => setHoursSun(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Pet Policy */}
        <div className="space-y-3 pt-2 border-t border-stone-200">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <PawPrint className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Pet Policy & Guidelines</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Pet Policy Description</label>
              <input
                type="text"
                value={petAllowed}
                onChange={(e) => setPetAllowed(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Max Pets per Apartment</label>
              <input
                type="number"
                min="0"
                max="5"
                value={petMaxPets}
                onChange={(e) => setPetMaxPets(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Weight Limit</label>
              <input
                type="text"
                value={petMaxWeight}
                onChange={(e) => setPetMaxWeight(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Monthly Pet Rent</label>
              <input
                type="text"
                value={petRent}
                onChange={(e) => setPetRent(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">One-Time Pet Fee</label>
              <input
                type="text"
                value={petDeposit}
                onChange={(e) => setPetDeposit(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Pet Amenities Highlight</label>
            <input
              type="text"
              value={petHighlight}
              onChange={(e) => setPetHighlight(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
            />
          </div>
        </div>

        {/* Links & Portals */}
        <div className="space-y-3 pt-2 border-t border-stone-200">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Portals & Social Links</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Online Application URL</label>
              <input
                type="url"
                value={applyUrl}
                onChange={(e) => setApplyUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Resident Portal URL</label>
              <input
                type="url"
                value={residentsUrl}
                onChange={(e) => setResidentsUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Facebook URL</label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Instagram URL</label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Unlimited Property Detail Photos */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-stone-800">
                Property Detail Photos (Unlimited)
              </label>
              <p className="text-[11px] text-stone-500">
                Upload photos of community grounds, building architecture, lobby, and aerial views.
              </p>
            </div>
            <label className="px-3 py-1.5 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photos</span>
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
              <span>Compressing property detail photos...</span>
            </div>
          )}

          {propertyImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
              {propertyImages.map((imgUrl, idx) => (
                <div key={idx} className="relative group aspect-4/3 rounded-lg border border-stone-200 overflow-hidden bg-stone-100 shadow-xs">
                  <img src={imgUrl} alt={`Property detail photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-700 text-white text-[9px] font-bold rounded">
                      Featured
                    </span>
                  )}
                  <div className="absolute inset-0 bg-stone-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleReorderImage(idx, 'left')}
                      disabled={idx === 0}
                      className="p-1.5 rounded bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      title="Move earlier"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorderImage(idx, 'right')}
                      disabled={idx === propertyImages.length - 1}
                      className="p-1.5 rounded bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      title="Move later"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-stone-400">
              No property photos attached yet. Click "Upload Photos" to add community pictures.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving || isProcessingImages}
            className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Save Property Information & Photos</span>
          </button>
        </div>
      </form>
    </div>
  );
};
