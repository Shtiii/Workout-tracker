'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  Sync as SyncIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Offline Manager Component
 * Manages offline capabilities and data synchronization
 */
export default function OfflineManager({
  onSyncData,
  onUploadData,
  onDownloadData,
  onClearOfflineData,
  syncStatus = 'idle',
  offlineData = [],
  lastSyncTime = null,
  enableAutoSync = true,
  syncInterval = 30000 // 30 seconds
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncError, setSyncError] = useState(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (enableAutoSync && offlineData.length > 0) {
        handleSync();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableAutoSync, offlineData.length]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && enableAutoSync && offlineData.length > 0) {
      const interval = setInterval(() => {
        handleSync();
      }, syncInterval);

      return () => clearInterval(interval);
    }
  }, [isOnline, enableAutoSync, offlineData.length, syncInterval]);

  // Handle sync
  const handleSync = useCallback(async () => {
    if (!isOnline || syncStatus === 'syncing') return;

    try {
      setSyncProgress(0);
      setSyncError(null);

      // Simulate sync progress
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      if (onSyncData) {
        await onSyncData();
      }

      clearInterval(progressInterval);
      setSyncProgress(100);

      // Add to sync history
      const syncRecord = {
        id: Date.now(),
        timestamp: new Date(),
        status: 'success',
        itemsSynced: offlineData.length
      };
      setSyncHistory(prev => [syncRecord, ...prev.slice(0, 9)]); // Keep last 10

      setTimeout(() => {
        setSyncProgress(0);
      }, 1000);

    } catch (error) {
      setSyncError(error.message);
      setSyncProgress(0);

      // Add error to sync history
      const syncRecord = {
        id: Date.now(),
        timestamp: new Date(),
        status: 'error',
        error: error.message
      };
      setSyncHistory(prev => [syncRecord, ...prev.slice(0, 9)]);
    }
  }, [isOnline, syncStatus, onSyncData, offlineData.length]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!isOnline) return;

    try {
      if (onUploadData) {
        await onUploadData();
      }
    } catch (error) {
      setSyncError(error.message);
    }
  }, [isOnline, onUploadData]);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!isOnline) return;

    try {
      if (onDownloadData) {
        await onDownloadData();
      }
    } catch (error) {
      setSyncError(error.message);
    }
  }, [isOnline, onDownloadData]);

  // Handle clear offline data
  const handleClearOfflineData = useCallback(async () => {
    try {
      if (onClearOfflineData) {
        await onClearOfflineData();
      }
      setPendingOperations([]);
    } catch (error) {
      setSyncError(error.message);
    }
  }, [onClearOfflineData]);

  // Get sync status color
  const getSyncStatusColor = (status) => {
    switch (status) {
      case 'success': return '#00ff88';
      case 'error': return '#ff4444';
      case 'warning': return '#ffaa00';
      case 'syncing': return '#0088ff';
      default: return '#666';
    }
  };

  // Get sync status icon
  const getSyncStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircleIcon />;
      case 'error': return <ErrorIcon />;
      case 'warning': return <WarningIcon />;
      case 'syncing': return <SyncIcon />;
      default: return <InfoIcon />;
    }
  };

  // Format last sync time
  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';
    const now = new Date();
    const diff = now - new Date(lastSyncTime);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Offline Manager
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage offline data and synchronization with cloud storage.
        </Typography>
      </Box>

      {/* Connection Status */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  color: isOnline ? '#00ff88' : '#ff4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {isOnline ? <OnlineIcon /> : <OfflineIcon />}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {isOnline ? 'Online' : 'Offline'}
                </Typography>
              </Box>
              <Chip
                label={syncStatus}
                size="small"
                sx={{
                  background: `${getSyncStatusColor(syncStatus)}20`,
                  color: getSyncStatusColor(syncStatus)
                }}
              />
            </Box>
            
            <Button
              variant="contained"
              startIcon={<SyncIcon />}
              onClick={handleSync}
              disabled={!isOnline || syncStatus === 'syncing'}
              sx={{
                background: 'linear-gradient(135deg, #0088ff, #0066cc)',
                fontWeight: 700
              }}
            >
              Sync Now
            </Button>
          </Box>

          {/* Sync Progress */}
          {syncStatus === 'syncing' && (
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Syncing data...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {syncProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={syncProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  background: '#333',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #0088ff, #0066cc)',
                    borderRadius: 4
                  }
                }}
              />
            </Box>
          )}

          {/* Last Sync Time */}
          <Typography variant="body2" color="text.secondary">
            Last sync: {formatLastSyncTime()}
          </Typography>
        </CardContent>
      </Card>

      {/* Offline Data */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Offline Data ({offlineData.length} items)
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Upload to cloud">
                <IconButton
                  onClick={handleUpload}
                  disabled={!isOnline || offlineData.length === 0}
                  sx={{ color: '#00ff88' }}
                >
                  <UploadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download from cloud">
                <IconButton
                  onClick={handleDownload}
                  disabled={!isOnline}
                  sx={{ color: '#0088ff' }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear offline data">
                <IconButton
                  onClick={() => setShowSyncDialog(true)}
                  disabled={offlineData.length === 0}
                  sx={{ color: '#ff4444' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {offlineData.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No offline data available
              </Typography>
            </Box>
          ) : (
            <List>
              {offlineData.map((item, index) => (
                <ListItem
                  key={index}
                  sx={{
                    borderBottom: '1px solid #333',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <ListItemText
                    primary={item.type || 'Workout Data'}
                    secondary={item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown time'}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={item.status || 'pending'}
                      size="small"
                      sx={{
                        background: `${getSyncStatusColor(item.status || 'pending')}20`,
                        color: getSyncStatusColor(item.status || 'pending')
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Sync History
          </Typography>
          
          {syncHistory.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No sync history available
              </Typography>
            </Box>
          ) : (
            <List>
              {syncHistory.map((record) => (
                <ListItem
                  key={record.id}
                  sx={{
                    borderBottom: '1px solid #333',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ color: getSyncStatusColor(record.status) }}>
                          {getSyncStatusIcon(record.status)}
                        </Box>
                        <Typography variant="body1">
                          {record.status === 'success' 
                            ? `Synced ${record.itemsSynced} items`
                            : `Sync failed: ${record.error}`
                          }
                        </Typography>
                      </Box>
                    }
                    secondary={record.timestamp.toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Clear Data Dialog */}
      <Dialog
        open={showSyncDialog}
        onClose={() => setShowSyncDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Clear Offline Data
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" mb={2}>
            Are you sure you want to clear all offline data? This action cannot be undone.
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will remove {offlineData.length} items from offline storage.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowSyncDialog(false)}
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleClearOfflineData();
              setShowSyncDialog(false);
            }}
            sx={{
              background: 'linear-gradient(135deg, #ff4444, #cc0000)',
              fontWeight: 700
            }}
          >
            Clear Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!syncError}
        autoHideDuration={6000}
        onClose={() => setSyncError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setSyncError(null)}>
          {syncError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
