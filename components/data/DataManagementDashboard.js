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
  Paper
} from '@mui/material';
import {
  Storage as StorageIcon,
  Sync as SyncIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getDataManager } from '@/lib/data/DataManager';
import { getPerformanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { getAnalyticsTracker } from '@/lib/analytics/AnalyticsTracker';

/**
 * Data Management Dashboard Component
 * Comprehensive data management interface with performance monitoring
 */
export default function DataManagementDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [dataManager, setDataManager] = useState(null);
  const [performanceMonitor, setPerformanceMonitor] = useState(null);
  const [analyticsTracker, setAnalyticsTracker] = useState(null);
  
  // State for different sections
  const [cacheData, setCacheData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  const [syncStatus, setSyncStatus] = useState('idle');
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Initialize managers
  useEffect(() => {
    const initializeManagers = async () => {
      try {
        const dm = getDataManager();
        const pm = getPerformanceMonitor();
        const at = getAnalyticsTracker();
        
        setDataManager(dm);
        setPerformanceMonitor(pm);
        setAnalyticsTracker(at);
        
        // Load initial data
        await loadCacheData();
        await loadPerformanceMetrics();
        await loadAnalyticsData();
      } catch (error) {
        console.error('Failed to initialize managers:', error);
        setError('Failed to initialize data management system');
      }
    };

    initializeManagers();
  }, []);

  // Monitor online/offline status
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

  // Load cache data
  const loadCacheData = useCallback(async () => {
    if (!dataManager) return;
    
    try {
      const metrics = dataManager.getPerformanceMetrics();
      setCacheData([
        {
          key: 'Cache Size',
          value: metrics.cacheSize,
          status: metrics.cacheSize > 80 ? 'warning' : 'good'
        },
        {
          key: 'Cache Hit Rate',
          value: metrics.cacheHitRate,
          status: parseFloat(metrics.cacheHitRate) > 70 ? 'good' : 'warning'
        },
        {
          key: 'Average Query Time',
          value: metrics.avgQueryTime,
          status: parseFloat(metrics.avgQueryTime) < 1000 ? 'good' : 'warning'
        },
        {
          key: 'Sync Operations',
          value: metrics.syncOperations,
          status: 'info'
        },
        {
          key: 'Error Count',
          value: metrics.errorCount,
          status: metrics.errorCount > 0 ? 'error' : 'good'
        },
        {
          key: 'Pending Operations',
          value: metrics.pendingOperations,
          status: metrics.pendingOperations > 0 ? 'warning' : 'good'
        }
      ]);
    } catch (error) {
      console.error('Failed to load cache data:', error);
    }
  }, [dataManager]);

  // Load performance metrics
  const loadPerformanceMetrics = useCallback(async () => {
    if (!performanceMonitor) return;
    
    try {
      const metrics = performanceMonitor.generateReport();
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  }, [performanceMonitor]);

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    if (!analyticsTracker) return;
    
    try {
      const data = analyticsTracker.getAnalyticsData();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }, [analyticsTracker]);

  // Handle sync
  const handleSync = async () => {
    if (!dataManager) return;
    
    try {
      setSyncStatus('syncing');
      await dataManager.processSyncQueue();
      setSyncStatus('success');
      setSuccess('Data synchronized successfully!');
      await loadCacheData();
    } catch (error) {
      setSyncStatus('error');
      setError('Sync failed: ' + error.message);
    }
  };

  // Handle clear cache
  const handleClearCache = async () => {
    if (!dataManager) return;
    
    try {
      dataManager.clearCache();
      setSuccess('Cache cleared successfully!');
      await loadCacheData();
    } catch (error) {
      setError('Failed to clear cache: ' + error.message);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([
      loadCacheData(),
      loadPerformanceMetrics(),
      loadAnalyticsData()
    ]);
    setSuccess('Data refreshed successfully!');
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
          Data Management Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage data operations, performance, and analytics.
        </Typography>
      </Box>

      {/* Status Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ background: '#0088ff', mx: 'auto', mb: 2 }}>
                <StorageIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0088ff' }}>
                {cacheData.find(item => item.key === 'Cache Size')?.value || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cache Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ background: '#00ff88', mx: 'auto', mb: 2 }}>
                <SpeedIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                {performanceMetrics.summary?.overallScore || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Performance Score
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
                {analyticsData.eventsSent || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Events Tracked
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ background: isOnline ? '#00ff88' : '#ff4444', mx: 'auto', mb: 2 }}>
                <NetworkIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: isOnline ? '#00ff88' : '#ff4444' }}>
                {isOnline ? 'Online' : 'Offline'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Network Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box mb={3} display="flex" gap={2}>
        <Button
          variant="contained"
          startIcon={<SyncIcon />}
          onClick={handleSync}
          disabled={syncStatus === 'syncing' || !isOnline}
          sx={{
            background: 'linear-gradient(135deg, #0088ff, #0066cc)',
            fontWeight: 700
          }}
        >
          {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Data'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{ borderColor: '#00ff88', color: '#00ff88' }}
        >
          Refresh
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<DeleteIcon />}
          onClick={handleClearCache}
          sx={{ borderColor: '#ff4444', color: '#ff4444' }}
        >
          Clear Cache
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
            icon={<StorageIcon />}
            label="Cache Management"
            iconPosition="start"
          />
          <Tab
            icon={<SpeedIcon />}
            label="Performance"
            iconPosition="start"
          />
          <Tab
            icon={<AnalyticsIcon />}
            label="Analytics"
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
      {activeTab === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Cache Management
              </Typography>
              
              <List>
                {cacheData.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderBottom: '1px solid #333',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <ListItemText
                      primary={item.key}
                      secondary={item.value}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        icon={getStatusIcon(item.status)}
                        label={item.status}
                        size="small"
                        sx={{
                          background: `${getStatusColor(item.status)}20`,
                          color: getStatusColor(item.status)
                        }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Grid container spacing={3}>
            {/* Performance Summary */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Performance Summary
                  </Typography>
                  
                  {performanceMetrics.summary && (
                    <Box>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          Overall Score
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={performanceMetrics.summary.overallScore}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            background: '#333',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #00ff88, #00cc66)',
                              borderRadius: 4
                            }
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          {performanceMetrics.summary.overallScore}/100
                        </Typography>
                      </Box>
                      
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Typography variant="body2">
                          Page Load Average: {performanceMetrics.summary.pageLoadAverage}ms
                        </Typography>
                        <Typography variant="body2">
                          Component Render Average: {performanceMetrics.summary.componentRenderAverage}ms
                        </Typography>
                        <Typography variant="body2">
                          Network Average: {performanceMetrics.summary.networkAverage}ms
                        </Typography>
                        <Typography variant="body2">
                          Memory Usage: {(performanceMetrics.summary.memoryUsage / 1024 / 1024).toFixed(2)}MB
                        </Typography>
                        <Typography variant="body2">
                          Error Count: {performanceMetrics.summary.errorCount}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Performance Details */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Performance Details
                  </Typography>
                  
                  {performanceMetrics.pageLoad && (
                    <Box mb={3}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Page Load Performance
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Average: {performanceMetrics.pageLoad.average}ms
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Count: {performanceMetrics.pageLoad.count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (performanceMetrics.pageLoad.average / 3000) * 100)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          background: '#333',
                          '& .MuiLinearProgress-bar': {
                            background: performanceMetrics.pageLoad.average > 2000 ? '#ff4444' : '#00ff88',
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>
                  )}
                  
                  {performanceMetrics.components && (
                    <Box mb={3}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Component Render Performance
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Average: {performanceMetrics.components.average}ms
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Count: {performanceMetrics.components.count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, (performanceMetrics.components.average / 100) * 100)}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          background: '#333',
                          '& .MuiLinearProgress-bar': {
                            background: performanceMetrics.components.average > 50 ? '#ff4444' : '#00ff88',
                            borderRadius: 3
                          }
                        }}
                      />
                    </Box>
                  )}
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
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Analytics Data
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      Session Information
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Typography variant="body2">
                        Session ID: {analyticsData.sessionId}
                      </Typography>
                      <Typography variant="body2">
                        User ID: {analyticsData.userId || 'Not set'}
                      </Typography>
                      <Typography variant="body2">
                        Events in Queue: {analyticsData.eventsInQueue}
                      </Typography>
                      <Typography variant="body2">
                        Events Sent: {analyticsData.eventsSent}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      User Properties
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {Object.entries(analyticsData.userProperties || {}).map(([key, value]) => (
                        <Typography key={key} variant="body2">
                          {key}: {value}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
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
                Data Management Settings
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={3}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Enable Performance Monitoring"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Enable Analytics Tracking"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Enable Data Caching"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Enable Offline Sync"
                />
              </Box>
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


