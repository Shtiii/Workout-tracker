/**
 * Comprehensive Achievement System Database
 * Contains all achievements, milestones, and badges for the workout tracker
 */

export const ACHIEVEMENT_CATEGORIES = {
  WORKOUT_FREQUENCY: 'Workout Frequency',
  STRENGTH_PROGRESS: 'Strength Progress',
  CONSISTENCY: 'Consistency',
  VOLUME: 'Volume',
  ENDURANCE: 'Endurance',
  MILESTONE: 'Milestone',
  SPECIAL: 'Special',
  SOCIAL: 'Social'
};

export const ACHIEVEMENT_RARITY = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary'
};

export const ACHIEVEMENT_TYPES = {
  STREAK: 'Streak',
  TOTAL: 'Total',
  PROGRESS: 'Progress',
  EFFICIENCY: 'Efficiency',
  VARIETY: 'Variety',
  ENDURANCE: 'Endurance',
  STRENGTH: 'Strength',
  MILESTONE: 'Milestone'
};

export const ACHIEVEMENTS = [
  // WORKOUT FREQUENCY ACHIEVEMENTS
  {
    id: 'first-workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    category: ACHIEVEMENT_CATEGORIES.WORKOUT_FREQUENCY,
    type: ACHIEVEMENT_TYPES.MILESTONE,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    icon: '🎯',
    condition: { type: 'total_workouts', value: 1 },
    reward: { xp: 100, badge: 'first-workout' },
    unlocked: false
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Complete 7 workouts',
    category: ACHIEVEMENT_CATEGORIES.WORKOUT_FREQUENCY,
    type: ACHIEVEMENT_TYPES.TOTAL,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    icon: '💪',
    condition: { type: 'total_workouts', value: 7 },
    reward: { xp: 200, badge: 'week-warrior' },
    unlocked: false
  },
  {
    id: 'month-master',
    name: 'Month Master',
    description: 'Complete 30 workouts',
    category: ACHIEVEMENT_CATEGORIES.WORKOUT_FREQUENCY,
    type: ACHIEVEMENT_TYPES.TOTAL,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🏆',
    condition: { type: 'total_workouts', value: 30 },
    reward: { xp: 500, badge: 'month-master' },
    unlocked: false
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Complete 100 workouts',
    category: ACHIEVEMENT_CATEGORIES.WORKOUT_FREQUENCY,
    type: ACHIEVEMENT_TYPES.TOTAL,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '💯',
    condition: { type: 'total_workouts', value: 100 },
    reward: { xp: 1000, badge: 'century-club' },
    unlocked: false
  },
  {
    id: 'five-hundred',
    name: 'Five Hundred',
    description: 'Complete 500 workouts',
    category: ACHIEVEMENT_CATEGORIES.WORKOUT_FREQUENCY,
    type: ACHIEVEMENT_TYPES.TOTAL,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    icon: '🔥',
    condition: { type: 'total_workouts', value: 500 },
    reward: { xp: 2500, badge: 'five-hundred' },
    unlocked: false
  },
  {
    id: 'thousand-club',
    name: 'Thousand Club',
    description: 'Complete 1000 workouts',
    category: ACHIEVEMENT_CATEGORIES.WORKOUT_FREQUENCY,
    type: ACHIEVEMENT_TYPES.TOTAL,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    icon: '👑',
    condition: { type: 'total_workouts', value: 1000 },
    reward: { xp: 5000, badge: 'thousand-club' },
    unlocked: false
  },

  // STREAK ACHIEVEMENTS
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: 'Maintain a 3-day workout streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    type: ACHIEVEMENT_TYPES.STREAK,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    icon: '🔥',
    condition: { type: 'streak', value: 3 },
    reward: { xp: 150, badge: 'streak-3' },
    unlocked: false
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day workout streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    type: ACHIEVEMENT_TYPES.STREAK,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🔥🔥',
    condition: { type: 'streak', value: 7 },
    reward: { xp: 300, badge: 'streak-7' },
    unlocked: false
  },
  {
    id: 'streak-30',
    name: 'Month Master',
    description: 'Maintain a 30-day workout streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    type: ACHIEVEMENT_TYPES.STREAK,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '🔥🔥🔥',
    condition: { type: 'streak', value: 30 },
    reward: { xp: 750, badge: 'streak-30' },
    unlocked: false
  },
  {
    id: 'streak-100',
    name: 'Century Streak',
    description: 'Maintain a 100-day workout streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    type: ACHIEVEMENT_TYPES.STREAK,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    icon: '🔥🔥🔥🔥',
    condition: { type: 'streak', value: 100 },
    reward: { xp: 2000, badge: 'streak-100' },
    unlocked: false
  },
  {
    id: 'streak-365',
    name: 'Year of Fire',
    description: 'Maintain a 365-day workout streak',
    category: ACHIEVEMENT_CATEGORIES.CONSISTENCY,
    type: ACHIEVEMENT_TYPES.STREAK,
    rarity: ACHIEVEMENT_RARITY.LEGENDARY,
    icon: '🔥🔥🔥🔥🔥',
    condition: { type: 'streak', value: 365 },
    reward: { xp: 5000, badge: 'streak-365' },
    unlocked: false
  },

  // STRENGTH PROGRESS ACHIEVEMENTS
  {
    id: 'first-pr',
    name: 'First PR',
    description: 'Set your first personal record',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH_PROGRESS,
    type: ACHIEVEMENT_TYPES.PROGRESS,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    icon: '📈',
    condition: { type: 'personal_records', value: 1 },
    reward: { xp: 200, badge: 'first-pr' },
    unlocked: false
  },
  {
    id: 'pr-master',
    name: 'PR Master',
    description: 'Set 10 personal records',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH_PROGRESS,
    type: ACHIEVEMENT_TYPES.PROGRESS,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🏅',
    condition: { type: 'personal_records', value: 10 },
    reward: { xp: 500, badge: 'pr-master' },
    unlocked: false
  },
  {
    id: 'pr-legend',
    name: 'PR Legend',
    description: 'Set 50 personal records',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH_PROGRESS,
    type: ACHIEVEMENT_TYPES.PROGRESS,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '👑',
    condition: { type: 'personal_records', value: 50 },
    reward: { xp: 1000, badge: 'pr-legend' },
    unlocked: false
  },
  {
    id: 'bench-225',
    name: 'Two Plates',
    description: 'Bench press 225 lbs',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH_PROGRESS,
    type: ACHIEVEMENT_TYPES.STRENGTH,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🏋️',
    condition: { type: 'exercise_weight', exercise: 'Bench Press', value: 225 },
    reward: { xp: 400, badge: 'bench-225' },
    unlocked: false
  },
  {
    id: 'squat-315',
    name: 'Three Plates',
    description: 'Squat 315 lbs',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH_PROGRESS,
    type: ACHIEVEMENT_TYPES.STRENGTH,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🏋️‍♂️',
    condition: { type: 'exercise_weight', exercise: 'Squat', value: 315 },
    reward: { xp: 400, badge: 'squat-315' },
    unlocked: false
  },
  {
    id: 'deadlift-405',
    name: 'Four Plates',
    description: 'Deadlift 405 lbs',
    category: ACHIEVEMENT_CATEGORIES.STRENGTH_PROGRESS,
    type: ACHIEVEMENT_TYPES.STRENGTH,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🏋️‍♀️',
    condition: { type: 'exercise_weight', exercise: 'Deadlift', value: 405 },
    reward: { xp: 400, badge: 'deadlift-405' },
    unlocked: false
  },

  // VOLUME ACHIEVEMENTS
  {
    id: 'volume-10k',
    name: 'Volume Builder',
    description: 'Lift 10,000 lbs in total volume',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    type: ACHIEVEMENT_TYPES.VOLUME,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    icon: '📊',
    condition: { type: 'total_volume', value: 10000 },
    reward: { xp: 300, badge: 'volume-10k' },
    unlocked: false
  },
  {
    id: 'volume-100k',
    name: 'Volume Master',
    description: 'Lift 100,000 lbs in total volume',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    type: ACHIEVEMENT_TYPES.VOLUME,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '📈',
    condition: { type: 'total_volume', value: 100000 },
    reward: { xp: 600, badge: 'volume-100k' },
    unlocked: false
  },
  {
    id: 'volume-1m',
    name: 'Volume Legend',
    description: 'Lift 1,000,000 lbs in total volume',
    category: ACHIEVEMENT_CATEGORIES.VOLUME,
    type: ACHIEVEMENT_TYPES.VOLUME,
    rarity: ACHIEVEMENT_RARITY.EPIC,
    icon: '🚀',
    condition: { type: 'total_volume', value: 1000000 },
    reward: { xp: 2000, badge: 'volume-1m' },
    unlocked: false
  },

  // ENDURANCE ACHIEVEMENTS
  {
    id: 'marathon-set',
    name: 'Marathon Set',
    description: 'Complete a set with 50+ reps',
    category: ACHIEVEMENT_CATEGORIES.ENDURANCE,
    type: ACHIEVEMENT_TYPES.ENDURANCE,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🏃',
    condition: { type: 'max_reps', value: 50 },
    reward: { xp: 400, badge: 'marathon-set' },
    unlocked: false
  },
  {
    id: 'iron-lungs',
    name: 'Iron Lungs',
    description: 'Complete a set with 100+ reps',
    category: ACHIEVEMENT_CATEGORIES.ENDURANCE,
    type: ACHIEVEMENT_TYPES.ENDURANCE,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '🫁',
    condition: { type: 'max_reps', value: 100 },
    reward: { xp: 800, badge: 'iron-lungs' },
    unlocked: false
  },

  // VARIETY ACHIEVEMENTS
  {
    id: 'exercise-explorer',
    name: 'Exercise Explorer',
    description: 'Try 25 different exercises',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    type: ACHIEVEMENT_TYPES.VARIETY,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🔍',
    condition: { type: 'unique_exercises', value: 25 },
    reward: { xp: 500, badge: 'exercise-explorer' },
    unlocked: false
  },
  {
    id: 'exercise-master',
    name: 'Exercise Master',
    description: 'Try 100 different exercises',
    category: ACHIEVEMENT_CATEGORIES.VARIETY,
    type: ACHIEVEMENT_TYPES.VARIETY,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '🎯',
    condition: { type: 'unique_exercises', value: 100 },
    reward: { xp: 1000, badge: 'exercise-master' },
    unlocked: false
  },

  // EFFICIENCY ACHIEVEMENTS
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete a workout in under 30 minutes',
    category: ACHIEVEMENT_CATEGORIES.EFFICIENCY,
    type: ACHIEVEMENT_TYPES.EFFICIENCY,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '⚡',
    condition: { type: 'workout_duration', value: 30, operator: 'less_than' },
    reward: { xp: 300, badge: 'speed-demon' },
    unlocked: false
  },
  {
    id: 'efficiency-expert',
    name: 'Efficiency Expert',
    description: 'Complete 10 workouts in under 45 minutes',
    category: ACHIEVEMENT_CATEGORIES.EFFICIENCY,
    type: ACHIEVEMENT_TYPES.EFFICIENCY,
    rarity: ACHIEVEMENT_RARITY.RARE,
    icon: '🎯',
    condition: { type: 'efficient_workouts', value: 10, duration: 45 },
    reward: { xp: 600, badge: 'efficiency-expert' },
    unlocked: false
  },

  // SPECIAL ACHIEVEMENTS
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a workout before 6 AM',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    type: ACHIEVEMENT_TYPES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🌅',
    condition: { type: 'workout_time', value: 6, operator: 'before' },
    reward: { xp: 200, badge: 'early-bird' },
    unlocked: false
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a workout after 10 PM',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    type: ACHIEVEMENT_TYPES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🦉',
    condition: { type: 'workout_time', value: 22, operator: 'after' },
    reward: { xp: 200, badge: 'night-owl' },
    unlocked: false
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Complete workouts on both weekend days',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    type: ACHIEVEMENT_TYPES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.COMMON,
    icon: '🏖️',
    condition: { type: 'weekend_workouts', value: 2 },
    reward: { xp: 150, badge: 'weekend-warrior' },
    unlocked: false
  },
  {
    id: 'holiday-hero',
    name: 'Holiday Hero',
    description: 'Complete a workout on a holiday',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    type: ACHIEVEMENT_TYPES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.UNCOMMON,
    icon: '🎉',
    condition: { type: 'holiday_workout', value: 1 },
    reward: { xp: 300, badge: 'holiday-hero' },
    unlocked: false
  }
];

