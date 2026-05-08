// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import * as Types from 'types/prisma';

import BaseMessage from './ChannelMessage';
// TODO Comment & Post from local


type MessageProps = {
  message: Types.Message;
  grid: boolean;
  index: number;
};

export const Message: React.FC<MessageProps> = ({ message, grid, index }) => {
  //TODO can I be deleted?
  // switch (message.type) {
  //   case MessageType.Post: {
  //     if (grid)
  //       return <PostTile key={`post-${message.id || index}`} post={message as unknown as PostWithUser} />;
  //     //@ts-ignore
  //     // return <MediaPost key={`post-${message.id || index}`} post={message}/>;
  //   }
  //   case MessageType.Comment: {
  //     //@ts-ignore
  //     return <Comment key={`comment-${message.id || index}`} comment={message} />;
  //   }
  //   case MessageType.Channel:
  //   case MessageType.Direct:
  //   default: {
  //     return <BaseMessage message={message} />;
  //   }
  // }
  return <BaseMessage key={`message-${message.id}`} message={message} />;
};

export default Message;