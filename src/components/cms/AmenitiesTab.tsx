import React, { useState } from 'react';
import { 
  Plus, Trash2, Edit3, Check, Upload, Sparkles, Star, 
  ArrowLeft, ArrowRight, Image as ImageIcon, X, Loader2 
} from 'lucide-react';
import { usePropertyData } from '../../context/PropertyDataContext';
import { Amenity } from '../../types';
import { compressImage } from '../../utils/imageCompressor';

interface AmenitiesTabProps {
  onNotify: (msg: string) => void;
}

const AVAILABLE_ICONS = [
  'Sparkles', 'Waves', 'Dog', 'Dumbbell', 'UtensilsCrossed', 'ChefHat',
  'Home', 'Shirt', 'Sun', 'FolderKanban', 'Trees', 'Flame', 'Wind', 'Clock', 'ShieldCheck'
];

export const AmenitiesTab: React.FC<AmenitiesTabProps> = ({ onNotify }) => {
  const { amenities, addAmenity, updateAmenity, deleteAmenity } = usePropertyData();

  const [showAddAmenity, setShowAddAmenity] = useState(false);
  const [amenityTitle, setAmenityTitle] = useState('');
  const [amenityDesc, setAmenityDesc] = useState('');
  const [amenityCategory, setAmenityCategory] = useState<'community' | 'apartment'>('community');
  const [amenityIcon, setAmenityIcon] = useState('Sparkles');
  const [amenityHighlight, setAmenityHighlight] = useState(false);
  const [amenityImages, setAmenityImages] = useState<string[]>([]);
  const [isProcessingNewImages, setIsProcessingNewImages] = useState(false);

  // Edit Amenity State
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<'community' | 'apartment'>('community');
  const [editIcon, setEditIcon] = useState('Sparkles');
  const [editHighlight, setEditHighlight] = useState(false);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isProcessingEditImages, setIsProcessingEditImages] = useState(false);

  // Status & Delete confirmations
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Upload handler for Add Amenity (Multi-file upload)
  const handleUploadNewImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingNewImages(true);
    try {
      const fileArray = Array.from(files) as File[];
      const compressedList = await Promise.all(
        fileArray.map(file => compressImage(file, 880, 880, 0.65))
      );
      // Merge with existing images
      setAmenityImages(prev => [...prev, ...compressedList]);
      onNotify(`Added ${compressedList.length} image(s) to amenity.`);
    } catch (err) {
      onNotify('Unable to process some images.');
    } finally {
      setIsProcessingNewImages(false);
      e.target.value = '';
    }
  };

  // Upload handler for Edit Amenity (Multi-file upload)
  const handleUploadEditImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingEditImages(true);
    try {
      const fileArray = Array.from(files) as File[];
      const compressedList = await Promise.all(
        fileArray.map(file => compressImage(file, 880, 880, 0.65))
      );
      // Merge with existing images
      setEditImages(prev => [...prev, ...compressedList]);
      onNotify(`Added ${compressedList.length} image(s). Click "Save Changes" to commit.`);
    } catch (err) {
      onNotify('Unable to process some images.');
    } finally {
      setIsProcessingEditImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setAmenityImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleReorderNewImage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= amenityImages.length) return;
    setAmenityImages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleRemoveEditImage = (index: number) => {
    setEditImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleReorderEditImage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= editImages.length) return;
    setEditImages(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amenityTitle.trim()) {
      onNotify('Please provide an amenity title.');
      return;
    }

    setIsSaving(true);
    try {
      const primaryImage = amenityImages[0] || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';

      const newAmenity: Amenity = {
        id: 'amenity_' + Date.now(),
        title: amenityTitle.trim(),
        description: amenityDesc.trim() || 'Modern feature at The Ellis on Solon.',
        category: amenityCategory,
        icon: amenityIcon,
        highlight: amenityHighlight,
        image: primaryImage,
        images: amenityImages.length > 0 ? amenityImages : [primaryImage],
      };

      await addAmenity(newAmenity);
      setShowAddAmenity(false);
      setAmenityTitle('');
      setAmenityDesc('');
      setAmenityHighlight(false);
      setAmenityImages([]);
      onNotify(`Amenity "${newAmenity.title}" with ${amenityImages.length} image(s) saved permanently!`);
    } catch (err) {
      onNotify('Failed to save amenity.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (item: Amenity) => {
    setEditingAmenity(item);
    setEditTitle(item.title);
    setEditDesc(item.description);
    setEditCategory((item.category as any) || 'community');
    setEditIcon(item.icon || 'Sparkles');
    setEditHighlight(!!item.highlight);
    
    const existingImages = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : (item.image ? [item.image] : []);
    setEditImages([...existingImages]);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAmenity) return;
    if (!editTitle.trim()) {
      onNotify('Please provide a title.');
      return;
    }

    setIsSaving(true);
    try {
      const primaryImage = editImages[0] || '';

      await updateAmenity(editingAmenity.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        category: editCategory,
        icon: editIcon,
        highlight: editHighlight,
        image: primaryImage,
        images: editImages,
      });

      setEditingAmenity(null);
      onNotify(`Amenity "${editTitle.trim()}" updated with ${editImages.length} image(s) and saved permanently!`);
    } catch (err) {
      onNotify('Failed to update amenity.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAmenity = async (id: string) => {
    await deleteAmenity(id);
    setConfirmDeleteId(null);
    onNotify('Amenity removed.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c5a880]" />
            <span>Community & Apartment Amenities</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              {amenities.length} Amenities
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Add or delete old and new amenities with unlimited photos. Changes persist permanently across refreshes.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddAmenity(!showAddAmenity);
            setEditingAmenity(null);
            setAmenityImages([]);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddAmenity ? 'Cancel' : 'Add New Amenity'}</span>
        </button>
      </div>

      {/* Add New Amenity Form */}
      {showAddAmenity && (
        <form onSubmit={handleAddSubmit} className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">Add New Community / Apartment Amenity</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Amenity Title *</label>
              <input
                type="text"
                placeholder="e.g. Resort-Style Swimming Pool & Cabanas"
                value={amenityTitle}
                onChange={(e) => setAmenityTitle(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Amenity Category</label>
              <select
                value={amenityCategory}
                onChange={(e) => setAmenityCategory(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              >
                <option value="community">Community Amenity</option>
                <option value="apartment">Apartment Interior Feature</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Icon Representation</label>
              <select
                value={amenityIcon}
                onChange={(e) => setAmenityIcon(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              >
                {AVAILABLE_ICONS.map((ico) => (
                  <option key={ico} value={ico}>{ico}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                <input
                  type="checkbox"
                  checked={amenityHighlight}
                  onChange={(e) => setAmenityHighlight(e.target.checked)}
                  className="rounded text-[#233242] focus:ring-0"
                />
                <span>Highlight in Homepage Ribbon</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={amenityDesc}
              onChange={(e) => setAmenityDesc(e.target.value)}
              placeholder="Describe the amenity feature, hours, or luxury finishes..."
              className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
            />
          </div>

          {/* Unlimited Images for Amenity */}
          <div className="bg-white p-3.5 rounded-lg border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-stone-800">
                  Amenity Photos & Visuals (Unlimited)
                </label>
                <p className="text-[11px] text-stone-500">
                  Upload multiple photos of this amenity. First photo is displayed as primary cover.
                </p>
              </div>
              <label className="px-3 py-1.5 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadNewImages}
                  disabled={isProcessingNewImages}
                  className="hidden"
                />
              </label>
            </div>

            {isProcessingNewImages && (
              <div className="flex items-center gap-2 py-1 text-xs text-stone-600">
                <Loader2 className="w-4 h-4 animate-spin text-[#233242]" />
                <span>Processing amenity photos...</span>
              </div>
            )}

            {amenityImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                {amenityImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative group aspect-4/3 rounded-lg border border-stone-200 overflow-hidden bg-stone-100 shadow-xs">
                    <img src={imgUrl} alt={`Amenity photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 px-1 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleReorderNewImage(idx, 'left')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                        title="Move left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(idx)}
                        className="p-1 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorderNewImage(idx, 'right')}
                        disabled={idx === amenityImages.length - 1}
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
              <p className="text-xs text-stone-400 italic py-1">No custom photos attached yet. Default visual will be used.</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddAmenity(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isProcessingNewImages}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save Amenity</span>
            </button>
          </div>
        </form>
      )}

      {/* Edit Amenity Modal */}
      {editingAmenity && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xl w-full border border-stone-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#c5a880]" />
                <span>Edit Amenity • {editingAmenity.title}</span>
              </h4>
              <button
                onClick={() => setEditingAmenity(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  >
                    <option value="community">Community Amenity</option>
                    <option value="apartment">Apartment Feature</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Icon</label>
                  <select
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  >
                    {AVAILABLE_ICONS.map((ico) => (
                      <option key={ico} value={ico}>{ico}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800 py-1">
                  <input
                    type="checkbox"
                    checked={editHighlight}
                    onChange={(e) => setEditHighlight(e.target.checked)}
                    className="rounded text-[#233242]"
                  />
                  <span>Highlight in Homepage Ribbon</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              {/* Edit Amenity Images Manager */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-stone-800">
                      Amenity Photos ({editImages.length} images)
                    </label>
                    <p className="text-[11px] text-stone-500">
                      Upload multiple photos. Adding new photos merges them without removing existing images.
                    </p>
                  </div>
                  <label className="px-3 py-1.5 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Add Photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUploadEditImages}
                      disabled={isProcessingEditImages}
                      className="hidden"
                    />
                  </label>
                </div>

                {isProcessingEditImages && (
                  <div className="flex items-center gap-2 py-1 text-xs text-stone-600">
                    <Loader2 className="w-4 h-4 animate-spin text-[#233242]" />
                    <span>Processing images...</span>
                  </div>
                )}

                {editImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {editImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group aspect-4/3 rounded-lg border border-stone-200 overflow-hidden bg-white shadow-xs">
                        <img src={imgUrl} alt={`Amenity image ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-700 text-white text-[9px] font-bold rounded">
                            Cover
                          </span>
                        )}
                        <div className="absolute inset-0 bg-stone-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReorderEditImage(idx, 'left')}
                            disabled={idx === 0}
                            className="p-1 rounded bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                            title="Move left"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveEditImage(idx)}
                            className="p-1 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorderEditImage(idx, 'right')}
                            disabled={idx === editImages.length - 1}
                            className="p-1 rounded bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                            title="Move right"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingAmenity(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isProcessingEditImages}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Amenities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {amenities.map((item) => {
          const itemImages = Array.isArray(item.images) && item.images.length > 0
            ? item.images
            : (item.image ? [item.image] : []);

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                  <img
                    src={itemImages[0] || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-900/80 text-white backdrop-blur-xs">
                    {item.category === 'community' ? 'Community' : 'Apartment'}
                  </span>

                  {item.highlight && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-stone-900 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Featured</span>
                    </span>
                  )}
                </div>

                <div className="p-3.5">
                  <h4 className="font-bold text-stone-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-stone-500 line-clamp-2">{item.description}</p>
                  
                  {itemImages.length > 1 && (
                    <p className="text-[11px] font-semibold text-[#c5a880] mt-1.5">
                      +{itemImages.length - 1} more photo{itemImages.length > 2 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-500 font-mono">Icon: {item.icon}</span>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 rounded-lg text-stone-600 hover:bg-white hover:text-[#233242] transition-colors cursor-pointer"
                    title="Edit amenity & photos"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete amenity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* In-card Delete Confirmation */}
              {confirmDeleteId === item.id && (
                <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs text-white p-4 rounded-xl flex flex-col items-center justify-center text-center z-10 animate-in fade-in">
                  <p className="text-xs font-bold text-red-300 mb-2">Delete amenity "{item.title}"?</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteAmenity(item.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 rounded text-white cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
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
