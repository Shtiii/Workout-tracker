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
  Security as SecurityIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Security components
import SecurityDashboard from '@/components/security/SecurityDashboard';
import ResponsiveLayout from '@/components/mobile/ResponsiveLayout';

/**
 * Enhanced Security Page
 * Comprehensive security management interface
 */
export default function EnhancedSecurityPage() {
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
      setSuccess('Security data refreshed successfully!');
    } catch (error) {
      setError('Failed to refresh security data');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <SecurityDashboard />;
      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Advanced Security
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Advanced security features and threat detection coming soon.
            </Typography>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Compliance & Auditing
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Compliance monitoring and auditing features coming soon.
            </Typography>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Security Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Security configuration and settings management coming soon.
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
        Security Management
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
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#ff4444' }}>
            Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User authentication and session management
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
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#0088ff' }}>
            Encryption
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Data encryption and secure storage
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
            Privacy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Privacy protection and GDPR compliance
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  // Header content
  const headerContent = (
    <Box display="flex" alignItems="center" gap={2}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        Security Management
      </Typography>
      <Button
        variant="outlined"
        size="small"
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        disabled={isLoading}
        sx={{ borderColor: '#ff4444', color: '#ff4444' }}
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
            Security Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive security management with authentication, encryption, and privacy protection.
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
              icon={<SecurityIcon />}
              label="Security Dashboard"
              iconPosition="start"
            />
            <Tab
              icon={<LockIcon />}
              label="Advanced Security"
              iconPosition="start"
            />
            <Tab
              icon={<ShieldIcon />}
              label="Compliance"
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
