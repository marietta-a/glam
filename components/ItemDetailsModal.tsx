
import React, { useState } from 'react';
import { X, Heart, Trash2, Palette, Info, FileCode, Scissors, Thermometer, Zap, AlertTriangle, Loader2, Tag, Banknote, Link2, Layers, Quote } from 'lucide-react';
import { WardrobeItem } from '../types';
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
  canDelete?: boolean;
}

const TechnicalRow: React.FC<{ icon: React.ReactNode, label: string, value: string | React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between py-5 border-b border-gray-100 last:border-0">
    <div className="flex items-center space-x-4">
      <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400">
        {icon}
      </div>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">{label}</span>
    </div>
    <div className="text-right">
      <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{value}</span>
    </div>
  </div>
);

const ColorChip: React.FC<{ color?: string, label: string }> = ({ color, label }) => (
  <div className="flex items-center space-x-2">
    {color && (
      <div 
        className="w-3.5 h-3.5 rounded-full border border-gray-100 shadow-sm" 
        style={{ backgroundColor: color }} 
      />
    )}
    <span className="text-[11px] font-black text-gray-900 uppercase">{label}</span>
  </div>
);

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ item, userId, isOpen, onClose, onSave, onDelete, lang = 'en', canDelete = true }) => {
  const [isFavorite, setIsFavorite] = useState(item.isFavorite);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleToggleFavorite = async () => {
    const updated = { ...item, isFavorite: !isFavorite };
    setIsFavorite(!isFavorite);
    try {
      await updateWardrobeItem(updated);
      onSave(updated);
    } catch (e) {
      console.error("Failed to update favorite status", e);
      setIsFavorite(isFavorite);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await deleteWardrobeItem(userId, item.id);
      onDelete(item.id);
      onClose();
    } catch (e) {
      console.error("Deletion failed", e);
      alert("Failed to delete item.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-lg h-[90vh] sm:rounded-[48px] overflow-hidden flex flex-col relative shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] mx-4">
        
        {/* Sticky Header for consistent button visibility */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-gray-900 leading-none uppercase tracking-tight truncate max-w-[200px]">
              {item.name}
            </h2>
            <div className="flex items-center space-x-2 mt-1">
               <span className="text-[8px] font-black text-gray-300 uppercase tracking-[3px]">Technical Spec</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <button 
                onClick={handleToggleFavorite}
                className={`p-3 rounded-2xl transition-all shadow-sm ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-300'}`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
             <button 
                onClick={onClose} 
                className="p-3 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 transition-all active:scale-95"
              >
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Main Visual */}
          <div className="px-8 py-8">
             <div className="aspect-square rounded-[40px] overflow-hidden bg-gray-50 border border-gray-100 shadow-inner">
               <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
             </div>
          </div>

          <div className="px-8 pb-16 space-y-10">
            {/* Editorial Note Section - Couture Specification */}
            <section className="relative">
              <div className="bg-[#FAF9F6] rounded-[40px] p-8 relative border border-[#E5E4E2] shadow-sm">
                <Quote className="absolute top-4 left-4 w-8 h-8 text-[#26A69A]/10 -scale-x-100" />
                <div className="flex flex-col items-center text-center space-y-4">
                  <span className="text-[9px] font-black text-[#26A69A] uppercase tracking-[5px]">Couture Specification</span>
                  <div className="w-full text-left">
                    <p className="text-sm leading-relaxed font-serif text-gray-700 italic whitespace-pre-line px-4">
                      {item.description || "Archival technical data pending synchronization."}
                    </p>
                  </div>
                  <div className="w-12 h-px bg-[#26A69A]/20" />
                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-[3px]">Garment Engineering Archive</span>
                </div>
              </div>
            </section>

            {/* Technical Blueprint Section */}
            <section>
              <div className="flex items-center space-x-2 mb-4 px-2">
                <div className="w-6 h-px bg-gray-100" />
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[3px]">Archival DNA</h4>
              </div>
              <div className="bg-white rounded-[32px] border border-gray-100 px-6 py-2">
                <TechnicalRow 
                  icon={<Palette className="w-4 h-4" />} 
                  label="Primary Tone" 
                  value={<ColorChip color={item.primaryColor} label={item.primaryColor || 'Unknown'} />} 
                />
                <TechnicalRow 
                  icon={<Scissors className="w-4 h-4" />} 
                  label="Material Look" 
                  value={item.materialLook || 'Fine Fabric'} 
                />
                <TechnicalRow 
                  icon={<Zap className="w-4 h-4" />} 
                  label="Pattern Logic" 
                  value={item.pattern || 'Minimalist Solid'} 
                />
                <TechnicalRow 
                  icon={<Thermometer className="w-4 h-4" />} 
                  label="Thermal Grade" 
                  value={item.warmthLevel || 'Ambient'} 
                />
              </div>
            </section>

            {/* Adaptability Matrix */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 px-2">
                <div className="w-6 h-px bg-gray-100" />
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[3px]">Adaptability Matrix</h4>
              </div>
              <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Occasion Suitability</p>
                <div className="flex flex-wrap gap-2">
                  {item.occasionSuitability?.length ? (
                    item.occasionSuitability.map(occ => (
                      <span key={occ} className="px-4 py-2 bg-white border border-gray-100 rounded-full text-[9px] font-black text-gray-700 uppercase tracking-widest shadow-sm">
                        {occ}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] text-gray-400 italic">Universal Compatibility</span>
                  )}
                </div>
              </div>
            </section>

            {canDelete && (
              <div className="pt-4">
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center space-x-2 py-5 text-red-500 font-black uppercase tracking-widest text-[9px] bg-red-50 rounded-[24px] hover:bg-red-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Retire Piece From Archive</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="absolute inset-0 z-[50] bg-black/60 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-50 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tight leading-none">Confirm <br/> Deletion</h3>
              <p className="text-gray-500 text-[11px] mb-8 px-4 leading-relaxed">
                This will permanently erase this digital blueprint from your boutique cloud.
              </p>
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="w-full py-4 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-[20px] shadow-lg active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Retire Forever"}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSaving}
                  className="w-full py-4 bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-[20px] hover:bg-gray-100"
                >
                  Maintain Archive
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
