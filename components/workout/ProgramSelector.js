'use client';

import {
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  CircularProgress,
  Typography
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

/**
 * ProgramSelector Component
 * Handles program selection and related actions
 */
export default function ProgramSelector({
  programs,
  selectedProgramId,
  loading,
  onProgramSelect,
  onAddExercise,
  onManagePrograms,
  onRestSettings,
  restSettings,
  autoAdvanceEnabled,
  onToggleAutoAdvance,
  bulkModeEnabled,
  onToggleBulkMode
}) {
  return (
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
          onChange={onProgramSelect}
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
          onClick={onAddExercise}
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
          onClick={onRestSettings}
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
          onClick={onToggleAutoAdvance}
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
          onClick={onToggleBulkMode}
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
  );
}
