// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History
//
// Analytics surface. Firebase Analytics was removed during the
// pivot; we kept the call sites and the EventMessages registry
// since they're a useful index of what's worth tracking. Pick a
// replacement (PostHog / Plausible / etc.) and wire `logEvent` /
// `setAnalyticsUserId` to it — until then these are no-ops.


enum AuthEvents {
  New =               'NewAccount',
  Login =             'AuthLogin',
  Logout =            'AuthLogout',
  PasswordReset =     'PasswordReset',
  PasswordChange =    'PasswordChange',
}

enum UserEvents {
  SubmitOnboarding =  'SubmitOnboarding',
  AccessCodeSubmit =  'AccessCodeSubmit',
  StartedFollowing =  'FollowOther',
  StopFollowing =     'UnFollowOther',
}

enum PostEvents {
  NewPost =           'NewPost',
  LikePost =          'LikePost',
  UnlikePost =        'UnlikePost',
  NewComment =        'NewComment',
}

enum MessageEvents {
  NewConversation =   'NewConversation',
  SendMessage =       'SendDirectMessage',
}

enum CommunityEvents {
  NewMember =         'NewMember',
  RemoveMember =      'RemoveMember',
  RoleUpdate =        'RoleUpdate',
  NewSubscriber =     'NewSubscriber',
  SendMessage =       'SendChannelMessage',
  NewTier =           'NewTier',
  RemoveTier =        'RemoveTier',
  ViewSubscription =  'ViewSubscription',
}

enum BillingEvents { 
  NewCustomer =       'NewCustomerAccount',
  NewCreator =        'NewCreatorAccount',
  PriceUpdate =       'PriceUpdate',
  Subscribe =         'NewSubscription',
  UnSubcribe =        'CancelSubscription',
}

enum MediaEvents {
  MediaUpload =       'UploadMedia',
}

export enum Screens {
  Auth =              'Auth',
  Onboarding =        'Onboarding',
  Feed =              'Feed',
  Discover =          'Discover',
  Profile =           'Profile',
  Messages =          'Messages', 
  Community =         'Community',
  Settings =          'Settings',
}

export const EventMessages = {
  Auth : AuthEvents,
  User : UserEvents,
  Messages : MessageEvents,
  Posts: PostEvents,
  Community: CommunityEvents,
  Billing: BillingEvents,
  Media: MediaEvents,
};

export const setAnalyticsUserId = async (_uid: string) => {
  // No-op until an analytics provider is wired.
};

const logEvent = async (_event: string, _params?: any) => {
  // No-op until an analytics provider is wired.
};

export const logEventScreen = (screenName: Screens) => {
  logEvent('screen_view', {
    firebase_screen: screenName,
  });
};

export default logEvent;
