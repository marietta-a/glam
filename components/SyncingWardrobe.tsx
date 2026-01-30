import React, { useState, useEffect } from 'react';
import { UploadTask } from '../types';
import { CloudSync, Wand2, Sparkles, Shirt, AlertTriangle, Download, Info } from 'lucide-react';
import { t } from '../services/i18n';

interface SyncingWardrobeProps {
  tasks: UploadTask[];
  lang?: string;
}

const SyncingWardrobe: React.FC<SyncingWardrobeProps> = ({ tasks, lang = 'en' }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTask = tasks[activeIndex] || tasks[0];

  useEffect(() => {
    if (tasks.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % tasks.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [tasks.length]);

  if (!activeTask) return null;

  const itemProgressText = activeTask.totalItemsInBatch 
    ? `Item ${activeTask.processedItemsInBatch || 0} of ${activeTask.totalItemsInBatch}`
    : 'Initializing...';

  const isError = activeTask.status === 'error';

  return (
    <div className="w-full flex flex-col items-center justify-center p-8 bg-white rounded-[48px] shadow-2xl border border-teal-50/50 animate-in fade-in slide-in-from-top-4 duration-1000 relative overflow-hidden">
      {/* Visual Priority: Active Processing Header */}
      <div className="absolute top-0 left-0 right-0 py-3 bg-zinc-900 flex items-center justify-center space-x-3 z-30">
        <div className="w-1.5 h-1.5 bg-[#26A69A] rounded-full animate-pulse" />
        <span className="text-[8px] font-black text-white uppercase tracking-[3px]">Active Archival Session</span>
        {tasks.length > 1 && (
          <span className="text-[8px] font-black text-[#26A69A] uppercase tracking-[2px] border-l border-white/10 pl-3">
            Queue: {tasks.length} Batches
          </span>
        )}
      </div>

      {/* Editorial Decorative Stage */}
      <div className="relative w-full max-w-[240px] mb-10 mt-6">
        <div className={`aspect-[3/4] rounded-[48px] overflow-hidden bg-white shadow-xl relative border-4 border-white transform -rotate-1 z-20 transition-all duration-500 ${isError ? 'border-red-50 shadow-red-100' : ''}`}>
          {tasks.map((task, idx) => (
            <div 
              key={task.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === activeIndex ? 'opacity-100' : 'opacity-0'}`}
            >
              {task.previewUrl && task.status !== 'error' ? (
                <img 
                  src={task.previewUrl} 
                  alt="Processing piece" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center ${isError ? 'bg-red-50/30' : 'bg-gray-50'}`}>
                  {task.status === 'error' ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                      <AlertTriangle className="w-10 h-10 text-red-400 animate-in zoom-in duration-300" />
                      <Download className="w-5 h-5 text-red-200 animate-bounce" />
                    </div>
                  ) : (
                    <Shirt className="w-10 h-10 text-gray-200 animate-pulse" />
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Enhanced Scanning Overlay Effect */}
          {!isError && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#26A69A]/5 to-[#26A69A]/10 z-10" />
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                 <div className="w-full h-32 bg-gradient-to-b from-transparent via-[#26A69A]/40 to-transparent absolute top-0 animate-scan-beam" />
              </div>
            </>
          )}
        </div>

        {/* Backdrop Stacks */}
        <div className={`absolute top-4 left-4 right-[-10px] bottom-[-10px] rounded-[48px] z-10 transform rotate-3 blur-sm transition-colors duration-500 ${isError ? 'bg-red-500/5' : 'bg-[#26A69A]/5'}`} />
      </div>

      {/* Progress & Content */}
      <div className="text-center w-full max-w-[280px] space-y-6 relative z-30">
        <div>
          <h2 className={`text-xl font-black tracking-tight uppercase leading-tight mb-2 transition-colors duration-500 ${isError ? 'text-red-500' : 'text-gray-900'}`}>
            {isError ? 'Archival \n Failure' : <>Cataloging <br /> <span className="text-[#26A69A]">New Arrivals</span></>}
          </h2>
          <div className="min-h-12 flex flex-col justify-center px-4">
            <p className={`text-[9px] font-black uppercase tracking-[1.5px] leading-relaxed animate-in slide-in-from-bottom-2 duration-500 ${isError ? 'text-red-600' : 'text-gray-400'}`}>
              {activeTask.status === 'analyzing' && 'Authenticating Silhouette Logic...'}
              {activeTask.status === 'illustrating' && 'Digitizing High-Fidelity Textures...'}
              {activeTask.status === 'saving' && 'Syncing Digital Boutique...'}
              {activeTask.status === 'complete' && 'Boutique Record Ready'}
              {activeTask.status === 'error' && (activeTask.errorMessage || 'Archive sync protocol error')}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`space-y-3 transition-opacity duration-300 ${isError ? 'opacity-30' : 'opacity-100'}`}>
           <div className="flex items-center justify-between px-2 text-[8px] font-black uppercase tracking-[2px] text-[#26A69A]">
              <span>{itemProgressText}</span>
              <span>{Math.round(activeTask.progress)}%</span>
           </div>
           <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden shadow-inner">
             <div 
               className="h-full bg-[#26A69A] rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(38,166,154,0.3)]"
               style={{ width: `${Math.max(activeTask.progress, 5)}%` }}
             />
           </div>
        </div>
      </div>

      {!isError && (
        <div className="mt-8 flex items-center space-x-3 text-[8px] font-black text-gray-300 uppercase tracking-widest animate-pulse">
          <Wand2 className="w-3 h-3" />
          <span>Throttled AI Engine Active</span>
        </div>
      )}

      <style>{`
        @keyframes scan-beam {
          0% { transform: translateY(-120%); opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(450%); opacity: 0; }
        }
        .animate-scan-beam {
          animation: scan-beam 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default SyncingWardrobe;