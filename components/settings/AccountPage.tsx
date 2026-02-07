import React, { useState, useEffect } from 'react';
import { Mail, Save, Loader2, PenTool, X, User, FileText, AlignLeft } from 'lucide-react';
import { UserProfile } from '../../types';
import { updateUserProfile } from '../../services/wardrobeService';

interface AccountPageProps {
  profile: UserProfile;
  email: string;
  onUpdate: (profile: UserProfile) => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ profile, email, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Local form state
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');

  // Reset form when profile changes or when cancelling edit
  useEffect(() => {
    if (!isEditing) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile, isEditing]);

  const handleUpdateDetails = async () => {
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
      setIsEditing(false); // Return to view mode on success
    } catch (e) {
      console.error("Failed to update profile", e);
      alert("Error saving details.");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      // If cancelling, logic handled by useEffect dependency on isEditing to reset values
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header with Toggle */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Identity</p>
        <button 
          onClick={toggleEdit}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
            isEditing 
              ? 'bg-red-50 text-red-500 hover:bg-red-100' 
              : 'bg-zinc-900 text-white hover:bg-black shadow-lg'
          }`}
        >
          {isEditing ? (
            <>
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <PenTool className="w-3 h-3" />
              <span>Edit</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-gray-50 rounded-[32px] p-6 space-y-6 border border-gray-100 relative overflow-hidden">
        
        {/* Read-only Email Field (Always Visible) */}
        <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Mail className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Active Email</span>
          </div>
          <span className="text-xs font-black text-gray-900 truncate max-w-[150px]">{email}</span>
        </div>
        
        {/* Dynamic Fields */}
        <div className="space-y-5">
          
          {/* Full Name */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 ml-1">
              <User className="w-3 h-3 text-gray-300" />
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
            </div>
            {isEditing ? (
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#26A69A]/20 transition-all shadow-sm"
              />
            ) : (
              <div className="w-full bg-white/50 border border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-700">
                 {fullName || <span className="text-gray-300 italic font-medium">Not set</span>}
              </div>
            )}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 ml-1">
              <FileText className="w-3 h-3 text-gray-300" />
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Username</label>
            </div>
            {isEditing ? (
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#26A69A]/20 transition-all shadow-sm"
              />
            ) : (
              <div className="w-full bg-white/50 border border-transparent rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-700">
                {username ? `@${username}` : <span className="text-gray-300 italic font-medium">Not set</span>}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 ml-1">
              <AlignLeft className="w-3 h-3 text-gray-300" />
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bio</label>
            </div>
            {isEditing ? (
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your style..."
                className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#26A69A]/20 transition-all h-24 resize-none shadow-sm"
              />
            ) : (
              <div className="w-full bg-white/50 border border-transparent rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-600 min-h-[60px] whitespace-pre-wrap leading-relaxed">
                {bio || <span className="text-gray-300 italic font-medium">No bio added yet.</span>}
              </div>
            )}
          </div>
        </div>
        
        {/* Action Button - Only visible in Edit Mode */}
        {isEditing && (
          <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button 
              onClick={handleUpdateDetails}
              disabled={isUpdating}
              className="w-full py-4 bg-[#26A69A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-500/20 flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-[#208a80]"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;