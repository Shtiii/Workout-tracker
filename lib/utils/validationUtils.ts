/**
 * Utility functions for data validation
 */

import { VALIDATION_RULES } from '@/lib/constants';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate workout name
 */
export function validateWorkoutName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Workout name is required');
  }
  
  if (name.length > 100) {
    errors.push('Workout name must be less than 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate exercise name
 */
export function validateExerciseName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Exercise name is required');
  }
  
  if (name.length > VALIDATION_RULES.EXERCISE.MAX_NAME_LENGTH) {
    errors.push(`Exercise name must be less than ${VALIDATION_RULES.EXERCISE.MAX_NAME_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate set data
 */
export function validateSet(weight: number, reps: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (weight < VALIDATION_RULES.EXERCISE.MIN_WEIGHT) {
    errors.push(`Weight must be at least ${VALIDATION_RULES.EXERCISE.MIN_WEIGHT} kg`);
  }
  
  if (weight > VALIDATION_RULES.EXERCISE.MAX_WEIGHT) {
    errors.push(`Weight must be less than ${VALIDATION_RULES.EXERCISE.MAX_WEIGHT} kg`);
  }
  
  if (reps < 1) {
    errors.push('Reps must be at least 1');
  }
  
  if (reps > VALIDATION_RULES.EXERCISE.MAX_REPS) {
    errors.push(`Reps must be less than ${VALIDATION_RULES.EXERCISE.MAX_REPS}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate program name
 */
export function validateProgramName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Program name is required');
  }
  
  if (name.length < VALIDATION_RULES.PROGRAM.MIN_NAME_LENGTH) {
    errors.push(`Program name must be at least ${VALIDATION_RULES.PROGRAM.MIN_NAME_LENGTH} character`);
  }
  
  if (name.length > VALIDATION_RULES.PROGRAM.MAX_NAME_LENGTH) {
    errors.push(`Program name must be less than ${VALIDATION_RULES.PROGRAM.MAX_NAME_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate program description
 */
export function validateProgramDescription(description: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (description && description.length > VALIDATION_RULES.PROGRAM.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Program description must be less than ${VALIDATION_RULES.PROGRAM.MAX_DESCRIPTION_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate goal name
 */
export function validateGoalName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Goal name is required');
  }
  
  if (name.length < VALIDATION_RULES.GOAL.MIN_NAME_LENGTH) {
    errors.push(`Goal name must be at least ${VALIDATION_RULES.GOAL.MIN_NAME_LENGTH} character`);
  }
  
  if (name.length > VALIDATION_RULES.GOAL.MAX_NAME_LENGTH) {
    errors.push(`Goal name must be less than ${VALIDATION_RULES.GOAL.MAX_NAME_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate goal target
 */
export function validateGoalTarget(target: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (target < VALIDATION_RULES.GOAL.MIN_TARGET) {
    errors.push(`Goal target must be at least ${VALIDATION_RULES.GOAL.MIN_TARGET}`);
  }
  
  if (target > VALIDATION_RULES.GOAL.MAX_TARGET) {
    errors.push(`Goal target must be less than ${VALIDATION_RULES.GOAL.MAX_TARGET}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate workout duration
 */
export function validateWorkoutDuration(duration: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (duration < VALIDATION_RULES.WORKOUT.MIN_DURATION) {
    errors.push(`Workout duration must be at least ${VALIDATION_RULES.WORKOUT.MIN_DURATION} minute`);
  }
  
  if (duration > VALIDATION_RULES.WORKOUT.MAX_DURATION) {
    errors.push(`Workout duration must be less than ${VALIDATION_RULES.WORKOUT.MAX_DURATION} minutes`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate number of exercises in workout
 */
export function validateExerciseCount(count: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (count < 1) {
    errors.push('Workout must have at least 1 exercise');
  }
  
  if (count > VALIDATION_RULES.WORKOUT.MAX_EXERCISES) {
    errors.push(`Workout cannot have more than ${VALIDATION_RULES.WORKOUT.MAX_EXERCISES} exercises`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate number of sets per exercise
 */
export function validateSetCount(count: number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (count < 1) {
    errors.push('Exercise must have at least 1 set');
  }
  
  if (count > VALIDATION_RULES.EXERCISE.MAX_SETS) {
    errors.push(`Exercise cannot have more than ${VALIDATION_RULES.EXERCISE.MAX_SETS} sets`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validate and sanitize text input
 */
export function validateAndSanitizeText(
  input: string, 
  maxLength: number = 1000
): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} {
  const errors: string[] = [];
  const sanitized = sanitizeString(input);
  
  if (sanitized.length > maxLength) {
    errors.push(`Text must be less than ${maxLength} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validate date
 */
export function isValidDate(date: any): boolean {
  if (!date) return false;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return !isNaN(dateObj.getTime());
}

/**
 * Validate date range
 */
export function isValidDateRange(startDate: any, endDate: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!isValidDate(startDate)) {
    errors.push('Start date is invalid');
  }
  
  if (!isValidDate(endDate)) {
    errors.push('End date is invalid');
  }
  
  if (isValidDate(startDate) && isValidDate(endDate)) {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    if (end <= start) {
      errors.push('End date must be after start date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate numeric input
 */
export function validateNumericInput(
  value: any, 
  min?: number, 
  max?: number
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push('Value is required');
    return { isValid: false, errors };
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    errors.push('Value must be a number');
    return { isValid: false, errors };
  }
  
  if (min !== undefined && numValue < min) {
    errors.push(`Value must be at least ${min}`);
  }
  
  if (max !== undefined && numValue > max) {
    errors.push(`Value must be less than ${max}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

