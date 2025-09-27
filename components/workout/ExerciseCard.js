'use client';

import {
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Chip,
  Checkbox,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * ExerciseCard Component
 * Displays individual exercise with sets and controls
 */
export default function ExerciseCard({
  exercise,
  exerciseIndex,
  exerciseHistory,
  bulkModeEnabled,
  selectedSets,
  onToggleSetSelection,
  onUpdateSet,
  onCompleteSet,
  onAddSet,
  onRemoveExercise,
  onMoveExerciseUp,
  onMoveExerciseDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  draggedExercise
}) {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        draggable
        onDragStart={(e) => onDragStart(e, exerciseIndex)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, exerciseIndex)}
        sx={{
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.9), rgba(255, 68, 68, 0.05))',
          border: draggedExercise === exerciseIndex ? '2px dashed #ff4444' : '1px solid #333',
          mb: 2,
          cursor: 'move',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.2)'
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 auto', minWidth: 0 }}>
              <DragIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', cursor: 'grab' }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  lineHeight: 1.2,
                  flex: '1 1 auto',
                  minWidth: 0
                }}
              >
                {exercise.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>
                <Chip
                  label={`Target: ${exercise.targetSets}×${exercise.targetReps}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {exerciseHistory[exercise.name] && exerciseHistory[exercise.name].length > 0 && (
                  <Chip
                    label={`Last: ${exerciseHistory[exercise.name][0].weight}kg × ${exerciseHistory[exercise.name][0].reps}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <IconButton
                  onClick={() => onMoveExerciseUp(exerciseIndex)}
                  disabled={exerciseIndex === 0}
                  size="small"
                  sx={{
                    color: exerciseIndex === 0 ? 'text.disabled' : 'primary.main',
                    minWidth: '32px',
                    height: '32px'
                  }}
                >
                  <ArrowUpIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => onMoveExerciseDown(exerciseIndex)}
                  size="small"
                  sx={{
                    color: 'primary.main',
                    minWidth: '32px',
                    height: '32px'
                  }}
                >
                  <ArrowDownIcon fontSize="small" />
                </IconButton>
              </Box>
              <IconButton
                onClick={() => onRemoveExercise(exerciseIndex)}
                color="error"
                size="small"
                sx={{ minWidth: '32px', height: '32px' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {exercise.sets.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={1} sx={{ mb: 1 }}>
                {bulkModeEnabled && (
                  <Grid item xs={0.8}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6rem' }}>✓</Typography>
                  </Grid>
                )}
                <Grid item xs={bulkModeEnabled ? 0.8 : 1}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>SET</Typography>
                </Grid>
                <Grid item xs={bulkModeEnabled ? 3.2 : 3.5}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>WEIGHT (KG)</Typography>
                </Grid>
                <Grid item xs={2.5}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>REPS</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>RPE</Typography>
                </Grid>
                <Grid item xs={bulkModeEnabled ? 2.7 : 3}>
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>DONE</Typography>
                </Grid>
              </Grid>

              {exercise.sets.map((set, setIndex) => (
                <Box key={setIndex} sx={{ mb: 3, p: 2, border: '1px solid #333', borderRadius: 2, bgcolor: 'rgba(26, 26, 26, 0.5)' }}>
                  <Grid container spacing={1} alignItems="stretch">
                    {/* Checkbox for bulk operations */}
                    {bulkModeEnabled && (
                      <Grid item xs={0.8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}>
                          <Checkbox
                            checked={selectedSets[`${exerciseIndex}-${setIndex}`] || false}
                            onChange={() => onToggleSetSelection(exerciseIndex, setIndex)}
                            sx={{
                              color: '#ffaa00',
                              '&.Mui-checked': {
                                color: '#ffaa00'
                              },
                              '&:hover': {
                                backgroundColor: 'rgba(255, 170, 0, 0.1)'
                              }
                            }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {/* Set Number */}
                    <Grid item xs={bulkModeEnabled ? 0.8 : 1}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '56px',
                        bgcolor: set.completed ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 68, 68, 0.1)',
                        borderRadius: 1,
                        border: `2px solid ${set.completed ? '#00ff88' : '#ff4444'}`
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: set.completed ? '#00ff88' : '#ff4444' }}>
                          {setIndex + 1}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Weight */}
                    <Grid item xs={bulkModeEnabled ? 3.2 : 3.5}>
                      <Box sx={{ position: 'relative' }}>
                        <TextField
                          type="number"
                          value={set.weight}
                          onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                          placeholder="kg"
                          fullWidth
                          inputProps={{
                            inputMode: 'decimal',
                            pattern: '[0-9]*',
                            style: {
                              fontSize: '1.2rem',
                              textAlign: 'center',
                              fontWeight: 700,
                              padding: '8px'
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#0a0a0a',
                              height: '56px',
                              fontSize: '1.2rem',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                borderWidth: '2px'
                              }
                            }
                          }}
                        />
                        {exerciseHistory[exercise.name] && exerciseHistory[exercise.name][0] && !set.weight && (
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: '#666',
                              fontWeight: 600,
                              fontSize: '1rem',
                              pointerEvents: 'none',
                              opacity: 0.7
                            }}
                          >
                            {exerciseHistory[exercise.name][0].weight}kg
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    {/* Reps */}
                    <Grid item xs={2.5}>
                      <Box sx={{ position: 'relative' }}>
                        <TextField
                          type="number"
                          value={set.reps}
                          onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                          placeholder="reps"
                          fullWidth
                          inputProps={{
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                            style: {
                              fontSize: '1.2rem',
                              textAlign: 'center',
                              fontWeight: 700,
                              padding: '8px'
                            }
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#0a0a0a',
                              height: '56px',
                              fontSize: '1.2rem',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                borderWidth: '2px'
                              }
                            }
                          }}
                        />
                        {exerciseHistory[exercise.name] && exerciseHistory[exercise.name][0] && !set.reps && (
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: '#666',
                              fontWeight: 600,
                              fontSize: '1rem',
                              pointerEvents: 'none',
                              opacity: 0.7
                            }}
                          >
                            {exerciseHistory[exercise.name][0].reps}
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    {/* RPE */}
                    <Grid item xs={2}>
                      <TextField
                        select
                        value={set.rpe || ''}
                        onChange={(e) => onUpdateSet(exerciseIndex, setIndex, 'rpe', e.target.value)}
                        placeholder="RPE"
                        fullWidth
                        SelectProps={{
                          displayEmpty: true,
                          renderValue: (value) => value || 'RPE'
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#0a0a0a',
                            height: '56px',
                            fontSize: '1rem',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main'
                            }
                          }
                        }}
                      >
                        <MenuItem value="">-</MenuItem>
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(rpe => (
                          <MenuItem key={rpe} value={rpe.toString()}>{rpe}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    {/* Complete Button */}
                    <Grid item xs={bulkModeEnabled ? 2.7 : 3}>
                      <Button
                        variant={set.completed ? "contained" : "outlined"}
                        onClick={() => onCompleteSet(exerciseIndex, setIndex)}
                        fullWidth
                        sx={{
                          height: '56px',
                          minWidth: 'unset',
                          fontWeight: 900,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          background: set.completed ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'transparent',
                          color: set.completed ? '#000' : 'primary.main',
                          border: set.completed ? 'none' : '2px solid',
                          borderColor: 'primary.main',
                          borderRadius: 2,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          '&:hover': {
                            background: set.completed
                              ? 'linear-gradient(135deg, #00ff88, #00cc66)'
                              : 'rgba(255, 68, 68, 0.1)',
                            borderColor: 'primary.main',
                            transform: 'scale(1.02)',
                            boxShadow: '0 4px 20px rgba(255, 68, 68, 0.3)'
                          },
                          '&:active': {
                            transform: 'scale(0.98)'
                          },
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {set.completed ? '✅ DONE' : '⭕ SET'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          )}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => onAddSet(exerciseIndex)}
            fullWidth
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              height: { xs: '48px', sm: '40px' },
              fontSize: { xs: '0.9rem', sm: '0.875rem' },
              mt: 1,
              '&:hover': {
                background: 'rgba(255, 68, 68, 0.1)',
                borderColor: 'primary.main',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Add Set
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}