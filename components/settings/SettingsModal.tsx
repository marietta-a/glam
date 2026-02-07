import React, { useState } from 'react';
import { 
  X, Trash2, ShieldCheck, User, CreditCard, ChevronRight, ExternalLink 
} from 'lucide-react';
import { UserProfile } from '@/types';
import AccountPage from './AccountPage';
import SubscriptionPage from './SubscriptionPage';
import { t } from '@/services/i18n';

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

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, email, onClose, profile, onUpdate, onUpgrade 
}) => {
  const [activePage, setActivePage] = useState<SettingsPage>('overview');

  const lang = profile?.language || 'en';

  if (!isOpen || !profile) return null;

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
      
      {/* Danger Zone Link */}
      <div className="space-y-4 pt-4">
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
          
          {activePage === 'account' && (
            <AccountPage 
              profile={profile} 
              email={email} 
              onUpdate={onUpdate} 
            />
          )}
          
          {activePage === 'subscription' && (
            <SubscriptionPage 
              profile={profile} 
              onUpdate={onUpdate} 
              onUpgrade={() => { onClose(); onUpgrade?.(); }}
            />
          )}

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default SettingsModal;