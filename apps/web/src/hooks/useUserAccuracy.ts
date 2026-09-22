export type AccuracyStats = {
  resolvedPositions: number;
  correctPositions: number;
  accuracy: number | null;
  weightedBrierScore: number | null;
  rankingScore: number;
};

export type UserAccuracyResponse = {
  visible: boolean;
  stats: AccuracyStats | null;
};

/** Prediction reputation is paused until Gate settlement data is connected. */
export function useUserAccuracy(_username: string | undefined | null): {
  data: UserAccuracyResponse | undefined;
  isLoading: boolean;
} {
  return { data: undefined, isLoading: false };
}
