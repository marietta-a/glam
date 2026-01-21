
import React from 'react';
import { Shirt, Sparkles, Plus, Compass } from 'lucide-react';
import { ViewType } from '../types';
import { t } from '../services/i18n';

interface BottomNavProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onAddClick: () => void;
  isStyling?: boolean;
  hasBackgroundTasks?: boolean;
  lang?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ 
  activeView, 
  onViewChange, 
  onAddClick, 
  isStyling = false,
  hasBackgroundTasks = false,
  lang = 'en'
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-gray-100 px-4 pt-3 pb-8 flex items-center justify-around z-[100] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
      {/* Wardrobe Tab */}
      <button 
        onClick={() => onViewChange('wardrobe')}
        className={`flex flex-col items-center space-y-1.5 px-3 py-1 rounded-2xl transition-all relative flex-1 ${
          activeView === 'wardrobe' 
            ? 'text-[#26A69A]' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className={`p-2 rounded-xl transition-all ${activeView === 'wardrobe' ? 'bg-[#26A69A]/10' : ''}`}>
          <Shirt className="w-5 h-5" />
        </div>
        <span className="font-black text-[8px] uppercase tracking-widest leading-none">{t('wardrobe', lang)}</span>
        {hasBackgroundTasks && activeView !== 'wardrobe' && (
          <div className="absolute top-1.5 right-1/3">
            <div className="w-1.5 h-1.5 bg-[#26A69A] rounded-full border border-white animate-pulse" />
          </div>
        )}
      </button>

      {/* Discovery Tab */}
      <button 
        onClick={() => onViewChange('explore')}
        className={`flex flex-col items-center space-y-1.5 px-3 py-1 rounded-2xl transition-all relative flex-1 ${
          activeView === 'explore' 
            ? 'text-[#26A69A]' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className={`p-2 rounded-xl transition-all ${activeView === 'explore' ? 'bg-[#26A69A]/10' : ''}`}>
          <Compass className="w-5 h-5" />
        </div>
        <span className="font-black text-[8px] uppercase tracking-widest leading-none">{t('discovery', lang)}</span>
      </button>

      {/* Central Add Button - The Action Trigger */}
      <div className="flex-1 flex justify-center -mt-10 px-2">
        <button 
          onClick={onAddClick}
          className="w-14 h-14 bg-zinc-900 text-white rounded-[22px] shadow-2xl shadow-teal-900/20 flex items-center justify-center hover:bg-[#26A69A] hover:scale-110 active:scale-90 transition-all duration-300 border-[6px] border-[#F7F9FA]"
          title={t('add_piece', lang)}
        >
          <Plus className="w-6 h-6" strokeWidth={3} />
        </button>
      </div>

      {/* Stylist Tab */}
      <button 
        onClick={() => onViewChange('outfits')}
        className={`flex flex-col items-center space-y-1.5 px-3 py-1 rounded-2xl transition-all relative flex-1 ${
          activeView === 'outfits' 
            ? 'text-[#26A69A]' 
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className={`p-2 rounded-xl transition-all ${activeView === 'outfits' ? 'bg-[#26A69A]/10' : ''}`}>
          <Sparkles className={`w-5 h-5 ${isStyling ? 'animate-pulse' : ''}`} />
        </div>
        <span className="font-black text-[8px] uppercase tracking-widest leading-none">{t('stylist', lang)}</span>
        {isStyling && (
          <div className="absolute top-1.5 right-1/3">
            <div className="w-1.5 h-1.5 bg-[#26A69A] rounded-full border border-white animate-bounce" />
          </div>
        )}
      </button>
    </nav>
  );
};

export default BottomNav;
