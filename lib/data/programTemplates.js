/**
 * Comprehensive Program Templates Database
 * Contains pre-built workout programs for different goals and experience levels
 */

import { EXERCISE_DATABASE, EXERCISE_CATEGORIES, DIFFICULTY_LEVELS } from './exerciseDatabase';

export const PROGRAM_GOALS = {
  STRENGTH: 'Strength',
  HYPERTROPHY: 'Hypertrophy',
  ENDURANCE: 'Endurance',
  FAT_LOSS: 'Fat Loss',
  GENERAL_FITNESS: 'General Fitness',
  POWERLIFTING: 'Powerlifting',
  BODYBUILDING: 'Bodybuilding',
  ATHLETIC_PERFORMANCE: 'Athletic Performance'
};

export const PROGRAM_DURATION = {
  WEEK_4: '4 Weeks',
  WEEK_8: '8 Weeks',
  WEEK_12: '12 Weeks',
  WEEK_16: '16 Weeks',
  ONGOING: 'Ongoing'
};

export const PROGRAM_FREQUENCY = {
  WEEKLY_3: '3x per week',
  WEEKLY_4: '4x per week',
  WEEKLY_5: '5x per week',
  WEEKLY_6: '6x per week',
  DAILY: 'Daily'
};

export const PROGRAM_TEMPLATES = [
  // STRENGTH PROGRAMS
  {
    id: 'stronglifts-5x5',
    name: 'Stronglifts 5x5',
    description: 'A simple, effective strength program focusing on compound movements with linear progression.',
    goal: PROGRAM_GOALS.STRENGTH,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    duration: PROGRAM_DURATION.ONGOING,
    frequency: PROGRAM_FREQUENCY.WEEKLY_3,
    equipment: ['Barbell', 'Squat Rack', 'Bench'],
    targetMuscles: ['Full Body'],
    workouts: [
      {
        name: 'Workout A',
        exercises: [
          { name: 'Squat', sets: 5, reps: 5, weight: 0, rest: 180 },
          { name: 'Bench Press', sets: 5, reps: 5, weight: 0, rest: 180 },
          { name: 'Barbell Row', sets: 5, reps: 5, weight: 0, rest: 180 }
        ]
      },
      {
        name: 'Workout B',
        exercises: [
          { name: 'Squat', sets: 5, reps: 5, weight: 0, rest: 180 },
          { name: 'Overhead Press', sets: 5, reps: 5, weight: 0, rest: 180 },
          { name: 'Deadlift', sets: 1, reps: 5, weight: 0, rest: 300 }
        ]
      }
    ],
    progression: {
      type: 'linear',
      increment: 2.5, // lbs
      deload: 10, // percent
      maxAttempts: 3
    },
    notes: [
      'Start with empty bar or light weights',
      'Add 2.5lbs each workout',
      'If you fail 3 times, deload by 10%',
      'Rest 3-5 minutes between sets',
      'Focus on form over weight'
    ],
    tags: ['beginner', 'strength', 'compound', 'linear-progression']
  },
  {
    id: 'starting-strength',
    name: 'Starting Strength',
    description: 'Mark Rippetoe\'s foundational strength program emphasizing the big three lifts.',
    goal: PROGRAM_GOALS.STRENGTH,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    duration: PROGRAM_DURATION.ONGOING,
    frequency: PROGRAM_FREQUENCY.WEEKLY_3,
    equipment: ['Barbell', 'Squat Rack', 'Bench'],
    targetMuscles: ['Full Body'],
    workouts: [
      {
        name: 'Workout A',
        exercises: [
          { name: 'Squat', sets: 3, reps: 5, weight: 0, rest: 180 },
          { name: 'Bench Press', sets: 3, reps: 5, weight: 0, rest: 180 },
          { name: 'Deadlift', sets: 1, reps: 5, weight: 0, rest: 300 }
        ]
      },
      {
        name: 'Workout B',
        exercises: [
          { name: 'Squat', sets: 3, reps: 5, weight: 0, rest: 180 },
          { name: 'Overhead Press', sets: 3, reps: 5, weight: 0, rest: 180 },
          { name: 'Power Clean', sets: 5, reps: 3, weight: 0, rest: 180 }
        ]
      }
    ],
    progression: {
      type: 'linear',
      increment: 5, // lbs
      deload: 10,
      maxAttempts: 3
    },
    notes: [
      'Focus on the big three: squat, bench, deadlift',
      'Add 5lbs each workout for upper body, 10lbs for lower body',
      'Power cleans develop explosive strength',
      'Rest 3-5 minutes between sets'
    ],
    tags: ['beginner', 'strength', 'rippetoe', 'big-three']
  },

  // HYPERTROPHY PROGRAMS
  {
    id: 'push-pull-legs',
    name: 'Push/Pull/Legs (PPL)',
    description: 'A popular hypertrophy program that splits training into push, pull, and leg days.',
    goal: PROGRAM_GOALS.HYPERTROPHY,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    duration: PROGRAM_DURATION.ONGOING,
    frequency: PROGRAM_FREQUENCY.WEEKLY_6,
    equipment: ['Barbell', 'Dumbbells', 'Cable Machine', 'Squat Rack'],
    targetMuscles: ['Full Body'],
    workouts: [
      {
        name: 'Push Day',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: 8, weight: 0, rest: 120 },
          { name: 'Overhead Press', sets: 3, reps: 8, weight: 0, rest: 120 },
          { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 0, rest: 90 },
          { name: 'Lateral Raises', sets: 3, reps: 12, weight: 0, rest: 60 },
          { name: 'Tricep Dips', sets: 3, reps: 10, weight: 0, rest: 90 },
          { name: 'Tricep Pushdowns', sets: 3, reps: 12, weight: 0, rest: 60 }
        ]
      },
      {
        name: 'Pull Day',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: 5, weight: 0, rest: 180 },
          { name: 'Pull-ups', sets: 4, reps: 8, weight: 0, rest: 120 },
          { name: 'Bent-Over Row', sets: 3, reps: 8, weight: 0, rest: 120 },
          { name: 'Cable Row', sets: 3, reps: 10, weight: 0, rest: 90 },
          { name: 'Bicep Curls', sets: 3, reps: 12, weight: 0, rest: 60 },
          { name: 'Hammer Curls', sets: 3, reps: 12, weight: 0, rest: 60 }
        ]
      },
      {
        name: 'Leg Day',
        exercises: [
          { name: 'Squat', sets: 4, reps: 8, weight: 0, rest: 180 },
          { name: 'Romanian Deadlift', sets: 3, reps: 8, weight: 0, rest: 120 },
          { name: 'Leg Press', sets: 3, reps: 12, weight: 0, rest: 90 },
          { name: 'Walking Lunges', sets: 3, reps: 12, weight: 0, rest: 90 },
          { name: 'Calf Raises', sets: 4, reps: 15, weight: 0, rest: 60 },
          { name: 'Plank', sets: 3, reps: 60, weight: 0, rest: 60 }
        ]
      }
    ],
    progression: {
      type: 'double-progression',
      increment: 2.5,
      deload: 10,
      maxAttempts: 2
    },
    notes: [
      'Train each muscle group twice per week',
      'Focus on progressive overload',
      'Use double progression (weight and reps)',
      'Rest 1-2 minutes between sets'
    ],
    tags: ['intermediate', 'hypertrophy', 'ppl', '6-day']
  },
  {
    id: 'upper-lower',
    name: 'Upper/Lower Split',
    description: 'A balanced 4-day program alternating between upper and lower body workouts.',
    goal: PROGRAM_GOALS.HYPERTROPHY,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    duration: PROGRAM_DURATION.ONGOING,
    frequency: PROGRAM_FREQUENCY.WEEKLY_4,
    equipment: ['Barbell', 'Dumbbells', 'Cable Machine', 'Squat Rack'],
    targetMuscles: ['Full Body'],
    workouts: [
      {
        name: 'Upper Body A',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: 6, weight: 0, rest: 180 },
          { name: 'Bent-Over Row', sets: 4, reps: 6, weight: 0, rest: 180 },
          { name: 'Overhead Press', sets: 3, reps: 8, weight: 0, rest: 120 },
          { name: 'Pull-ups', sets: 3, reps: 8, weight: 0, rest: 120 },
          { name: 'Dumbbell Flyes', sets: 3, reps: 12, weight: 0, rest: 90 },
          { name: 'Bicep Curls', sets: 3, reps: 12, weight: 0, rest: 60 }
        ]
      },
      {
        name: 'Lower Body A',
        exercises: [
          { name: 'Squat', sets: 4, reps: 6, weight: 0, rest: 180 },
          { name: 'Romanian Deadlift', sets: 4, reps: 6, weight: 0, rest: 180 },
          { name: 'Bulgarian Split Squat', sets: 3, reps: 8, weight: 0, rest: 120 },
          { name: 'Leg Curls', sets: 3, reps: 12, weight: 0, rest: 90 },
          { name: 'Calf Raises', sets: 4, reps: 15, weight: 0, rest: 60 },
          { name: 'Plank', sets: 3, reps: 60, weight: 0, rest: 60 }
        ]
      },
      {
        name: 'Upper Body B',
        exercises: [
          { name: 'Incline Bench Press', sets: 4, reps: 6, weight: 0, rest: 180 },
          { name: 'Cable Row', sets: 4, reps: 6, weight: 0, rest: 180 },
          { name: 'Lateral Raises', sets: 3, reps: 12, weight: 0, rest: 90 },
          { name: 'Face Pulls', sets: 3, reps: 12, weight: 0, rest: 90 },
          { name: 'Tricep Dips', sets: 3, reps: 10, weight: 0, rest: 90 },
          { name: 'Hammer Curls', sets: 3, reps: 12, weight: 0, rest: 60 }
        ]
      },
      {
        name: 'Lower Body B',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: 5, weight: 0, rest: 300 },
          { name: 'Front Squat', sets: 3, reps: 8, weight: 0, rest: 120 },
          { name: 'Walking Lunges', sets: 3, reps: 12, weight: 0, rest: 90 },
          { name: 'Leg Press', sets: 3, reps: 15, weight: 0, rest: 90 },
          { name: 'Calf Raises', sets: 4, reps: 15, weight: 0, rest: 60 },
          { name: 'Dead Bug', sets: 3, reps: 12, weight: 0, rest: 60 }
        ]
      }
    ],
    progression: {
      type: 'double-progression',
      increment: 2.5,
      deload: 10,
      maxAttempts: 2
    },
    notes: [
      'Train each muscle group twice per week',
      'Alternate between A and B workouts',
      'Focus on compound movements first',
      'Use double progression for growth'
    ],
    tags: ['intermediate', 'hypertrophy', 'upper-lower', '4-day']
  },

  // ENDURANCE PROGRAMS
  {
    id: '5-3-1',
    name: '5/3/1',
    description: 'Jim Wendler\'s strength program with built-in deloads and sustainable progression.',
    goal: PROGRAM_GOALS.STRENGTH,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    duration: PROGRAM_DURATION.ONGOING,
    frequency: PROGRAM_FREQUENCY.WEEKLY_4,
    equipment: ['Barbell', 'Squat Rack', 'Bench'],
    targetMuscles: ['Full Body'],
    workouts: [
      {
        name: 'Squat Day',
        exercises: [
          { name: 'Squat', sets: 3, reps: '5/3/1', weight: 0, rest: 180 },
          { name: 'Bench Press', sets: 5, reps: 10, weight: 0, rest: 120 },
          { name: 'Bent-Over Row', sets: 5, reps: 10, weight: 0, rest: 120 }
        ]
      },
      {
        name: 'Bench Day',
        exercises: [
          { name: 'Bench Press', sets: 3, reps: '5/3/1', weight: 0, rest: 180 },
          { name: 'Squat', sets: 5, reps: 10, weight: 0, rest: 120 },
          { name: 'Pull-ups', sets: 5, reps: 10, weight: 0, rest: 120 }
        ]
      },
      {
        name: 'Deadlift Day',
        exercises: [
          { name: 'Deadlift', sets: 3, reps: '5/3/1', weight: 0, rest: 300 },
          { name: 'Overhead Press', sets: 5, reps: 10, weight: 0, rest: 120 },
          { name: 'Dumbbell Rows', sets: 5, reps: 10, weight: 0, rest: 120 }
        ]
      },
      {
        name: 'Press Day',
        exercises: [
          { name: 'Overhead Press', sets: 3, reps: '5/3/1', weight: 0, rest: 180 },
          { name: 'Deadlift', sets: 5, reps: 10, weight: 0, rest: 120 },
          { name: 'Dips', sets: 5, reps: 10, weight: 0, rest: 120 }
        ]
      }
    ],
    progression: {
      type: 'periodized',
      increment: 5, // lbs upper, 10 lbs lower
      deload: 0, // built into program
      maxAttempts: 0
    },
    notes: [
      'Calculate 90% of your 1RM for each lift',
      'Follow 5/3/1 rep scheme for main lifts',
      'Deload every 4th week',
      'Add 5lbs upper body, 10lbs lower body each cycle'
    ],
    tags: ['intermediate', 'strength', 'wendler', 'periodized']
  },

  // FAT LOSS PROGRAMS
  {
    id: 'hiit-strength',
    name: 'HIIT Strength',
    description: 'High-intensity interval training combined with strength exercises for fat loss.',
    goal: PROGRAM_GOALS.FAT_LOSS,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    duration: PROGRAM_DURATION.WEEK_8,
    frequency: PROGRAM_FREQUENCY.WEEKLY_4,
    equipment: ['Dumbbells', 'Bodyweight', 'Kettlebell'],
    targetMuscles: ['Full Body'],
    workouts: [
      {
        name: 'HIIT Upper',
        exercises: [
          { name: 'Burpees', sets: 4, reps: 30, weight: 0, rest: 60 },
          { name: 'Push-ups', sets: 4, reps: 15, weight: 0, rest: 45 },
          { name: 'Dumbbell Rows', sets: 4, reps: 12, weight: 0, rest: 45 },
          { name: 'Mountain Climbers', sets: 4, reps: 30, weight: 0, rest: 60 },
          { name: 'Plank', sets: 4, reps: 60, weight: 0, rest: 45 }
        ]
      },
      {
        name: 'HIIT Lower',
        exercises: [
          { name: 'Jump Squats', sets: 4, reps: 20, weight: 0, rest: 60 },
          { name: 'Lunges', sets: 4, reps: 12, weight: 0, rest: 45 },
          { name: 'Kettlebell Swings', sets: 4, reps: 15, weight: 0, rest: 45 },
          { name: 'Jumping Jacks', sets: 4, reps: 30, weight: 0, rest: 60 },
          { name: 'Wall Sit', sets: 4, reps: 60, weight: 0, rest: 45 }
        ]
      },
      {
        name: 'HIIT Full Body',
        exercises: [
          { name: 'Burpees', sets: 3, reps: 20, weight: 0, rest: 60 },
          { name: 'Dumbbell Thrusters', sets: 3, reps: 12, weight: 0, rest: 60 },
          { name: 'Jump Squats', sets: 3, reps: 15, weight: 0, rest: 60 },
          { name: 'Push-ups', sets: 3, reps: 10, weight: 0, rest: 60 },
          { name: 'Mountain Climbers', sets: 3, reps: 20, weight: 0, rest: 60 }
        ]
      },
      {
        name: 'HIIT Core',
        exercises: [
          { name: 'Plank', sets: 4, reps: 60, weight: 0, rest: 45 },
          { name: 'Russian Twists', sets: 4, reps: 20, weight: 0, rest: 45 },
          { name: 'Bicycle Crunches', sets: 4, reps: 20, weight: 0, rest: 45 },
          { name: 'Mountain Climbers', sets: 4, reps: 30, weight: 0, rest: 60 },
          { name: 'Dead Bug', sets: 4, reps: 12, weight: 0, rest: 45 }
        ]
      }
    ],
    progression: {
      type: 'time-based',
      increment: 5, // seconds
      deload: 0,
      maxAttempts: 0
    },
    notes: [
      'Work at maximum intensity during work periods',
      'Rest periods are active recovery',
      'Increase work time or decrease rest time to progress',
      'Focus on form over speed'
    ],
    tags: ['intermediate', 'fat-loss', 'hiit', 'cardio']
  },

  // GENERAL FITNESS PROGRAMS
  {
    id: 'full-body-beginner',
    name: 'Full Body Beginner',
    description: 'A simple full-body program perfect for beginners starting their fitness journey.',
    goal: PROGRAM_GOALS.GENERAL_FITNESS,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    duration: PROGRAM_DURATION.WEEK_8,
    frequency: PROGRAM_FREQUENCY.WEEKLY_3,
    equipment: ['Dumbbells', 'Bodyweight'],
    targetMuscles: ['Full Body'],
    workouts: [
      {
        name: 'Full Body A',
        exercises: [
          { name: 'Bodyweight Squats', sets: 3, reps: 12, weight: 0, rest: 90 },
          { name: 'Push-ups', sets: 3, reps: 8, weight: 0, rest: 90 },
          { name: 'Dumbbell Rows', sets: 3, reps: 10, weight: 0, rest: 90 },
          { name: 'Lunges', sets: 3, reps: 10, weight: 0, rest: 90 },
          { name: 'Plank', sets: 3, reps: 30, weight: 0, rest: 60 }
        ]
      },
      {
        name: 'Full Body B',
        exercises: [
          { name: 'Goblet Squats', sets: 3, reps: 12, weight: 0, rest: 90 },
          { name: 'Dumbbell Press', sets: 3, reps: 10, weight: 0, rest: 90 },
          { name: 'Dumbbell Deadlifts', sets: 3, reps: 10, weight: 0, rest: 90 },
          { name: 'Step-ups', sets: 3, reps: 10, weight: 0, rest: 90 },
          { name: 'Dead Bug', sets: 3, reps: 10, weight: 0, rest: 60 }
        ]
      }
    ],
    progression: {
      type: 'linear',
      increment: 2.5,
      deload: 10,
      maxAttempts: 3
    },
    notes: [
      'Start with light weights or bodyweight',
      'Focus on learning proper form',
      'Add weight gradually each week',
      'Rest 1-2 minutes between sets'
    ],
    tags: ['beginner', 'general-fitness', 'full-body', '3-day']
  }
];

