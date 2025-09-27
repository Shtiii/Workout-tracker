'use client';

import { memo } from 'react';
import { Card, CardContent } from '@mui/material';
import { createOptimizedComponent } from '@/lib/performance';

/**
 * OptimizedCard Component
 * Performance-optimized card component with memoization
 */
const OptimizedCard = memo(({
  children,
  sx = {},
  className,
  onClick,
  ...props
}) => {
  return (
    <Card
      className={className}
      onClick={onClick}
      sx={{
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        },
        ...sx
      }}
      {...props}
    >
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
});

OptimizedCard.displayName = 'OptimizedCard';

export default createOptimizedComponent(OptimizedCard, {
  memoize: true,
  displayName: 'OptimizedCard'
});
