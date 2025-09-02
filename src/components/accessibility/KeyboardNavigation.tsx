import React, { useEffect, useRef } from 'react';
import { useAccessibility } from './AccessibilityProvider';

interface KeyboardNavigationProps {
  children: React.ReactNode;
  trapFocus?: boolean;
  autoFocus?: boolean;
  onEscape?: () => void;
}

const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  trapFocus = false,
  autoFocus = false,
  onEscape
}) => {
  const { settings } = useAccessibility();
  const containerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);
    firstFocusableRef.current = focusableElements[0] || null;
    lastFocusableRef.current = focusableElements[focusableElements.length - 1] || null;

    if (autoFocus && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!settings.keyboardNavigation) return;

    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;

      case 'Tab':
        if (trapFocus && containerRef.current) {
          const focusableElements = getFocusableElements(containerRef.current);
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            // Shift + Tab (backward)
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab (forward)
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
        }
        break;

      case 'ArrowDown':
      case 'ArrowUp':
        // Handle vertical navigation for lists and menus
        if (event.target instanceof HTMLElement) {
          const parent = event.target.closest('[role="menu"], [role="listbox"], .keyboard-nav-group');
          if (parent) {
            event.preventDefault();
            const focusableElements = getFocusableElements(parent as HTMLElement);
            const currentIndex = focusableElements.indexOf(event.target as HTMLElement);
            
            let nextIndex;
            if (event.key === 'ArrowDown') {
              nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
            } else {
              nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
            }
            
            focusableElements[nextIndex]?.focus();
          }
        }
        break;

      case 'Home':
        // Focus first element
        if (event.target instanceof HTMLElement) {
          const parent = event.target.closest('[role="menu"], [role="listbox"], .keyboard-nav-group');
          if (parent) {
            event.preventDefault();
            const focusableElements = getFocusableElements(parent as HTMLElement);
            focusableElements[0]?.focus();
          }
        }
        break;

      case 'End':
        // Focus last element
        if (event.target instanceof HTMLElement) {
          const parent = event.target.closest('[role="menu"], [role="listbox"], .keyboard-nav-group');
          if (parent) {
            event.preventDefault();
            const focusableElements = getFocusableElements(parent as HTMLElement);
            focusableElements[focusableElements.length - 1]?.focus();
          }
        }
        break;

      case 'Enter':
      case ' ':
        // Activate buttons and links with space/enter
        if (event.target instanceof HTMLElement) {
          const isButton = event.target.tagName === 'BUTTON' || event.target.getAttribute('role') === 'button';
          const isLink = event.target.tagName === 'A';
          
          if (isButton && event.key === ' ') {
            event.preventDefault();
            event.target.click();
          } else if ((isButton || isLink) && event.key === 'Enter') {
            event.preventDefault();
            event.target.click();
          }
        }
        break;
    }
  };

  const handleFocus = (event: React.FocusEvent) => {
    if (settings.keyboardNavigation && event.target instanceof HTMLElement) {
      // Add visual focus indicator for keyboard users
      event.target.classList.add('keyboard-focus');
    }
  };

  const handleBlur = (event: React.FocusEvent) => {
    if (event.target instanceof HTMLElement) {
      event.target.classList.remove('keyboard-focus');
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={settings.keyboardNavigation ? 'keyboard-navigation-enabled' : ''}
    >
      {children}
      
      {/* Skip link for keyboard users */}
      {settings.keyboardNavigation && (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>
      )}
      
      <style>{`
        .keyboard-navigation-enabled *:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .keyboard-focus {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        .focus\\:not-sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: inherit;
          margin: inherit;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
      `}</style>
    </div>
  );
};

export default KeyboardNavigation;
