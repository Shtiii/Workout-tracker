'use client';

import { forwardRef } from 'react';
import { TextField, FormHelperText } from '@mui/material';

/**
 * AccessibleTextField Component
 * Text field with comprehensive accessibility features
 */
const AccessibleTextField = forwardRef(({
  label,
  helperText,
  error,
  required,
  disabled,
  ariaLabel,
  ariaDescribedBy,
  ariaRequired,
  ariaInvalid,
  inputProps = {},
  ...props
}, ref) => {
  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
  const helperTextId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  const accessibleInputProps = {
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy || (helperText ? helperTextId : undefined),
    'aria-required': ariaRequired ?? required,
    'aria-invalid': ariaInvalid ?? !!error,
    'aria-errormessage': error ? errorId : undefined,
    ...inputProps
  };

  return (
    <>
      <TextField
        ref={ref}
        label={label}
        helperText={helperText}
        error={!!error}
        required={required}
        disabled={disabled}
        inputProps={accessibleInputProps}
        FormHelperTextProps={{
          id: helperText ? helperTextId : undefined
        }}
        {...props}
      />
      
      {error && (
        <FormHelperText
          id={errorId}
          error
          role="alert"
          aria-live="polite"
        >
          {error}
        </FormHelperText>
      )}
    </>
  );
});

AccessibleTextField.displayName = 'AccessibleTextField';

export default AccessibleTextField;
