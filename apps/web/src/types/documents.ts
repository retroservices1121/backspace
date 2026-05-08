// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History
import { FieldValue, Timestamp } from '@firebase/firestore';
import { DocumentReference } from '@google-cloud/firestore';
import { Stripe as StripeOfficial } from 'stripe';


/* Collections and their Nesting
├── AccessCodes
├── Activity
├── Communities
|   ├── Members
│   └── Channels
│       └── Posts
|           ├── Comments
│           └── Likes
├── DirectMessageQueue
├── Events
├── Network
│   ├── Followed
│   ├── Following
│   ├── Subscribed
│   └── Subscribing
├── Notifications
│   ├── All
│   └── Communities (settings?)
├── Posts_All
├── UserPrivate
│   └── Stripe
└── Users
    ├── Memberships
    └── DirectMessages
        └── Messages
*/
export enum Collections {
  AccessCodes = 'access_codes',
  Activity = 'activity',
  Status = 'status',
  Communities = 'communities',
  Events = 'events',
  Posts_All = 'posts_readonly',
  Posts = 'posts',
  Users = 'users',
  UsersPrivate = 'users_private',
  DirectMessageQueue = 'queue_dm',
  Notifications = 'notifications',
  Network = 'network',
  /** Under Notifications */
  All = 'all',
  /** Under Network */
  Following = 'following',
  /** Under Network */
  Followed = 'followed',
  /** Under Network */
  Subscribing = 'subscribing',
  /** Under Network */
  Subscribed = 'subscribed',
  /** Under Users */
  DirectMessages = 'direct_messages',
  /** Under Users */
  Memberships = 'memberships',
  /** Under Users Private */
  Stripe = 'stripe',
  /** Under Direct Messages or Channels */
  Messages = 'messages',
  /** Under Communities */
  Channels = 'channels',
  /** Under Communities */
  Members = 'members',
  PremiumTiers = 'premium_tiers',
  /** Under Posts */
  Likes = 'likes',
  /** Under Posts */
  Comments = 'comments',
}

export type DocumentId = string;
export type SimpleDate = {
  /** 1-12 */
  month: number,
  /** 1-31 */
  day: number,
  /** 4-digit year */
  year: number
};

export type ChannelReference = {
  community: DocumentId,
  channel: DocumentId
};

export enum OnlinePresence {
  Online = 'Online',
  Offline = 'Offline',
  Idle = 'Idle',
  Away = 'Away',
  Busy = 'Busy',
  Invisible = 'Invisible',
}

export type UserDocumentMeta = {
  reserved: string[];
};

export type UserDocument = {
  /** user's universal id */
  id: DocumentId;
  /** username (unique) */
  username: string;
  /** whether user is fully onboarded */
  onboarded: boolean;
  /** account creation time */
  creation: Timestamp | FieldValue;
  /** account last sign-in time */
  last_signin: Timestamp | FieldValue;
  /** community featured on profile */
  featured: ChannelReference;
  /** account is verified */
  verified?: boolean;
  /** Public profile image */
  profile_image: string;
  /** Public banner/cover image */
  banner_image: string;
  /** all lowercase version of display name */
  search_name?: string;
  /** public display name*/
  display_name?: string;
  /** number of followers */
  follower_count?: number;
  /** number of paid subscribers to featured community */
  subscriber_count?: number;
  description?: string;
  /** online if true */
  online?: OnlinePresence;
  /** status update time */
  online_last_update?: Timestamp | FieldValue;
  /** Token of last connected device */
  pushToken?: string;
  /** alpha code for alpha access */
  access_code?: {
    value: string,
    validated: boolean
  }
  interests?: string[]
};

export type PrivateUserDocument = {
  /** user email (matches auth) */
  email: string | undefined;
  /** user verified email */
  email_verified: boolean;
  /** user phone number */
  phone_number?: string | undefined;
  /** user's universal id */
  uid: DocumentId;
  /** user's legal first name */
  first_name?: string;
  /** user's legal last name */
  last_name?: string;
  /** user's date of birth */
  dob?: SimpleDate;
  /** Stripe Account Link (creators)*/
  account_link?: StripeOfficial.AccountLink
};

