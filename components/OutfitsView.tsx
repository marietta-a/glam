
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { WardrobeItem, Occasion, OutfitCache, CachedOutfit, UserProfile } from '../types';
import { Sparkles, Shirt, Plus, RefreshCcw, Wand2, User, Info, Check, Camera, Loader2, Sparkle, Download, AlertTriangle, X, Search, Scissors, PencilLine, ShoppingBag, Fingerprint, Scan, Eye, Heart, Layers, ArrowRight, Box, CheckCircle2, Globe, Lock, Crown, Zap } from 'lucide-react';
import { t } from '../services/i18n';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface OutfitsViewProps {
  items: WardrobeItem[];
  profile: UserProfile | null;
  onAddClick: () => void;
  cache: OutfitCache;
  onUpdateCache: (occasion: Occasion, data: CachedOutfit) => void;
  selectedOccasion: Occasion | null;
  onOccasionChange: (occasion: Occasion | null) => void;
  isGenerating: boolean;
  isVisualizing: boolean;
  generationPhase: 'analyzing' | 'designing' | 'visualizing' | 'complete';
  onGenerate: (occasion: Occasion) => void;
  onItemClick?: (item: WardrobeItem) => void;
  onPaywall?: () => void;
  lang?: string;
  isSettingFace?: boolean;
  onFaceUpload?: (base64: string) => void;
}

const OCCASIONS: Occasion[] = [
  'Casual', 'Work', 'Date Night', 'Formal', 'Weekend Brunch', 
  'Beach & Vacation', 'Wedding Guest', 'Gym', 'Party', 
  'Concert & Festival', 'Job Interview', 'Business Trip', 'Lounge & Home'
];

