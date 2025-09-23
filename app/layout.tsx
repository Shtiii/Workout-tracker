'use client';

import type { Metadata } from "next";
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { FitnessCenter as FitnessCenterIcon, ViewList as ViewListIcon, Analytics as AnalyticsIcon, EmojiEvents as EmojiEventsIcon, Dashboard as DashboardIcon, CalendarMonth as CalendarIcon } from '@mui/icons-material';
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

  const navigationRoutes = [
    { path: '/dashboard', label: 'Home', icon: <DashboardIcon /> },
    { path: '/workout', label: 'Train', icon: <FitnessCenterIcon /> },
    { path: '/programs', label: 'Programs', icon: <ViewListIcon /> },
    { path: '/analytics', label: 'Analytics', icon: <CalendarIcon /> },
    { path: '/goals', label: 'Goals', icon: <EmojiEventsIcon /> },
    { path: '/bests', label: 'PRs', icon: <EmojiEventsIcon /> }
  ];

  useEffect(() => {
    const currentIndex = navigationRoutes.findIndex(route => route.path === pathname);
    if (currentIndex !== -1) {
      setValue(currentIndex);
    }
  }, [pathname]);

  const handleNavigation = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    router.push(navigationRoutes[newValue].path);
  };

  return (
    <html lang="en">
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
              pb: 7
            }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  ease: 'easeIn',
                  duration: 0.4
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
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              }}
              elevation={3}
            >
              <BottomNavigation
                value={value}
                onChange={handleNavigation}
                sx={{
                  bgcolor: 'transparent'
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
