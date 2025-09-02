import React from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { useLanguage } from '../../context/LanguageContext';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ isOpen, onClose }) => {
  const { settings, updateSetting, announceToScreenReader } = useAccessibility();
  const { translate: _ } = useLanguage();

  if (!isOpen) return null;

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    updateSetting(key, value);
    announceToScreenReader(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Accessibility Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close accessibility settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="high-contrast" className="text-sm font-medium text-gray-900 dark:text-white">
                High Contrast Mode
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Increase contrast for better visibility
              </p>
            </div>
            <button
              id="high-contrast"
              role="switch"
              aria-checked={settings.highContrast}
              onClick={() => handleSettingChange('highContrast', !settings.highContrast)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.highContrast ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Large Text */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="large-text" className="text-sm font-medium text-gray-900 dark:text-white">
                Large Text
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Increase text size for better readability
              </p>
            </div>
            <button
              id="large-text"
              role="switch"
              aria-checked={settings.largeText}
              onClick={() => handleSettingChange('largeText', !settings.largeText)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.largeText ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.largeText ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="reduced-motion" className="text-sm font-medium text-gray-900 dark:text-white">
                Reduced Motion
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Minimize animations and transitions
              </p>
            </div>
            <button
              id="reduced-motion"
              role="switch"
              aria-checked={settings.reducedMotion}
              onClick={() => handleSettingChange('reducedMotion', !settings.reducedMotion)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Screen Reader Mode */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="screen-reader" className="text-sm font-medium text-gray-900 dark:text-white">
                Screen Reader Optimized
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enhanced support for screen readers
              </p>
            </div>
            <button
              id="screen-reader"
              role="switch"
              aria-checked={settings.screenReaderMode}
              onClick={() => handleSettingChange('screenReaderMode', !settings.screenReaderMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.screenReaderMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.screenReaderMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Keyboard Navigation */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="keyboard-nav" className="text-sm font-medium text-gray-900 dark:text-white">
                Enhanced Keyboard Navigation
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Improved keyboard focus indicators
              </p>
            </div>
            <button
              id="keyboard-nav"
              role="switch"
              aria-checked={settings.keyboardNavigation}
              onClick={() => handleSettingChange('keyboardNavigation', !settings.keyboardNavigation)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.keyboardNavigation ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
