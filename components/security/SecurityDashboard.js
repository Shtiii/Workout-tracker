'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  LinearProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Security as SecurityIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getSecurityManager } from '@/lib/security/SecurityManager';
import { getEncryptionManager } from '@/lib/security/EncryptionManager';
import { getPrivacyManager } from '@/lib/security/PrivacyManager';

/**
 * Security Dashboard Component
 * Comprehensive security management interface
 */
export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [securityManager, setSecurityManager] = useState(null);
  const [encryptionManager, setEncryptionManager] = useState(null);
  const [privacyManager, setPrivacyManager] = useState(null);
  
  // State for different sections
  const [securityStatus, setSecurityStatus] = useState({});
  const [encryptionStatus, setEncryptionStatus] = useState({});
  const [privacyStatus, setPrivacyStatus] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [userConsents, setUserConsents] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Initialize managers
  useEffect(() => {
    const initializeManagers = async () => {
      try {
        const sm = getSecurityManager();
        const em = getEncryptionManager();
        const pm = getPrivacyManager();
        
        setSecurityManager(sm);
        setEncryptionManager(em);
        setPrivacyManager(pm);
        
        // Load initial data
        await loadSecurityStatus();
        await loadEncryptionStatus();
        await loadPrivacyStatus();
        await loadAuditLogs();
        await loadUserConsents();
      } catch (error) {
        console.error('Failed to initialize security managers:', error);
        setError('Failed to initialize security system');
      }
    };

    initializeManagers();
  }, []);

  // Load security status
  const loadSecurityStatus = useCallback(async () => {
    if (!securityManager) return;
    
    try {
      const status = securityManager.getSecurityStatus();
      setSecurityStatus(status);
    } catch (error) {
      console.error('Failed to load security status:', error);
    }
  }, [securityManager]);

  // Load encryption status
  const loadEncryptionStatus = useCallback(async () => {
    if (!encryptionManager) return;
    
    try {
      const status = encryptionManager.getEncryptionStatus();
      setEncryptionStatus(status);
    } catch (error) {
      console.error('Failed to load encryption status:', error);
    }
  }, [encryptionManager]);

  // Load privacy status
  const loadPrivacyStatus = useCallback(async () => {
    if (!privacyManager) return;
    
    try {
      const status = privacyManager.getPrivacyStatus();
      setPrivacyStatus(status);
    } catch (error) {
      console.error('Failed to load privacy status:', error);
    }
  }, [privacyManager]);

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    if (!securityManager) return;
    
    try {
      const logs = securityManager.getAuditLogs();
      setAuditLogs(logs.slice(0, 50)); // Show last 50 logs
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  }, [securityManager]);

  // Load user consents
  const loadUserConsents = useCallback(async () => {
    if (!privacyManager) return;
    
    try {
      // In a real implementation, this would load actual user consents
      setUserConsents([]);
    } catch (error) {
      console.error('Failed to load user consents:', error);
    }
  }, [privacyManager]);

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([
      loadSecurityStatus(),
      loadEncryptionStatus(),
      loadPrivacyStatus(),
      loadAuditLogs(),
      loadUserConsents()
    ]);
    setSuccess('Security data refreshed successfully!');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#00ff88';
      case 'warning': return '#ffaa00';
      case 'error': return '#ff4444';
      case 'info': return '#0088ff';
      default: return '#666';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return <CheckCircleIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      case 'info': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Security Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage security, encryption, and privacy settings.
        </Typography>
      </Box>

      {/* Status Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ background: '#ff4444', mx: 'auto', mb: 2 }}>
                <SecurityIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff4444' }}>
                {securityStatus.isAuthenticated ? 'Secure' : 'Insecure'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Authentication Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ background: '#0088ff', mx: 'auto', mb: 2 }}>
                <LockIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0088ff' }}>
                {encryptionStatus.activeKeys?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Keys
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ background: '#00ff88', mx: 'auto', mb: 2 }}>
                <ShieldIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                {privacyStatus.activeConsents || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Consents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ background: '#ffaa00', mx: 'auto', mb: 2 }}>
                <AnalyticsIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                {auditLogs.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Audit Logs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box mb={3} display="flex" gap={2}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{
            background: 'linear-gradient(135deg, #0088ff, #0066cc)',
            fontWeight: 700
          }}
        >
          Refresh
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{ borderColor: '#00ff88', color: '#00ff88' }}
        >
          Export Logs
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          sx={{ borderColor: '#ffaa00', color: '#ffaa00' }}
        >
          Settings
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
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
            label="Security"
            iconPosition="start"
          />
          <Tab
            icon={<LockIcon />}
            label="Encryption"
            iconPosition="start"
          />
          <Tab
            icon={<ShieldIcon />}
            label="Privacy"
            iconPosition="start"
          />
          <Tab
            icon={<AnalyticsIcon />}
            label="Audit Logs"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Grid container spacing={3}>
            {/* Security Status */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Security Status
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Authentication</Typography>
                      <Chip
                        icon={getStatusIcon(securityStatus.isAuthenticated ? 'good' : 'error')}
                        label={securityStatus.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                        size="small"
                        sx={{
                          background: `${getStatusColor(securityStatus.isAuthenticated ? 'good' : 'error')}20`,
                          color: getStatusColor(securityStatus.isAuthenticated ? 'good' : 'error')
                        }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">User Role</Typography>
                      <Chip
                        label={securityStatus.userRole || 'Guest'}
                        size="small"
                        sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Session Duration</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Math.floor((securityStatus.sessionDuration || 0) / 1000 / 60)}m
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Login Attempts</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {securityStatus.loginAttempts || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Locked Accounts</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {securityStatus.lockedAccounts || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Security Settings */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Security Settings
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Two-Factor Authentication"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Session Timeout"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Login Attempts Limit"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Account Lockout"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Audit Logging"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      )}

      {activeTab === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Grid container spacing={3}>
            {/* Encryption Status */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Encryption Status
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Initialized</Typography>
                      <Chip
                        icon={getStatusIcon(encryptionStatus.isInitialized ? 'good' : 'error')}
                        label={encryptionStatus.isInitialized ? 'Yes' : 'No'}
                        size="small"
                        sx={{
                          background: `${getStatusColor(encryptionStatus.isInitialized ? 'good' : 'error')}20`,
                          color: getStatusColor(encryptionStatus.isInitialized ? 'good' : 'error')
                        }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Active Keys</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {encryptionStatus.activeKeys?.length || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Cache Size</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {encryptionStatus.cacheSize || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Algorithm</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {encryptionStatus.supportedAlgorithms?.[0] || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Encryption Settings */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Encryption Settings
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Data Encryption"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Key Rotation"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Secure Storage"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="File Encryption"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      )}

      {activeTab === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Grid container spacing={3}>
            {/* Privacy Status */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Privacy Status
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Initialized</Typography>
                      <Chip
                        icon={getStatusIcon(privacyStatus.isInitialized ? 'good' : 'error')}
                        label={privacyStatus.isInitialized ? 'Yes' : 'No'}
                        size="small"
                        sx={{
                          background: `${getStatusColor(privacyStatus.isInitialized ? 'good' : 'error')}20`,
                          color: getStatusColor(privacyStatus.isInitialized ? 'good' : 'error')
                        }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Active Consents</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {privacyStatus.activeConsents || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Processing Records</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {privacyStatus.processingRecords || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Anonymization Rules</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {privacyStatus.anonymizationRules || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Privacy Settings */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Privacy Settings
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="GDPR Compliance"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Data Anonymization"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Consent Management"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Data Retention"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      )}

      {activeTab === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Audit Logs
              </Typography>
              
              {auditLogs.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No audit logs available
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ background: '#2a2a2a' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Event Type</TableCell>
                        <TableCell>User ID</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.eventType}
                              size="small"
                              sx={{
                                background: 'rgba(255, 68, 68, 0.2)',
                                color: '#ff4444'
                              }}
                            />
                          </TableCell>
                          <TableCell>{log.userId}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {JSON.stringify(log.data).substring(0, 100)}...
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
