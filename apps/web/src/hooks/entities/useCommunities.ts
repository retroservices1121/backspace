// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ChannelType, Permissions } from '@prisma/client';
import { ChannelCreateRequest } from '@src/pages/api/channel';
import {
  selectCommunityMembers,
  selectCommunityOrder,
  selectCurrentChannel,
  selectCurrentCommunity,
  selectOwner,
  selectRole,
  selectSortedChannels,
} from '@src/store/community/selectors';
import { CreateChannelBody } from '@src/types/requests/community';
import copy from 'copy-to-clipboard';

import { useAxios } from 'hooks/useAxios';
import { toggleModal, useModal } from 'lib/Modal';
import routes from 'routes';
import { communityThunks } from 'store/community/slice';
import { RootState, useAppDispatch } from 'store/store';
import { NewChannelState } from 'types/channel';
import { Modals } from 'utils/constants';


/** Access properties and methods of the selected community */
export default function useCommunity() {
  const community = useSelector(selectCurrentCommunity);
  const channel = useSelector(selectCurrentChannel);
  const channels = useSelector(selectSortedChannels);
  const axios = useAxios();
  const role = useSelector(selectRole);
  const owner = useSelector(selectOwner);
  // const featured = useSelector(selectFeatured);
  const communityOrder = useSelector(selectCommunityOrder);
  const createChannelModal = useModal(Modals.CreateChannel);
  const editChannelModal = useModal(Modals.EditChannel);
  const dispatch = useAppDispatch();
  const openSettings = () => dispatch(toggleModal(Modals.CommunitySettings, true));
  const openCreateChannel = () => dispatch(toggleModal(Modals.CreateChannel, true));
  const openEditChannel = () => dispatch(toggleModal(Modals.CreateChannel, true));
  const init = () => dispatch(communityThunks.getCommunities());
  const changeCommunity = (id: string) => dispatch(communityThunks.changeCommunity(id));
  const changeChannel = (id: string) => dispatch(communityThunks.changeChannel(id));
  const createChannel = async (form: NewChannelState) => {


    const updateChannel : ChannelCreateRequest = {
      communityId: community.id,
      channel: {
        type: form.type || ChannelType.CHAT,
        name: form.name || `[${form.type || 'Unnamed'} Room]`,
        description: form.description || '',
        readPermission: form.readPermission || Permissions.MODERATOR,
        writePermission: form.writePermission || Permissions.MODERATOR,
        community: {
          connect: {
            id: community.id,
          },
        },
      },
      
    };
    createChannelModal.close();
    editChannelModal.close();

    if (form.id) { //Edit
      const toastId = toast.loading('Updating room');
      const result = await axios.put(`/channel/${form.id}`, updateChannel);
      if (result) {
        toast.update(toastId, {
          render: `Successfully editted room ${result.data?.name}`,
          type: 'success',
          isLoading: false,
          autoClose: 5000,
        });
      } else {
        toast.update(toastId, {
          render: 'Failed to edit room',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      }
    } else { //Create
      const toastId = toast.loading('Creating new room');
      const result = await axios.post('/channel', updateChannel);
      if (result) {
        toast.update(toastId, {
          render: `Successfully created room ${result.data?.name}`,
          type: 'success',
          isLoading: false,
          autoClose: 5000,
        });
      } else {
        toast.update(toastId, {
          render: 'Failed to create room',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  };
  
  const members = useSelector(selectCommunityMembers);

  // Poorly named for comic purposes because I'm p tired, but we gotta implement this better.
  const noFriends = useSelector((s: RootState) => s.community.noFriends);

  return {
    noFriends,
    communityOrder,
    featured: null,
    // Everything inside current will change depending on certain conditions.
    current: {
      // These changes when user changes selected community
      community,
      channels,
      role,
      owner,
      // These changes when user changes selected channel
      channel,
      members,
    },
    // All methods should be placed in here to avoid.
    run: {
      init,
      changeCommunity,
      changeChannel,
      // Modals
      openSettings,
      openCreateChannel,
      openEditChannel,
      createChannel,
    },
  };
}

export function shareCommunity(username: string) {
  copy(window.location.origin + routes.fe.spaceTo({ username }));
  toast.success('Copied to clipboard.', {
    // This way its closer to the button, which might be more noticeable
    position: 'top-left',
    toastId: 'copy-community-link',
  });
}
