'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';
import { useIntersectionObserver } from '@/lib/performance';

/**
 * LazyImage Component
 * Lazy loads images for better performance
 */
export default function LazyImage({
  src,
  alt,
  width,
  height,
  placeholder,
  className,
  style,
  onLoad,
  onError,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });
  const imgRef = useRef(null);

  useEffect(() => {
    if (isIntersecting && !isLoaded && !isError) {
      const img = new Image();
      img.onload = () => {
        setIsLoaded(true);
        if (onLoad) onLoad();
      };
      img.onerror = () => {
        setIsError(true);
        if (onError) onError();
      };
      img.src = src;
    }
  }, [isIntersecting, isLoaded, isError, src, onLoad, onError]);

  const imageStyle = {
    width: width || '100%',
    height: height || 'auto',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease',
    opacity: isLoaded ? 1 : 0,
    ...style
  };

  const containerStyle = {
    width: width || '100%',
    height: height || 'auto',
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  if (isError) {
    return (
      <Box
        ref={ref}
        className={className}
        style={containerStyle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.200',
          color: 'text.secondary'
        }}
        {...props}
      >
        {placeholder || 'Failed to load image'}
      </Box>
    );
  }

  return (
    <Box
      ref={ref}
      className={className}
      style={containerStyle}
      {...props}
    >
      {!isLoaded && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{ position: 'absolute', top: 0, left: 0 }}
        />
      )}
      
      {isIntersecting && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={imageStyle}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsError(true)}
        />
      )}
    </Box>
  );
}
