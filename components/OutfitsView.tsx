import React, { useMemo, useState, useRef, useEffect } from 'react';
import { WardrobeItem, Occasion, OutfitCache, CachedOutfit, UserProfile, OutfitSuggestion, ORDERED_OCCASIONS } from '../types';
import { Sparkles, Shirt, RefreshCcw, Wand2, User, Camera, Loader2, Sparkle, Download, AlertTriangle, X, Eye, Globe, Layers, ArrowRight, CheckCircle2, Box, Fingerprint, Trash2, Quote, RefreshCw } from 'lucide-react';
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
  onSelectOutfit: (outfit: OutfitSuggestion, force?: boolean) => void;
  onDeleteSuggestion?: (suggestionId: string) => void;
  suggestedOutfits?: OutfitSuggestion[];
  newItemsCount?: number;
  onItemClick?: (item: WardrobeItem) => void;
  onPaywall?: () => void;
  lang?: string;
  isSettingFace?: boolean;
  onFaceUpload?: (base64: string) => void;
}

const OutfitPreviewComposite: React.FC<{ items: WardrobeItem[], blurred?: boolean }> = ({ items, blurred = false }) => {
  const displayItems = items.slice(0, 4);
  return (
    <div className={`w-full h-full relative grid grid-cols-2 grid-rows-2 gap-0.5 bg-gray-50 transition-all duration-1000 ${blurred ? 'blur-md scale-110' : ''}`}>
      {displayItems.map((item, idx) => (
        <div key={idx} className="relative w-full h-full overflow-hidden">
          <img src={item.imageUrl} className="w-full h-full object-cover" alt="Composite part" />
          <div className="absolute inset-0 bg-black/[0.03]" />
        </div>
      ))}
      {displayItems.length === 1 && <div className="col-start-2 row-span-2 bg-gray-50" />}
      {displayItems.length === 2 && <div className="col-span-2 row-start-2 bg-gray-50" />}
      {displayItems.length === 3 && <div className="col-start-2 row-start-2 bg-gray-50" />}
      {!blurred && (
        <>
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Shirt className="w-6 h-6 text-gray-200/50" />
          </div>
        </>
      )}
    </div>
  );
};

