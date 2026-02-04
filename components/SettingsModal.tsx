import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, ShieldX, Loader2, Settings as SettingsIcon, 
  Mail, Crown, AlertTriangle, Zap, CheckCircle2, 
  User, CreditCard, ChevronRight, ExternalLink,
  ShieldAlert, RefreshCw, Calendar,
  ShieldCheck, Info, Save, PenTool
} from 'lucide-react';
import { logoutUser, deleteAllUserData, updateUserProfile } from '../services/wardrobeService';
import { t } from '../services/i18n';
import { UserProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  userId: string;
  email: string;
  onClose: () => void;
  profile: UserProfile | null;
  onUpdate: (profile: UserProfile) => void;
  onUpgrade?: () => void;
}

type SettingsPage = 'overview' | 'account' | 'subscription';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, userId, email, onClose, profile, onUpdate, onUpgrade }) => {
  const [activePage, setActivePage] = useState<SettingsPage>('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  
  // Local state for editing account details
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const lang = profile?.language || 'en';
  const isPremium = profile?.is_premium || false;

  if (!isOpen) return null;

  const handleUpdateDetails = async () => {
    if (!profile) return;
    setIsUpdating(true);
    try {
      const updatedProfile = { 
        ...profile, 
        full_name: fullName, 
        username: username, 
        bio: bio 
      };
      await updateUserProfile(updatedProfile);
      onUpdate(updatedProfile);
      // Optional: show a small success indicator
    } catch (e) {
      console.error("Failed to update profile", e);
      alert("Error saving details.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!profile) return;
    setIsUpdating(true);
    try {
      const updatedProfile = { ...profile, is_premium: false }; 
      await updateUserProfile(updatedProfile);
      onUpdate(updatedProfile);
      setShowUnsubscribeConfirm(false);
      setActivePage('overview');
    } catch (e) {
      console.error("Failed to unsubscribe", e);
      alert("An error occurred while processing your request.");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setActivePage('account')}
          className="group flex items-center justify-between p-6 bg-gray-50 hover:bg-zinc-900 rounded-[32px] transition-all duration-500 text-left border border-gray-100"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-white/10 transition-colors">
              <User className="w-5 h-5 text-[#26A69A]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-zinc-500">Identity</p>
              <h4 className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tight">Account Management</h4>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-white transition-all group-hover:translate-x-1" />
        </button>

        <button 
          onClick={() => setActivePage('subscription')}
          className="group flex items-center justify-between p-6 bg-gray-50 hover:bg-zinc-900 rounded-[32px] transition-all duration-500 text-left border border-gray-100"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-white/10 transition-colors">
              <CreditCard className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-zinc-500">Access</p>
              <h4 className="text-sm font-black text-gray-900 group-hover:text-white uppercase tracking-tight">Subscription Management</h4>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-white transition-all group-hover:translate-x-1" />
        </button>
      </div>

      <div className="pt-6 border-t border-gray-50">
        <div className="bg-[#FAF9F6] p-6 rounded-[32px] border border-[#E5E4E2]">
          <div className="flex items-center space-x-3 mb-3">
            <ShieldCheck className="w-4 h-4 text-[#26A69A]" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Archive Security</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
            Your digital wardrobe is encrypted and stored in a private laboratory cloud. Access is restricted to your biometric credentials.
          </p>
        </div>
      </div>
    </div>
  );

  const renderAccountPage = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Account Identity Section */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Account Identity</p>
        <div className="bg-gray-50 rounded-[32px] p-6 space-y-5 border border-gray-100">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-[11px] font-bold text-gray-400 uppercase">Active Email</span>
            </div>
            <span className="text-sm font-black text-gray-900 truncate max-w-[180px]">{email}</span>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Name"
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#26A69A]/10 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#26A69A]/10 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Style description..."
                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#26A69A]/10 transition-all h-24 resize-none"
              />
            </div>
          </div>
          
          <button 
            onClick={handleUpdateDetails}
            disabled={isUpdating}
            className="w-full py-4 bg-[#26A69A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-500/10 flex items-center justify-center space-x-2"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Metadata</span>
          </button>
        </div>
      </div>

      {/* Elite Status Section */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Elite Status</p>
        <div className="bg-[#FAF9F6] rounded-[40px] p-8 border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
            <Zap className={`w-8 h-8 ${isPremium ? 'text-[#26A69A]' : 'text-gray-200'}`} />
          </div>
          <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
            {isPremium ? 'Elite Archive' : 'Standard Archive'}
          </h4>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white border border-gray-100 rounded-full mb-8">
             <RefreshCw className="w-3 h-3 text-[#26A69A]" />
             <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest">{profile?.credits || 0} Credits</span>
          </div>
          
          {!isPremium && onUpgrade && (
            <button 
              onClick={() => { onUpgrade(); onClose(); }}
              className="w-full py-5 bg-zinc-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[4px] hover:bg-black transition-all shadow-xl"
            >
              Upgrade Now
            </button>
          )}
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="space-y-4 pt-4">
        <p className="text-[10px] font-black text-red-300 uppercase tracking-widest px-2">Danger Zone</p>
        <div className="bg-red-50/50 rounded-[32px] p-6 border border-red-100">
           <a 
            href="https://marietta-a.github.io/glamai-legal/delete-account" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full group flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h4 className="text-sm font-black text-red-600 uppercase tracking-tight">Retire Account Forever</h4>
                <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider mt-0.5">Permanent archival erasure</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-red-300" />
          </a>
        </div>
      </div>
    </div>
  );

  const renderSubscriptionPage = () => (
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
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Renewing on: <span className="text-white">Next Billing Cycle</span></p>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="w-4 h-4 text-[#26A69A]" />
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Status: <span className="text-[#26A69A]">Active</span></p>
                </div>
              </div>

              <button 
                onClick={() => setShowUnsubscribeConfirm(true)}
                className="w-full py-5 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all rounded-[24px] text-[10px] font-black uppercase tracking-[3px]"
              >
                Terminate Renewal
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
                onClick={() => { onUpgrade(); onClose(); }}
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
          Upon unsubscription, your premium privileges remain active until the end of the current billing archival period. Your saved digital outfits will never be deleted.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[56px] overflow-hidden shadow-2xl animate-in zoom-in duration-200 relative flex flex-col max-h-[85vh]">
        
        {/* Navigation Header */}
        <div className="p-10 pb-6 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            {activePage !== 'overview' && (
              <button 
                onClick={() => setActivePage('overview')}
                className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                {activePage === 'overview' ? t('settings', lang) : 
                 activePage === 'account' ? 'Account' : 'Billing'}
              </h2>
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-[4px] mt-1">Laboratory Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Dynamic Content Body */}
        <div className="p-10 pt-4 overflow-y-auto custom-scrollbar flex-1 pb-16">
          {activePage === 'overview' && renderOverview()}
          {activePage === 'account' && renderAccountPage()}
          {activePage === 'subscription' && renderSubscriptionPage()}
        </div>

        {/* Confirmation Overlays */}
        {showUnsubscribeConfirm && (
          <div className="absolute inset-0 z-[110] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
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
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default SettingsModal;