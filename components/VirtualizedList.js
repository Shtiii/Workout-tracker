'use client';

import { useRef, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { useAdvancedVirtualScrolling } from '@/lib/performance';

/**
 * VirtualizedList Component
 * Renders large lists efficiently using virtual scrolling
 */
export default function VirtualizedList({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5,
  renderItem,
  onScroll,
  className,
  style
}) {
  const containerRef = useRef(null);

  const {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: handleScroll,
    containerRef: setContainerRef
  } = useAdvancedVirtualScrolling(items, itemHeight, containerHeight, overscan);

  const handleScrollWithCallback = useCallback((e) => {
    handleScroll(e);
    if (onScroll) {
      onScroll(e);
    }
  }, [handleScroll, onScroll]);

  const containerStyle = useMemo(() => ({
    height: containerHeight,
    overflow: 'auto',
    position: 'relative',
    ...style
  }), [containerHeight, style]);

  const innerStyle = useMemo(() => ({
    height: totalHeight,
    position: 'relative'
  }), [totalHeight]);

  const itemsStyle = useMemo(() => ({
    position: 'absolute',
    top: offsetY,
    left: 0,
    right: 0
  }), [offsetY]);

  return (
    <Box
      ref={(ref) => {
        containerRef.current = ref;
        setContainerRef(ref);
      }}
      className={className}
      style={containerStyle}
      onScroll={handleScrollWithCallback}
    >
      <div style={innerStyle}>
        <div style={itemsStyle}>
          {visibleItems.map((item, index) => (
            <div
              key={item.id || item.index || index}
              style={{
                height: itemHeight,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {renderItem(item, item.index || index)}
            </div>
          ))}
        </div>
      </div>
    </Box>
  );
}
