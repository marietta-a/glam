
import React from 'react';
import { X, Settings as SettingsIcon, ShieldCheck, Shirt, ChevronRight, Crown, Sparkles, BookOpen, LogOut, Zap } from 'lucide-react';
import { t } from '../services/i18n';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsClick: () => void;
  onManualClick?: () => void;
  onLogout?: () => void;
  email: string;
  username?: string;
  isPremium?: boolean;
  onUpgrade?: () => void;
  lang?: string;
  credits?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onSettingsClick, 
  onManualClick,
  onLogout,
  email, 
  username,
  isPremium = false,
  onUpgrade,
  lang = 'en',
  credits = 0
}) => {
  return (
    <>
      <div 
        className={`fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div className={`fixed inset-y-0 left-0 z-[90] w-[280px] bg-white shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 pb-6 border-b border-gray-50">
            <div className="flex justify-between items-start mb-6">
              <div className="p-2 bg-teal-50 rounded-2xl relative">
                <Shirt className="w-6 h-6 text-[#26A69A]" />
                {isPremium && (
                  <div className="absolute -top-1 -right-1">
                    <Crown className="w-3 h-3 text-amber-500 fill-current" />
                  </div>
                )}
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {isPremium ? t('elite_owner', lang) : t('digital_boutique', lang)}
                </p>
                {isPremium && <Sparkles className="w-3 h-3 text-amber-500" />}
              </div>
              <p className="text-sm font-bold text-gray-900 truncate">
                {username || email}
              </p>
              {username && <p className="text-[10px] text-gray-400 truncate">{email}</p>}
              
              <div className="pt-4">
                 <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-xl">
                    <Zap className="w-3 h-3 text-[#26A69A]" />
                    <span className="text-[10px] font-black text-[#26A69A] uppercase tracking-widest">{credits} {t('credits_remaining', lang)}</span>
                 </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-2">
            {!isPremium && (
              <button 
                onClick={() => {
                  onUpgrade?.();
                  onClose();
                }}
                className="w-full mb-6 p-5 bg-zinc-900 rounded-3xl flex items-center justify-between text-white group hover:bg-[#26A69A] transition-all"
              >
                <div className="flex items-center space-x-4">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest">{t('purchase_credits', lang)}</p>
                    <p className="text-[9px] text-white/50 font-bold">Via Google Play</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-30 group-hover:translate-x-1 transition-all" />
              </button>
            )}

            <button 
              onClick={() => {
                onManualClick?.();
                onClose();
              }}
              className="w-full group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-98"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                </div>
                <span className="font-bold text-gray-700">{t('user_manual', lang)}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            <button 
              onClick={() => {
                onSettingsClick();
                onClose();
              }}
              className="w-full group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-98"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                  <SettingsIcon className="w-5 h-5 text-gray-400" />
                </div>
                <span className="font-bold text-gray-700">{t('settings', lang)}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>

            <div className="pt-4 pb-2 px-4">
              <div className="flex items-center space-x-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                <span>{t('secure_cloud', lang)}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                onLogout?.();
                onClose();
              }}
              className="w-full group flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 transition-all active:scale-98"
            >
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <span className="font-bold text-red-400">{t('logout', lang)}</span>
              </div>
            </button>
          </nav>

          <div className="p-8 mt-auto border-t border-gray-50">
            <p className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-[2px]">
              GlamWardrobe v1.2.0 (Elite)
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
