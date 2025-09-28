'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  Alert
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_RARITY,
  ACHIEVEMENT_TYPES,
  calculateAchievements,
  getAchievementsByCategory,
  getAchievementsByRarity,
  getAchievementsByType,
  getUnlockedAchievements,
  getLockedAchievements,
  getRecentAchievements,
  getAchievementProgress
} from '@/lib/data/achievements';

/**
 * Achievement Tracker Component
 * Displays and manages user achievements with progress tracking
 */
export default function AchievementTracker({
  userData = {},
  userAchievements = [],
  onUpdateAchievements
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [expandedAchievement, setExpandedAchievement] = useState(null);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [showProgressOnly, setShowProgressOnly] = useState(false);

  // Calculate current achievements
  const currentAchievements = useMemo(() => {
    const calculated = calculateAchievements(userData);
    return ACHIEVEMENTS.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.id === achievement.id);
      const calculatedAchievement = calculated.find(ca => ca.id === achievement.id);
      
      return {
        ...achievement,
        unlocked: userAchievement?.unlocked || calculatedAchievement?.unlocked || false,
        unlockedAt: userAchievement?.unlockedAt || calculatedAchievement?.unlockedAt,
        progress: getAchievementProgress(achievement, userData)
      };
    });
  }, [userData, userAchievements]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let filtered = currentAchievements;

    if (selectedCategory) {
      filtered = filtered.filter(achievement => achievement.category === selectedCategory);
    }

    if (selectedRarity) {
      filtered = filtered.filter(achievement => achievement.rarity === selectedRarity);
    }

    if (selectedType) {
      filtered = filtered.filter(achievement => achievement.type === selectedType);
    }

    if (showUnlockedOnly) {
      filtered = filtered.filter(achievement => achievement.unlocked);
    }

    if (showProgressOnly) {
      filtered = filtered.filter(achievement => 
        !achievement.unlocked && achievement.progress.percentage > 0
      );
    }

    return filtered;
  }, [currentAchievements, selectedCategory, selectedRarity, selectedType, showUnlockedOnly, showProgressOnly]);

  // Get statistics
  const stats = useMemo(() => {
    const unlocked = currentAchievements.filter(a => a.unlocked).length;
    const total = currentAchievements.length;
    const progress = currentAchievements.filter(a => !a.unlocked && a.progress.percentage > 0).length;
    
    return {
      unlocked,
      total,
      progress,
      percentage: (unlocked / total) * 100
    };
  }, [currentAchievements]);

  // Get recent achievements
  const recentAchievements = useMemo(() => {
    return getRecentAchievements(currentAchievements, 5);
  }, [currentAchievements]);

  // Get rarity color
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case ACHIEVEMENT_RARITY.COMMON: return '#666';
      case ACHIEVEMENT_RARITY.UNCOMMON: return '#00ff88';
      case ACHIEVEMENT_RARITY.RARE: return '#0088ff';
      case ACHIEVEMENT_RARITY.EPIC: return '#ff00ff';
      case ACHIEVEMENT_RARITY.LEGENDARY: return '#ffaa00';
      default: return '#666';
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case ACHIEVEMENT_CATEGORIES.WORKOUT_FREQUENCY: return '💪';
      case ACHIEVEMENT_CATEGORIES.STRENGTH_PROGRESS: return '🏋️';
      case ACHIEVEMENT_CATEGORIES.CONSISTENCY: return '🔥';
      case ACHIEVEMENT_CATEGORIES.VOLUME: return '📊';
      case ACHIEVEMENT_CATEGORIES.ENDURANCE: return '🏃';
      case ACHIEVEMENT_CATEGORIES.MILESTONE: return '🎯';
      case ACHIEVEMENT_CATEGORIES.SPECIAL: return '⭐';
      case ACHIEVEMENT_CATEGORIES.SOCIAL: return '👥';
      default: return '🏆';
    }
  };

  // Toggle achievement expansion
  const toggleAchievement = (achievementId) => {
    setExpandedAchievement(expandedAchievement === achievementId ? null : achievementId);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedRarity('');
    setSelectedType('');
    setShowUnlockedOnly(false);
    setShowProgressOnly(false);
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
          Achievement Tracker
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your progress and unlock achievements as you reach new milestones.
        </Typography>
      </Box>

      {/* Achievement Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffaa00' }}>
                {stats.unlocked}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unlocked
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#00ff88' }}>
                {stats.progress}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0088ff' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff4444' }}>
                {stats.percentage.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Bar */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Overall Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.unlocked} / {stats.total} achievements
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.percentage}
            sx={{
              height: 12,
              borderRadius: 6,
              background: '#333',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #ffaa00, #ff8800)',
                borderRadius: 6
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Recent Achievements
            </Typography>
            <Grid container spacing={2}>
              {recentAchievements.map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <Card sx={{ background: '#2a2a2a', border: '1px solid #444' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar
                          sx={{
                            background: getRarityColor(achievement.rarity),
                            color: 'white',
                            fontWeight: 700
                          }}
                        >
                          {achievement.icon}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {achievement.name}
                          </Typography>
                          <Chip
                            label={achievement.rarity}
                            size="small"
                            sx={{
                              background: `${getRarityColor(achievement.rarity)}20`,
                              color: getRarityColor(achievement.rarity)
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {Object.values(ACHIEVEMENT_CATEGORIES).map(category => (
                    <MenuItem key={category} value={category}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{getCategoryIcon(category)}</span>
                        {category}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Rarity</InputLabel>
                <Select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  label="Rarity"
                >
                  <MenuItem value="">All Rarities</MenuItem>
                  {Object.values(ACHIEVEMENT_RARITY).map(rarity => (
                    <MenuItem key={rarity} value={rarity}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          width={12}
                          height={12}
                          borderRadius="50%"
                          sx={{ background: getRarityColor(rarity) }}
                        />
                        {rarity}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {Object.values(ACHIEVEMENT_TYPES).map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" gap={1}>
                <Button
                  variant={showUnlockedOnly ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
                  sx={{ borderColor: '#00ff88', color: '#00ff88' }}
                >
                  Unlocked
                </Button>
                <Button
                  variant={showProgressOnly ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setShowProgressOnly(!showProgressOnly)}
                  sx={{ borderColor: '#ffaa00', color: '#ffaa00' }}
                >
                  In Progress
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={clearFilters}
                  sx={{ color: '#666' }}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Achievements List */}
      <Card sx={{ background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            All Achievements ({filteredAchievements.length})
          </Typography>
          
          {filteredAchievements.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No achievements match your current filters
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredAchievements.map((achievement, index) => {
                const isExpanded = expandedAchievement === achievement.id;
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ListItem
                      sx={{
                        px: 0,
                        py: 2,
                        borderBottom: '1px solid #333',
                        '&:last-child': { borderBottom: 'none' },
                        opacity: achievement.unlocked ? 1 : 0.7
                      }}
                    >
                      <Avatar
                        sx={{
                          background: achievement.unlocked 
                            ? getRarityColor(achievement.rarity)
                            : '#333',
                          color: achievement.unlocked ? 'white' : '#666',
                          fontWeight: 700,
                          mr: 2
                        }}
                      >
                        {achievement.unlocked ? achievement.icon : <LockIcon />}
                      </Avatar>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 600,
                                color: achievement.unlocked ? 'inherit' : '#666'
                              }}
                            >
                              {achievement.name}
                            </Typography>
                            <Chip
                              label={achievement.rarity}
                              size="small"
                              sx={{
                                background: `${getRarityColor(achievement.rarity)}20`,
                                color: getRarityColor(achievement.rarity)
                              }}
                            />
                            {achievement.unlocked && (
                              <Chip
                                label="Unlocked"
                                size="small"
                                sx={{ background: 'rgba(0, 255, 136, 0.2)', color: '#00ff88' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                              {achievement.description}
                            </Typography>
                            {!achievement.unlocked && achievement.progress.percentage > 0 && (
                              <Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="caption" color="text.secondary">
                                    Progress
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {achievement.progress.current} / {achievement.progress.target}
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={achievement.progress.percentage}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    background: '#333',
                                    '& .MuiLinearProgress-bar': {
                                      background: getRarityColor(achievement.rarity),
                                      borderRadius: 3
                                    }
                                  }}
                                />
                              </Box>
                            )}
                            {achievement.unlocked && achievement.unlockedAt && (
                              <Typography variant="caption" color="text.secondary">
                                Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={() => toggleAchievement(achievement.id)}
                          sx={{ color: '#666' }}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </motion.div>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

