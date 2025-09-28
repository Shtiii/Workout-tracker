'use client';

import { forwardRef } from 'react';
import { Box, FormHelperText } from '@mui/material';

/**
 * AccessibleForm Component
 * Form with comprehensive accessibility features
 */
const AccessibleForm = forwardRef(({
  children,
  onSubmit,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  error,
  success,
  loading,
  ...props
}, ref) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!loading) {
      onSubmit?.(event);
    }
  };

  return (
    <Box
      ref={ref}
      component="form"
      onSubmit={handleSubmit}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      role="form"
      noValidate
      {...props}
    >
      {children}
      
      {/* Error Message */}
      {error && (
        <FormHelperText
          id={`${ariaDescribedBy}-error`}
          error
          role="alert"
          aria-live="polite"
        >
          {error}
        </FormHelperText>
      )}
      
      {/* Success Message */}
      {success && (
        <FormHelperText
          id={`${ariaDescribedBy}-success`}
          sx={{ color: 'success.main' }}
          role="status"
          aria-live="polite"
        >
          {success}
        </FormHelperText>
      )}
    </Box>
  );
});

AccessibleForm.displayName = 'AccessibleForm';

export default AccessibleForm;
