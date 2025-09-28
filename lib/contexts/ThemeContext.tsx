/**
 * Theme context for managing application theme
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function AppThemeProvider({ children, defaultMode = 'dark' }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [isDark, setIsDark] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
      setMode(savedMode);
    }
  }, []);

  // Update theme based on mode
  useEffect(() => {
    const updateTheme = () => {
      let shouldBeDark = false;
      
      switch (mode) {
        case 'light':
          shouldBeDark = false;
          break;
        case 'dark':
          shouldBeDark = true;
          break;
        case 'auto':
          shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          break;
      }
      
      setIsDark(shouldBeDark);
    };

    updateTheme();

    // Listen for system theme changes when in auto mode
    if (mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [mode]);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => {
      switch (prev) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'auto';
        case 'auto':
          return 'light';
        default:
          return 'dark';
      }
    });
  };

  // Create MUI theme
  const theme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#ff4444',
        light: '#ff6666',
        dark: '#cc3333',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#ffaa00',
        light: '#ffbb33',
        dark: '#cc8800',
        contrastText: '#000000',
      },
      error: {
        main: '#f44336',
        light: '#e57373',
        dark: '#d32f2f',
      },
      warning: {
        main: '#ff9800',
        light: '#ffb74d',
        dark: '#f57c00',
      },
      info: {
        main: '#2196f3',
        light: '#64b5f6',
        dark: '#1976d2',
      },
      success: {
        main: '#4caf50',
        light: '#81c784',
        dark: '#388e3c',
      },
      background: {
        default: isDark ? '#1a1a1a' : '#ffffff',
        paper: isDark ? '#2a2a2a' : '#f5f5f5',
      },
      text: {
        primary: isDark ? '#ffffff' : '#000000',
        secondary: isDark ? '#cccccc' : '#666666',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '8px 16px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDark 
              ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
          },
        },
      },
    },
  });

  const contextValue: ThemeContextType = {
    mode,
    setMode,
    toggleMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within an AppThemeProvider');
  }
  return context;
}

// Utility function to get theme-aware colors
export function getThemeColors(isDark: boolean) {
  return {
    primary: isDark ? '#ff4444' : '#ff4444',
    secondary: isDark ? '#ffaa00' : '#ffaa00',
    background: isDark ? '#1a1a1a' : '#ffffff',
    surface: isDark ? '#2a2a2a' : '#f5f5f5',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#cccccc' : '#666666',
    border: isDark ? '#333333' : '#e0e0e0',
    success: isDark ? '#4caf50' : '#4caf50',
    warning: isDark ? '#ff9800' : '#ff9800',
    error: isDark ? '#f44336' : '#f44336',
    info: isDark ? '#2196f3' : '#2196f3',
  };
}

// Utility function to get contrast color
export function getContrastColor(backgroundColor: string): string {
  // Simple contrast calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

