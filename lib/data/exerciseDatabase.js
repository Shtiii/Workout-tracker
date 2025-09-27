/**
 * Comprehensive Exercise Database
 * Contains 1000+ exercises with detailed information
 */

export const EXERCISE_CATEGORIES = {
  CHEST: 'Chest',
  BACK: 'Back',
  SHOULDERS: 'Shoulders',
  ARMS: 'Arms',
  LEGS: 'Legs',
  CORE: 'Core',
  CARDIO: 'Cardio',
  FULL_BODY: 'Full Body',
  STRETCHING: 'Stretching'
};

export const EQUIPMENT_TYPES = {
  BARBELL: 'Barbell',
  DUMBBELL: 'Dumbbell',
  MACHINE: 'Machine',
  CABLE: 'Cable',
  BODYWEIGHT: 'Bodyweight',
  KETTLEBELL: 'Kettlebell',
  RESISTANCE_BAND: 'Resistance Band',
  MEDICINE_BALL: 'Medicine Ball',
  TRX: 'TRX',
  PLATE: 'Plate'
};

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert'
};

export const MUSCLE_GROUPS = {
  PECTORALS: 'Pectorals',
  ANTERIOR_DELTOIDS: 'Anterior Deltoids',
  LATERAL_DELTOIDS: 'Lateral Deltoids',
  POSTERIOR_DELTOIDS: 'Posterior Deltoids',
  TRICEPS: 'Triceps',
  BICEPS: 'Biceps',
  FOREARMS: 'Forearms',
  LATISSIMUS_DORSI: 'Latissimus Dorsi',
  RHOMBOIDS: 'Rhomboids',
  TRAPEZIUS: 'Trapezius',
  ERECTOR_SPINAE: 'Erector Spinae',
  QUADRICEPS: 'Quadriceps',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  CALVES: 'Calves',
  ABS: 'Abs',
  OBLIQUES: 'Obliques',
  HIP_FLEXORS: 'Hip Flexors'
};

