// Enhanced Period Tracking Service - CrampPanchayat v2.0
// Next-generation period tracking with sophisticated algorithms
// Designed for privacy-first, offline-friendly, long-term local usage

import {
  Profile,
  CycleRecord,
  CyclePrediction,
  SymptomRecord,
  DailyNote,
  SymptomIntensity,
  FlowIntensity,
  MoodType,
  EnergyLevel,
} from "../types";
import {
  format,
  parseISO,
  differenceInDays,
  addDays,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
  endOfDay,
  subDays,
  isWithinInterval,
  eachDayOfInterval,
  getUnixTime,
  isSameDay,
} from "date-fns";

// Advanced Period Tracking Constants (Enhanced for local usage)
export const PERIOD_TRACKING_CONSTANTS = {
  // Cycle Analysis
  MIN_CYCLES_FOR_PREDICTION: 2,
  OPTIMAL_CYCLES_FOR_PREDICTION: 6,
  MAX_CYCLES_FOR_ANALYSIS: 24, // 2 years of data for better patterns

  // Cycle Length Boundaries (Evidence-based medical standards)
  MIN_CYCLE_LENGTH: 21,
  MAX_CYCLE_LENGTH: 45,
  OPTIMAL_MIN: 24,
  OPTIMAL_MAX: 38,
  AVERAGE_CYCLE_LENGTH: 28,
  LOCAL_AVERAGE_FALLBACK: 29, // Slightly higher for local populations

  // Period Length Boundaries
  MIN_PERIOD_LENGTH: 2,
  MAX_PERIOD_LENGTH: 8,
  OPTIMAL_MIN_PERIOD: 3,
  OPTIMAL_MAX_PERIOD: 7,
  AVERAGE_PERIOD_LENGTH: 5,

  // Advanced Prediction System
  HIGH_CONFIDENCE_THRESHOLD: 85,
  MEDIUM_CONFIDENCE_THRESHOLD: 65,
  LOW_CONFIDENCE_THRESHOLD: 45,
  EXCELLENT_CONFIDENCE: 90,
  VERY_HIGH_CONFIDENCE: 80,
  MODERATE_CONFIDENCE: 60,
  VERY_LOW_CONFIDENCE: 20,

  // Variation Tolerances
  CYCLE_VARIATION_TOLERANCE: 7, // Days
  PERIOD_VARIATION_TOLERANCE: 2, // Days

  // Prediction Windows
  EARLY_PREDICTION_WINDOW: 4, // Days before predicted start
  LATE_PREDICTION_WINDOW: 6, // Days after predicted start
  FERTILITY_WINDOW: 6,

  // Advanced Learning
  WEIGHT_RECENT: 0.6,
  WEIGHT_HISTORICAL: 0.4,
  OUTLIER_THRESHOLD: 2.0, // Standard deviations

  // Regularity Bands
  VERY_REGULAR_THRESHOLD: 3,
  REGULAR_THRESHOLD: 5,
  SOMEWHAT_IRREGULAR_THRESHOLD: 8,
  IRREGULAR_THRESHOLD: 12,

  // Data Quality
  MIN_PERIOD_DAYS_FOR_VALID_CYCLE: 1,
  MAX_DAYS_BETWEEN_PERIOD_LOGS: 2, // For continuous period detection
  RECENCY_THRESHOLD_DAYS: 90,
  GAP_TOLERANCE_DAYS: 3,
  MIN_QUALITY_SCORE: 30,

  // Health Analysis
  SYMPTOM_FREQUENCY_THRESHOLD: 0.25, // 25% of cycles
  SEVERE_SYMPTOM_THRESHOLD: 4, // Intensity level
  PATTERN_DETECTION_MIN_CYCLES: 3,
};

// Enhanced Cycle Analysis Results with Advanced Features
export interface CycleAnalysis {
  // Current Cycle Status
  currentPhase: CyclePhase;
  dayInCycle: number;
  isOnPeriod: boolean;
  periodDay?: number;

  // Advanced Current State
  phaseConfidence: number;
  isInFertileWindow: boolean;
  ovulationLikelihood: number;

  // Cycle Metrics (Enhanced)
  averageCycleLength: number;
  cycleVariation: number;
  averagePeriodLength: number;
  periodVariation: number;
  medianCycleLength: number;
  consistencyIndex: number;

  // Predictions (Enhanced)
  nextPeriodPrediction: PeriodPrediction;
  ovulationPrediction?: OvulationPrediction;

  // Health Insights (Enhanced)
  cycleRegularity: RegularityLevel;
  healthInsights: HealthInsight[];
  healthScore: number;
  symptomPatterns: SymptomPattern[];

  // Data Quality (Enhanced)
  dataQuality: DataQuality;
  recommendedActions: string[];
  dataMaturity: "new" | "developing" | "mature" | "extensive";
  predictionReliability: "high" | "moderate" | "low" | "insufficient";
}

export interface PeriodPrediction {
  predictedStartDate: Date;
  predictedEndDate: Date;
  confidenceLevel: number;
  confidenceReason: string;
  earliestPossibleDate: Date;
  latestPossibleDate: Date;
  daysUntil: number;
  isOverdue: boolean;
  overdueBy?: number;
}

export interface OvulationPrediction {
  predictedDate: Date;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
  confidence: number;
}

export interface HealthInsight {
  type: "info" | "warning" | "tip" | "concern";
  title: string;
  message: string;
  actionable: boolean;
  priority: number;
}

export interface SymptomPattern {
  type: string;
  frequency: number;
  averageIntensity: number;
  phase: CyclePhase[];
}

export interface DataQuality {
  score: number; // 0-100
  completeness: number; // 0-100
  consistency: number; // 0-100
  suggestions: string[];
}

export type CyclePhase =
  | "menstrual"
  | "follicular"
  | "ovulatory"
  | "luteal"
  | "unknown";

export type RegularityLevel =
  | "very_regular"
  | "regular"
  | "somewhat_irregular"
  | "irregular"
  | "very_irregular"
  | "insufficient_data";

// Enhanced Period Tracking Service
export class PeriodTrackingService {
  /**
   * Comprehensive cycle analysis for a profile
   */
  static analyzeProfile(profile: Profile): CycleAnalysis {
    const today = startOfDay(new Date());
    const cycles = this.validateAndSortCycles(profile.cycles);
    const symptoms = this.validateAndSortSymptoms(profile.symptoms);
    const notes = this.validateAndSortNotes(profile.notes);

    // Calculate basic metrics
    const averageCycleLength = this.calculateAverageCycleLength(cycles);
    const cycleVariation = this.calculateCycleVariation(cycles);
    const averagePeriodLength = this.calculateAveragePeriodLength(cycles);
    const periodVariation = this.calculatePeriodVariation(cycles);

    // Determine current status
    const currentStatus = this.determineCurrentStatus(cycles, today);

    // Generate predictions
    const nextPeriodPrediction = this.predictNextPeriod(
      cycles,
      profile.settings
    );
    const ovulationPrediction = this.predictOvulation(
      cycles,
      nextPeriodPrediction
    );

    // Assess cycle regularity
    const cycleRegularity = this.assessRegularity(cycles, cycleVariation);

    // Generate health insights
    const healthInsights = this.generateHealthInsights(
      cycles,
      symptoms,
      notes,
      profile.settings
    );

    // Assess data quality
    const dataQuality = this.assessDataQuality(cycles, symptoms, notes);

    // Generate recommendations
    const recommendedActions = this.generateRecommendations(
      cycles,
      symptoms,
      dataQuality
    );

    // Calculate advanced metrics
    const medianCycleLength = this.calculateMedianCycleLength(cycles);
    const consistencyIndex = this.calculateConsistencyIndex(cycles);
    const phaseConfidence = this.calculatePhaseConfidence(
      cycles,
      currentStatus.phase,
      currentStatus.dayInCycle
    );
    const isInFertileWindow = this.isInFertileWindow(
      cycles,
      currentStatus.dayInCycle
    );
    const ovulationLikelihood = this.calculateOvulationLikelihood(
      cycles,
      currentStatus.dayInCycle
    );
    const healthScore = this.calculateHealthScore(cycles, symptoms, notes);
    const symptomPatterns = this.analyzeAdvancedSymptomPatterns(symptoms);
    const dataMaturity = this.assessDataMaturity(cycles);
    const predictionReliability = this.assessPredictionReliability(
      dataQuality,
      cycles
    );

    return {
      currentPhase: currentStatus.phase,
      dayInCycle: currentStatus.dayInCycle,
      isOnPeriod: currentStatus.isOnPeriod,
      periodDay: currentStatus.periodDay,

      // Advanced current state
      phaseConfidence,
      isInFertileWindow,
      ovulationLikelihood,

      // Enhanced cycle metrics
      averageCycleLength,
      cycleVariation,
      averagePeriodLength,
      periodVariation,
      medianCycleLength,
      consistencyIndex,

      // Predictions
      nextPeriodPrediction,
      ovulationPrediction,

      // Enhanced health insights
      cycleRegularity,
      healthInsights,
      healthScore,
      symptomPatterns,

      // Enhanced data quality
      dataQuality,
      recommendedActions,
      dataMaturity,
      predictionReliability,
    };
  }

  /**
   * Validate and sort cycles by start date
   */
  private static validateAndSortCycles(cycles: CycleRecord[]): CycleRecord[] {
    return cycles
      .filter((cycle) => {
        // Validate cycle data
        if (
          !cycle.startDate ||
          !cycle.periodDays ||
          cycle.periodDays.length === 0
        ) {
          return false;
        }

        // Check if cycle length is reasonable
        if (
          cycle.length &&
          (cycle.length < PERIOD_TRACKING_CONSTANTS.MIN_CYCLE_LENGTH ||
            cycle.length > PERIOD_TRACKING_CONSTANTS.MAX_CYCLE_LENGTH)
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  }

  /**
   * Validate and sort symptoms by date
   */
  private static validateAndSortSymptoms(
    symptoms: SymptomRecord[]
  ): SymptomRecord[] {
    return symptoms
      .filter(
        (symptom) =>
          symptom.date && symptom.symptoms && symptom.symptoms.length > 0
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Validate and sort notes by date
   */
  private static validateAndSortNotes(notes: DailyNote[]): DailyNote[] {
    return notes
      .filter((note) => note.date && note.note && note.note.trim().length > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calculate average cycle length with outlier detection
   */
  private static calculateAverageCycleLength(cycles: CycleRecord[]): number {
    if (cycles.length < 2) {
      return PERIOD_TRACKING_CONSTANTS.AVERAGE_CYCLE_LENGTH;
    }

    const cycleLengths: number[] = [];

    for (let i = 1; i < cycles.length; i++) {
      const prevCycle = cycles[i - 1];
      const currentCycle = cycles[i];

      const length = differenceInDays(
        parseISO(currentCycle.startDate),
        parseISO(prevCycle.startDate)
      );

      // Only include reasonable cycle lengths
      if (
        length >= PERIOD_TRACKING_CONSTANTS.MIN_CYCLE_LENGTH &&
        length <= PERIOD_TRACKING_CONSTANTS.MAX_CYCLE_LENGTH
      ) {
        cycleLengths.push(length);
      }
    }

    if (cycleLengths.length === 0) {
      return PERIOD_TRACKING_CONSTANTS.AVERAGE_CYCLE_LENGTH;
    }

    // Remove outliers using interquartile range method
    const filteredLengths = this.removeOutliers(cycleLengths);

    return Math.round(
      filteredLengths.reduce((sum, length) => sum + length, 0) /
        filteredLengths.length
    );
  }

  /**
   * Calculate cycle variation (standard deviation)
   */
  private static calculateCycleVariation(cycles: CycleRecord[]): number {
    if (cycles.length < 3) return 0;

    const cycleLengths: number[] = [];

    for (let i = 1; i < cycles.length; i++) {
      const length = differenceInDays(
        parseISO(cycles[i].startDate),
        parseISO(cycles[i - 1].startDate)
      );

      if (
        length >= PERIOD_TRACKING_CONSTANTS.MIN_CYCLE_LENGTH &&
        length <= PERIOD_TRACKING_CONSTANTS.MAX_CYCLE_LENGTH
      ) {
        cycleLengths.push(length);
      }
    }

    if (cycleLengths.length < 2) return 0;

    const average =
      cycleLengths.reduce((sum, length) => sum + length, 0) /
      cycleLengths.length;
    const variance =
      cycleLengths.reduce(
        (sum, length) => sum + Math.pow(length - average, 2),
        0
      ) / cycleLengths.length;

    return Math.round(Math.sqrt(variance) * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculate average period length
   */
  private static calculateAveragePeriodLength(cycles: CycleRecord[]): number {
    if (cycles.length === 0) {
      return PERIOD_TRACKING_CONSTANTS.AVERAGE_PERIOD_LENGTH;
    }

    const periodLengths = cycles
      .map((cycle) => cycle.periodDays.length)
      .filter(
        (length) =>
          length >= PERIOD_TRACKING_CONSTANTS.MIN_PERIOD_LENGTH &&
          length <= PERIOD_TRACKING_CONSTANTS.MAX_PERIOD_LENGTH
      );

    if (periodLengths.length === 0) {
      return PERIOD_TRACKING_CONSTANTS.AVERAGE_PERIOD_LENGTH;
    }

    return Math.round(
      periodLengths.reduce((sum, length) => sum + length, 0) /
        periodLengths.length
    );
  }

  /**
   * Calculate period length variation
   */
  private static calculatePeriodVariation(cycles: CycleRecord[]): number {
    if (cycles.length < 2) return 0;

    const periodLengths = cycles
      .map((cycle) => cycle.periodDays.length)
      .filter(
        (length) =>
          length >= PERIOD_TRACKING_CONSTANTS.MIN_PERIOD_LENGTH &&
          length <= PERIOD_TRACKING_CONSTANTS.MAX_PERIOD_LENGTH
      );

    if (periodLengths.length < 2) return 0;

    const average =
      periodLengths.reduce((sum, length) => sum + length, 0) /
      periodLengths.length;
    const variance =
      periodLengths.reduce(
        (sum, length) => sum + Math.pow(length - average, 2),
        0
      ) / periodLengths.length;

    return Math.round(Math.sqrt(variance) * 10) / 10;
  }

  /**
   * Determine current cycle status
   */
  private static determineCurrentStatus(
    cycles: CycleRecord[],
    today: Date
  ): {
    phase: CyclePhase;
    dayInCycle: number;
    isOnPeriod: boolean;
    periodDay?: number;
  } {
    if (cycles.length === 0) {
      return {
        phase: "unknown",
        dayInCycle: 0,
        isOnPeriod: false,
      };
    }

    const lastCycle = cycles[cycles.length - 1];
    const cycleStartDate = parseISO(lastCycle.startDate);
    const dayInCycle = differenceInDays(today, cycleStartDate) + 1;

    // Check if currently on period
    const isOnPeriod = lastCycle.periodDays.some((periodDate) => {
      const pDate = startOfDay(parseISO(periodDate));
      return isEqual(pDate, today);
    });

    let periodDay: number | undefined;
    if (isOnPeriod) {
      // Find which day of period this is
      const periodDates = lastCycle.periodDays
        .map((date) => parseISO(date))
        .sort((a, b) => a.getTime() - b.getTime());

      const firstPeriodDate = periodDates[0];
      periodDay = differenceInDays(today, firstPeriodDate) + 1;
    }

    // Determine cycle phase
    let phase: CyclePhase = "unknown";

    if (isOnPeriod) {
      phase = "menstrual";
    } else if (dayInCycle <= 7) {
      phase = "follicular";
    } else if (dayInCycle >= 12 && dayInCycle <= 16) {
      phase = "ovulatory";
    } else if (dayInCycle >= 17) {
      phase = "luteal";
    } else {
      phase = "follicular";
    }

    return {
      phase,
      dayInCycle,
      isOnPeriod,
      periodDay,
    };
  }

  /**
   * Predict next period with confidence levels
   */
  private static predictNextPeriod(
    cycles: CycleRecord[],
    settings: any
  ): PeriodPrediction {
    if (cycles.length === 0) {
      // No data - use default prediction
      const today = new Date();
      const predictedStart = addDays(
        today,
        PERIOD_TRACKING_CONSTANTS.AVERAGE_CYCLE_LENGTH
      );

      return {
        predictedStartDate: predictedStart,
        predictedEndDate: addDays(
          predictedStart,
          PERIOD_TRACKING_CONSTANTS.AVERAGE_PERIOD_LENGTH - 1
        ),
        confidenceLevel: 20,
        confidenceReason: "No historical data available",
        earliestPossibleDate: addDays(predictedStart, -7),
        latestPossibleDate: addDays(predictedStart, 7),
        daysUntil: differenceInDays(predictedStart, today),
        isOverdue: false,
      };
    }

    const lastCycle = cycles[cycles.length - 1];
    const lastPeriodStart = parseISO(lastCycle.startDate);
    const today = new Date();

    // Calculate prediction based on available data
    let averageCycleLength: number;
    let confidenceLevel: number;
    let confidenceReason: string;

    if (cycles.length === 1) {
      // Only one cycle - use settings or defaults
      averageCycleLength =
        settings?.averageCycleLength ||
        PERIOD_TRACKING_CONSTANTS.AVERAGE_CYCLE_LENGTH;
      confidenceLevel = 35;
      confidenceReason = "Based on one cycle and user settings";
    } else {
      // Multiple cycles - calculate average
      averageCycleLength = this.calculateAverageCycleLength(cycles);
      const variation = this.calculateCycleVariation(cycles);

      // Confidence based on number of cycles and regularity
      if (
        cycles.length >= PERIOD_TRACKING_CONSTANTS.OPTIMAL_CYCLES_FOR_PREDICTION
      ) {
        if (variation <= 3) {
          confidenceLevel = 90;
          confidenceReason = "Very regular cycles with sufficient data";
        } else if (variation <= 5) {
          confidenceLevel = 75;
          confidenceReason = "Regular cycles with good data";
        } else {
          confidenceLevel = 60;
          confidenceReason = "Some irregularity detected";
        }
      } else {
        confidenceLevel = Math.min(50 + cycles.length * 5, 70);
        confidenceReason = `Based on ${cycles.length} cycles`;
      }
    }

    // Calculate predicted dates
    const predictedStart = addDays(lastPeriodStart, averageCycleLength);
    const averagePeriodLength = this.calculateAveragePeriodLength(cycles);
    const predictedEnd = addDays(predictedStart, averagePeriodLength - 1);

    // Calculate uncertainty window
    const variation = this.calculateCycleVariation(cycles);
    const uncertaintyDays = Math.max(3, Math.round(variation));

    const earliestPossible = addDays(predictedStart, -uncertaintyDays);
    const latestPossible = addDays(predictedStart, uncertaintyDays);

    // Check if overdue
    const daysUntil = differenceInDays(predictedStart, today);
    const isOverdue = daysUntil < 0;
    const overdueBy = isOverdue ? Math.abs(daysUntil) : undefined;

    return {
      predictedStartDate: predictedStart,
      predictedEndDate: predictedEnd,
      confidenceLevel,
      confidenceReason,
      earliestPossibleDate: earliestPossible,
      latestPossibleDate: latestPossible,
      daysUntil,
      isOverdue,
      overdueBy,
    };
  }

  /**
   * Predict ovulation based on cycle data
   */
  private static predictOvulation(
    cycles: CycleRecord[],
    nextPeriodPrediction: PeriodPrediction
  ): OvulationPrediction | undefined {
    if (cycles.length < 2) return undefined;

    const averageCycleLength = this.calculateAverageCycleLength(cycles);

    // Ovulation typically occurs 14 days before next period
    const ovulationDate = addDays(nextPeriodPrediction.predictedStartDate, -14);

    // Fertile window: 5 days before ovulation + ovulation day
    const fertileStart = addDays(ovulationDate, -5);
    const fertileEnd = ovulationDate;

    // Confidence based on cycle regularity
    const variation = this.calculateCycleVariation(cycles);
    let confidence: number;

    if (variation <= 3) {
      confidence = 80;
    } else if (variation <= 5) {
      confidence = 65;
    } else {
      confidence = 45;
    }

    return {
      predictedDate: ovulationDate,
      fertileWindowStart: fertileStart,
      fertileWindowEnd: fertileEnd,
      confidence,
    };
  }

  /**
   * Assess cycle regularity
   */
  private static assessRegularity(
    cycles: CycleRecord[],
    variation: number
  ): RegularityLevel {
    if (cycles.length < 3) {
      return "insufficient_data";
    }

    if (variation <= 2) {
      return "very_regular";
    } else if (variation <= 4) {
      return "regular";
    } else if (variation <= 7) {
      return "somewhat_irregular";
    } else if (variation <= 10) {
      return "irregular";
    } else {
      return "very_irregular";
    }
  }

  /**
   * Generate health insights based on cycle data
   */
  private static generateHealthInsights(
    cycles: CycleRecord[],
    symptoms: SymptomRecord[],
    notes: DailyNote[],
    settings: any
  ): HealthInsight[] {
    const insights: HealthInsight[] = [];

    // Cycle length insights
    if (cycles.length >= 3) {
      const avgLength = this.calculateAverageCycleLength(cycles);

      if (avgLength < 21) {
        insights.push({
          type: "concern",
          title: "Short Cycles Detected",
          message: `Your average cycle length is ${avgLength} days, which is shorter than typical. Consider consulting a healthcare provider.`,
          actionable: true,
          priority: 8,
        });
      } else if (avgLength > 35) {
        insights.push({
          type: "concern",
          title: "Long Cycles Detected",
          message: `Your average cycle length is ${avgLength} days, which is longer than typical. Consider consulting a healthcare provider.`,
          actionable: true,
          priority: 8,
        });
      }
    }

    // Period length insights
    const avgPeriodLength = this.calculateAveragePeriodLength(cycles);
    if (avgPeriodLength > 7) {
      insights.push({
        type: "warning",
        title: "Extended Period Length",
        message: `Your periods last an average of ${avgPeriodLength} days. If this is unusual for you, consider tracking symptoms and consulting a healthcare provider.`,
        actionable: true,
        priority: 6,
      });
    }

    // Regularity insights
    const variation = this.calculateCycleVariation(cycles);
    const regularity = this.assessRegularity(cycles, variation);

    if (regularity === "very_irregular" || regularity === "irregular") {
      insights.push({
        type: "tip",
        title: "Irregular Cycles",
        message:
          "Your cycles show some irregularity. This is normal for many people, but tracking symptoms can help identify patterns.",
        actionable: true,
        priority: 4,
      });
    }

    // Symptom pattern insights
    if (symptoms.length >= 10) {
      const commonSymptoms = this.analyzeSymptomPatterns(symptoms);

      if (commonSymptoms.length > 0) {
        insights.push({
          type: "info",
          title: "Common Symptoms Identified",
          message: `You frequently experience: ${commonSymptoms.join(
            ", "
          )}. Tracking these patterns can help you prepare and manage symptoms.`,
          actionable: false,
          priority: 3,
        });
      }
    }

    // Data tracking insights
    if (cycles.length < 3) {
      insights.push({
        type: "tip",
        title: "Keep Tracking",
        message:
          "Track a few more cycles to get more accurate predictions and personalized insights.",
        actionable: true,
        priority: 2,
      });
    }

    // Sort by priority (highest first)
    return insights.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Analyze symptom patterns
   */
  private static analyzeSymptomPatterns(symptoms: SymptomRecord[]): string[] {
    const symptomCounts: { [key: string]: number } = {};

    symptoms.forEach((record) => {
      record.symptoms.forEach((symptom) => {
        symptomCounts[symptom.type] = (symptomCounts[symptom.type] || 0) + 1;
      });
    });

    // Find most common symptoms (appearing in >30% of records)
    const threshold = Math.max(3, symptoms.length * 0.3);

    return Object.entries(symptomCounts)
      .filter(([_, count]) => count >= threshold)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5)
      .map(([symptom, _]) => this.formatSymptomName(symptom));
  }

  /**
   * Format symptom names for display
   */
  private static formatSymptomName(symptomType: string): string {
    return symptomType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Assess data quality
   */
  private static assessDataQuality(
    cycles: CycleRecord[],
    symptoms: SymptomRecord[],
    notes: DailyNote[]
  ): DataQuality {
    let score = 0;
    let completeness = 0;
    let consistency = 0;
    const suggestions: string[] = [];

    // Completeness assessment
    if (cycles.length >= 3) {
      completeness += 40;
    } else if (cycles.length >= 1) {
      completeness += 20;
      suggestions.push("Track more cycles for better predictions");
    } else {
      suggestions.push("Start tracking your cycles");
    }

    if (symptoms.length >= cycles.length * 3) {
      completeness += 30;
    } else if (symptoms.length > 0) {
      completeness += 15;
      suggestions.push("Track symptoms more regularly");
    } else {
      suggestions.push("Consider tracking symptoms");
    }

    if (notes.length >= cycles.length * 5) {
      completeness += 30;
    } else if (notes.length > 0) {
      completeness += 15;
      suggestions.push("Add more notes about how you feel");
    }

    // Consistency assessment
    if (cycles.length >= 2) {
      const variation = this.calculateCycleVariation(cycles);
      if (variation <= 5) {
        consistency += 50;
      } else if (variation <= 10) {
        consistency += 30;
      } else {
        consistency += 15;
      }

      // Check for data gaps
      const hasRecentData = cycles.some((cycle) => {
        const cycleDate = parseISO(cycle.startDate);
        const daysSince = differenceInDays(new Date(), cycleDate);
        return daysSince <= 60;
      });

      if (hasRecentData) {
        consistency += 50;
      } else {
        consistency += 20;
        suggestions.push("Update with recent cycle data");
      }
    }

    // Overall score
    score = Math.round((completeness + consistency) / 2);

    return {
      score: Math.min(100, score),
      completeness: Math.min(100, completeness),
      consistency: Math.min(100, consistency),
      suggestions,
    };
  }

  /**
   * Generate personalized recommendations
   */
  private static generateRecommendations(
    cycles: CycleRecord[],
    symptoms: SymptomRecord[],
    dataQuality: DataQuality
  ): string[] {
    const recommendations: string[] = [];

    if (cycles.length < 3) {
      recommendations.push(
        "Continue tracking cycles for more accurate predictions"
      );
    }

    if (dataQuality.score < 60) {
      recommendations.push("Improve tracking consistency for better insights");
    }

    if (symptoms.length < cycles.length * 2) {
      recommendations.push(
        "Track symptoms to identify patterns and prepare better"
      );
    }

    const variation =
      cycles.length >= 2 ? this.calculateCycleVariation(cycles) : 0;
    if (variation > 7) {
      recommendations.push(
        "Monitor for factors that might affect cycle regularity"
      );
    }

    return recommendations;
  }

  /**
   * Remove statistical outliers using IQR method
   */
  private static removeOutliers(data: number[]): number[] {
    if (data.length < 4) return data;

    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);

    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return data.filter((value) => value >= lowerBound && value <= upperBound);
  }

  /**
   * Helper method to check if a date is within a date range
   */
  static isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    return !isBefore(date, startDate) && !isAfter(date, endDate);
  }

  /**
   * Helper method to format date for display
   */
  static formatDateForDisplay(date: Date): string {
    return format(date, "MMM dd, yyyy");
  }

  /**
   * Helper method to get cycle phase description
   */
  static getCyclePhaseDescription(phase: CyclePhase): string {
    switch (phase) {
      case "menstrual":
        return "Menstrual phase - Your period is happening";
      case "follicular":
        return "Follicular phase - Your body is preparing for ovulation";
      case "ovulatory":
        return "Ovulatory phase - You may be ovulating";
      case "luteal":
        return "Luteal phase - Your body is preparing for your next period";
      default:
        return "Phase unknown - Keep tracking to identify patterns";
    }
  }

  /**
   * Helper method to get regularity description
   */
  static getRegularityDescription(regularity: RegularityLevel): string {
    switch (regularity) {
      case "very_regular":
        return "Your cycles are very consistent";
      case "regular":
        return "Your cycles are fairly regular";
      case "somewhat_irregular":
        return "Your cycles show some variation";
      case "irregular":
        return "Your cycles are quite irregular";
      case "very_irregular":
        return "Your cycles are very irregular";
      default:
        return "Not enough data to assess regularity";
    }
  }

  /**
   * Calculate median cycle length
   */
  private static calculateMedianCycleLength(cycles: CycleRecord[]): number {
    if (cycles.length < 2) {
      return PERIOD_TRACKING_CONSTANTS.AVERAGE_CYCLE_LENGTH;
    }

    const cycleLengths = this.getCycleLengths(cycles);
    return this.calculateMedian(cycleLengths);
  }

  /**
   * Calculate consistency index
   */
  private static calculateConsistencyIndex(cycles: CycleRecord[]): number {
    if (cycles.length < 2) return 0;

    const cycleLengths = this.getCycleLengths(cycles);
    const variation = this.calculateStandardDeviation(cycleLengths);
    const average =
      cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length;

    // Coefficient of variation (lower = more consistent)
    const cv = variation / average;
    return Math.max(0, Math.round((1 - cv) * 100));
  }

  /**
   * Calculate phase confidence
   */
  private static calculatePhaseConfidence(
    cycles: CycleRecord[],
    phase: CyclePhase,
    dayInCycle: number
  ): number {
    if (cycles.length < 2) return 30;

    const variation = this.calculateCycleVariation(cycles);
    let baseConfidence = 70;

    // Reduce confidence based on cycle variation
    if (variation > 5) baseConfidence -= 20;
    if (variation > 10) baseConfidence -= 20;

    // Increase confidence for certain phases
    if (phase === "menstrual") baseConfidence += 20;
    if (phase === "ovulatory" && cycles.length >= 4) baseConfidence += 10;

    return Math.min(95, Math.max(10, baseConfidence));
  }

  /**
   * Check if in fertile window
   */
  private static isInFertileWindow(
    cycles: CycleRecord[],
    dayInCycle: number
  ): boolean {
    if (cycles.length < 2) return false;

    const averageCycleLength = this.calculateAverageCycleLength(cycles);
    const ovulationDay = averageCycleLength - 14; // 14 days before next period

    // Fertile window: 5 days before ovulation + ovulation day
    return dayInCycle >= ovulationDay - 5 && dayInCycle <= ovulationDay;
  }

  /**
   * Calculate ovulation likelihood
   */
  private static calculateOvulationLikelihood(
    cycles: CycleRecord[],
    dayInCycle: number
  ): number {
    if (cycles.length < 2) return 0;

    const averageCycleLength = this.calculateAverageCycleLength(cycles);
    const ovulationDay = averageCycleLength - 14;

    const daysFromOvulation = Math.abs(dayInCycle - ovulationDay);

    if (daysFromOvulation === 0) return 95;
    if (daysFromOvulation === 1) return 70;
    if (daysFromOvulation === 2) return 40;
    if (daysFromOvulation <= 3) return 20;

    return 0;
  }

  /**
   * Calculate health score
   */
  private static calculateHealthScore(
    cycles: CycleRecord[],
    symptoms: SymptomRecord[],
    notes: DailyNote[]
  ): number {
    let score = 70; // Base score

    if (cycles.length >= 3) {
      const avgLength = this.calculateAverageCycleLength(cycles);
      const variation = this.calculateCycleVariation(cycles);

      // Cycle length score
      if (avgLength >= 24 && avgLength <= 35) score += 15;
      else if (avgLength >= 21 && avgLength <= 45) score += 5;

      // Regularity score
      if (variation <= 3) score += 15;
      else if (variation <= 5) score += 10;
      else if (variation <= 7) score += 5;
    }

    // Symptom management score
    const severeSymptoms = symptoms.filter((s) =>
      s.symptoms.some((sym) => sym.intensity >= 4)
    ).length;
    const symptomRatio =
      symptoms.length > 0 ? severeSymptoms / symptoms.length : 0;

    if (symptomRatio < 0.2) score += 10;
    else if (symptomRatio > 0.5) score -= 15;

    return Math.min(100, Math.max(10, score));
  }

  /**
   * Analyze symptom patterns (enhanced)
   */
  private static analyzeAdvancedSymptomPatterns(
    symptoms: SymptomRecord[]
  ): SymptomPattern[] {
    const symptomCounts: {
      [key: string]: { count: number; totalIntensity: number };
    } = {};

    symptoms.forEach((record) => {
      record.symptoms.forEach((symptom) => {
        if (!symptomCounts[symptom.type]) {
          symptomCounts[symptom.type] = { count: 0, totalIntensity: 0 };
        }
        symptomCounts[symptom.type].count++;
        symptomCounts[symptom.type].totalIntensity += symptom.intensity;
      });
    });

    const totalRecords = symptoms.length;

    return Object.entries(symptomCounts)
      .map(([type, data]) => ({
        type,
        frequency: data.count / totalRecords,
        averageIntensity: data.totalIntensity / data.count,
        phase: ["menstrual" as CyclePhase], // Simplified - would need cycle correlation for full analysis
      }))
      .filter((pattern) => pattern.frequency >= 0.2) // Only include frequent symptoms
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Assess data maturity
   */
  private static assessDataMaturity(
    cycles: CycleRecord[]
  ): "new" | "developing" | "mature" | "extensive" {
    if (cycles.length < 2) return "new";
    if (cycles.length < 4) return "developing";
    if (cycles.length < 12) return "mature";
    return "extensive";
  }

  /**
   * Assess prediction reliability
   */
  private static assessPredictionReliability(
    dataQuality: DataQuality,
    cycles: CycleRecord[]
  ): "high" | "moderate" | "low" | "insufficient" {
    if (cycles.length < 2) return "insufficient";
    if (dataQuality.score >= 70) return "high";
    if (dataQuality.score >= 50) return "moderate";
    return "low";
  }

  /**
   * Helper method to get cycle lengths
   */
  private static getCycleLengths(cycles: CycleRecord[]): number[] {
    const lengths: number[] = [];
    for (let i = 1; i < cycles.length; i++) {
      const length = differenceInDays(
        parseISO(cycles[i].startDate),
        parseISO(cycles[i - 1].startDate)
      );
      if (
        length >= PERIOD_TRACKING_CONSTANTS.MIN_CYCLE_LENGTH &&
        length <= PERIOD_TRACKING_CONSTANTS.MAX_CYCLE_LENGTH
      ) {
        lengths.push(length);
      }
    }
    return lengths;
  }

  /**
   * Calculate median of array
   */
  private static calculateMedian(values: number[]): number {
    if (values.length === 0)
      return PERIOD_TRACKING_CONSTANTS.AVERAGE_CYCLE_LENGTH;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  private static calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;

    return Math.sqrt(variance);
  }
}
