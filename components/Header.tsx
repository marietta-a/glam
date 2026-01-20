import React, { useState, useRef, useEffect } from 'react';
import { User, Menu, Globe, ChevronDown } from 'lucide-react';
import { LANGUAGES, LanguageCode } from '../services/i18n';
import BrandLogo from './BrandLogo';

interface HeaderProps {
  onProfileClick: () => void;
  onMenuClick: () => void;
  title: string;
  profileImage: string | null;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
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
  onLanguageChange 
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
    <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-[50] border-b border-gray-50">
      <div className="flex items-center space-x-2">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
          title="Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <BrandLogo size="sm" className="hidden sm:flex" />
      </div>
      
      <div className="flex flex-col items-center">
        <h1 className="text-base font-black text-gray-900 tracking-widest uppercase">
          {title}
        </h1>
        <div className="flex items-center space-x-1">
          <div className="w-1 h-1 bg-[#26A69A] rounded-full animate-pulse" />
          <span className="text-[7px] font-black text-[#26A69A] uppercase tracking-[3px]">Digital Boutique</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        {/* Language Selector */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center space-x-1 p-2 rounded-2xl hover:bg-gray-50 transition-all border border-transparent active:scale-95"
            title="Change Language"
          >
            <span className="text-lg leading-none">{FLAG_MAP[currentLang] || '🌐'}</span>
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-3 w-40 bg-white rounded-[24px] shadow-2xl border border-gray-100 py-3 z-[60] animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-2 mb-1">
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Select Language</p>
              </div>
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
                  <span className={`text-[11px] font-black uppercase tracking-widest ${currentLang === lang.code ? 'font-black' : 'font-bold'}`}>
                    {lang.name}
                  </span>
                  {currentLang === lang.code && (
                    <div className="ml-auto w-1 h-1 bg-[#26A69A] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile avatar */}
        <button 
          onClick={onProfileClick}
          className="relative group focus:outline-none ml-1"
          title="Profile"
        >
          <div className="w-9 h-9 rounded-full border-2 border-teal-50 bg-gray-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-[#26A69A]/30">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white border border-gray-100 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#26A69A] rounded-full" />
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;