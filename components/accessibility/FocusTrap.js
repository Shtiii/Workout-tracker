'use client';

import { useEffect, useRef } from 'react';

/**
 * FocusTrap Component
 * Traps focus within a container for accessibility
 */
export default function FocusTrap({ 
  children, 
  active = true, 
  returnFocus = true,
  initialFocus 
}) {
  const containerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement;

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ');

      return Array.from(container.querySelectorAll(focusableSelectors))
        .filter(element => {
          const style = window.getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
    };

    const focusableElements = getFocusableElements();
    
    if (focusableElements.length === 0) return;

    // Set initial focus
    if (initialFocus) {
      const targetElement = container.querySelector(initialFocus);
      if (targetElement) {
        targetElement.focus();
      } else {
        focusableElements[0].focus();
      }
    } else {
      focusableElements[0].focus();
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;

      const currentIndex = focusableElements.indexOf(document.activeElement);
      
      if (event.shiftKey) {
        // Shift + Tab (backward)
        if (currentIndex <= 0) {
          event.preventDefault();
          focusableElements[focusableElements.length - 1].focus();
        }
      } else {
        // Tab (forward)
        if (currentIndex >= focusableElements.length - 1) {
          event.preventDefault();
          focusableElements[0].focus();
        }
      }
    };

    const handleFocusIn = (event) => {
      if (!container.contains(event.target)) {
        event.preventDefault();
        focusableElements[0].focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      
      // Restore focus to the previously focused element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, returnFocus, initialFocus]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}
