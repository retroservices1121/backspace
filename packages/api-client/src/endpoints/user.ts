import type { ApiClient } from '../client';
import { selfResponseSchema, type SelfResponse } from '../schemas/user';

/** GET /user/self: the signed-in user's Backspace profile, or null when onboarding is pending. */
export function getSelf(client: ApiClient): Promise<SelfResponse> {
  return client.request('/user/self', { schema: selfResponseSchema });
}
