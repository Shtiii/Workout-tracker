'use client';

import { useEffect, useRef } from 'react';
import { Modal, Box, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * AccessibleModal Component
 * Modal with comprehensive accessibility features
 */
export default function AccessibleModal({
  open,
  onClose,
  title,
  children,
  ariaLabelledBy,
  ariaDescribedBy,
  closeButtonAriaLabel = 'Close modal',
  ...props
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (open) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement;
      
      // Focus the modal when it opens
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    } else {
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      role="dialog"
      aria-modal="true"
      {...props}
    >
      <Box
        ref={modalRef}
        tabIndex={-1}
        onClick={handleBackdropClick}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1300,
          outline: 'none'
        }}
      >
        <Box
          role="document"
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            outline: 'none',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <IconButton
            onClick={onClose}
            aria-label={closeButtonAriaLabel}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Title */}
          {title && (
            <Typography
              id={ariaLabelledBy}
              variant="h6"
              component="h2"
              sx={{ mb: 2, pr: 4 }}
            >
              {title}
            </Typography>
          )}

          {/* Content */}
          <Box id={ariaDescribedBy}>
            {children}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
