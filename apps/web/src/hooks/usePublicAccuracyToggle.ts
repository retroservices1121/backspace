// Read + write the caller's `publicAccuracy` flag (controls whether
// Polymarket-derived accuracy stats render on their public profile).

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import axios from '@src/lib/axios';

async function fetchToggle(): Promise<boolean> {
  const { data } = await axios().get<{ enabled: boolean }>('/users/me/public-accuracy');
  return !!data?.enabled;
}

async function postToggle(enabled: boolean): Promise<boolean> {
  const { data } = await axios().post<{ enabled: boolean }>('/users/me/public-accuracy', {
    enabled,
  });
  return !!data?.enabled;
}

export function usePublicAccuracyToggle() {
  const queryClient = useQueryClient();
  const query = useQuery(['public-accuracy'], fetchToggle, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation(postToggle, {
    onSuccess: () => {
      // Refresh the toggle's own read query and invalidate any
      // accuracy badges for this user so the change shows up
      // immediately on their own profile.
      queryClient.invalidateQueries(['public-accuracy']);
      queryClient.invalidateQueries(['user-accuracy']);
    },
  });

  const set = useCallback((enabled: boolean) => mutation.mutate(enabled), [mutation]);

  return {
    enabled: query.data ?? false,
    isLoading: query.isLoading,
    isSaving: mutation.isLoading,
    set,
  };
}
