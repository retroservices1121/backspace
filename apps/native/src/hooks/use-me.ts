import { ApiError, getSelf } from '@backspace/api-client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';

/**
 * The signed-in user's Backspace profile from GET /user/self.
 * `data === null` means signed in, but no Backspace user row exists yet (needs onboarding).
 */
export function useMe() {
  const session = useSession();
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => getSelf(apiClient),
    enabled: session.ready && Boolean(session.user),
    staleTime: 60_000,
    retry: (count, error) => !(error instanceof ApiError && error.status > 0 && error.status < 500) && count < 2,
  });
}
