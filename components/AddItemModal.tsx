import React, { useState, useRef } from 'react';
import { X, Upload, Globe, AlertCircle, Sparkles } from 'lucide-react';
import { t } from '../services/i18n';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartUpload: (images: string[]) => void;
  lang?: string;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onStartUpload, lang = 'en' }) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imagesToProcess: string[] = [];
    const filesArray = Array.from(files) as File[];

    try {
      for (const file of filesArray) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        imagesToProcess.push(base64);
      }
      
      onStartUpload(imagesToProcess);
      onClose();
    } catch (err: any) {
      setError("Failed to read image files.");
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    
    onStartUpload([imageUrl]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-gray-50 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t('add_pieces', lang)}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t('high_fidelity', lang)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex p-1.5 bg-gray-50 rounded-2xl">
              <button 
                onClick={() => setUploadMode('file')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadMode === 'file' ? 'bg-white shadow-md text-[#26A69A]' : 'text-gray-400'}`}
              >
                {t('gallery', lang)}
              </button>
              <button 
                onClick={() => setUploadMode('url')} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadMode === 'url' ? 'bg-white shadow-md text-[#26A69A]' : 'text-gray-400'}`}
              >
                {t('direct_link', lang)}
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="border-2 border-dashed border-gray-100 rounded-[40px] p-12 hover:border-[#26A69A]/40 hover:bg-teal-50/20 transition-all cursor-pointer text-center group"
              >
                <Upload className="w-8 h-8 text-[#26A69A] mx-auto mb-5 group-hover:scale-110 transition-transform duration-500" />
                <p className="font-bold text-gray-900 mb-1">{t('upload_archive', lang)}</p>
                <p className="text-gray-400 text-[10px] leading-relaxed uppercase tracking-widest font-black">{t('ai_background', lang)}</p>
              </div>
            ) : (
              <form onSubmit={handleUrlSubmit} className="space-y-4 py-2">
                <div className="relative">
                  <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="url" 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    placeholder="Source URL..." 
                    className="w-full bg-gray-50 border-none rounded-[24px] pl-16 pr-6 py-5 text-sm outline-none focus:ring-2 focus:ring-[#26A69A]/30 transition-all" 
                    required 
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[24px] shadow-lg active:scale-95 transition-all">
                  {t('sync_link', lang)}
                </button>
              </form>
            )}

            <div className="bg-teal-50/50 p-6 rounded-[32px] border border-teal-50 flex items-start space-x-4">
              <Sparkles className="w-5 h-5 text-[#26A69A] flex-shrink-0 mt-1" />
              <p className="text-[11px] text-[#26A69A] font-bold leading-relaxed">
                {t('cloud_msg', lang)}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 rounded-[20px] flex items-center space-x-3 text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
              </div>
            )}

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;