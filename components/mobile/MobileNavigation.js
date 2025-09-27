'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Avatar,
  Chip,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  FitnessCenter as WorkoutIcon,
  Assessment as AnalyticsIcon,
  LibraryBooks as ProgramsIcon,
  Lightbulb as InsightsIcon,
  Settings as SettingsIcon,
  Person as ProfileIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  LocalFireDepartment as FireIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Mobile Navigation Component
 * Provides mobile-optimized navigation with drawer and bottom navigation
 */
export default function MobileNavigation({
  user = null,
  workoutStreak = 0,
  unreadNotifications = 0,
  achievements = []
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();

  // Navigation items
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <HomeIcon />,
      path: '/',
      badge: null
    },
    {
      id: 'workout',
      label: 'Workout',
      icon: <WorkoutIcon />,
      path: '/workout',
      badge: null
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analytics',
      badge: null
    },
    {
      id: 'programs',
      label: 'Programs',
      icon: <ProgramsIcon />,
      path: '/programs',
      badge: null
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: <InsightsIcon />,
      path: '/insights',
      badge: achievements.filter(a => !a.unlocked).length > 0 ? 
        achievements.filter(a => !a.unlocked).length : null
    }
  ];

  // Bottom navigation items (primary actions)
  const bottomNavItems = [
    {
      id: 'workout',
      label: 'Workout',
      icon: <WorkoutIcon />,
      path: '/workout',
      color: '#ff4444'
    },
    {
      id: 'analytics',
      label: 'Progress',
      icon: <TrendingUpIcon />,
      path: '/analytics',
      color: '#00ff88'
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: <TrophyIcon />,
      path: '/insights',
      color: '#ffaa00'
    }
  ];

  // Update active tab based on current path
  useEffect(() => {
    const currentIndex = navigationItems.findIndex(item => item.path === pathname);
    if (currentIndex !== -1) {
      setActiveTab(currentIndex);
    }
  }, [pathname]);

  // Handle navigation
  const handleNavigation = (path) => {
    router.push(path);
    setDrawerOpen(false);
  };

  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user) return 'U';
    const name = user.displayName || user.email || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Drawer content
  const drawerContent = (
    <Box
      sx={{
        width: 280,
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #ff4444, #cc0000)',
          color: 'white'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Workout Tracker
          </Typography>
          <IconButton
            onClick={toggleDrawer}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* User Info */}
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 700
            }}
          >
            {getUserInitials()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.displayName || 'User'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ p: 2, background: '#2a2a2a' }}>
        <Box display="flex" gap={2}>
          <Box textAlign="center" flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff4444' }}>
              {workoutStreak}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Day Streak
            </Typography>
          </Box>
          <Box textAlign="center" flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#00ff88' }}>
              {achievements.filter(a => a.unlocked).length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Achievements
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, pt: 2 }}>
        {navigationItems.map((item, index) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 2,
                mb: 1,
                borderRadius: 2,
                background: pathname === item.path ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
                '&:hover': {
                  background: 'rgba(255, 68, 68, 0.05)'
                }
              }}
            >
              <ListItemIcon sx={{ color: pathname === item.path ? '#ff4444' : 'inherit' }}>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: pathname === item.path ? 600 : 400,
                    color: pathname === item.path ? '#ff4444' : 'inherit'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* Additional Items */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/notifications')}
            sx={{ mx: 2, mb: 1, borderRadius: 2 }}
          >
            <ListItemIcon>
              {unreadNotifications > 0 ? (
                <Badge badgeContent={unreadNotifications} color="error">
                  <NotificationsIcon />
                </Badge>
              ) : (
                <NotificationsIcon />
              )}
            </ListItemIcon>
            <ListItemText primary="Notifications" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/profile')}
            sx={{ mx: 2, mb: 1, borderRadius: 2 }}
          >
            <ListItemIcon>
              <ProfileIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/settings')}
            sx={{ mx: 2, mb: 1, borderRadius: 2 }}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            borderBottom: '1px solid #333',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              onClick={toggleDrawer}
              sx={{ color: '#ff4444' }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Workout Tracker
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {workoutStreak > 0 && (
              <Tooltip title={`${workoutStreak} day streak`}>
                <Chip
                  icon={<FireIcon />}
                  label={workoutStreak}
                  size="small"
                  sx={{
                    background: 'rgba(255, 68, 68, 0.2)',
                    color: '#ff4444',
                    fontWeight: 600
                  }}
                />
              </Tooltip>
            )}
            {unreadNotifications > 0 && (
              <IconButton sx={{ color: '#ffaa00' }}>
                <Badge badgeContent={unreadNotifications} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            )}
          </Box>
        </Box>
      )}

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            background: 'transparent',
            border: 'none'
          }
        }}
      >
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {drawerContent}
            </motion.div>
          )}
        </AnimatePresence>
      </Drawer>

      {/* Bottom Navigation */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
            borderTop: '1px solid #333',
            p: 1,
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center'
          }}
        >
          {bottomNavItems.map((item, index) => (
            <motion.div
              key={item.id}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            >
              <Tooltip title={item.label} placement="top">
                <Box
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 2,
                    cursor: 'pointer',
                    background: pathname === item.path ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
                    '&:hover': {
                      background: 'rgba(255, 68, 68, 0.05)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      color: pathname === item.path ? item.color : '#666',
                      mb: 0.5
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: pathname === item.path ? item.color : '#666',
                      fontWeight: pathname === item.path ? 600 : 400,
                      fontSize: '0.7rem'
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </Tooltip>
            </motion.div>
          ))}
        </Box>
      )}
    </>
  );
}
