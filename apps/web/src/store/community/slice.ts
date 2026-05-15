// Unauthorized copying of this file, via any medium is strictly prohibited
// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Proprietary and confidential
// Author(s): See Git History

import { toast } from 'react-toastify';
import { Member, Permissions } from '@prisma/client';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MESSAGES_PER_FETCH } from '@src/lib/pagination';
import { sortByCreatedAt } from '@src/utils/sorting';

import ApiClient from 'lib/apiClient';
import { createThunk } from 'lib/createThunk';
import { getPower } from 'lib/role';
import { RootState } from 'store/store';
import { usersActions } from 'store/usersSlice';
import { NewChannelState } from 'types/channel';
import { Channel, Community, Message } from 'types/prisma';

import { ChannelV3Partial, CommunitySlice } from './types';


const NAMESPACE = 'spaces';

const joinCommunity = createAsyncThunk(
  `${NAMESPACE}/joinCommunity`,
  async (id: bigint) => {
    try {
      await ApiClient.Member.joinCommunity(id);
    } catch (error) {
      toast.error('Failed to load space');
      console.error(`Failed to load space with id: ${id}`);
    }
  },
);

const leaveCommunity = createAsyncThunk(
  `${NAMESPACE}/leaveCommunity`,
  async (_, thunkAPI) => {
    const { community: { selected, communities } } = thunkAPI.getState() as RootState;
    const communityId = communities[selected.community].id;
    const { data, status } = await ApiClient.Member.leaveCommunity(communityId);
    if (status === 200) return;
    thunkAPI.rejectWithValue(data);
  },
);


/** Get user communities and add them to the community map */
const getCommunities = createAsyncThunk(
  `${NAMESPACE}/getCommunities`,
  async (_, thunkAPI) => {
    const { data, status } = await ApiClient.Communities.getAll();
    if (status === 200) {      
      thunkAPI.dispatch(communityActions.upsertCommunities(data));
      // Dispatch users over there for re-use.
      const users = data.flatMap(com => com.members.map(m => m.user));
      thunkAPI.dispatch(usersActions.upsertUsers(users));
    }
  },
);

export type SendMessagePayload = { text: string, media: File };

const sendMessage = createThunk(
  `${NAMESPACE}/sendMessage`,
  async (payload: SendMessagePayload, thunkAPI) => {
    const { community: { selected: { channel, community } } } = thunkAPI.getState();
    const { data, status } = await ApiClient.Messages.send(channel, {
      communityId: community,
      text: payload.text,
      // media: payload.media, //TODO media
    });
    if (status === 200) {
      thunkAPI.dispatch(communityActions.insertMessages([data]));
    }
  },
);

const editMessage = createThunk(
  `${NAMESPACE}/editMessage`,
  async (payload: { uuid: string; text: string }, thunkAPI) => {
    const { data, status } = await ApiClient.Messages.edit(payload.uuid, {
      text: payload.text,
    });
    if (status === 200) {
      thunkAPI.dispatch(communityActions.updateMessage(data));
    }
  },
);

const deleteMessage = createThunk(
  `${NAMESPACE}/deleteMessage`,
  async (uuid: string, thunkAPI) => {
    const { status } = await ApiClient.Messages.delete(uuid);
    if (status === 200) {
      thunkAPI.dispatch(communityActions.removeMessage(uuid));
    }
  },
);

const getMessages = createAsyncThunk(
  `${NAMESPACE}/getMessages`,
  async (_, thunkAPI) => {
    try {
      const { community: { communities, selected } } = thunkAPI.getState() as RootState;
      const channel = communities[selected.community].channels[selected.channel];

      const { data, status } = await ApiClient.Messages.paginate(BigInt(channel.id), channel.lastId);
      if (status === 200) {
        const users = data.map(msg => msg.author);
        // Add authors(users) to cache, needed for displaying the messages
        thunkAPI.dispatch(usersActions.upsertUsers(users));
        thunkAPI.dispatch(communityActions.insertMessages(data));
      }
    } catch (error) {
      console.error('getMessages', error);
    }
  },
);

const changeChannel = createAsyncThunk(
  `${NAMESPACE}/changeChannel`,
  async (channelUuid: string, thunkAPI) => {
    try {
      thunkAPI.dispatch(communityActions.changeSelectedChannel(channelUuid)); // GetMessages relies on current.channel
      thunkAPI.dispatch(communityThunks.getMessages());
    } catch (error) {
      toast.error('Failed to load channel');
      console.error(`Failed to load channel { uuid: ${channelUuid} }`, error);
    }
  },
);

const changeCommunity = createAsyncThunk(
  `${NAMESPACE}/changeCommunity`,
  async (communityUuid: string, thunkAPI) => {
    thunkAPI.dispatch(communityActions.changeSelectedCommunity(communityUuid));
  },
);

// Moved to communities hook
// const createChannel = createAsyncThunk(
//   `${NAMESPACE}/createChannel`,
//   async (payload: NewChannelState, { getState, dispatch }) => {
//     const { community: { selected: { community }, communities } } = getState() as RootState;
//     const id = communities[community].id;
//     const { status, data } = await ApiClient.Communities.createChannel(id, payload);
//     if (status === 200) {
//       dispatch(communityActions.addChannel(data));
//     }
//   },
// );

