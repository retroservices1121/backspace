import { useLayoutEffect } from 'react';
import { useSession } from '@/auth/session';
import { setAccessTokenGetter } from './client';

/**
 * Keeps the API client's token getter in sync with the session.
 * A layout effect runs before any query's passive mount effect, so the first
 * authenticated request already sees the signed-in session.
 */
export function ApiSessionBridge() {
  const { getAccessToken } = useSession();
  useLayoutEffect(() => {
    setAccessTokenGetter(getAccessToken);
  }, [getAccessToken]);
  return null;
}