// Achievement calculation utilities
export const calculateAchievements = (userData) => {
  const { workoutHistory, personalRecords, bodyMeasurements } = userData;
  const unlockedAchievements = [];

  ACHIEVEMENTS.forEach(achievement => {
    if (checkAchievementCondition(achievement, userData)) {
      unlockedAchievements.push({
        ...achievement,
        unlocked: true,
        unlockedAt: new Date()
      });
    }
  });

  return unlockedAchievements;
};

export const checkAchievementCondition = (achievement, userData) => {
  const { workoutHistory, personalRecords, bodyMeasurements } = userData;
  const { condition } = achievement;

  switch (condition.type) {
    case 'total_workouts':
      return workoutHistory.length >= condition.value;

    case 'streak':
      return calculateWorkoutStreak(workoutHistory) >= condition.value;

    case 'personal_records':
      return personalRecords.length >= condition.value;

    case 'exercise_weight':
      const exercisePRs = personalRecords.filter(pr => pr.exercise === condition.exercise);
      return exercisePRs.some(pr => pr.weight >= condition.value);

    case 'total_volume':
      const totalVolume = calculateTotalVolume(workoutHistory);
      return totalVolume >= condition.value;

    case 'max_reps':
      const maxReps = calculateMaxReps(workoutHistory);
      return maxReps >= condition.value;

    case 'unique_exercises':
      const uniqueExercises = calculateUniqueExercises(workoutHistory);
      return uniqueExercises >= condition.value;

    case 'workout_duration':
      if (condition.operator === 'less_than') {
        return workoutHistory.some(workout => {
          if (workout.startTime && workout.endTime) {
            const duration = (new Date(workout.endTime) - new Date(workout.startTime)) / (1000 * 60);
            return duration < condition.value;
          }
          return false;
        });
      }
      return false;

    case 'efficient_workouts':
      const efficientWorkouts = workoutHistory.filter(workout => {
        if (workout.startTime && workout.endTime) {
          const duration = (new Date(workout.endTime) - new Date(workout.startTime)) / (1000 * 60);
          return duration < condition.duration;
        }
        return false;
      });
      return efficientWorkouts.length >= condition.value;

    case 'workout_time':
      if (condition.operator === 'before') {
        return workoutHistory.some(workout => {
          const workoutTime = new Date(workout.completedAt).getHours();
          return workoutTime < condition.value;
        });
      } else if (condition.operator === 'after') {
        return workoutHistory.some(workout => {
          const workoutTime = new Date(workout.completedAt).getHours();
          return workoutTime >= condition.value;
        });
      }
      return false;

    case 'weekend_workouts':
      const weekendWorkouts = workoutHistory.filter(workout => {
        const dayOfWeek = new Date(workout.completedAt).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      });
      return weekendWorkouts.length >= condition.value;

    case 'holiday_workout':
      // This would need holiday data - simplified for now
      return workoutHistory.some(workout => {
        const date = new Date(workout.completedAt);
        // Check for common holidays (simplified)
        const isHoliday = date.getMonth() === 11 && date.getDate() === 25; // Christmas
        return isHoliday;
      });

    default:
      return false;
  }
};

