'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Note as NoteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Workout Notes Component
 * Allows users to add and manage workout notes, observations, and reminders
 */
export default function WorkoutNotes({
  notes = [],
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onReorderNotes
}) {
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [editText, setEditText] = useState('');
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [showAddForm, setShowAddForm] = useState(false);

  // Note categories with colors and icons
  const noteCategories = {
    GENERAL: { label: 'General', color: '#666', icon: '📝' },
    FORM: { label: 'Form', color: '#ffaa00', icon: '🏋️' },
    PAIN: { label: 'Pain/Injury', color: '#ff4444', icon: '⚠️' },
    PROGRESS: { label: 'Progress', color: '#00ff88', icon: '📈' },
    TIP: { label: 'Tip', color: '#0088ff', icon: '💡' },
    REMINDER: { label: 'Reminder', color: '#ff00ff', icon: '🔔' }
  };

  // Handle adding new note
  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote({
        id: Date.now().toString(),
        text: newNote.trim(),
        category: 'GENERAL',
        timestamp: new Date(),
        isImportant: false
      });
      setNewNote('');
      setShowAddForm(false);
    }
  };

  // Handle updating note
  const handleUpdateNote = (noteId) => {
    if (editText.trim()) {
      onUpdateNote(noteId, { text: editText.trim() });
      setEditingNote(null);
      setEditText('');
    }
  };

  // Handle deleting note
  const handleDeleteNote = (noteId) => {
    onDeleteNote(noteId);
  };

  // Start editing note
  const startEditing = (note) => {
    setEditingNote(note.id);
    setEditText(note.text);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingNote(null);
    setEditText('');
  };

  // Toggle note expansion
  const toggleNoteExpansion = (noteId) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get note category info
  const getCategoryInfo = (category) => {
    return noteCategories[category] || noteCategories.GENERAL;
  };

  // Handle category change
  const handleCategoryChange = (noteId, newCategory) => {
    onUpdateNote(noteId, { category: newCategory });
  };

  // Handle importance toggle
  const handleImportanceToggle = (noteId, isImportant) => {
    onUpdateNote(noteId, { isImportant: !isImportant });
  };

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        border: '1px solid #333',
        borderRadius: 2
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <NoteIcon sx={{ color: '#ff4444' }} />
            Workout Notes
          </Typography>
          <Chip
            label={`${notes.length} notes`}
            size="small"
            sx={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444' }}
          />
        </Box>

        {/* Add Note Form */}
        <Box mb={3}>
          {!showAddForm ? (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setShowAddForm(true)}
              sx={{
                borderColor: '#ff4444',
                color: '#ff4444',
                '&:hover': {
                  borderColor: '#ff6666',
                  background: 'rgba(255, 68, 68, 0.1)'
                }
              }}
            >
              Add Note
            </Button>
          ) : (
            <Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a note about your workout..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    background: '#1a1a1a',
                    border: '1px solid #333'
                  }
                }}
              />
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  sx={{
                    background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                    fontWeight: 700
                  }}
                >
                  Save Note
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setShowAddForm(false);
                    setNewNote('');
                  }}
                  sx={{
                    borderColor: '#666',
                    color: '#666'
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* Notes List */}
        <Box>
          {notes.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary" mb={2}>
                No notes yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add notes to track your workout observations, form tips, or progress
              </Typography>
            </Box>
          ) : (
            notes.map((note, index) => {
              const categoryInfo = getCategoryInfo(note.category);
              const isExpanded = expandedNotes.has(note.id);
              const isEditing = editingNote === note.id;

              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    sx={{
                      mb: 2,
                      background: note.isImportant 
                        ? 'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(204, 0, 0, 0.1))'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: note.isImportant 
                        ? '1px solid rgba(255, 68, 68, 0.3)'
                        : '1px solid #333',
                      borderRadius: 2
                    }}
                  >
                    <CardContent>
                      {/* Note Header */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            label={categoryInfo.label}
                            size="small"
                            sx={{
                              background: categoryInfo.color,
                              color: 'white',
                              fontWeight: 600
                            }}
                            icon={<span>{categoryInfo.icon}</span>}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(note.timestamp)}
                          </Typography>
                          {note.isImportant && (
                            <Chip
                              label="Important"
                              size="small"
                              sx={{
                                background: 'rgba(255, 68, 68, 0.2)',
                                color: '#ff4444',
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Toggle importance">
                            <IconButton
                              size="small"
                              onClick={() => handleImportanceToggle(note.id, note.isImportant)}
                              sx={{ 
                                color: note.isImportant ? '#ff4444' : '#666',
                                '&:hover': { color: '#ff4444' }
                              }}
                            >
                              {note.isImportant ? '⭐' : '☆'}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isExpanded ? 'Collapse' : 'Expand'}>
                            <IconButton
                              size="small"
                              onClick={() => toggleNoteExpansion(note.id)}
                              sx={{ color: '#666' }}
                            >
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Note Content */}
                      <Box>
                        {isEditing ? (
                          <Box>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                  background: '#1a1a1a',
                                  border: '1px solid #333'
                                }
                              }}
                            />
                            <Box display="flex" gap={2}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={() => handleUpdateNote(note.id)}
                                disabled={!editText.trim()}
                                sx={{
                                  background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                                  fontWeight: 700
                                }}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={cancelEditing}
                                sx={{
                                  borderColor: '#666',
                                  color: '#666'
                                }}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <Box>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                mb: 2,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            >
                              {note.text}
                            </Typography>
                            
                            {/* Action Buttons */}
                            <Box display="flex" gap={2}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => startEditing(note)}
                                sx={{
                                  borderColor: '#ffaa00',
                                  color: '#ffaa00',
                                  '&:hover': {
                                    borderColor: '#ffcc00',
                                    background: 'rgba(255, 170, 0, 0.1)'
                                  }
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteNote(note.id)}
                                sx={{
                                  borderColor: '#ff4444',
                                  color: '#ff4444',
                                  '&:hover': {
                                    borderColor: '#ff6666',
                                    background: 'rgba(255, 68, 68, 0.1)'
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Box>

                      {/* Expanded Content */}
                      <Collapse in={isExpanded}>
                        <Box mt={2} pt={2} borderTop="1px solid #333">
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                            Note Details:
                          </Typography>
                          
                          {/* Category Selection */}
                          <Box mb={2}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Category:
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              {Object.entries(noteCategories).map(([key, info]) => (
                                <Chip
                                  key={key}
                                  label={info.label}
                                  size="small"
                                  onClick={() => handleCategoryChange(note.id, key)}
                                  sx={{
                                    background: note.category === key ? info.color : 'rgba(255, 255, 255, 0.1)',
                                    color: note.category === key ? 'white' : '#666',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      background: info.color,
                                      color: 'white'
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>

                          {/* Timestamp */}
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(note.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

