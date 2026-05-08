// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getMoreMessages, MessageUnion } from 'api/communityAPI';
import MessageList from 'components/MessageList';
import { useRegisterModal } from 'lib/Modal';
import { Confirm } from 'lib/Modal/layouts';
import { PermissionsType } from 'shared/types/documents';
import { updateMember } from 'store/communitySlice';
import { selectActiveChannel } from 'store/selectors';
import { RootState } from 'store/store';
import { ChannelTypeProperties, Views } from 'types/channel';
import { BanModalProps, Modals } from 'util/constants';

import { Container } from './styled';

/** A container for MessageList */
const ChannelMessages: React.FC<any> = () => {
  const dispatch = useDispatch();
  const community = useSelector((state: RootState) => state.community);
  const channel = useSelector(selectActiveChannel);
  const [loadMoreMessages, setLoadMoreMessages] = useState<Array<MessageUnion>>([]);
  const channelMessages = useSelector((state: RootState) => state.community.channel_messages);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const increments : number = 20;
    if (channel && channelMessages) {
      const lastMessage = loadMoreMessages[loadMoreMessages.length - 1] || channelMessages[channelMessages.length - 1];
      //FIXME add this clusterfuck to redux gfd
      const result = await getMoreMessages(lastMessage, community, channel, loadMoreMessages.length + increments || increments);

      if (result?.length > 0 && result?.length > loadMoreMessages.length) {
        setLoadMoreMessages(result);
      }
      if (result?.length % increments != 0) {
        console.log('No more to fetch');
        setHasMore(false);
      }
    }
  };

  //  TODO move this to channelMessage or something
  const BanModal = useRegisterModal<BanModalProps>(Modals.BanModal);

  return (
    <>
      <BanModal>
        <Confirm
          question={`Proceed with banning ${BanModal.props?.username}?`}
          onCancel={BanModal.close}
          onConfirm={() => {
            BanModal.close();
            if (BanModal.props?.id) {
              dispatch(updateMember({ id: BanModal.props?.id, role: PermissionsType.Banned }));
            }
            console.log('banned: ', BanModal.props);
          }}
        />
      </BanModal>
      <Container>
        <MessageList
          messages={channelMessages || []}
          initialPosition={'bottom'}
          hasMore={hasMore}
          loadMore={loadMore}
          loadMoreMessages={loadMoreMessages}
          showDateChange
          grid={channel?.type && ChannelTypeProperties[channel?.type].view === Views.Grid}
        />
      </Container>
    </>
  );
};
export default ChannelMessages;
