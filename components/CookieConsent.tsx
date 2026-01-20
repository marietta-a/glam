import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = document.cookie.split('; ').find(row => row.startsWith('glam_cookies_accepted='));
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Set cookie for 1 year
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `glam_cookies_accepted=true; expires=${expires.toUTCString()}; path=/`;
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-6 right-6 z-[100] animate-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white/80 backdrop-blur-2xl border border-gray-100 rounded-[32px] p-6 shadow-2xl flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#26A69A]/10 rounded-xl text-[#26A69A]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Privacy First</p>
              <h4 className="text-sm font-bold text-gray-900">Boutique Experience</h4>
            </div>
          </div>
          <button onClick={() => setIsVisible(false)} className="text-gray-300 hover:text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
          We use cookies to curate your personal style feed and ensure your cloud wardrobe remains synchronized across devices.
        </p>

        <button 
          onClick={handleAccept}
          className="w-full py-4 bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-[2px] rounded-2xl hover:bg-[#26A69A] transition-all active:scale-95 shadow-lg shadow-gray-200"
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;