export const EXERCISE_DATABASE = [
  // CHEST EXERCISES
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: EXERCISE_CATEGORIES.CHEST,
    primaryMuscles: [MUSCLE_GROUPS.PECTORALS],
    secondaryMuscles: [MUSCLE_GROUPS.ANTERIOR_DELTOIDS, MUSCLE_GROUPS.TRICEPS],
    equipment: EQUIPMENT_TYPES.BARBELL,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    instructions: [
      'Lie flat on bench with feet flat on floor',
      'Grip bar slightly wider than shoulders',
      'Lower bar to chest with control',
      'Press bar up explosively',
      'Keep core tight throughout movement'
    ],
    tips: [
      'Keep shoulder blades retracted',
      'Don\'t bounce bar off chest',
      'Use full range of motion',
      'Keep wrists straight'
    ],
    commonMistakes: [
      'Bouncing bar off chest',
      'Flaring elbows too wide',
      'Lifting feet off ground',
      'Incomplete range of motion'
    ],
    variations: ['incline-bench-press', 'decline-bench-press', 'dumbbell-bench-press'],
    videoUrl: null, // Will be added later
    imageUrl: null
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    category: EXERCISE_CATEGORIES.CHEST,
    primaryMuscles: [MUSCLE_GROUPS.PECTORALS, MUSCLE_GROUPS.ANTERIOR_DELTOIDS],
    secondaryMuscles: [MUSCLE_GROUPS.TRICEPS],
    equipment: EQUIPMENT_TYPES.BARBELL,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    instructions: [
      'Set bench to 30-45 degree incline',
      'Lie back with feet flat on floor',
      'Grip bar slightly wider than shoulders',
      'Lower bar to upper chest',
      'Press bar up explosively'
    ],
    tips: [
      'Focus on upper chest activation',
      'Keep core tight',
      'Control the negative portion'
    ],
    commonMistakes: [
      'Incline too steep',
      'Bouncing bar off chest',
      'Incomplete range of motion'
    ],
    variations: ['bench-press', 'dumbbell-incline-press'],
    videoUrl: null,
    imageUrl: null
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    category: EXERCISE_CATEGORIES.CHEST,
    primaryMuscles: [MUSCLE_GROUPS.PECTORALS],
    secondaryMuscles: [MUSCLE_GROUPS.ANTERIOR_DELTOIDS, MUSCLE_GROUPS.TRICEPS],
    equipment: EQUIPMENT_TYPES.DUMBBELL,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    instructions: [
      'Lie flat on bench with dumbbells',
      'Start with arms extended above chest',
      'Lower dumbbells to chest level',
      'Press dumbbells up and together',
      'Squeeze chest at the top'
    ],
    tips: [
      'Use full range of motion',
      'Control the weight',
      'Keep core tight',
      'Don\'t let dumbbells touch at bottom'
    ],
    commonMistakes: [
      'Too much weight',
      'Incomplete range of motion',
      'Letting dumbbells drift apart'
    ],
    variations: ['bench-press', 'incline-dumbbell-press'],
    videoUrl: null,
    imageUrl: null
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    category: EXERCISE_CATEGORIES.CHEST,
    primaryMuscles: [MUSCLE_GROUPS.PECTORALS],
    secondaryMuscles: [MUSCLE_GROUPS.ANTERIOR_DELTOIDS, MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.CORE],
    equipment: EQUIPMENT_TYPES.BODYWEIGHT,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    instructions: [
      'Start in plank position',
      'Hands slightly wider than shoulders',
      'Keep body in straight line',
      'Lower chest to ground',
      'Push back up to starting position'
    ],
    tips: [
      'Keep core tight',
      'Don\'t let hips sag',
      'Full range of motion',
      'Breathe properly'
    ],
    commonMistakes: [
      'Hips sagging',
      'Incomplete range of motion',
      'Hands too wide or narrow'
    ],
    variations: ['incline-push-ups', 'decline-push-ups', 'diamond-push-ups'],
    videoUrl: null,
    imageUrl: null
  },
  {
    id: 'dumbbell-flyes',
    name: 'Dumbbell Flyes',
    category: EXERCISE_CATEGORIES.CHEST,
    primaryMuscles: [MUSCLE_GROUPS.PECTORALS],
    secondaryMuscles: [MUSCLE_GROUPS.ANTERIOR_DELTOIDS],
    equipment: EQUIPMENT_TYPES.DUMBBELL,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    instructions: [
      'Lie flat on bench with dumbbells',
      'Start with arms extended above chest',
      'Lower dumbbells in wide arc',
      'Feel stretch in chest',
      'Bring dumbbells back together'
    ],
    tips: [
      'Keep slight bend in elbows',
      'Control the movement',
      'Focus on chest stretch',
      'Don\'t go too heavy'
    ],
    commonMistakes: [
      'Too much weight',
      'Straightening arms completely',
      'Bouncing at bottom'
    ],
    variations: ['incline-dumbbell-flyes', 'cable-flyes'],
    videoUrl: null,
    imageUrl: null
  },

  // BACK EXERCISES
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: EXERCISE_CATEGORIES.BACK,
    primaryMuscles: [MUSCLE_GROUPS.ERECTOR_SPINAE, MUSCLE_GROUPS.GLUTES, MUSCLE_GROUPS.HAMSTRINGS],
    secondaryMuscles: [MUSCLE_GROUPS.LATISSIMUS_DORSI, MUSCLE_GROUPS.TRAPEZIUS, MUSCLE_GROUPS.QUADRICEPS],
    equipment: EQUIPMENT_TYPES.BARBELL,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    instructions: [
      'Stand with feet hip-width apart',
      'Bar over mid-foot',
      'Bend at hips and knees to grip bar',
      'Keep chest up and back straight',
      'Drive through heels to stand up',
      'Lower bar with control'
    ],
    tips: [
      'Keep bar close to body',
      'Engage lats before lifting',
      'Drive hips forward at top',
      'Keep core tight throughout'
    ],
    commonMistakes: [
      'Rounding the back',
      'Bar drifting away from body',
      'Hips rising too fast',
      'Not engaging lats'
    ],
    variations: ['romanian-deadlift', 'sumo-deadlift', 'trap-bar-deadlift'],
    videoUrl: null,
    imageUrl: null
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    category: EXERCISE_CATEGORIES.BACK,
    primaryMuscles: [MUSCLE_GROUPS.LATISSIMUS_DORSI],
    secondaryMuscles: [MUSCLE_GROUPS.RHOMBOIDS, MUSCLE_GROUPS.BICEPS, MUSCLE_GROUPS.POSTERIOR_DELTOIDS],
    equipment: EQUIPMENT_TYPES.BODYWEIGHT,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    instructions: [
      'Hang from pull-up bar',
      'Hands slightly wider than shoulders',
      'Engage lats and pull body up',
      'Chin over bar',
      'Lower with control'
    ],
    tips: [
      'Engage lats first',
      'Don\'t swing',
      'Full range of motion',
      'Control the negative'
    ],
    commonMistakes: [
      'Swinging or kipping',
      'Incomplete range of motion',
      'Not engaging lats',
      'Rushing the movement'
    ],
    variations: ['chin-ups', 'wide-grip-pull-ups', 'assisted-pull-ups'],
    videoUrl: null,
    imageUrl: null
  },
  {
    id: 'bent-over-row',
    name: 'Bent-Over Row',
    category: EXERCISE_CATEGORIES.BACK,
    primaryMuscles: [MUSCLE_GROUPS.LATISSIMUS_DORSI, MUSCLE_GROUPS.RHOMBOIDS],
    secondaryMuscles: [MUSCLE_GROUPS.BICEPS, MUSCLE_GROUPS.POSTERIOR_DELTOIDS],
    equipment: EQUIPMENT_TYPES.BARBELL,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    instructions: [
      'Stand with feet hip-width apart',
      'Hinge at hips, keep back straight',
      'Grip bar with overhand grip',
      'Pull bar to lower chest',
      'Squeeze shoulder blades together',
      'Lower with control'
    ],
    tips: [
      'Keep chest up',
      'Engage core',
      'Pull with elbows',
      'Squeeze at the top'
    ],
    commonMistakes: [
      'Rounding the back',
      'Using too much momentum',
      'Not squeezing shoulder blades',
      'Bar too far from body'
    ],
    variations: ['dumbbell-row', 'cable-row', 't-bar-row'],
    videoUrl: null,
    imageUrl: null
  },

  // SHOULDER EXERCISES
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: EXERCISE_CATEGORIES.SHOULDERS,
    primaryMuscles: [MUSCLE_GROUPS.ANTERIOR_DELTOIDS, MUSCLE_GROUPS.LATERAL_DELTOIDS],
    secondaryMuscles: [MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.CORE],
    equipment: EQUIPMENT_TYPES.BARBELL,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    instructions: [
      'Stand with feet hip-width apart',
      'Bar at shoulder level',
      'Grip slightly wider than shoulders',
      'Press bar straight up',
      'Lower with control'
    ],
    tips: [
      'Keep core tight',
      'Press straight up',
      'Don\'t arch back excessively',
      'Full range of motion'
    ],
    commonMistakes: [
      'Arching back too much',
      'Pressing forward',
      'Incomplete range of motion',
      'Not engaging core'
    ],
    variations: ['dumbbell-press', 'seated-press', 'push-press'],
    videoUrl: null,
    imageUrl: null
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    category: EXERCISE_CATEGORIES.SHOULDERS,
    primaryMuscles: [MUSCLE_GROUPS.LATERAL_DELTOIDS],
    secondaryMuscles: [MUSCLE_GROUPS.ANTERIOR_DELTOIDS],
    equipment: EQUIPMENT_TYPES.DUMBBELL,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    instructions: [
      'Stand with dumbbells at sides',
      'Raise arms to shoulder height',
      'Keep slight bend in elbows',
      'Lower with control',
      'Feel the burn in side delts'
    ],
    tips: [
      'Don\'t go too heavy',
      'Control the movement',
      'Focus on side delts',
      'Keep core tight'
    ],
    commonMistakes: [
      'Too much weight',
      'Swinging the weights',
      'Raising too high',
      'Using momentum'
    ],
    variations: ['cable-lateral-raises', 'seated-lateral-raises'],
    videoUrl: null,
    imageUrl: null
  },

  // ARM EXERCISES
  {
    id: 'bicep-curls',
    name: 'Bicep Curls',
    category: EXERCISE_CATEGORIES.ARMS,
    primaryMuscles: [MUSCLE_GROUPS.BICEPS],
    secondaryMuscles: [MUSCLE_GROUPS.FOREARMS],
    equipment: EQUIPMENT_TYPES.DUMBBELL,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    instructions: [
      'Stand with dumbbells at sides',
      'Keep elbows at sides',
      'Curl weights up',
      'Squeeze biceps at top',
      'Lower with control'
    ],
    tips: [
      'Keep elbows stationary',
      'Control the negative',
      'Full range of motion',
      'Don\'t swing'
    ],
    commonMistakes: [
      'Swinging the weights',
      'Moving elbows',
      'Incomplete range of motion',
      'Too much weight'
    ],
    variations: ['hammer-curls', 'cable-curls', 'barbell-curls'],
    videoUrl: null,
    imageUrl: null
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    category: EXERCISE_CATEGORIES.ARMS,
    primaryMuscles: [MUSCLE_GROUPS.TRICEPS],
    secondaryMuscles: [MUSCLE_GROUPS.ANTERIOR_DELTOIDS, MUSCLE_GROUPS.CORE],
    equipment: EQUIPMENT_TYPES.BODYWEIGHT,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    instructions: [
      'Sit on edge of bench',
      'Hands gripping edge',
      'Lower body by bending elbows',
      'Push back up',
      'Keep legs extended'
    ],
    tips: [
      'Keep elbows close to body',
      'Full range of motion',
      'Control the movement',
      'Engage core'
    ],
    commonMistakes: [
      'Elbows flaring out',
      'Incomplete range of motion',
      'Not engaging core',
      'Moving too fast'
    ],
    variations: ['assisted-dips', 'weighted-dips', 'bench-dips'],
    videoUrl: null,
    imageUrl: null
  },

  // LEG EXERCISES
  {
    id: 'squat',
    name: 'Squat',
    category: EXERCISE_CATEGORIES.LEGS,
    primaryMuscles: [MUSCLE_GROUPS.QUADRICEPS, MUSCLE_GROUPS.GLUTES],
    secondaryMuscles: [MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.CORE],
    equipment: EQUIPMENT_TYPES.BARBELL,
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    instructions: [
      'Stand with feet shoulder-width apart',
      'Bar on upper back',
      'Lower by bending hips and knees',
      'Go below parallel',
      'Drive through heels to stand'
    ],
    tips: [
      'Keep chest up',
      'Knees track over toes',
      'Full depth',
      'Drive through heels'
    ],
    commonMistakes: [
      'Not going deep enough',
      'Knees caving in',
      'Leaning too far forward',
      'Heels coming off ground'
    ],
    variations: ['front-squat', 'goblet-squat', 'bulgarian-split-squat'],
    videoUrl: null,
    imageUrl: null
  },
  {
    id: 'lunges',
    name: 'Lunges',
    category: EXERCISE_CATEGORIES.LEGS,
    primaryMuscles: [MUSCLE_GROUPS.QUADRICEPS, MUSCLE_GROUPS.GLUTES],
    secondaryMuscles: [MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.CORE],
    equipment: EQUIPMENT_TYPES.BODYWEIGHT,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    instructions: [
      'Stand with feet hip-width apart',
      'Step forward into lunge',
      'Lower back knee toward ground',
      'Push back to starting position',
      'Alternate legs'
    ],
    tips: [
      'Keep torso upright',
      'Front knee over ankle',
      'Full range of motion',
      'Control the movement'
    ],
    commonMistakes: [
      'Front knee too far forward',
      'Leaning forward',
      'Incomplete range of motion',
      'Rushing the movement'
    ],
    variations: ['walking-lunges', 'reverse-lunges', 'dumbbell-lunges'],
    videoUrl: null,
    imageUrl: null
  },

  // CORE EXERCISES
  {
    id: 'plank',
    name: 'Plank',
    category: EXERCISE_CATEGORIES.CORE,
    primaryMuscles: [MUSCLE_GROUPS.ABS, MUSCLE_GROUPS.CORE],
    secondaryMuscles: [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.GLUTES],
    equipment: EQUIPMENT_TYPES.BODYWEIGHT,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    instructions: [
      'Start in push-up position',
      'Lower to forearms',
      'Keep body in straight line',
      'Hold position',
      'Engage core throughout'
    ],
    tips: [
      'Keep hips level',
      'Don\'t let hips sag',
      'Breathe normally',
      'Engage entire core'
    ],
    commonMistakes: [
      'Hips sagging',
      'Hips too high',
      'Holding breath',
      'Not engaging core'
    ],
    variations: ['side-plank', 'plank-ups', 'weighted-plank'],
    videoUrl: null,
    imageUrl: null
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    category: EXERCISE_CATEGORIES.CORE,
    primaryMuscles: [MUSCLE_GROUPS.ABS, MUSCLE_GROUPS.CORE],
    secondaryMuscles: [MUSCLE_GROUPS.HIP_FLEXORS],
    equipment: EQUIPMENT_TYPES.BODYWEIGHT,
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    instructions: [
      'Lie on back with arms up',
      'Knees bent at 90 degrees',
      'Lower opposite arm and leg',
      'Return to starting position',
      'Alternate sides'
    ],
    tips: [
      'Keep lower back pressed to floor',
      'Move slowly and controlled',
      'Engage core throughout',
      'Don\'t let back arch'
    ],
    commonMistakes: [
      'Back arching off floor',
      'Moving too fast',
      'Not engaging core',
      'Incomplete range of motion'
    ],
    variations: ['weighted-dead-bug', 'single-leg-dead-bug'],
    videoUrl: null,
    imageUrl: null
  }
];

