import React from 'react';
import { Category } from '../types';
import { CATEGORIES } from '../constants';
import { t } from '../services/i18n';

interface TabsProps {
  activeTab: Category;
  onTabChange: (category: Category) => void;
  lang?: string;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, lang = 'en' }) => {
  return (
    <div className="bg-white px-6 border-b border-gray-100 overflow-x-auto no-scrollbar whitespace-nowrap">
      <div className="flex space-x-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onTabChange(cat)}
            className={`py-4 text-sm font-medium transition-all relative ${
              activeTab === cat 
                ? 'text-[#26A69A]' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {cat === 'All Items' ? t('all_items', lang) : cat}
            {activeTab === cat && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#26A69A] rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;