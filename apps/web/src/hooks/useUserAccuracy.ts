// Fetches per-user Polymarket accuracy stats for a profile header
// badge. The server gate (User.publicAccuracy or self) is enforced
// by /api/users/[username]/accuracy — this hook just relays.

import { useQuery } from 'react-query';

import axios from '@src/lib/axios';

export type AccuracyStats = {
  resolvedPositions: number;
  correctPositions: number;
  accuracy: number | null;
  weightedBrierScore: number | null;
  rankingScore: number;
  lastRecomputedAt: string;
};

export type AccuracyResponse = {
  visible: boolean;
  isSelf?: boolean;
  stats: AccuracyStats | null;
};

async function fetchAccuracy(username: string): Promise<AccuracyResponse> {
  const { data } = await axios().get<AccuracyResponse>(
    `/users/${encodeURIComponent(username)}/accuracy`,
  );
  return data;
}

export function useUserAccuracy(username: string | undefined | null) {
  return useQuery(
    ['user-accuracy', username],
    () => fetchAccuracy(username as string),
    {
      enabled: !!username,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  );
}
