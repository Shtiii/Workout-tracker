'use client';

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Button,
  TextField,
  Box,
  Grid,
  Paper,
  Typography,
  Modal
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  maxHeight: '80vh',
  overflow: 'auto',
  bgcolor: '#1a1a1a',
  border: '2px solid #ff4444',
  borderRadius: 2,
  boxShadow: '0 0 50px rgba(255, 68, 68, 0.3)',
  p: 4,
};

const ExerciseForm = ({
  programs,
  selectedProgramId,
  loading,
  modalOpen,
  setModalOpen,
  exerciseSearch,
  setExerciseSearch,
  availableExercises,
  filteredExercises,
  recentExercises,
  restSettings,
  setRestSettings,
  autoAdvanceEnabled,
  setAutoAdvanceEnabled,
  bulkModeEnabled,
  setBulkModeEnabled,
  handleProgramSelect,
  addCustomExercise,
  addCustomExerciseFromSearch,
  clearSelectedSets
}) => {
  return (
    <>
      <Paper
        sx={{
          background: '#1a1a1a',
          border: '1px solid #333',
          p: 3,
          mb: 3
        }}
      >
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: 1
            }}
          >
            Training Program
          </InputLabel>
          <Select
            value={selectedProgramId}
            label="Training Program"
            onChange={handleProgramSelect}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#333',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              }
            }}
          >
            <MenuItem value="">Custom Workout</MenuItem>
            {loading ? (
              <MenuItem disabled>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography>Loading programs...</Typography>
                </Box>
              </MenuItem>
            ) : (
              programs.map((program) => (
                <MenuItem key={program.id} value={program.id}>
                  {program.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setModalOpen(true)}
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              flex: { xs: '1 1 50%', sm: '1 1 auto' },
              minWidth: '120px',
              height: { xs: '44px', sm: '40px' },
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            Add Exercise
          </Button>

          {/* Manage Programs Button */}
          <Button
            variant="outlined"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/programs';
              }
            }}
            sx={{
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              flex: { xs: '1 1 50%', sm: '1 1 auto' },
              minWidth: '120px',
              height: { xs: '44px', sm: '40px' },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              borderColor: '#ffaa00',
              color: '#ffaa00',
              '&:hover': {
                borderColor: '#ffaa00',
                bgcolor: 'rgba(255, 170, 0, 0.1)'
              }
            }}
          >
            Programs
          </Button>

          {/* Rest Settings Button */}
          <Button
            variant="outlined"
            onClick={() => {
              const newDuration = prompt('Rest duration (seconds):', restSettings.duration);
              if (newDuration && !isNaN(newDuration)) {
                setRestSettings(prev => ({ ...prev, duration: parseInt(newDuration) }));
              }
            }}
            sx={{
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              minWidth: { xs: '90px', sm: '100px' },
              height: { xs: '36px', sm: '40px' }
            }}
          >
            Rest: {restSettings.duration}s
          </Button>

          {/* Auto-advance Toggle */}
          <Button
            variant={autoAdvanceEnabled ? "contained" : "outlined"}
            onClick={() => setAutoAdvanceEnabled(!autoAdvanceEnabled)}
            sx={{
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              minWidth: { xs: '80px', sm: '100px' },
              height: { xs: '36px', sm: '40px' },
              background: autoAdvanceEnabled ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'transparent',
              color: autoAdvanceEnabled ? '#000' : 'primary.main',
              '&:hover': {
                background: autoAdvanceEnabled ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'rgba(255, 68, 68, 0.1)'
              }
            }}
          >
            Auto: {autoAdvanceEnabled ? 'ON' : 'OFF'}
          </Button>

          {/* Bulk Mode Toggle */}
          <Button
            variant={bulkModeEnabled ? "contained" : "outlined"}
            onClick={() => {
              setBulkModeEnabled(!bulkModeEnabled);
              if (bulkModeEnabled) clearSelectedSets();
            }}
            sx={{
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              minWidth: { xs: '80px', sm: '100px' },
              height: { xs: '36px', sm: '40px' },
              background: bulkModeEnabled ? 'linear-gradient(135deg, #ffaa00, #ff8800)' : 'transparent',
              color: bulkModeEnabled ? '#000' : '#ffaa00',
              borderColor: '#ffaa00',
              '&:hover': {
                background: bulkModeEnabled ? 'linear-gradient(135deg, #ffaa00, #ff8800)' : 'rgba(255, 170, 0, 0.1)',
                borderColor: '#ffaa00'
              }
            }}
          >
            Bulk: {bulkModeEnabled ? 'ON' : 'OFF'}
          </Button>
        </Box>
      </Paper>

      {/* Add Exercise Modal */}
      <Modal open={modalOpen} onClose={() => {setModalOpen(false); setExerciseSearch('');}}>
        <Box sx={{
          ...modalStyle,
          width: { xs: '95vw', sm: 600 },
          maxWidth: '600px'
        }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textTransform: 'uppercase' }}>
            🔍 Add Exercise
          </Typography>

          {/* Search Input */}
          <TextField
            fullWidth
            label="Search exercises..."
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && exerciseSearch.trim()) {
                addCustomExerciseFromSearch();
              }
            }}
            autoFocus
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0a0a0a',
                fontSize: { xs: '1rem', sm: '1rem' },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main'
                }
              }
            }}
            InputProps={{
              sx: {
                fontSize: { xs: '1rem', sm: '1rem' },
                height: { xs: '56px', sm: '56px' }
              }
            }}
          />

          {/* Quick Add Button for Custom Exercise */}
          {exerciseSearch.trim() && !availableExercises.some(ex =>
            ex.toLowerCase() === exerciseSearch.toLowerCase()
          ) && (
            <Button
              variant="contained"
              onClick={addCustomExerciseFromSearch}
              fullWidth
              sx={{
                mb: 2,
                background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                fontWeight: 700,
                py: { xs: 1.5, sm: 1.5 },
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              ➕ Add &quot;{exerciseSearch}&quot; as Custom Exercise
            </Button>
          )}

          {/* Recent Exercises */}
          {recentExercises.length > 0 && exerciseSearch === '' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main', fontWeight: 700 }}>
                🕒 Recently Used
              </Typography>
              <Grid container spacing={1}>
                {recentExercises.map((exercise, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Button
                      variant="outlined"
                      onClick={() => addCustomExercise(exercise)}
                      size="small"
                      sx={{
                        width: '100%',
                        py: { xs: 1.5, sm: 1 },
                        px: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        fontWeight: 600,
                        borderColor: '#ffaa00',
                        color: '#ffaa00',
                        textTransform: 'none',
                        '&:hover': {
                          background: 'rgba(255, 170, 0, 0.1)',
                          borderColor: '#ffaa00'
                        }
                      }}
                    >
                      {exercise}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Exercise Grid */}
          <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
            <Grid container spacing={1}>
              {filteredExercises.map((exercise, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Button
                    variant="outlined"
                    onClick={() => addCustomExercise(exercise)}
                    sx={{
                      width: '100%',
                      py: { xs: 1.5, sm: 1.5 },
                      px: { xs: 1, sm: 1.5 },
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      fontWeight: 600,
                      textTransform: 'none',
                      minHeight: { xs: '48px', sm: '52px' },
                      '&:hover': {
                        background: 'rgba(255, 68, 68, 0.1)',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    {exercise}
                  </Button>
                </Grid>
              ))}
            </Grid>

            {filteredExercises.length === 0 && exerciseSearch && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No exercises found. Press Enter to add &quot;{exerciseSearch}&quot; as custom.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ExerciseForm;