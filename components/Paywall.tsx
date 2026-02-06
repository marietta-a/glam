import React, { useState, useEffect } from 'react';
import { Sparkles, Crown, X, Star, Calendar, Infinity, Loader2, ShieldCheck, AlertCircle, Zap, Coins } from 'lucide-react';
import { t } from '../services/i18n';
import { fetchCurrentOfferings, executePurchase, restorePurchases } from '../services/purchaseService';
import { PurchasesPackage, CustomerInfo, PACKAGE_TYPE } from '@revenuecat/purchases-capacitor';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseSuccess: (customerInfo: CustomerInfo) => void;
  lang?: string;
  totalGenerations?: number;
}

const Paywall: React.FC<PaywallProps> = ({ isOpen, onClose, onPurchaseSuccess, lang = 'en',  totalGenerations = 0}) => {
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch Packages from RevenueCat
  useEffect(() => {
    const loadOfferings = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      setErrorMsg(null);
      
      const offering = await fetchCurrentOfferings();
      
      if (offering && offering.availablePackages.length > 0) {
        setPackages(offering.availablePackages);
        
        // Auto-select "Annual" if available, otherwise the first option
        const annual = offering.availablePackages.find(p => p.identifier === 'glam_premium_yearly' || p.packageType === PACKAGE_TYPE.ANNUAL);
        setSelectedPackage(annual || offering.availablePackages[0]);
      } else {
        setErrorMsg("No offerings available from store.");
      }
      
      setLoading(false);
    };

    loadOfferings();
  }, [isOpen]);

  // 2. Handle Purchase Logic
  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsPurchasing(true);
    setErrorMsg(null);

    try {
      const customerInfo = await executePurchase(selectedPackage);
      
      if (customerInfo) {
        // --- LOGIC UPDATE FOR YOUR ENTITLEMENTS ---
        const activeEntitlements = customerInfo.entitlements.active;
        
        // Check for ANY valid entitlement from your list
        const isSubscribed = activeEntitlements['glam_premium_yearly'] || activeEntitlements['glam_premium_monthly'];
        
        // Check if it was a consumable purchase (Credit Packs)
        // Consumables usually don't leave an "active" entitlement forever, so we trust the transaction success
        const isConsumable = selectedPackage.identifier.includes('growth') || selectedPackage.identifier.includes('starter');

        if (isSubscribed || isConsumable) {
           onPurchaseSuccess(customerInfo);
           onClose();
        } else {
           // Fallback: If we can't verify entitlement but purchase didn't throw error
           console.warn("Purchase success but no entitlement found. ID:", selectedPackage.identifier);
           // Still trigger success for parent to handle credits
           onPurchaseSuccess(customerInfo); 
           onClose();
        }
      }
    } catch (e: any) {
      console.error("Purchase error", e);
      if (!e.userCancelled) {
        setErrorMsg("Purchase failed. Please try again.");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  // 3. Handle Restore
  const handleRestore = async () => {
    setIsPurchasing(true);
    setErrorMsg(null);
    
    try {
      const info = await restorePurchases();
      // Check your specific subscription entitlements
      if (info && (info.entitlements.active['glam_premium_yearly'] || info.entitlements.active['glam_premium_monthly'])) {
        onPurchaseSuccess(info);
        alert("Subscription restored successfully!");
        onClose();
      } else {
        alert("No active subscriptions found to restore.");
      }
    } catch (e) {
      console.error("Restore error", e);
      setErrorMsg("Failed to restore purchases.");
    } finally {
      setIsPurchasing(false);
    }
  };

  // Helper to get Icon and Label based on Package ID
  const getPackageDetails = (pkg: PurchasesPackage) => {
    const id = pkg.identifier;
    
    if (id.includes('yearly')) {
      return { icon: <Crown className="w-5 h-5" />, label: 'Yearly Membership', sub: 'Best Value' };
    }
    if (id.includes('monthly')) {
      return { icon: <Calendar className="w-5 h-5" />, label: 'Monthly Elite', sub: 'Flexible' };
    }
    if (id.includes('growth')) {
      return { icon: <Sparkles className="w-5 h-5" />, label: 'Growth Pack', sub: '200 Credits' };
    }
    if (id.includes('starter')) {
      return { icon: <Zap className="w-5 h-5" />, label: 'Starter Pack', sub: '59 Credits' };
    }
    // Fallback
    return { icon: <Coins className="w-5 h-5" />, label: pkg.product.title, sub: '' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-end sm:justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500 overflow-y-auto">
      <div className="w-full max-w-md bg-zinc-900 rounded-[56px] p-8 pb-10 shadow-2xl border border-white/5 relative flex flex-col items-center text-center animate-in slide-in-from-bottom-12 duration-700 my-auto">
        
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all rounded-2xl z-50 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Background Gradients */}
        <div className="absolute inset-0 rounded-[56px] overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#26A69A]/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full" />
        </div>

        {/* Icon */}
        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl relative z-10 mb-6">
          <Infinity className="w-8 h-8 text-[#26A69A]" />
        </div>

        {/* Header Text */}
        <div className="mb-8 relative z-10">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Boutique Access</h2>
          <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[2px] mt-3 px-4 leading-relaxed">
            Upgrade your digital wardrobe or top up credits instantly.
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="w-full mb-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">{errorMsg}</p>
          </div>
        )}

        {/* Packages List */}
        <div className="w-full space-y-4 mb-8 overflow-y-auto max-h-[45vh] no-scrollbar pr-1 pt-2 relative z-10">
          {loading ? (
            <div className="py-12 flex flex-col items-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#26A69A] animate-spin" />
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Connecting to Store...</p>
            </div>
          ) : packages.length > 0 ? (
            packages.map((pkg) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const details = getPackageDetails(pkg);
              
              return (
                <button 
                  key={pkg.identifier}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`w-full p-6 rounded-3xl border-2 transition-all relative text-left group ${
                    isSelected 
                      ? 'bg-white/5 border-[#26A69A] shadow-[0_0_20px_rgba(38,166,154,0.1)]' 
                      : 'bg-zinc-800/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Highlight Badge for Yearly */}
                  {pkg.identifier.includes('yearly') && (
                    <div className="absolute -top-3.5 right-6 bg-amber-500 px-4 py-1.5 rounded-full flex items-center space-x-1 shadow-lg z-20">
                      <Star className="w-2.5 h-2.5 text-white fill-current" />
                      <span className="text-[8px] font-black text-white uppercase tracking-widest">BEST VALUE</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2.5 rounded-xl transition-colors ${isSelected ? 'bg-[#26A69A] text-white' : 'bg-white/5 text-zinc-500'}`}>
                        {details.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
                          {details.sub}
                        </p>
                        <h4 className="text-sm font-bold text-white">
                          {details.label}
                        </h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-bold text-white">{pkg.product.priceString}</h4>
                      <p className="text-[8px] text-zinc-500 mt-0.5">
                        {pkg.packageType === PACKAGE_TYPE.ANNUAL ? '/ year' : pkg.packageType === PACKAGE_TYPE.MONTHLY ? '/ month' : 'one-time'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
             <div className="py-8 px-4 text-center border border-dashed border-zinc-700 rounded-3xl">
                <p className="text-zinc-500 text-xs mb-2">Store Connection Unavailable</p>
                <p className="text-[10px] text-zinc-600">Please ensure Google Play / App Store is configured.</p>
             </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4 pt-2 relative z-10">
          <button 
            onClick={handlePurchase}
            disabled={!selectedPackage || isPurchasing || loading}
            className="w-full py-6 bg-white text-black font-black uppercase tracking-[2px] text-[11px] rounded-[28px] shadow-2xl active:scale-95 transition-all flex flex-col items-center justify-center space-y-1 disabled:opacity-50 disabled:active:scale-100"
          >
            {isPurchasing ? (
               <div className="flex items-center space-x-2">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span>Processing...</span>
               </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>{selectedPackage?.identifier.includes('growth') || selectedPackage?.identifier.includes('starter') ? 'Add Credits' : t('unlock_access', lang)}</span>
              </div>
            )}
          </button>
          
          <div className="flex flex-col items-center space-y-3">
             <div className="flex items-center space-x-2 text-zinc-500">
                <ShieldCheck className="w-3 h-3 text-[#26A69A]" />
                <span className="text-[8px] font-black uppercase tracking-widest">Secured by Store</span>
             </div>
             <div className="flex justify-center space-x-6">
                <button 
                  onClick={handleRestore} 
                  disabled={isPurchasing}
                  className="text-[8px] text-zinc-600 font-black uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
                >
                  {t('restore_purchase', lang)}
                </button>
                <button className="text-[8px] text-zinc-600 font-black uppercase tracking-widest hover:text-white transition-colors">
                  {t('terms', lang)}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paywall;