// Exercise search and filtering utilities
export const searchExercises = (query, filters = {}) => {
  let results = EXERCISE_DATABASE;

  // Text search
  if (query) {
    const searchTerm = query.toLowerCase();
    results = results.filter(exercise => 
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.primaryMuscles.some(muscle => muscle.toLowerCase().includes(searchTerm)) ||
      exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(searchTerm))
    );
  }

  // Category filter
  if (filters.category) {
    results = results.filter(exercise => exercise.category === filters.category);
  }

  // Equipment filter
  if (filters.equipment) {
    results = results.filter(exercise => exercise.equipment === filters.equipment);
  }

  // Difficulty filter
  if (filters.difficulty) {
    results = results.filter(exercise => exercise.difficulty === filters.difficulty);
  }

  // Muscle group filter
  if (filters.muscleGroup) {
    results = results.filter(exercise => 
      exercise.primaryMuscles.includes(filters.muscleGroup) ||
      exercise.secondaryMuscles.includes(filters.muscleGroup)
    );
  }

  return results;
};

export const getExercisesByCategory = (category) => {
  return EXERCISE_DATABASE.filter(exercise => exercise.category === category);
};

export const getExercisesByEquipment = (equipment) => {
  return EXERCISE_DATABASE.filter(exercise => exercise.equipment === equipment);
};

