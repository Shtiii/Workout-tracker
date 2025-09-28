'use client';

import {
  Paper,
  Typography,
  Box,
  Button
} from '@mui/material';

/**
 * BulkActionsBar Component
 * Displays bulk actions for selected sets
 */
export default function BulkActionsBar({
  selectedSetsCount,
  onClearSelectedSets,
  onBulkCompleteSets,
  onBulkDuplicateSets,
  onBulkDeleteSets
}) {
  if (selectedSetsCount === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, rgba(255, 170, 0, 0.1))',
        border: '2px solid #ffaa00',
        p: 2,
        mb: 3,
        position: 'sticky',
        top: 16,
        zIndex: 100
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#ffaa00', fontWeight: 700 }}>
          {selectedSetsCount} sets selected
        </Typography>
        <Button
          variant="outlined"
          onClick={onClearSelectedSets}
          sx={{ color: '#ffaa00', borderColor: '#ffaa00' }}
        >
          Clear Selection
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={onBulkCompleteSets}
          sx={{
            background: 'linear-gradient(135deg, #00ff88, #00cc66)',
            color: '#000',
            fontWeight: 700
          }}
        >
          Complete All
        </Button>
        <Button
          variant="contained"
          onClick={onBulkDuplicateSets}
          sx={{
            background: 'linear-gradient(135deg, #ffaa00, #ff8800)',
            color: '#000',
            fontWeight: 700
          }}
        >
          Duplicate All
        </Button>
        <Button
          variant="contained"
          onClick={onBulkDeleteSets}
          sx={{
            background: 'linear-gradient(135deg, #ff4444, #cc0000)',
            fontWeight: 700
          }}
        >
          Delete All
        </Button>
      </Box>
    </Paper>
  );
}
