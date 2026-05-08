// Loads the data the subscription purchase form needs for one
// community: the tier list (with Stripe price IDs) and the creator's
// Stripe Connect account. Both come from /api/community/[id]/billing.
//
// Kept as a small fetch hook rather than a redux slice because the
// data is purely render-scoped (the modal closes, we don't need it
// anymore) and re-fetching when the modal reopens is fine.

import { useEffect, useState } from 'react';

import axios from '@src/lib/axios';

export type CommunityTier = {
  id: string;
  uuid: string;
  title: string;
  description: string;
  perks: string[];
  price: number;
  stripePriceId: string | null;
};

export type CommunityBilling = {
  tiers: CommunityTier[];
  ownerAccountId: string | null;
};

type State = {
  data: CommunityBilling | null;
  loading: boolean;
  error: string | null;
};

export function useCommunityBilling(communityId: string | bigint | null | undefined): State & {
  refresh: () => void;
} {
  const id = communityId == null ? null : communityId.toString();
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    axios()
      .get(`/community/${id}/billing`)
      .then(({ data }) => {
        if (cancelled) return;
        setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          data: null,
          loading: false,
          error: err?.response?.data ?? err?.message ?? 'Failed to load',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, tick]);

  return { ...state, refresh: () => setTick((t) => t + 1) };
}
