
import React, { useState, useRef, useEffect } from 'react';
import { User, Menu, ChevronDown, Zap, Crown, Sparkles } from 'lucide-react';
import { LANGUAGES } from '../services/i18n';

interface HeaderProps {
  onProfileClick: () => void;
  onMenuClick: () => void;
  title: string;
  profileImage: string | null;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  credits?: number;
  isPremium?: boolean;
}

const FLAG_MAP: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  ja: '🇯🇵'
};

const Header: React.FC<HeaderProps> = ({ 
  onProfileClick, 
  onMenuClick, 
  title, 
  profileImage, 
  currentLang, 
  onLanguageChange,
  credits = 0,
  isPremium = false
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-5 bg-white shadow-sm sticky top-0 z-[50] border-b border-gray-50">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
          title="Menu"
        >
          <Menu className="w-7 h-7" />
        </button>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="flex items-center space-x-1 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#26A69A]" />
          <span className="text-[10px] font-black uppercase tracking-[3px] text-[#26A69A]">
            DIGITAL WARDROBE
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Credits Badge */}
        <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all border ${
          isPremium 
            ? 'bg-zinc-900 border-zinc-800 text-amber-500 shadow-sm' 
            : 'bg-[#26A69A]/5 border-[#26A69A]/10 text-[#26A69A]'
        }`}>
          {isPremium ? (
            <Crown className="w-3 h-3 fill-current" />
          ) : (
            <Zap className="w-3 h-3 fill-current" />
          )}
          <span className="text-[10px] font-black tracking-[1px] leading-none">
            {isPremium ? 'ELITE' : credits}
          </span>
        </div>

        {/* Language Selection - Commented out for now
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center space-x-1 p-1 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
          >
            <span className="text-xl leading-none">{FLAG_MAP[currentLang] || '🌐'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-3 w-40 bg-white rounded-[24px] shadow-2xl border border-gray-100 py-3 z-[60] animate-in fade-in zoom-in duration-200">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code);
                    setIsLangOpen(false);
                  }}
                  className={`w-full px-5 py-3 flex items-center space-x-3 hover:bg-teal-50/50 transition-colors ${currentLang === lang.code ? 'text-[#26A69A]' : 'text-gray-600'}`}
                >
                  <span className="text-base leading-none">{FLAG_MAP[lang.code] || '🌐'}</span>
                  <span className={`text-[11px] font-black uppercase tracking-widest`}>
                    {lang.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        */}

        <button 
          onClick={onProfileClick}
          className="relative group focus:outline-none"
          title="Profile"
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#26A69A] border-2 border-white rounded-full" />
        </button>
      </div>
    </header>
  );
};

export default Header;
