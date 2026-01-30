
import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, Sparkles, TrendingUp, Zap, ChevronRight, 
  Upload, Camera, Loader2, X, Image as ImageIcon, 
  CheckCircle2, User, Shirt, Info, Trash2, PenTool, 
  UserCheck, Layers, Star, Eraser, ExternalLink, Plus,
  Grid, Search, Download, ShieldCheck, Crown, Lock
} from 'lucide-react';
import { t } from '../services/i18n';
import { restoreFashionImage, processQuickDress, getBase64Data, RestorationMode, analyzeUpload } from '../services/geminiService';
import { compressImage } from '../services/wardrobeService';
import { UserProfile, WardrobeItem } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface DressMeItem {
  url: string;
  metadata: Partial<WardrobeItem>;
  isAnalyzing: boolean;
}

interface ExploreViewProps {
  lang?: string;
  profile?: UserProfile | null;
  items?: WardrobeItem[];
  onUseCredit: () => Promise<void>;
  onPaywall: () => void;
}

const ExploreView: React.FC<ExploreViewProps> = ({ lang = 'en', profile, items = [], onUseCredit, onPaywall }) => {
  const [activeTool, setActiveTool] = useState<'dressme' | 'restore' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCleaningClothing, setIsCleaningClothing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [userRequest, setUserRequest] = useState('');
  const [restoreUserRequest, setRestoreUserRequest] = useState('');
  const [restoreSource, setRestoreSource] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestorationMode>('portrait');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showWardrobePicker, setShowWardrobePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dressMeImages, setDressMeImages] = useState<{ clothes: DressMeItem[], avatar: string | null }>({ 
    clothes: [], 
    avatar: null 
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTool === 'dressme' && profile?.avatar_url && !dressMeImages.avatar) {
      const syncAvatar = async () => {
        try {
          const base64 = await getBase64Data(profile.avatar_url!);
          setDressMeImages(prev => ({ ...prev, avatar: `data:image/jpeg;base64,${base64}` }));
        } catch (e) {
          console.warn("Could not sync profile avatar to DressMe", e);
        }
      };
      syncAvatar();
    }
  }, [activeTool, profile]);

  const resetLab = () => {
    setActiveTool(null);
    setIsProcessing(false);
    setIsCleaningClothing(false);
    setResultImage(null);
    setUserRequest('');
    setRestoreUserRequest('');
    setRestoreSource(null);
    setRestoreMode('portrait');
    setDressMeImages({ clothes: [], avatar: null });
    setShowAddMenu(false);
    setShowWardrobePicker(false);
  };

  const checkCredits = () => {
    if (!profile) return false;
    const generations = profile.total_generations || 0;
    const credits = profile.credits || 0;
    if (generations >= 15 && credits <= 0) {
      onPaywall();
      return false;
    }
    return true;
  };

  const handleRestore = async () => {
    if (!restoreSource) return;
    if (!checkCredits()) return;

    setIsProcessing(true);
    try {
      const compressed = await compressImage(restoreSource, 1280, 0.82);
      const enhanced = await restoreFashionImage(compressed.split(',')[1], restoreMode, restoreUserRequest);
      
      await onUseCredit();
      setResultImage(enhanced);
    } catch (e: any) {
      console.error(e);
      if (e.message !== 'OUT_OF_CREDITS') alert("Vogue restoration failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processClothingImage = async (base64: string, itemData?: Partial<WardrobeItem>) => {
    setDressMeImages(prev => ({ 
      ...prev, 
      clothes: [...prev.clothes, { url: base64, metadata: itemData || {}, isAnalyzing: !itemData }].slice(0, 4) 
    }));

    if (!itemData) {
      try {
        const compressed = await compressImage(base64, 800, 0.7);
        const analyzed = await analyzeUpload(compressed, lang);
        if (analyzed && analyzed.length > 0) {
          const firstItem = analyzed[0];
          setDressMeImages(prev => ({
            ...prev,
            clothes: prev.clothes.map(c => c.url === base64 ? { ...c, metadata: firstItem, isAnalyzing: false } : c)
          }));
        } else {
           setDressMeImages(prev => ({
            ...prev,
            clothes: prev.clothes.map(c => c.url === base64 ? { ...c, isAnalyzing: false } : c)
          }));
        }
      } catch (err) {
        setDressMeImages(prev => ({
          ...prev,
          clothes: prev.clothes.map(c => c.url === base64 ? { ...c, isAnalyzing: false } : c)
        }));
      }
    }
  };

  const handleClothingSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: Blob) => {
        const reader = new FileReader();
        reader.onload = () => processClothingImage(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
    setShowAddMenu(false);
  };

  const handleWardrobeItemPick = async (item: WardrobeItem) => {
    setShowWardrobePicker(false);
    setShowAddMenu(false);
    try {
      const base64Data = await getBase64Data(item.imageUrl);
      await processClothingImage(`data:image/jpeg;base64,${base64Data}`, item);
    } catch (e) {
      console.error("Failed to fetch wardrobe item", e);
    }
  };

  const removeClothingItem = (index: number) => {
    setDressMeImages(prev => ({
      ...prev,
      clothes: prev.clothes.filter((_, i) => i !== index)
    }));
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setDressMeImages(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const onRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setRestoreSource(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDressMeSimulation = async () => {
    if (dressMeImages.clothes.length === 0 || !dressMeImages.avatar) return;
    if (!checkCredits()) return;
    if (dressMeImages.clothes.some(c => c.isAnalyzing)) return;

    setIsProcessing(true);
    try {
      const compressedClothes = await Promise.all(dressMeImages.clothes.map(c => compressImage(c.url, 800, 0.7)));
      const compressedAvatar = await compressImage(dressMeImages.avatar, 600, 0.6);
      const cleanClothes = compressedClothes.map(c => c.split(',')[1]);
      const cleanAvatar = compressedAvatar.split(',')[1];
      const descriptions = dressMeImages.clothes.map(c => `- ${c.metadata.name || 'Piece'}: ${c.metadata.description || 'Apparel'}`).join('\n');
      const outfit = await processQuickDress(cleanClothes, cleanAvatar, descriptions, userRequest);
      
      await onUseCredit();
      setResultImage(outfit);
    } catch (e: any) {
      if (e.message !== 'OUT_OF_CREDITS') alert("DressMe simulation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    const filename = `GlamAI-Lab-${Date.now()}.png`;
    try {
      if (Capacitor.isNativePlatform()) {
        const base64Data = resultImage.split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });
        await Share.share({
          title: 'Save your GlamAI Result',
          url: savedFile.uri,
          dialogTitle: 'Save or Share Couture',
        });
      } else {
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const filteredWardrobe = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLocked = !profile?.is_premium;

  return (
    <div className="flex flex-col space-y-12 py-6 px-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="bg-zinc-900 rounded-[32px] p-6 border border-white/5 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="w-12 h-12 text-white" /></div>
         <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] mb-1">Archival Resources</p>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">{profile?.credits || 0} <span className="text-[#26A69A]">Credits</span></h4>
            </div>
            <button onClick={onPaywall} className="px-5 py-2.5 bg-[#26A69A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Refill</button>
         </div>
         <div className="mt-4 flex items-center space-x-2">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-[#26A69A]" style={{ width: `${Math.min(((profile?.total_generations || 0) / 15) * 100, 100)}%` }} />
            </div>
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Trial {profile?.total_generations || 0}/15</span>
         </div>
      </section>

      <section className="space-y-4 relative">
        <div className="flex items-center space-x-2"><Zap className="w-4 h-4 text-[#26A69A]" /><h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t('the_lab', lang)}</h3></div>
        
        {isLocked ? (
          <div className="relative group">
            <div className="grid grid-cols-2 gap-4 blur-md opacity-30 pointer-events-none">
              <div className="p-6 bg-white rounded-[32px] border border-gray-100 flex flex-col items-center">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl mb-4" />
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">DressMe</p>
              </div>
              <div className="p-6 bg-white rounded-[32px] border border-gray-100 flex flex-col items-center">
                <div className="w-12 h-12 bg-zinc-50 rounded-2xl mb-4" />
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Restore</p>
              </div>
            </div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/5 rounded-[40px] border border-white/20 backdrop-blur-[2px]">
               <div className="w-16 h-16 bg-zinc-900 rounded-[28px] flex items-center justify-center shadow-2xl mb-6 transform group-hover:scale-110 transition-transform">
                  <Crown className="w-8 h-8 text-amber-500" />
               </div>
               <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Elite Lab Access</h4>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest max-w-[180px] leading-relaxed mb-6">
                 Unlock archival restoration and simulation tools with Elite Membership.
               </p>
               <button 
                 onClick={onPaywall}
                 className="px-8 py-4 bg-zinc-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 active:scale-95 transition-all flex items-center space-x-3"
               >
                 <Sparkles className="w-4 h-4 text-amber-500" />
                 <span>Unlock Elite Access</span>
               </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setActiveTool('dressme')} className="flex flex-col items-center justify-center p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95 text-center group">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 text-[#26A69A] group-hover:scale-110 transition-transform"><Sparkles className="w-6 h-6" /></div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">{t('dress_me', lang)}</p>
            </button>
            <button onClick={() => setActiveTool('restore')} className="flex flex-col items-center justify-center p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95 text-center group">
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 text-zinc-400 group-hover:scale-110 transition-transform"><ImageIcon className="w-6 h-6" /></div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">{t('restore_image', lang)}</p>
            </button>
          </div>
        )}
      </section>

      {activeTool && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="p-8 flex items-center justify-between border-b border-gray-50 bg-white">
              <div className="flex items-center space-x-3">
                <div className="bg-zinc-900 text-white p-1.5 rounded-lg flex items-center justify-center"><Star className="w-3 h-3" /></div>
                <div><h2 className="text-xl font-bold text-gray-900 tracking-tight">{activeTool === 'dressme' ? t('dress_me', lang) : t('restore_image', lang)}</h2></div>
              </div>
              <button onClick={resetLab} className="p-2 hover:bg-gray-100 rounded-2xl transition-all"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-10">
                  <div className="relative"><div className="w-28 h-28 border-[6px] border-[#26A69A]/10 border-t-[#26A69A] rounded-full animate-spin" /><Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-[#26A69A] animate-pulse" /></div>
                  <div className="text-center space-y-3"><p className="text-sm font-black text-gray-900 uppercase tracking-widest">Applying Vogue Protocol...</p></div>
                </div>
              ) : resultImage ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-700">
                  <div className="aspect-[3/4] rounded-[40px] overflow-hidden shadow-2xl border-[10px] border-gray-50 relative"><img src={resultImage} className="w-full h-full object-cover" /></div>
                  <div className="flex flex-col space-y-3">
                    <button onClick={handleDownload} className="w-full py-5 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[24px] shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-3"><Download className="w-4 h-4" /><span>Archive Result</span></button>
                    <button onClick={() => setResultImage(null)} className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[10px]">Discard & Retake</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {activeTool === 'restore' ? (
                    <div className="space-y-8">
                      {!restoreSource ? (
                        <div onClick={() => restoreInputRef.current?.click()} className="border-2 border-dashed border-gray-100 rounded-[40px] p-16 hover:border-[#26A69A]/40 transition-all cursor-pointer text-center group"><Upload className="w-10 h-10 text-gray-200 mx-auto mb-6 transition-colors" /><p className="font-bold text-gray-900">Upload Source</p></div>
                      ) : (
                        <div className="space-y-8 animate-in fade-in">
                          <div className="relative aspect-square rounded-[32px] overflow-hidden border border-gray-100 bg-gray-50 group">
                            <img src={restoreSource} className="w-full h-full object-cover" />
                            <button onClick={() => setRestoreSource(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full"><X className="w-4 h-4" /></button>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {(['portrait', 'repair', 'upscale'] as RestorationMode[]).map(m => (
                              <button key={m} onClick={() => setRestoreMode(m)} className={`flex items-center p-5 rounded-[28px] border-2 transition-all text-left ${restoreMode === m ? 'bg-[#26A69A]/5 border-[#26A69A]' : 'bg-gray-50 border-transparent'}`}>
                                <div className={`p-3 rounded-2xl mr-4 ${restoreMode === m ? 'bg-[#26A69A] text-white' : 'bg-white text-gray-400'}`}><Layers className="w-5 h-5" /></div>
                                <div><p className="text-[11px] font-black uppercase text-gray-900 tracking-tight">{m}</p></div>
                              </button>
                            ))}
                          </div>
                          <button onClick={handleRestore} className="w-full py-5 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3"><Sparkles className="w-4 h-4" /><span>Perform Restoration</span></button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center"><User className="w-3 h-3 mr-2 inline" />Identity Mirror</p>
                        <div onClick={() => fileInputRef.current?.click()} className={`w-32 h-32 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden mx-auto ${dressMeImages.avatar ? 'border-[#26A69A]' : 'border-gray-100 hover:border-[#26A69A]/40'}`}>{dressMeImages.avatar ? <img src={dressMeImages.avatar} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-gray-200" />}</div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest"><Shirt className="w-3 h-3 mr-2 inline" />Boutique Items ({dressMeImages.clothes.length}/4)</p>
                        <div className="grid grid-cols-2 gap-4">
                          {dressMeImages.clothes.map((item, i) => (
                            <div key={i} className="aspect-square rounded-2xl overflow-hidden relative border border-gray-100 bg-gray-50">
                              <img src={item.url} className={`w-full h-full object-cover ${item.isAnalyzing ? 'opacity-30' : 'opacity-100'}`} />
                              <button onClick={() => removeClothingItem(i)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          ))}
                          {dressMeImages.clothes.length < 4 && (
                            <div className="relative">
                              <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center hover:border-[#26A69A]/40 transition-all text-gray-300"><Plus className="w-6 h-6 mb-1" /><span className="text-[8px] font-black uppercase">Add Item</span></button>
                              {showAddMenu && (
                                <div className="absolute top-full mt-2 left-0 right-0 z-[220] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in">
                                  <button onClick={() => setShowWardrobePicker(true)} className="w-full px-4 py-3 text-[9px] font-black uppercase tracking-widest text-[#26A69A] hover:bg-teal-50 flex items-center space-x-2 border-b border-gray-50"><Grid className="w-3 h-3" /><span>My Boutique</span></button>
                                  <button onClick={() => clothingInputRef.current?.click()} className="w-full px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:bg-gray-50 flex items-center space-x-2"><Upload className="w-3 h-3" /><span>From Gallery</span></button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={handleDressMeSimulation} disabled={!dressMeImages.avatar || dressMeImages.clothes.length === 0 || dressMeImages.clothes.some(c => c.isAnalyzing)} className="w-full py-5 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl disabled:opacity-20 active:scale-95 transition-all flex items-center justify-center space-x-3"><Sparkles className="w-4 h-4" /><span>Perform Simulation</span></button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {showWardrobePicker && (
            <div className="absolute inset-0 z-[230] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-500">
              <div className="p-8 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0">
                <div><h2 className="text-xl font-bold text-gray-900 tracking-tight">Select Item</h2></div>
                <button onClick={() => setShowWardrobePicker(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-all"><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  {filteredWardrobe.map(item => (
                    <button key={item.id} onClick={() => handleWardrobeItemPick(item)} className="group flex flex-col text-left space-y-3 p-3 bg-gray-50 rounded-3xl border border-transparent hover:border-[#26A69A]/30 transition-all hover:bg-white hover:shadow-lg"><div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-sm"><img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" /></div><div><p className="text-[10px] font-black text-gray-900 truncate uppercase tracking-tight">{item.name}</p></div></button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleAvatarSelect} className="hidden" accept="image/*" />
          <input type="file" ref={clothingInputRef} onChange={handleClothingSelect} className="hidden" accept="image/*" multiple />
          <input type="file" ref={restoreInputRef} onChange={onRestoreFileSelect} className="hidden" accept="image/*" />
        </div>
      )}
    </div>
  );
};

export default ExploreView;
