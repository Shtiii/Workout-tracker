'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  LinearProgress,
  Collapse,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  TouchApp as TouchIcon
} from '@mui/icons-material';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

/**
 * Mobile Optimized Card Component
 * Provides touch-friendly card interface with mobile-specific interactions
 */
export default function MobileOptimizedCard({
  title,
  subtitle,
  content,
  actions = [],
  avatar = null,
  progress = null,
  tags = [],
  isFavorite = false,
  isExpandable = false,
  isTouchable = true,
  onFavorite = null,
  onShare = null,
  onMore = null,
  onTap = null,
  onLongPress = null,
  variant = 'default',
  size = 'medium',
  elevation = 1,
  children
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const cardRef = useRef(null);

  // Motion values for touch interactions
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring animations
  const springScale = useSpring(scale, { stiffness: 300, damping: 30 });
  const springRotate = useSpring(rotate, { stiffness: 300, damping: 30 });
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  // Transform values
  const scaleValue = useTransform(springScale, (value) => value);
  const rotateValue = useTransform(springRotate, (value) => value);
  const translateX = useTransform(springX, (value) => value);
  const translateY = useTransform(springY, (value) => value);

  // Handle touch start
  const handleTouchStart = () => {
    if (!isTouchable) return;
    setIsPressed(true);
    scale.set(0.95);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isTouchable) return;
    setIsPressed(false);
    scale.set(1);
    
    if (onTap) {
      onTap();
    }
  };

  // Handle long press
  const handleLongPress = () => {
    if (!isTouchable) return;
    scale.set(0.9);
    rotate.set(2);
    
    if (onLongPress) {
      onLongPress();
    }
  };

  // Handle favorite toggle
  const handleFavorite = (event) => {
    event.stopPropagation();
    if (onFavorite) {
      onFavorite();
    }
  };

  // Handle share
  const handleShare = (event) => {
    event.stopPropagation();
    if (onShare) {
      onShare();
    }
  };

  // Handle more options
  const handleMore = (event) => {
    event.stopPropagation();
    if (onMore) {
      onMore();
    }
  };

  // Toggle expansion
  const toggleExpansion = () => {
    if (isExpandable) {
      setExpanded(!expanded);
    }
  };

  // Get card styles based on variant
  const getCardStyles = () => {
    const baseStyles = {
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: 3,
      transition: 'all 0.3s ease',
      cursor: isTouchable ? 'pointer' : 'default',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none'
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        };
      case 'outlined':
        return {
          ...baseStyles,
          background: 'transparent',
          border: '2px solid #ff4444'
        };
      case 'filled':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ff4444, #cc0000)',
          color: 'white'
        };
      default:
        return baseStyles;
    }
  };

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { p: 2, minHeight: 120 };
      case 'large':
        return { p: 4, minHeight: 200 };
      default:
        return { p: 3, minHeight: 160 };
    }
  };

  // Get touch feedback styles
  const getTouchStyles = () => {
    if (!isTouchable) return {};
    
    return {
      '&:active': {
        transform: 'scale(0.98)',
        transition: 'transform 0.1s ease'
      },
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
      }
    };
  };

  return (
    <motion.div
      ref={cardRef}
      style={{
        scale: scaleValue,
        rotate: rotateValue,
        x: translateX,
        y: translateY
      }}
      whileHover={isTouchable ? { scale: 1.02 } : {}}
      whileTap={isTouchable ? { scale: 0.98 } : {}}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onLongPress={handleLongPress}
    >
      <Card
        sx={{
          ...getCardStyles(),
          ...getSizeStyles(),
          ...getTouchStyles(),
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={toggleExpansion}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 2
          }}
        >
          <Box display="flex" alignItems="center" gap={2} flex={1}>
            {avatar && (
              <Avatar
                sx={{
                  background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                  color: 'white',
                  fontWeight: 700
                }}
              >
                {avatar}
              </Avatar>
            )}
            
            <Box flex={1}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  color: variant === 'filled' ? 'white' : 'inherit'
                }}
              >
                {title}
              </Typography>
              
              {subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    color: variant === 'filled' ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary'
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box display="flex" alignItems="center" gap={1}>
            {onFavorite && (
              <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  size="small"
                  onClick={handleFavorite}
                  sx={{
                    color: isFavorite ? '#ff4444' : '#666',
                    '&:hover': {
                      background: 'rgba(255, 68, 68, 0.1)'
                    }
                  }}
                >
                  {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>
            )}

            {onShare && (
              <Tooltip title="Share">
                <IconButton
                  size="small"
                  onClick={handleShare}
                  sx={{
                    color: '#0088ff',
                    '&:hover': {
                      background: 'rgba(0, 136, 255, 0.1)'
                    }
                  }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            )}

            {onMore && (
              <Tooltip title="More options">
                <IconButton
                  size="small"
                  onClick={handleMore}
                  sx={{
                    color: '#666',
                    '&:hover': {
                      background: 'rgba(102, 102, 102, 0.1)'
                    }
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            )}

            {isExpandable && (
              <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
                <IconButton
                  size="small"
                  onClick={toggleExpansion}
                  sx={{
                    color: '#666',
                    '&:hover': {
                      background: 'rgba(102, 102, 102, 0.1)'
                    }
                  }}
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Content */}
        <Box mb={2}>
          {content && (
            <Typography
              variant="body1"
              sx={{
                color: variant === 'filled' ? 'rgba(255, 255, 255, 0.9)' : 'inherit',
                lineHeight: 1.6
              }}
            >
              {content}
            </Typography>
          )}
          
          {children}
        </Box>

        {/* Progress */}
        {progress && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {progress.value}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress.value}
              sx={{
                height: 8,
                borderRadius: 4,
                background: '#333',
                '& .MuiLinearProgress-bar': {
                  background: progress.color || 'linear-gradient(90deg, #ff4444, #cc0000)',
                  borderRadius: 4
                }
              }}
            />
          </Box>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{
                  background: 'rgba(255, 68, 68, 0.2)',
                  color: '#ff4444',
                  fontWeight: 500
                }}
              />
            ))}
          </Box>
        )}

        {/* Expandable Content */}
        {isExpandable && (
          <Collapse in={expanded}>
            <Box
              sx={{
                pt: 2,
                borderTop: '1px solid #333',
                mt: 2
              }}
            >
              {/* Additional content can be added here */}
            </Box>
          </Collapse>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <CardActions
            sx={{
              pt: 2,
              borderTop: '1px solid #333',
              mt: 2,
              justifyContent: 'flex-end'
            }}
          >
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'text'}
                size="small"
                onClick={action.onClick}
                sx={{
                  color: action.color || '#ff4444',
                  fontWeight: 600
                }}
              >
                {action.label}
              </Button>
            ))}
          </CardActions>
        )}

        {/* Touch Indicator */}
        {isMobile && isTouchable && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              opacity: 0.5
            }}
          >
            <TouchIcon fontSize="small" />
          </Box>
        )}
      </Card>
    </motion.div>
  );
}
