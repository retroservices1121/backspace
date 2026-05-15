/* eslint-disable @typescript-eslint/no-shadow */
// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { ChannelType, Prisma } from '@prisma/client';
import * as Types from '@prisma/client';

// Interfaces are used for namespace + interface merging.

// Maintaining this page is a necessary evil to make sure the includes matchup backend to frontend

// _Do you hate me for making these headers? -sam_

/* >>----------------<-->----------------< NOTIFICATION >----------------<-->----------------<< */
export namespace Notification {
  export const include = {
    subscription: {
      include: {
        user: { include: { avatar: true } },
      },
    },
    dm: {
      include: {
        author: { include: { avatar: true } },
      },
    },
    mention: {
      include: {
        author: { include: { avatar: true } },
      },
    },
    follow: {
      include: {
        follower: { include: { avatar: true } },
      },
    },

  };
}
const notificationType = Prisma.validator<Prisma.NotificationArgs>()({ include: Notification.include });
export interface Notification extends Prisma.NotificationGetPayload<typeof notificationType> { }
/* >>----------------<-->----------------< USER >----------------<-->----------------<< */


export namespace User {
  export const include = {
    avatar: true,
  };

  export namespace Self {
    export const include = {
      avatar: true,
      banner: true,
      state: true,
      private: true,
      memberships: {
        orderBy: {
          community: {
            name: Prisma.SortOrder.asc,
          },
        },
        include:{
          community: {
            include: {
              channels: { //For CreatePost (might be too expensive here)
                orderBy: {
                  name: Prisma.SortOrder.asc,
                },
              },
            },
          },
        },
      },
      communities: {
        include: { avatar: true },
      },
      conversations: {
        // unfortunately can't be replaced with Conversations.include.members
        include: { members: { include: User.include } },
      },
      followers: {
        include: { follower: { include: User.include } },
      },
      following: {
        include: { account: { include: User.include } },
      },
      notifications: {
        include: Notification.include,
      },
    };
  }

  /** @deprecated meaningless name & doesn't follow pattern */
  export const defaultArgs = Prisma.validator<Prisma.UserArgs>()({
    include: {
      state: true,
      avatar: true,
      followers: true,
      following: true,
      memberships: true,
    },
  });

  /** @deprecated meaningless name & doesn't follow pattern */
  export type DefaultUser = Prisma.UserGetPayload<typeof defaultArgs>;

  const self = Prisma.validator<Prisma.UserArgs>()({ include: Self.include });
  export interface Self extends Prisma.UserGetPayload<typeof self> { }
}
const userType = Prisma.validator<Prisma.UserArgs>()({ include: User.include });
export interface User extends Prisma.UserGetPayload<typeof userType> { }

/* >>----------------<-->----------------< Member >----------------<-->----------------<< */

export namespace Member {
  export const include = { 
    user: {
      include: User.include,
    },
  };
}
const memberType = Prisma.validator<Prisma.MemberArgs>()({ include: Member.include });
export interface Member extends Prisma.MemberGetPayload<typeof memberType> { }


/* >>----------------<-->----------------< Community >----------------<-->----------------<< */
// Communities          -> Community with all the includes below.
export namespace Community {
  export const include = {
    avatar: true,
    banner: true,
    tiers: true,
    channels: true,
    members: {
      include: Member.include,
    },
    owner: {
      include: User.include,
    },
  };
}

const communityType = Prisma.validator<Prisma.CommunityArgs>()({ include: Community.include });
export interface Community extends Prisma.CommunityGetPayload<typeof communityType> { }

/* >>----------------<-->----------------< Channel >----------------<-->----------------<< */
export namespace Channel {
  export const include = { messages: { include: { author: true } } };
}

const channelType = Prisma.validator<Prisma.ChannelArgs>()({ include: Channel.include });
export interface Channel extends Prisma.ChannelGetPayload<typeof channelType> { }

/* >>----------------<-->----------------< Message >----------------<-->----------------<< */

export namespace Message {
  export const include = {
    author: { include: User.include },
  };
}

const messageType = Prisma.validator<Prisma.MessageArgs>()({ include: Message.include });
export interface Message extends Prisma.MessageGetPayload<typeof messageType> { }

/* >>----------------<-->----------------< Post >----------------<-->----------------<< */

export namespace Post {
  export const include = {
    media: true,
    author: {
      include: { avatar: true },
    },
    message: {
      include: {
        community: true,
        channel: true,
        // Mirror Message.include so a post's message can be inserted
        // straight into the community channel state on the client.
        author: { include: User.include },
      },
    },
    profile: true,
    comments: false, //needed so we can conditionally add likes
    _count: {
      select: {
        likes: true,
        comments: true,
      },
    },
    likes: false, //needed so we can conditionally add likes
  };

}
const defaultPost = Prisma.validator<Prisma.PostArgs>()({ include: Post.include });
export interface Post extends Prisma.PostGetPayload<typeof defaultPost> { }

/* >>----------------<-->----------------< Comment >----------------<-->----------------<< */

export namespace Comment {
  export const include = {
    author: {
      include: { avatar: true },
    },
  };

}
const defaultComment = Prisma.validator<Prisma.CommentArgs>()({ include: Comment.include });
export interface Comment extends Prisma.CommentGetPayload<typeof defaultComment> { }
/* >>----------------<-->----------------< Conversation >----------------<-->----------------<< */

export namespace Conversation {
  export const include = {
    members: {
      include: User.include,
    },
    messages: {
      include: {
        media: true,
      },
    },
  };
}

const conversationType = Prisma.validator<Prisma.ConversationArgs>()({ include: Conversation.include });
export interface Conversation extends Prisma.ConversationGetPayload<typeof conversationType> { }

/* >>----------------<-->----------------< ### >----------------<-->----------------<< */

