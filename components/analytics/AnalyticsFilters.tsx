'use client';

import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import type { AnalyticsFiltersProps } from '@/types';

/**
 * AnalyticsFilters component provides filter controls for analytics data
 */
export default function AnalyticsFilters({
  selectedProgram,
  selectedExercise,
  programs,
  exerciseList,
  onProgramChange,
  onExerciseChange
}: AnalyticsFiltersProps) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel sx={{ color: 'text.secondary' }}>Program</InputLabel>
          <Select
            value={selectedProgram}
            onChange={(e) => onProgramChange(e.target.value)}
            label="Program"
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#333'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              }
            }}
          >
            <MenuItem value="all">All Programs</MenuItem>
            {programs.map(program => (
              <MenuItem key={program.id} value={program.name}>
                {program.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel sx={{ color: 'text.secondary' }}>Exercise</InputLabel>
          <Select
            value={selectedExercise}
            onChange={(e) => onExerciseChange(e.target.value)}
            label="Exercise"
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#333'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              }
            }}
          >
            <MenuItem value="all">All Exercises</MenuItem>
            {exerciseList.map(exercise => (
              <MenuItem key={exercise} value={exercise}>
                {exercise}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
}

