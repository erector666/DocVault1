import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '../../context/SupabaseAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import MobileNavigation from './MobileNavigation';

interface MobileHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearchClick?: () => void;
  actions?: React.ReactNode;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  title, 
  showSearch = false, 
  onSearchClick,
  actions 
}) => {
  const location = useLocation();
  const { currentUser } = useSupabaseAuth();
  const { translate } = useLanguage();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const getPageTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return translate('nav.dashboard');
      case '/documents':
        return translate('nav.documents');
      case '/categories':
        return translate('nav.categories');
      case '/search':
        return translate('nav.search');
      case '/settings':
        return translate('nav.settings');
      default:
        return 'DocVault';
    }
  };

  return (
    <>
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Menu button and title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsNavOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {showSearch && (
              <button
                onClick={onSearchClick}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                aria-label="Search documents"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
            
            {actions}
            
            {/* User avatar */}
            {currentUser && (
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={isNavOpen} 
        onClose={() => setIsNavOpen(false)} 
      />
    </>
  );
};

export default MobileHeader;