export enum NewMessageType {
  /** Post/Media Content */
  Post = 'POST',
  /** Direct Message */
  Direct = 'DIRECT_MESSAGE',
  /** In-Channel Message */
  Channel = 'CHANNEL_MESSAGE',
  /** Comment on Post */
  Comment = 'POST_COMMENT',
}

export enum MessageType {
  /** Post/Media Content */
  Post = 'post',
  /** Direct Message */
  Direct = 'direct',
  /** In-Channel Message */
  Channel = 'channel',
  /** Comment on Post */
  Comment = 'comment',
}

export type WithId<T> = T & { id: DocumentId };

export enum MediaType {
  Video = 'video',
  Image = 'image',
  None = '',
}

type BaseMessage = {

  /** Creator/Originator uid */
  sender: DocumentId;
  /** Creation timestamp */
  timestamp: Timestamp;
  /** Post Centent - Text */
  text: string;
  /** Post Centent - Media storage path */
  media: string;
  /** Type of media */
  media_type: MediaType;
  /** Optional: ID of message */
  id?: DocumentId;
};

export type PostDocument = BaseMessage & {
  /** Type of Message (dm vs post) */
  type: MessageType.Post;
  /** Post Centent - Title */
  title: string;
  /** Number of likes this post received */
  likes: number;
  /** Number of comments this post received */
  comments: number;
  /** community */
  community: DocumentId;
  channel: DocumentId;
  /** For premium or restricted content */
  permission_required: PermissionsType;
  disable_comments: boolean;
};

export type DirectMessageDocument = BaseMessage & {
  /** Type of Message (dm vs post) */
  type: MessageType.Direct;
  /** UID of intended message recipient */
  recipient: DocumentId
};

export type ChannelMessageDocument = BaseMessage & {
  /** Type of Message (dm vs post) */
  type: MessageType.Channel;
  /** community */
  community: DocumentId;
  channel: DocumentId;
};

export type CommentDocument = BaseMessage &  {
  type: MessageType.Comment;
  /** Id of post comment is on */
  postId: string;
  /** Comment has been editted */
  edited: boolean;
  /** Update any time doc is changed */
  last_updated: Timestamp | FieldValue;
};

export type MessageDocument = PostDocument | ChannelMessageDocument | DirectMessageDocument | CommentDocument;

export type CommunityDocument = {
  /** unique community identifier */
  id: DocumentId,
  /** community Display Name */
  name: string;
  /** public Description */
  description: string;
  /** uid of owner/admin */
  owner_id: string;
  /** Profile Image, storage path or URL */
  image?: string,
  /** Banner/Cover Image, storage path or URL */
  banner?: string,
  /** Order of channels, unlisted channels go to bottom */
  channel_order?: string[],
  // TODO when a user gets a tier, they get a role. Roles designate permissions.
  // permissions:
};

export enum PerkIcons {
  Start = 'star',
}

export type Perk = {
  icon: PerkIcons;
  text: string;
};

export type TierDocument = {
  perks: Perk[];
  description: string;
  title: string;
  price: number;
  stripe_price?: StripeOfficial.Price;
};


export enum ChannelType {
  /** Messages, and Posts */
  Chat = 'Chat',
  /** Posts only, no messages */
  Post = 'Post',
  /** Text only, no media */
  Discussion = 'Discussion',
  /** Grid view of content */
  Library = 'Library',
  /** Text only, no media */
  Livestream = 'Livestream',
}

export enum PermissionsType {
  /** Anyone can */
  Anyone = 0,
  /** Followers and up */
  //Followers = 1,
  /** Followers and up */
  Members = 2,
  /** Subscribers and up */
  Subscribers = 3,
  /** Mods and up */
  Moderators = 4,
  /** Admin and up */
  Admin = 5,
}

