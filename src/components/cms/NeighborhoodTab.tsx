import React, { useState } from 'react';
import { 
  Navigation, Plus, Trash2, Edit3, Check, Upload, MapPin, 
  Clock, GraduationCap, Utensils, ShoppingBag, Trees, ArrowLeft, ArrowRight, X, Loader2 
} from 'lucide-react';
import { usePropertyData } from '../../context/PropertyDataContext';
import { NeighborhoodSpot } from '../../types';
import { compressImage } from '../../utils/imageCompressor';

interface NeighborhoodTabProps {
  onNotify: (msg: string) => void;
}

export const NeighborhoodTab: React.FC<NeighborhoodTabProps> = ({ onNotify }) => {
  const { 
    neighborhoodSpots, 
    addNeighborhoodSpot, 
    updateNeighborhoodSpot, 
    deleteNeighborhoodSpot 
  } = usePropertyData();

  const [showAddSpot, setShowAddSpot] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'shopping' | 'dining' | 'education' | 'recreation'>('shopping');
  const [distance, setDistance] = useState('');
  const [timeDrive, setTimeDrive] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [spotImages, setSpotImages] = useState<string[]>([]);
  const [isProcessingNewImages, setIsProcessingNewImages] = useState(false);

  // Edit State
  const [editingSpot, setEditingSpot] = useState<NeighborhoodSpot | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'shopping' | 'dining' | 'education' | 'recreation'>('shopping');
  const [editDistance, setEditDistance] = useState('');
  const [editTimeDrive, setEditTimeDrive] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isProcessingEditImages, setIsProcessingEditImages] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteSpotId, setConfirmDeleteSpotId] = useState<string | null>(null);

  const handleUploadNewImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingNewImages(true);
    try {
      const fileArray = Array.from(files) as File[];
      const compressedList = await Promise.all(
        fileArray.map(file => compressImage(file, 880, 880, 0.65))
      );
      setSpotImages(prev => [...prev, ...compressedList]);
      onNotify(`Added ${compressedList.length} image(s).`);
    } catch (err) {
      onNotify('Failed to compress some images.');
    } finally {
      setIsProcessingNewImages(false);
      e.target.value = '';
    }
  };

  const handleUploadEditImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingEditImages(true);
    try {
      const fileArray = Array.from(files) as File[];
      const compressedList = await Promise.all(
        fileArray.map(file => compressImage(file, 880, 880, 0.65))
      );
      setEditImages(prev => [...prev, ...compressedList]);
      onNotify(`Added ${compressedList.length} image(s). Click "Save Changes" to commit.`);
    } catch (err) {
      onNotify('Failed to compress some images.');
    } finally {
      setIsProcessingEditImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setSpotImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleReorderNewImage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= spotImages.length) return;
    setSpotImages(prev => {
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
    if (!name.trim()) {
      onNotify('Please provide a destination name.');
      return;
    }

    setIsSaving(true);
    try {
      const primaryImage = spotImages[0] || undefined;

      const newSpot: NeighborhoodSpot = {
        id: 'spot_' + Date.now(),
        name: name.trim(),
        category,
        distance: distance.trim() || 'Nearby',
        timeDrive: timeDrive.trim() || 'Few mins',
        address: address.trim() || undefined,
        description: description.trim() || `Popular ${category} destination in Waxahachie.`,
        image: primaryImage,
        images: spotImages,
      };

      await addNeighborhoodSpot(newSpot);
      setShowAddSpot(false);
      setName('');
      setDistance('');
      setTimeDrive('');
      setAddress('');
      setDescription('');
      setSpotImages([]);
      onNotify(`Destination "${newSpot.name}" with ${spotImages.length} image(s) saved permanently!`);
    } catch (err) {
      onNotify('Error saving neighbourhood destination.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (spot: NeighborhoodSpot) => {
    setEditingSpot(spot);
    setEditName(spot.name);
    setEditCategory((spot.category as any) || 'shopping');
    setEditDistance(spot.distance);
    setEditTimeDrive(spot.timeDrive);
    setEditAddress(spot.address || '');
    setEditDescription(spot.description);
    
    const existing = Array.isArray(spot.images) && spot.images.length > 0
      ? spot.images
      : (spot.image ? [spot.image] : []);
    setEditImages([...existing]);
    setConfirmDeleteSpotId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpot) return;
    if (!editName.trim()) {
      onNotify('Please provide a destination name.');
      return;
    }

    setIsSaving(true);
    try {
      const primaryImage = editImages[0] || '';

      await updateNeighborhoodSpot(editingSpot.id, {
        name: editName.trim(),
        category: editCategory,
        distance: editDistance.trim() || 'Nearby',
        timeDrive: editTimeDrive.trim() || 'Few mins',
        address: editAddress.trim() || '',
        description: editDescription.trim(),
        image: primaryImage,
        images: editImages,
      });

      setEditingSpot(null);
      onNotify(`Destination "${editName.trim()}" updated with ${editImages.length} image(s) and saved permanently!`);
    } catch (err) {
      onNotify('Error updating destination.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSpot = async (id: string) => {
    await deleteNeighborhoodSpot(id);
    setConfirmDeleteSpotId(null);
    onNotify('Destination removed.');
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'education': return <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />;
      case 'dining': return <Utensils className="w-3.5 h-3.5 text-amber-700" />;
      case 'shopping': return <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />;
      case 'recreation': return <Trees className="w-3.5 h-3.5 text-emerald-700" />;
      default: return <MapPin className="w-3.5 h-3.5 text-[#c5a880]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#c5a880]" />
            <span>Waxahachie Neighbourhood Spots & Maps</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              {neighborhoodSpots.length} Spots
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage nearby dining, schools, shopping, and parks with unlimited photos.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddSpot(!showAddSpot);
            setEditingSpot(null);
            setSpotImages([]);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddSpot ? 'Cancel' : 'Add New Destination'}</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddSpot && (
        <form onSubmit={handleAddSubmit} className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">Add Destination Spot</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Destination Name *</label>
              <input
                type="text"
                placeholder="e.g. Historic Downtown Waxahachie"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              >
                <option value="shopping">Shopping & Retail</option>
                <option value="dining">Dining & Cafes</option>
                <option value="recreation">Parks & Recreation</option>
                <option value="education">Schools & Universities</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Distance from Property</label>
              <input
                type="text"
                placeholder="e.g. 1.8 miles"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Drive Time</label>
              <input
                type="text"
                placeholder="e.g. 4 mins"
                value={timeDrive}
                onChange={(e) => setTimeDrive(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Physical Address</label>
            <input
              type="text"
              placeholder="e.g. 100 Franklin St, Waxahachie, TX"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this spot special for residents..."
              className="w-full text-xs px-3 py-2 bg-white border border-stone-300 rounded-lg"
            />
          </div>

          {/* Unlimited Images for Destination */}
          <div className="bg-white p-3.5 rounded-lg border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-stone-800">
                  Destination Photos & Landmarks (Unlimited)
                </label>
                <p className="text-[11px] text-stone-500">
                  Upload photos of this landmark, venue, or storefront.
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
                <span>Processing photos...</span>
              </div>
            )}

            {spotImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                {spotImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative group aspect-4/3 rounded-lg border border-stone-200 overflow-hidden bg-stone-100 shadow-xs">
                    <img src={imgUrl} alt={`Spot photo ${idx + 1}`} className="w-full h-full object-cover" />
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
                        disabled={idx === spotImages.length - 1}
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
              <p className="text-xs text-stone-400 italic py-1">No custom photos attached yet. (Optional)</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddSpot(false)}
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
              <span>Save Destination</span>
            </button>
          </div>
        </form>
      )}

      {/* Edit Destination Modal */}
      {editingSpot && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xl w-full border border-stone-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#c5a880]" />
                <span>Edit Destination • {editingSpot.name}</span>
              </h4>
              <button
                onClick={() => setEditingSpot(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Destination Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
                    <option value="shopping">Shopping & Retail</option>
                    <option value="dining">Dining & Cafes</option>
                    <option value="recreation">Parks & Recreation</option>
                    <option value="education">Schools & Universities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Distance</label>
                  <input
                    type="text"
                    value={editDistance}
                    onChange={(e) => setEditDistance(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
              </div>

              {/* Destination Images Manager */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-stone-800">
                      Destination Photos ({editImages.length} images)
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
                        <img src={imgUrl} alt={`Spot photo ${idx + 1}`} className="w-full h-full object-cover" />
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
                  onClick={() => setEditingSpot(null)}
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

      {/* Destinations List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {neighborhoodSpots.map((spot) => {
          const spotImgs = Array.isArray(spot.images) && spot.images.length > 0
            ? spot.images
            : (spot.image ? [spot.image] : []);

          return (
            <div
              key={spot.id}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                  <img
                    src={spotImgs[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/95 text-stone-800 shadow-xs">
                    {getCategoryIcon(spot.category)}
                    <span>{spot.category}</span>
                  </div>
                </div>

                <div className="p-3.5">
                  <h4 className="font-bold text-stone-900 text-sm mb-1">{spot.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#c5a880]" />
                      {spot.distance}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#c5a880]" />
                      {spot.timeDrive}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-2">{spot.description}</p>
                  
                  {spotImgs.length > 1 && (
                    <p className="text-[11px] font-semibold text-[#c5a880] mt-1.5">
                      +{spotImgs.length - 1} more photo{spotImgs.length > 2 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-400 truncate max-w-[150px]">{spot.address || 'Waxahachie, TX'}</span>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(spot)}
                    className="p-1.5 rounded-lg text-stone-600 hover:bg-white hover:text-[#233242] transition-colors cursor-pointer"
                    title="Edit destination & photos"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteSpotId(spot.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete destination"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* In-card Delete Confirmation */}
              {confirmDeleteSpotId === spot.id && (
                <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs text-white p-4 rounded-xl flex flex-col items-center justify-center text-center z-10 animate-in fade-in">
                  <p className="text-xs font-bold text-red-300 mb-2">Delete destination "{spot.name}"?</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteSpot(spot.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 rounded text-white cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteSpotId(null)}
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
