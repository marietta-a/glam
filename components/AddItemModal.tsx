
import React, { useState, useRef } from 'react';
import { X, Upload, Globe, AlertCircle, Sparkles, Download, Loader2, Info } from 'lucide-react';
import { t } from '../services/i18n';
import { getBase64Data } from '../services/geminiService';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartUpload: (images: string[]) => void;
  lang?: string;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onStartUpload, lang = 'en' }) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [corsError, setCorsError] = useState(false);
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
    
    setIsVerifying(true);
    setCorsError(false);
    setError(null);

    try {
      // Pre-check the URL for CORS issues before closing the modal
      await getBase64Data(imageUrl);
      
      const urlToUpload = imageUrl;
      setImageUrl(''); 
      onStartUpload([urlToUpload]);
      onClose();
    } catch (err: any) {
      console.error("URL Verification Error:", err);
      if (err.message === "CORS_OR_NETWORK_ERROR" || err.message.includes("FETCH") || err.message.includes("UNABLE_TO_FETCH")) {
        setCorsError(true);
      } else {
        setError(err.message || "Archive sync error");
      }
    } finally {
      setIsVerifying(false);
    }
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
                onClick={() => { setUploadMode('file'); setCorsError(false); setError(null); }} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadMode === 'file' ? 'bg-white shadow-md text-[#26A69A]' : 'text-gray-400'}`}
              >
                {t('gallery', lang)}
              </button>
              <button 
                onClick={() => { setUploadMode('url'); setCorsError(false); setError(null); }} 
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
              <form onSubmit={handleUrlSubmit} className="space-y-5 py-2">
                <div className="relative">
                  <Globe className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isVerifying ? 'text-[#26A69A] animate-pulse' : 'text-gray-300'}`} />
                  <input 
                    type="url" 
                    value={imageUrl} 
                    onChange={(e) => { setImageUrl(e.target.value); setCorsError(false); setError(null); }} 
                    placeholder="Source URL..." 
                    disabled={isVerifying}
                    className="w-full bg-gray-50 border-none rounded-[24px] pl-16 pr-6 py-5 text-sm outline-none focus:ring-2 focus:ring-[#26A69A]/30 transition-all disabled:opacity-50" 
                    required 
                  />
                </div>

                {!corsError && !isVerifying && (
                  <div className="flex items-start space-x-3 px-4 py-3 bg-blue-50/50 rounded-2xl border border-blue-100/30 animate-in fade-in duration-700">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-blue-600/70 font-bold leading-relaxed uppercase tracking-wide">
                      Pro Tip: Some sites block direct sync. If a link fails, download the image and use your gallery for instant results.
                    </p>
                  </div>
                )}
                
                {corsError && (
                  <div className="bg-red-50 p-6 rounded-[32px] border border-red-100 flex flex-col items-center text-center animate-in slide-in-from-top-4 duration-500">
                    <div className="p-3 bg-white rounded-2xl shadow-sm mb-4">
                      <Download className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-[11px] text-red-600 font-bold leading-relaxed mb-2 uppercase tracking-wide">
                      Direct Sync Blocked
                    </p>
                    <p className="text-[10px] text-red-500/70 font-medium leading-relaxed italic">
                      This site restricts automated archival. For a flawless record, please download the image and upload it from your gallery.
                    </p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isVerifying}
                  className="w-full py-5 bg-[#26A69A] text-white font-black uppercase tracking-widest text-[11px] rounded-[24px] shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Archive...</span>
                    </>
                  ) : (
                    <span>{t('sync_link', lang)}</span>
                  )}
                </button>
              </form>
            )}

            {!corsError && !isVerifying && (
              <div className="bg-teal-50/50 p-6 rounded-[32px] border border-teal-50 flex items-start space-x-4">
                <Sparkles className="w-5 h-5 text-[#26A69A] flex-shrink-0 mt-1" />
                <p className="text-[11px] text-[#26A69A] font-bold leading-relaxed">
                  {t('cloud_msg', lang)}
                </p>
              </div>
            )}

            {error && !corsError && (
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
