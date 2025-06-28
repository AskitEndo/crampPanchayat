// Utility functions for CrampPanchayat
// Privacy-first period tracking app utilities

import { format, differenceInDays, addDays, parseISO, isValid } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  CycleRecord,
  AnalyticsData,
  CyclePrediction,
  SymptomType,
  MoodType,
  EnergyLevel,
} from "../types";
import { PREDICTION_CONFIG } from "../constants";

/**
 * Generate a unique ID
 */
export function generateUniqueId(): string {
  return uuidv4();
}

/**
 * Custom App Error class for better error handling
 */
export class AppError extends Error {
  public code: string;
  public details?: any;

  constructor({
    code,
    message,
    details,
  }: {
    code: string;
    message: string;
    details?: any;
  }) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Date utility functions
 */
export const DateUtils = {
  /**
   * Format date for display
   */
  formatDate: (
    date: string | Date,
    formatString: string = "MMM dd, yyyy"
  ): string => {
    try {
      const dateObj = typeof date === "string" ? parseISO(date) : date;
      return isValid(dateObj) ? format(dateObj, formatString) : "Invalid Date";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  },

  /**
   * Get days between two dates
   */
  getDaysBetween: (
    startDate: string | Date,
    endDate: string | Date
  ): number => {
    try {
      const start =
        typeof startDate === "string" ? parseISO(startDate) : startDate;
      const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
      return differenceInDays(end, start);
    } catch (error) {
      console.error("Error calculating days between:", error);
      return 0;
    }
  },

  /**
   * Add days to a date
   */
  addDays: (date: string | Date, days: number): Date => {
    try {
      const dateObj = typeof date === "string" ? parseISO(date) : date;
      return addDays(dateObj, days);
    } catch (error) {
      console.error("Error adding days:", error);
      return new Date();
    }
  },

  /**
   * Get today's date string
   */
  getToday: (): string => {
    return format(new Date(), "yyyy-MM-dd");
  },

  /**
   * Check if date is today
   */
  isToday: (date: string): boolean => {
    return date === DateUtils.getToday();
  },

  /**
   * Get date range for a month
   */
  getMonthRange: (year: number, month: number): { start: Date; end: Date } => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start, end };
  },
};

/**
 * Cycle calculation utilities
 */
