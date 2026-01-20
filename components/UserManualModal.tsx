import React from 'react';
import { X, Sparkles, Camera, Shirt, Wand2, Search, Zap, Layers, CheckCircle2, ImageIcon, Globe, Heart, PenTool, Eraser } from 'lucide-react';
import { t } from '../services/i18n';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
}

const ManualSection: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-4">
      <div className="p-2.5 bg-teal-50 rounded-xl text-[#26A69A]">
        {icon}
      </div>
      <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{title}</h3>
    </div>
    <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100/50 space-y-4">
      {children}
    </div>
  </div>
);

const Step: React.FC<{ num: string, text: string }> = ({ num, text }) => (
  <div className="flex items-start space-x-4">
    <span className="text-[10px] font-black text-[#26A69A] bg-white w-6 h-6 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">{num}</span>
    <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
  </div>
);

const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose, lang = 'en' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md h-[85vh] rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in duration-200 relative flex flex-col">
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('user_manual', lang)}</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{t('manual_subtitle', lang)}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12 pb-20">
          
          {/* Welcome Card */}
          <div className="bg-zinc-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#26A69A]/20 blur-3xl rounded-full" />
            <Sparkles className="w-8 h-8 text-[#26A69A] mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2 leading-none">The Future of <br/>Your Closet</h3>
            <p className="text-white/40 text-[11px] font-black uppercase tracking-[2px]">Version 1.2.0 (Elite Edition)</p>
          </div>

          <ManualSection icon={<Shirt className="w-5 h-5" />} title={t('boutique_archive_title', lang)}>
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">{t('boutique_archive_desc', lang)}</p>
              <Step num="01" text="Import items from your gallery or via direct link. The AI isolates garments automatically." />
              <Step num="02" text="Use the Wardrobe tabs to filter by category (Tops, Bottoms, Shoes, etc.)." />
              <Step num="03" text="Tap the Heart on any item to mark it as a 'Boutique Essential' for the stylist." />
            </div>
          </ManualSection>

          <ManualSection icon={<Camera className="w-5 h-5" />} title={t('identity_mirror_title', lang)}>
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">{t('identity_mirror_desc', lang)}</p>
              <Step num="01" text="Set your face in Profile or directly in the Stylist view when prompted." />
              <Step num="02" text="The AI uses this reference to ensure 100% fidelity during all outfit simulations." />
              <Step num="03" text="Maintain consistency: Profile face is used across all Stylist and Lab features." />
            </div>
          </ManualSection>

          <ManualSection icon={<PenTool className="w-5 h-5" />} title={t('dress_me', lang)}>
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">Perform high-fidelity couture replacement simulations using custom pieces.</p>
              <Step num="01" text="Select or upload your identity-locked avatar face." />
              <Step num="02" text="Add up to 4 clothing items from your boutique or gallery to replace current wear." />
              <Step num="03" text="Provide an optional 'Styling Request' to set the mood (e.g., 'Sunset glow', 'Vintage studio')." />
            </div>
          </ManualSection>

          <ManualSection icon={<Eraser className="w-5 h-5" />} title={t('restore_image', lang)}>
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">Upscale and enhance your fashion photography with specialized Vogue protocols.</p>
              <Step num="01" text="Upload an editorial source image requiring enhancement or restoration." />
              <Step num="02" text="Choose a mode: Portrait Pro (Beautify), Vogue Vintage (Archive Grain), or 50MP Upscale (Texture Rebuild)." />
              <Step num="03" text="Apply the protocol to remove backgrounds and apply professional editorial lighting." />
            </div>
          </ManualSection>

          <ManualSection icon={<Globe className="w-5 h-5" />} title={t('vogue_protocol_title', lang)}>
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">{t('vogue_protocol_desc', lang)}</p>
              <Step num="01" text="Choose an objective like 'Work' for luxury offices or 'Beach' for sunset resorts." />
              <Step num="02" text="The AI Stylist ensures silhouettes are modest, classy, and fashion-forward." />
              <Step num="03" text="Download results with the HD Archive button for high-fidelity offline viewing." />
            </div>
          </ManualSection>

          {/* Verification Footer */}
          <div className="pt-6 border-t border-gray-100 flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="w-8 h-8 text-[#26A69A]/30" />
            <p className="text-[10px] text-gray-300 font-black uppercase tracking-[3px]">Elite Mastery Verified</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManualModal;