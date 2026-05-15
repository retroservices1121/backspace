// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { throttle } from 'lodash';

import DMHeader from 'components/Channel/DMHeader';
import BaseMessage from 'components/Community/Message/BaseMessage';
import { InfiniteListFull } from 'components/core/InfiniteList';
import ChatInput from 'components/Rich/ChatInput';
import { useChat } from 'hooks/useConversations';
import useUser from 'hooks/useUser';

type Props = {};

const Conversation: React.FC<Props> = () => {
  const { conversation, paginate, sendMessage, deleteMessage, editMessage } = useChat();
  const { user } = useUser();

  // const goToUser = (user: User) => {
  //   if (user.username && user.username.length > 0) {
  //     router.push(user.username);
  //   } else {
  //     toast.warn('Sorry there was an error routing to this user.');
  //   }
  // };

  const usersList = conversation?.members?.map(({ username }) => `@${username} `);

  const title = conversation?.name
    || conversation?.members
      ?.filter(m => m.id === user.id)
      .map(m => ` ${m.name}`)
      .toString()
    || 'Conversation';

  if (!conversation || !user.id) return (
    <div className="flex flex-col h-full w-full">
      <DMHeader title={'No Conversation Selected'} />
    </div>
  );

  //  TODO bs-590 replace this with useUserById
  const users = {
    [user.id.toString()]: user,
    ...conversation?.members?.reduce((acc, curr) => {
      acc[curr.id.toString()] = curr;
      return acc;
    }, {}),
  };

  const throttledPaginate = throttle(paginate, 1000);

  return (
    <div className="flex flex-col h-full w-full">
      <DMHeader
        // onClick={() => goToUser(activeConversation.other)}
        title={title}
        // image={activeAvatar} // TODO based on selected conversation
        // verified={activeConversation?.other.verified || false}
        //@ts-ignore FIXME: onlineStatus is broken
        description={`${usersList}\n${conversation?.members?.length} member(s)`}
        showDescription={conversation?.members?.length < 2 ? true : false}
      />
      <InfiniteListFull
        list={conversation.messages}
        paginate={throttledPaginate}
        canPaginate={conversation.canPaginate}
        reversed
      >
        {msg => (
          <BaseMessage
            message={msg}
            author={users[msg.authorId.toString()]}
            onDelete={deleteMessage}
            onEdit={(text) => editMessage(msg.id, text)}
          />
        )}
      </InfiniteListFull>

      <ChatInput allowMedia={true} onSubmit={sendMessage} />
    </div>
  );
};

export default Conversation;