const OutfitsView: React.FC<OutfitsViewProps> = ({
  items,
  profile,
  onAddClick,
  cache,
  selectedOccasion,
  onOccasionChange,
  isGenerating,
  isVisualizing,
  generationPhase,
  onGenerate,
  onItemClick,
  onPaywall,
  lang = 'en',
  isSettingFace = false,
  onFaceUpload
}) => {
  const [suitabilityIndex, setSuitabilityIndex] = useState(0);
  const faceInputRef = useRef<HTMLInputElement>(null);

  const isOutOfResources = (profile?.total_generations || 0) >= 15 && (profile?.credits || 0) <= 0 && !profile?.is_premium;

  const currentOutfit = useMemo(() => {
    return selectedOccasion ? cache[selectedOccasion] : null;
  }, [selectedOccasion, cache]);

  useEffect(() => {
    let interval: any;
    if (isVisualizing) {
      interval = setInterval(() => {
        setSuitabilityIndex(prev => (prev + 1) % 4);
      }, 2500);
    } else {
      setSuitabilityIndex(0);
    }
    return () => clearInterval(interval);
  }, [isVisualizing]);

  const VISUALIZATION_STEPS = [
    { label: 'Environment VR Simulation', icon: <Globe className="w-4 h-4" /> },
    { label: 'Couture Reality Mapping', icon: <Layers className="w-4 h-4" /> },
    { label: 'Identity Immersion Lock', icon: <User className="w-4 h-4" /> },
    { label: 'Elite Editorial Render', icon: <Sparkles className="w-4 h-4" /> }
  ];

  const onOccasionClick = (occ: Occasion) => {
    if (isGenerating || isVisualizing || !profile?.avatar_url) return;
    
    // Strict Gating: If out of resources and not cached, trigger paywall instead of switching
    if (isOutOfResources && !cache[occ]) {
      onPaywall?.();
      return;
    }
    
    onOccasionChange(occ);
  };

  const handleFaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onFaceUpload?.(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!currentOutfit?.visualizedImage) return;
    const filename = `GlamAI-${selectedOccasion?.replace(/\s+/g, '')}.png`;
    try {
      if (Capacitor.isNativePlatform()) {
        const base64Data = currentOutfit.visualizedImage.split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });
        await Share.share({
          title: 'Save your GlamAI Outfit',
          url: savedFile.uri,
          dialogTitle: 'Save or Share Style',
        });
      } else {
        const response = await fetch(currentOutfit.visualizedImage);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (e) { console.error('Download failed:', e); }
  };

  if (items.length < 2) {
    return (
      <div className="flex-1 flex flex-col p-8 space-y-12 min-h-[75vh] animate-in fade-in duration-1000">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-px bg-[#26A69A]" />
            <span className="text-[10px] font-black text-[#26A69A] uppercase tracking-[4px]">Digital Protocol</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">The Style <br/> Architect</h2>
        </div>
        <div className="space-y-8">
           <div className="flex items-start space-x-6 relative group">
              <div className="absolute left-6 top-14 bottom-[-1.5rem] w-px bg-gray-100 group-hover:bg-[#26A69A]/30 transition-colors" />
              <div className="w-12 h-12 bg-zinc-900 text-white rounded-[18px] flex flex-shrink-0 items-center justify-center shadow-xl z-10 transition-transform group-hover:scale-110">
                 <Shirt className="w-5 h-5" />
              </div>
              <div className="pt-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Step 01</p>
                <h4 className="text-sm font-black text-gray-900 uppercase">Archive Digitization</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">Upload pieces to initialize. Progress: <span className="font-bold text-[#26A69A]">{items.length}/2</span></p>
              </div>
           </div>
           <div className="flex items-start space-x-6 group">
              <div className="w-12 h-12 bg-white border border-gray-100 text-gray-100 rounded-[18px] flex flex-shrink-0 items-center justify-center shadow-sm z-10 transition-transform group-hover:scale-110">
                 <Globe className="w-5 h-5" />
              </div>
              <div className="pt-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Step 02</p>
                <h4 className="text-sm font-black text-gray-900 uppercase">VR Simulation</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">Our AI will simulate a hyper-realistic reality for your selection.</p>
              </div>
           </div>
        </div>
        <button onClick={onAddClick} className="w-full py-6 bg-[#26A69A] text-white font-black uppercase tracking-[3px] text-[11px] rounded-[32px] shadow-2xl shadow-teal-100 active:scale-95 flex items-center justify-center space-x-4 group mt-auto">
          <span>Begin Digitization</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  if (!profile?.avatar_url) {
    return (
      <div className="flex-1 flex flex-col p-8 space-y-12 min-h-[75vh] animate-in zoom-in duration-700 bg-white">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center space-x-2 px-4 py-1.5 bg-zinc-900 text-white rounded-full">
            <Fingerprint className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-[2px]">Identity Blueprint Required</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">Reality <br/> Sync</h2>
          <p className="text-xs text-gray-400 font-medium px-8 leading-relaxed">We require a facial reference to perform occasion-based reality synthesis.</p>
        </div>
        <div className="relative flex-1 flex flex-col items-center justify-center">
           <div className="w-64 h-64 rounded-[80px] border-2 border-dashed border-teal-100 flex items-center justify-center relative group">
              <div className="absolute inset-4 border-2 border-[#26A69A]/20 rounded-[64px] animate-pulse" />
              <div className="z-10 bg-white p-8 rounded-full shadow-2xl transition-transform group-hover:scale-110 duration-700">
                {isSettingFace ? <Loader2 className="w-12 h-12 text-[#26A69A] animate-spin" /> : <Scan className="w-12 h-12 text-gray-200" />}
              </div>
           </div>
        </div>
        <button onClick={() => faceInputRef.current?.click()} disabled={isSettingFace} className="w-full py-6 bg-zinc-900 text-white font-black uppercase tracking-[3px] text-[11px] rounded-[32px] shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3 group">
          {isSettingFace ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          <span>Capture Blueprint</span>
        </button>
        <input type="file" ref={faceInputRef} onChange={handleFaceSelect} className="hidden" accept="image/*" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Elite Stylist</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Reality Simulation Engine</p>
        </div>
        <div className={`p-4 rounded-[28px] transition-all ${(isGenerating || isVisualizing) ? 'bg-[#26A69A] text-white animate-pulse' : 'bg-[#26A69A]/10 text-[#26A69A]'}`}>
          <Sparkles className="w-6 h-6" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Simulation Objective</p>
          {isOutOfResources && (
            <div className="flex items-center space-x-2 text-red-500">
               <AlertTriangle className="w-3 h-3" />
               <span className="text-[8px] font-black uppercase tracking-widest">Archival Blocked</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
          {OCCASIONS.map((occ) => {
            const isSelected = selectedOccasion === occ;
            const hasCached = !!cache[occ];

            return (
              <button
                key={occ} disabled={isGenerating || isVisualizing} onClick={() => onOccasionClick(occ)}
                className={`flex-shrink-0 min-w-[100px] py-4 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  isSelected ? 'bg-[#26A69A] text-white border-[#26A69A] shadow-lg' : 'bg-white text-gray-400 border-gray-100'
                } relative overflow-hidden disabled:opacity-50`}
              >
                <span className="relative z-10 truncate">{occ}</span>
                {hasCached && !isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#26A69A]" />
                )}
                {isOutOfResources && !hasCached && (
                  <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[1px]">
                    <Lock className="w-3 h-3 text-gray-300" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[450px] flex flex-col">
        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 animate-in zoom-in duration-500">
            <div className="flex flex-col items-center space-y-10">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-spin">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#26A69A" strokeWidth="4" className="opacity-10" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#26A69A" strokeWidth="4" strokeDasharray="276.5" strokeDashoffset="210" strokeLinecap="round" />
                </svg>
                <Wand2 className="w-10 h-10 text-[#26A69A] animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-[2px]">Designing Ensemble...</h3>
                <p className="text-[10px] font-black text-[#26A69A] uppercase tracking-[1.5px] animate-pulse">Archival Audit</p>
              </div>
            </div>
          </div>
        ) : currentOutfit ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
            <div className="relative group rounded-[56px] overflow-hidden bg-white shadow-2xl border border-gray-50">
              <div className="aspect-[3/4] w-full relative bg-gray-50">
                {currentOutfit.visualizedImage ? (
                  <div className="w-full h-full relative animate-in fade-in duration-1000">
                    <img src={currentOutfit.visualizedImage} alt="Outfit Simulation" className="w-full h-full object-cover" />
                    <div className="absolute top-6 left-6 flex items-center space-x-2">
                       <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20">
                          <p className="text-[8px] font-black text-white uppercase tracking-[2px]">Simulation: {selectedOccasion}</p>
                       </div>
                       <div className="px-3 py-1.5 bg-teal-500/80 backdrop-blur-md rounded-full border border-teal-400/30 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <p className="text-[7px] font-black text-white uppercase tracking-[1px]">Reality Verified</p>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center relative bg-zinc-900">
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center bg-black/60 backdrop-blur-md">
                      <div className="relative w-24 h-24 flex items-center justify-center mb-10">
                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-spin">
                          <circle cx="50" cy="50" r="44" fill="none" stroke="#26A69A" strokeWidth="2" strokeDasharray="276.5" strokeDashoffset="210" strokeLinecap="round" />
                        </svg>
                        <div className="animate-in zoom-in duration-500 text-[#26A69A]">
                          {VISUALIZATION_STEPS[suitabilityIndex].icon}
                        </div>
                      </div>
                      
                      <div className="space-y-4 w-full max-w-[240px]">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-white uppercase tracking-[4px]">VR Synthesis</p>
                          <p className="text-[8px] font-black text-[#26A69A] uppercase tracking-[2px] animate-pulse">
                            {VISUALIZATION_STEPS[suitabilityIndex].label}
                          </p>
                        </div>
                        
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-[#26A69A] transition-all duration-1000" 
                             style={{ width: `${(suitabilityIndex + 1) * 25}%` }} 
                           />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute top-8 right-8 flex flex-col space-y-3 z-30">
                  {currentOutfit.visualizedImage && (
                    <button onClick={handleDownload} className="p-4 bg-white/90 backdrop-blur-xl rounded-[20px] shadow-xl text-gray-400 hover:text-[#26A69A] transition-all"><Download className="w-5 h-5" /></button>
                  )}
                  {isOutOfResources ? (
                    <button onClick={() => onPaywall?.()} className="p-4 bg-white/90 backdrop-blur-xl rounded-[20px] shadow-xl text-red-400 hover:text-red-500 transition-all relative group">
                      <Lock className="w-5 h-5" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                    </button>
                  ) : (
                    <button onClick={() => onGenerate(selectedOccasion!)} disabled={isGenerating || isVisualizing} className="p-4 bg-white/90 backdrop-blur-xl rounded-[20px] shadow-xl text-gray-400 hover:text-[#26A69A] transition-all"><RefreshCcw className="w-5 h-5" /></button>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80 to-transparent z-20">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">{currentOutfit.outfit.name}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-gray-50 shadow-sm relative">
               <div className="flex items-center space-x-3 mb-6 text-[#26A69A]">
                 <Info className="w-4 h-4" />
                 <p className="text-[10px] font-black uppercase tracking-[2px]">{t('stylist_word', lang)}</p>
               </div>
               <p className="text-sm text-gray-700 leading-relaxed italic font-medium">"{currentOutfit.outfit.stylistNotes}"</p>
            </div>

            <div className="space-y-6 pb-20">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('ensemble_breakdown', lang)}</p>
              <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
                {currentOutfit.outfit.items.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} onClick={() => onItemClick?.(item)} className="flex-shrink-0 w-36 bg-white p-3 rounded-[32px] border border-gray-50 shadow-sm group cursor-pointer hover:shadow-md transition-shadow">
                    <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-gray-50 mb-3">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                    <div className="px-1">
                        <p className="text-[10px] font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedOccasion ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="relative mb-8">
                <div className="absolute inset-0 bg-[#26A69A]/5 rounded-full blur-2xl scale-150" />
                <div className="relative w-24 h-24 bg-white rounded-[32px] shadow-xl border border-gray-50 flex items-center justify-center">
                   {isOutOfResources ? <Lock className="w-10 h-10 text-red-400" /> : <Sparkles className="w-10 h-10 text-[#26A69A]" />}
                </div>
             </div>
             
             {isOutOfResources ? (
               <div className="space-y-6 flex flex-col items-center">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Archival Block</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[2px] max-w-[200px] mx-auto leading-relaxed">
                      Your digital signature cannot be synthesized without archival resources. Viewing existing records is still permitted.
                    </p>
                  </div>
                  <button
                    onClick={() => onPaywall?.()}
                    className="group px-8 py-5 bg-zinc-900 text-white rounded-[28px] shadow-2xl shadow-teal-900/10 active:scale-95 transition-all flex items-center space-x-4"
                  >
                     <div className="p-2 bg-white/10 rounded-xl group-hover:bg-[#26A69A] transition-colors">
                        <Zap className="w-4 h-4 text-amber-500" />
                     </div>
                     <span className="text-[11px] font-black uppercase tracking-[3px]">Refill Boutique Resources</span>
                  </button>
               </div>
             ) : (
               <div className="space-y-6 flex flex-col items-center">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Elite Curation Pending</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[2px] max-w-[200px] mx-auto leading-relaxed mb-10">
                       {selectedOccasion} protocol ready. Initialize archival synthesis to discover your signature look.
                    </p>
                  </div>
                  <button
                    onClick={() => onGenerate(selectedOccasion!)}
                    className="group px-8 py-5 bg-[#1a1a1a] text-white rounded-[28px] shadow-2xl shadow-teal-900/10 active:scale-95 transition-all flex items-center space-x-4"
                  >
                     <div className="p-2 bg-white/10 rounded-xl group-hover:bg-[#26A69A] transition-colors">
                        <Sparkles className="w-4 h-4" />
                     </div>
                     <span className="text-[11px] font-black uppercase tracking-[3px]">Initiate {selectedOccasion} Simulation</span>
                  </button>
               </div>
             )}
          </div>
        ) : (
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-8"><Sparkle className="w-8 h-8 text-gray-200" /></div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Initialize Stylist</h3>
              <p className="text-xs text-gray-400 font-medium px-4">Choose an objective above to simulate your archival pieces in hyper-realistic reality.</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default OutfitsView;
