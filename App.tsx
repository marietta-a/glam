import React, { useState, useEffect, useRef, useMemo } from 'react';
import pLimit from 'p-limit';
import { WardrobeItem, Category, ViewType, OutfitCache, CachedOutfit, UserProfile, Occasion, UploadTask, Outfit, ORDERED_OCCASIONS, OutfitSuggestion } from './types';
import { supabase } from './lib/supabase';
import { store } from './services/storeService';
import { 
  fetchWardrobeItemsBatch, 
  getWardrobeCount, 
  fetchUserProfile, 
  createUserProfile, 
  uploadWardrobeImage, 
  saveWardrobeItem, 
  updateUserProfile, 
  fetchOutfitCache, 
  saveOutfitToCache, 
  logoutUser,
  compressImage,
  useGenerationCredit,
  trackOutfitGeneration,
  checkAndResetDailyLimits,
  addCredits,
  fetchOutfitSuggestions,
  saveOutfitSuggestions,
  fetchAllOutfitSuggestions,
  deleteOutfitSuggestion,
  deleteOutfitFromCache
} from './services/wardrobeService';
import { 
  suggestOutfits, 
  visualizeOutfit, 
  analyzeUpload, 
  generateItemImage, 
  getBase64Data,
  isItemSuitableForOccasion
} from './services/geminiService';
import { CloudSync, RefreshCw } from 'lucide-react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import ItemCard from './components/ItemCard';
import AddItemModal from './components/AddItemModal';
import OutfitsView from './components/OutfitsView';
import ExploreView from './components/ExploreView';
import BottomNav from './components/BottomNav';
import ProfileModal from './components/ProfileModal';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import UserManualModal from './components/UserManualModal';
import ItemDetailsModal from './components/ItemDetailsModal';
import EmptyWardrobe from './components/EmptyWardrobe';
import EmptyCategory from './components/EmptyCategory';
import Auth from './components/Auth';
import BrandLogo from './components/BrandLogo';
import SyncingWardrobe from './components/SyncingWardrobe';
import Paywall from './components/Paywall';
import AdBanner from './components/AdBanner';
import UpdatePrompt from './components/UpdatePrompt';
import { t } from './services/i18n';

// Restrict to sequential processing for archival integrity during credit updates
const limit = pLimit(1);

