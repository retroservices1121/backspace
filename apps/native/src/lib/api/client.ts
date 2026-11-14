import { createApiClient } from '@backspace/api-client';
import { fetch } from 'expo/fetch';

export const API_BASE_URL = process.env.EXPO_PUBLIC_BACKSPACE_API_URL || 'https://backspace.to/api';

type TokenGetter = () => Promise<string | null>;
let getAccessToken: TokenGetter = async () => null;

/**
 * Connects the singleton client to the current session's token getter.
 * Called by <ApiSessionBridge /> (src/lib/api/session-bridge.tsx) whenever the session changes.
 */
export function setAccessTokenGetter(getter: TokenGetter) {
  getAccessToken = getter;
}

/** App-wide Backspace API client. Adds the bearer token for authenticated calls; never logs it. */
export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  fetch,
  getToken: () => getAccessToken(),
});
