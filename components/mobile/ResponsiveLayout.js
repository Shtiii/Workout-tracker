'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  Typography,
  Fab,
  Tooltip,
  Backdrop,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Refresh as RefreshIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

/**
 * Responsive Layout Component
 * Provides responsive design patterns and mobile-first approach
 */
export default function ResponsiveLayout({
  children,
  sidebar = null,
  header = null,
  footer = null,
  showSidebar = true,
  sidebarWidth = 280,
  maxWidth = 'lg',
  enableFullscreen = false,
  enableOfflineIndicator = true,
  enableRefreshButton = false,
  onRefresh = null
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsLoading(true);
      try {
        await onRefresh();
      } finally {
        setIsLoading(false);
      }
    } else {
      router.refresh();
    }
  };

  // Get layout configuration based on screen size
  const getLayoutConfig = () => {
    if (isMobile) {
      return {
        container: 'fluid',
        sidebar: 'drawer',
        header: 'fixed',
        footer: 'fixed',
        spacing: 2
      };
    } else if (isTablet) {
      return {
        container: 'lg',
        sidebar: 'drawer',
        header: 'sticky',
        footer: 'static',
        spacing: 3
      };
    } else {
      return {
        container: maxWidth,
        sidebar: 'persistent',
        header: 'sticky',
        footer: 'static',
        spacing: 4
      };
    }
  };

  const layoutConfig = getLayoutConfig();

  // Sidebar content
  const sidebarContent = (
    <Box
      sx={{
        width: sidebarWidth,
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #333'
      }}
    >
      {sidebar}
    </Box>
  );

  // Header content
  const headerContent = (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        borderBottom: '1px solid #333',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: layoutConfig.header === 'fixed' ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        {isMobile && showSidebar && (
          <IconButton
            onClick={toggleSidebar}
            sx={{ color: '#ff4444' }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {header}
      </Box>

      <Box display="flex" alignItems="center" gap={1}>
        {/* Online/Offline Indicator */}
        {enableOfflineIndicator && (
          <Tooltip title={isOnline ? 'Online' : 'Offline'}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: isOnline ? '#00ff88' : '#ff4444'
              }}
            >
              {isOnline ? <OnlineIcon /> : <OfflineIcon />}
              <Typography variant="caption">
                {isOnline ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Tooltip>
        )}

        {/* Refresh Button */}
        {enableRefreshButton && (
          <Tooltip title="Refresh">
            <IconButton
              onClick={handleRefresh}
              disabled={isLoading}
              sx={{ color: '#ffaa00' }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Fullscreen Button */}
        {enableFullscreen && (
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
            <IconButton
              onClick={toggleFullscreen}
              sx={{ color: '#0088ff' }}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  // Footer content
  const footerContent = (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        borderTop: '1px solid #333',
        p: 2,
        position: layoutConfig.footer === 'fixed' ? 'fixed' : 'static',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100
      }}
    >
      {footer}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      {header && headerContent}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          pt: layoutConfig.header === 'fixed' ? '80px' : 0,
          pb: layoutConfig.footer === 'fixed' ? '80px' : 0
        }}
      >
        {/* Sidebar - Desktop */}
        {!isMobile && showSidebar && sidebar && (
          <Box
            sx={{
              width: sidebarWidth,
              flexShrink: 0,
              background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
              borderRight: '1px solid #333'
            }}
          >
            {sidebar}
          </Box>
        )}

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0
          }}
        >
          <Container
            maxWidth={layoutConfig.container}
            sx={{
              flex: 1,
              py: layoutConfig.spacing,
              px: isMobile ? 2 : 3
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </Container>
        </Box>
      </Box>

      {/* Sidebar - Mobile Drawer */}
      {isMobile && showSidebar && sidebar && (
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={toggleSidebar}
          sx={{
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              background: 'transparent',
              border: 'none'
            }
          }}
        >
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ x: -sidebarWidth }}
                animate={{ x: 0 }}
                exit={{ x: -sidebarWidth }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                {sidebarContent}
              </motion.div>
            )}
          </AnimatePresence>
        </Drawer>
      )}

      {/* Footer */}
      {footer && footerContent}

      {/* Loading Overlay */}
      <Backdrop
        open={isLoading}
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1,
          background: 'rgba(0, 0, 0, 0.8)'
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography variant="body2">Loading...</Typography>
        </Box>
      </Backdrop>

      {/* Offline Overlay */}
      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 68, 68, 0.9)',
            color: 'white',
            p: 2,
            textAlign: 'center',
            zIndex: 1200
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            You're offline. Some features may not be available.
          </Typography>
        </Box>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'linear-gradient(135deg, #ff4444, #cc0000)',
            zIndex: 1000
          }}
          onClick={toggleSidebar}
        >
          <MenuIcon />
        </Fab>
      )}
    </Box>
  );
}
