'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Avatar,
  Rating
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { 
  PROGRAM_TEMPLATES,
  PROGRAM_GOALS,
  PROGRAM_DURATION,
  PROGRAM_FREQUENCY,
  DIFFICULTY_LEVELS,
  searchPrograms,
  getPopularPrograms,
  getRecommendedPrograms
} from '@/lib/data/programTemplates';

/**
 * Program Library Component
 * Displays and manages workout programs with search, filtering, and management features
 */
export default function ProgramLibrary({
  userPrograms = [],
  onSelectProgram,
  onEditProgram,
  onDeleteProgram,
  onDuplicateProgram,
  onImportProgram,
  onExportProgram,
  userLevel = 'beginner',
  userGoal = 'general_fitness'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [favoritePrograms, setFavoritePrograms] = useState([]);

  // Load favorite programs
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoritePrograms') || '[]');
    setFavoritePrograms(favorites);
  }, []);

  // Filtered and sorted programs
  const filteredPrograms = useMemo(() => {
    let programs = [...PROGRAM_TEMPLATES, ...userPrograms];

    // Apply search filter
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      programs = programs.filter(program =>
        program.name.toLowerCase().includes(searchTerm) ||
        program.description.toLowerCase().includes(searchTerm) ||
        program.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply other filters
    if (selectedGoal) {
      programs = programs.filter(program => program.goal === selectedGoal);
    }
    if (selectedDifficulty) {
      programs = programs.filter(program => program.difficulty === selectedDifficulty);
    }
    if (selectedDuration) {
      programs = programs.filter(program => program.duration === selectedDuration);
    }
    if (selectedFrequency) {
      programs = programs.filter(program => program.frequency === selectedFrequency);
    }

    // Sort programs
    switch (sortBy) {
      case 'name':
        programs.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'difficulty':
        const difficultyOrder = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        programs.sort((a, b) => 
          difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty)
        );
        break;
      case 'duration':
        const durationOrder = ['4 Weeks', '8 Weeks', '12 Weeks', '16 Weeks', 'Ongoing'];
        programs.sort((a, b) => 
          durationOrder.indexOf(a.duration) - durationOrder.indexOf(b.duration)
        );
        break;
      case 'popularity':
      default:
        // Keep original order for templates, sort user programs by creation date
        programs.sort((a, b) => {
          if (a.isCustom && b.isCustom) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return 0;
        });
        break;
    }

    return programs;
  }, [searchQuery, selectedGoal, selectedDifficulty, selectedDuration, selectedFrequency, sortBy, userPrograms]);

  // Recommended programs
  const recommendedPrograms = useMemo(() => {
    return getRecommendedPrograms(userLevel, userGoal, 3);
  }, [userLevel, userGoal]);

  // Popular programs
  const popularPrograms = useMemo(() => {
    return getPopularPrograms();
  }, []);

  // Handle program selection
  const handleSelectProgram = (program) => {
    setSelectedProgram(program);
    setShowProgramDialog(true);
  };

  // Handle program start
  const handleStartProgram = (program) => {
    onSelectProgram(program);
    setShowProgramDialog(false);
  };

  // Handle favorite toggle
  const handleToggleFavorite = (programId) => {
    const updatedFavorites = favoritePrograms.includes(programId)
      ? favoritePrograms.filter(id => id !== programId)
      : [...favoritePrograms, programId];
    
    setFavoritePrograms(updatedFavorites);
    localStorage.setItem('favoritePrograms', JSON.stringify(updatedFavorites));
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGoal('');
    setSelectedDifficulty('');
    setSelectedDuration('');
    setSelectedFrequency('');
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case DIFFICULTY_LEVELS.BEGINNER: return 'success';
      case DIFFICULTY_LEVELS.INTERMEDIATE: return 'warning';
      case DIFFICULTY_LEVELS.ADVANCED: return 'error';
      case DIFFICULTY_LEVELS.EXPERT: return 'secondary';
      default: return 'default';
    }
  };

  // Get goal icon
  const getGoalIcon = (goal) => {
    switch (goal) {
      case PROGRAM_GOALS.STRENGTH: return '💪';
      case PROGRAM_GOALS.HYPERTROPHY: return '🏋️';
      case PROGRAM_GOALS.ENDURANCE: return '🏃';
      case PROGRAM_GOALS.FAT_LOSS: return '🔥';
      case PROGRAM_GOALS.GENERAL_FITNESS: return '⭐';
      case PROGRAM_GOALS.POWERLIFTING: return '🏆';
      case PROGRAM_GOALS.BODYBUILDING: return '💎';
      case PROGRAM_GOALS.ATHLETIC_PERFORMANCE: return '⚡';
      default: return '💪';
    }
  };

  // Program Card Component
  const ProgramCard = ({ program, isRecommended = false, isPopular = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
          border: '1px solid #333',
          borderRadius: 2,
          height: '100%',
          '&:hover': {
            borderColor: '#ff4444',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)'
          }
        }}
      >
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {program.name}
                </Typography>
                {isRecommended && (
                  <Chip
                    label="Recommended"
                    size="small"
                    sx={{ background: 'rgba(0, 255, 136, 0.2)', color: '#00ff88' }}
                  />
                )}
                {isPopular && (
                  <Chip
                    label="Popular"
                    size="small"
                    sx={{ background: 'rgba(255, 170, 0, 0.2)', color: '#ffaa00' }}
                  />
                )}
                {program.isCustom && (
                  <Chip
                    label="Custom"
                    size="small"
                    sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {program.description}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title={favoritePrograms.includes(program.id) ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleFavorite(program.id)}
                  sx={{ color: favoritePrograms.includes(program.id) ? '#ffaa00' : '#666' }}
                >
                  {favoritePrograms.includes(program.id) ? <StarIcon /> : <StarBorderIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Program Info */}
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Chip
              label={program.goal}
              size="small"
              icon={<span>{getGoalIcon(program.goal)}</span>}
              sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
            />
            <Chip
              label={program.difficulty}
              size="small"
              color={getDifficultyColor(program.difficulty)}
              variant="outlined"
            />
            <Chip
              label={program.duration}
              size="small"
              variant="outlined"
            />
            <Chip
              label={program.frequency}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Program Stats */}
          <Box display="flex" gap={2} mb={2}>
            <Typography variant="caption" color="text.secondary">
              {program.workouts.length} workouts
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {program.workouts.reduce((sum, workout) => sum + workout.exercises.length, 0)} exercises
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayIcon />}
              onClick={() => handleStartProgram(program)}
              sx={{
                background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                fontWeight: 700,
                flex: 1
              }}
            >
              Start
            </Button>
            {program.isCustom && (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => onEditProgram(program)}
                    sx={{ color: '#ffaa00' }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => onDeleteProgram(program.id)}
                    sx={{ color: '#ff4444' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => handleSelectProgram(program)}
                sx={{ color: '#666' }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Program Library
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose from our curated programs or create your own custom workout plan.
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, background: '#1a1a1a', border: '1px solid #333' }}>
        <CardContent>
          <Box display="flex" gap={2} mb={2}>
            <TextField
              fullWidth
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />
              }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ borderColor: '#ff4444', color: '#ff4444' }}
            >
              Filters
            </Button>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort by"
              >
                <MenuItem value="popularity">Popularity</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="difficulty">Difficulty</MenuItem>
                <MenuItem value="duration">Duration</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Filters */}
          {showFilters && (
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Goal</InputLabel>
                  <Select
                    value={selectedGoal}
                    onChange={(e) => setSelectedGoal(e.target.value)}
                    label="Goal"
                  >
                    <MenuItem value="">All Goals</MenuItem>
                    {Object.values(PROGRAM_GOALS).map(goal => (
                      <MenuItem key={goal} value={goal}>{goal}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    label="Difficulty"
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    {Object.values(DIFFICULTY_LEVELS).map(difficulty => (
                      <MenuItem key={difficulty} value={difficulty}>{difficulty}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Duration</InputLabel>
                  <Select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    label="Duration"
                  >
                    <MenuItem value="">All Durations</MenuItem>
                    {Object.values(PROGRAM_DURATION).map(duration => (
                      <MenuItem key={duration} value={duration}>{duration}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={selectedFrequency}
                    onChange={(e) => setSelectedFrequency(e.target.value)}
                    label="Frequency"
                  >
                    <MenuItem value="">All Frequencies</MenuItem>
                    {Object.values(PROGRAM_FREQUENCY).map(frequency => (
                      <MenuItem key={frequency} value={frequency}>{frequency}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {(selectedGoal || selectedDifficulty || selectedDuration || selectedFrequency) && (
            <Button
              variant="text"
              size="small"
              onClick={clearFilters}
              sx={{ color: '#ff4444' }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recommended Programs */}
      {!searchQuery && !selectedGoal && !selectedDifficulty && !selectedDuration && !selectedFrequency && (
        <Box mb={4}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Recommended for You
          </Typography>
          <Grid container spacing={3}>
            {recommendedPrograms.map((program) => (
              <Grid item xs={12} sm={6} md={4} key={program.id}>
                <ProgramCard program={program} isRecommended={true} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Popular Programs */}
      {!searchQuery && !selectedGoal && !selectedDifficulty && !selectedDuration && !selectedFrequency && (
        <Box mb={4}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Popular Programs
          </Typography>
          <Grid container spacing={3}>
            {popularPrograms.map((program) => (
              <Grid item xs={12} sm={6} md={4} key={program.id}>
                <ProgramCard program={program} isPopular={true} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* All Programs */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          All Programs ({filteredPrograms.length})
        </Typography>
        <Grid container spacing={3}>
          {filteredPrograms.map((program) => (
            <Grid item xs={12} sm={6} md={4} key={program.id}>
              <ProgramCard 
                program={program} 
                isRecommended={recommendedPrograms.some(p => p.id === program.id)}
                isPopular={popularPrograms.some(p => p.id === program.id)}
              />
            </Grid>
          ))}
        </Grid>

        {filteredPrograms.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" mb={2}>
              No programs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search terms or filters
            </Typography>
          </Box>
        )}
      </Box>

      {/* Program Details Dialog */}
      <Dialog
        open={showProgramDialog}
        onClose={() => setShowProgramDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {selectedProgram?.name}
            </Typography>
            <IconButton onClick={() => setShowProgramDialog(false)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedProgram && (
            <Box>
              <Typography variant="body1" color="text.secondary" mb={3}>
                {selectedProgram.description}
              </Typography>

              {/* Program Info */}
              <Box display="flex" gap={1} mb={3} flexWrap="wrap">
                <Chip
                  label={selectedProgram.goal}
                  icon={<span>{getGoalIcon(selectedProgram.goal)}</span>}
                  sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
                />
                <Chip
                  label={selectedProgram.difficulty}
                  color={getDifficultyColor(selectedProgram.difficulty)}
                  variant="outlined"
                />
                <Chip
                  label={selectedProgram.duration}
                  variant="outlined"
                />
                <Chip
                  label={selectedProgram.frequency}
                  variant="outlined"
                />
              </Box>

              {/* Workouts */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Workouts ({selectedProgram.workouts.length})
              </Typography>
              {selectedProgram.workouts.map((workout, index) => (
                <Card key={index} sx={{ mb: 2, background: '#2a2a2a' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {workout.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {workout.exercises.length} exercises
                    </Typography>
                  </CardContent>
                </Card>
              ))}

              {/* Notes */}
              {selectedProgram.notes && selectedProgram.notes.length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Notes
                  </Typography>
                  {selectedProgram.notes.map((note, index) => (
                    <Typography key={index} variant="body2" color="text.secondary" mb={1}>
                      • {note}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProgramDialog(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={() => handleStartProgram(selectedProgram)}
            sx={{
              background: 'linear-gradient(135deg, #00ff88, #00cc66)',
              fontWeight: 700
            }}
          >
            Start Program
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

