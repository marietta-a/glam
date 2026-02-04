import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, User, Save, Loader2, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { updateUserProfile, compressImage, uploadWardrobeImage } from '../services/wardrobeService';
import { store } from '../services/storeService';
import { t } from '../services/i18n';

interface ProfileModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  lang?: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, userId, onClose, profile, onUpdate, lang = 'en' }) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  useEffect(() => {
    let interval: any;
    if (uploadingAvatar) {
      setUploadProgress(0);
      interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 98) return prev;
          return prev + Math.random() * 20;
        });
      }, 200);
    } else {
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 800);
    }
    return () => clearInterval(interval);
  }, [uploadingAvatar]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile(editedProfile);
      onUpdate(editedProfile);
      onClose();
    } catch (e) {
      console.error("Profile update failed:", e);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingAvatar(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const compressed = await compressImage(base64, 800, 0.7);
          const avatarUrl = await uploadWardrobeImage(userId, 'avatar', compressed);
          const updated = { ...editedProfile, avatar_url: avatarUrl };
          setEditedProfile(updated);
          // Auto-save avatar when changed
          await updateUserProfile({ id: userId, avatar_url: avatarUrl });
          onUpdate(updated);
          store.updateProfile(updated);
        };
        reader.readAsDataURL(file);
      } catch (e) {
        console.error("Avatar upload failed:", e);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[56px] overflow-hidden shadow-2xl animate-in zoom-in duration-200 relative flex flex-col">
        {/* Header */}
        <div className="p-10 pb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Style Identity</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] mt-1">Fashion Blueprint</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all active:scale-95">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-10 pt-4 flex flex-col items-center space-y-12 pb-16">
          <div className="relative">
            {/* Avatar Container with Gradient Glow */}
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#26A69A]/20 to-transparent rounded-[64px] animate-pulse" />
              <div className="absolute inset-2 bg-white rounded-[56px] flex items-center justify-center overflow-hidden border-2 border-teal-50 shadow-inner">
                {uploadingAvatar ? (
                  <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="w-10 h-10 text-[#26A69A] animate-spin" />
                    <span className="text-[10px] font-black text-[#26A69A] uppercase tracking-widest">{Math.round(uploadProgress)}%</span>
                  </div>
                ) : editedProfile.avatar_url ? (
                  <img src={editedProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gray-200" />
                )}
              </div>
            </div>

            {/* Camera Trigger */}
            {!uploadingAvatar && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-4 bg-white text-[#26A69A] rounded-2xl shadow-2xl border border-gray-50 hover:scale-110 transition-all active:scale-95"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-gray-50 rounded-full">
              <Sparkles className="w-3 h-3 text-[#26A69A]" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Biometric Recognition Locked</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed px-10">
              Update your facial reference to maintain 100% fidelity in digital simulations.
            </p>
          </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
      </div>
    </div>
  );
};

export default ProfileModal;