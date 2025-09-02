import React, { useRef, useEffect, useCallback } from 'react';

interface FocusManagerProps {
  children: React.ReactNode;
  restoreFocus?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
}

const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  restoreFocus = true,
  initialFocus
}) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Store the currently focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Set initial focus
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else if (containerRef.current) {
      // Focus the first focusable element in the container
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    // Cleanup function to restore focus
    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocus, initialFocus]);

  const handleContainerFocus = useCallback((event: React.FocusEvent) => {
    // Ensure focus stays within the container when needed
    if (!containerRef.current?.contains(event.target as Node)) {
      event.preventDefault();
      const firstFocusable = containerRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onFocus={handleContainerFocus}
    >
      {children}
    </div>
  );
};

export default FocusManager;
