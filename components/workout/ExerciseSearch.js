'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Info as InfoIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { 
  EXERCISE_DATABASE, 
  EXERCISE_CATEGORIES, 
  EQUIPMENT_TYPES, 
  DIFFICULTY_LEVELS,
  MUSCLE_GROUPS,
  searchExercises,
  getPopularExercises,
  getRecommendedExercises
} from '@/lib/data/exerciseDatabase';

/**
 * Advanced Exercise Search Component
 * Provides comprehensive exercise search and filtering capabilities
 */
export default function ExerciseSearch({
  onAddExercise,
  recentExercises = [],
  favoriteExercises = [],
  onToggleFavorite,
  workoutHistory = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Memoized search results
  const filteredExercises = useMemo(() => {
    if (!searchQuery && !selectedCategory && !selectedEquipment && !selectedDifficulty && !selectedMuscleGroup) {
      return getPopularExercises();
    }

    return searchExercises(searchQuery, {
      category: selectedCategory,
      equipment: selectedEquipment,
      difficulty: selectedDifficulty,
      muscleGroup: selectedMuscleGroup
    });
  }, [searchQuery, selectedCategory, selectedEquipment, selectedDifficulty, selectedMuscleGroup]);

  // Recommended exercises based on workout history
  const recommendedExercises = useMemo(() => {
    return getRecommendedExercises(workoutHistory, 5);
  }, [workoutHistory]);

  // Handle search input with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearching(false);
      setSearchResults(filteredExercises);
    }, 300);

    return () => clearTimeout(timer);
  }, [filteredExercises]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setIsSearching(true);
  };

  const handleAddExercise = (exercise) => {
    onAddExercise(exercise);
  };

  const handleToggleFavorite = (exerciseId) => {
    onToggleFavorite(exerciseId);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedEquipment('');
    setSelectedDifficulty('');
    setSelectedMuscleGroup('');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case DIFFICULTY_LEVELS.BEGINNER: return 'success';
      case DIFFICULTY_LEVELS.INTERMEDIATE: return 'warning';
      case DIFFICULTY_LEVELS.ADVANCED: return 'error';
      case DIFFICULTY_LEVELS.EXPERT: return 'secondary';
      default: return 'default';
    }
  };

  const getEquipmentIcon = (equipment) => {
    switch (equipment) {
      case EQUIPMENT_TYPES.BARBELL: return '🏋️';
      case EQUIPMENT_TYPES.DUMBBELL: return '💪';
      case EQUIPMENT_TYPES.MACHINE: return '⚙️';
      case EQUIPMENT_TYPES.CABLE: return '🔗';
      case EQUIPMENT_TYPES.BODYWEIGHT: return '🚶';
      case EQUIPMENT_TYPES.KETTLEBELL: return '🏺';
      case EQUIPMENT_TYPES.RESISTANCE_BAND: return '🎯';
      case EQUIPMENT_TYPES.MEDICINE_BALL: return '⚽';
      case EQUIPMENT_TYPES.TRX: return '🔄';
      case EQUIPMENT_TYPES.PLATE: return '🥏';
      default: return '💪';
    }
  };

  const ExerciseCard = ({ exercise, showAddButton = true }) => (
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
          '&:hover': {
            borderColor: '#ff4444',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)'
          }
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {exercise.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {exercise.primaryMuscles.join(', ')}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title={favoriteExercises.includes(exercise.id) ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  size="small"
                  onClick={() => handleToggleFavorite(exercise.id)}
                  sx={{ color: favoriteExercises.includes(exercise.id) ? '#ffaa00' : '#666' }}
                >
                  {favoriteExercises.includes(exercise.id) ? <StarIcon /> : <StarBorderIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Exercise details">
                <IconButton size="small" sx={{ color: '#666' }}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Chip
              label={exercise.category}
              size="small"
              sx={{ 
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                color: 'white',
                fontWeight: 600
              }}
            />
            <Chip
              label={exercise.equipment}
              size="small"
              variant="outlined"
              icon={<span>{getEquipmentIcon(exercise.equipment)}</span>}
            />
            <Chip
              label={exercise.difficulty}
              size="small"
              color={getDifficultyColor(exercise.difficulty)}
              variant="outlined"
            />
          </Box>

          {exercise.secondaryMuscles.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Also works: {exercise.secondaryMuscles.join(', ')}
            </Typography>
          )}

          {showAddButton && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleAddExercise(exercise)}
              sx={{
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              Add Exercise
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box>
      {/* Search Bar */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
            endAdornment: isSearching && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Searching...
                </Typography>
              </Box>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: '#1a1a1a',
              border: '1px solid #333',
              '&:hover': {
                borderColor: '#ff4444'
              },
              '&.Mui-focused': {
                borderColor: '#ff4444',
                boxShadow: '0 0 10px rgba(255, 68, 68, 0.3)'
              }
            }
          }}
        />
      </Box>

      {/* Filters */}
      <Box mb={3}>
        <Button
          variant="outlined"
          onClick={() => setShowFilters(!showFilters)}
          sx={{ mb: 2, borderColor: '#ff4444', color: '#ff4444' }}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>

        {showFilters && (
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {Object.values(EXERCISE_CATEGORIES).map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Equipment</InputLabel>
                <Select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  label="Equipment"
                >
                  <MenuItem value="">All Equipment</MenuItem>
                  {Object.values(EQUIPMENT_TYPES).map(equipment => (
                    <MenuItem key={equipment} value={equipment}>{equipment}</MenuItem>
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
                <InputLabel>Muscle Group</InputLabel>
                <Select
                  value={selectedMuscleGroup}
                  onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                  label="Muscle Group"
                >
                  <MenuItem value="">All Muscles</MenuItem>
                  {Object.values(MUSCLE_GROUPS).map(muscle => (
                    <MenuItem key={muscle} value={muscle}>{muscle}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {(selectedCategory || selectedEquipment || selectedDifficulty || selectedMuscleGroup) && (
          <Button
            variant="text"
            size="small"
            onClick={clearFilters}
            sx={{ color: '#ff4444' }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Results */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          {searchQuery || selectedCategory || selectedEquipment || selectedDifficulty || selectedMuscleGroup
            ? `Search Results (${searchResults.length})`
            : 'Popular Exercises'
          }
        </Typography>

        <Grid container spacing={2}>
          {searchResults.map((exercise) => (
            <Grid item xs={12} sm={6} md={4} key={exercise.id}>
              <ExerciseCard exercise={exercise} />
            </Grid>
          ))}
        </Grid>

        {searchResults.length === 0 && !isSearching && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" mb={2}>
              No exercises found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search terms or filters
            </Typography>
          </Box>
        )}
      </Box>

      {/* Recommended Exercises */}
      {recommendedExercises.length > 0 && !searchQuery && !selectedCategory && !selectedEquipment && !selectedDifficulty && !selectedMuscleGroup && (
        <Box mt={4}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Recommended for You
          </Typography>
          <Grid container spacing={2}>
            {recommendedExercises.map((exercise) => (
              <Grid item xs={12} sm={6} md={4} key={exercise.id}>
                <ExerciseCard exercise={exercise} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Recent Exercises */}
      {recentExercises.length > 0 && !searchQuery && !selectedCategory && !selectedEquipment && !selectedDifficulty && !selectedMuscleGroup && (
        <Box mt={4}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Recent Exercises
          </Typography>
          <Grid container spacing={2}>
            {recentExercises.slice(0, 6).map((exercise) => (
              <Grid item xs={12} sm={6} md={4} key={exercise.id}>
                <ExerciseCard exercise={exercise} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