export const CycleUtils = {
  /**
   * Calculate cycle length from cycle record
   */
  calculateCycleLength: (cycle: CycleRecord): number => {
    if (!cycle.endDate) return 0;
    return DateUtils.getDaysBetween(cycle.startDate, cycle.endDate);
  },

  /**
   * Calculate average cycle length from multiple cycles
   */
  calculateAverageCycleLength: (cycles: CycleRecord[]): number => {
    const completedCycles = cycles.filter((c) => c.endDate);
    if (completedCycles.length === 0) return 28; // Default

    const totalLength = completedCycles.reduce((sum, cycle) => {
      return sum + CycleUtils.calculateCycleLength(cycle);
    }, 0);

    return Math.round(totalLength / completedCycles.length);
  },

  /**
   * Calculate average period length
   */
  calculateAveragePeriodLength: (cycles: CycleRecord[]): number => {
    if (cycles.length === 0) return 5; // Default

    const totalPeriodDays = cycles.reduce((sum, cycle) => {
      return sum + cycle.periodDays.length;
    }, 0);

    return Math.round(totalPeriodDays / cycles.length);
  },

  /**
   * Get next predicted cycle start date
   */
  predictNextCycle: (
    cycles: CycleRecord[],
    averageCycleLength: number
  ): CyclePrediction | null => {
    if (cycles.length < PREDICTION_CONFIG.MIN_CYCLES_FOR_PREDICTION) {
      return null;
    }

    const sortedCycles = cycles
      .filter((c) => c.startDate)
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

    const lastCycle = sortedCycles[0];
    if (!lastCycle) return null;

    const predictedStartDate = DateUtils.addDays(
      lastCycle.startDate,
      averageCycleLength
    );
    const predictedEndDate = DateUtils.addDays(
      predictedStartDate,
      averageCycleLength
    );

    // Calculate confidence based on cycle regularity
    const cycleLengths = sortedCycles
      .slice(0, 5) // Last 5 cycles
      .map((c) => CycleUtils.calculateCycleLength(c))
      .filter((length) => length > 0);

    const variance = CycleUtils.calculateVariance(cycleLengths);
    const confidence = Math.max(30, Math.min(95, 100 - variance * 10));

    return {
      id: `pred_${Date.now()}`,
      profileId: lastCycle.profileId,
      predictedStartDate: format(predictedStartDate, "yyyy-MM-dd"),
      predictedEndDate: format(predictedEndDate, "yyyy-MM-dd"),
      confidence: Math.round(confidence),
      basedOnCycles: cycleLengths.length,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Calculate variance in cycle lengths
   */
  calculateVariance: (lengths: number[]): number => {
    if (lengths.length < 2) return 0;

    const average =
      lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
    const squaredDifferences = lengths.map((length) =>
      Math.pow(length - average, 2)
    );
    const variance =
      squaredDifferences.reduce((sum, diff) => sum + diff, 0) / lengths.length;

    return Math.sqrt(variance);
  },

  /**
   * Check if cycle is regular
   */
  isCycleRegular: (cycles: CycleRecord[]): boolean => {
    const cycleLengths = cycles
      .filter((c) => c.endDate)
      .map((c) => CycleUtils.calculateCycleLength(c));

    if (cycleLengths.length < 3) return true; // Not enough data

    const variance = CycleUtils.calculateVariance(cycleLengths);
    return variance <= PREDICTION_CONFIG.MAX_CYCLE_VARIATION;
  },

  /**
   * Get current cycle phase
   */
  getCurrentPhase: (
    cycles: CycleRecord[],
    currentDate: string = DateUtils.getToday()
  ): string => {
    const activeCycle = cycles.find((c) => !c.endDate);
    if (!activeCycle) return "pre-menstrual";

    const daysSinceStart = DateUtils.getDaysBetween(
      activeCycle.startDate,
      currentDate
    );

    if (activeCycle.periodDays.includes(currentDate)) {
      return "menstrual";
    } else if (daysSinceStart <= 6) {
      return "follicular";
    } else if (daysSinceStart >= 12 && daysSinceStart <= 16) {
      return "ovulatory";
    } else if (daysSinceStart > 16) {
      return "luteal";
    }

    return "follicular";
  },
};

/**
 * Analytics utilities
 */
export const AnalyticsUtils = {
  /**
   * Generate analytics data from cycles
   */
  generateAnalytics: (cycles: CycleRecord[]): AnalyticsData => {
    const completedCycles = cycles.filter((c) => c.endDate);

    return {
      totalCycles: cycles.length,
      averageCycleLength: CycleUtils.calculateAverageCycleLength(cycles),
      averagePeriodLength: CycleUtils.calculateAveragePeriodLength(cycles),
      lastCycleDate:
        cycles.length > 0 ? cycles[cycles.length - 1].startDate : undefined,
      cycleLengthVariation: CycleUtils.calculateVariance(
        completedCycles.map((c) => CycleUtils.calculateCycleLength(c))
      ),
      mostCommonSymptoms: AnalyticsUtils.getMostCommonSymptoms(cycles),
      moodPatterns: AnalyticsUtils.getMoodPatterns(cycles),
      energyPatterns: AnalyticsUtils.getEnergyPatterns(cycles),
    };
  },

  /**
   * Get most common symptoms
   */
  getMostCommonSymptoms: (cycles: CycleRecord[]): SymptomType[] => {
    const symptomCounts: { [key: string]: number } = {};

    cycles.forEach((cycle) => {
      Object.values(cycle.symptoms).forEach((dailySymptoms) => {
        dailySymptoms.forEach((symptom) => {
          symptomCounts[symptom.type] = (symptomCounts[symptom.type] || 0) + 1;
        });
      });
    });

    return Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([symptom]) => symptom as SymptomType);
  },

  /**
   * Get mood patterns (placeholder - would need DailyNote data)
   */
  getMoodPatterns: (cycles: CycleRecord[]): { [key in MoodType]: number } => {
    // This would be implemented with actual DailyNote data
    return {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      neutral: 0,
      excited: 0,
      tired: 0,
    };
  },

  /**
   * Get energy patterns (placeholder - would need DailyNote data)
   */
  getEnergyPatterns: (
    cycles: CycleRecord[]
  ): { [key in EnergyLevel]: number } => {
    // This would be implemented with actual DailyNote data
    return {
      very_low: 0,
      low: 0,
      normal: 0,
      high: 0,
      very_high: 0,
    };
  },
};

/**
 * Validation utilities
 */
export const ValidationUtils = {
  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate date string
   */
  isValidDate: (dateString: string): boolean => {
    const date = parseISO(dateString);
    return isValid(date);
  },

  /**
   * Validate cycle length
   */
  isValidCycleLength: (length: number): boolean => {
    return length >= 21 && length <= 45;
  },

  /**
   * Validate period length
   */
  isValidPeriodLength: (length: number): boolean => {
    return length >= 1 && length <= 10;
  },

  /**
   * Validate symptom intensity
   */
  isValidIntensity: (intensity: number): boolean => {
    return intensity >= 1 && intensity <= 5;
  },
};

/**
 * Privacy utilities
 */
export const PrivacyUtils = {
  /**
   * Generate anonymous user ID
   */
  generateAnonymousId: (): string => {
    const timestamp = Date.now().toString(36);
    const randomString = Math.random().toString(36).substring(2, 8);
    return `anon_${timestamp}_${randomString}`;
  },

  /**
   * Hash sensitive data for analytics
   */
  hashData: (data: string): string => {
    // Simple hash function - in production, use a proper crypto library
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  },

  /**
   * Sanitize data for export
   */
  sanitizeForExport: (data: any): any => {
    // Remove or anonymize sensitive fields
    const sanitized = JSON.parse(JSON.stringify(data));

    if (sanitized.id) {
      delete sanitized.id;
    }

    if (sanitized.profileId) {
      delete sanitized.profileId;
    }

    return sanitized;
  },
};

/**
 * UPI utilities for donations
 */
export const UPIUtils = {
  /**
   * Generate UPI payment URL
   */
  generateUPIUrl: (
    upiId: string,
    amount: number,
    description: string
  ): string => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: "CrampPanchayat Developer",
      am: amount.toString(),
      cu: "INR",
      tn: description,
    });

    return `upi://pay?${params.toString()}`;
  },

  /**
   * Validate UPI ID format
   */
  isValidUPIId: (upiId: string): boolean => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(upiId);
  },
};

/**
 * Performance utilities
 */
export const PerformanceUtils = {
  /**
   * Debounce function calls
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  /**
   * Throttle function calls
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCallTime = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallTime >= delay) {
        lastCallTime = now;
        func(...args);
      }
    };
  },

  /**
   * Chunk array for better performance
   */
  chunkArray: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
};
