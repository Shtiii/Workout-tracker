// Offline storage utilities for workout data backup

const OFFLINE_WORKOUTS_KEY = 'offline-workouts';
const OFFLINE_PROGRAMS_KEY = 'offline-programs';

// Save workout to localStorage as backup
export const saveWorkoutOffline = (workoutData) => {
  try {
    const existingWorkouts = getOfflineWorkouts();
    const workoutWithId = {
      ...workoutData,
      offlineId: Date.now() + Math.random(), // Temporary offline ID
      savedOffline: true,
      timestamp: new Date().toISOString()
    };

    existingWorkouts.push(workoutWithId);
    localStorage.setItem(OFFLINE_WORKOUTS_KEY, JSON.stringify(existingWorkouts));
    console.log('Workout saved offline:', workoutWithId);
    return workoutWithId;
  } catch (error) {
    console.error('Failed to save workout offline:', error);
    return null;
  }
};

// Get all offline workouts
export const getOfflineWorkouts = () => {
  try {
    const stored = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get offline workouts:', error);
    return [];
  }
};

// Remove synced workout from offline storage
export const removeOfflineWorkout = (offlineId) => {
  try {
    const workouts = getOfflineWorkouts();
    const updated = workouts.filter(w => w.offlineId !== offlineId);
    localStorage.setItem(OFFLINE_WORKOUTS_KEY, JSON.stringify(updated));
    console.log('Removed offline workout:', offlineId);
  } catch (error) {
    console.error('Failed to remove offline workout:', error);
  }
};

// Save workout with Firebase backup to localStorage
export const saveWorkoutWithBackup = async (workoutData, firebaseFunction) => {
  // Always save to localStorage first as backup
  const offlineWorkout = saveWorkoutOffline(workoutData);

  try {
    // Try to save to Firebase
    const result = await firebaseFunction(workoutData);

    // If successful, remove from offline storage
    if (offlineWorkout) {
      removeOfflineWorkout(offlineWorkout.offlineId);
    }

    return { success: true, result };
  } catch (error) {
    console.error('Firebase save failed, workout saved offline:', error);
    return { success: false, error, offlineWorkout };
  }
};

// Sync offline workouts when connection is restored
export const syncOfflineWorkouts = async (firebaseFunction) => {
  const offlineWorkouts = getOfflineWorkouts();

  if (offlineWorkouts.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const workout of offlineWorkouts) {
    try {
      await firebaseFunction(workout);
      removeOfflineWorkout(workout.offlineId);
      synced++;
    } catch (error) {
      console.error('Failed to sync workout:', error);
      failed++;
    }
  }

  return { synced, failed };
};

// Check if there are pending offline workouts
export const hasPendingWorkouts = () => {
  return getOfflineWorkouts().length > 0;
};

// Get offline workout count
export const getOfflineWorkoutCount = () => {
  return getOfflineWorkouts().length;
};

// Save program data offline
export const saveProgramOffline = (programData) => {
  try {
    const existingPrograms = getOfflinePrograms();
    const programWithId = {
      ...programData,
      offlineId: Date.now() + Math.random(),
      savedOffline: true,
      timestamp: new Date().toISOString()
    };

    existingPrograms.push(programWithId);
    localStorage.setItem(OFFLINE_PROGRAMS_KEY, JSON.stringify(existingPrograms));
    return programWithId;
  } catch (error) {
    console.error('Failed to save program offline:', error);
    return null;
  }
};

// Get all offline programs
export const getOfflinePrograms = () => {
  try {
    const stored = localStorage.getItem(OFFLINE_PROGRAMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get offline programs:', error);
    return [];
  }
};

// Clear all offline data (for testing/reset)
export const clearOfflineData = () => {
  localStorage.removeItem(OFFLINE_WORKOUTS_KEY);
  localStorage.removeItem(OFFLINE_PROGRAMS_KEY);
  console.log('Offline data cleared');
};