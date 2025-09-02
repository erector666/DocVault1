import React from 'react';
import { DOCUMENT_CATEGORIES, DocumentCategory } from '../../services/aiService';

interface CategoryFilterProps {
  selectedCategory?: DocumentCategory | 'ALL';
  onCategoryChange: (category: DocumentCategory | 'ALL') => void;
  categoryStats?: Record<string, number>;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory = 'ALL',
  onCategoryChange,
  categoryStats = {}
}) => {
  const categories = [
    { key: 'ALL', label: 'All Documents', icon: '📁' },
    { key: DOCUMENT_CATEGORIES.PERSONAL, label: 'Personal', icon: '👤' },
    { key: DOCUMENT_CATEGORIES.BILLS, label: 'Bills & Utilities', icon: '💡' },
    { key: DOCUMENT_CATEGORIES.MEDICAL, label: 'Medical', icon: '🏥' },
    { key: DOCUMENT_CATEGORIES.LEGAL, label: 'Legal', icon: '⚖️' },
    { key: DOCUMENT_CATEGORIES.FINANCIAL, label: 'Financial', icon: '💰' },
    { key: DOCUMENT_CATEGORIES.WORK, label: 'Work & Business', icon: '💼' },
    { key: DOCUMENT_CATEGORIES.EDUCATION, label: 'Education', icon: '🎓' },
    { key: DOCUMENT_CATEGORIES.TRAVEL, label: 'Travel', icon: '✈️' },
    { key: DOCUMENT_CATEGORIES.INSURANCE, label: 'Insurance', icon: '🛡️' },
    { key: DOCUMENT_CATEGORIES.OTHER, label: 'Other', icon: '📄' }
  ];

  const getTotalCount = () => {
    return Object.values(categoryStats).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Filter by Category
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {categories.map((category) => {
          const count = category.key === 'ALL' 
            ? getTotalCount() 
            : categoryStats[category.key] || 0;
          
          const isSelected = selectedCategory === category.key;
          
          return (
            <button
              key={category.key}
              onClick={() => onCategoryChange(category.key as DocumentCategory | 'ALL')}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-all duration-200
                ${isSelected 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm font-medium truncate">{category.label}</span>
              </div>
              
              {count > 0 && (
                <span className={`
                  text-xs px-2 py-1 rounded-full
                  ${isSelected 
                    ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;
