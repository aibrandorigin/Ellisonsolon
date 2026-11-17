import React, { useState } from 'react';
import { 
  Plus, Trash2, Edit3, Check, DollarSign, Bed, Bath, Square, 
  Upload, Image as ImageIcon, ArrowLeft, ArrowRight, X, Loader2 
} from 'lucide-react';
import { usePropertyData } from '../../context/PropertyDataContext';
import { FloorPlan } from '../../types';
import { compressImage } from '../../utils/imageCompressor';

interface FloorPlansTabProps {
  onNotify: (msg: string) => void;
}

export const FloorPlansTab: React.FC<FloorPlansTabProps> = ({ onNotify }) => {
  const { floorPlans, addFloorPlan, updateFloorPlan, deleteFloorPlan } = usePropertyData();

  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlanCode, setNewPlanCode] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanBeds, setNewPlanBeds] = useState(1);
  const [newPlanBaths, setNewPlanBaths] = useState(1);
  const [newPlanSqft, setNewPlanSqft] = useState(750);
  const [newPlanPrice, setNewPlanPrice] = useState(1250);
  const [newPlanAvail, setNewPlanAvail] = useState(2);
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanFeatures, setNewPlanFeatures] = useState('');
  const [newPlanImages, setNewPlanImages] = useState<string[]>([]);
  const [isProcessingNewImages, setIsProcessingNewImages] = useState(false);

  // Edit Floor Plan State
  const [editingPlan, setEditingPlan] = useState<FloorPlan | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editAvail, setEditAvail] = useState(1);
  const [editName, setEditName] = useState('');
  const [editBeds, setEditBeds] = useState(1);
  const [editBaths, setEditBaths] = useState(1);
  const [editSqft, setEditSqft] = useState(750);
  const [editDeposit, setEditDeposit] = useState(500);
  const [editPopular, setEditPopular] = useState(false);
  const [editFeatures, setEditFeatures] = useState('');
  const [editLivingDim, setEditLivingDim] = useState("14' x 16'");
  const [editMasterBedDim, setEditMasterBedDim] = useState("12' x 14'");
  const [editBalconyDim, setEditBalconyDim] = useState("6' x 10'");
  const [editDesc, setEditDesc] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isProcessingEditImages, setIsProcessingEditImages] = useState(false);

  // Delete Confirmation
  const [confirmDeletePlanId, setConfirmDeletePlanId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Multi-image upload for new plan
  const handleUploadNewImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingNewImages(true);
    try {
      const fileArray = Array.from(files) as File[];
      const compressedList = await Promise.all(
        fileArray.map(file => compressImage(file, 880, 880, 0.65))
      );
      // Merge with existing images (do not replace)
      setNewPlanImages(prev => [...prev, ...compressedList]);
      onNotify(`Added ${compressedList.length} image(s) to new floor plan.`);
    } catch (err) {
      onNotify('Could not process some images.');
    } finally {
      setIsProcessingNewImages(false);
      e.target.value = '';
    }
  };

  // Multi-image upload for existing editing plan
  const handleUploadEditImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingEditImages(true);
    try {
      const fileArray = Array.from(files) as File[];
      const compressedList = await Promise.all(
        fileArray.map(file => compressImage(file, 880, 880, 0.65))
      );
      // Merge with existing images (do not replace)
      setEditImages(prev => [...prev, ...compressedList]);
      onNotify(`Added ${compressedList.length} image(s). Click "Save Changes" to commit.`);
    } catch (err) {
      onNotify('Could not process some images.');
    } finally {
      setIsProcessingEditImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewPlanImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleReorderNewImage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= newPlanImages.length) return;
    setNewPlanImages(prev => {
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
    if (!newPlanCode.trim() || !newPlanName.trim()) {
      onNotify('Please provide a plan code and name.');
      return;
    }

    setIsSaving(true);
    try {
      const featuresArray = newPlanFeatures
        .split(/[,\n]/)
        .map((f) => f.trim())
        .filter(Boolean);

      const newPlan: FloorPlan = {
        id: 'plan_' + Date.now(),
        code: newPlanCode.trim().toUpperCase(),
        name: newPlanName.trim(),
        bedrooms: Number(newPlanBeds) || 1,
        bathrooms: Number(newPlanBaths) || 1,
        sqft: Number(newPlanSqft) || 750,
        startingPrice: Number(newPlanPrice) || 1200,
        description: newPlanDesc.trim() || `Spacious ${newPlanBeds}-bedroom apartment home with modern finishes.`,
        availableCount: Number(newPlanAvail) || 1,
        deposit: 500,
        popular: false,
        features: featuresArray.length > 0 ? featuresArray : [
          'Gourmet kitchen with granite countertops',
          'Walk-in closets and private patio/balcony',
          'In-home washer and dryer connections',
        ],
        dimensions: {
          living: "14'0\" x 13'0\"",
          masterBed: "12'0\" x 11'0\"",
          balcony: "10'0\" x 5'0\"",
        },
        imageUrl: newPlanImages[0] || '',
        images: newPlanImages,
      };

      await addFloorPlan(newPlan);
      setShowAddPlan(false);
      setNewPlanCode('');
      setNewPlanName('');
      setNewPlanDesc('');
      setNewPlanFeatures('');
      setNewPlanImages([]);
      onNotify(`Floor plan ${newPlan.code} with ${newPlanImages.length} image(s) saved permanently!`);
    } catch (err) {
      onNotify('Error saving floor plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (plan: FloorPlan) => {
    setEditingPlan(plan);
    setEditCode(plan.code || '');
    setEditPrice(plan.startingPrice);
    setEditAvail(plan.availableCount !== undefined ? plan.availableCount : 1);
    setEditName(plan.name);
    setEditBeds(plan.bedrooms);
    setEditBaths(plan.bathrooms);
    setEditSqft(plan.sqft);
    setEditDeposit(plan.deposit !== undefined ? plan.deposit : 500);
    setEditPopular(!!plan.popular);
    setEditFeatures(Array.isArray(plan.features) ? plan.features.join(', ') : '');
    setEditLivingDim(plan.dimensions?.living || "14' x 16'");
    setEditMasterBedDim(plan.dimensions?.masterBed || "12' x 14'");
    setEditBalconyDim(plan.dimensions?.balcony || "6' x 10'");
    setEditDesc(plan.description || '');
    // Merge plan.images or plan.imageUrl
    const existingImages = Array.isArray(plan.images) && plan.images.length > 0
      ? plan.images
      : (plan.imageUrl ? [plan.imageUrl] : []);
    setEditImages([...existingImages]);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    if (editPrice <= 0) {
      onNotify('Please enter a valid price.');
      return;
    }

    setIsSaving(true);
    try {
      const parsedFeatures = editFeatures
        .split(/[,\n]/)
        .map((f) => f.trim())
        .filter(Boolean);

      const targetCode = editCode.trim().toUpperCase() || editingPlan.code;

      await updateFloorPlan(editingPlan.id, {
        code: targetCode,
        name: editName.trim() || editingPlan.name,
        startingPrice: Number(editPrice) || 0,
        availableCount: Number(editAvail) >= 0 ? Number(editAvail) : 0,
        bedrooms: Number(editBeds) || 1,
        bathrooms: Number(editBaths) || 1,
        sqft: Number(editSqft) || 0,
        deposit: Number(editDeposit) >= 0 ? Number(editDeposit) : 0,
        popular: editPopular,
        features: parsedFeatures,
        dimensions: {
          living: editLivingDim.trim(),
          masterBed: editMasterBedDim.trim(),
          balcony: editBalconyDim.trim(),
        },
        description: editDesc.trim(),
        imageUrl: editImages[0] || '',
        images: editImages,
      });

      setEditingPlan(null);
      onNotify(`Floor plan ${targetCode} updated with ${editImages.length} image(s) and saved permanently!`);
    } catch (err) {
      onNotify('Error updating floor plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    await deleteFloorPlan(id);
    setConfirmDeletePlanId(null);
    onNotify('Floor plan removed.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Square className="w-4 h-4 text-[#c5a880]" />
            <span>Floor Plans & Photo Blueprints</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              {floorPlans.length} Plans
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage floor plans, live pricing, and upload unlimited layout photos & blueprints.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddPlan(!showAddPlan);
            setEditingPlan(null);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddPlan ? 'Cancel' : 'Add New Floor Plan'}</span>
        </button>
      </div>

      {/* Add New Floor Plan Form */}
      {showAddPlan && (
        <form onSubmit={handleAddSubmit} className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">New Floor Plan Specifications</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Plan Code *</label>
              <input
                type="text"
                placeholder="e.g. B3"
                value={newPlanCode}
                onChange={(e) => setNewPlanCode(e.target.value)}
                required
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded uppercase font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Plan Name *</label>
              <input
                type="text"
                placeholder="e.g. The Cypress"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                required
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Bedrooms</label>
              <select
                value={newPlanBeds}
                onChange={(e) => setNewPlanBeds(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
              >
                <option value={1}>1 Bedroom</option>
                <option value={2}>2 Bedrooms</option>
                <option value={3}>3 Bedrooms</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Bathrooms</label>
              <select
                value={newPlanBaths}
                onChange={(e) => setNewPlanBaths(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
              >
                <option value={1}>1 Bath</option>
                <option value={2}>2 Baths</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Square Feet</label>
              <input
                type="number"
                value={newPlanSqft}
                onChange={(e) => setNewPlanSqft(Number(e.target.value))}
                required
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Starting Price ($)</label>
              <input
                type="number"
                value={newPlanPrice}
                onChange={(e) => setNewPlanPrice(Number(e.target.value))}
                required
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded font-bold text-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">Description</label>
            <textarea
              rows={2}
              value={newPlanDesc}
              onChange={(e) => setNewPlanDesc(e.target.value)}
              placeholder="Highlights of this apartment layout..."
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded"
            />
          </div>

          {/* Unlimited Images Uploader for New Plan */}
          <div className="bg-white p-3.5 rounded-lg border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-stone-800">
                  Floor Plan Images & Renderings (Unlimited)
                </label>
                <p className="text-[11px] text-stone-500">
                  Upload architectural drawings, 3D renderings, or sample photos for this plan.
                </p>
              </div>
              <label className="px-3 py-1.5 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose Photos</span>
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
              <div className="flex items-center gap-2 py-2 text-xs text-stone-600">
                <Loader2 className="w-4 h-4 animate-spin text-[#233242]" />
                <span>Compressing and attaching floor plan images...</span>
              </div>
            )}

            {newPlanImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                {newPlanImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg border border-stone-200 overflow-hidden bg-stone-100">
                    <img src={imgUrl} alt={`Plan photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 px-1 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded">
                        Primary
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
                        disabled={idx === newPlanImages.length - 1}
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
              <p className="text-xs text-stone-400 italic py-1">No images attached yet. (Optional, can be added later)</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddPlan(false)}
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
              <span>Save New Floor Plan</span>
            </button>
          </div>
        </form>
      )}

      {/* Edit Modal for Floor Plan (Includes full Image Manager) */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-2xl w-full border border-stone-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#c5a880]" />
                  <span>Edit Plan {editingPlan.code} • {editingPlan.name}</span>
                </h4>
                <p className="text-xs text-stone-500">Update rates, details, and manage plan gallery photos.</p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Plan Code</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    required
                    placeholder="e.g. A1"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Starting Rent ($/mo)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={editBeds}
                    onChange={(e) => setEditBeds(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={editBaths}
                    onChange={(e) => setEditBaths(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Square Feet</label>
                  <input
                    type="number"
                    value={editSqft}
                    onChange={(e) => setEditSqft(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Available Units</label>
                  <input
                    type="number"
                    min="0"
                    value={editAvail}
                    onChange={(e) => setEditAvail(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Deposit ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editDeposit}
                    onChange={(e) => setEditDeposit(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="editPopular"
                  checked={editPopular}
                  onChange={(e) => setEditPopular(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                />
                <label htmlFor="editPopular" className="text-xs font-semibold text-stone-700 select-none cursor-pointer">
                  Feature as Popular / Special Floor Plan
                </label>
              </div>

              {/* Room Dimensions */}
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <label className="block text-xs font-bold text-stone-800 mb-2">Room Dimensions (Optional)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-0.5">Living Room</label>
                    <input
                      type="text"
                      placeholder="e.g. 14' x 16'"
                      value={editLivingDim}
                      onChange={(e) => setEditLivingDim(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-0.5">Master Bedroom</label>
                    <input
                      type="text"
                      placeholder="e.g. 12' x 14'"
                      value={editMasterBedDim}
                      onChange={(e) => setEditMasterBedDim(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-0.5">Balcony / Patio</label>
                    <input
                      type="text"
                      placeholder="e.g. 6' x 10'"
                      value={editBalconyDim}
                      onChange={(e) => setEditBalconyDim(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Key Features (comma or line separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in closet, Quartz counters, Stainless appliances"
                  value={editFeatures}
                  onChange={(e) => setEditFeatures(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                />
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

              {/* Image Manager for Editing Plan */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-stone-800">
                      Floor Plan Photos & Blueprints ({editImages.length} images)
                    </label>
                    <p className="text-[11px] text-stone-500">
                      Upload multiple images. You can add more images at any time without losing existing photos.
                    </p>
                  </div>
                  <label className="px-3 py-1.5 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Images</span>
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

                {editImages.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {editImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group aspect-4/3 rounded-lg border border-stone-200 overflow-hidden bg-white shadow-xs">
                        <img src={imgUrl} alt={`Plan image ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-700 text-white text-[9px] font-bold rounded">
                            Primary
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
                ) : (
                  <div className="text-center py-4 text-xs text-stone-400">
                    No custom photos attached yet. Click "Upload Images" to add photos.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
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

      {/* List of Floor Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {floorPlans.map((plan) => {
          const planImages = Array.isArray(plan.images) && plan.images.length > 0 
            ? plan.images 
            : (plan.imageUrl ? [plan.imageUrl] : []);

          return (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#233242] text-[#FAF0D7]">
                      {plan.code}
                    </span>
                    <h4 className="font-bold text-stone-900 text-sm">{plan.name}</h4>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(plan)}
                      className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-[#233242] transition-colors cursor-pointer"
                      title="Edit plan & manage photos"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeletePlanId(plan.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Specs */}
                <div className="flex items-center gap-3 text-xs text-stone-600 mb-3">
                  <span>{plan.bedrooms} Bed</span>
                  <span>•</span>
                  <span>{plan.bathrooms} Bath</span>
                  <span>•</span>
                  <span>{plan.sqft.toLocaleString()} Sq Ft</span>
                </div>

                {/* Thumbnail Preview strip */}
                {planImages.length > 0 ? (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 mb-3 scrollbar-thin">
                    {planImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`${plan.code} preview ${i + 1}`}
                        className="w-14 h-14 rounded-lg object-cover border border-stone-200 shrink-0"
                      />
                    ))}
                    <span className="text-[10px] font-semibold text-stone-500 shrink-0">
                      {planImages.length} photo{planImages.length > 1 ? 's' : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 bg-stone-50 p-2 rounded-lg mb-3">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Using default architectural schematic (click edit to add photos)</span>
                  </div>
                )}
              </div>

              {/* Footer Rate & Action */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-2">
                <div>
                  <span className="text-xs text-stone-500">Starting from</span>
                  <p className="font-bold text-sm text-emerald-700">${plan.startingPrice.toLocaleString()} / mo</p>
                </div>

                <button
                  onClick={() => handleStartEdit(plan)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#233242] bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Manage Images ({planImages.length})</span>
                </button>
              </div>

              {/* In-card Delete Confirmation */}
              {confirmDeletePlanId === plan.id && (
                <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs text-white p-4 rounded-xl flex flex-col items-center justify-center text-center z-10 animate-in fade-in">
                  <p className="text-xs font-bold text-red-300 mb-2">Delete floor plan {plan.code}?</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 rounded text-white cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDeletePlanId(null)}
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
