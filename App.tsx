
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WardrobeItem, Category, ViewType, OutfitCache, CachedOutfit, UserProfile, Occasion, UploadTask } from './types';
import { supabase } from './lib/supabase';
import { 
  fetchWardrobeItemsBatch, 
  getWardrobeCount, 
  fetchUserProfile, 
  createUserProfile, 
  uploadWardrobeImage, 
  saveWardrobeItem, 
  updateUserProfile, 
  compressImage, 
  fetchOutfitCache, 
  saveOutfitToCache, 
  logoutUser 
} from './services/wardrobeService';
import { 
  suggestOutfit, 
  visualizeOutfit, 
  analyzeUpload, 
  generateItemImage, 
  getBase64Data 
} from './services/geminiService';
import Header from './components/Header';
import Tabs from './components/Tabs';
import ItemCard from './components/ItemCard';
import AddItemModal from './components/AddItemModal';
import OutfitsView from './components/OutfitsView';
import ExploreView from './components/ExploreView';
import BottomNav from './components/BottomNav';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import Sidebar from './components/Sidebar';
import ItemDetailsModal from './components/ItemDetailsModal';
import UserManualModal from './components/UserManualModal';
import EmptyWardrobe from './components/EmptyWardrobe';
import Auth from './components/Auth';
import Paywall from './components/Paywall';
import BrandLogo from './components/BrandLogo';
import SyncingWardrobe from './components/SyncingWardrobe';
import { t } from './services/i18n';
import { Wand2, Sparkles, Loader2 } from 'lucide-react';

const BOUTIQUE_LOADER_IMAGES = [
  "https://images.unsplash.com/photo-1539109132314-3475961ec14a?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop"
];

