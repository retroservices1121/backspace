// Read + write the user's primary trading wallet preference.
//
// The picker on /settings/wallet sets it; useEvmTradeSigner reads it
// to override the auto-pick. Stored as a lowercased EVM address. null
// means "use auto-pick" (the historical behavior).
//
// react-query keeps the value in sync across mounted components — both
// the picker UI and the trade signer subscribe to the same cache key.

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import axios from '@src/lib/axios';

const QUERY_KEY = ['primary-trading-wallet'] as const;

async function fetchPrimary(): Promise<string | null> {
  const { data } = await axios().get<{ address: string | null }>(
    '/users/me/primary-wallet',
  );
  return data?.address ?? null;
}

async function setPrimary(address: string | null): Promise<string | null> {
  const { data } = await axios().post<{ address: string | null }>(
    '/users/me/primary-wallet',
    { address },
  );
  return data?.address ?? null;
}

export function usePrimaryTradingWallet() {
  const queryClient = useQueryClient();

  const query = useQuery(QUERY_KEY, fetchPrimary, {
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const mutation = useMutation(setPrimary, {
    onMutate: async (next) => {
      await queryClient.cancelQueries(QUERY_KEY);
      const previous = queryClient.getQueryData<string | null>(QUERY_KEY);
      queryClient.setQueryData<string | null>(QUERY_KEY, next ?? null);
      return { previous };
    },
    onError: (_err, _next, ctx) => {
      if (ctx) queryClient.setQueryData(QUERY_KEY, ctx.previous ?? null);
    },
    onSettled: () => {
      queryClient.invalidateQueries(QUERY_KEY);
    },
  });

  const set = useCallback(
    (address: string | null) => mutation.mutateAsync(address),
    [mutation],
  );

  return {
    address: query.data ?? null,
    isLoading: query.isLoading,
    isSaving: mutation.isLoading,
    set,
  };
}