// Moved to useMembership
// const updateMember = createAsyncThunk(
//   `${NAMESPACE}/updateMember`, 
//   async (payload: { uuid: string, role: Permissions }) => {
//     axios
//     console.log(payload.uuid, payload.role);
    
//   },
// );

function arrayToMap<I>(array: I[], key: string = 'uuid'): Record<string, I> {
  const map = {};
  for (const item of array) {
    map[item[key]] = item;
  }
  return map;
}

const membersSort = (a: Member, b: Member) => getPower(b.role) - getPower(a.role);

const initialState: CommunitySlice = {
  noFriends: false,
  communities: {},
  communityOrder: [],
  featured: null,
  selected: {
    channel: null,
    community: null,
  },
};

const initialChannelState: ChannelV3Partial = {
  messages: [],
  // FIXME 
  messageMap: {},
  canPaginate: true,
};

const communitySlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    upsertCommunities(state, { payload }: PayloadAction<Community[]>) {
      if (payload.length === 0) {
        console.error('Attempted to upsert empty array of communities. Did a request fail?');
        state.noFriends = Object.values(state.communities).length === 0;
        return;
      }
      for (const space of payload) {
        const channelsWithMessages = space.channels.map(ch => ({ ...ch, ...initialChannelState }));
        // TODO channelOrder & communityOrder need to come from DB
        state.communities[space.uuid] = {
          ...space,
          // @ts-ignore writableDraft bug
          channels: arrayToMap(channelsWithMessages),
          channelOrder: space.channels?.map(ch => ch.uuid),
          memberOrder: space.members?.sort(membersSort).map(m => m.uuid),
          // @ts-ignore writableDraft bug
          members: arrayToMap(space.members),
        };
        if (state.communityOrder.indexOf(space.uuid) === -1) {
          state.communityOrder.push(space.uuid);
        }
      }

      state.noFriends = Object.values(state.communities).length === 0;

      const firstCommunity = payload[0].uuid;
      const firstChannel = payload[0].channels[0]?.uuid;

      state.selected.community = state.communities[firstCommunity]?.uuid;
      state.featured = state.communities[firstCommunity]?.uuid;
      if (firstChannel)
        state.selected.channel = state.communities[firstCommunity].channels[firstChannel].uuid;    
    },
    changeSelectedCommunity: (state, { payload: uuid }: PayloadAction<string>) => {
      
      state.selected.community = uuid;
      state.selected.channel = Object.values(state.communities[uuid]?.channels)[0]?.uuid;
    },
    changeSelectedChannel(state, { payload: uuid }: PayloadAction<string>) {
      state.selected.channel = uuid;
    },
    insertMessages(state, { payload }: PayloadAction<Message[]>) {
      const { community, channel: channelId } = state.selected;
      const channel = state.communities[community].channels[channelId];
      if (payload.length === 0) {
        channel.canPaginate = false;
        return;
      }

      payload.forEach(msg => channel.messageMap[msg.uuid] = msg);
      channel.messages = Object.values(channel.messageMap).sort(sortByCreatedAt());

      // If we have less than what we expected, then we've reached the beginning.
      if (payload.length < MESSAGES_PER_FETCH) {
        channel.canPaginate = false;
      }
      channel.lastId = payload[payload.length - 1].id;
    },
    removeMessage(state, { payload: uuid }: PayloadAction<string>) {
      const { community, channel: channelId } = state.selected;
      const channel = state.communities[community]?.channels[channelId];
      if (!channel) return;
      delete channel.messageMap[uuid];
      channel.messages = channel.messages.filter((m) => m.uuid !== uuid);
    },
    updateMessage(state, { payload }: PayloadAction<Message>) {
      const { community, channel: channelId } = state.selected;
      const channel = state.communities[community]?.channels[channelId];
      if (!channel || !channel.messageMap[payload.uuid]) return;
      channel.messageMap[payload.uuid] = payload;
      channel.messages = Object.values(channel.messageMap).sort(sortByCreatedAt());
    },
    deleteCommunity(state, { payload: uuid }: PayloadAction<string>) {
      delete state.communities[uuid];
      if (state.selected.community === uuid) {
        state.selected.community = state.communities[0].uuid;
      }
    },
    addChannel(state, { payload }: PayloadAction<Channel>) {
      const community = state.communities[state.selected.community];
      community.channels[payload.uuid] = {
        ...payload,
        ...initialChannelState,
      };
      community.channelOrder.push(payload.uuid);
    },
  },
});

export default communitySlice.reducer;

// Split these out for easier transition to using hooks over thunks
export const communityActions = communitySlice.actions;
export const communityThunks = {
  joinCommunity,
  leaveCommunity,

  getCommunities,
  changeChannel,
  changeCommunity,

  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
};

/** @deprecated for vague naming. Use communityActions & communityThunks instead */
export const actions = {
  ...communityActions,
  ...communityThunks,
};
