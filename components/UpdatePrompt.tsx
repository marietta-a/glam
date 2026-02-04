
import React, { useEffect, useState } from 'react';
import { Download, X, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';
import { checkForAppUpdate, openStore } from '../services/updateService';
import { t } from '../services/i18n';

interface UpdatePromptProps {
  lang?: string;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({ lang = 'en' }) => {
  const [showModal, setShowModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ storeUrl: string, latestVersion: string } | null>(null);

  useEffect(() => {
    // Check for updates on mount (app launch)
    const check = async () => {
      const result = await checkForAppUpdate();
      if (result && result.hasUpdate) {
        setUpdateInfo({ storeUrl: result.storeUrl, latestVersion: result.latestVersion });
        setShowModal(true);
      }
    };
    
    // Slight delay to not block initial render animation
    const timer = setTimeout(check, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    if (updateInfo?.storeUrl) {
      openStore(updateInfo.storeUrl);
      setShowModal(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 relative flex flex-col">
        
        {/* Decorative Header */}
        <div className="bg-zinc-900 p-8 pb-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-32 h-32 text-white" />
           </div>
           <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[24px] flex items-center justify-center border border-white/20 shadow-xl">
                 <Download className="w-8 h-8 text-[#26A69A]" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tight">{t('update_available', lang)}</h2>
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] mt-1">
                    {t('version', lang)} {updateInfo?.latestVersion}
                 </p>
              </div>
           </div>
        </div>

        {/* Content Body */}
        <div className="p-8 pt-0 -mt-6 relative z-20 bg-white rounded-t-[40px]">
           <div className="pt-8 space-y-6 text-center">
              <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">
                 {t('update_desc', lang)}
              </p>

              <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100 flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Optimized for iOS/Android</span>
                 </div>
                 <ShieldCheck className="w-4 h-4 text-[#26A69A]" />
              </div>

              <div className="space-y-3 pt-2">
                 <button 
                    onClick={handleUpdate}
                    className="w-full py-5 bg-[#26A69A] text-white font-black uppercase tracking-[3px] text-[11px] rounded-[28px] shadow-xl hover:bg-[#208a80] transition-all active:scale-95 flex items-center justify-center space-x-3"
                 >
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>{t('update_now', lang)}</span>
                 </button>
                 <button 
                    onClick={() => setShowModal(false)}
                    className="w-full py-4 text-gray-400 font-black uppercase tracking-[2px] text-[10px] hover:text-gray-600 transition-colors"
                 >
                    {t('remind_later', lang)}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
