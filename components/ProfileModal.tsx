import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, User, Save, Loader2, Sparkles, UserCircle, Shirt, LogOut } from 'lucide-react';
import { UserProfile } from '../types';
import { updateUserProfile, compressImage, uploadWardrobeImage, logoutUser } from '../services/wardrobeService';
import { t } from '../services/i18n';

const SectionHeader: React.FC<{ icon: React.ReactNode, title: string }> = ({ icon, title }) => (
  <div className="flex items-center space-x-4 text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
    <div className="p-1.5 bg-gray-50 rounded-lg flex items-center justify-center">{icon}</div>
    <span>{title}</span>
  </div>
);

const Field: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[11px] font-bold text-gray-500 ml-2 block">{label}</label>
    {children}
  </div>
);

interface ProfileModalProps {
  isOpen: boolean;
  userId: string;
  onClose: () => void;
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  lang?: string;
}

const STYLES = ['casual', 'formal', 'streetwear', 'vintage', 'minimalist', 'bohemian', 'preppy'];

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, userId, onClose, profile, onUpdate, lang = 'en' }) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

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

  const handleLogout = async () => {
    try {
      await logoutUser();
      onClose();
    } catch (err) {
      console.error("Logout failed:", err);
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
          const compressed = await compressImage(base64, 600, 0.6);
          const avatarUrl = await uploadWardrobeImage(userId, 'avatar', compressed);
          const updated = { ...editedProfile, avatar_url: avatarUrl };
          setEditedProfile(updated);
          await updateUserProfile({ id: userId, avatar_url: avatarUrl });
          onUpdate(updated);
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
      <div className="bg-white w-full max-w-md rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in duration-200 relative flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('style_identity', lang)}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Fashion Blueprint</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="p-3 bg-[#26A69A] text-white rounded-2xl shadow-lg shadow-teal-100 hover:bg-[#1d8278] transition-all active:scale-95 disabled:opacity-50"
              title={t('save_changes', lang)}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all active:scale-95">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[40px] overflow-hidden bg-gray-50 border-4 border-teal-50 flex items-center justify-center shadow-inner">
                {uploadingAvatar ? (
                  <Loader2 className="w-10 h-10 text-[#26A69A] animate-spin" />
                ) : editedProfile.avatar_url ? (
                  <img src={editedProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-200" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-3 bg-white text-[#26A69A] rounded-2xl shadow-xl border border-gray-100 hover:scale-110 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeader icon={<UserCircle className="w-4 h-4" />} title={t('basic_info', lang)} />
            <div className="grid grid-cols-1 gap-5">
               <Field label="Full Name">
                  <input 
                    type="text" 
                    value={editedProfile.full_name || ''} 
                    onChange={e => setEditedProfile({...editedProfile, full_name: e.target.value})}
                    className="profile-input"
                  />
               </Field>
               <Field label="Username">
                  <input 
                    type="text" 
                    value={editedProfile.username || ''} 
                    onChange={e => setEditedProfile({...editedProfile, username: e.target.value})}
                    className="profile-input"
                  />
               </Field>
               <Field label="Bio">
                  <textarea 
                    value={editedProfile.bio || ''} 
                    onChange={e => setEditedProfile({...editedProfile, bio: e.target.value})}
                    className="profile-input h-24 resize-none"
                  />
               </Field>
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeader icon={<Sparkles className="w-4 h-4" />} title={t('physical_blueprint', lang)} />
            <div className="grid grid-cols-2 gap-5">
               <Field label="Sex">
                  <select 
                    value={editedProfile.sex || ''} 
                    onChange={e => setEditedProfile({...editedProfile, sex: e.target.value as any})}
                    className="profile-input"
                  >
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
               </Field>
               <Field label="Age">
                  <input 
                    type="number" 
                    value={editedProfile.age || ''} 
                    onChange={e => setEditedProfile({...editedProfile, age: parseInt(e.target.value)})}
                    className="profile-input"
                  />
               </Field>
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeader icon={<Shirt className="w-4 h-4" />} title={t('style_prefs', lang)} />
            <div className="grid grid-cols-1 gap-5">
               <Field label="Preferred Style">
                  <select 
                    value={editedProfile.preferred_style || ''} 
                    onChange={e => setEditedProfile({...editedProfile, preferred_style: e.target.value})}
                    className="profile-input capitalize"
                  >
                    <option value="">Select</option>
                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </Field>
            </div>
          </div>

          {/* Session Management */}
          <div className="pt-10 border-t border-gray-50 pb-10">
            <button 
              onClick={handleLogout}
              className="w-full group flex items-center justify-center space-x-4 p-5 rounded-[28px] text-red-400 bg-red-50/50 hover:bg-red-50 transition-all active:scale-98"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-black uppercase tracking-widest text-[11px]">{t('logout', lang)}</span>
            </button>
          </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
      </div>

      <style>{`
        .profile-input {
          width: 100%;
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 20px;
          padding: 14px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          outline: none;
          transition: all 0.2s;
        }
        .profile-input:focus {
          background: white;
          border-color: #26A69A;
          box-shadow: 0 0 0 4px rgba(38, 166, 154, 0.05);
        }
      `}</style>
    </div>
  );
};

export default ProfileModal;