const BoutiqueLoader: React.FC<{ progress: { loaded: number, total: number, phase: number } }> = ({ progress }) => {
  const [imgIndex, setImgIndex] = useState(0);
  useEffect(() => {
    const imgInterval = setInterval(() => setImgIndex(i => (i + 1) % BOUTIQUE_LOADER_IMAGES.length), 4000);
    return () => clearInterval(imgInterval);
  }, []);

  let progressPercent = 0;
  let statusText = "Initializing...";

  if (progress.phase === 1) {
    progressPercent = 20;
    statusText = "Syncing Profile...";
  } else if (progress.phase === 2) {
    const fetchProgress = progress.total > 0 ? (progress.loaded / progress.total) * 70 : 0;
    progressPercent = 25 + fetchProgress;
    statusText = `Cataloging Boutique Archive (${progress.loaded}/${progress.total})`;
  } else if (progress.phase === 3) {
    progressPercent = 100;
    statusText = "Welcome to your Digital Boutique";
  }

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center overflow-hidden">
      {BOUTIQUE_LOADER_IMAGES.map((src, idx) => (
        <img 
          key={src} 
          src={src} 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ${idx === imgIndex ? 'opacity-40 scale-105' : 'opacity-0 scale-100'} transition-transform duration-[10000ms] ease-linear`} 
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
      
      <div className="relative z-10 flex flex-col items-center px-12 text-center">
        <BrandLogo size="lg" className="mb-12 animate-in fade-in zoom-in duration-1000" />
        
        <div className="space-y-2 mb-16">
          <h2 className="text-5xl font-black text-white tracking-[12px] uppercase leading-none">
            Glam<span className="text-[#26A69A]">AI</span>
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-1.5 h-1.5 bg-[#26A69A] rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-[#26A69A] uppercase tracking-[4px]">Digital Boutique</span>
          </div>
        </div>

        <div className="w-64 space-y-4">
           <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#26A69A] transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
           </div>
           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{statusText}</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [activeTab, setActiveTab] = useState<Category>('All Items');
  const [activeView, setActiveView] = useState<ViewType>('wardrobe');
  const [loading, setLoading] = useState(true);
  const [initProgress, setInitProgress] = useState({ loaded: 0, total: 0, phase: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [outfitCache, setOutfitCache] = useState<OutfitCache>({});
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<'analyzing' | 'designing' | 'visualizing' | 'complete'>('complete');
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setProfile(null);
        setItems([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const initLoad = async () => {
        setLoading(true);
        setInitProgress({ loaded: 0, total: 0, phase: 1 });
        try {
          let up = await fetchUserProfile(user.id);
          if (!up) {
            await createUserProfile({
              id: user.id,
              username: user.email?.split('@')[0] || 'Member',
              email: user.email!,
              language: 'en'
            });
            up = await fetchUserProfile(user.id);
          }
          setProfile(up);

          setInitProgress({ loaded: 0, total: 0, phase: 2 });
          const totalCount = await getWardrobeCount(user.id);
          setInitProgress({ loaded: 0, total: totalCount, phase: 2 });

          let allItems: WardrobeItem[] = [];
          const batchSize = 50;
          for (let offset = 0; offset < totalCount; offset += batchSize) {
            const batch = await fetchWardrobeItemsBatch(user.id, batchSize, offset);
            allItems = [...allItems, ...batch];
            setInitProgress({ loaded: allItems.length, total: totalCount, phase: 2 });
          }
          setItems(allItems);

          const cache = await fetchOutfitCache(user.id, allItems);
          setOutfitCache(cache);

          setInitProgress({ loaded: totalCount, total: totalCount, phase: 3 });
          setTimeout(() => setLoading(false), 800);
        } catch (e) {
          console.error("Initialization error:", e);
          setLoading(false);
        }
      };
      initLoad();
    }
  }, [user]);

  const handleOpenAddItem = () => {
    setActiveView('wardrobe');
    setIsAddItemOpen(true);
  };

  const handleStartUpload = async (images: string[]) => {
    const newTasks = images.map(img => ({
      id: Math.random().toString(36).substr(2, 9),
      status: 'analyzing' as const,
      progress: 0,
      previewUrl: img
    }));
    setUploadTasks(prev => [...prev, ...newTasks]);

    for (const task of newTasks) {
      try {
        const base64 = task.previewUrl.startsWith('data:') 
          ? task.previewUrl 
          : await getBase64Data(task.previewUrl);
        
        setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'analyzing', progress: 30 } : t));
        const analyzed = await analyzeUpload(base64, profile?.language || 'en');
        
        if (analyzed.length > 0) {
          const itemData = analyzed[0];
          setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'illustrating', progress: 60 } : t));
          const finalizedImageUrl = await generateItemImage(itemData, base64);
          
          setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'saving', progress: 85 } : t));
          const newItem = await saveWardrobeItem({
            ...itemData,
            userId: user.id,
            imageUrl: finalizedImageUrl,
            isFavorite: false
          });

          setItems(prev => [newItem, ...prev]);
        }
        setUploadTasks(prev => prev.filter(t => t.id !== task.id));
      } catch (err) {
        console.error("Upload failed for item", err);
        setUploadTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error', errorMessage: 'Sync failed' } : t));
        setTimeout(() => setUploadTasks(prev => prev.filter(t => t.id !== task.id)), 5000);
      }
    }
  };

  const handleGenerateOutfit = async (occasion: Occasion) => {
    if (!profile?.avatar_url) {
      setActiveView('outfits');
      return;
    }
    
    setIsGenerating(true);
    setGenerationPhase('analyzing');
    try {
      const currentCache = outfitCache[occasion];
      const avoid = currentCache ? [currentCache.outfit.name] : [];
      
      setGenerationPhase('designing');
      const outfit = await suggestOutfit(items, occasion, profile, avoid);
      
      setGenerationPhase('visualizing');
      const visualized = await visualizeOutfit(outfit, profile);
      
      const newCacheItem: CachedOutfit = {
        outfit,
        visualizedImage: visualized,
        generatedAt: Date.now(),
        history: avoid
      };

      setOutfitCache(prev => ({ ...prev, [occasion]: newCacheItem }));
      await saveOutfitToCache(user.id, occasion, newCacheItem);
    } catch (e) {
      console.error("Generation failed:", e);
      alert("Styling session interrupted. Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationPhase('complete');
    }
  };

  const filteredItems = items.filter(i => activeTab === 'All Items' || i.category === activeTab);

  if (!user) return <Auth profileImage={null} onProfileImageUpdate={() => {}} />;
  if (loading) return <BoutiqueLoader progress={initProgress} />;

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col max-w-md mx-auto shadow-2xl relative overflow-x-hidden pb-32">
      <Header 
        title={t('digital_boutique', profile?.language)}
        onProfileClick={() => setIsProfileOpen(true)}
        onMenuClick={() => setIsSidebarOpen(true)}
        profileImage={profile?.avatar_url || null}
        currentLang={profile?.language || 'en'}
        onLanguageChange={(l) => {
          const updated = { ...profile!, language: l };
          setProfile(updated);
          updateUserProfile({ id: profile!.id, language: l });
        }}
      />

      <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        {activeView === 'wardrobe' && (
          <>
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} lang={profile?.language} />
            <div className="p-6">
              {uploadTasks.length > 0 && <SyncingWardrobe tasks={uploadTasks} lang={profile?.language} />}
              {items.length === 0 && uploadTasks.length === 0 ? (
                <EmptyWardrobe onAdd={handleOpenAddItem} lang={profile?.language} />
              ) : (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {filteredItems.map(item => (
                    <ItemCard key={item.id} item={item} onClick={setSelectedItem} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'outfits' && (
          <OutfitsView 
            items={items}
            profile={profile}
            onAddClick={handleOpenAddItem}
            cache={outfitCache}
            onUpdateCache={(o, d) => setOutfitCache(prev => ({ ...prev, [o]: d }))}
            selectedOccasion={selectedOccasion}
            onOccasionChange={setSelectedOccasion}
            isGenerating={isGenerating}
            isVisualizing={isVisualizing}
            generationPhase={generationPhase}
            onGenerate={handleGenerateOutfit}
            onItemClick={setSelectedItem}
            lang={profile?.language}
            onFaceUpload={async (b) => {
              const url = await uploadWardrobeImage(user.id, 'avatar', b);
              const updated = { ...profile!, avatar_url: url };
              setProfile(updated);
              await updateUserProfile({ id: profile!.id, avatar_url: url });
            }}
          />
        )}

        {activeView === 'explore' && <ExploreView lang={profile?.language} profile={profile} />}
      </main>

      <BottomNav 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onAddClick={handleOpenAddItem}
        isStyling={isGenerating || isVisualizing}
        hasBackgroundTasks={uploadTasks.length > 0}
        lang={profile?.language}
      />

      {/* Modals & Overlays */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onSettingsClick={() => setIsSettingsOpen(true)}
        onManualClick={() => setIsManualOpen(true)}
        onLogout={() => logoutUser()}
        email={user.email || ''}
        username={profile?.username}
        isPremium={profile?.is_premium}
        onUpgrade={() => setIsPaywallOpen(true)}
        lang={profile?.language}
      />

      {isProfileOpen && profile && (
        <ProfileModal 
          isOpen={isProfileOpen}
          userId={user.id}
          onClose={() => setIsProfileOpen(false)}
          profile={profile}
          onUpdate={setProfile}
          lang={profile?.language}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen}
          userId={user.id}
          email={user.email || ''}
          onClose={() => setIsSettingsOpen(false)}
          profile={profile}
          onUpdate={setProfile}
        />
      )}

      {selectedItem && (
        <ItemDetailsModal 
          item={selectedItem}
          userId={user.id}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={(updated) => setItems(prev => prev.map(i => i.id === updated.id ? updated : i))}
          // Fix: corrected onDelete callback to properly filter items by comparing IDs in a predicate function
          onDelete={(deletedId) => setItems(prev => prev.filter(item => item.id !== deletedId))}
          lang={profile?.language}
        />
      )}

      <AddItemModal 
        isOpen={isAddItemOpen} 
        onClose={() => setIsAddItemOpen(false)} 
        onStartUpload={handleStartUpload}
        lang={profile?.language}
      />

      <UserManualModal 
        isOpen={isManualOpen} 
        onClose={() => setIsManualOpen(false)} 
        lang={profile?.language}
      />

      <Paywall 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
        onSubscribe={async () => {
          const updated = { ...profile!, is_premium: true };
          setProfile(updated);
          await updateUserProfile({ id: profile!.id, is_premium: true });
          setIsPaywallOpen(false);
        }}
        lang={profile?.language}
      />
    </div>
  );
};

export default App;
