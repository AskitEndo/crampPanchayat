// Period Tracking Hook - CrampPanchayat
// React hook for accessing enhanced period tracking functionality

import { useMemo } from "react";
import { Profile } from "../types";
import {
  PeriodTrackingService,
  CycleAnalysis,
} from "../services/periodTracking";

export interface UsePeriodTrackingResult {
  analysis: CycleAnalysis | null;

  // Convenience getters
  isOnPeriod: boolean;
  dayInCycle: number;
  currentPhase: string;
  phaseDescription: string;

  // Predictions
  nextPeriodDate: Date | null;
  daysUntilNextPeriod: number;
  isOverdue: boolean;

  // Health metrics
  averageCycleLength: number;
  cycleRegularity: string;
  regularityDescription: string;

  // Data insights
  dataQualityScore: number;
  healthInsights: any[];
  recommendations: string[];

  // Helper functions
  formatDate: (date: Date) => string;
  getCyclePhaseDescription: (phase: string) => string;
}

/**
 * Enhanced period tracking hook with comprehensive analysis
 */
export function usePeriodTracking(
  profile: Profile | null
): UsePeriodTrackingResult {
  const analysis = useMemo(() => {
    if (!profile) return null;

    try {
      return PeriodTrackingService.analyzeProfile(profile);
    } catch (error) {
      console.error("Error analyzing period data:", error);
      return null;
    }
  }, [profile]);

  const result = useMemo((): UsePeriodTrackingResult => {
    if (!analysis) {
      return {
        analysis: null,
        isOnPeriod: false,
        dayInCycle: 0,
        currentPhase: "unknown",
        phaseDescription: "No tracking data available",
        nextPeriodDate: null,
        daysUntilNextPeriod: 0,
        isOverdue: false,
        averageCycleLength: 28,
        cycleRegularity: "insufficient_data",
        regularityDescription: "Not enough data to assess regularity",
        dataQualityScore: 0,
        healthInsights: [],
        recommendations: [
          "Start tracking your cycles to get personalized insights",
        ],
        formatDate: PeriodTrackingService.formatDateForDisplay,
        getCyclePhaseDescription:
          PeriodTrackingService.getCyclePhaseDescription,
      };
    }

    return {
      analysis,

      // Convenience getters
      isOnPeriod: analysis.isOnPeriod,
      dayInCycle: analysis.dayInCycle,
      currentPhase: analysis.currentPhase,
      phaseDescription: PeriodTrackingService.getCyclePhaseDescription(
        analysis.currentPhase
      ),

      // Predictions
      nextPeriodDate: analysis.nextPeriodPrediction.predictedStartDate,
      daysUntilNextPeriod: analysis.nextPeriodPrediction.daysUntil,
      isOverdue: analysis.nextPeriodPrediction.isOverdue,

      // Health metrics
      averageCycleLength: analysis.averageCycleLength,
      cycleRegularity: analysis.cycleRegularity,
      regularityDescription: PeriodTrackingService.getRegularityDescription(
        analysis.cycleRegularity
      ),

      // Data insights
      dataQualityScore: analysis.dataQuality.score,
      healthInsights: analysis.healthInsights,
      recommendations: analysis.recommendedActions,

      // Helper functions
      formatDate: PeriodTrackingService.formatDateForDisplay,
      getCyclePhaseDescription: PeriodTrackingService.getCyclePhaseDescription,
    };
  }, [analysis]);

  return result;
}
