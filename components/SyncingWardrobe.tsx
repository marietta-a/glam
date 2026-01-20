import React, { useState, useEffect } from 'react';
import { UploadTask } from '../types';
import { CloudSync, Wand2, Sparkles, Shirt } from 'lucide-react';
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

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-1000 relative">
      {/* Editorial Decorative Stage */}
      <div className="relative w-full max-w-[320px] mb-12">
        <div className="aspect-[3/4] rounded-[56px] overflow-hidden bg-white shadow-2xl relative border-4 border-white transform -rotate-1 z-20">
          {tasks.map((task, idx) => (
            <div 
              key={task.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === activeIndex ? 'opacity-100' : 'opacity-0'}`}
            >
              {task.previewUrl ? (
                <img 
                  src={task.previewUrl} 
                  alt="Processing piece" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                  <Shirt className="w-12 h-12 text-gray-200 animate-pulse" />
                </div>
              )}
            </div>
          ))}
          
          {/* Scanning Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#26A69A]/10 to-[#26A69A]/5 z-10" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
             <div className="w-full h-24 bg-gradient-to-b from-transparent via-[#26A69A]/20 to-transparent absolute top-0 animate-scan-beam" />
          </div>
        </div>

        {/* Backdrop Stacks */}
        <div className="absolute top-6 left-6 right-[-20px] bottom-[-20px] bg-[#26A69A]/10 rounded-[56px] z-10 transform rotate-3 blur-md" />
        <div className="absolute -top-4 -right-4 z-30 bg-white p-5 rounded-[28px] shadow-xl border border-gray-100 flex items-center justify-center">
           <Wand2 className="w-6 h-6 text-[#26A69A] animate-pulse" />
        </div>
      </div>

      {/* Progress & Content */}
      <div className="text-center w-full max-w-[280px] space-y-6 relative z-30">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-tight mb-2">
            Cataloging <br />
            <span className="text-[#26A69A]">Your Pieces</span>
          </h2>
          <div className="h-6">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px] animate-in slide-in-from-bottom-2">
              {activeTask.status === 'analyzing' && 'Authenticating Silhouette...'}
              {activeTask.status === 'illustrating' && 'Digitizing Textures...'}
              {activeTask.status === 'saving' && 'Syncing Cloud Storage...'}
              {activeTask.status === 'complete' && 'Boutique Record Ready'}
              {activeTask.status === 'error' && 'Sync Interrupted'}
            </p>
          </div>
        </div>

        {/* High-End Style Progress Bar */}
        <div className="space-y-3">
           <div className="flex items-center justify-between px-2 text-[9px] font-black uppercase tracking-widest text-[#26A69A]">
              <span>Syncing Archive</span>
              <span>{Math.round(activeTask.progress)}%</span>
           </div>
           <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner p-0.5">
             <div 
               className="h-full bg-gradient-to-r from-[#26A69A]/80 to-[#26A69A] rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(38,166,154,0.4)]"
               style={{ width: `${Math.max(activeTask.progress, 5)}%` }}
             />
           </div>
        </div>

        {tasks.length > 1 && (
          <div className="flex justify-center space-x-1.5 pt-2">
            {tasks.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-500 ${i === activeIndex ? 'w-6 bg-[#26A69A]' : 'w-1 bg-gray-200'}`} 
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 flex items-center space-x-3 text-[9px] font-black text-gray-300 uppercase tracking-widest animate-pulse">
        <Sparkles className="w-3 h-3" />
        <span>Artificial Intelligence at Work</span>
      </div>

      <style>{`
        @keyframes scan-beam {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(400%); opacity: 0; }
        }
        .animate-scan-beam {
          animation: scan-beam 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SyncingWardrobe;