'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { FitnessCenter as FitnessCenterIcon, ViewList as ViewListIcon, EmojiEvents as EmojiEventsIcon, Dashboard as DashboardIcon, CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import ThemeRegistry from './theme/ThemeRegistry';
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [value, setValue] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  // Memoize navigation routes to prevent recreation on every render - Streamlined for mobile
  const navigationRoutes = useMemo(() => [
    { path: '/workout', label: 'Train', icon: <FitnessCenterIcon /> },
    { path: '/analytics', label: 'Progress', icon: <CalendarIcon /> },
    { path: '/goals-records', label: 'Records', icon: <EmojiEventsIcon /> }
  ], []);

  useEffect(() => {
    const currentIndex = navigationRoutes.findIndex(route => route.path === pathname);
    if (currentIndex !== -1) {
      setValue(currentIndex);
    }
  }, [pathname, navigationRoutes]);

  const handleNavigation = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    router.push(navigationRoutes[newValue].path);
  }, [router, navigationRoutes]);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#ff4444" />
        <link rel="apple-touch-icon" href="/workout-icon-192.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <ThemeRegistry>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            bgcolor: 'background.default'
          }}>
            <Box sx={{
              flex: 1,
              pb: { xs: 8, sm: 7 }, // More padding on mobile for better spacing
              px: { xs: 0, sm: 0 }, // Remove horizontal padding on mobile
              overflowX: 'hidden' // Prevent horizontal scrolling
            }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  ease: 'easeIn',
                  duration: 0.3 // Slightly faster for better mobile feel
                }}
              >
                {children}
              </motion.div>
            </Box>

            <Paper
              sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(26, 26, 26, 0.7)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid #333',
                // iPhone safe area handling
                paddingBottom: 'env(safe-area-inset-bottom)',
                zIndex: 1000
              }}
              elevation={8}
            >
              <BottomNavigation
                value={value}
                onChange={handleNavigation}
                sx={{
                  bgcolor: 'transparent',
                  height: { xs: 64, sm: 56 }, // Taller on mobile for easier touch
                  '& .MuiBottomNavigationAction-root': {
                    minWidth: 'auto',
                    padding: { xs: '6px 8px 8px', sm: '6px 12px 8px' },
                    '& .MuiBottomNavigationAction-label': {
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      fontWeight: 600,
                      marginTop: '2px'
                    }
                  }
                }}
              >
                {navigationRoutes.map((route) => (
                  <BottomNavigationAction
                    key={route.path}
                    label={route.label}
                    icon={route.icon}
                  />
                ))}
              </BottomNavigation>
            </Paper>
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
