import React from 'react';
import { Plus, Sparkles, Shirt, Camera, Layers, Wand2, Globe } from 'lucide-react';
import { t } from '../services/i18n';
import BrandLogo from './BrandLogo';

interface EmptyWardrobeProps {
  onAdd: () => void;
  lang?: string;
}

const EmptyWardrobe: React.FC<EmptyWardrobeProps> = ({ onAdd, lang = 'en' }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
      
      {/* Editorial Decorative Section */}
      <div className="relative w-full max-w-[280px] h-64 mb-16">
        {/* Main large card */}
        <div className="absolute inset-0 bg-white rounded-[48px] shadow-2xl z-20 border border-gray-50 flex flex-col items-center justify-center transform rotate-[-2deg]">
          <div className="scale-125 mb-4">
             <BrandLogo size="lg" />
          </div>
          <div className="w-24 h-2 bg-gray-100 rounded-full mb-2" />
          <div className="w-16 h-2 bg-gray-50 rounded-full" />
        </div>
        
        {/* Staggered accent cards */}
        <div className="absolute top-4 left-8 right-[-10px] bottom-[-10px] bg-[#26A69A]/5 rounded-[48px] z-10 transform rotate-[4deg]" />
        
        {/* Floating AI badge */}
        {/* <div className="absolute -top-6 right-[-15px] z-30 bg-white p-4 rounded-3xl shadow-xl border border-gray-50 animate-bounce duration-[4000ms]">
          <Wand2 className="w-6 h-6 text-[#26A69A]" />
        </div> */}
      </div>

      {/* Content Section */}
      <div className="space-y-4 mb-14 relative z-10">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">
          Glam <br />
          <span className="text-[#26A69A]">{t('wardrobe', lang)}</span>
        </h2>
        <p className="text-gray-500 text-[15px] leading-relaxed max-w-[260px] mx-auto font-medium">
          Start your collection by uploading single items or an entire wardrobe shot.
        </p>
      </div>

      {/* Action Button */}
      <div className="w-full relative px-2">
        <button
          onClick={onAdd}
          className="w-full group bg-[#1a1a1a] text-white p-6 rounded-[36px] flex items-center justify-between hover:bg-[#26A69A] transition-all duration-500 active:scale-[0.98] relative overflow-hidden shadow-2xl"
        >
          <div className="flex items-center space-x-5 text-left">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl group-hover:bg-white group-hover:text-[#26A69A] transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-lg leading-none uppercase tracking-widest">{t('add_piece', lang)}</p>
              <p className="text-gray-400 group-hover:text-white/70 text-[10px] font-black uppercase tracking-[2px] mt-2 transition-colors">
                AI Auto-Detection Enabled
              </p>
            </div>
          </div>
          <Camera className="w-6 h-6 opacity-30 group-hover:opacity-100 transition-all mr-2" />
        </button>
      </div>
    </div>
  );
};

export default EmptyWardrobe;