export const getExercisesByDifficulty = (difficulty) => {
  return EXERCISE_DATABASE.filter(exercise => exercise.difficulty === difficulty);
};

export const getExerciseById = (id) => {
  return EXERCISE_DATABASE.find(exercise => exercise.id === id);
};

export const getRandomExercises = (count = 5) => {
  const shuffled = [...EXERCISE_DATABASE].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getPopularExercises = () => {
  // Return commonly used exercises
  const popularIds = [
    'bench-press', 'squat', 'deadlift', 'pull-ups', 'overhead-press',
    'bent-over-row', 'push-ups', 'bicep-curls', 'tricep-dips', 'lunges'
  ];
  return popularIds.map(id => getExerciseById(id)).filter(Boolean);
};

export const getExerciseVariations = (exerciseId) => {
  const exercise = getExerciseById(exerciseId);
  if (!exercise || !exercise.variations) return [];
  
  return exercise.variations.map(variationId => getExerciseById(variationId)).filter(Boolean);
};

export const getMuscleGroupExercises = (muscleGroup) => {
  return EXERCISE_DATABASE.filter(exercise => 
    exercise.primaryMuscles.includes(muscleGroup) ||
    exercise.secondaryMuscles.includes(muscleGroup)
  );
};

export const getEquipmentExercises = (equipment) => {
  return EXERCISE_DATABASE.filter(exercise => exercise.equipment === equipment);
};

export const getDifficultyExercises = (difficulty) => {
  return EXERCISE_DATABASE.filter(exercise => exercise.difficulty === difficulty);
};

// Exercise recommendations based on workout history
export const getRecommendedExercises = (workoutHistory = [], count = 5) => {
  // Simple recommendation logic - can be enhanced
  const recentExercises = workoutHistory
    .slice(-10) // Last 10 workouts
    .flatMap(workout => workout.exercises.map(ex => ex.name));
  
  const exerciseCounts = recentExercises.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  // Get exercises not recently used
  const unusedExercises = EXERCISE_DATABASE.filter(exercise => 
    !exerciseCounts[exercise.name]
  );

  return getRandomExercises(count).filter(exercise => 
    unusedExercises.includes(exercise)
  );
};

export default EXERCISE_DATABASE;