// Program search and filtering utilities
export const searchPrograms = (query, filters = {}) => {
  let results = PROGRAM_TEMPLATES;

  // Text search
  if (query) {
    const searchTerm = query.toLowerCase();
    results = results.filter(program => 
      program.name.toLowerCase().includes(searchTerm) ||
      program.description.toLowerCase().includes(searchTerm) ||
      program.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Goal filter
  if (filters.goal) {
    results = results.filter(program => program.goal === filters.goal);
  }

  // Difficulty filter
  if (filters.difficulty) {
    results = results.filter(program => program.difficulty === filters.difficulty);
  }

  // Duration filter
  if (filters.duration) {
    results = results.filter(program => program.duration === filters.duration);
  }

  // Frequency filter
  if (filters.frequency) {
    results = results.filter(program => program.frequency === filters.frequency);
  }

  // Equipment filter
  if (filters.equipment) {
    results = results.filter(program => 
      program.equipment.some(eq => eq.toLowerCase().includes(filters.equipment.toLowerCase()))
    );
  }

  return results;
};

export const getProgramsByGoal = (goal) => {
  return PROGRAM_TEMPLATES.filter(program => program.goal === goal);
};

export const getProgramsByDifficulty = (difficulty) => {
  return PROGRAM_TEMPLATES.filter(program => program.difficulty === difficulty);
};

export const getProgramsByDuration = (duration) => {
  return PROGRAM_TEMPLATES.filter(program => program.duration === duration);
};

export const getProgramsByFrequency = (frequency) => {
  return PROGRAM_TEMPLATES.filter(program => program.frequency === frequency);
};

export const getProgramById = (id) => {
  return PROGRAM_TEMPLATES.find(program => program.id === id);
};

export const getRecommendedPrograms = (userLevel = 'beginner', userGoal = 'general_fitness', count = 3) => {
  const filtered = PROGRAM_TEMPLATES.filter(program => 
    program.difficulty.toLowerCase() === userLevel.toLowerCase() &&
    program.goal.toLowerCase().replace(' ', '_') === userGoal.toLowerCase()
  );
  
  return filtered.slice(0, count);
};

export const getPopularPrograms = () => {
  const popularIds = [
    'stronglifts-5x5',
    'push-pull-legs',
    'upper-lower',
    '5-3-1',
    'full-body-beginner'
  ];
  return popularIds.map(id => getProgramById(id)).filter(Boolean);
};

export const getProgramVariations = (programId) => {
  const program = getProgramById(programId);
  if (!program) return [];
  
  // Return similar programs based on goal and difficulty
  return PROGRAM_TEMPLATES.filter(p => 
    p.id !== programId &&
    p.goal === program.goal &&
    p.difficulty === program.difficulty
  ).slice(0, 3);
};

export const validateProgram = (program) => {
  const errors = [];
  
  if (!program.name || program.name.trim() === '') {
    errors.push('Program name is required');
  }
  
  if (!program.workouts || program.workouts.length === 0) {
    errors.push('Program must have at least one workout');
  }
  
  if (program.workouts) {
    program.workouts.forEach((workout, index) => {
      if (!workout.name || workout.name.trim() === '') {
        errors.push(`Workout ${index + 1} must have a name`);
      }
      
      if (!workout.exercises || workout.exercises.length === 0) {
        errors.push(`Workout "${workout.name}" must have at least one exercise`);
      }
      
      if (workout.exercises) {
        workout.exercises.forEach((exercise, exIndex) => {
          if (!exercise.name || exercise.name.trim() === '') {
            errors.push(`Exercise ${exIndex + 1} in "${workout.name}" must have a name`);
          }
          
          if (exercise.sets <= 0) {
            errors.push(`Exercise "${exercise.name}" must have at least 1 set`);
          }
          
          if (exercise.reps <= 0) {
            errors.push(`Exercise "${exercise.name}" must have at least 1 rep`);
          }
        });
      }
    });
  }
  
  return errors;
};

export const createCustomProgram = (programData) => {
  const errors = validateProgram(programData);
  if (errors.length > 0) {
    throw new Error(`Program validation failed: ${errors.join(', ')}`);
  }
  
  return {
    id: `custom-${Date.now()}`,
    ...programData,
    createdAt: new Date(),
    isCustom: true
  };
};

export const exportProgram = (program) => {
  return {
    name: program.name,
    description: program.description,
    goal: program.goal,
    difficulty: program.difficulty,
    duration: program.duration,
    frequency: program.frequency,
    equipment: program.equipment,
    targetMuscles: program.targetMuscles,
    workouts: program.workouts,
    progression: program.progression,
    notes: program.notes,
    tags: program.tags
  };
};

export const importProgram = (programData) => {
  const errors = validateProgram(programData);
  if (errors.length > 0) {
    throw new Error(`Program import failed: ${errors.join(', ')}`);
  }
  
  return {
    id: `imported-${Date.now()}`,
    ...programData,
    importedAt: new Date(),
    isImported: true
  };
};

export default PROGRAM_TEMPLATES;

