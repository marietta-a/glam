import React from 'react';
import { Plus, Sparkles, Shirt, Camera, Wand2, ArrowRight } from 'lucide-react';
import { t } from '../services/i18n';
import BrandLogo from './BrandLogo';

interface EmptyWardrobeProps {
  onAdd: () => void;
  lang?: string;
}

const EmptyWardrobe: React.FC<EmptyWardrobeProps> = ({ onAdd, lang = 'en' }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-between p-6 pb-24 text-center animate-in fade-in duration-1000 relative overflow-hidden">
      
      {/* 1. Ambient Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-20%] w-72 h-72 bg-[#26A69A]/10 rounded-full blur-[64px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[-20%] w-72 h-72 bg-purple-200/20 rounded-full blur-[64px] animate-pulse delay-1000" />
      </div>

      {/* 2. Central Visual Stage - Takes up available space */}
      <div className="flex-1 w-full flex items-center justify-center relative min-h-[200px]">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            {/* Decorative Floating Icons */}
            <div className="absolute -top-4 -right-4 p-3 bg-white rounded-2xl shadow-xl shadow-teal-100 z-30 animate-bounce" style={{ animationDuration: '3s' }}>
            <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div className="absolute bottom-8 -left-8 p-3 bg-white rounded-2xl shadow-xl shadow-purple-100 z-30 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
            <Wand2 className="w-5 h-5 text-purple-400" />
            </div>

            {/* Card Stack Effect */}
            <div className="absolute inset-0 bg-gray-50 rounded-[40px] transform rotate-6 scale-90 opacity-60 border border-gray-100" />
            <div className="absolute inset-0 bg-gray-50 rounded-[40px] transform -rotate-3 scale-95 opacity-80 border border-gray-100" />
            
            {/* Main Card */}
            <div className="absolute inset-0 bg-white rounded-[40px] shadow-2xl shadow-teal-900/10 z-20 border border-white flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-gray-50 opacity-50" />
            
            <div className="relative z-10 scale-125 mb-6 transition-transform duration-700 group-hover:scale-110">
                <BrandLogo size="xl" />
            </div>
            
            {/* Skeleton UI Lines */}
            <div className="w-24 h-2 bg-gray-100 rounded-full mb-2" />
            <div className="w-16 h-2 bg-gray-50 rounded-full" />
            
            <div className="absolute bottom-6 flex items-center space-x-2 opacity-30">
                <Shirt className="w-4 h-4 text-gray-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Archive 001</span>
            </div>
            </div>
        </div>
      </div>

      {/* 3. Bottom Content Container */}
      <div className="w-full flex flex-col items-center space-y-8 relative z-10">
        
        {/* Text Content */}
        <div className="space-y-3 max-w-xs mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-[0.9] uppercase">
            Your Digital <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#26A69A] to-teal-600">Runway Awaits</span>
            </h2>
            <p className="text-gray-500 text-xs font-medium leading-relaxed px-4">
            Your archive is empty. Upload your first piece to unlock AI styling and virtual try-ons.
            </p>
        </div>

        {/* Hero Action Button */}
        <div className="w-full max-w-sm px-2">
            <button
            onClick={onAdd}
            className="w-full group bg-zinc-900 text-white p-1 rounded-[32px] shadow-2xl hover:shadow-[#26A69A]/20 transition-all duration-300 active:scale-95"
            >
            <div className="bg-zinc-900 border border-zinc-700 rounded-[28px] px-6 py-4 flex items-center justify-between relative overflow-hidden">
                {/* Button Shine Effect */}
                <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-12 group-hover:translate-x-[200%] transition-transform duration-1000" />
                
                <div className="flex items-center space-x-4 text-left relative z-10">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl group-hover:bg-[#26A69A] group-hover:text-white transition-colors duration-300">
                    <Camera className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-black text-sm leading-none uppercase tracking-widest">{t('add_piece', lang)}</p>
                    <p className="text-gray-400 group-hover:text-white/80 text-[9px] font-bold uppercase tracking-[1px] mt-0.5 transition-colors">
                    Initialize Archive
                    </p>
                </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
            </div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default EmptyWardrobe;