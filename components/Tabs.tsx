
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
    <div className="bg-white px-8 border-b border-gray-100 overflow-x-auto no-scrollbar whitespace-nowrap">
      <div className="flex space-x-10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onTabChange(cat)}
            className={`py-5 text-base font-medium transition-all relative ${
              activeTab === cat 
                ? 'text-gray-900' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className={activeTab === cat ? 'font-bold' : 'font-medium'}>
              {cat === 'All Items' ? t('all_items', lang) : cat}
            </span>
            {activeTab === cat && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gray-900 rounded-t-full opacity-5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
