'use client';

import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Grid
} from '@mui/material';

/**
 * ExerciseModal Component
 * Modal for adding exercises to workout
 */
export default function ExerciseModal({
  open,
  onClose,
  exerciseSearch,
  onExerciseSearchChange,
  onAddCustomExerciseFromSearch,
  availableExercises,
  recentExercises,
  filteredExercises,
  onAddCustomExercise
}) {
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

  return (
    <Modal open={open} onClose={onClose}>
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
          onChange={onExerciseSearchChange}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && exerciseSearch.trim()) {
              onAddCustomExerciseFromSearch();
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
            onClick={onAddCustomExerciseFromSearch}
            fullWidth
            sx={{
              mb: 2,
              background: 'linear-gradient(135deg, #ff4444, #cc0000)',
              fontWeight: 700,
              py: { xs: 1.5, sm: 1.5 },
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            ➕ Add "{exerciseSearch}" as Custom Exercise
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
                    onClick={() => onAddCustomExercise(exercise)}
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
                  onClick={() => onAddCustomExercise(exercise)}
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
                No exercises found. Press Enter to add "{exerciseSearch}" as custom.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
}
