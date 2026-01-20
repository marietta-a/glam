import React, { useState, useEffect } from 'react';
import { X, Heart, Layers, Save, Trash2, Palette, Info, Calendar, Tag, AlertTriangle, Loader2, MapPin, Sparkles, Wind, Shirt, Bookmark } from 'lucide-react';
import { WardrobeItem, Category } from '../types';
import { CATEGORIES } from '../constants';
import { updateWardrobeItem, deleteWardrobeItem } from '../services/wardrobeService';
import { t } from '../services/i18n';

interface ItemDetailsModalProps {
  item: WardrobeItem;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: WardrobeItem) => void;
  onDelete: (id: string) => void;
  lang?: string;
}

const DetailSection: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
      <div className="p-1.5 bg-gray-50 rounded-lg">{icon}</div>
      <span>{title}</span>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const DetailBox: React.FC<{ label: string, value: string | undefined | string[] }> = ({ label, value }) => (
  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
    <p className="text-[11px] font-black text-gray-900 uppercase truncate">
      {Array.isArray(value) ? value.join(', ') : (value || '—')}
    </p>
  </div>
);

const EditField: React.FC<{ label: string, children: React.ReactNode, fullWidth?: boolean }> = ({ label, children, fullWidth }) => (
  <div className={fullWidth ? "col-span-2 space-y-2" : "space-y-2"}>
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ item, userId, isOpen, onClose, onSave, onDelete, lang = 'en' }) => {
  const [editedItem, setEditedItem] = useState<WardrobeItem>(item);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditedItem(item);
    }
  }, [item, isEditing]);

  if (!isOpen) return null;

  const handleToggleFavorite = async () => {
    const updated = { ...editedItem, isFavorite: !editedItem.isFavorite };
    setEditedItem(updated);
    try {
      await updateWardrobeItem(updated);
      onSave(updated);
    } catch (e) {
      console.error("Failed to update favorite status", e);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateWardrobeItem(editedItem);
      onSave(editedItem);
      setIsEditing(false);
      onClose();
    } catch (e) {
      console.error("Save failed", e);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await deleteWardrobeItem(userId, editedItem.id);
      onDelete(editedItem.id);
      onClose();
    } catch (e) {
      console.error("Deletion failed", e);
      alert("Failed to delete item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArrayChange = (field: keyof WardrobeItem, value: string) => {
    const array = value.split(',').map(s => s.trim()).filter(Boolean);
    setEditedItem({ ...editedItem, [field]: array });
  };

  const inputClasses = "w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-300";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg h-full sm:h-[90vh] sm:rounded-[60px] overflow-hidden flex flex-col relative shadow-2xl transition-all">
        
        <div className="absolute top-8 left-8 z-20">
          <button onClick={onClose} disabled={isSaving} className="p-3 bg-white/90 backdrop-blur shadow-sm rounded-2xl hover:bg-white transition-all active:scale-90">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="absolute top-8 right-8 z-20 flex items-center space-x-3">
          <button 
            onClick={handleToggleFavorite}
            disabled={isSaving}
            className={`p-3 backdrop-blur shadow-sm rounded-2xl transition-all ${editedItem.isFavorite ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-white/90 text-gray-400'}`}
          >
            <Heart className={`w-5 h-5 ${editedItem.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className="p-3 bg-[#26A69A] text-white shadow-lg shadow-teal-100 rounded-2xl hover:bg-[#1d8278] transition-all"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <Save className="w-5 h-5" /> : <Layers className="w-5 h-5" />)}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="relative aspect-[1/1] bg-white overflow-hidden">
            <img src={editedItem.imageUrl} alt={editedItem.name} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
          </div>

          <div className="px-10 pb-12 -mt-10 relative z-10">
            {isEditing ? (
              <div className="space-y-10 animate-in fade-in duration-300">
                {/* Header Edit */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <span className="px-4 py-1.5 bg-[#26A69A]/10 text-[#26A69A] text-[10px] font-black uppercase tracking-[2px] rounded-full">
                      Edit Boutique Record
                    </span>
                  </div>
                  <div className="space-y-6">
                    <EditField label="Archive Name">
                      <input 
                        type="text" 
                        value={editedItem.name || ''} 
                        onChange={(e) => setEditedItem({...editedItem, name: e.target.value})}
                        className="w-full text-2xl font-black bg-gray-50 border-none rounded-3xl px-6 py-5 outline-none focus:ring-2 focus:ring-teal-500/10 placeholder:text-gray-200"
                        placeholder="Item Name"
                      />
                    </EditField>
                    <EditField label="Description">
                      <textarea 
                        value={editedItem.description || ''} 
                        onChange={(e) => setEditedItem({...editedItem, description: e.target.value})}
                        className="w-full text-sm font-medium bg-gray-50 border-none rounded-3xl px-6 py-5 outline-none transition-all resize-none h-32 focus:ring-2 focus:ring-teal-500/10 placeholder:text-gray-200"
                        placeholder="Describe the silhouette, fit, and essence..."
                      />
                    </EditField>
                  </div>
                </div>

                {/* Technical Specs Edit */}
                <div className="space-y-12">
                  <DetailSection icon={<Shirt className="w-4 h-4" />} title="Primary Details">
                    <EditField label="Category">
                      <select 
                        value={editedItem.category}
                        onChange={(e) => setEditedItem({...editedItem, category: e.target.value as Category})}
                        className={inputClasses}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </EditField>
                    <EditField label="Sub-Category">
                      <input 
                        type="text" 
                        value={editedItem.subCategory || ''} 
                        onChange={(e) => setEditedItem({...editedItem, subCategory: e.target.value})}
                        className={inputClasses}
                        placeholder="e.g. Blazer, Knitwear"
                      />
                    </EditField>
                    <EditField label="Formality">
                      <input 
                        type="text" 
                        value={editedItem.formality || ''} 
                        onChange={(e) => setEditedItem({...editedItem, formality: e.target.value})}
                        className={inputClasses}
                        placeholder="e.g. Semi-Formal"
                      />
                    </EditField>
                    <EditField label="Warmth">
                      <input 
                        type="text" 
                        value={editedItem.warmthLevel || ''} 
                        onChange={(e) => setEditedItem({...editedItem, warmthLevel: e.target.value})}
                        className={inputClasses}
                        placeholder="e.g. High"
                      />
                    </EditField>
                  </DetailSection>

                  <DetailSection icon={<Palette className="w-4 h-4" />} title="Visual Profile">
                    <EditField label="Primary Color">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-xl border border-gray-100 flex-shrink-0 overflow-hidden relative">
                           <input 
                             type="color" 
                             value={editedItem.primaryColor?.startsWith('#') ? editedItem.primaryColor : '#000000'} 
                             onChange={(e) => setEditedItem({...editedItem, primaryColor: e.target.value})}
                             className="absolute inset-0 w-full h-full scale-150 cursor-pointer"
                           />
                         </div>
                         <input 
                           type="text" 
                           value={editedItem.primaryColor || ''} 
                           onChange={(e) => setEditedItem({...editedItem, primaryColor: e.target.value})}
                           className={inputClasses}
                           placeholder="Hex or Name"
                         />
                      </div>
                    </EditField>
                    <EditField label="Pattern">
                      <input 
                        type="text" 
                        value={editedItem.pattern || ''} 
                        onChange={(e) => setEditedItem({...editedItem, pattern: e.target.value})}
                        className={inputClasses}
                        placeholder="e.g. Houndstooth"
                      />
                    </EditField>
                    <EditField label="Material Look">
                      <input 
                        type="text" 
                        value={editedItem.materialLook || ''} 
                        onChange={(e) => setEditedItem({...editedItem, materialLook: e.target.value})}
                        className={inputClasses}
                        placeholder="e.g. Silk, Matte"
                      />
                    </EditField>
                  </DetailSection>

                  <DetailSection icon={<MapPin className="w-4 h-4" />} title="Contextual Metadata">
                    <EditField label="Occasions (Comma Sep)" fullWidth>
                      <input 
                        type="text" 
                        value={editedItem.occasionSuitability?.join(', ') || ''} 
                        onChange={(e) => handleArrayChange('occasionSuitability', e.target.value)}
                        className={inputClasses}
                        placeholder="Casual, Work, Party..."
                      />
                    </EditField>
                    <EditField label="Seasonality (Comma Sep)" fullWidth>
                      <input 
                        type="text" 
                        value={editedItem.seasonality?.join(', ') || ''} 
                        onChange={(e) => handleArrayChange('seasonality', e.target.value)}
                        className={inputClasses}
                        placeholder="Spring, Summer..."
                      />
                    </EditField>
                    <EditField label="Library Tags (Comma Sep)" fullWidth>
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input 
                          type="text" 
                          value={editedItem.tags?.join(', ') || ''} 
                          onChange={(e) => handleArrayChange('tags', e.target.value)}
                          className={inputClasses + " pl-12"}
                          placeholder="Favorite, Vintage, Travel..."
                        />
                      </div>
                    </EditField>
                  </DetailSection>

                  <div className="pt-6 border-t border-gray-100">
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center justify-center space-x-2 py-5 text-red-500 font-black uppercase tracking-widest text-[10px] bg-red-50 rounded-[28px] hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('retire_item', lang)}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="mb-6 flex items-center space-x-2">
                  <span className="px-4 py-1.5 bg-[#26A69A]/10 text-[#26A69A] text-[10px] font-black uppercase tracking-[2px] rounded-full">
                    {editedItem.category}
                  </span>
                  {editedItem.formality && (
                    <span className="px-4 py-1.5 bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-[2px] rounded-full">
                      {editedItem.formality}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-4">{editedItem.name}</h2>
                  <p className="text-gray-500 text-[15px] leading-relaxed font-medium">
                    {editedItem.description || "A timeless addition to your boutique closet."}
                  </p>
                </div>

                <div className="space-y-10">
                  {/* Color Story */}
                  <DetailSection icon={<Palette className="w-4 h-4" />} title="Color Story">
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: editedItem.primaryColor }} />
                      <div className="flex-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Primary</p>
                        <p className="text-[11px] font-black text-gray-900 uppercase truncate">{editedItem.primaryColor}</p>
                      </div>
                    </div>
                    {editedItem.secondaryColors && editedItem.secondaryColors.length > 0 && (
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Accents</p>
                        <div className="flex -space-x-1">
                          {editedItem.secondaryColors.map((color, idx) => (
                            <div key={idx} className="w-5 h-5 rounded-full border border-white" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </DetailSection>

                  {/* Composition */}
                  <DetailSection icon={<Layers className="w-4 h-4" />} title="Composition">
                    <DetailBox label="Pattern" value={editedItem.pattern} />
                    <DetailBox label="Material Look" value={editedItem.materialLook} />
                    <DetailBox label="Formality" value={editedItem.formality} />
                    <DetailBox label="Warmth" value={editedItem.warmthLevel} />
                  </DetailSection>

                  {/* Context */}
                  <DetailSection icon={<MapPin className="w-4 h-4" />} title="Environment">
                    <DetailBox label="Occasions" value={editedItem.occasionSuitability} />
                    <DetailBox label="Seasonality" value={editedItem.seasonality} />
                  </DetailSection>

                  {/* Tags */}
                  {editedItem.tags && editedItem.tags.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center space-x-3 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
                        <div className="p-1.5 bg-gray-50 rounded-lg"><Tag className="w-4 h-4" /></div>
                        <span>Library Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {editedItem.tags.map(tag => (
                          <span key={tag} className="px-4 py-2 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-gray-100">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in zoom-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('retire_item', lang)}?</h3>
              <p className="text-gray-500 text-sm mb-8 px-2">
                This will permanently remove this piece from your cloud boutique.
              </p>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="w-full py-5 bg-red-500 text-white font-bold rounded-3xl shadow-lg hover:bg-red-600 transition-all active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('delete_forever', lang)}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSaving}
                  className="w-full py-5 bg-gray-50 text-gray-400 font-bold rounded-3xl hover:bg-gray-100 transition-all"
                >
                  {t('keep_item', lang)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetailsModal;