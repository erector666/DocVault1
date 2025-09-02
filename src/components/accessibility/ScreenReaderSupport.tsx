import React, { useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from './AccessibilityProvider';

interface ScreenReaderSupportProps {
  children: React.ReactNode;
  announcePageChanges?: boolean;
  announceErrors?: boolean;
  announceSuccess?: boolean;
}

const ScreenReaderSupport: React.FC<ScreenReaderSupportProps> = ({
  children,
  announcePageChanges = true,
  announceErrors = true,
  announceSuccess = true
}) => {
  const { settings } = useAccessibility();
  const pageAnnouncerRef = useRef<HTMLDivElement>(null);
  const errorAnnouncerRef = useRef<HTMLDivElement>(null);
  const successAnnouncerRef = useRef<HTMLDivElement>(null);

  // Helper function to announce messages
  const announceMessage = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.screenReaderMode) return;

    const announcer = priority === 'assertive' ? 
      errorAnnouncerRef.current : 
      pageAnnouncerRef.current;

    if (announcer) {
      announcer.textContent = message;
      
      // Clear after a delay to allow screen readers to announce
      setTimeout(() => {
        if (announcer) {
          announcer.textContent = '';
        }
      }, 1000);
    }
  }, [settings.screenReaderMode]);

  useEffect(() => {
    if (!settings.screenReaderMode) return;

    // Announce page changes
    if (announcePageChanges) {
      const pageTitle = document.title;
      announceMessage(`Page loaded: ${pageTitle}`, 'polite');
    }

    // Add ARIA landmarks if missing
    const main = document.querySelector('main');
    if (!main) {
      const mainContent = document.querySelector('#root > div');
      if (mainContent && !mainContent.getAttribute('role')) {
        mainContent.setAttribute('role', 'main');
        mainContent.setAttribute('aria-label', 'Main content');
      }
    }

    // Enhance form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (!label && input.getAttribute('placeholder')) {
          input.setAttribute('aria-label', input.getAttribute('placeholder') || '');
        }
      }
    });

    // Add descriptions to buttons without accessible names
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
        const icon = button.querySelector('svg, i, .icon');
        if (icon) {
          button.setAttribute('aria-label', 'Button');
        }
      }
    });
  }, [settings.screenReaderMode, announcePageChanges, announceMessage]);

  useEffect(() => {
    if (!settings.screenReaderMode) return;

    // Announce page changes
    if (announcePageChanges) {
      const pageTitle = document.title;
      announceMessage(`Page changed to: ${pageTitle}`, 'polite');
    }
  }, [settings.screenReaderMode, announcePageChanges, announceMessage]);

  // Listen for global error events
  useEffect(() => {
    if (!announceErrors) return;

    const handleError = (event: ErrorEvent) => {
      announceMessage('An error occurred. Please check the page for error messages.', 'assertive');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      announceMessage('A system error occurred. Please try again or contact support.', 'assertive');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [announceErrors, announceMessage]);

  // Listen for success events (custom events)
  useEffect(() => {
    if (!announceSuccess) return;

    const handleSuccess = (event: CustomEvent) => {
      announceMessage(event.detail.message || 'Operation completed successfully.', 'polite');
    };

    window.addEventListener('docvault:success', handleSuccess as EventListener);

    return () => {
      window.removeEventListener('docvault:success', handleSuccess as EventListener);
    };
  }, [announceSuccess, announceMessage]);

  // Monitor for dynamic content changes
  useEffect(() => {
    if (!settings.screenReaderMode) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Announce new error messages
              if (announceErrors && element.classList.contains('error')) {
                const errorText = element.textContent?.trim();
                if (errorText) {
                  announceMessage(`Error: ${errorText}`, 'assertive');
                }
              }
              
              // Announce success messages
              if (announceSuccess && element.classList.contains('success')) {
                const successText = element.textContent?.trim();
                if (successText) {
                  announceMessage(`Success: ${successText}`, 'polite');
                }
              }
              
              // Announce loading states
              if (element.getAttribute('aria-live') || element.classList.contains('loading')) {
                const loadingText = element.textContent?.trim();
                if (loadingText) {
                  announceMessage(loadingText, 'polite');
                }
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [settings.screenReaderMode, announceErrors, announceSuccess, announceMessage]);

  return (
    <div className={settings.screenReaderMode ? 'screen-reader-optimized' : ''}>
      {children}
      
      {/* Live regions for announcements */}
      <div
        ref={pageAnnouncerRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={errorAnnouncerRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={successAnnouncerRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Skip links */}
      {settings.screenReaderMode && (
        <>
          <div className="sr-only focus-within:not-sr-only">
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <a href="#navigation" className="skip-link">
              Skip to navigation
            </a>
            <a href="#search" className="skip-link">
              Skip to search
            </a>
          </div>
          
          {/* Page description for screen readers */}
          <div className="sr-only" aria-label="Page description">
            <h1>DocVault Document Management System</h1>
            <p>
              This page contains document management tools. 
              Use tab to navigate between elements, 
              or use the skip links to jump to specific sections.
            </p>
          </div>
        </>
      )}
      
      <style>{`
        .screen-reader-optimized {
          /* Enhanced styles for screen readers */
        }
        
        .screen-reader-optimized button:focus,
        .screen-reader-optimized input:focus,
        .screen-reader-optimized select:focus,
        .screen-reader-optimized textarea:focus,
        .screen-reader-optimized a:focus {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
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
        
        .focus-within\\:not-sr-only:focus-within {
          position: static;
          width: auto;
          height: auto;
          padding: 1rem;
          margin: 0;
          overflow: visible;
          clip: auto;
          white-space: normal;
          background: #1f2937;
          color: white;
          z-index: 9999;
        }
        
        .skip-link {
          display: inline-block;
          padding: 0.5rem 1rem;
          margin: 0.25rem;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 0.25rem;
        }
        
        .skip-link:hover,
        .skip-link:focus {
          background: #2563eb;
          outline: 2px solid white;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .screen-reader-optimized {
            --tw-text-opacity: 1;
            color: rgb(0 0 0 / var(--tw-text-opacity));
            background-color: rgb(255 255 255);
          }
          
          .screen-reader-optimized button,
          .screen-reader-optimized input,
          .screen-reader-optimized select {
            border: 2px solid #000;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .screen-reader-optimized * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ScreenReaderSupport;
