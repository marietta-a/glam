
import React, { useState } from 'react';
import { Sparkles, Check, Crown, X, Star, CreditCard, ShieldCheck, Zap, Calendar, Infinity } from 'lucide-react';
import { t } from '../services/i18n';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (pack: 'starter' | 'growth' | 'pro' | 'premium_monthly' | 'premium_yearly') => void;
  lang?: string;
  totalGenerations?: number;
}

const Paywall: React.FC<PaywallProps> = ({ isOpen, onClose, onSubscribe, lang = 'en', totalGenerations = 0 }) => {
  const [selectedPack, setSelectedPack] = useState<'starter' | 'growth' | 'pro' | 'premium_monthly' | 'premium_yearly'>('premium_yearly');

  if (!isOpen) return null;

  const PACKS = [
    { 
      id: 'glam_premium_yearly', 
      name: 'Yearly Membership', 
      price: '$119.99/yr', 
      credits: 'Unlimited Yearly Access', 
      desc: 'Remove Daily Limits + No Ads',
      icon: <Crown className="w-5 h-5" />,
      highlight: true,
      tag: 'Best Value'
    },
    {  
      id: 'glam_premium_monthly', 
      name: 'Monthly Elite', 
      price: '$19.99/mo', 
      credits: 'Unlimited Monthly Access', 
      desc: 'Remove Daily Limits + No Ads',
      icon: <Calendar className="w-5 h-5" />,
      highlight: false
    },
    { 
      id: 'glam_growth', 
      name: t('growth_pack', lang), 
      price: '$8.99', 
      credits: '200 Credits', 
      desc: 'Refill Credits',
      icon: <Sparkles className="w-5 h-5" />
    },
    { 
      id: 'glam_starter', 
      name: t('starter_pack', lang), 
      price: '$2.99', 
      credits: '59 Credits', 
      desc: 'Refill Credits',
      icon: <Zap className="w-5 h-5" />
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[300] flex flex-col items-center justify-end sm:justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-zinc-900 rounded-[56px] p-8 pb-10 shadow-2xl border border-white/5 relative flex flex-col items-center text-center animate-in slide-in-from-bottom-12 duration-700 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button Inside Container - Enhanced Visibility */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full z-50 transition-all active:scale-90"
          aria-label="Close subscription view"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Absolute Background Elements with their own overflow containment */}
        <div className="absolute inset-0 rounded-[56px] overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#26A69A]/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full" />
        </div>

        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl relative z-10 mb-6 mt-4">
          <Infinity className="w-8 h-8 text-[#26A69A]" />
        </div>

        {/* Added pt-6 to the container to ensure "Best Value" badge isn't clipped */}
        <div className="w-full space-y-4 mb-8 overflow-y-auto max-h-[45vh] no-scrollbar pr-1 pt-6 relative z-10">
          {PACKS.map((pack) => (
            <button 
              key={pack.id}
              onClick={() => setSelectedPack(pack.id as any)}
              className={`w-full p-6 rounded-3xl border-2 transition-all relative text-left ${
                selectedPack === pack.id 
                  ? 'bg-white/5 border-[#26A69A] shadow-[0_0_20px_rgba(38,166,154,0.1)]' 
                  : 'bg-zinc-800/50 border-white/5 hover:border-white/10'
              }`}
            >
              {pack.highlight && (
                <div className="absolute -top-3.5 right-6 bg-amber-500 px-4 py-1.5 rounded-full flex items-center space-x-1 shadow-lg z-20">
                  <Star className="w-2.5 h-2.5 text-white fill-current" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">{pack.tag || 'Recommended'}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl ${selectedPack === pack.id ? 'bg-[#26A69A] text-white' : 'bg-white/5 text-zinc-500'}`}>
                    {pack.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{pack.name}</p>
                    <h4 className="text-sm font-bold text-white">{pack.credits}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold text-white">{pack.price}</h4>
                  <p className="text-[8px] text-zinc-500 mt-0.5">{pack.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="w-full space-y-4 pt-2 relative z-10">
          <button 
            onClick={() => onSubscribe(selectedPack)}
            className="w-full py-6 bg-white text-black font-black uppercase tracking-[2px] text-[11px] rounded-[28px] shadow-2xl active:scale-95 transition-all flex flex-col items-center justify-center space-y-1"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>{t('unlock_access', lang)}</span>
            </div>
          </button>
          
          <div className="flex flex-col items-center space-y-3">
             <div className="flex items-center space-x-2 text-zinc-500">
                <ShieldCheck className="w-3 h-3 text-[#26A69A]" />
                <span className="text-[8px] font-black uppercase tracking-widest">{t('google_pay_secure', lang)}</span>
             </div>
             <div className="flex justify-center space-x-6">
                <button className="text-[8px] text-zinc-600 font-black uppercase tracking-widest hover:text-white transition-colors">{t('restore_purchase', lang)}</button>
                <button className="text-[8px] text-zinc-600 font-black uppercase tracking-widest hover:text-white transition-colors">{t('terms', lang)}</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
