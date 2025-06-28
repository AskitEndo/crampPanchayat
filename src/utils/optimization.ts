// CrampPanchayat Utility Functions
// Common utilities for performance and UX improvements

import { SymptomIntensity, SymptomType } from "../types";
import { QUICK_SYMPTOM_TIPS, PERFORMANCE_CONFIG } from "../constants";

/**
 * Debounce function for input optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Get optimized symptom suggestions based on intensity
 */
export const getOptimizedSuggestions = (
  selectedSymptoms: SymptomIntensity[],
  maxSuggestions: number = PERFORMANCE_CONFIG.MAX_SUGGESTIONS
): string[] => {
  if (selectedSymptoms.length === 0) return [];

  const allSuggestions: string[] = [];

  // Prioritize high-intensity symptoms
  const sortedSymptoms = [...selectedSymptoms].sort(
    (a, b) => b.intensity - a.intensity
  );

  sortedSymptoms.forEach((symptom) => {
    const tips = QUICK_SYMPTOM_TIPS[symptom.type];
    if (tips) {
      if (symptom.intensity >= 3) {
        // High intensity: show all tips
        allSuggestions.push(...tips);
      } else {
        // Lower intensity: show limited tips
        allSuggestions.push(...tips.slice(0, 2));
      }
    }
  });

  return [...new Set(allSuggestions)].slice(0, maxSuggestions);
};

/**
 * Format date consistently across the app
 */
export const formatDateString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return formatDateString(date) === formatDateString(today);
};

/**
 * Generate consistent daily content (quotes, etc.) based on date
 */
export const getDailyContent = <T>(items: T[], date?: Date): T => {
  const targetDate = date || new Date();
  const dayOfYear = Math.floor(
    (targetDate.getTime() -
      new Date(targetDate.getFullYear(), 0, 0).getTime()) /
      86400000
  );
  const index = dayOfYear % items.length;
  return items[index];
};

/**
 * Memoization helper for expensive calculations
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Safe array access with fallback
 */
export const safeArrayAccess = <T>(
  array: T[],
  index: number,
  fallback: T
): T => {
  return array[index] !== undefined ? array[index] : fallback;
};

/**
 * Calculate cycle statistics efficiently
 */
export const calculateCycleStats = (
  cycles: any[],
  symptoms: any[],
  notes: any[]
) => {
  return {
    totalCycles: cycles.length,
    totalSymptoms: symptoms.length,
    totalNotes: notes.length,
    averageCycleLength:
      cycles.length > 0
        ? Math.round(
            cycles.reduce((sum, cycle) => sum + (cycle.length || 28), 0) /
              cycles.length
          )
        : 28,
    recentActivity: {
      cyclesThisMonth: cycles.filter((cycle) => {
        const cycleDate = new Date(cycle.startDate);
        const now = new Date();
        return (
          cycleDate.getMonth() === now.getMonth() &&
          cycleDate.getFullYear() === now.getFullYear()
        );
      }).length,
      symptomsThisWeek: symptoms.filter((symptom) => {
        const symptomDate = new Date(symptom.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return symptomDate >= weekAgo;
      }).length,
    },
  };
};

/**
 * Validate and sanitize user input
 */
export const sanitizeInput = (
  input: string,
  maxLength: number = 500
): string => {
  return input.trim().slice(0, maxLength);
};

/**
 * Create unique IDs for records
 */
export const generateUniqueId = (prefix: string = ""): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}_${randomStr}`;
};

/**
 * Performance-optimized array operations
 */
export const arrayUtils = {
  /**
   * Remove duplicates from array efficiently
   */
  unique: <T>(array: T[]): T[] => [...new Set(array)],

  /**
   * Chunk array into smaller arrays
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Sort array by multiple criteria
   */
  sortBy: <T>(array: T[], ...criteria: ((item: T) => any)[]): T[] => {
    return [...array].sort((a, b) => {
      for (const criterion of criteria) {
        const aVal = criterion(a);
        const bVal = criterion(b);
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
      }
      return 0;
    });
  },
};

export default {
  debounce,
  getOptimizedSuggestions,
  formatDateString,
  isToday,
  getDailyContent,
  memoize,
  safeArrayAccess,
  calculateCycleStats,
  sanitizeInput,
  generateUniqueId,
  arrayUtils,
};
