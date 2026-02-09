import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";
import { SplashScreen } from "@capacitor/splash-screen";

const BoutiqueLoader: React.FC<{ progress: { loaded: number, total: number, phase: number } }> = ({ progress }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const BOUTIQUE_LOADER_IMAGES = [
    { url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop", caption: "The Archive" },
    { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop", caption: "Vision" },
    { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop", caption: "Identity" }
  ];

  useEffect(() => {
    BOUTIQUE_LOADER_IMAGES.forEach(item => {
      const img = new Image();
      img.src = item.url;
    });

    const imgInterval = setInterval(() => setImgIndex(i => (i + 1) % BOUTIQUE_LOADER_IMAGES.length), 5000);
    return () => clearInterval(imgInterval);
  }, []);

  useEffect(() => {
    const hide = async () => {
      try { await SplashScreen.hide(); } catch (e) {}
    };
    const timer = setTimeout(hide, 1000);
    return () => clearTimeout(timer);
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

export default BoutiqueLoader;