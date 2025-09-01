import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Dashboard: React.FC = () => {
  const { translate } = useLanguage();

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">{translate('dashboard')}</h1>
      
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {/* Recent Uploads Section */}
        <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">{translate('recentUploads')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Placeholder for recent uploads */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-32 md:h-40 flex items-center justify-center p-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base text-center">
                No recent uploads
              </p>
            </div>
          </div>
        </div>
        
        {/* Categories Section */}
        <div className="col-span-full">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">{translate('categories')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {/* Category Cards */}
            {['personal', 'bills', 'medical', 'insurance', 'other'].map((category) => (
              <div 
                key={category}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-4 hover:shadow-lg transition-shadow cursor-pointer touch-manipulation"
              >
                <div className="flex flex-col items-center justify-center h-24 md:h-32">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-2">
                    {/* Placeholder for category icon */}
                    <span className="text-primary-600 dark:text-primary-300 text-lg md:text-xl">📁</span>
                  </div>
                  <h3 className="text-sm md:text-lg font-medium text-center">{translate(category)}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
