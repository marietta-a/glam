
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WardrobeItem, Category, ViewType, OutfitCache, CachedOutfit, UserProfile, Occasion, UploadTask } from './types';
import { supabase } from './lib/supabase';
import { fetchWardrobeItemsBatch, getWardrobeCount, fetchUserProfile, createUserProfile, uploadWardrobeImage, saveWardrobeItem, updateUserProfile, compressImage, fetchOutfitCache, saveOutfitToCache, logoutUser } from './services/wardrobeService';
import { suggestOutfit, visualizeOutfit, analyzeUpload, generateItemImage, getBase64Data } from './services/geminiService';
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
import SyncingWardrobe from './components/SyncingWardrobe';
import Auth from './components/Auth';
import Paywall from './components/Paywall';
import AdBanner from './components/AdBanner';
import BrandLogo from './components/BrandLogo';
import { t } from './services/i18n';
import { CloudSync, CheckCircle2, AlertCircle, X, Download, Sparkles, Wand2 } from 'lucide-react';

const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 Days (72 Hours)

const BOUTIQUE_LOADER_IMAGES = [
  "https://images.unsplash.com/photo-1539109132314-3475961ec14a?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541336032412-20242295ee32?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop"
];

const BoutiqueLoader: React.FC<{ progress: { loaded: number, total: number, phase: number } }> = ({ progress }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const statusMessages = ["Synchronizing Archive", "Calibrating Textures", "Authenticating Boutique", "Awakening AI Logic"];
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    BOUTIQUE_LOADER_IMAGES.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    const imgInterval = setInterval(() => setImgIndex(i => (i + 1) % BOUTIQUE_LOADER_IMAGES.length), 4000);
    const statusInterval = setInterval(() => setStatusIndex(i => (i + 1) % statusMessages.length), 2000);
    return () => { clearInterval(imgInterval); clearInterval(statusInterval); };
  }, []);

  let progressPercent = 10;
  if (progress.phase === 1) progressPercent = 25;
  if (progress.phase === 2) {
    progressPercent = 30 + (progress.total > 0 ? (progress.loaded / progress.total) * 60 : 60);
  }
  if (progress.phase === 3) progressPercent = 100;

  return (
    <div className="fixed inset-0 z-[500] bg-black overflow-hidden flex flex-col items-center justify-center">
      {BOUTIQUE_LOADER_IMAGES.map((src, idx) => (
        <div 
          key={src}
          className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${idx === imgIndex ? 'opacity-40' : 'opacity-0'}`}
        >
          <img src={src} className="w-full h-full object-cover scale-110 animate-ken-burns" alt="Fashion Montage" />
        </div>
      ))}
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      <div className="relative z-10 flex flex-col items-center text-center px-12">
        <div className="mb-8 relative scale-125">
           <div className="absolute inset-0 blur-3xl bg-[#26A69A]/40 rounded-full animate-pulse" />
           <div className="relative bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[50px] p-2 shadow-2xl">
             <BrandLogo size="lg" />
           </div>
        </div>

        <h2 className="text-5xl font-black text-white tracking-[12px] uppercase mb-2 animate-in slide-in-from-bottom-4">
          Glam<span className="text-[#26A69A]">AI</span>
        </h2>
        
        <div className="h-6 mb-12">
           <p className="text-[10px] font-black text-white/40 uppercase tracking-[6px] animate-in fade-in duration-500">
             {statusMessages[statusIndex]}
           </p>
        </div>

        <div className="w-64 space-y-4">
          <div className="flex items-center justify-between px-1">
             <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Initialization</span>
             <span className="text-[9px] font-black text-[#26A69A] tracking-widest">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden backdrop-blur-md">
            <div 
              className="h-full bg-gradient-to-r from-[#26A69A]/30 to-[#26A69A] transition-all duration-700 ease-out shadow-[0_0_20px_rgba(38,166,154,0.6)]" 
              style={{ width: `${Math.max(progressPercent, 5)}%` }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ken-burns {
          0% { transform: scale(1.1) translate(0, 0); }
          100% { transform: scale(1.2) translate(-1%, -1%); }
        }
        .animate-ken-burns {
          animation: ken-burns 15s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  // Use any as fallback type for session to handle missing Session export in some environments
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchProgress, setFetchProgress] = useState<{ loaded: number; total: number; phase: number }>({ loaded: 0, total: 0, phase: 0 });
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [corsErrorUrl, setCorsErrorUrl] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<Record<string, UploadTask>>({});
  const [isSettingFace, setIsSettingFace] = useState(false);
  const wardrobeScrollRef = useRef<HTMLElement>(null);
  const dataLoadedForSession = useRef<string | null>(null);

  const [profileImage, setProfileImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('glam_profile_image');
    } catch (e) {
      return null;
    }
  });

  const [outfitCache, setOutfitCache] = useState<OutfitCache>({});
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [isGeneratingOutfit, setIsGeneratingOutfit] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<'analyzing' | 'designing' | 'visualizing' | 'complete'>('analyzing');
  
  // Persistent Navigation State
  const [activeTab, setActiveTab] = useState<Category>(() => {
    try {
      return (localStorage.getItem('glam_active_tab') as Category) || 'All Items';
    } catch {
      return 'All Items';
    }
  });
  
  // Changed default view from 'wardrobe' to 'explore' as requested
  const [activeView, setActiveView] = useState<ViewType>(() => {
    try {
      return (localStorage.getItem('glam_active_view') as ViewType) || 'explore';
    } catch {
      return 'explore';
    }
  });

  useEffect(() => {
    localStorage.setItem('glam_active_view', activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('glam_active_tab', activeTab);
  }, [activeTab]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);

  const lang = profile?.language || 'en';

  useEffect(() => {
    // Cast supabase.auth to any to bypass potential type mismatch issues in the library
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      setSession(session);
      if (!session) {
         setLoading(false);
      }
    });

    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (!session) {
        setItems([]);
        setProfile(null);
        setProfileImage(null);
        setOutfitCache({});
        setSelectedOccasion(null);
        setIsGeneratingOutfit(false);
        setActiveView('explore'); // Reset to explore on logout as it's the default entry page
        setActiveTab('All Items');
        dataLoadedForSession.current = null;
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && dataLoadedForSession.current !== session.user.id) {
      const loadData = async () => {
        dataLoadedForSession.current = session.user.id;
        setLoading(true);
        setFetchProgress(p => ({ ...p, phase: 1 }));
        
        try {
          let userProfile = await fetchUserProfile(session.user.id);
          if (!userProfile) {
            const initialProfile: Partial<UserProfile> = {
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'fashionista',
              email: session.user.email || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_premium: false,
              trial_started_at: new Date().toISOString(),
              language: 'en'
            };
            await createUserProfile(initialProfile);
            userProfile = await fetchUserProfile(session.user.id);
            setIsProfileModalOpen(true);
          }
          setProfile(userProfile);
          if (userProfile?.avatar_url) setProfileImage(userProfile.avatar_url);

          setFetchProgress(p => ({ ...p, phase: 2 }));
          const total = await getWardrobeCount(session.user.id);
          const allItems: WardrobeItem[] = [];
          
          if (total > 0) {
            let offset = 0;
            const batchSize = 10;
            while (offset < total) {
              const batch = await fetchWardrobeItemsBatch(session.user.id, batchSize, offset);
              allItems.push(...batch);
              setItems([...allItems]);
              offset += batchSize;
              setFetchProgress({ loaded: Math.min(offset, total), total, phase: 2 });
            }
          } else {
            setFetchProgress(p => ({ ...p, phase: 2, total: 0 }));
          }

          setFetchProgress(p => ({ ...p, phase: 3 }));
          const cache = await fetchOutfitCache(session.user.id, allItems);
          setOutfitCache(cache);

        } catch (err) {
          console.error("Data loading failed:", err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [session]);

  const isTrialExpired = useCallback(() => {
    if (!profile) return false;
    if (profile.is_premium) return false;
    const signupDate = new Date(profile.created_at).getTime();
    return (Date.now() - signupDate) > TRIAL_DURATION_MS;
  }, [profile]);

  const handleProfileImageUpdate = useCallback((base64: string | null) => {
    setProfileImage(base64);
    if (base64) localStorage.setItem('glam_profile_image', base64);
    else localStorage.removeItem('glam_profile_image');
  }, []);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (updatedProfile.avatar_url) setProfileImage(updatedProfile.avatar_url);
  };

  const handleLanguageChange = async (newLang: string) => {
    if (!profile) return;
    try {
      const updated = { ...profile, language: newLang };
      await updateUserProfile(updated);
      setProfile(updated);
    } catch (err) {
      console.error("Language update failed:", err);
    }
  };

  const handleStylistFaceUpload = async (base64: string) => {
    if (!session || !profile) return;
    setIsSettingFace(true);
    try {
      const compressed = await compressImage(base64, 600, 0.6);
      const avatarUrl = await uploadWardrobeImage(session.user.id, 'avatar', compressed);
      const updatedProfile = { ...profile, avatar_url: avatarUrl };
      await updateUserProfile(updatedProfile);
      handleProfileUpdate(updatedProfile);
    } catch (err) {
      console.error("Failed to sync identity face:", err);
      alert("Failed to sync identity. Please try again.");
    } finally {
      setIsSettingFace(false);
    }
  };

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    if (!profile) return;
    try {
      const updated = { ...profile, is_premium: true };
      await updateUserProfile(updated);
      setProfile(updated);
      setIsPaywallOpen(false);
    } catch (e) {
      console.error("Upgrade failed:", e);
    }
  };

  const handleAddItemLocally = useCallback((newItem: WardrobeItem) => {
    setItems(prev => [newItem, ...prev]);
  }, []);

  const handleUpdateItem = useCallback((updatedItem: WardrobeItem) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  }, []);

  const handleDeleteItemLocally = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleSaveToCache = async (occasion: string, data: CachedOutfit) => {
    if (!session) return;
    setOutfitCache(prev => ({ ...prev, [occasion]: data }));
    
    try {
      await saveOutfitToCache(session.user.id, occasion, data);
    } catch (err) {
      console.error("Failed to persist outfit cache to database:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const startBackgroundUpload = async (inputs: string[]) => {
    if (!session) return;
    if (isTrialExpired()) {
      setIsPaywallOpen(true);
      return;
    }

    const userId = session.user.id;
    
    // Ensure we are in the wardrobe view
    setActiveView('wardrobe');
    
    // EXTREMELY CRITICAL: Scroll to the top immediately to show sync progress
    const scrollToTop = () => {
      if (wardrobeScrollRef.current) {
        wardrobeScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    
    // Immediate scroll
    scrollToTop();
    // Re-scroll slightly delayed to handle any rendering shifts
    setTimeout(scrollToTop, 50);

    for (const input of inputs) {
      const taskId = Math.random().toString(36).substr(2, 9);
      setPendingUploads(prev => ({
        ...prev,
        [taskId]: { id: taskId, status: 'analyzing', progress: 5, previewUrl: input }
      }));

      (async () => {
        try {
          let base64: string;
          if (input.startsWith('data:image')) {
            base64 = input.split(',')[1];
          } else {
            base64 = await getBase64Data(input);
          }

          const results = await analyzeUpload(base64, lang);
          if (results.length === 0) throw new Error("No fashion items identified.");

          setPendingUploads(prev => ({
            ...prev,
            [taskId]: { 
              ...prev[taskId], 
              status: 'illustrating', 
              progress: 30, 
              totalItemsInBatch: results.length, 
              processedItemsInBatch: 0 
            }
          }));

          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const generatedBase64 = await generateItemImage(result, base64);
            const tempId = Math.random().toString(36).substr(2, 9);
            const publicUrl = await uploadWardrobeImage(userId, tempId, generatedBase64);
            
            const finalItem = await saveWardrobeItem({
              ...result,
              userId: userId,
              name: result.name || `New Piece`,
              category: result.category || 'Tops',
              imageUrl: publicUrl, 
              isFavorite: false
            });
            
            handleAddItemLocally(finalItem);
            
            setPendingUploads(prev => {
              const currentTask = prev[taskId];
              const processedCount = (currentTask.processedItemsInBatch || 0) + 1;
              const newProgress = 30 + (processedCount / (currentTask.totalItemsInBatch || 1) * 70);
              return {
                ...prev,
                [taskId]: {
                  ...currentTask,
                  processedItemsInBatch: processedCount,
                  progress: newProgress,
                  previewUrl: finalItem.imageUrl
                }
              };
            });
          }

          setPendingUploads(prev => ({
            ...prev,
            [taskId]: { ...prev[taskId], status: 'complete', progress: 100 }
          }));

          setTimeout(() => {
            setPendingUploads(prev => {
              const next = { ...prev };
              delete next[taskId];
              return next;
            });
          }, 3000);

        } catch (err: any) {
          console.error("Background processing failed:", err);
          if (err.message.includes("CORS restricted")) {
            setCorsErrorUrl(input);
          }
          setPendingUploads(prev => ({
            ...prev,
            [taskId]: { ...prev[taskId], status: 'error', errorMessage: err.message, progress: 100 }
          }));
          setTimeout(() => {
            setPendingUploads(prev => {
              const next = { ...prev };
              delete next[taskId];
              return next;
            });
          }, 5000);
        }
      })();
    }
  };

  const handleGenerateOutfit = useCallback(async (occasion: Occasion) => {
    if (isGeneratingOutfit || isVisualizing) return;
    if (isTrialExpired()) {
      setIsPaywallOpen(true);
      return;
    }
    
    setSelectedOccasion(occasion);
    setIsGeneratingOutfit(true);
    setGenerationPhase('analyzing');

    const previousHistory = outfitCache[occasion]?.history || [];
    if (outfitCache[occasion]?.outfit?.name) {
      if (!previousHistory.includes(outfitCache[occasion].outfit.name)) {
        previousHistory.push(outfitCache[occasion].outfit.name);
      }
    }

    try {
      setGenerationPhase('designing');
      const outfit = await suggestOutfit(items, occasion, profile, previousHistory);
      const newHistory = [...previousHistory];
      if (!newHistory.includes(outfit.name)) {
        newHistory.push(outfit.name);
      }

      const initialResult: CachedOutfit = {
        outfit,
        visualizedImage: null,
        generatedAt: Date.now(),
        history: newHistory
      };
      
      await handleSaveToCache(occasion, initialResult);
      setIsGeneratingOutfit(false);
      setIsVisualizing(true);
      setGenerationPhase('visualizing');

      const visualizedImage = await visualizeOutfit(outfit, profile);
      const finalResult: CachedOutfit = {
        ...initialResult,
        visualizedImage
      };
      
      await handleSaveToCache(occasion, finalResult);
      setIsVisualizing(false);
      setGenerationPhase('complete');
    } catch (err) {
      console.error("Outfit generation failed:", err);
      setIsGeneratingOutfit(false);
      setIsVisualizing(false);
      alert("Style generation failed. Please check your connection and try again.");
    }
  }, [items, profile, isGeneratingOutfit, isVisualizing, outfitCache, isTrialExpired, session]);

  if (loading) {
    return <BoutiqueLoader progress={fetchProgress} />;
  }

  if (!session) {
    return <Auth onProfileImageUpdate={handleProfileImageUpdate} profileImage={profileImage} />;
  }

  const filteredItems = items.filter(item => 
    activeTab === 'All Items' || item.category === activeTab
  );

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'wardrobe': return t('wardrobe', lang);
      case 'explore': return t('discovery', lang);
      case 'outfits': return t('stylist', lang);
      default: return 'GlamWardrobe';
    }
  };

  const hasPendingUploads = Object.keys(pendingUploads).length > 0;

  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto bg-[#F7F9FA] shadow-2xl relative flex flex-col overflow-x-hidden animate-in fade-in duration-1000">
      <Header 
        title={getHeaderTitle()} 
        onProfileClick={() => setIsProfileModalOpen(true)}
        onMenuClick={() => setIsSidebarOpen(true)}
        profileImage={profileImage}
        currentLang={lang}
        onLanguageChange={handleLanguageChange}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F9FA]">
        {hasPendingUploads && activeView === 'wardrobe' && items.length > 0 && (
          <div className="bg-white px-8 py-6 border-b border-gray-50 animate-in slide-in-from-top-4 duration-500 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/95">
            {(Object.values(pendingUploads) as UploadTask[]).map(task => (
              <div key={task.id} className="mb-5 last:mb-0">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-1.5 rounded-lg ${task.status === 'complete' ? 'bg-teal-50' : task.status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
                      {task.status === 'complete' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#26A69A]" />
                      ) : task.status === 'error' ? (
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                      ) : (
                        <CloudSync className="w-4 h-4 text-[#26A69A] animate-spin" />
                      )}
                    </div>
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-[2px]">
                      {task.status === 'analyzing' && 'Cataloging Piece...'}
                      {task.status === 'illustrating' && `Illustrating ${task.processedItemsInBatch}/${task.totalItemsInBatch}...`}
                      {task.status === 'complete' && 'Sync Successful'}
                      {task.status === 'error' && 'Sync Interrupted'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-[#26A69A] tracking-wider">{Math.round(task.progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden shadow-inner border border-gray-100/30">
                  <div 
                    className={`h-full transition-all duration-1000 ease-in-out ${task.status === 'error' ? 'bg-red-400' : 'bg-[#26A69A]'} shadow-[0_0_10px_rgba(38,166,154,0.3)]`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'wardrobe' && (
          <>
            {items.length > 0 && <Tabs activeTab={activeTab} onTabChange={setActiveTab} lang={lang} />}
            <main ref={wardrobeScrollRef as any} className="flex-1 overflow-y-auto flex flex-col min-h-0 custom-scrollbar scroll-smooth">
              {items.length === 0 && !loading ? (
                hasPendingUploads ? (
                  <SyncingWardrobe tasks={Object.values(pendingUploads)} lang={lang} />
                ) : (
                  <EmptyWardrobe onAdd={() => setIsAddModalOpen(true)} lang={lang} />
                )
              ) : (
                <div className="flex-1 flex flex-col">
                  {filteredItems.length > 0 ? (
                    <div className="flex flex-col p-6 animate-in fade-in duration-500">
                      {!profile?.is_premium && <AdBanner lang={lang} />}
                      <div className="grid grid-cols-2 gap-5">
                        {filteredItems.map(item => (
                          <ItemCard key={item.id} item={item} onClick={setSelectedItem} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    !loading && (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                        <h3 className="text-xl font-bold text-gray-800">No matches</h3>
                        <button onClick={() => setActiveTab('All Items')} className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[#26A69A] mt-4 font-bold">Show All</button>
                      </div>
                    )
                  )}
                </div>
              )}
            </main>
          </>
        )}

        {activeView === 'outfits' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <OutfitsView 
              items={items} 
              profile={profile} 
              onAddClick={() => setIsAddModalOpen(true)}
              cache={outfitCache}
              onUpdateCache={handleSaveToCache}
              selectedOccasion={selectedOccasion}
              onOccasionChange={setSelectedOccasion}
              isGenerating={isGeneratingOutfit}
              isVisualizing={isVisualizing}
              generationPhase={generationPhase}
              onGenerate={handleGenerateOutfit}
              onItemClick={setSelectedItem}
              lang={lang}
              isSettingFace={isSettingFace}
              onFaceUpload={handleStylistFaceUpload}
            />
          </div>
        )}

        {activeView === 'explore' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ExploreView lang={lang} profile={profile} />
          </div>
        )}
      </div>

      <BottomNav 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onAddClick={() => setIsAddModalOpen(true)} 
        isStyling={isGeneratingOutfit || isVisualizing}
        hasBackgroundTasks={hasPendingUploads}
        lang={lang}
      />
      
      {session && (
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSettingsClick={() => setIsSettingsModalOpen(true)}
          onManualClick={() => setIsManualModalOpen(true)}
          onLogout={handleLogout}
          email={session.user.email || ''}
          username={profile?.username || session.user.user_metadata?.username}
          isPremium={profile?.is_premium}
          onUpgrade={() => setIsPaywallOpen(true)}
          lang={lang}
        />
      )}

      {session && isAddModalOpen && (
        <AddItemModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onStartUpload={startBackgroundUpload}
        />
      )}

      {session && profile && (
        <ProfileModal 
          isOpen={isProfileModalOpen}
          userId={session.user.id}
          onClose={() => setIsProfileModalOpen(false)}
          profile={profile}
          onUpdate={handleProfileUpdate}
        />
      )}

      {session && isSettingsModalOpen && (
        <SettingsModal 
          isOpen={isSettingsModalOpen}
          userId={session.user.id}
          email={session.user.email || ''}
          onClose={() => setIsSettingsModalOpen(false)}
          profile={profile}
          onUpdate={handleProfileUpdate}
        />
      )}

      {session && (
        <UserManualModal 
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          lang={lang}
        />
      )}

      {selectedItem && session && (
        <ItemDetailsModal 
          item={selectedItem}
          userId={session.user.id}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleUpdateItem}
          onDelete={handleDeleteItemLocally}
        />
      )}

      {corsErrorUrl && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[56px] p-10 text-center shadow-2xl relative animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                 <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4 leading-none">Import Blocked</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-10 px-4">
                Import failed due to security restrictions (CORS). Please download the image to your device and upload it via the <span className="font-bold text-gray-900">Gallery</span> instead.
              </p>
              <div className="flex flex-col space-y-3">
                 <button 
                   onClick={() => setCorsErrorUrl(null)}
                   className="w-full py-5 bg-[#1a1a1a] text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl hover:bg-[#26A69A] transition-all active:scale-95 flex items-center justify-center space-x-3"
                 >
                   <CheckCircle2 className="w-4 h-4" />
                   <span>I Understand</span>
                 </button>
                 <button 
                   onClick={() => {
                     window.open(corsErrorUrl, '_blank');
                     setCorsErrorUrl(null);
                   }}
                   className="w-full py-5 bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[11px] rounded-[28px] hover:bg-gray-100 transition-all flex items-center justify-center space-x-3"
                 >
                   <Download className="w-4 h-4" />
                   <span>Open Original</span>
                 </button>
              </div>
              <button 
                onClick={() => setCorsErrorUrl(null)}
                className="absolute top-8 right-8 p-2 text-gray-300 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
           </div>
        </div>
      )}

      <Paywall 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
        onSubscribe={handleSubscribe} 
        lang={lang}
      />
    </div>
  );
};

export default App;
