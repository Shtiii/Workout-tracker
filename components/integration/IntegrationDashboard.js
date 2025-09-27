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
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  Integration as IntegrationIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Analytics as AnalyticsIcon,
  Performance as PerformanceIcon,
  Data as DataIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getIntegrationManager } from '@/lib/integration/IntegrationManager';
import { getTestSuite } from '@/lib/testing/TestSuite';

/**
 * Integration Dashboard Component
 * Comprehensive integration management and testing interface
 */
export default function IntegrationDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [integrationManager, setIntegrationManager] = useState(null);
  const [testSuite, setTestSuite] = useState(null);
  
  // State for different sections
  const [integrationStatus, setIntegrationStatus] = useState({});
  const [componentStatuses, setComponentStatuses] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [testSummary, setTestSummary] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Initialize managers
  useEffect(() => {
    const initializeManagers = async () => {
      try {
        const im = getIntegrationManager();
        const ts = getTestSuite();
        
        setIntegrationManager(im);
        setTestSuite(ts);
        
        // Load initial data
        await loadIntegrationStatus();
        await loadComponentStatuses();
        await loadTestResults();
      } catch (error) {
        console.error('Failed to initialize integration managers:', error);
        setError('Failed to initialize integration system');
      }
    };

    initializeManagers();
  }, []);

  // Load integration status
  const loadIntegrationStatus = useCallback(async () => {
    if (!integrationManager) return;
    
    try {
      const status = integrationManager.getIntegrationStatus();
      setIntegrationStatus(status);
    } catch (error) {
      console.error('Failed to load integration status:', error);
    }
  }, [integrationManager]);

  // Load component statuses
  const loadComponentStatuses = useCallback(async () => {
    if (!integrationManager) return;
    
    try {
      const statuses = integrationManager.getAllComponentStatuses();
      setComponentStatuses(statuses);
    } catch (error) {
      console.error('Failed to load component statuses:', error);
    }
  }, [integrationManager]);

  // Load test results
  const loadTestResults = useCallback(async () => {
    if (!testSuite) return;
    
    try {
      const results = testSuite.getTestResults();
      setTestResults(results);
      
      // Calculate summary
      const summary = {
        total: results.length,
        passed: results.filter(r => r.result === 'passed').length,
        failed: results.filter(r => r.result === 'failed').length,
        skipped: results.filter(r => r.result === 'skipped').length
      };
      setTestSummary(summary);
    } catch (error) {
      console.error('Failed to load test results:', error);
    }
  }, [testSuite]);

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([
      loadIntegrationStatus(),
      loadComponentStatuses(),
      loadTestResults()
    ]);
    setSuccess('Integration data refreshed successfully!');
  };

  // Handle run tests
  const handleRunTests = async () => {
    if (!testSuite) return;
    
    setIsRunningTests(true);
    try {
      const summary = await testSuite.runAllTests();
      setTestSummary(summary);
      await loadTestResults();
      setSuccess(`Tests completed! ${summary.passed}/${summary.total} passed`);
    } catch (error) {
      setError('Failed to run tests');
    } finally {
      setIsRunningTests(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return '#00ff88';
      case 'error': return '#ff4444';
      case 'initializing': return '#ffaa00';
      case 'offline': return '#666';
      case 'syncing': return '#0088ff';
      case 'maintenance': return '#ff8800';
      default: return '#666';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <CheckCircleIcon />;
      case 'error': return <ErrorIcon />;
      case 'initializing': return <CircularProgress size={20} />;
      case 'offline': return <WarningIcon />;
      case 'syncing': return <RefreshIcon />;
      case 'maintenance': return <SettingsIcon />;
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
          Integration Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage system integration, component health, and testing.
        </Typography>
      </Box>

      {/* Status Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ background: '#0088ff', mx: 'auto', mb: 2 }}>
                <IntegrationIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0088ff' }}>
                {integrationStatus.status || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Integration Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ background: '#00ff88', mx: 'auto', mb: 2 }}>
                <CheckCircleIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                {integrationStatus.componentCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Components
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ background: '#ff4444', mx: 'auto', mb: 2 }}>
                <ErrorIcon />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff4444' }}>
                {integrationStatus.errorCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Errors
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
                {testSummary.passed || 0}/{testSummary.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tests Passed
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
          variant="contained"
          startIcon={isRunningTests ? <StopIcon /> : <PlayIcon />}
          onClick={handleRunTests}
          disabled={isRunningTests}
          sx={{
            background: 'linear-gradient(135deg, #00ff88, #00cc66)',
            fontWeight: 700
          }}
        >
          {isRunningTests ? 'Running Tests...' : 'Run Tests'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{ borderColor: '#ffaa00', color: '#ffaa00' }}
        >
          Export Results
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
            icon={<IntegrationIcon />}
            label="Integration Status"
            iconPosition="start"
          />
          <Tab
            icon={<CheckCircleIcon />}
            label="Component Health"
            iconPosition="start"
          />
          <Tab
            icon={<PlayIcon />}
            label="Test Results"
            iconPosition="start"
          />
          <Tab
            icon={<AnalyticsIcon />}
            label="Performance"
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
            {/* Integration Status */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Integration Status
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Status</Typography>
                      <Chip
                        icon={getStatusIcon(integrationStatus.status)}
                        label={integrationStatus.status || 'Unknown'}
                        size="small"
                        sx={{
                          background: `${getStatusColor(integrationStatus.status)}20`,
                          color: getStatusColor(integrationStatus.status)
                        }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Initialized</Typography>
                      <Chip
                        icon={getStatusIcon(integrationStatus.isInitialized ? 'ready' : 'error')}
                        label={integrationStatus.isInitialized ? 'Yes' : 'No'}
                        size="small"
                        sx={{
                          background: `${getStatusColor(integrationStatus.isInitialized ? 'ready' : 'error')}20`,
                          color: getStatusColor(integrationStatus.isInitialized ? 'ready' : 'error')
                        }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Components</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {integrationStatus.componentCount || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Errors</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {integrationStatus.errorCount || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Sync Queue</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {integrationStatus.syncQueueLength || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Performance Metrics */}
            <Grid item xs={12} md={6}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Performance Metrics
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    {Object.entries(integrationStatus.performanceMetrics || {}).map(([component, metrics]) => (
                      <Box key={component}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {component}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={metrics.averageResponseTime || 0}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            background: '#333',
                            '& .MuiLinearProgress-bar': {
                              background: metrics.averageResponseTime > 1000 ? '#ff4444' : '#00ff88'
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {metrics.averageResponseTime || 0}ms avg response time
                        </Typography>
                      </Box>
                    ))}
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
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Component Health
              </Typography>
              
              {Object.keys(componentStatuses).length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No component status available
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {Object.entries(componentStatuses).map(([name, status]) => (
                    <Grid item xs={12} sm={6} md={4} key={name}>
                      <Card sx={{ background: '#2a2a2a', border: '1px solid #444' }}>
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Avatar sx={{ background: getStatusColor(status) }}>
                              {getStatusIcon(status)}
                            </Avatar>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {name}
                            </Typography>
                          </Box>
                          
                          <Chip
                            label={status}
                            size="small"
                            sx={{
                              background: `${getStatusColor(status)}20`,
                              color: getStatusColor(status)
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Grid container spacing={3}>
            {/* Test Summary */}
            <Grid item xs={12} md={4}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Test Summary
                  </Typography>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Total Tests</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testSummary.total || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Passed</Typography>
                      <Typography variant="body2" color="#00ff88">
                        {testSummary.passed || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Failed</Typography>
                      <Typography variant="body2" color="#ff4444">
                        {testSummary.failed || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Skipped</Typography>
                      <Typography variant="body2" color="#ffaa00">
                        {testSummary.skipped || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Success Rate</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testSummary.total > 0 ? Math.round((testSummary.passed / testSummary.total) * 100) : 0}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Test Results */}
            <Grid item xs={12} md={8}>
              <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Test Results
                  </Typography>
                  
                  {testResults.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <Typography variant="body1" color="text.secondary">
                        No test results available
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} sx={{ background: '#2a2a2a' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Test Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Error</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {testResults.map((test) => (
                            <TableRow key={test.id}>
                              <TableCell>{test.name}</TableCell>
                              <TableCell>
                                <Chip
                                  label={test.category}
                                  size="small"
                                  sx={{
                                    background: 'rgba(255, 68, 68, 0.2)',
                                    color: '#ff4444'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={getStatusIcon(test.result === 'passed' ? 'ready' : 'error')}
                                  label={test.result}
                                  size="small"
                                  sx={{
                                    background: `${getStatusColor(test.result === 'passed' ? 'ready' : 'error')}20`,
                                    color: getStatusColor(test.result === 'passed' ? 'ready' : 'error')
                                  }}
                                />
                              </TableCell>
                              <TableCell>{test.duration}ms</TableCell>
                              <TableCell>
                                {test.error && (
                                  <Typography variant="caption" color="text.secondary">
                                    {test.error.substring(0, 50)}...
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
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
                Performance Metrics
              </Typography>
              
              <Typography variant="body1" color="text.secondary">
                Detailed performance metrics and monitoring coming soon.
              </Typography>
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
