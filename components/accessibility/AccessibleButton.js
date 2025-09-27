'use client';

import { forwardRef } from 'react';
import { Button } from '@mui/material';

/**
 * AccessibleButton Component
 * Enhanced button with comprehensive accessibility features
 */
const AccessibleButton = forwardRef(({
  children,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  ariaPressed,
  ariaCurrent,
  role,
  tabIndex,
  onKeyDown,
  disabled,
  loading,
  loadingText = 'Loading...',
  ...props
}, ref) => {
  const handleKeyDown = (event) => {
    // Handle Enter and Space key presses for better accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      if (!disabled && !loading) {
        event.preventDefault();
        props.onClick?.(event);
      }
    }
    
    onKeyDown?.(event);
  };

  const buttonProps = {
    ref,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-pressed': ariaPressed,
    'aria-current': ariaCurrent,
    'aria-disabled': disabled || loading,
    role: role || 'button',
    tabIndex: disabled ? -1 : (tabIndex ?? 0),
    onKeyDown: handleKeyDown,
    disabled: disabled || loading,
    ...props
  };

  return (
    <Button {...buttonProps}>
      {loading ? loadingText : children}
    </Button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
