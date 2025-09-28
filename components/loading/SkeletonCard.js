'use client';

import { Skeleton, Card, CardContent, Box } from '@mui/material';

/**
 * SkeletonCard Component
 * Skeleton loading state for cards
 */
export default function SkeletonCard({
  variant = 'rectangular',
  width = '100%',
  height = 200,
  showAvatar = false,
  showTitle = true,
  showContent = true,
  showActions = false,
  ...props
}) {
  return (
    <Card {...props}>
      <CardContent>
        {showAvatar && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ mr: 2 }}
            />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
        )}

        {showTitle && (
          <Skeleton
            variant="text"
            width="80%"
            height={32}
            sx={{ mb: 2 }}
          />
        )}

        {showContent && (
          <Box>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="75%" height={20} />
          </Box>
        )}

        {showActions && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Skeleton variant="rectangular" width={80} height={36} />
            <Skeleton variant="rectangular" width={80} height={36} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
