import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, Sparkles, Zap, ChevronRight, 
  Upload, Camera, Loader2, X, Image as ImageIcon, 
  User, Shirt, Info, Trash2, 
  Layers, Download, ShieldCheck, Wand2, RefreshCw, Globe, Box, Sun, Palmtree, Building2, Coffee, Camera as CameraIcon, Maximize2, History, Fingerprint,
  Plus, PenTool, ImagePlus, Layout, UserCog, Mic2, Briefcase, Trophy, Rocket, Palette
} from 'lucide-react';
import { t } from '../services/i18n';
import { restoreFashionImage, getBase64Data, RestorationMode, StyleVibe, Occupation, generateOccupationImage } from '../services/geminiService';
import { UserProfile, WardrobeItem } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface ExploreViewProps {
  lang?: string;
  profile?: UserProfile | null;
  items?: WardrobeItem[];
  onUseCredit: () => Promise<UserProfile | undefined>;
  onPaywall: () => void;
}

const STYLE_VIBES: { id: StyleVibe, label: string, icon: React.ReactNode }[] = [
  { id: 'Studio', label: 'STUDIO', icon: <Building2 className="w-5 h-5" /> },
  { id: 'Street', label: 'STREET', icon: <CameraIcon className="w-5 h-5" /> },
  { id: 'Estate', label: 'ESTATE', icon: <ShieldCheck className="w-5 h-5" /> },
  { id: 'Minimal', label: 'MINIMAL', icon: <Box className="w-5 h-5" /> },
  { id: 'Sunset', label: 'SUNSET', icon: <Sun className="w-5 h-5" /> },
  { id: 'Paris', label: 'PARIS', icon: <Coffee className="w-5 h-5" /> },
  { id: 'Resort', label: 'RESORT', icon: <Palmtree className="w-5 h-5" /> },
];

const OCCUPATIONS: { id: Occupation, label: string, icon: React.ReactNode }[] = [
  { id: 'Pop Star', label: 'Pop Icon', icon: <Mic2 className="w-5 h-5" /> },
  { id: 'CEO', label: 'Tech CEO', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'Supermodel', label: 'Model', icon: <Camera className="w-5 h-5" /> },
  { id: 'Professor', label: 'Professor', icon: <Box className="w-5 h-5" /> },
  { id: 'Athlete', label: 'Athlete', icon: <Trophy className="w-5 h-5" /> },
  { id: 'Artist', label: 'Artist', icon: <Palette className="w-5 h-5" /> },
  { id: 'Astronaut', label: 'Astronaut', icon: <Rocket className="w-5 h-5" /> },
];

