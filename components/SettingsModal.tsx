import React, { useState } from 'react';
import { X, Trash2, ShieldX, Loader2, Settings as SettingsIcon, Mail, Globe } from 'lucide-react';
import { logoutUser, deleteAllUserData } from '../services/wardrobeService';
import { t } from '../services/i18n';
import { UserProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  userId: string;
  email: string;
  onClose: () => void;
  profile: UserProfile | null;
  onUpdate: (profile: UserProfile) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, userId, email, onClose, profile, onUpdate }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const lang = profile?.language || 'en';

  if (!isOpen) return null;

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAllUserData(userId);
      await logoutUser();
      onClose();
    } catch (e) {
      console.error("Failed to delete account", e);
      alert("An error occurred while deleting your account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in duration-200 relative flex flex-col max-h-[90vh]">
        <div className="p-8 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-50 rounded-xl">
              <SettingsIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('settings', lang)}</h2>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">App Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          <div className="bg-gray-50 rounded-3xl p-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Mail className="w-5 h-5 text-[#26A69A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Email</p>
              <p className="text-sm font-bold text-gray-800 truncate">{email}</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-50 space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 text-red-300">Advanced</h4>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-4 text-red-400 text-xs font-bold rounded-2xl flex items-center justify-center space-x-2 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
            >
              <Trash2 className="w-4 h-4" />
              <span>Retire Account Forever</span>
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="absolute inset-0 z-[110] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center mb-8">
              <ShieldX className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Confirm Deletion</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-10 px-4">
              All digitalized pieces, AI metadata, and cloud storage will be permanently erased. <span className="font-bold text-red-500">This action is irreversible.</span>
            </p>
            <div className="w-full space-y-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full py-5 bg-red-500 text-white font-black uppercase tracking-widest text-[11px] rounded-[28px] shadow-xl shadow-red-100 hover:bg-red-600 transition-all flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Retire Boutique"}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full py-5 bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[11px] rounded-[28px] hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;