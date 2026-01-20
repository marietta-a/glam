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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-4 py-3 flex items-center justify-around z-20">
      {/* Wardrobe Tab */}
      <button 
        onClick={() => onViewChange('wardrobe')}
        className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-2xl transition-all relative min-w-[80px] ${
          activeView === 'wardrobe' 
            ? 'text-[#26A69A]' 
            : 'text-gray-400 hover:bg-gray-50'
        }`}
      >
        <div className={`p-2 rounded-xl transition-all ${activeView === 'wardrobe' ? 'bg-[#26A69A]/10' : ''}`}>
          <Shirt className="w-5 h-5" />
        </div>
        <span className="font-black text-[9px] uppercase tracking-widest">{t('wardrobe', lang)}</span>
        {hasBackgroundTasks && activeView !== 'wardrobe' && (
          <div className="absolute top-2 right-6">
            <div className="w-2 h-2 bg-[#26A69A] rounded-full border border-white animate-pulse" />
          </div>
        )}
      </button>

      {/* Discovery / DressMe Tab */}
      <button 
        onClick={() => onViewChange('explore')}
        className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-2xl transition-all relative min-w-[80px] ${
          activeView === 'explore' 
            ? 'text-[#26A69A]' 
            : 'text-gray-400 hover:bg-gray-50'
        }`}
      >
        <div className={`p-2 rounded-xl transition-all ${activeView === 'explore' ? 'bg-[#26A69A]/10' : ''}`}>
          <Compass className="w-5 h-5" />
        </div>
        <span className="font-black text-[9px] uppercase tracking-widest">{t('discovery', lang)}</span>
      </button>

      {/* Stylist Tab */}
      <button 
        onClick={() => onViewChange('outfits')}
        className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-2xl transition-all relative min-w-[80px] ${
          activeView === 'outfits' 
            ? 'text-[#26A69A]' 
            : 'text-gray-400 hover:bg-gray-50'
        }`}
      >
        <div className={`p-2 rounded-xl transition-all ${activeView === 'outfits' ? 'bg-[#26A69A]/10' : ''}`}>
          <Sparkles className={`w-5 h-5 ${isStyling ? 'animate-pulse' : ''}`} />
        </div>
        <span className="font-black text-[9px] uppercase tracking-widest">{t('stylist', lang)}</span>
        {isStyling && (
          <div className="absolute top-2 right-6">
            <div className="w-2 h-2 bg-[#26A69A] rounded-full border border-white animate-bounce" />
          </div>
        )}
      </button>
    </nav>
  );
};

export default BottomNav;