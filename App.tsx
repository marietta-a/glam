
import React, { useState, useEffect, useCallback, useRef } from 'react';
import pLimit from 'p-limit';
import { WardrobeItem, Category, ViewType, OutfitCache, CachedOutfit, UserProfile, Occasion, UploadTask, Outfit, ORDERED_OCCASIONS } from './types';
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
  deleteOutfitFromCache,
  logoutUser,
  compressImage,
  useGenerationCredit,
  addCredits
} from './services/wardrobeService';
import { 
  suggestOutfit, 
  visualizeOutfit, 
  analyzeUpload, 
  generateItemImage, 
  getBase64Data,
  isItemSuitableForOccasion
} from './services/geminiService';
import { AlertTriangle, Sparkles, X, Wand2, RefreshCw } from 'lucide-react';
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
import { t } from './services/i18n';

const limit = pLimit(2);

const BoutiqueLoader: React.FC<{ progress: { loaded: number, total: number, phase: number } }> = ({ progress }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const BOUTIQUE_LOADER_IMAGES = [
    { url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop", caption: "The Archive: Digital Couture Library" },
    { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop", caption: "Vision: High-Fidelity AI Styling" },
    { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop", caption: "Identity: Your Persona, Digitally Rendered" }
  ];

  useEffect(() => {
    const imgInterval = setInterval(() => setImgIndex(i => (i + 1) % BOUTIQUE_LOADER_IMAGES.length), 5000);
    return () => clearInterval(imgInterval);
  }, [BOUTIQUE_LOADER_IMAGES.length]);

  let progressPercent = 0;
  let statusText = "Initializing Boutique...";
  if (progress.phase === 1) { progressPercent = 20; statusText = "Syncing Profile..."; }
  else if (progress.phase === 2) { 
    const fetchProgress = progress.total > 0 ? (progress.loaded / progress.total) * 70 : 0;
    progressPercent = Math.round(25 + fetchProgress);
    statusText = `Cataloging Boutique Archive (${progress.loaded}/${progress.total})`;
  } else if (progress.phase === 3) { progressPercent = 100; statusText = "Welcome to your Digital Boutique"; }

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {BOUTIQUE_LOADER_IMAGES.map((item, idx) => (
          <div key={item.url} className={`absolute inset-0 transition-all duration-[3000ms] ease-out ${idx === imgIndex ? 'opacity-60 scale-110' : 'opacity-0 scale-100'}`}>
            <img src={item.url} className="w-full h-full object-cover" alt="Slideshow" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
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
           <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden relative">
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
  const [initProgress, setInitProgress] = useState({ loaded: store.items.length, total: store.items.length, phase: store.isHydrated ? 3 : 0 });
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
  
  const mainScrollRef = useRef<HTMLElement>(null);

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
          if (!up) { await createUserProfile({ id: user.id, username: user.email?.split('@')[0] || 'Member', email: user.email!, language: 'en' }); up = await fetchUserProfile(user.id); }
          setProfile(up); if (up?.avatar_url) setLastKnownAvatar(up.avatar_url); store.updateProfile(up);
          const totalCount = await getWardrobeCount(user.id);
          setInitProgress({ loaded: 0, total: totalCount, phase: 2 });
          let allItems: WardrobeItem[] = [];
          for (let offset = 0; offset < totalCount; offset += 50) {
            const batch = await fetchWardrobeItemsBatch(user.id, 50, offset);
            allItems = [...allItems, ...batch];
            setInitProgress({ loaded: allItems.length, total: totalCount, phase: 2 });
          }
          setItems(allItems); store.updateItems(allItems);
          const cache = await fetchOutfitCache(user.id, allItems);
          setOutfitCache(cache); store.updateCache(cache);
          
          const firstCachedOccasion = ORDERED_OCCASIONS.find(occ => !!cache[occ]);
          if (firstCachedOccasion) {
            setSelectedOccasion(firstCachedOccasion);
          }

          store.setHydrated(true); setInitProgress({ loaded: totalCount, total: totalCount, phase: 3 });
          setTimeout(() => setLoading(false), 1200);
        } catch (e) { console.error(e); setLoading(false); }
      };
      initLoad();
    }
  }, [user]);

  const handleUseCredit = async () => {
    if (!profile) return;
    try {
      const updatedProfile = await useGenerationCredit(profile);
      setProfile(updatedProfile);
      store.updateProfile(updatedProfile);
    } catch (err: any) {
      if (err.message === 'OUT_OF_CREDITS') {
        setIsPaywallOpen(true);
        throw err;
      }
    }
  };

  const handleGenerateOutfit = async (occasion: Occasion, isUniversalMode = false) => {
    if (!profile?.avatar_url) { setActiveView('outfits'); return; }

    const generations = profile.total_generations || 0;
    const credits = profile.credits || 0;
    if (generations >= 15 && credits <= 0 && !profile.is_premium) {
      setIsPaywallOpen(true);
      return;
    }

    const oldCache = outfitCache[occasion];
    const strictlyMatched = items.filter(i => isItemSuitableForOccasion(i, occasion));
    
    if (!isUniversalMode && strictlyMatched.length < 1) {
      setPendingOccasion(occasion);
      setModalType('mismatch');
      setShowSuitabilityModal(true);
      return;
    }

    setIsGenerating(true); 
    setGenerationPhase('analyzing');
    setShowSuitabilityModal(false);

    try {
      const blacklist = oldCache?.combinationHistory || [];
      setGenerationPhase('designing');
      
      const outfit = await suggestOutfit(items, occasion, profile, blacklist, isUniversalMode);
      
      if (outfit.noMoreCombinations && !isUniversalMode && strictlyMatched.length > 0) {
         if (blacklist.length < 5) {
            outfit.noMoreCombinations = false;
         }
      }

      if (outfit.noMoreCombinations && !isUniversalMode) {
        setPendingOccasion(occasion);
        setModalType('exhausted');
        setShowSuitabilityModal(true);
        setIsGenerating(false);
        return;
      }

      setSelectedOccasion(occasion);
      const comboKey = outfit.items.map(i => i.id).sort().join(',');
      const newHistory = [...blacklist, comboKey].slice(-30); 

      const intermediateCacheItem: CachedOutfit = {
        outfit,
        visualizedImage: null, 
        generatedAt: Date.now(),
        combinationHistory: newHistory,
        pastOutfits: [...(oldCache?.pastOutfits || []), outfit].slice(-20)
      };
      
      setOutfitCache(prev => ({ ...prev, [occasion]: intermediateCacheItem }));
      setIsGenerating(false); 
      setIsVisualizing(true); 
      setGenerationPhase('visualizing');
      
      const visualizedRaw = await visualizeOutfit(outfit, profile);
      const visualized = await compressImage(visualizedRaw, 1024, 0.75);
      
      await handleUseCredit();

      const finalCacheItem: CachedOutfit = { 
        ...intermediateCacheItem,
        visualizedImage: visualized,
        pastImages: [...(oldCache?.pastImages || []), visualized].slice(-20) 
      };
      
      setOutfitCache(prev => ({ ...prev, [occasion]: finalCacheItem })); 
      store.updateCache({ ...outfitCache, [occasion]: finalCacheItem });
      await saveOutfitToCache(user.id, occasion, finalCacheItem);

    } catch (e) { 
      console.error(e);
      if (oldCache) setOutfitCache(prev => ({ ...prev, [occasion]: oldCache }));
    } finally { 
      setIsGenerating(false); 
      setIsVisualizing(false); 
      setGenerationPhase('complete'); 
    }
  };

  const handleSubscribe = async (pack: 'starter' | 'growth' | 'pro' | 'premium_monthly') => {
    let amount = 0;
    let isSub = false;

    if (pack === 'starter') amount = 50;
    else if (pack === 'growth') amount = 200;
    else if (pack === 'pro') amount = 500;
    else if (pack === 'premium_monthly') isSub = true;

    setIsPaywallOpen(false);
    setLoading(true);
    try {
      if (profile) {
        let updated = profile;
        if (isSub) {
           updated = { ...profile, is_premium: true, credits: (profile.credits || 0) + 1000 };
           await updateUserProfile(updated);
        } else {
           updated = await addCredits(profile, amount);
        }
        setProfile(updated);
        store.updateProfile(updated);
        alert(isSub ? "Elite Membership Activated! The Style Lab is now unlocked." : `Success! ${amount} credits have been added.`);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const itemMatchesTab = (item: WardrobeItem, tab: Category): boolean => {
    if (tab === 'All Items') return true;
    return item.category === tab;
  };

  const handleStartUpload = async (inputs: string[]) => {
    if (!user) return;
    setActiveView('wardrobe');
    setActiveTab('All Items');
    requestAnimationFrame(() => { mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); });
    const tasks = inputs.map((input) => async () => {
      const taskId = Math.random().toString(36).substr(2, 9);
      setUploadTasks(prev => [...prev, { id: taskId, status: 'analyzing', progress: 5, previewUrl: input }]);
      const updateTask = (updates: Partial<UploadTask>) => 
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      try {
        updateTask({ progress: 10 });
        const base64 = await getBase64Data(input);
        updateTask({ status: 'analyzing', progress: 20 });
        const results = await analyzeUpload(base64, profile?.language || 'en');
        if (!results || results.length === 0) throw new Error("No items detected.");
        updateTask({ totalItemsInBatch: results.length, processedItemsInBatch: 0, progress: 30 });
        await Promise.all(results.map(async (itemData, index) => {
          return limit(async () => {
            try {
              const startProgress = 30 + (index / results.length) * 60;
              updateTask({ status: 'illustrating', progress: startProgress });
              const isolatedBase64 = await generateItemImage(itemData, base64);
              const finalImageUrl = await uploadWardrobeImage(user.id, `item_${Math.random().toString(36).substr(2, 9)}`, isolatedBase64);
              const newItem = await saveWardrobeItem({
                ...itemData,
                userId: user.id,
                imageUrl: finalImageUrl, 
                isFavorite: false
              });
              setItems(prev => {
                const combined = [newItem, ...prev];
                store.updateItems(combined);
                return combined;
              });
              updateTask({ processedItemsInBatch: (index + 1) });
            } catch (e) { console.error("Item sync failed", e); }
          });
        }));
        setUploadTasks(prev => prev.filter(t => t.id !== taskId));
      } catch (err: any) {
        console.error("Task error", err);
        updateTask({ status: 'error', errorMessage: err.message, progress: 100 });
        setTimeout(() => setUploadTasks(prev => prev.filter(t => t.id !== taskId)), 8000);
      }
    });
    await Promise.all(tasks.map(t => limit(t)));
  };

  if (!user) return <Auth profileImage={lastKnownAvatar} onProfileImageUpdate={setLastKnownAvatar} />;
  if (loading) return <BoutiqueLoader progress={initProgress} />;

  const lang = profile?.language || 'en';
  const filteredItems = items.filter(i => itemMatchesTab(i, activeTab));

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col max-w-md mx-auto shadow-2xl relative overflow-x-hidden pb-32">
      <Header 
        title={t('digital_boutique', lang)} 
        onProfileClick={() => setIsProfileOpen(true)} 
        onMenuClick={() => setIsSidebarOpen(true)} 
        profileImage={profile?.avatar_url || null} 
        currentLang={lang} 
        credits={profile?.credits}
        isPremium={profile?.is_premium}
        onLanguageChange={(l) => { const updated = { ...profile!, language: l }; setProfile(updated); store.updateProfile(updated); updateUserProfile({ id: profile!.id, language: l }); }} 
      />
      <main ref={mainScrollRef} className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        {activeView === 'wardrobe' && (
          <>
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} lang={lang} />
            <div className="p-6">
              {uploadTasks.length > 0 && (
                <div id="sync-anchor" className="scroll-mt-24 mb-6">
                  <SyncingWardrobe tasks={uploadTasks} lang={lang} />
                </div>
              )}
              {items.length === 0 && uploadTasks.length === 0 ? (
                <EmptyWardrobe onAdd={() => setIsAddItemOpen(true)} lang={lang} />
              ) : (
                <div className="mt-2">
                  {filteredItems.length === 0 && uploadTasks.length === 0 ? (
                    <EmptyCategory category={activeTab} onAdd={() => setIsAddItemOpen(true)} lang={lang} />
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {filteredItems.map(item => <ItemCard key={item.id} item={item} onClick={setSelectedItem} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {activeView === 'outfits' && (
          <OutfitsView 
            items={items} 
            profile={profile} 
            onAddClick={() => setIsAddItemOpen(true)} 
            cache={outfitCache} 
            onUpdateCache={(o, d) => { const next = { ...outfitCache, [o]: d }; setOutfitCache(next); store.updateCache(next); }} 
            selectedOccasion={selectedOccasion} 
            onOccasionChange={setSelectedOccasion} 
            isGenerating={isGenerating} 
            isVisualizing={isVisualizing} 
            generationPhase={generationPhase} 
            onGenerate={handleGenerateOutfit} 
            onItemClick={setSelectedItem} 
            lang={lang} 
            isSettingFace={isAnalyzingFace} 
            onPaywall={() => setIsPaywallOpen(true)}
            onFaceUpload={async (b) => { setIsAnalyzingFace(true); try { const url = await uploadWardrobeImage(user.id, 'avatar', b); const updated = { ...profile!, avatar_url: url }; setProfile(updated); setLastKnownAvatar(url); store.updateProfile(updated); await updateUserProfile({ id: profile!.id, avatar_url: url }); } finally { setIsAnalyzingFace(false); } }} 
          />
        )}
        {activeView === 'explore' && <ExploreView lang={lang} profile={profile} items={items} onUseCredit={handleUseCredit} onPaywall={() => setIsPaywallOpen(true)} />}
      </main>
      <BottomNav activeView={activeView} onViewChange={setActiveView} onAddClick={() => setIsAddItemOpen(true)} isStyling={isGenerating || isVisualizing} hasBackgroundTasks={uploadTasks.length > 0} lang={lang} />
      
      {isSidebarOpen && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onSettingsClick={() => setIsSettingsOpen(true)} onManualClick={() => setIsManualOpen(true)} onLogout={() => logoutUser()} email={user.email || ''} username={profile?.username} isPremium={profile?.is_premium} lang={lang} credits={profile?.credits} onUpgrade={() => setIsPaywallOpen(true)} />}
      {isProfileOpen && profile && <ProfileModal isOpen={isProfileOpen} userId={user.id} onClose={() => setIsProfileOpen(false)} profile={profile} onUpdate={(p) => { setProfile(p); store.updateProfile(p); }} lang={lang} />}
      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} userId={user.id} email={user.email || ''} onClose={() => setIsSettingsOpen(false)} profile={profile} onUpdate={(p) => { setProfile(p); store.updateProfile(p); }} />}
      {isManualOpen && <UserManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} lang={lang} />}
      <AddItemModal isOpen={isAddItemOpen} onClose={() => setIsAddItemOpen(false)} onStartUpload={handleStartUpload} lang={lang} />
      {selectedItem && <ItemDetailsModal item={selectedItem} userId={user.id} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} onSave={(updated) => { setItems(prev => prev.map(i => i.id === updated.id ? updated : i)); setSelectedItem(updated); }} onDelete={(id) => { setItems(prev => prev.filter(i => i.id !== id)); }} lang={lang} />}
      {isPaywallOpen && <Paywall isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} onSubscribe={handleSubscribe} lang={lang} totalGenerations={profile?.total_generations} />}

      {showSuitabilityModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#FFFDF5] w-full max-w-sm rounded-[64px] p-12 text-center shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-[#26A69A]/10 rounded-full flex items-center justify-center mb-10 mx-auto">
               <RefreshCw className="w-10 h-10 text-[#26A69A]" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4 leading-tight">
               {modalType === 'mismatch' ? "Boutique Mismatch" : "Boutique Signature Exhausted"}
             </h3>
             <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-12 px-2">
               {modalType === 'mismatch' 
                 ? "Our Stylometric Engine has determined that your current archive does not contain items specifically curated for this occasion." 
                 : "Our Stylometric Engine has explored all possible unique combinations within your current archival collection for this occasion."}
               <br /><br />
               <span className="text-zinc-900 font-bold">Would you prefer a creative, high-fashion ensemble curated from your entire collection instead?</span>
             </p>
             <div className="w-full space-y-4">
                <button 
                  onClick={() => handleGenerateOutfit(pendingOccasion!, true)} 
                  className="w-full py-6 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl shadow-teal-100 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Creative Edit</span>
                </button>
                <button 
                  onClick={() => setShowSuitabilityModal(false)} 
                  className="w-full py-4 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
