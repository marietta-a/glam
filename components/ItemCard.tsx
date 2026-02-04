
import React from 'react';
import { WardrobeItem } from '../types';
import { Heart } from 'lucide-react';

interface ItemCardProps {
  item: WardrobeItem;
  onClick: (item: WardrobeItem) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  return (
    <div 
      onClick={() => onClick(item)}
      className="group relative bg-white rounded-3xl p-3 shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-teal-50 cursor-pointer"
    >
      <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center relative">
        <img 
          src={item.imageUrl} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {item.isFavorite && (
          <div className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl shadow-sm z-10">
            <Heart className="w-3.5 h-3.5 fill-current" />
          </div>
        )}
        {/* Fixed: Archival ID Overlay - using item.id as archivalId does not exist on WardrobeItem */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-[7px] font-black text-white uppercase tracking-widest">{item.id}</p>
        </div>
      </div>
      <div className="mt-4 px-1 flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-800 truncate tracking-tight">{item.name}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-[1.5px] mt-1 font-bold">{item.category}</p>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
