'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useInfiniteScroll } from '@/lib/performance';

/**
 * InfiniteScrollList Component
 * Renders lists with infinite scrolling capability
 */
export default function InfiniteScrollList({
  items = [],
  loadMore,
  hasMore = true,
  threshold = 200,
  renderItem,
  loadingComponent,
  endMessage = "You've reached the end!",
  className,
  style
}) {
  const [allItems, setAllItems] = useState(items);
  const [isLoading, setIsLoading] = useState(false);

  const { lastItemRef, loading } = useInfiniteScroll(
    allItems,
    async () => {
      setIsLoading(true);
      try {
        const newItems = await loadMore();
        setAllItems(prev => [...prev, ...newItems]);
      } finally {
        setIsLoading(false);
      }
    },
    hasMore,
    threshold
  );

  useEffect(() => {
    setAllItems(items);
  }, [items]);

  const renderLoadingComponent = () => {
    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading more items...
        </Typography>
      </Box>
    );
  };

  const renderEndMessage = () => {
    if (!hasMore && allItems.length > 0) {
      return (
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {endMessage}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box className={className} style={style}>
      {allItems.map((item, index) => {
        const isLastItem = index === allItems.length - 1;
        
        return (
          <div
            key={item.id || index}
            ref={isLastItem ? lastItemRef : null}
          >
            {renderItem(item, index)}
          </div>
        );
      })}
      
      {isLoading && renderLoadingComponent()}
      {renderEndMessage()}
    </Box>
  );
}
