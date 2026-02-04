import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface NetworkErrorModalProps {
  isOpen: boolean;
  onRetry: () => void;
  lang?: string;
}

const NetworkErrorModal: React.FC<NetworkErrorModalProps> = ({ isOpen, onRetry, lang = 'en' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-zinc-900/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 relative flex flex-col">
        
        {/* Decorative Header */}
        <div className="bg-zinc-900 p-8 pb-12 relative overflow-hidden">
           {/* Abstract grid pattern */}
           <div className="absolute inset-0 opacity-10" 
                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
           />
           
           <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-500/10 backdrop-blur-md rounded-[24px] flex items-center justify-center border border-red-500/20 shadow-xl relative">
                 <div className="absolute inset-0 rounded-[24px] border border-red-500/30 animate-pulse" />
                 <WifiOff className="w-8 h-8 text-red-500" />
              </div>
              <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tight">Connection Lost</h2>
                 <p className="text-[10px] font-black text-red-400 uppercase tracking-[3px] mt-1">
                    Boutique Offline
                 </p>
              </div>
           </div>
        </div>

        {/* Content Body */}
        <div className="p-8 pt-0 -mt-6 relative z-20 bg-white rounded-t-[40px]">
           <div className="pt-8 space-y-6 text-center">
              <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">
                 Our Stylometric Engine requires an active uplink to synchronize your archive. Please verify your connection.
              </p>

              <div className="space-y-3 pt-2">
                 <button 
                    onClick={onRetry}
                    className="w-full py-5 bg-zinc-900 text-white font-black uppercase tracking-[3px] text-[11px] rounded-[28px] shadow-xl hover:bg-[#26A69A] transition-all active:scale-95 flex items-center justify-center space-x-3"
                 >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reconnect</span>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkErrorModal;