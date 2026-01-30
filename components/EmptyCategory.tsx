
import React from 'react';
import { Plus, PackageOpen, Shirt, ShoppingBag, Sparkles, Footprints, Layers } from 'lucide-react';
import { Category } from '../types';
import { t } from '../services/i18n';

interface EmptyCategoryProps {
  category: Category;
  onAdd: () => void;
  lang?: string;
}

const getCategoryIcon = (category: Category) => {
  switch (category) {
    case 'Tops': return <Shirt className="w-10 h-10" />;
    case 'Shoes': return <Footprints className="w-10 h-10" />;
    case 'Bags': return <ShoppingBag className="w-10 h-10" />;
    case 'Accessories': return <Sparkles className="w-10 h-10" />;
    default: return <PackageOpen className="w-10 h-10" />;
  }
};

const EmptyCategory: React.FC<EmptyCategoryProps> = ({ category, onAdd, lang = 'en' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-700">
      <div className="relative mb-8">
        {/* Decorative background rings */}
        <div className="absolute inset-0 bg-[#26A69A]/5 rounded-full scale-150 blur-2xl" />
        
        <div className="relative w-32 h-32 bg-white rounded-[40px] shadow-xl border border-gray-50 flex items-center justify-center text-gray-200">
          <div className="absolute inset-4 border-2 border-dashed border-gray-100 rounded-[28px]" />
          {getCategoryIcon(category)}
        </div>
        
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
          <Layers className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-2 mb-10">
        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
          No {category === 'All Items' ? 'Items' : category} Found
        </h3>
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[2px] max-w-[200px] mx-auto leading-relaxed">
          Your digital boutique archive for this section is currently empty.
        </p>
      </div>

      <button
        onClick={onAdd}
        className="group px-8 py-4 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:border-[#26A69A]/30 transition-all active:scale-95 flex items-center space-x-3"
      >
        <div className="p-1.5 bg-[#26A69A] text-white rounded-lg group-hover:rotate-90 transition-transform duration-500">
          <Plus className="w-3 h-3" strokeWidth={4} />
        </div>
        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
          Curate {category === 'All Items' ? 'Boutique' : category}
        </span>
      </button>
      
      <div className="mt-12 flex items-center space-x-2 opacity-20">
        <div className="w-1 h-1 bg-gray-400 rounded-full" />
        <div className="w-8 h-px bg-gray-400" />
        <div className="w-1 h-1 bg-gray-400 rounded-full" />
      </div>
    </div>
  );
};

export default EmptyCategory;