// Utility functions
export const calculateWorkoutStreak = (workoutHistory) => {
  if (workoutHistory.length === 0) return 0;

  const sortedWorkouts = workoutHistory
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const workout of sortedWorkouts) {
    const workoutDate = new Date(workout.completedAt);
    workoutDate.setHours(0, 0, 0, 0);

    if (workoutDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (workoutDate.getTime() < currentDate.getTime()) {
      break;
    }
  }

  return streak;
};

export const calculateTotalVolume = (workoutHistory) => {
  return workoutHistory.reduce((total, workout) => {
    return total + workout.exercises.reduce((exerciseSum, exercise) => {
      return exerciseSum + exercise.sets
        .filter(set => set.completed)
        .reduce((setSum, set) => setSum + (set.weight * set.reps), 0);
    }, 0);
  }, 0);
};

export const calculateMaxReps = (workoutHistory) => {
  let maxReps = 0;
  
  workoutHistory.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.completed && set.reps > maxReps) {
          maxReps = set.reps;
        }
      });
    });
  });

  return maxReps;
};

export const calculateUniqueExercises = (workoutHistory) => {
  const uniqueExercises = new Set();
  
  workoutHistory.forEach(workout => {
    workout.exercises.forEach(exercise => {
      uniqueExercises.add(exercise.name);
    });
  });

  return uniqueExercises.size;
};

