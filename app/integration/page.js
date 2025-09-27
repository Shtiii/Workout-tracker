'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  Button,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Integration as IntegrationIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Integration components
import IntegrationDashboard from '@/components/integration/IntegrationDashboard';
import ResponsiveLayout from '@/components/mobile/ResponsiveLayout';

/**
 * Enhanced Integration Page
 * Comprehensive integration management and testing interface
 */
export default function EnhancedIntegrationPage() {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Integration data refreshed successfully!');
    } catch (error) {
      setError('Failed to refresh integration data');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <IntegrationDashboard />;
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              System Health
            </Typography>
            <Typography variant="body1" color="text.secondary">
              System health monitoring and diagnostics coming soon.
            </Typography>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              API Integration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              API integration management and monitoring coming soon.
            </Typography>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Integration Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Integration configuration and settings management coming soon.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
        Integration Management
      </Typography>
      
      <Box display="flex" flexDirection="column" gap={2}>
        <Box
          sx={{
            p: 2,
            background: '#2a2a2a',
            borderRadius: 2,
            border: '1px solid #444'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#0088ff' }}>
            Component Integration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage system component integration
          </Typography>
        </Box>
        
        <Box
          sx={{
            p: 2,
            background: '#2a2a2a',
            borderRadius: 2,
            border: '1px solid #444'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#00ff88' }}>
            Testing Suite
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive testing and quality assurance
          </Typography>
        </Box>
        
        <Box
          sx={{
            p: 2,
            background: '#2a2a2a',
            borderRadius: 2,
            border: '1px solid #444'
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#ffaa00' }}>
            Performance Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time performance and health monitoring
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  // Header content
  const headerContent = (
    <Box display="flex" alignItems="center" gap={2}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Integration Management
      </Typography>
      <Button
        variant="outlined"
        size="small"
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        disabled={isLoading}
        sx={{ borderColor: '#0088ff', color: '#0088ff' }}
      >
        Refresh
      </Button>
    </Box>
  );

  return (
    <ResponsiveLayout
      sidebar={sidebarContent}
      header={headerContent}
      showSidebar={!isMobile}
      enableFullscreen={true}
      enableOfflineIndicator={true}
      enableRefreshButton={true}
      onRefresh={handleRefresh}
    >
      {/* Main Content */}
      <Box>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Integration Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive integration management with component health monitoring, testing, and performance optimization.
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem'
              }
            }}
          >
            <Tab
              icon={<IntegrationIcon />}
              label="Integration Dashboard"
              iconPosition="start"
            />
            <Tab
              icon={<CheckCircleIcon />}
              label="System Health"
              iconPosition="start"
            />
            <Tab
              icon={<AnalyticsIcon />}
              label="API Integration"
              iconPosition="start"
            />
            <Tab
              icon={<SettingsIcon />}
              label="Settings"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>

        {/* Success/Error Messages */}
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ResponsiveLayout>
  );
}
