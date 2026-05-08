// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { logEvent as fbLogEvent, setUserId } from 'firebase/analytics';
import { analytics } from 'utils/firebase';


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

export const setAnalyticsUserId = async (uid : string) => {
  if (await analytics) {
    setUserId(await analytics, uid);
  }
};

const logEvent = async (event: string, params?: any) => {
  if (await analytics) {
    fbLogEvent(await analytics, event, params);
  }
};

export const logEventScreen = (screenName: Screens) => {
  logEvent('screen_view', {
    firebase_screen: screenName,
  });
};

export default logEvent;
