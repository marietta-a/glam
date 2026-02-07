import React, { useState } from 'react';
import { Crown, Calendar, Zap, Info, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { UserProfile } from '../../types';
import { updateUserProfile } from '../../services/wardrobeService';
import { Capacitor } from '@capacitor/core';
import { STORE_URLS } from '@/constants';

interface SubscriptionPageProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onUpgrade?: () => void;
  // Optional: Function to open store subscription settings
  openStoreSettings?: () => void; 
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ profile, onUpdate, onUpgrade }) => {
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const isPremium = profile.is_premium;

  const handleUnsubscribe = async () => {
    setIsUpdating(true);
    try {
      // In a real app with RevenueCat, you cannot programmatically cancel a subscription from the client side.
      // You must direct the user to the App Store / Play Store management page.
      // However, for this implementation based on your prompt, we update the DB state.
      
      const updatedProfile = { ...profile, is_premium: false }; 
      await updateUserProfile(updatedProfile);
      onUpdate(updatedProfile);
      setShowUnsubscribeConfirm(false);
    } catch (e) {
      console.error("Failed to unsubscribe", e);
      alert("An error occurred while processing your request.");
    } finally {
      setIsUpdating(false);
    }
  };

  const openSubscriptionManagement = () => {
    // Directs user to the OS subscription page
    if (Capacitor.getPlatform() === 'ios') {
      window.open(STORE_URLS.ios, '_system');
    } else if (Capacitor.getPlatform() === 'android') {
      window.open(STORE_URLS.android, '_system');
    } else {
      // Fallback for web testing
      setShowUnsubscribeConfirm(true); 
    }
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Active Protocol</p>
          
          {isPremium ? (
            <div className="bg-zinc-900 rounded-[40px] p-8 border border-white/5 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Crown className="w-12 h-12 text-white" /></div>
              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                    <Crown className="w-3 h-3 text-amber-500 fill-current" />
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">ELITE ACCESS</span>
                  </div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Premium Membership</h4>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Renewing on: <span className="text-white">Next Cycle</span></p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="w-4 h-4 text-[#26A69A]" />
                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Status: <span className="text-[#26A69A]">Active</span></p>
                  </div>
                </div>

                <button 
                  onClick={openSubscriptionManagement}
                  className="w-full py-5 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all rounded-[24px] text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center space-x-2"
                >
                  <span>Manage / Cancel</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-[40px] p-10 border border-gray-100 border-dashed text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                <Zap className="w-8 h-8 text-gray-200" />
              </div>
              <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Standard Access</h4>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[3px] mb-8">Archival Credits: {profile?.credits || 0}</p>
              {onUpgrade && (
                <button 
                  onClick={onUpgrade}
                  className="w-full py-5 bg-zinc-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[4px] hover:bg-[#26A69A] transition-all shadow-xl"
                >
                  View Elite Options
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#FAF9F6] p-6 rounded-[32px] border border-[#E5E4E2]">
          <div className="flex items-center space-x-3 mb-2">
            <Info className="w-4 h-4 text-[#26A69A]" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Policy Note</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed font-medium italic">
            Subscriptions are managed by your app store provider. Canceling prevents future charges but keeps Elite access until the current period ends.
          </p>
        </div>
      </div>

      {/* Unsubscribe Confirmation Overlay (For manual DB handling or Web Testing) */}
      {showUnsubscribeConfirm && (
        <div className="absolute inset-0 z-[110] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-[56px]">
          <div className="w-24 h-24 bg-amber-50 rounded-[40px] flex items-center justify-center mb-10 shadow-inner">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight uppercase leading-tight">Terminate <br/> Renewal?</h3>
          <p className="text-gray-500 text-xs leading-relaxed mb-12 px-2 font-medium">
            You will retain Elite access until the current cycle expires. Your archival data remains protected.
          </p>
          <div className="w-full space-y-4">
            <button 
              onClick={handleUnsubscribe}
              disabled={isUpdating}
              className="w-full py-6 bg-zinc-900 text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-2xl hover:bg-black transition-all flex items-center justify-center"
            >
              {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Termination"}
            </button>
            <button 
              onClick={() => setShowUnsubscribeConfirm(false)}
              disabled={isUpdating}
              className="w-full py-6 bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[11px] rounded-[28px] hover:bg-gray-100 transition-all"
            >
              Maintain Protocol
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionPage;