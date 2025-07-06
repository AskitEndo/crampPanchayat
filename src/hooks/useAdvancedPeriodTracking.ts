// Advanced Period Tracking Hook - CrampPanchayat v2.0
// React hook for accessing next-generation period tracking functionality
// Now unified with the main period tracking service

import { useMemo } from "react";
import { Profile } from "../types";
import {
  PeriodTrackingService,
  CycleAnalysis,
} from "../services/periodTracking";
import { format } from "date-fns";

export interface UseAdvancedPeriodTrackingResult {
  // Core Analysis
  analysis: CycleAnalysis | null;
  isLoading: boolean;
  error: string | null;

  // Current Status (Easy Access)
  isOnPeriod: boolean;
  dayInCycle: number;
  currentPhase: string;
  phaseDescription: string;
  periodDay?: number;

  // Cycle Metrics (Easy Access)
  averageCycleLength: number;
  cycleRegularity: string;
  regularityDescription: string;
  cycleVariation: number;

  // Period Metrics (Easy Access)
  averagePeriodLength: number;
  periodVariation: number;

  // Predictions (Easy Access)
  nextPeriodDate: Date | null;
  daysUntilNextPeriod: number;
  isOverdue: boolean;
  overdueByDays?: number;
  predictionConfidence: number;

  // Fertility (Easy Access)
  isInFertileWindow: boolean;
  ovulationDate: Date | null;
  ovulationLikelihood: number;

  // Health & Insights (Easy Access)
  healthScore: number;
  dataQualityScore: number;
  healthInsights: string[];
  recommendations: string[];
  riskFactors: string[];

  // Symptom Analysis (Easy Access)
  commonSymptoms: string[];
  symptomPatterns: any[];
  moodTrends: any[];

  // Advanced Features
  cycleConsistency: number;
  phaseAccuracy: number;

  // Helper Functions
  formatDate: (date: Date) => string;
  getCyclePhaseDescription: (phase: string) => string;
  getRegularityDescription: (level: string) => string;
  getPhaseForDate: (date: Date) => string;
  isPeriodDay: (date: Date) => boolean;
  isFertileDay: (date: Date) => boolean;
}

/**
 * Advanced period tracking hook with comprehensive analysis
 * Unified with main period tracking service for consistency
 */
export function useAdvancedPeriodTracking(
  profile: Profile | null
): UseAdvancedPeriodTrackingResult {
  const analysis = useMemo(() => {
    if (!profile) return null;

    try {
      return PeriodTrackingService.analyzeProfile(profile);
    } catch (error) {
      console.error("Error analyzing period data:", error);
      return null;
    }
  }, [profile]);

  const result = useMemo((): UseAdvancedPeriodTrackingResult => {
    if (!analysis) {
      return {
        analysis: null,
        isLoading: false,
        error: null,

        // Current Status
        isOnPeriod: false,
        dayInCycle: 0,
        currentPhase: "unknown",
        phaseDescription: "No tracking data available",
        periodDay: undefined,

        // Cycle Metrics
        averageCycleLength: 28,
        cycleRegularity: "insufficient_data",
        regularityDescription: "Not enough data to assess regularity",
        cycleVariation: 0,

        // Period Metrics
        averagePeriodLength: 5,
        periodVariation: 0,

        // Predictions
        nextPeriodDate: null,
        daysUntilNextPeriod: 0,
        isOverdue: false,
        overdueByDays: undefined,
        predictionConfidence: 0,

        // Fertility
        isInFertileWindow: false,
        ovulationDate: null,
        ovulationLikelihood: 0,

        // Health & Insights
        healthScore: 0,
        dataQualityScore: 0,
        healthInsights: [],
        recommendations: [
          "Start tracking your cycles to get personalized insights",
        ],
        riskFactors: [],

        // Symptom Analysis
        commonSymptoms: [],
        symptomPatterns: [],
        moodTrends: [],

        // Advanced Features
        cycleConsistency: 0,
        phaseAccuracy: 0,

        // Helper Functions
        formatDate: PeriodTrackingService.formatDateForDisplay,
        getCyclePhaseDescription:
          PeriodTrackingService.getCyclePhaseDescription,
        getRegularityDescription:
          PeriodTrackingService.getRegularityDescription,
        getPhaseForDate: (date: Date) => "unknown",
        isPeriodDay: () => false,
        isFertileDay: () => false,
      };
    }

    return {
      analysis,
      isLoading: false,
      error: null,

      // Current Status
      isOnPeriod: analysis.isOnPeriod,
      dayInCycle: analysis.dayInCycle,
      currentPhase: analysis.currentPhase,
      phaseDescription: PeriodTrackingService.getCyclePhaseDescription(
        analysis.currentPhase
      ),
      periodDay: analysis.isOnPeriod ? analysis.periodDay : undefined,

      // Cycle Metrics
      averageCycleLength: analysis.averageCycleLength,
      cycleRegularity: analysis.cycleRegularity,
      regularityDescription: PeriodTrackingService.getRegularityDescription(
        analysis.cycleRegularity
      ),
      cycleVariation: analysis.cycleVariation,

      // Period Metrics
      averagePeriodLength: analysis.averagePeriodLength,
      periodVariation: analysis.periodVariation,

      // Predictions
      nextPeriodDate: analysis.nextPeriodPrediction.predictedStartDate,
      daysUntilNextPeriod: analysis.nextPeriodPrediction.daysUntil,
      isOverdue: analysis.nextPeriodPrediction.isOverdue,
      overdueByDays: analysis.nextPeriodPrediction.isOverdue
        ? Math.abs(analysis.nextPeriodPrediction.daysUntil)
        : undefined,
      predictionConfidence: analysis.nextPeriodPrediction.confidenceLevel,

      // Fertility
      isInFertileWindow: analysis.isInFertileWindow,
      ovulationDate: analysis.ovulationPrediction?.predictedDate || null,
      ovulationLikelihood: analysis.ovulationLikelihood,

      // Health & Insights
      healthScore: analysis.healthScore,
      dataQualityScore: analysis.dataQuality.score,
      healthInsights: analysis.healthInsights.map((insight) => insight.message),
      recommendations: analysis.recommendedActions,
      riskFactors: [], // Not available in current interface

      // Symptom Analysis
      commonSymptoms: analysis.symptomPatterns.map((p) => p.type),
      symptomPatterns: analysis.symptomPatterns,
      moodTrends: [], // Not available in current interface

      // Advanced Features
      cycleConsistency: analysis.consistencyIndex,
      phaseAccuracy: analysis.phaseConfidence,

      // Helper Functions
      formatDate: PeriodTrackingService.formatDateForDisplay,
      getCyclePhaseDescription: PeriodTrackingService.getCyclePhaseDescription,
      getRegularityDescription: PeriodTrackingService.getRegularityDescription,
      getPhaseForDate: (date: Date) => {
        try {
          // Calculate phase for any given date based on current analysis
          if (!profile?.cycles || profile.cycles.length === 0) return "unknown";

          const lastCycle = profile.cycles[profile.cycles.length - 1];
          const lastPeriodStart = new Date(lastCycle.startDate);
          const daysSinceLastPeriod = Math.abs(
            Math.floor(
              (date.getTime() - lastPeriodStart.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
          const cycleDay =
            (daysSinceLastPeriod % analysis.averageCycleLength) + 1;

          if (cycleDay <= analysis.averagePeriodLength) return "menstrual";
          if (cycleDay <= 13) return "follicular";
          if (cycleDay <= 15) return "ovulatory";
          return "luteal";
        } catch {
          return "unknown";
        }
      },
      isPeriodDay: (date: Date) => {
        try {
          if (!profile?.cycles) return false;
          return profile.cycles.some((cycle) =>
            cycle.periodDays.some((periodDateStr) => {
              const periodDate = new Date(periodDateStr);
              return (
                Math.abs(date.getTime() - periodDate.getTime()) <
                24 * 60 * 60 * 1000
              );
            })
          );
        } catch {
          return false;
        }
      },
      isFertileDay: (date: Date) => {
        try {
          const phase = result.getPhaseForDate(date);
          return phase === "ovulation" || phase === "follicular";
        } catch {
          return false;
        }
      },
    };
  }, [analysis, profile]);

  return result;
}

// Legacy compatibility export (for backward compatibility)
export const useAdvancedPeriodTrackingLegacy = useAdvancedPeriodTracking;
