
import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, Sparkles, TrendingUp, Zap, ChevronRight, 
  Upload, Camera, Loader2, X, Image as ImageIcon, 
  CheckCircle2, User, Shirt, Info, Trash2, PenTool, 
  UserCheck, Layers, Star, Eraser, ExternalLink, Plus,
  Grid, Search, Download
} from 'lucide-react';
import { t } from '../services/i18n';
import { restoreFashionImage, processQuickDress, getBase64Data, RestorationMode, analyzeUpload } from '../services/geminiService';
import { compressImage } from '../services/wardrobeService';
import { UserProfile, WardrobeItem } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface BeautyCategory {
  id: string;
  name: string;
  link: string;
  image: string;
  description: string;
}

const BEAUTY_CATEGORIES: BeautyCategory[] = [
  { 
    id: 'view_all', 
    name: 'VIEW ALL', 
    link: 'https://www.vogue.com/beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?q=80&w=800&auto=format&fit=crop',
    description: 'The global perspective on modern aesthetics and timeless rituals.'
  },
  { 
    id: 'celebrity', 
    name: 'CELEBRITY BEAUTY', 
    link: 'https://www.vogue.com/beauty/celebrity-beauty',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop',
    description: 'Behind the scenes with the world\'s biggest icons and red carpet secrets.'
  },
  { 
    id: 'hair', 
    name: 'HAIR', 
    link: 'https://www.vogue.com/beauty/hair',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=800&auto=format&fit=crop',
    description: 'Sculptural silhouettes and the latest trends in editorial hair design.'
  },
  { 
    id: 'makeup', 
    name: 'MAKEUP', 
    link: 'https://www.vogue.com/beauty/makeup',
    image: 'https://images.unsplash.com/photo-1512496011931-d21ca4833552?q=80&w=800&auto=format&fit=crop',
    description: 'Pigment, precision, and the mastery of the modern editorial eye.'
  },
  { 
    id: 'nails', 
    name: 'NAILS', 
    link: 'https://www.vogue.com/beauty/nails',
    image: 'https://images.unsplash.com/photo-1604654894610-df490c74fb61?q=80&w=800&auto=format&fit=crop',
    description: 'Lacquer, light, and the resurgence of sculptural nail artistry.'
  },
  { 
    id: 'wellness', 
    name: 'WELLNESS', 
    link: 'https://www.vogue.com/beauty/wellness',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop',
    description: 'Holistic radiance and finding balance in a high-speed world.'
  },
  { 
    id: 'skin', 
    name: 'SKIN', 
    link: 'https://www.vogue.com/beauty/skin',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
    description: 'Dermal alchemy and the future of medical-grade skincare.'
  }
];

interface DressMeItem {
  url: string;
  metadata: Partial<WardrobeItem>;
  isAnalyzing: boolean;
}

interface ExploreViewProps {
  lang?: string;
  profile?: UserProfile | null;
  items?: WardrobeItem[];
}

