import { useMemo, useState, useEffect, useRef } from 'react';
import { WardrobeItem, Occasion, OutfitCache, CachedOutfit, UserProfile } from '../types';
import { Sparkles, Shirt, Plus, RefreshCcw, Wand2, User, Info, Check, Camera, Loader2, Sparkle, Download, AlertTriangle, X } from 'lucide-react';
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
  lang?: string;
  isSettingFace?: boolean;
  onFaceUpload?: (base64: string) => void;
}

const OCCASIONS: Occasion[] = [
  'Casual', 'Work', 'Date Night', 'Formal', 'Weekend Brunch', 
  'Beach & Vacation', 'Wedding Guest', 'Gym', 'Party', 
  'Concert & Festival', 'Job Interview', 'Business Trip', 'Lounge & Home'
];

const STYLIST_WAITING_MESSAGES: Record<string, string[]> = {
  en: [
    "Reviewing your boutique archive...",
    "Consulting the latest luxury trends...",
    "Matching textures with your profile...",
    "Curating an effortless silhouette...",
    "Simulating professional studio lighting...",
    "Finalizing your editorial look..."
  ],
  es: [
    "Revisando tu archivo de boutique...",
    "Consultando las últimas tendencias de lujo...",
    "Combinando texturas con tu perfil...",
    "Creando una silueta impecable...",
    "Simulando iluminación de estudio...",
    "Finalizando tu look editorial..."
  ],
  fr: [
    "Examen de vos archives boutique...",
    "Consultation des dernières tendances...",
    "Accord des textures avec votre profil...",
    "Création d'une silhouette élégante...",
    "Simulation d'un éclairage studio...",
    "Finalisation de votre look éditorial..."
  ],
  ja: [
    "アーカイブを確認中...",
    "最新トレンドをチェック中...",
    "質感とプロフィールをマッチング中...",
    "シルエットを厳選中...",
    "スタジオ照明をシミュレーション中...",
    "エディトリアルルックを仕上げ中..."
  ]
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
  generationPhase,
  onGenerate,
  onItemClick,
  lang = 'en',
  isSettingFace = false,
  onFaceUpload
}) => {
  const [waitMessageIndex, setWaitMessageIndex] = useState(0);
  const [pendingOccasion, setPendingOccasion] = useState<Occasion | null>(null);
  const [showSuitabilityAlert, setShowSuitabilityAlert] = useState(false);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const messages = STYLIST_WAITING_MESSAGES[lang] || STYLIST_WAITING_MESSAGES.en;

  // AUTO-SELECT LOGIC: Pick the first cached item if none is selected
  useEffect(() => {
    if (!selectedOccasion && Object.keys(cache).length > 0 && !isGenerating) {
      const firstOccasionWithCache = OCCASIONS.find(occ => !!cache[occ]);
      if (firstOccasionWithCache) {
        onOccasionChange(firstOccasionWithCache);
      }
    }
  }, [cache, selectedOccasion, onOccasionChange, isGenerating]);

  useEffect(() => {
    let interval: any;
    if (isGenerating || isVisualizing) {
      interval = setInterval(() => {
        setWaitMessageIndex(prev => (prev + 1) % messages.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isGenerating, isVisualizing, messages]);

  const currentOutfit = useMemo(() => {
    return selectedOccasion ? cache[selectedOccasion] : null;
  }, [selectedOccasion, cache]);

  const onOccasionClick = (occ: Occasion) => {
    if (isGenerating || isVisualizing || !profile?.avatar_url) return;
    
    // Check for suitable items
    const hasSuitableItems = items.some(item => 
      item.occasionSuitability?.includes(occ)
    );

    if (!hasSuitableItems && !cache[occ]) {
      setPendingOccasion(occ);
      setShowSuitabilityAlert(true);
      return;
    }

    onOccasionChange(occ);
    if (!cache[occ]) {
      onGenerate(occ);
    }
  };

  const handleProceedRandom = () => {
    if (pendingOccasion) {
      onOccasionChange(pendingOccasion);
      onGenerate(pendingOccasion);
      setShowSuitabilityAlert(false);
      setPendingOccasion(null);
    }
  };

  const handleFaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onFaceUpload?.(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // const triggerDownload = (url: string, filename: string) => {
  //   const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.download = filename;
  //   link.target = '_blank';
  //   document.body.appendChild(link);
  //   link.click();
    
  //   // For iOS and certain mobile browsers, programmatic clicks on blobs might not trigger.
  //   if (isIOS) {
  //     setTimeout(() => {
  //       window.open(url, '_blank');
  //     }, 250);
  //   }

  //   setTimeout(() => {
  //     document.body.removeChild(link);
  //   }, 500);
  // };

  // const handleDownload = async () => {
  //   if (!currentOutfit?.visualizedImage) return;

  //   const filename = `GlamAI-${selectedOccasion?.replace(/\s+/g, '')}-Look.png`;

  //   try {
  //     const response = await fetch(currentOutfit.visualizedImage);
  //     const blob = await response.blob();
      
  //     // If PREMIUM: Download clean immediately
  //     if (profile?.is_premium) {
  //       const url = window.URL.createObjectURL(blob);
  //       triggerDownload(url, filename);
  //       setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  //       return;
  //     }

  //     // If NOT PREMIUM: Add watermark
  //     const img = new Image();
  //     img.crossOrigin = "anonymous";
      
  //     const imageUrl = URL.createObjectURL(blob);
  //     img.src = imageUrl;

  //     await new Promise((resolve, reject) => {
  //       img.onload = resolve;
  //       img.onerror = reject;
  //     });

  //     const canvas = document.createElement('canvas');
  //     canvas.width = img.width;
  //     canvas.height = img.height;
  //     const ctx = canvas.getContext('2d');
  //     if (!ctx) return;

  //     ctx.drawImage(img, 0, 0);

  //     // High-end Watermark "GlamFashion"
  //     const padding = canvas.width * 0.05;
  //     const fontSize = Math.floor(canvas.width * 0.06);
      
  //     ctx.save();
  //     ctx.font = `900 ${fontSize}px Inter, sans-serif`;
  //     ctx.textAlign = 'right';
  //     ctx.textBaseline = 'bottom';
  //     ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  //     ctx.shadowBlur = 12;
  //     ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  //     ctx.fillText("GlamFashion", canvas.width - padding, canvas.height - padding);
  //     ctx.restore();

  //     canvas.toBlob((processedBlob) => {
  //       if (processedBlob) {
  //         const processedUrl = window.URL.createObjectURL(processedBlob);
  //         triggerDownload(processedUrl, filename);
  //         setTimeout(() => {
  //           window.URL.revokeObjectURL(processedUrl);
  //           window.URL.revokeObjectURL(imageUrl);
  //         }, 5000);
  //       }
  //     }, 'image/png');

  //   } catch (error) {
  //     console.error('Download failed:', error);
  //     window.open(currentOutfit.visualizedImage, '_blank');
  //   }
  // };

  const saveNativeFile = async (blob: Blob, filename: string) => {
  try {
    // 1. Convert Blob to Base64 (Capacitor Filesystem requires Base64)
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Data = reader.result as string;

      // 2. Write the file to the Cache directory
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache, // Use Cache for temporary storage before sharing
      });

      // 3. Trigger the Native Share Sheet
      // This allows the user to "Save Image", "Send to WhatsApp", or "Save to Files"
      await Share.share({
        title: 'Save your GlamAI Look',
        text: 'Check out my new outfit from GlamAI!',
        url: savedFile.uri, // This is the internal file path
        dialogTitle: 'Save or Share',
      });
    };
  } catch (error) {
    console.error('Native save failed', error);
  }
};

const handleDownload = async () => {
  if (!currentOutfit?.visualizedImage) return;
  const filename = `GlamAI-${selectedOccasion?.replace(/\s+/g, '')}-Look.png`;

  try {
    const response = await fetch(currentOutfit.visualizedImage);
    const blob = await response.blob();

    // Setup Canvas for watermarking (same as your current code)
    const img = new Image();
    img.crossOrigin = "anonymous";
    const imageUrl = URL.createObjectURL(blob);
    img.src = imageUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    // ... (Your Watermark Logic remains exactly the same) ...

    canvas.toBlob(async (processedBlob) => {
      if (!processedBlob) return;

      if (Capacitor.isNativePlatform()) {
        // USE NATIVE LOGIC FOR ANDROID/IOS
        await saveNativeFile(processedBlob, filename);
      } else {
        // USE WEB LOGIC FOR BROWSER
        const url = window.URL.createObjectURL(processedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      window.URL.revokeObjectURL(imageUrl);
    }, 'image/png');

  } catch (error) {
    console.error('Download failed:', error);
  }
};

  if (items.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center min-h-[60vh] animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-teal-50 rounded-[40px] flex items-center justify-center mb-8 shadow-inner">
           <Shirt className="w-10 h-10 text-[#26A69A]/30" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-4 uppercase">{t('boutique_empty', lang)}</h2>
        <p className="text-gray-400 text-sm mb-12 max-w-[280px] leading-relaxed">
          Upload at least 2 fashion items to allow our AI stylist to curate a look for your avatar.
        </p>
        <button 
          onClick={onAddClick}
          className="px-8 py-5 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-2xl active:scale-95 flex items-center space-x-3"
        >
          <Plus className="w-4 h-4" />
          <span>{t('import_items', lang)}</span>
        </button>
      </div>
    );
  }

  if (!profile?.avatar_url) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 min-h-[70vh] animate-in zoom-in duration-700">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Identity Check</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px]">Establish Your Fashion Blueprint</p>
        </div>

        <div className="w-full max-w-sm bg-zinc-900 rounded-[56px] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#26A69A]/10 blur-[80px] rounded-full group-hover:bg-[#26A69A]/20 transition-all duration-1000" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
             <div className="w-32 h-32 rounded-[48px] bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center mb-8 group-hover:border-white/40 transition-colors">
                {isSettingFace ? (
                  <Loader2 className="w-10 h-10 text-[#26A69A] animate-spin" />
                ) : (
                  <User className="w-12 h-12 text-white/20" />
                )}
             </div>
             <h3 className="text-xl font-bold text-white mb-4">Your Digital Mirror is Empty</h3>
             <p className="text-white/40 text-xs leading-relaxed mb-10 px-4">
               To personalize your editorial looks, our AI requires a reference face to digitize your avatar and simulate try-ons.
             </p>
             
             <button 
               onClick={() => faceInputRef.current?.click()}
               disabled={isSettingFace}
               className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl hover:bg-[#26A69A] hover:text-white transition-all active:scale-95 flex items-center justify-center space-x-3"
             >
               {isSettingFace ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
               <span>Sync Digital Persona</span>
             </button>
             
             <input type="file" ref={faceInputRef} onChange={handleFaceSelect} className="hidden" accept="image/*" />
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[9px] font-black text-gray-300 uppercase tracking-widest">
          <Sparkle className="w-3 h-3" />
          <span>High Fidelity Visualization Required</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">{t('ai_stylist', lang)}</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-2">Personalized Editorial Mirror</p>
        </div>
        <div className={`p-4 rounded-[28px] transition-all ${(isGenerating || isVisualizing) ? 'bg-[#26A69A] text-white animate-pulse' : 'bg-[#26A69A]/10 text-[#26A69A]'}`}>
          <Wand2 className="w-6 h-6" />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('select_objective', lang)}</p>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
          {OCCASIONS.map((occ) => {
            const isSelected = selectedOccasion === occ;
            const hasCached = !!cache[occ];
            return (
              <button
                key={occ}
                disabled={isGenerating || isVisualizing}
                onClick={() => onOccasionClick(occ)}
                className={`flex-shrink-0 min-w-[100px] py-4 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  isSelected 
                    ? 'bg-[#26A69A] text-white border-[#26A69A] shadow-lg shadow-teal-100' 
                    : 'bg-white text-gray-400 border-gray-100 hover:border-teal-100 hover:text-gray-600'
                } relative overflow-hidden disabled:opacity-50`}
              >
                <span className="relative z-10 truncate">{occ}</span>
                {hasCached && !isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#26A69A] rounded-full" />
                )}
                {isSelected && !isGenerating && !isVisualizing && (
                  <Check className="absolute -bottom-1 -right-1 w-6 h-6 opacity-20" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[450px] flex flex-col">
        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-20 animate-in zoom-in duration-500">
            <div className="relative">
              <div className="w-32 h-32 rounded-[52px] bg-white shadow-2xl flex items-center justify-center relative">
                <div className="absolute inset-[-8px] border-[6px] border-[#26A69A]/5 border-t-[#26A69A] rounded-[60px] animate-spin" />
                <Sparkles className="w-12 h-12 text-[#26A69A] animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-[1px] mb-3">
                {generationPhase === 'analyzing' && t('analyzing_closet', lang)}
                {generationPhase === 'designing' && t('curating_ensemble', lang)}
                {generationPhase === 'visualizing' && t('dressing_avatar', lang)}
              </h3>
              <div className="h-6">
                <p className="text-[10px] text-[#26A69A] font-black uppercase tracking-[2px] animate-in fade-in duration-500">
                  {messages[waitMessageIndex]}
                </p>
              </div>
            </div>
          </div>
        ) : currentOutfit ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
            <div className="relative group rounded-[56px] overflow-hidden bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border border-gray-50">
              <div className="aspect-[3/4] w-full relative bg-gray-50">
                {currentOutfit.visualizedImage ? (
                  <img src={currentOutfit.visualizedImage} alt="Outlook" className="w-full h-full object-cover animate-in fade-in duration-1000" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-md z-10 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-gray-100 border-t-[#26A69A] rounded-full animate-spin mb-4" />
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('dressing_avatar', lang)}</p>
                    </div>
                    <User className="w-20 h-20 mb-4 opacity-10" />
                    <p className="text-[10px] font-black tracking-widest uppercase text-gray-200">Generating Identity Mirror</p>
                  </div>
                )}
                
                <div className="absolute top-10 left-10 right-10 flex items-start justify-between z-20">
                  <div className="bg-white/90 backdrop-blur-2xl px-6 py-3 rounded-full shadow-xl border border-white/50">
                    <span className="text-[9px] font-black text-[#26A69A] uppercase tracking-[3px]">{selectedOccasion}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {currentOutfit.visualizedImage && (
                      <button 
                        onClick={handleDownload}
                        className="p-5 bg-white/90 backdrop-blur-2xl rounded-[24px] shadow-xl text-gray-400 hover:text-[#26A69A] transition-all active:scale-95"
                        title="Download Look"
                      >
                        <Download className="w-6 h-6" />
                      </button>
                    )}
                    <button 
                      onClick={() => onGenerate(selectedOccasion!)}
                      disabled={isGenerating || isVisualizing}
                      className="p-5 bg-white/90 backdrop-blur-2xl rounded-[24px] shadow-xl text-gray-400 hover:text-[#26A69A] transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCcw className={`w-6 h-6 ${(isGenerating || isVisualizing) ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none">{currentOutfit.outfit.name}</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] p-10 border border-gray-50 shadow-sm relative overflow-hidden group">
               <div className="flex items-center space-x-4 mb-6 text-[#26A69A]">
                 <div className="p-2 bg-teal-50 rounded-xl">
                    <Info className="w-5 h-5" />
                 </div>
                 <p className="text-[11px] font-black uppercase tracking-[3px]">{t('stylist_word', lang)}</p>
               </div>
               <p className="text-[15px] text-gray-700 leading-relaxed italic font-medium">
                 "{currentOutfit.outfit.stylistNotes}"
               </p>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('ensemble_breakdown', lang)}</p>
              <div className="flex space-x-5 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
                {currentOutfit.outfit.items.map((item, idx) => (
                  <div 
                    key={`${item.id}-${idx}`} 
                    onClick={() => onItemClick?.(item)}
                    className="flex-shrink-0 w-36 bg-white p-3 rounded-[32px] border border-gray-50 shadow-sm group cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-[4/5] rounded-[24px] overflow-hidden bg-gray-50 mb-4">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    <div className="px-1">
                      <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{item.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-14 text-center bg-white rounded-[56px] border-2 border-dashed border-gray-100 shadow-sm animate-in fade-in zoom-in duration-1000">
            <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-10 transition-transform hover:scale-105 duration-500">
              <Shirt className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-[1px]">{t('select_objective', lang)}</h3>
          </div>
        )}
      </div>

      {/* Suitability Warning Alert */}
      {showSuitabilityAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[56px] p-10 text-center shadow-2xl relative animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-amber-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                 <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4 leading-none">{t('no_suitable_items', lang)}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-10 px-4">
                {t('suitability_warning', lang)} <br/><br/>
                <span className="font-bold text-gray-900">{t('random_selection_prompt', lang)}</span>
              </p>
              <div className="flex flex-col space-y-3">
                 <button 
                   onClick={handleProceedRandom}
                   className="w-full py-5 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl hover:bg-[#1d8278] transition-all active:scale-95 flex items-center justify-center space-x-3"
                 >
                   <Sparkles className="w-4 h-4" />
                   <span>{t('proceed_random', lang)}</span>
                 </button>
                 <button 
                   onClick={() => {
                     setShowSuitabilityAlert(false);
                     setPendingOccasion(null);
                   }}
                   className="w-full py-5 bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[11px] rounded-[28px] hover:bg-gray-100 transition-all flex items-center justify-center space-x-3"
                 >
                   <X className="w-4 h-4" />
                   <span>{t('cancel', lang)}</span>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default OutfitsView;