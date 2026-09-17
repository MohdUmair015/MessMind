export interface DemandTrendPoint {
  date: string;
  mealType: string;
  predictedDiners: number;
  actualDiners: number;
  preparedServings: number;
}

export interface WasteTrendPoint {
  date: string;
  wastedServings: number;
  remainingServings: number;
  wastePercent: number;
}

export interface PredictionAccuracyMetrics {
  meanAbsolutePercentageError: number;
  withinFivePercentCount: number;
  totalEvaluatedMeals: number;
  averageWasteReductionServings: number;
}