const ExploreView: React.FC<ExploreViewProps> = ({ lang = 'en', profile, items = [] }) => {
  const [activeTool, setActiveTool] = useState<'dressme' | 'restore' | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('view_all');
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

  const handleRestore = async () => {
    if (!restoreSource) return;
    setIsProcessing(true);
    try {
      const compressed = await compressImage(restoreSource, 1280, 0.82);
      const enhanced = await restoreFashionImage(compressed.split(',')[1], restoreMode, restoreUserRequest);
      setResultImage(enhanced);
    } catch (e: any) {
      console.error(e);
      alert("Vogue restoration failed. Please check connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setDressMeImages(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file as unknown as Blob);
    }
  };

  const processClothingImage = async (base64: string, itemData?: Partial<WardrobeItem>) => {
    // Add item to list immediately as analyzing
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
        console.error("Clothing analysis failed:", err);
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
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => processClothingImage(reader.result as string);
        reader.readAsDataURL(file as unknown as Blob);
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
      console.error("Failed to fetch wardrobe item for DressMe", e);
    }
  };

  const onRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setRestoreSource(reader.result as string);
      reader.readAsDataURL(file as unknown as Blob);
    }
  };

  const removeClothingItem = (index: number) => {
    setDressMeImages(prev => ({
      ...prev,
      clothes: prev.clothes.filter((_, i) => i !== index)
    }));
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    const filename = `GlamAI-Lab-Result-${Date.now()}.png`;

    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();

      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const resultStr = reader.result as string;
          // Capacitor Filesystem needs raw base64 (prefix stripped)
          const base64Data = resultStr.split(',')[1]; 
          const savedFile = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Cache,
          });

          await Share.share({
            title: 'Save your GlamAI Result',
            text: 'Check out this Vogue result from GlamAI!',
            url: savedFile.uri,
            dialogTitle: 'Save or Share',
          });
        };
      } else {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDressMeSimulation = async () => {
    if (dressMeImages.clothes.length === 0 || !dressMeImages.avatar) return;
    
    // Check if any items are still analyzing
    if (dressMeImages.clothes.some(c => c.isAnalyzing)) {
      alert("Please wait for all items to be analyzed.");
      return;
    }

    setIsProcessing(true);
    try {
      const compressedClothes = await Promise.all(
        dressMeImages.clothes.map(c => compressImage(c.url, 800, 0.7))
      );
      const compressedAvatar = await compressImage(dressMeImages.avatar, 600, 0.6);
      
      const cleanClothes = compressedClothes.map(c => c.split(',')[1]);
      const cleanAvatar = compressedAvatar.split(',')[1];
      
      // Build descriptions for simulation quality - including full metadata
      const descriptions = dressMeImages.clothes
        .map(c => {
          const m = c.metadata;
          return `- ${m.name || 'Ensemble piece'} (${m.category || 'Apparel'}): ${m.description || 'A stylish boutique garment'} in ${m.primaryColor || 'original color'}. Texture: ${m.materialLook || 'Fine fabric'}. Pattern: ${m.pattern || 'Solid'}.`;
        })
        .join('\n');

      const outfit = await processQuickDress(cleanClothes, cleanAvatar, descriptions, userRequest);
      setResultImage(outfit);
    } catch (e: any) {
      console.error(e);
      alert("DressMe simulation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredWardrobe = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-12 py-6 px-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. The Lab / Tools Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-[#26A69A]" />
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t('the_lab', lang)}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setActiveTool('dressme')}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95 text-center group"
          >
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 text-[#26A69A] group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">{t('dress_me', lang)}</p>
            <p className="text-[8px] text-gray-400 mt-1 uppercase tracking-tighter">Couture Replacement</p>
          </button>
          <button 
            onClick={() => setActiveTool('restore')}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95 text-center group"
          >
            <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 text-zinc-400 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">{t('restore_image', lang)}</p>
            <p className="text-[8px] text-gray-400 mt-1 uppercase tracking-tighter">Vogue Vintage</p>
          </button>
        </div>
      </section>

      {/* 2. Global Style Feed (Hero) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{t('discovery', lang)}</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[2px] mt-1">Global Style Feed</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-2xl">
            <Compass className="w-5 h-5 text-[#26A69A]" />
          </div>
        </div>
        
        <a 
          href="https://www.vogue.com/fashion" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative group overflow-hidden rounded-[40px] bg-zinc-900 aspect-[16/9] shadow-2xl block transition-transform active:scale-[0.98]"
        >
          <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop" alt="Featured Trend" className="w-full h-full object-cover opacity-70 transition-transform duration-1000 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-3 py-1 bg-[#26A69A] text-white text-[9px] font-black uppercase tracking-widest rounded-full">Editorial</span>
            </div>
            <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">Vogue Archives <br/>Structured Silk</h3>
            <div className="flex items-center space-x-2 mt-4 text-white/50 text-[8px] font-black uppercase tracking-widest">
              <span>Enter Archives</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </a>
      </section>

      {/* Lab Modal Flow */}
      {activeTool && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="p-8 flex items-center justify-between border-b border-gray-50 bg-white">
              <div className="flex items-center space-x-3">
                <div className="bg-zinc-900 text-white p-1.5 rounded-lg flex items-center justify-center">
                  <Star className="w-3 h-3" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    {activeTool === 'dressme' ? t('dress_me', lang) : t('restore_image', lang)}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    {activeTool === 'dressme' ? 'Couture Replacement Simulation' : 'Vogue Vintage + iPhone HDR'}
                  </p>
                </div>
              </div>
              <button onClick={resetLab} className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-10">
                  <div className="relative">
                    <div className="w-28 h-28 border-[6px] border-[#26A69A]/10 border-t-[#26A69A] rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-[#26A69A] animate-pulse" />
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest">
                      {activeTool === 'restore' ? 'Executing Vogue Protocol...' : 'Simulating Couture...'}
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-[9px] text-[#26A69A] font-black uppercase tracking-[2px]">
                      <div className="w-1 h-1 bg-[#26A69A] rounded-full animate-ping" />
                      <span>{activeTool === 'restore' ? 'Beautifying Photography' : 'Replacing Avatar wear'}</span>
                    </div>
                  </div>
                </div>
              ) : resultImage ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-700">
                  <div className="aspect-[3/4] rounded-[40px] overflow-hidden shadow-2xl border-[10px] border-gray-50 bg-zinc-100 relative group">
                    <img src={resultImage} alt="Lab Result" className="w-full h-full object-cover animate-in fade-in duration-1000" />
                    <div className="absolute top-6 left-6">
                       <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-full border border-white/20">Vogue Enhanced</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-3">
                    <button onClick={handleDownload} className="w-full py-5 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[24px] shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-3">
                      <Download className="w-4 h-4" />
                      <span>Archive High-Res</span>
                    </button>
                    <button onClick={() => setResultImage(null)} className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-[#26A69A] transition-colors">Discard & Retake</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {activeTool === 'restore' ? (
                    <div className="space-y-8">
                      {!restoreSource ? (
                        <div onClick={() => restoreInputRef.current?.click()} className="border-2 border-dashed border-gray-100 rounded-[40px] p-16 hover:border-[#26A69A]/40 hover:bg-teal-50/20 transition-all cursor-pointer text-center group">
                          <Upload className="w-10 h-10 text-gray-200 mx-auto mb-6 group-hover:text-[#26A69A] transition-colors" />
                          <p className="font-bold text-gray-900">Editorial Source</p>
                        </div>
                      ) : (
                        <div className="space-y-8 animate-in fade-in">
                          <div className="relative aspect-square rounded-[32px] overflow-hidden border border-gray-100 bg-gray-50 group">
                            <img src={restoreSource} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20" />
                            <button onClick={() => setRestoreSource(null)} className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Restoration Engine</p>
                            <div className="grid grid-cols-1 gap-3">
                              <button onClick={() => setRestoreMode('portrait')} className={`flex items-center p-5 rounded-[28px] border-2 transition-all text-left ${restoreMode === 'portrait' ? 'bg-[#26A69A]/5 border-[#26A69A] shadow-md' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                                <div className={`p-3 rounded-2xl mr-4 ${restoreMode === 'portrait' ? 'bg-[#26A69A] text-white' : 'bg-white text-gray-400'}`}><UserCheck className="w-5 h-5" /></div>
                                <div><p className="text-[11px] font-black uppercase text-gray-900 tracking-tight">Portrait Pro</p><p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Beautify & Removal</p></div>
                              </button>
                              <button onClick={() => setRestoreMode('repair')} className={`flex items-center p-5 rounded-[28px] border-2 transition-all text-left ${restoreMode === 'repair' ? 'bg-[#26A69A]/5 border-[#26A69A] shadow-md' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                                <div className={`p-3 rounded-2xl mr-4 ${restoreMode === 'repair' ? 'bg-[#26A69A] text-white' : 'bg-white text-gray-400'}`}><Eraser className="w-5 h-5" /></div>
                                <div><p className="text-[11px] font-black uppercase text-gray-900 tracking-tight">Vogue Vintage</p><p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Archive Grain</p></div>
                              </button>
                              <button onClick={() => setRestoreMode('upscale')} className={`flex items-center p-5 rounded-[28px] border-2 transition-all text-left ${restoreMode === 'upscale' ? 'bg-[#26A69A]/5 border-[#26A69A] shadow-md' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                                <div className={`p-3 rounded-2xl mr-4 ${restoreMode === 'upscale' ? 'bg-[#26A69A] text-white' : 'bg-white text-gray-400'}`}><Layers className="w-5 h-5" /></div>
                                <div><p className="text-[11px] font-black uppercase text-gray-900 tracking-tight">50MP Upscale</p><p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">HD Texture Rebuild</p></div>
                              </button>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><PenTool className="w-3 h-3 mr-2" />Editorial Design Brief (Optional)</p>
                            <textarea value={restoreUserRequest} onChange={(e) => setRestoreUserRequest(e.target.value)} placeholder="e.g. 'Matte skin finish', 'Beige studio back'..." className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#26A69A]/10 transition-all resize-none h-20 placeholder:text-gray-300" />
                          </div>
                          <button onClick={handleRestore} className="w-full py-5 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3">
                            <Sparkles className="w-4 h-4" />
                            <span>Apply Vogue Protocol</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* DressMe Flow */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center text-center justify-center"><User className="w-3 h-3 mr-2" />Identity Locked Avatar</p>
                        <div onClick={() => fileInputRef.current?.click()} className={`w-32 h-32 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden mx-auto ${dressMeImages.avatar ? 'border-[#26A69A]' : 'border-gray-100 hover:border-[#26A69A]/40'}`}>
                          {dressMeImages.avatar ? <img src={dressMeImages.avatar} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-gray-200" />}
                        </div>
                        <p className="text-[8px] text-gray-400 font-black uppercase text-center">Tap to change avatar face</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><Shirt className="w-3 h-3 mr-2" />Ensemble Boutique ({dressMeImages.clothes.length}/4)</p>
                           <span className="text-[8px] font-black text-[#26A69A] uppercase tracking-widest">Replacement Source</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {dressMeImages.clothes.map((item, i) => (
                            <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group border border-gray-100 bg-gray-50">
                              <img src={item.url} className={`w-full h-full object-cover ${item.isAnalyzing ? 'opacity-30' : 'opacity-100'}`} />
                              {item.isAnalyzing && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-[#26A69A]" />
                                </div>
                              )}
                              {!item.isAnalyzing && (
                                <div className="absolute bottom-2 left-2 right-2">
                                  <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[7px] font-black uppercase tracking-widest rounded-lg truncate block">
                                    {item.metadata.name || 'Analyzed Piece'}
                                  </span>
                                </div>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); removeClothingItem(i); }} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          ))}
                          {dressMeImages.clothes.length < 4 && (
                            <div className="relative">
                              <button 
                                disabled={isCleaningClothing}
                                onClick={() => setShowAddMenu(!showAddMenu)} 
                                className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center hover:border-[#26A69A]/40 transition-all text-gray-300 disabled:opacity-50"
                              >
                                {isCleaningClothing ? (
                                  <Loader2 className="w-6 h-6 animate-spin text-[#26A69A]" />
                                ) : (
                                  <>
                                    <Plus className="w-6 h-6 mb-1" />
                                    <span className="text-[8px] font-black uppercase tracking-tighter">Add Item</span>
                                  </>
                                )}
                              </button>
                              
                              {showAddMenu && !isCleaningClothing && (
                                <div className="absolute top-full mt-2 left-0 right-0 z-[220] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                  <button onClick={() => setShowWardrobePicker(true)} className="w-full px-4 py-3 text-[9px] font-black uppercase tracking-widest text-[#26A69A] hover:bg-teal-50 flex items-center space-x-2 border-b border-gray-50">
                                    <Grid className="w-3 h-3" />
                                    <span>My Boutique</span>
                                  </button>
                                  <button onClick={() => clothingInputRef.current?.click()} className="w-full px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:bg-gray-50 flex items-center space-x-2">
                                    <Upload className="w-3 h-3" />
                                    <span>From Gallery</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><PenTool className="w-3 h-3 mr-2" />Styling Requests</p>
                        <textarea value={userRequest} onChange={(e) => setUserRequest(e.target.value)} placeholder="e.g. 'Paris street style', 'Golden hour glow'..." className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#26A69A]/10 transition-all resize-none h-20 placeholder:text-gray-300" />
                      </div>
                      <button onClick={handleDressMeSimulation} disabled={!dressMeImages.avatar || dressMeImages.clothes.length === 0 || isCleaningClothing || dressMeImages.clothes.some(c => c.isAnalyzing)} className="w-full py-5 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl disabled:opacity-20 active:scale-95 transition-all flex items-center justify-center space-x-3">
                        <Sparkles className="w-4 h-4" />
                        <span>Perform Vogue Simulation</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Wardrobe Picker Overlay */}
          {showWardrobePicker && (
            <div className="absolute inset-0 z-[230] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-500">
              <div className="p-8 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Select Item</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Boutique Archive</p>
                </div>
                <button onClick={() => setShowWardrobePicker(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="px-8 py-4 bg-gray-50 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input 
                    type="text" 
                    placeholder="Search boutique..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-[#26A69A]/10"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <Shirt className="w-12 h-12 text-gray-200" />
                    <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Boutique Archive Empty</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredWardrobe.map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => handleWardrobeItemPick(item)}
                        className="group flex flex-col text-left space-y-3 p-3 bg-gray-50 rounded-3xl border border-transparent hover:border-[#26A69A]/30 transition-all hover:bg-white hover:shadow-lg"
                      >
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-sm">
                          <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-900 truncate uppercase tracking-tight">{item.name}</p>
                          <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{item.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