const BoutiqueLoader: React.FC<{ progress: { loaded: number, total: number, phase: number } }> = ({ progress }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const BOUTIQUE_LOADER_IMAGES = [
    { url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop", caption: "The Archive" },
    { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop", caption: "Vision" },
    { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop", caption: "Identity" }
  ];

  useEffect(() => {
    // Preload images to prevent black screen on mobile load
    BOUTIQUE_LOADER_IMAGES.forEach(item => {
      const img = new Image();
      img.src = item.url;
    });

    const imgInterval = setInterval(() => setImgIndex(i => (i + 1) % BOUTIQUE_LOADER_IMAGES.length), 5000);
    return () => clearInterval(imgInterval);
  }, []);

  let progressPercent = 0;
  let statusText = "Initializing Boutique...";
  
  if (progress.phase === 1) { 
    progressPercent = 15; 
    statusText = "Syncing Elite Profile..."; 
  }
  else if (progress.phase === 2) { 
    const fetchProgress = progress.total > 0 ? (progress.loaded / progress.total) * 45 : 0;
    progressPercent = Math.round(20 + fetchProgress);
    statusText = `Archival Restoration (${progress.loaded}/${progress.total})`;
  } 
  else if (progress.phase === 3) {
    progressPercent = 85;
    statusText = "Syncing Stylist Metadata...";
  }
  else if (progress.phase === 4) { 
    progressPercent = 100; 
    statusText = "Welcome to your Boutique"; 
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-zinc-900 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-zinc-900">
        {BOUTIQUE_LOADER_IMAGES.map((item, idx) => (
          <div 
            key={item.url} 
            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${idx === imgIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <img 
              src={item.url} 
              className="w-full h-full object-cover scale-105" 
              alt="Slideshow" 
              loading="eager"
            />
            {/* Consistent Overlay matching Auth screen */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          </div>
        ))}
      </div>
      <div className="relative z-30 flex flex-col items-center px-12 text-center mt-auto pb-24 w-full">
        <BrandLogo size="lg" className="mb-10 animate-in fade-in zoom-in duration-1000" />
        <h2 className="text-6xl font-black text-white tracking-[16px] uppercase leading-none mb-12">Glam<span className="text-[#26A69A]">AI</span></h2>
        <div className="w-full max-w-[280px] space-y-4">
           <div className="flex items-center justify-between mb-1">
             <span className="text-[9px] font-black text-white/30 uppercase tracking-[2px]">{statusText}</span>
             <span className="text-[12px] font-black text-[#26A69A] tracking-widest">{progressPercent}%</span>
           </div>
           <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#26A69A] transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
           </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(store.profile);
  const [lastKnownAvatar, setLastKnownAvatar] = useState<string | null>(localStorage.getItem('glam_last_avatar'));
  const [items, setItems] = useState<WardrobeItem[]>(store.items);
  const [activeTab, setActiveTab] = useState<Category>('All Items');
  const [activeView, setActiveView] = useState<ViewType>('wardrobe');
  const [loading, setLoading] = useState(!store.isHydrated);
  const [initProgress, setInitProgress] = useState({ loaded: store.items.length, total: store.items.length, phase: store.isHydrated ? 4 : 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [outfitCache, setOutfitCache] = useState<OutfitCache>(store.outfitCache);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<'analyzing' | 'designing' | 'visualizing' | 'complete'>('complete');
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [isAnalyzingFace, setIsAnalyzingFace] = useState(false);
  const [showSuitabilityModal, setShowSuitabilityModal] = useState(false);
  const [modalType, setModalType] = useState<'mismatch' | 'exhausted'>('mismatch');
  const [pendingOccasion, setPendingOccasion] = useState<Occasion | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [showUploadTooltip, setShowUploadTooltip] = useState(false);
  const [suggestedOutfits, setSuggestedOutfits] = useState<OutfitSuggestion[]>([]);
  const [generationMetadata, setGenerationMetadata] = useState<Record<string, { countAtGeneration: number }>>(() => {
    const saved = localStorage.getItem('glam_gen_metadata');
    return saved ? JSON.parse(saved) : {};
  });

  const mainScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    localStorage.setItem('glam_gen_metadata', JSON.stringify(generationMetadata));
  }, [generationMetadata]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) { setLoading(false); store.clear(); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) { setProfile(null); setItems([]); setOutfitCache({}); setLoading(false); store.clear(); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !store.isHydrated) {
      setLoading(true);
      const initLoad = async () => {
        setInitProgress({ loaded: 0, total: 0, phase: 1 });
        try {
          let up = await fetchUserProfile(user.id);
          if (!up) { 
            await createUserProfile({ id: user.id, username: user.email?.split('@')[0] || 'Member', email: user.email!, language: 'en' }); 
            up = await fetchUserProfile(user.id); 
          }

          // Check for daily reset immediately upon load
          if (up) {
            up = await checkAndResetDailyLimits(up);
          }

          setProfile(up); 
          if (up?.avatar_url) setLastKnownAvatar(up.avatar_url); 
          store.updateProfile(up);

          const totalCount = await getWardrobeCount(user.id);
          setInitProgress({ loaded: 0, total: totalCount, phase: 2 });
          
          let allItems: WardrobeItem[] = [];
          for (let offset = 0; offset < totalCount; offset += 50) {
            const batch = await fetchWardrobeItemsBatch(user.id, 50, offset);
            allItems = [...allItems, ...batch];
            setInitProgress({ loaded: allItems.length, total: totalCount, phase: 2 });
          }
          setItems(allItems); 
          store.updateItems(allItems);

          // Phase 3: Synchronizing Metadata
          setInitProgress(prev => ({ ...prev, phase: 3 }));
          const cache = await fetchOutfitCache(user.id, allItems);
          setOutfitCache(cache); 
          store.updateCache(cache);

          const suggestions = await fetchAllOutfitSuggestions(user.id, allItems);
          store.updateSuggestions(suggestions);

          // Synchronize generation metadata for occasions that already have suggestions
          setGenerationMetadata(prev => {
            const newMeta = { ...prev };
            Object.keys(suggestions).forEach(occ => {
              if (!newMeta[occ]) {
                const count = allItems.filter(i => isItemSuitableForOccasion(i, occ as Occasion)).length;
                newMeta[occ] = { countAtGeneration: count };
              }
            });
            return newMeta;
          });

          const firstOcc = ORDERED_OCCASIONS.find(occ => allItems.some(item => isItemSuitableForOccasion(item, occ)));
          if (firstOcc) {
            setSelectedOccasion(firstOcc);
            const initialSugg = suggestions[firstOcc] || [];
            setSuggestedOutfits(initialSugg);
          }

          store.setHydrated(true); 
          setInitProgress({ loaded: totalCount, total: totalCount, phase: 4 });
          setTimeout(() => setLoading(false), 1200);
        } catch (e) { 
          console.error("Initialization Error:", e);
          setLoading(false); 
        }
      };
      initLoad();
    }
  }, [user]);

  useEffect(() => {
    if (selectedOccasion && user && store.isHydrated) {
      const cached = store.suggestionCache[selectedOccasion];
      if (cached && cached.length > 0) {
        setSuggestedOutfits(cached);
      } else {
        fetchOutfitSuggestions(user.id, selectedOccasion, items).then((suggestions) => {
          setSuggestedOutfits(suggestions);
          store.updateSuggestions({ ...store.suggestionCache, [selectedOccasion]: suggestions });
        });
      }
    }
  }, [selectedOccasion, user, items.length, store.isHydrated]);

  const newItemsCount = useMemo(() => {
    if (!selectedOccasion || suggestedOutfits.length === 0) return 0;
    const currentCount = items.filter(i => isItemSuitableForOccasion(i, selectedOccasion)).length;
    const meta = generationMetadata[selectedOccasion];
    if (!meta) return currentCount; 
    return Math.max(0, currentCount - meta.countAtGeneration);
  }, [selectedOccasion, suggestedOutfits, items, generationMetadata]);

  // Unified function to handle image generation / processing credits
  const handleUseCredit = async () => {
    if (!profile) return;
    try {
      const updatedProfile = await useGenerationCredit(profile);
      setProfile(updatedProfile);
      store.updateProfile(updatedProfile);
      return updatedProfile;
    } catch (err: any) {
      if (err.message === 'OUT_OF_CREDITS') { setIsPaywallOpen(true); throw err; }
      throw err;
    }
  };

  const handleGenerateOptions = async (occasion: Occasion, isUniversalMode = false) => {
    if (!profile?.avatar_url) { setActiveView('outfits'); return; }
    
    // Check Daily Limit for Outfits (10/day) - Only if not premium AND no credits
    if (!profile.is_premium && (profile.credits || 0) === 0 && (profile.daily_outfit_count || 0) >= 10) {
      setIsPaywallOpen(true);
      return;
    }

    const strictlyMatched = items.filter(i => isItemSuitableForOccasion(i, occasion));
    if (!isUniversalMode && strictlyMatched.length < 1) {
      setPendingOccasion(occasion);
      setModalType('mismatch');
      setShowSuitabilityModal(true);
      return;
    }

    setIsGenerating(true); setGenerationPhase('analyzing'); setShowSuitabilityModal(false);
    try {
      setGenerationPhase('designing');
      
      const itemsToUse = isUniversalMode ? items : strictlyMatched;
      const existingIds = suggestedOutfits.map(s => s.items.map(i => i.id).sort().join(','));
      
      const { outfits, noMoreCombinations } = await suggestOutfits(itemsToUse, occasion, profile, existingIds, isUniversalMode);
      
      if (noMoreCombinations && !isUniversalMode && outfits.length === 0) {
        setPendingOccasion(occasion); setModalType('exhausted'); setShowSuitabilityModal(true);
        setIsGenerating(false); return;
      }

      // Track daily usage for outfit suggestions
      if (!profile.is_premium) {
        const updated = await trackOutfitGeneration(profile);
        setProfile(updated);
        store.updateProfile(updated);
      }

      // We pass 'items' so saveOutfitSuggestions can return the full, hydrated list including visualized items
      const freshSuggestions = await saveOutfitSuggestions(user.id, occasion, outfits, items);
      
      const countAtGeneration = items.filter(i => isItemSuitableForOccasion(i, occasion)).length;
      setGenerationMetadata(prev => ({ ...prev, [occasion]: { countAtGeneration } }));
      
      setSelectedOccasion(occasion); 
      // Replace state with the fresh list from DB (Visualized + New)
      setSuggestedOutfits(freshSuggestions);
      store.updateSuggestions({ ...store.suggestionCache, [occasion]: freshSuggestions });
    } catch (e: any) { 
      if (e.message === 'DAILY_LIMIT_REACHED_OUTFIT') {
        setIsPaywallOpen(true);
      } else {
        console.error(e); 
      }
    } finally { setIsGenerating(false); setGenerationPhase('complete'); }
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    if (!user || !selectedOccasion) return;
    try {
      await deleteOutfitSuggestion(user.id, suggestionId);
      await deleteOutfitFromCache(user.id, suggestionId);
      
      const updated = suggestedOutfits.filter(s => s.id !== suggestionId);
      setSuggestedOutfits(updated);
      store.updateSuggestions({ ...store.suggestionCache, [selectedOccasion]: updated });
      
      setOutfitCache(prev => {
        const next = { ...prev };
        delete next[suggestionId];
        store.updateCache(next);
        return next;
      });
    } catch (e) { console.error("Deletion failed:", e); }
  };

  const handleSelectOutfit = async (outfit: OutfitSuggestion, force = false) => {
    if (!profile || !selectedOccasion) return;
    if (!force && outfitCache[outfit.id]?.visualizedImage) return;

    // Check Daily Limit for Image (1/day for Free) inside useGenerationCredit
    
    setIsVisualizing(true); setGenerationPhase('visualizing');
    try {
      await handleUseCredit(); // Validates daily image limit or credits
      
      const visualizedRaw = await visualizeOutfit(outfit, profile);
      const visualized = await compressImage(visualizedRaw, 1024, 0.75);
      
      const newCacheItem: CachedOutfit = { id: outfit.id, outfit, visualizedImage: visualized, generatedAt: Date.now(), combinationHistory: [] };
      setOutfitCache(prev => ({ ...prev, [outfit.id]: newCacheItem }));
      store.updateCache({ ...outfitCache, [outfit.id]: newCacheItem });
      await saveOutfitToCache(user.id, selectedOccasion, newCacheItem);
    } catch (e) { console.error(e); } finally { setIsVisualizing(false); setGenerationPhase('complete'); }
  };

  const handleSubscribe = async (pack: 'starter' | 'growth' | 'pro' | 'premium_monthly' | 'premium_yearly') => {
    let amount = 0; let isSub = false;
    if (pack === 'starter') amount = 59; else if (pack === 'growth') amount = 200; else if (pack === 'pro') amount = 500;
    else if (pack === 'premium_monthly' || pack === 'premium_yearly') isSub = true;
    setIsPaywallOpen(false); setLoading(true);
    try {
      if (profile) {
        let updated = profile;
        if (isSub) { updated = { ...profile, is_premium: true, credits: (profile.credits || 0) + (pack === 'premium_yearly' ? 5000 : 1000) }; await updateUserProfile(updated); }
        else { updated = await addCredits(profile, amount); }
        setProfile(updated); store.updateProfile(updated);
        alert(isSub ? `Elite Membership Activated!` : `Success! ${amount} credits added.`);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleStartUpload = async (inputs: string[]) => {
    if (!user || !profile) return;
    setShowUploadTooltip(true); setTimeout(() => setShowUploadTooltip(false), 4000);
    setActiveView('wardrobe'); setActiveTab('All Items');
    requestAnimationFrame(() => mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }));
    
    for (const input of inputs) {
      await limit(async () => {
        const taskId = Math.random().toString(36).substr(2, 9);
        setUploadTasks(prev => [...prev, { id: taskId, status: 'analyzing', progress: 5, previewUrl: input }]);
        const updateTask = (updates: Partial<UploadTask>) => setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
        
        try {
          updateTask({ progress: 10 }); 
          const base64 = await getBase64Data(input); 

          try {
            await handleUseCredit(); // Check image credit logic for extraction
          } catch (creditErr: any) {
            if (creditErr.message === 'OUT_OF_CREDITS') {
              updateTask({ status: 'error', errorMessage: 'Boutique credits exhausted. Refill for further archival extraction.', progress: 100 });
              return;
            }
            throw creditErr;
          }

          updateTask({ status: 'analyzing', progress: 20 });
          const results = await analyzeUpload(base64, profile?.language || 'en');
          if (!results || results.length === 0) throw new Error("No items detected.");
          
          updateTask({ totalItemsInBatch: results.length, processedItemsInBatch: 0, progress: 30 });
          
          for (let index = 0; index < results.length; index++) {
            const itemData = results[index];
            try {
              const startProgress = 30 + (index / results.length) * 60; 
              updateTask({ status: 'illustrating', progress: startProgress });
              
              const isolated = await generateItemImage(itemData, base64);
              const url = await uploadWardrobeImage(user.id, `item_${Math.random().toString(36).substr(2, 9)}`, isolated);
              const saved = await saveWardrobeItem({ ...itemData, userId: user.id, imageUrl: url, isFavorite: false });
              
              setItems(prev => { 
                const combined = [saved, ...prev]; 
                store.updateItems(combined); 
                return combined; 
              });
              updateTask({ processedItemsInBatch: (index + 1) });
            } catch (e) { 
              console.error("Garment extraction failed:", e); 
            }
          }
          setUploadTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (err: any) { 
          updateTask({ status: 'error', errorMessage: err.message, progress: 100 }); 
          setTimeout(() => setUploadTasks(prev => prev.filter(t => t.id !== taskId)), 8000); 
        }
      });
    }
  };

  if (!user) return <Auth profileImage={lastKnownAvatar} onProfileImageUpdate={setLastKnownAvatar} />;
  if (loading) return <BoutiqueLoader progress={initProgress} />;

  const lang = profile?.language || 'en';
  const filteredItems = items.filter(i => activeTab === 'All Items' || i.category === activeTab);
  const isPremium = profile?.is_premium || false;

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col max-md mx-auto shadow-2xl relative overflow-x-hidden pb-32">
      <Header 
        title={t('digital_boutique', lang)} 
        onProfileClick={() => setIsProfileOpen(true)} onMenuClick={() => setIsSidebarOpen(true)} 
        profileImage={profile?.avatar_url || null} currentLang={lang} 
        credits={profile?.credits} isPremium={profile?.is_premium}
        onLanguageChange={(l) => { const updated = { ...profile!, language: l }; setProfile(updated); store.updateProfile(updated); updateUserProfile({ id: profile!.id, language: l }); }} 
      />
      <UpdatePrompt lang={lang} />
      <main ref={mainScrollRef} className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        {activeView === 'wardrobe' && (
          <>
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} lang={lang} />
            <div className="p-6">
              {uploadTasks.length > 0 && <SyncingWardrobe tasks={uploadTasks} lang={lang} />}
              {items.length === 0 && uploadTasks.length === 0 ? (
                <EmptyWardrobe onAdd={() => setIsAddItemOpen(true)} lang={lang} />
              ) : (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {filteredItems.map(item => <ItemCard key={item.id} item={item} onClick={setSelectedItem} />)}
                  {filteredItems.length === 0 && uploadTasks.length === 0 && <EmptyCategory category={activeTab} onAdd={() => setIsAddItemOpen(true)} lang={lang} />}
                </div>
              )}
            </div>
            {/* Show Ads in Wardrobe View if not premium and no credits */}
            {!isPremium && (profile?.credits || 0) === 0 && (
              <div className="px-6 pb-2">
                <AdBanner lang={lang} />
              </div>
            )}
          </>
        )}
        {activeView === 'outfits' && (
          <>
            <OutfitsView 
              items={items} profile={profile} onAddClick={() => setIsAddItemOpen(true)} cache={outfitCache} 
              selectedOccasion={selectedOccasion} onOccasionChange={setSelectedOccasion} 
              isGenerating={isGenerating} isVisualizing={isVisualizing} generationPhase={generationPhase} 
              onGenerate={handleGenerateOptions} onSelectOutfit={handleSelectOutfit} suggestedOutfits={suggestedOutfits}
              onDeleteSuggestion={handleDeleteSuggestion}
              onItemClick={setSelectedItem} lang={lang} isSettingFace={isAnalyzingFace} 
              newItemsCount={newItemsCount}
              onUpdateCache={() => {}}
              onPaywall={() => setIsPaywallOpen(true)}
              onFaceUpload={async (b) => { 
                setIsAnalyzingFace(true); 
                try { 
                  const compressed = await compressImage(b, 800, 0.7);
                  const url = await uploadWardrobeImage(user.id, 'avatar', compressed); 
                  const updated = { ...profile!, avatar_url: url }; 
                  setProfile(updated); 
                  store.updateProfile(updated); 
                  await updateUserProfile({ id: profile!.id, avatar_url: url }); 
                } catch (e: any) {
                  console.error("Avatar upload failed:", e);
                } finally { 
                  setIsAnalyzingFace(false); 
                } 
              }} 
            />
            {/* Show Ads in Outfits View if not premium and no credits */}
            {!isPremium && (profile?.credits || 0) === 0 && !isGenerating && !isVisualizing && (
              <div className="px-6">
                <AdBanner lang={lang} />
              </div>
            )}
          </>
        )}
        {activeView === 'explore' && <ExploreView lang={lang} profile={profile} items={items} onUseCredit={handleUseCredit} onPaywall={() => setIsPaywallOpen(true)} />}
      </main>
      
      {showUploadTooltip && (
        <div className="fixed bottom-[110px] left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-zinc-900 text-white px-6 py-3 rounded-[24px] shadow-2xl flex items-center justify-center space-x-3 border border-white/10">
            <CloudSync className="w-5 h-5 text-[#26A69A] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[2px]">Syncing to Boutique...</span>
          </div>
        </div>
      )}

      <BottomNav activeView={activeView} onViewChange={setActiveView} onAddClick={() => setIsAddItemOpen(true)} lang={lang} />
      
      {isSidebarOpen && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onSettingsClick={() => setIsSettingsOpen(true)} onManualClick={() => setIsManualOpen(true)} onLogout={() => logoutUser()} email={user.email || ''} username={profile?.username} isPremium={profile?.is_premium} lang={lang} credits={profile?.credits} onUpgrade={() => setIsPaywallOpen(true)} />}
      {isProfileOpen && profile && <ProfileModal isOpen={isProfileOpen} userId={user.id} onClose={() => setIsProfileOpen(false)} profile={profile} onUpdate={(p) => { setProfile(p); store.updateProfile(p); }} lang={lang} />}
      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} userId={user.id} email={user.email || ''} onClose={() => setIsSettingsOpen(false)} profile={profile} onUpdate={(p) => { setProfile(p); store.updateProfile(p); }} onUpgrade={() => setIsPaywallOpen(true)} />}
      {isManualOpen && <UserManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} lang={lang} />}
      <AddItemModal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} onStartUpload={handleStartUpload} lang={lang} />
      {selectedItem && <ItemDetailsModal item={selectedItem} userId={user.id} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} onSave={(u) => { setItems(prev => prev.map(i => i.id === u.id ? u : i)); setSelectedItem(u); }} onDelete={(id) => { setItems(prev => prev.filter(i => i.id !== id)); }} lang={lang} />}
      {isPaywallOpen && <Paywall isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} onSubscribe={handleSubscribe} lang={lang} totalGenerations={profile?.total_generations} />}

      {showSuitabilityModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-sm rounded-[64px] p-12 text-center shadow-2xl">
             <div className="w-24 h-24 bg-[#26A69A]/10 rounded-full flex items-center justify-center mb-10 mx-auto">
               <RefreshCw className="w-10 h-10 text-[#26A69A]" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">{modalType === 'mismatch' ? "Boutique Mismatch" : "Archive Exhausted"}</h3>
             <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-12">
               Our engine found no direct matches. Would you prefer a creative edit curated from your entire collection?
             </p>
             <div className="w-full space-y-4">
                <button onClick={() => handleGenerateOptions(pendingOccasion!, true)} className="w-full py-6 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl">Generate Creative Edit</button>
                <button onClick={() => setShowSuitabilityModal(false)} className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[10px]">Cancel</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;