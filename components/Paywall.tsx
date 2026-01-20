import React, { useState } from 'react';
import { Sparkles, Check, Crown, X, Star } from 'lucide-react';
import { t } from '../services/i18n';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'annual') => void;
  lang?: string;
}

const Paywall: React.FC<PaywallProps> = ({ isOpen, onClose, onSubscribe, lang = 'en' }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-end sm:justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="absolute top-8 right-8">
        <button onClick={onClose} className="p-3 text-white/30 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-sm bg-zinc-900 rounded-[56px] p-8 shadow-2xl border border-white/5 relative overflow-hidden flex flex-col items-center text-center animate-in slide-in-from-bottom-12 duration-700">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#26A69A]/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full" />

        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl relative z-10 mb-6">
          <Crown className="w-8 h-8 text-white" />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Boutique Elite</h2>
          <p className="text-[9px] text-amber-500 font-black uppercase tracking-[4px] mt-3">{t('trial_completed', lang)}</p>
        </div>

        <div className="w-full space-y-3 mb-8">
          <button 
            onClick={() => setSelectedPlan('annual')}
            className={`w-full p-5 rounded-3xl border-2 transition-all relative text-left ${
              selectedPlan === 'annual' 
                ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                : 'bg-zinc-800/50 border-white/5 hover:border-white/10'
            }`}
          >
            {selectedPlan === 'annual' && (
              <div className="absolute -top-3 right-6 bg-amber-500 px-3 py-1 rounded-full flex items-center space-x-1">
                <Star className="w-2.5 h-2.5 text-white fill-current" />
                <span className="text-[8px] font-black text-white uppercase tracking-widest">{t('best_value', lang)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">{t('annual_archive', lang)}</p>
                <h4 className="text-xl font-bold text-white">$24.00<span className="text-sm text-zinc-500 font-medium"> / year</span></h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest underline decoration-amber-500/50">{t('recap_33', lang)}</p>
                <p className="text-[9px] text-zinc-500 mt-1">$2.00 / month</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => setSelectedPlan('monthly')}
            className={`w-full p-5 rounded-3xl border-2 transition-all text-left ${
              selectedPlan === 'monthly' 
                ? 'bg-white/5 border-white/20' 
                : 'bg-zinc-800/50 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{t('monthly_edit', lang)}</p>
                <h4 className="text-xl font-bold text-white">$2.99<span className="text-sm text-zinc-500 font-medium"> / month</span></h4>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'monthly' ? 'border-[#26A69A] bg-[#26A69A]' : 'border-zinc-700'}`}>
                {selectedPlan === 'monthly' && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </button>
        </div>

        <div className="w-full space-y-4 pt-2">
          <button 
            onClick={() => onSubscribe(selectedPlan)}
            className="w-full py-6 bg-white text-black font-black uppercase tracking-[2px] text-[11px] rounded-[28px] shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('unlock_access', lang)}</span>
          </button>
          <div className="flex justify-center space-x-6">
            <button className="text-[8px] text-zinc-500 font-black uppercase tracking-widest hover:text-white transition-colors">{t('restore_purchase', lang)}</button>
            <button className="text-[8px] text-zinc-500 font-black uppercase tracking-widest hover:text-white transition-colors">{t('terms', lang)}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;