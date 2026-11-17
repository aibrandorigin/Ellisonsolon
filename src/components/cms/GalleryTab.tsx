import React, { useState } from 'react';
import { Camera, Upload, Plus, Trash2, Edit3, Check, X, Tag, ArrowUp, ArrowDown, Image as ImageIcon, Loader2 } from 'lucide-react';
import { usePropertyData } from '../../context/PropertyDataContext';
import { GalleryItem } from '../../types';
import { compressImage } from '../../utils/imageCompressor';

interface GalleryTabProps {
  onNotify: (msg: string) => void;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({ onNotify }) => {
  const {
    galleryItems,
    galleryCategories,
    addGalleryPhoto,
    addGalleryPhotosBatch,
    updateGalleryPhoto,
    deleteGalleryPhoto,
    reorderGalleryPhotos,
    addGalleryCategory,
    removeGalleryCategory,
  } = usePropertyData();

  // Multi-upload & single upload state
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCategory, setPhotoCategory] = useState(galleryCategories[1]?.id || 'interiors');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFilePreview, setPhotoFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');

  // Category State
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Edit Photo State
  const [editingPhoto, setEditingPhoto] = useState<GalleryItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [isEditProcessing, setIsEditProcessing] = useState(false);

  // Delete confirmation
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);

  // Selected filter in admin preview
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Handle Multi-file batch upload (Supports any number: 10, 20, 50, 100+ images)
  const handleBatchPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    setIsProcessing(true);

    try {
      const matchedCat = galleryCategories.find(c => c.id === photoCategory);
      const categoryLabel = matchedCat ? matchedCat.label : 'Community';
      let processedCount = 0;
      setProgressText(`Optimizing ${fileList.length} photos in parallel...`);

      const photoPromises = fileList.map(async (file, i) => {
        try {
          const compressed = await compressImage(file, 880, 880, 0.65);
          processedCount++;
          setProgressText(`Optimized ${processedCount} of ${fileList.length} photos...`);
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          const formattedTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

          return {
            id: 'photo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7) + '_' + i,
            title: photoTitle.trim() ? (fileList.length > 1 ? `${photoTitle.trim()} #${i + 1}` : photoTitle.trim()) : formattedTitle,
            category: photoCategory,
            categoryLabel: categoryLabel,
            imageUrl: compressed,
            caption: photoCaption.trim() || `${formattedTitle} at The Ellis on Solon`,
          };
        } catch (imgErr) {
          console.warn(`Could not compress file ${file.name}:`, imgErr);
          return null;
        }
      });

      const processedResults = await Promise.all(photoPromises);
      const newItems = processedResults.filter((item): item is GalleryItem => item !== null);

      if (newItems.length > 0) {
        setProgressText(`Adding ${newItems.length} photos to gallery...`);
        // Batch merge into gallery without overwriting or dropping existing photos
        await addGalleryPhotosBatch(newItems);

        // Reset form
        setPhotoTitle('');
        setPhotoUrl('');
        setPhotoCaption('');
        setPhotoFilePreview(null);
        e.target.value = '';

        onNotify(`Successfully uploaded & saved ${newItems.length} photos! Total gallery count: ${galleryItems.length + newItems.length}`);
      } else {
        onNotify('No valid images could be processed.');
      }
    } catch (err) {
      console.error('Error during batch photo upload:', err);
      onNotify('Upload failed. Please verify the images and try again.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  // Handle single photo submit from URL or single file
  const handleSinglePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = photoFilePreview || photoUrl.trim();
    if (!finalUrl || !photoTitle.trim()) {
      onNotify('Please provide a title and either select a photo or enter a photo URL.');
      return;
    }

    const matchedCat = galleryCategories.find(c => c.id === photoCategory);
    const categoryLabel = matchedCat ? matchedCat.label : 'Community';

    setIsProcessing(true);
    setProgressText('Saving photo to database...');

    try {
      const newItem: GalleryItem = {
        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        title: photoTitle.trim(),
        category: photoCategory,
        categoryLabel: categoryLabel,
        imageUrl: finalUrl,
        caption: photoCaption.trim() || photoTitle.trim(),
      };

      await addGalleryPhoto(newItem);

      setPhotoTitle('');
      setPhotoUrl('');
      setPhotoCaption('');
      setPhotoFilePreview(null);
      onNotify('New photo added to website gallery!');
    } catch (err) {
      onNotify('Could not save photo. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleStartEditPhoto = (item: GalleryItem) => {
    setEditingPhoto(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditUrl(item.imageUrl);
    setEditFilePreview(null);
    setConfirmDeletePhotoId(null);
  };

  const handleEditPhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsEditProcessing(true);
      const compressedDataUrl = await compressImage(file, 1080, 1080, 0.72);
      setEditFilePreview(compressedDataUrl);
      setEditUrl(compressedDataUrl);
    } catch (err) {
      onNotify('Unable to process edit photo.');
    } finally {
      setIsEditProcessing(false);
    }
  };

  const handleSaveEditPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    const finalUrl = editFilePreview || editUrl.trim();
    if (!finalUrl || !editTitle.trim()) {
      onNotify('Please provide a title and valid photo.');
      return;
    }

    const matchedCat = galleryCategories.find(c => c.id === editCategory);
    const categoryLabel = matchedCat ? matchedCat.label : editingPhoto.categoryLabel;

    setIsEditProcessing(true);
    try {
      await updateGalleryPhoto(editingPhoto.id, {
        title: editTitle.trim(),
        category: editCategory,
        categoryLabel: categoryLabel,
        imageUrl: finalUrl,
        caption: editingPhoto.caption || editTitle.trim(),
      });

      setEditingPhoto(null);
      onNotify('Gallery photo updated and saved permanently!');
    } catch (err) {
      onNotify('Could not update photo.');
    } finally {
      setIsEditProcessing(false);
    }
  };

  const handleMovePhoto = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryItems.length) return;

    const updated = [...galleryItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    await reorderGalleryPhotos(updated);
    onNotify('Photo reordered and saved!');
  };

  const handleDeletePhoto = async (id: string) => {
    await deleteGalleryPhoto(id);
    setConfirmDeletePhotoId(null);
    onNotify('Photo removed from gallery.');
  };

  const filteredItems = selectedFilter === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedFilter);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#c5a880]" />
            <span>Property Photo Gallery & Uploads</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              {galleryItems.length} Photos
            </span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Upload unlimited photos (single or batch 10, 20, 50+ at once). Changes persist permanently across refreshes.
          </p>
        </div>

        <button
          onClick={() => setShowCategoryManager(!showCategoryManager)}
          className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Tag className="w-3.5 h-3.5" />
          <span>{showCategoryManager ? 'Hide Categories' : 'Manage Categories'}</span>
        </button>
      </div>

      {/* Category Manager */}
      {showCategoryManager && (
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">Gallery Filter Categories</h4>
            <span className="text-[11px] text-stone-500">{galleryCategories.length} categories</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {galleryCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-800"
              >
                <span>{cat.label}</span>
                {cat.id !== 'all' && (
                  confirmDeleteCatId === cat.id ? (
                    <div className="flex items-center gap-1 ml-1 bg-red-50 p-0.5 rounded border border-red-200">
                      <button
                        onClick={() => {
                          removeGalleryCategory(cat.id);
                          setConfirmDeleteCatId(null);
                          onNotify(`Category "${cat.label}" deleted.`);
                        }}
                        className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteCatId(null)}
                        className="text-[10px] text-stone-500 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteCatId(cat.id)}
                      className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete category"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newCategoryLabel.trim()) {
                addGalleryCategory(newCategoryLabel.trim());
                setNewCategoryLabel('');
                onNotify(`Category added!`);
              }
            }}
            className="flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              placeholder="New category name (e.g. Clubhouse, Poolside)..."
              value={newCategoryLabel}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-stone-300 rounded-lg flex-1 max-w-sm"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg transition-colors cursor-pointer"
            >
              Add Category
            </button>
          </form>
        </div>
      )}

      {/* Multi-Photo Upload & Add Form */}
      <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-[#233242]" />
            <span>Upload Photos (Single or Batch Multi-Upload)</span>
          </h4>
          <span className="text-[11px] text-stone-500 font-medium">
            Select 1, 10, 20, 50, or 100+ images from your computer
          </span>
        </div>

        {/* Big Drag/Click Multi-Upload Box */}
        <div className="relative border-2 border-dashed border-stone-300 hover:border-[#233242] bg-white rounded-xl p-6 text-center transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleBatchPhotoUpload}
            disabled={isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            title="Upload one or multiple images"
          />
          <div className="flex flex-col items-center justify-center pointer-events-none">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="w-8 h-8 text-[#233242] animate-spin" />
                <p className="text-xs font-bold text-stone-800">{progressText || 'Processing photos...'}</p>
                <p className="text-[11px] text-stone-500">Please keep this window open while photos are compressed & saved.</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-[#233242] mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-stone-800">
                  Click or drag files here to upload multiple images at once
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Supports JPG, PNG, WebP, SVG • No limit on file count • Automatically optimizes & merges with existing gallery
                </p>
              </>
            )}
          </div>
        </div>

        {/* Single Add / Manual URL Accordion */}
        <div className="pt-2">
          <details className="text-xs text-stone-600">
            <summary className="font-semibold cursor-pointer text-[#233242] hover:underline">
              Or configure title & category for next upload / enter direct image URL
            </summary>
            <form onSubmit={handleSinglePhotoSubmit} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-stone-200">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Photo Title</label>
                <input
                  type="text"
                  placeholder="e.g. Resort-Style Swimming Pool"
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Target Category</label>
                <select
                  value={photoCategory}
                  onChange={(e) => setPhotoCategory(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded"
                >
                  {galleryCategories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">Or Web Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photoUrl}
                  onChange={(e) => {
                    setPhotoUrl(e.target.value);
                    setPhotoFilePreview(null);
                  }}
                  className="w-full text-xs px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#233242] hover:bg-[#2e4357] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Save Single Photo
                </button>
              </div>
            </form>
          </details>
        </div>
      </div>

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#c5a880]" />
                <span>Edit Photo Details</span>
              </h4>
              <button
                onClick={() => setEditingPhoto(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPhoto} className="space-y-3">
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

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg"
                >
                  {galleryCategories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Replace Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditPhotoFileUpload}
                  className="w-full text-xs"
                />
              </div>

              {/* Preview */}
              {(editFilePreview || editUrl) && (
                <div className="relative h-36 rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                  <img
                    src={editFilePreview || editUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditProcessing}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  {isEditProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Items Grid with Reordering & Deletion */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {galleryCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedFilter(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  selectedFilter === c.id
                    ? 'bg-[#233242] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {c.label} ({c.id === 'all' ? galleryItems.length : galleryItems.filter(i => i.category === c.id).length})
              </button>
            ))}
          </div>

          <span className="text-xs text-stone-500">
            Showing {filteredItems.length} of {galleryItems.length} photos
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <ImageIcon className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-600">No photos in this category yet</p>
            <p className="text-xs text-stone-400 mt-0.5">Use the upload box above to add photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {filteredItems.map((item, idx) => {
              const globalIndex = galleryItems.findIndex(g => g.id === item.id);
              return (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-900/80 text-white backdrop-blur-xs">
                      {item.categoryLabel}
                    </span>

                    {/* Quick Action Overlay */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEditPhoto(item)}
                        className="p-1 rounded bg-white/90 text-stone-700 hover:text-[#233242] shadow-xs cursor-pointer"
                        title="Edit photo details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeletePhotoId(item.id)}
                        className="p-1 rounded bg-white/90 text-stone-700 hover:text-red-600 shadow-xs cursor-pointer"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h5 className="font-semibold text-xs text-stone-900 truncate" title={item.title}>
                        {item.title}
                      </h5>
                    </div>

                    {/* Reorder controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-2">
                      <span className="text-[10px] text-stone-400 font-mono">#{globalIndex + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMovePhoto(globalIndex, 'up')}
                          disabled={globalIndex === 0}
                          className="p-1 rounded text-stone-400 hover:text-stone-800 disabled:opacity-30 cursor-pointer"
                          title="Move earlier in gallery"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMovePhoto(globalIndex, 'down')}
                          disabled={globalIndex === galleryItems.length - 1}
                          className="p-1 rounded text-stone-400 hover:text-stone-800 disabled:opacity-30 cursor-pointer"
                          title="Move later in gallery"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* In-card Delete Confirmation */}
                    {confirmDeletePhotoId === item.id && (
                      <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-xs text-white p-3 flex flex-col items-center justify-center text-center z-10 animate-in fade-in">
                        <p className="text-xs font-bold text-red-300 mb-2">Permanently delete photo?</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeletePhoto(item.id)}
                            className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 rounded text-white cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeletePhotoId(null)}
                            className="px-2.5 py-1 text-xs font-semibold bg-stone-700 hover:bg-stone-600 rounded text-stone-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