export const PermissionsName  = {
  /** Anyone can */
  [PermissionsType.Anyone]: 'Anyone',
  /** Followers and up */
  //[PermissionsType.Followers]: 'Followers',
  /** Followers and up */
  [PermissionsType.Members]: 'Members',
  /** Subscribers and up */
  [PermissionsType.Subscribers]: 'Subscribers',
  /** Mods and up */
  [PermissionsType.Moderators]: 'Moderators',
  /** Admin and up */
  [PermissionsType.Admin]: 'Admin',
};

export type ChannelDocument = {
  /** True if this is a user's profile */
  profile: boolean,
  /** unique channel identifier */
  id: DocumentId,
  /** display name of channel */
  name: string,
  /** public description of channel */
  description: string,
  /** uid of owner/admin */
  owner_id: string,
  /** who can post content to this channel */
  permissions: PermissionsType,
  /** Who can access this channel */
  access: PermissionsType,
  /** Type of content in channel */
  type: ChannelType,
  /** Read-only: Count of messages/posts in channel*/
  message_count?: number,
};

export type StagedPayment = {
  customer_uid: string
  destination_uid: string,
  amount: number,
  description?: string,
};

export type ConversationDocument = {
  /** Last message sent or recieved*/
  last_message: DirectMessageDocument,
  /** Last Update timestamp */
  last_update: Timestamp | FieldValue,
  /** ID of other user */
  other_uid: DocumentId,
  /** ID of user */
  self_uid: DocumentId,
  /** Read-only: Number of dms in conversation */
  message_count?: number,
};

/** Aggregated data */
export type NetworkDocument = {
  /** User identifier */
  uid: string;
  /** Number of people user follows */
  following_count: number;
  /** Number of people following user */
  followed_count: number;
  /** Number of people user subscribes to */
  subscribing_count: number;
  /** Number of people subscribing to user */
  subscribed_count: number;
  /** Total Like count */
  likes_count: number;
};

/** Follow Record */
export type FollowDocument = {
  uid: string;
  follow: boolean;
  last_update: Timestamp | FieldValue;
};

/** Subscribe Record */
export type SubscribeDocument = {
  uid: string;
  subscribe: boolean;
  /** Tier, 0 being the lowest, 4 being the highest */
  tier: 0 | 1 | 2 | 3 | 4;
  last_update: Timestamp | FieldValue;
};

export type MemberDocument = {
  uid: DocumentId,
  last_update: Timestamp | FieldValue,
  role: PermissionsType,
  tier: 0 | 1 | 2 | 3 | 4;
};


export type LikeDocument = {
  uid: string,
  like: boolean,
  last_update: Timestamp | FieldValue;
};

export enum NotificationType {
  /** Post/Media Content */
  Post = 'Post',
  /** Direct Message */
  Direct = 'Direct',
  /** In-Channel Message */
  Channel = 'Channel',
  /** Follow */
  Follow = 'Follow',
  /** Member */
  Member = 'Member',
}

export type NotificationDocument = {
  id: string,
  type: NotificationType,
  timestamp: Timestamp | FieldValue,
  ref: DocumentReference,
  read: boolean,
};

// For real-time status subscribers
export type StatusDocument = {
  /** User's online status*/
  online: OnlinePresence,
  online_last_update: Timestamp | FieldValue,
};

export type ActivityDocument = {
  /** Count of messages last seen */
  [Collections.DirectMessages] : any,
  /** Count of last seen Channel Messages */
  [Collections.Channels] : any,
  /** Count of last seen Channel Messages */
  [Collections.Communities] : any,
};

export enum PingTypes {
  AllMessages = 'all_messages',
  Mentions = 'mentions',
  Nothing = 'nothing',
}

export type CommunityNotificationDocument = {
  muted: boolean;
  ping_type: PingTypes;
};

export type AccessCode = {
  /** uid of user referring users */
  refer_uid: string,
  /** code to unlock */
  value: string,
  /** date added */
  created: Timestamp | FieldValue;
  /** date expires */
  expires: Timestamp;
  /** max uses */
  max_uses: number;
  /** current user count */
  current_uses?: number;
};