const OutfitsView: React.FC<OutfitsViewProps> = ({
  items,
  profile,
  onAddClick,
  cache,
  selectedOccasion,
  onOccasionChange,
  isGenerating,
  isVisualizing,
  onGenerate,
  onSelectOutfit,
  onDeleteSuggestion,
  suggestedOutfits = [],
  newItemsCount = 0,
  onItemClick,
  lang = 'en',
  isSettingFace = false,
  onFaceUpload
}) => {
  const [suitabilityIndex, setSuitabilityIndex] = useState(0);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [designingIndex, setDesigningIndex] = useState(0);
  const faceInputRef = useRef<HTMLInputElement>(null);

  // ... (Keep existing useEffects for intervals and activeSuggestionId) ...
  const DESIGNING_MESSAGES = [
    "Analyzing Silhouette Architecture...",
    "Cross-referencing Seasonal Palettes...",
    "Consulting Archival Trends...",
    "Finalizing Couture Combinations..."
  ];

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setDesigningIndex(prev => (prev + 1) % DESIGNING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    let interval: any;
    if (isSettingFace) {
      setUploadProgress(0);
      interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 15;
        });
      }, 300);
    } else {
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    }
    return () => clearInterval(interval);
  }, [isSettingFace]);

  useEffect(() => {
    if (suggestedOutfits.length > 0) {
      if (!activeSuggestionId || !suggestedOutfits.find(s => s.id === activeSuggestionId)) {
        setActiveSuggestionId(suggestedOutfits[0].id);
      }
    }
  }, [suggestedOutfits, activeSuggestionId]);

  const activeSuggestion = useMemo(() => {
    return suggestedOutfits.find(s => s.id === activeSuggestionId) || null;
  }, [suggestedOutfits, activeSuggestionId]);

  const activeVisualization = useMemo(() => {
    return activeSuggestionId ? cache[activeSuggestionId] : null;
  }, [activeSuggestionId, cache]);

  

  // Check if the current profile avatar differs from the one used in the visualization
  const isAvatarOutdated = useMemo(() => {
    if (!activeVisualization?.visualizedImage || !activeVisualization.avatarUrl || !profile?.avatar_url) return false;
    return activeVisualization.avatarUrl !== profile.avatar_url;
  }, [activeVisualization, profile]);

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

  const handleFaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onFaceUpload?.(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!activeVisualization?.visualizedImage) return;
    const filename = `GlamAI-${activeSuggestion?.name.replace(/\s+/g, '') || 'Outfit'}.png`;
    try {
      if (Capacitor.isNativePlatform()) {
        const base64Data = activeVisualization.visualizedImage.split(',')[1] || activeVisualization.visualizedImage; // Handle if URL or Base64 (though logic says URL now)
        // Note: Filesystem.writeFile usually expects base64 data. 
        // Since we switched to URLs in wardrobeService, handleDownload needs to fetch the blob first if it's a remote URL.
        const response = await fetch(activeVisualization.visualizedImage);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const savedFile = await Filesystem.writeFile({
                path: filename,
                data: base64,
                directory: Directory.Cache,
            });
            await Share.share({ title: 'Save your GlamAI Outfit', url: savedFile.uri });
        };
        reader.readAsDataURL(blob);
      } else {
        const response = await fetch(activeVisualization.visualizedImage);
        const blob = await response.blob() as Blob;
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

  // ... (Keep existing empty state checks) ...
  if (items.length < 2) {
    const progress = Math.min((items.length / 2) * 100, 100);
    
    return (
      <div className="flex-1 flex flex-col p-6 min-h-[80vh] animate-in fade-in duration-1000 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#26A69A]/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -z-10" />

        {/* Hero Section */}
        <div className="mt-4 mb-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white shadow-lg shadow-teal-900/5 rounded-2xl mb-4 animate-bounce-subtle">
            <Sparkles className="w-6 h-6 text-[#26A69A]" />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
            Initialize <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#26A69A] to-teal-600">Style Engine</span>
          </h2>
          <p className="text-xs text-gray-500 font-medium px-8 leading-relaxed">
            Your digital stylist requires archival data. Digitize at least 2 wardrobe pieces to activate the neural mixing core.
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-white mb-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
             <div className="h-full bg-[#26A69A] transition-all duration-1000" style={{ width: `${progress}%` }} />
           </div>
           
           <div className="flex justify-between items-center mb-6 pt-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">System Status</span>
              <span className="px-3 py-1 bg-gray-50 rounded-full text-[9px] font-black text-gray-900 uppercase tracking-widest border border-gray-100">
                {items.length}/2 Items Ready
              </span>
           </div>

           <div className="space-y-4">
              <div className={`flex items-center p-3 rounded-2xl transition-all ${items.length > 0 ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-dashed border-gray-200'}`}>
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-4 ${items.length > 0 ? 'bg-[#26A69A] text-white' : 'bg-white text-gray-300'}`}>
                    <Shirt className="w-4 h-4" />
                 </div>
                 <div className="flex-1">
                    <h4 className={`text-xs font-bold ${items.length > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                       {items.length > 0 ? 'First Asset Archived' : 'Upload First Piece'}
                    </h4>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Top / Bottom / Dress</p>
                 </div>
                 {items.length > 0 && <CheckCircle2 className="w-4 h-4 text-[#26A69A]" />}
              </div>

              <div className={`flex items-center p-3 rounded-2xl transition-all ${items.length > 1 ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-dashed border-gray-200'}`}>
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-4 ${items.length > 1 ? 'bg-[#26A69A] text-white' : 'bg-white text-gray-300'}`}>
                    <Layers className="w-4 h-4" />
                 </div>
                 <div className="flex-1">
                    <h4 className={`text-xs font-bold ${items.length > 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                       {items.length > 1 ? 'Archive Ready' : 'Upload Second Piece'}
                    </h4>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mt-0.5">Complementary Item</p>
                 </div>
                 {items.length > 1 && <CheckCircle2 className="w-4 h-4 text-[#26A69A]" />}
              </div>
           </div>
        </div>

        {/* Feature Tease */}
        <div className="grid grid-cols-2 gap-3 mb-auto">
           <div className="bg-gray-50 p-4 rounded-[24px] border border-gray-100 flex flex-col items-center text-center space-y-2">
              <Wand2 className="w-5 h-5 text-amber-500" />
              <p className="text-[9px] font-bold text-gray-900 leading-tight">AI Outfit<br/>Generation</p>
           </div>
           <div className="bg-gray-50 p-4 rounded-[24px] border border-gray-100 flex flex-col items-center text-center space-y-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              <p className="text-[9px] font-bold text-gray-900 leading-tight">Virtual<br/>Try-On</p>
           </div>
        </div>

        <button 
          onClick={onAddClick} 
          className="w-full py-6 bg-zinc-900 text-white font-black uppercase tracking-[3px] text-[11px] rounded-[32px] shadow-2xl active:scale-95 flex items-center justify-center space-x-3 group transition-all hover:bg-[#26A69A]"
        >
          <Camera className="w-4 h-4" />
          <span>Launch Camera Protocol</span>
        </button>
      </div>
    );
  }

  if (!profile?.avatar_url || isSettingFace) {
    // ... same as before
    return (
        <div className="flex-1 flex flex-col p-8 space-y-12 min-h-[75vh] animate-in zoom-in duration-700 bg-white">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center space-x-2 px-4 py-1.5 bg-zinc-900 text-white rounded-full">
              <Sparkles className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-[2px]">{isSettingFace ? 'Archiving Identity' : 'Identity Blueprint Required'}</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">Reality <br /> Sync</h2>
            <p className="text-xs text-gray-400 font-medium px-8 leading-relaxed">
              {isSettingFace ? 'Synchronizing your physical blueprints to our cloud archive...' : 'We require a facial reference to perform occasion-based reality synthesis.'}
            </p>
          </div>
          <div className="relative flex-1 flex flex-col items-center justify-center">
             <div className="w-64 h-64 rounded-[80px] border-2 border-dashed border-teal-100 flex items-center justify-center relative group">
                <div className={`absolute inset-4 border-2 border-[#26A69A]/20 rounded-[64px] ${isSettingFace ? 'animate-spin border-t-[#26A69A]' : 'animate-pulse'}`} />
                <div className="z-10 bg-white p-8 rounded-full shadow-2xl transition-transform group-hover:scale-110 duration-700">
                  {isSettingFace ? <Loader2 className="w-12 h-12 text-[#26A69A] animate-spin" /> : <User className="w-12 h-12 text-gray-200" />}
                </div>
             </div>
             {isSettingFace && (
               <div className="w-full max-w-[200px] mt-10 space-y-3">
                  <div className="flex items-center justify-between px-1">
                     <span className="text-[8px] font-black text-[#26A69A] uppercase tracking-widest">Syncing Identity...</span>
                     <span className="text-[10px] font-black text-gray-900">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                     <div className="h-full bg-[#26A69A] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
               </div>
             )}
          </div>
          <button onClick={() => faceInputRef.current?.click()} disabled={isSettingFace} className="w-full py-6 bg-zinc-900 text-white font-black uppercase tracking-[3px] text-[11px] rounded-[32px] shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3 group">
            {isSettingFace ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <span>{isSettingFace ? 'Processing Archive' : 'Capture Blueprint'}</span>
          </button>
          <input type="file" ref={faceInputRef} onChange={handleFaceSelect} className="hidden" accept="image/*" />
        </div>
      );
  }

  return (
    <div className="p-0 space-y-0 pb-16">
      {/* 1. OCCASION SELECTOR HEADER */}
      <div className="px-6 py-5 bg-white border-b border-gray-50 sticky top-0 z-[40]">
        <div className="flex space-x-3 overflow-x-auto no-scrollbar -mx-1 px-1">
          {ORDERED_OCCASIONS.map((occ) => {
            const isSelected = selectedOccasion === occ;
            const hasCached = Object.values(cache).some((c: CachedOutfit) => c.outfit.occasion === occ);
            return (
              <button
                key={occ} onClick={() => onOccasionChange(occ)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border relative ${
                  isSelected ? 'bg-[#26A69A] text-white border-[#26A69A] shadow-md' : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                }`}
              >
                {occ}
                {hasCached && <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#26A69A]'}`} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 space-y-12">
        {isGenerating ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-10">
            <div className="w-24 h-24 border-4 border-[#26A69A] border-t-transparent rounded-full animate-spin" />
            <div className="space-y-2">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{DESIGNING_MESSAGES[designingIndex]}</h3>
              <p className="text-[10px] text-[#26A69A] font-black uppercase tracking-[3px] animate-pulse">Archival discovery active</p>
            </div>
          </div>
        ) : suggestedOutfits.length > 0 ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 2. ARCHIVE GRID (SUGGESTIONS) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Couture Archives</p>
                 <button 
                  onClick={() => onGenerate(selectedOccasion!)}
                  className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-teal-50 hover:text-[#26A69A] transition-all active:scale-90 border border-gray-100"
                  title="Regenerate Edits"
                 >
                   <RefreshCcw className="w-4 h-4" />
                 </button>
              </div>
              <div className="flex space-x-5 overflow-x-auto no-scrollbar pb-6 px-1">
                {suggestedOutfits.map((s) => {
                  const isActive = activeSuggestionId === s.id;
                  const hasImage = cache[s.id]?.visualizedImage;
                  return (
                    <div key={s.id} className="relative flex-shrink-0 w-32 group">
                      <button
                        onClick={() => setActiveSuggestionId(s.id)}
                        className={`w-full text-left transition-all ${isActive ? 'scale-105' : 'opacity-50 scale-95'}`}
                      >
                        <div className={`aspect-[4/5] rounded-[36px] overflow-hidden border-2 mb-3 transition-all relative ${isActive ? 'border-[#26A69A] shadow-xl' : 'border-transparent shadow-sm'}`}>
                          {hasImage ? (
                             <img src={cache[s.id].visualizedImage!} className="w-full h-full object-cover" alt="Archived Simulation" />
                          ) : (
                             <OutfitPreviewComposite items={s.items} />
                          )}
                          {isActive && (
                            <div className="absolute inset-0 bg-black/5 flex items-center justify-center backdrop-blur-[1px]">
                              <div className="p-1.5 bg-[#26A69A] rounded-full text-white shadow-lg"><CheckCircle2 className="w-3 h-3" /></div>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] font-black text-gray-900 truncate uppercase tracking-tighter px-1">{s.name}</p>
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteId(s.id); }}
                        className="absolute -top-1 -right-1 p-2 bg-white text-gray-300 hover:text-red-500 rounded-full shadow-lg border border-gray-50 z-20 transition-all active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. SIMULATION STAGE */}
            <div className="space-y-8">
              <div className="relative aspect-[3/4] bg-zinc-900 rounded-[56px] overflow-hidden shadow-2xl border-8 border-white group">
                {isVisualizing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-black/20 backdrop-blur-xl">
                     <div className="w-20 h-20 border-2 border-[#26A69A] border-t-transparent rounded-full animate-spin mb-10" />
                     <p className="text-[10px] font-black text-white uppercase tracking-[4px]">{VISUALIZATION_STEPS[suitabilityIndex].label}</p>
                  </div>
                ) : activeVisualization?.visualizedImage ? (
                  <div className="w-full h-full relative animate-in fade-in duration-1000">
                    <img src={activeVisualization.visualizedImage} alt="Reality Result" className="w-full h-full object-cover" />
                    
                    {/* Action Buttons Overlay */}
                    <div className="absolute top-8 right-8 flex flex-col gap-3">
                        <button onClick={handleDownload} className="p-4 bg-white text-zinc-900 rounded-2xl shadow-2xl active:scale-90 transition-transform">
                            <Download className="w-5 h-5" />
                        </button>
                        
                        {/* RE-VISUALIZE BUTTON - Shows only if avatars differ */}
                        {activeSuggestion && isAvatarOutdated && (
                            <button 
                                onClick={() => onSelectOutfit(activeSuggestion, true)}
                                className="p-4 bg-[#26A69A] text-white rounded-2xl shadow-2xl active:scale-90 transition-transform animate-in zoom-in duration-300"
                                title="Avatar has changed. Update visualization?"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-8 overflow-hidden">
                     {/* Enhanced Background with Curated Outfits blurred in mosaic */}
                     <div className="absolute inset-0 z-0">
                        {activeSuggestion && <OutfitPreviewComposite items={activeSuggestion.items} blurred={true} />}
                        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" />
                     </div>
                     
                     <div className="relative z-10 flex flex-col items-center space-y-8 w-full animate-in zoom-in-95 duration-700">
                        <div className="p-6 bg-white/10 backdrop-blur-md rounded-[32px] border border-white/5 shadow-2xl">
                           <Wand2 className="w-10 h-10 text-teal-100" />
                        </div>
                        <button
                           onClick={() => activeSuggestion && onSelectOutfit(activeSuggestion)}
                           className="w-full py-6 bg-[#26A69A] text-white rounded-[32px] font-black uppercase tracking-widest text-[11px] shadow-[0_12px_48px_-12px_rgba(38,166,154,0.5)] active:scale-95 transition-all hover:bg-[#208a80] animate-bounce-subtle"
                         >Simulate Reality</button>
                      </div>
                  </div>
                )}
              </div>

              {/* 4. ENSEMBLE INTELLIGENCE & EDITORIAL COMMENT */}
              {activeSuggestion && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <div className="flex flex-col space-y-4 px-2">
                     <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight leading-[0.9]">{activeSuggestion.name}</h2>
                     <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-[#26A69A]/10 text-[#26A69A] rounded-lg text-[10px] font-black uppercase tracking-widest">
                           {activeSuggestion.items.length} PIECES
                        </span>
                        <div className="w-1.5 h-1.5 bg-gray-100 rounded-full" />
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[3px]">
                           IDENTITY PROTECTED
                        </span>
                     </div>
                  </div>

                  <div className="relative px-2">
                    <Quote className="absolute -top-2 -left-1 w-8 h-8 text-gray-50 opacity-20 -z-10" />
                    <p className="text-sm text-gray-500 leading-relaxed font-medium italic border-l-[3px] border-teal-50 pl-6 py-1">
                       {activeSuggestion.stylistNotes}
                    </p>
                  </div>

                  <div className="space-y-5 pt-4">
                    <div className="flex items-center space-x-3 px-2">
                       <Box className="w-4 h-4 text-[#26A69A]" />
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">{t('ensemble_breakdown', lang)}</p>
                    </div>
                    <div className="flex space-x-5 overflow-x-auto no-scrollbar pb-4 px-2">
                      {activeSuggestion.items.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => onItemClick?.(item)}
                          className="flex-shrink-0 w-36 bg-white rounded-[40px] p-2.5 border border-gray-50 shadow-sm cursor-pointer active:scale-95 transition-all group/item"
                        >
                          <div className="aspect-[4/5] rounded-[32px] overflow-hidden bg-gray-50 mb-3">
                            <img src={item.imageUrl} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-1000" alt={item.name} />
                          </div>
                          <p className="text-[10px] font-bold text-gray-800 truncate px-2 uppercase tracking-tighter text-center">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
           <div className="py-24 flex flex-col items-center justify-center text-center space-y-12">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-4">
                  <Sparkle className="w-8 h-8 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Initialize Stylist</h3>
                <p className="text-xs text-gray-400 font-medium px-8 leading-relaxed">Choose an objective above to simulate your archival collection.</p>
              </div>

              {selectedOccasion && (
                <button
                  onClick={() => onGenerate(selectedOccasion)}
                  className="w-full max-w-[280px] py-6 bg-zinc-900 text-white rounded-[32px] shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-4 mx-auto"
                >
                  <Wand2 className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-[3px]">Generate {selectedOccasion} Edits</span>
                </button>
              )}
           </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-[320px] rounded-[64px] p-12 text-center shadow-2xl scale-in duration-300">
             <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-10 mx-auto">
               <Trash2 className="w-10 h-10 text-red-400" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">Retire Ensemble?</h3>
             <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-12 px-4">This combination will be permanently removed from your curated collection.</p>
             <div className="w-full space-y-4">
                <button onClick={() => { onDeleteSuggestion?.(pendingDeleteId); setPendingDeleteId(null); }} className="w-full py-6 bg-red-500 text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl">Confirm Retirement</button>
                <button onClick={() => setPendingDeleteId(null)} className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[10px]">Keep in Archive</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .scale-in { animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default OutfitsView;