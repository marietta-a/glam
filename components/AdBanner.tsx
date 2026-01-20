import React from 'react';
import { ExternalLink } from 'lucide-react';
import { t } from '../services/i18n';

const ADS = [
  {
    brand: "Lumière Luxe",
    title: "Summer Solstice Collection",
    cta: "Explore Silk",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400&auto=format&fit=crop"
  },
  {
    brand: "Noir Atelier",
    title: "The Architecture of Denim",
    cta: "Shop Now",
    image: "https://images.unsplash.com/photo-1541336032412-20242295ee32?q=80&w=400&auto=format&fit=crop"
  }
];

interface AdBannerProps {
  lang?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ lang = 'en' }) => {
  const ad = ADS[Math.floor(Math.random() * ADS.length)];

  return (
    <div className="w-full bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm mb-6 animate-in fade-in duration-1000">
      <div className="relative aspect-[16/7]">
        <img src={ad.image} alt="Sponsored" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-gray-500 border border-gray-100">
            {t('sponsored', lang)}
          </span>
        </div>
        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
          <div>
            <p className="text-[9px] font-black text-white uppercase tracking-[2px]">{ad.brand}</p>
            <h4 className="text-sm font-black text-white mt-0.5">{ad.title}</h4>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full text-[9px] font-black uppercase tracking-widest text-gray-900 shadow-xl">
            <span>{ad.cta}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;