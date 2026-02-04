import React from 'react';
import { X, Sparkles, Camera, Shirt, Wand2, Search, Zap, Layers, CheckCircle2, ImageIcon, Globe, Heart, PenTool, Eraser, User, CreditCard, ShieldCheck } from 'lucide-react';
import { t } from '../services/i18n';

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

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
}

const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose, lang = 'en' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md h-[85vh] rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in duration-200 relative flex flex-col">
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('user_manual', lang)}</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Boutique Mastery Protocol</p>
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
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2 leading-none">Couture <br/> Intelligence</h3>
            <p className="text-white/40 text-[11px] font-black uppercase tracking-[2px]">System Firmware V1.5.0</p>
          </div>

          <ManualSection icon={<Shirt className="w-5 h-5" />} title="Digitizing Your Archive">
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">Your wardrobe is more than clothes; it is a digital archival dataset.</p>
              <Step num="01" text="Tap the '+' button to upload garments. AI automatically isolates the piece on a clean studio white background." />
              <Step num="02" text="Sort your archive by category using the header tabs. Items are automatically tagged by pattern and material." />
              <Step num="03" text="View individual technical blueprints by tapping any piece to see its warmth level and occasion suitability." />
            </div>
          </ManualSection>

          <ManualSection icon={<Camera className="w-5 h-5" />} title="Style Identity (Face Proxy)">
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">For high-fidelity simulations, our engine requires a clear facial reference.</p>
              <Step num="01" text="Access the Style Identity modal via the top profile icon to update your facial blueprint." />
              <Step num="02" text="This photo is purely for identity mapping during Try-on simulations. Ensure lighting is neutral." />
              <Step num="03" text="Changes here are locked to your biometric session for security." />
            </div>
          </ManualSection>

          <ManualSection icon={<Wand2 className="w-5 h-5" />} title="The Stylist Engine">
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">The Stylist coordinates your archive based on occasion logic.</p>
              <Step num="01" text="Select a Style Objective (Casual, Formal, etc.) to trigger the coordination algorithm." />
              <Step num="02" text="Simulate Reality: Tap this to see the items rendered onto your Style Identity avatar in an occasion-specific VR environment." />
              <Step num="03" text="Regenerate: If the first edit isn't right, refresh to explore alternative archival combinations." />
            </div>
          </ManualSection>

          <ManualSection icon={<ImageIcon className="w-5 h-5" />} title="The Editorial Lab">
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">Advanced restoration and creative manipulation for fashion photography.</p>
              <Step num="01" text="HD Restore: Upscale old outfit photos into 8K high-fashion campaign assets." />
              <Step num="02" text="Vibe Palette: Choose 'Old Money', 'Street Style', or 'Golden Hour' to shift the atmospheric relighting." />
              <Step num="03" text="Journaling: Add text notes (like 'Vogue Paris') to have them typeset into the image as typography." />
            </div>
          </ManualSection>

          <ManualSection icon={<ShieldCheck className="w-5 h-5" />} title="Boutique Management">
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium leading-relaxed italic">Control your account data and elite status in the Settings laboratory.</p>
              <Step num="01" text="Account Page: Update your public alias, full name, and style bio metadata." />
              <Step num="02" text="Billing Page: Manage your Elite access, monitor remaining credits, or terminate renewal protocols." />
              <Step num="03" text="Security: Request permanent archival erasure in the Danger Zone for GDPR/Privacy compliance." />
            </div>
          </ManualSection>

          {/* Verification Footer */}
          <div className="pt-6 border-t border-gray-100 flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="w-8 h-8 text-[#26A69A]/30" />
            <p className="text-[10px] text-gray-300 font-black uppercase tracking-[3px]">Protocol Mastery Verified</p>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default UserManualModal;