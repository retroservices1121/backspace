// Legacy *Union types from the Firebase era. Components still
// reference these as type-only imports while the gradual migration
// to Postgres-shaped types (`types/prisma.ts`) finishes. Keeping
// them here lets us delete the old `api/PostAPI.ts` and
// `api/communityAPI.ts` files (which had real Firebase runtime
// imports) without breaking type-check at the call sites.
//
// Long-term these should be replaced with the Prisma-derived types
// directly. The Document types they extend still live in
// `types/documents.ts`.

import type { OldUser } from '@src/store/userSlice';
import type {
  ChannelDocument,
  CommentDocument,
  CommunityDocument,
  MessageDocument,
  PostDocument,
} from '@src/types/documents';

export type PostUnion = PostDocument & {
  author: OldUser;
  mediaURL: string;
};

export type CommentUnion = CommentDocument & {
  author: OldUser;
};

export type MessageUnion = MessageDocument & {
  author: OldUser;
  mediaURL?: string;
};

export type CommunityUnion = CommunityDocument & {
  channels: Array<ChannelDocument>;
  message_count: number;
};