// Achievement filtering and search
export const getAchievementsByCategory = (category) => {
  return ACHIEVEMENTS.filter(achievement => achievement.category === category);
};

export const getAchievementsByRarity = (rarity) => {
  return ACHIEVEMENTS.filter(achievement => achievement.rarity === rarity);
};

export const getAchievementsByType = (type) => {
  return ACHIEVEMENTS.filter(achievement => achievement.type === type);
};

export const getUnlockedAchievements = (userAchievements) => {
  return userAchievements.filter(achievement => achievement.unlocked);
};

export const getLockedAchievements = (userAchievements) => {
  return userAchievements.filter(achievement => !achievement.unlocked);
};

export const getRecentAchievements = (userAchievements, count = 5) => {
  return userAchievements
    .filter(achievement => achievement.unlocked)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, count);
};

export const getAchievementProgress = (achievement, userData) => {
  const { condition } = achievement;
  let current = 0;
  let target = condition.value;

  switch (condition.type) {
    case 'total_workouts':
      current = userData.workoutHistory.length;
      break;
    case 'streak':
      current = calculateWorkoutStreak(userData.workoutHistory);
      break;
    case 'personal_records':
      current = userData.personalRecords.length;
      break;
    case 'total_volume':
      current = calculateTotalVolume(userData.workoutHistory);
      break;
    case 'unique_exercises':
      current = calculateUniqueExercises(userData.workoutHistory);
      break;
    default:
      current = 0;
  }

  return {
    current: Math.min(current, target),
    target,
    percentage: Math.min((current / target) * 100, 100)
  };
};

export default ACHIEVEMENTS;
