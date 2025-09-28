'use client';

import { Box, Skeleton } from '@mui/material';

/**
 * SkeletonList Component
 * Skeleton loading state for lists
 */
export default function SkeletonList({
  count = 5,
  itemHeight = 60,
  showAvatar = false,
  showSubtitle = true,
  spacing = 1,
  ...props
}) {
  return (
    <Box {...props}>
      {Array.from({ length: count }).map((_, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: spacing,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1
          }}
        >
          {showAvatar && (
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ mr: 2 }}
            />
          )}

          <Box sx={{ flex: 1 }}>
            <Skeleton
              variant="text"
              width="70%"
              height={24}
              sx={{ mb: 1 }}
            />
            
            {showSubtitle && (
              <Skeleton
                variant="text"
                width="50%"
                height={20}
              />
            )}
          </Box>

          <Skeleton
            variant="rectangular"
            width={80}
            height={32}
          />
        </Box>
      ))}
    </Box>
  );
}