const ExploreView: React.FC<ExploreViewProps> = ({ lang = 'en', profile, items = [], onUseCredit, onPaywall }) => {
  const [activeTool, setActiveTool] = useState<'restore' | 'identity' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  const [lastProcessedImage, setLastProcessedImage] = useState<string | null>(() => {
    return localStorage.getItem('glam_last_processed_image');
  });

  const [userRequest, setUserRequest] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<StyleVibe>('Studio');
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation>('Pop Star');
  const [processingIndex, setProcessingIndex] = useState(0);

  const [restoreState, setRestoreState] = useState<{ source: string | null, mode: RestorationMode }>({
    source: null,
    mode: 'portrait'
  });
  
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const RESTORE_STEPS = [
    "Analyzing Scene Geometry...",
    "Harmonizing Group Likeness...",
    "Typesetting Editorial Typography...",
    "Applying Ultra-HD Fidelity Pass..."
  ];

  const IDENTITY_STEPS = [
    "Mapping Facial Biometrics...",
    "Constructing Career Reality...",
    "Applying Couture Styling...",
    "Finalizing Visual Identity..."
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setProcessingIndex(0);
      interval = setInterval(() => {
        setProcessingIndex(prev => (prev + 1) % 4);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const resetLab = () => {
    setActiveTool(null);
    setIsProcessing(false);
    setResultImage(null);
    setUserRequest('');
    setRestoreState({ source: null, mode: 'portrait' });
  };

  const clearArchive = () => {
    setLastProcessedImage(null);
    localStorage.removeItem('glam_last_processed_image');
  };

  const checkCredits = () => {
    if (!profile) return false;
    if (!profile.is_premium && (profile.credits || 0) <= 0 && (profile.total_generations || 0) >= 15) {
      onPaywall();
      return false;
    }
    return true;
  };

  const handleRestore = async () => {
    if (!restoreState.source) return;
    if (!checkCredits()) return;

    setIsProcessing(true);
    try {
      await onUseCredit();
      const base64 = restoreState.source.split(',')[1];
      const enhanced = await restoreFashionImage(base64, restoreState.mode, userRequest, selectedVibe);
      
      setLastProcessedImage(enhanced);
      localStorage.setItem('glam_last_processed_image', enhanced);
      setResultImage(enhanced);
      
    } catch (e: any) {
      console.error(e);
      alert("Restoration failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIdentityShift = async () => {
    // Check credits before starting any processing
    if (!checkCredits()) return;

    setIsProcessing(true);
    try {
      // Determine the source image: user uploaded or profile avatar
      let sourceToUse = restoreState.source;
      if (!sourceToUse && profile?.avatar_url) {
        try {
          const avatarBase64 = await getBase64Data(profile.avatar_url);
          sourceToUse = `data:image/jpeg;base64,${avatarBase64}`;
        } catch (e) {
          console.error("Failed to load avatar", e);
        }
      }

      if (!sourceToUse) {
        alert("Please upload a photo or ensure your profile has an avatar.");
        setIsProcessing(false);
        return;
      }

      await onUseCredit();
      const base64 = sourceToUse.split(',')[1];
      const transformed = await generateOccupationImage(base64, selectedOccupation);
      
      setLastProcessedImage(transformed);
      localStorage.setItem('glam_last_processed_image', transformed);
      setResultImage(transformed);
      
    } catch (e: any) {
      console.error(e);
      alert("Identity shift failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadImage = async (img: string) => {
    const filename = `GlamAI-Editorial-${Date.now()}.png`;
    try {
      if (Capacitor.isNativePlatform()) {
        const base64Data = img.split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });
        await Share.share({ title: 'Save your GlamAI Result', url: savedFile.uri });
      } else {
        const link = document.body.appendChild(document.createElement('a'));
        link.href = img;
        link.download = filename;
        link.click();
        link.remove();
      }
    } catch (e) { console.error('Download failed:', e); }
  };

  return (
    <div className="flex-1 flex flex-col space-y-16 py-12 px-7 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-1000 bg-[#FBFBFB]">
      
      {/* High-Contrast Editorial Header */}
      <div className="relative">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-0.5 bg-zinc-900" />
            <span className="text-[11px] font-black text-zinc-900 uppercase tracking-[8px]">Protocol 5.6</span>
          </div>
          <h2 className="text-7xl font-black text-zinc-900 tracking-tighter leading-[0.8] uppercase italic">
            Editorial <br /> 
            <span className="text-[#26A69A] not-italic">Lab</span>
          </h2>
        </div>
      </div>

      {/* Tools Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <div className="flex items-center space-x-3">
              <Sparkles className="w-4 h-4 text-[#26A69A]" />
              <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-[4px]">Active Engines</h3>
           </div>
        </div>
        
        <div className="space-y-6">
          {/* HD Restore Card */}
          <div className="group relative">
             <button 
               onClick={() => setActiveTool('restore')} 
               className="w-full relative h-[220px] bg-zinc-900 rounded-[72px] overflow-hidden shadow-2xl transition-all active:scale-[0.97] group"
             >
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" />
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ImagePlus className="w-48 h-48 text-white" />
                </div>
                
                <div className="absolute inset-0 p-12 flex flex-col justify-between text-left">
                   <div className="space-y-4">
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                         <div className="w-2 h-2 bg-[#26A69A] rounded-full animate-pulse" />
                         <span className="text-[10px] font-black text-white uppercase tracking-[4px]">HD RESTORE V3.1</span>
                      </div>
                   
                   <div className="flex items-end justify-between">
                      <h5 className="text-4xl font-black text-white uppercase tracking-tight leading-[0.9]">Portrait <br/> Master</h5>
                      <div className="w-16 h-16 bg-[#26A69A] text-white rounded-[28px] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                         <Maximize2 className="w-6 h-6" />
                      </div>
                   </div>
                   </div>
                </div>
             </button>
          </div>

          {/* Identity Shifter Card */}
          <div className="group relative">
             <button 
               onClick={() => setActiveTool('identity')} 
               className="w-full relative h-[220px] bg-white border border-gray-100 rounded-[72px] overflow-hidden shadow-xl transition-all active:scale-[0.97] group"
             >
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-transparent" />
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                  <UserCog className="w-48 h-48 text-zinc-900" />
                </div>
                
                <div className="absolute inset-0 p-12 flex flex-col justify-between text-left">
                   <div className="space-y-4">
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-zinc-900 backdrop-blur-md rounded-full">
                         <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                         <span className="text-[10px] font-black text-white uppercase tracking-[4px]">IDENTITY LAB</span>
                      </div>
                   
                   <div className="flex items-end justify-between">
                      <h5 className="text-4xl font-black text-zinc-900 uppercase tracking-tight leading-[0.9]">Identity <br/> Shifter</h5>
                      <div className="w-16 h-16 bg-zinc-900 text-white rounded-[28px] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                         <UserCog className="w-6 h-6" />
                      </div>
                   </div>
                   </div>
                </div>
             </button>
          </div>
        </div>
      </section>

      {/* History Track - Conditionally displayed based on content */}
      {lastProcessedImage && (
        <section className="space-y-8 pt-12 border-t border-zinc-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                 <History className="w-5 h-5 text-zinc-900" />
                 <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[5px]">Lab History</h3>
              </div>
              <button onClick={clearArchive} className="text-[10px] font-black text-zinc-300 uppercase tracking-widest hover:text-red-500 transition-colors">Wipe Memory</button>
           </div>

           <div className="group relative aspect-[3/4] bg-white rounded-[80px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border-[16px] border-white transition-all duration-700">
              <img src={lastProcessedImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent flex flex-col justify-end p-12 opacity-0 group-hover:opacity-100 transition-all duration-500">
                 <div className="space-y-6">
                    <div className="flex flex-col space-y-2">
                       <span className="text-[10px] font-black text-[#26A69A] uppercase tracking-[5px]">Render Complete</span>
                       <h4 className="text-2xl font-black text-white uppercase tracking-tight">Campaign Asset</h4>
                    </div>
                    <button onClick={() => handleDownloadImage(lastProcessedImage)} className="w-full py-6 bg-white text-zinc-900 rounded-[32px] font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center space-x-3 active:scale-95 transition-all">
                       <Download className="w-5 h-5" />
                       <span>Save to Archive</span>
                    </button>
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Immersive Lab Studio Modal */}
      {activeTool && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-0 bg-white sm:p-5 sm:bg-black/60 sm:backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-white w-full h-full sm:max-w-sm sm:h-[92vh] sm:rounded-[72px] overflow-hidden shadow-2xl relative flex flex-col">
            
            {/* Header */}
            <div className="px-12 pt-16 pb-12 flex items-start justify-between bg-white z-10">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-zinc-900 tracking-tight leading-none italic uppercase">
                  {activeTool === 'restore' ? (
                    <><span className="font-bold">HD</span> <span className="text-[#26A69A] not-italic">RESTORE</span></>
                  ) : (
                    <><span className="font-bold">ID</span> <span className="text-amber-500 not-italic">SHIFT</span></>
                  )}
                </h2>
                <div className="flex items-center space-x-3">
                   <div className={`w-2.5 h-2.5 rounded-full ${activeTool === 'restore' ? 'bg-[#26A69A]' : 'bg-amber-500'}`} />
                   <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[6px]">
                     {activeTool === 'restore' ? 'GROUP PROTOCOL ENGINE' : 'CAREER LENS ENGINE'}
                   </span>
                </div>
              </div>
              <button onClick={resetLab} className="p-4 bg-gray-50 rounded-full active:scale-90 transition-transform">
                <X className="w-7 h-7 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 pt-0 space-y-16 custom-scrollbar pb-32">
              {isProcessing ? (
                <div className="py-24 flex flex-col items-center justify-center text-center space-y-16">
                  <div className="relative">
                    <div className={`w-40 h-40 border-2 border-zinc-100 rounded-full animate-spin ${activeTool === 'restore' ? 'border-t-[#26A69A]' : 'border-t-amber-500'}`} />
                    <Wand2 className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 animate-pulse ${activeTool === 'restore' ? 'text-[#26A69A]' : 'text-amber-500'}`} />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-md font-black text-zinc-900 uppercase tracking-[6px]">
                      {activeTool === 'restore' ? RESTORE_STEPS[processingIndex] : IDENTITY_STEPS[processingIndex]}
                    </h3>
                  </div>
                </div>
              ) : resultImage ? (
                <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500 py-4">
                   <div className="flex items-center space-x-2 px-4 py-1.5 bg-green-50 rounded-full border border-green-100">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Render Complete</span>
                   </div>

                   <div className="relative w-full aspect-[3/4] rounded-[48px] overflow-hidden shadow-2xl border-4 border-white group">
                     <img src={resultImage} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   </div>
                   
                   <div className="w-full space-y-3">
                     <button 
                        onClick={() => handleDownloadImage(resultImage)}
                        className="w-full py-6 bg-zinc-900 text-white font-black uppercase tracking-[4px] text-[11px] rounded-[32px] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3 hover:bg-[#26A69A]"
                     >
                       <Download className="w-5 h-5" />
                       <span>Save Asset</span>
                     </button>
                     <button 
                        onClick={resetLab}
                        className="w-full py-4 text-gray-400 font-black uppercase tracking-[3px] text-[10px] hover:text-gray-600 transition-colors"
                     >
                        Close Studio
                     </button>
                   </div>
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Source Asset Input */}
                  <div 
                    onClick={() => restoreInputRef.current?.click()} 
                    className="aspect-square bg-gray-50 rounded-[72px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center group cursor-pointer relative overflow-hidden transition-all hover:bg-gray-100/50"
                  >
                    {restoreState.source ? (
                      <img src={restoreState.source} className="w-full h-full object-cover" />
                    ) : (
                      activeTool === 'identity' && profile?.avatar_url ? (
                        <div className="w-full h-full relative">
                           <img src={profile.avatar_url} className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500" />
                           <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                              <span className="bg-white/90 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Using Profile Avatar</span>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-4">
                          <CameraIcon className="w-12 h-12 text-gray-200 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Select Target Shot</span>
                        </div>
                      )
                    )}
                  </div>
                  <input type="file" ref={restoreInputRef} onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onload = () => setRestoreState(prev => ({ ...prev, source: r.result as string })); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />

                  {/* Options Selector */}
                  <section className="space-y-10">
                    <div className="flex items-center space-x-4 px-1">
                       {activeTool === 'restore' ? <Sun className="w-6 h-6 text-[#26A69A]" /> : <UserCog className="w-6 h-6 text-amber-500" />}
                       <p className="text-[12px] font-black text-zinc-400 uppercase tracking-[8px]">
                         {activeTool === 'restore' ? 'EDITORIAL PALETTE' : 'CAREER LENS'}
                       </p>
                    </div>
                    
                    <div className="flex space-x-6 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
                       {activeTool === 'restore' ? (
                         STYLE_VIBES.map(vibe => {
                           const isActive = selectedVibe === vibe.id;
                           return (
                             <button 
                               key={vibe.id} 
                               onClick={() => setSelectedVibe(vibe.id)} 
                               className={`flex-shrink-0 flex flex-col items-center space-y-6 p-8 w-32 rounded-[64px] transition-all duration-300 ${
                                 isActive ? 'bg-zinc-900 text-white shadow-2xl scale-110 z-10' : 'bg-gray-50/50 text-zinc-300'
                               }`}
                             >
                               <div className={`p-3 rounded-2xl ${isActive ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                                  {vibe.icon}
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-[3px]">{vibe.label}</span>
                             </button>
                           );
                         })
                       ) : (
                         OCCUPATIONS.map(occ => {
                           const isActive = selectedOccupation === occ.id;
                           return (
                             <button 
                               key={occ.id} 
                               onClick={() => setSelectedOccupation(occ.id)} 
                               className={`flex-shrink-0 flex flex-col items-center space-y-6 p-8 w-32 rounded-[64px] transition-all duration-300 ${
                                 isActive ? 'bg-zinc-900 text-white shadow-2xl scale-110 z-10' : 'bg-gray-50/50 text-zinc-300'
                               }`}
                             >
                               <div className={`p-3 rounded-2xl ${isActive ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                                  {occ.icon}
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-[3px] text-center leading-tight">{occ.label}</span>
                             </button>
                           );
                         })
                       )}
                    </div>
                  </section>
                  
                  {/* Context & Execute */}
                  <div className="space-y-6">
                     {activeTool === 'restore' && (
                       <div className="bg-gray-50/50 p-8 rounded-[40px] border border-gray-100">
                          <textarea 
                             value={userRequest}
                             onChange={(e) => setUserRequest(e.target.value)}
                             placeholder="Editorial Notes (e.g Happy Birthday!)..."
                             className="w-full bg-transparent border-none p-0 text-sm font-serif italic text-zinc-500 outline-none placeholder:text-zinc-300 resize-none h-16"
                          />
                       </div>
                     )}
                     <button 
                        disabled={activeTool === 'restore' && !restoreState.source} 
                        onClick={activeTool === 'restore' ? handleRestore : handleIdentityShift}
                        className={`w-full py-8 text-white font-black uppercase tracking-[8px] text-[13px] rounded-[48px] active:scale-95 disabled:opacity-50 transition-all shadow-xl ${
                          activeTool === 'restore' ? 'bg-zinc-900' : 'bg-amber-500 shadow-amber-500/30'
                        }`}
                      >
                        {activeTool === 'restore' ? 'RUN STUDIO PASS' : 'ACTIVATE LENS'}
                     </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ExploreView;