import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Layers, Camera, Wand2 } from 'lucide-react';
import BrandLogo from './BrandLogo';

interface OnboardingViewProps {
  onFinish: () => void;
}

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
    subtitle: "The Archive",
    title: "Digitize Your\nWardrobe",
    desc: "Transform your physical closet into a high-fidelity digital asset. Upload, categorize, and organize with AI precision.",
    icon: <Layers className="w-6 h-6 text-white" />
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop",
    subtitle: "The Engine",
    title: "AI Personal\nStylist",
    desc: "Generate occasion-perfect outfits instantly. Our neural engine pairs textures and colors better than a human editor.",
    icon: <Wand2 className="w-6 h-6 text-white" />
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
    subtitle: "The Vision",
    title: "Virtual\nReality Try-On",
    desc: "Visualize any combination on your digital twin. Preserve your identity while exploring infinite style possibilities.",
    icon: <Camera className="w-6 h-6 text-white" />
  }
];

const OnboardingView: React.FC<OnboardingViewProps> = ({ onFinish }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000); // Auto-advance every 5 seconds
    return () => clearInterval(timer);
  }, [currentSlide]);

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
      setIsAnimating(false);
    }, 500); // Sync with CSS transition
  };

  const activeContent = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-[2000] bg-zinc-900 flex flex-col justify-end text-white overflow-hidden">
      
      {/* Background Slideshow */}
      {SLIDES.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
        >
          <img 
            src={slide.image} 
            className="w-full h-full object-cover scale-105 animate-slow-zoom" 
            alt="Onboarding Background" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent opacity-90" />
        </div>
      ))}

      {/* Top Brand Mark */}
      <div className="absolute top-12 left-0 right-0 flex justify-center z-20">
         <BrandLogo size="md" className="drop-shadow-2xl" />
      </div>

      {/* Skip Button */}
      <button 
        onClick={onFinish}
        className="absolute top-12 right-8 z-30 text-[10px] font-black uppercase tracking-[2px] text-white/50 hover:text-white transition-colors"
      >
        Skip Intro
      </button>

      {/* Content Container */}
      <div className="relative z-10 px-8 pb-12 w-full max-w-md mx-auto flex flex-col h-1/2 justify-end">
        
        {/* Animated Text Content */}
        <div className={`transition-all duration-500 transform ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              {activeContent.icon}
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
            <span className="text-[10px] font-black text-[#26A69A] uppercase tracking-[4px]">
              0{currentSlide + 1} / 0{SLIDES.length}
            </span>
          </div>

          <h2 className="text-5xl font-black text-white leading-[0.9] uppercase tracking-tight mb-4 whitespace-pre-line">
            {activeContent.title}
          </h2>
          
          <p className="text-sm text-gray-400 font-medium leading-relaxed mb-10 max-w-xs">
            {activeContent.desc}
          </p>
        </div>

        {/* Actions & Indicators */}
        <div className="flex flex-col space-y-8">
          
          {/* Progress Bars */}
          <div className="flex space-x-2">
            {SLIDES.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all duration-500 ${idx === currentSlide ? 'w-full' : 'w-0'}`} 
                />
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button 
            onClick={onFinish}
            className="group w-full py-5 bg-white text-zinc-900 rounded-[32px] font-black uppercase tracking-[3px] text-[11px] flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(38,166,154,0.4)]"
          >
            <Sparkles className="w-4 h-4 text-[#26A69A]" />
            <span>Dive into Wardrobe</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 10s ease-out infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default OnboardingView;