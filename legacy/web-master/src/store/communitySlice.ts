/* eslint-disable @typescript-eslint/no-use-before-define */
// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Redux User Slice (Redux store)

import { toast } from 'react-toastify';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { push } from 'connected-react-router';
import { Timestamp } from 'firebase/firestore';

import { createNewPrice, updatePrice } from 'api/billing';
import {
  communityTable,
  CommunityUnion,
  getCommunityById,
  getMapofMembers,
  getMemoizedMedia,
  getUserRole,
  MessageUnion,
  subChannelMessages,
  subscribeChannelsAsync,
} from 'api/communityAPI';
import { FireDB, paths } from 'api/firebase';
import { UserTable } from 'api/userAPI';
import { APP } from 'pages';
import {
  ChannelDocument,
  Collections,
  CommunityDocument,
  MemberDocument,
  PermissionsType,
  TierDocument,
  UserDocument,
  WithId,
} from 'shared/types/documents';
import { NewChannelFields, NewChannelState } from 'types/channel';

import { toggleCommunitySettingsModal, toggleCreateChannelModal, toggleEditChannelModal } from './appSlice';
import { RootState } from './store';
import { refreshMemberships, updateMemberships, User } from './userSlice';

const NAMESPACE = 'community';

export const fetchMembers = createAsyncThunk(
  `${NAMESPACE}/fetchMembers`,
  async (_, thunkAPI) => {
    const { community } = thunkAPI.getState() as RootState;
    // Get community members
    const memberTable = new FireDB<MemberDocument>(paths.communityMembers(community.id));
    const userTable = new FireDB<UserDocument>(Collections.Users);
    const members = await memberTable.join<MemberUnion>(async (member) => {
      // Get member's user docs
      const user = await userTable.get(member.uid);
      if (user) {
        return {
          user: {
            ...user,
            avatar: user?.profile_image
              ? await getMemoizedMedia(user?.profile_image)
              : undefined,
          },
          ...member,
        };
      }
    });

    return members;
  },
);

export const changeChannel = createAsyncThunk(
  `${NAMESPACE}/changeChannel`,
  async (channelIndex : number, thunkAPI) => {
    const { user, community } = thunkAPI.getState() as RootState;
    thunkAPI.dispatch(clearMessages());
    if (user.id && community.id &&  community.channels[channelIndex]?.id) {
      console.log('subbing');
      subChannelMessages(
        user.id, community.id, community.channels[channelIndex]?.id,
        (messages) => thunkAPI.dispatch(setChannel({ messages, channelIndex })),
      );
    } else {
      toast.error('Error fetching room messages');
    }
  },
);

// FIXME this entire thunk needs to die. Its the cause of many issues.
// It should be split up into different sub functions to handle the different scenarios.
export const changeCommunity = createAsyncThunk(
  `${NAMESPACE}/changeCommunity`,
  async (communityId : string, thunkApi) => {
    try {
      thunkApi.dispatch(clearMessages());
      const community = await getCommunityById(communityId);
      const owner = community?.owner_id
        ? await UserTable.get(community?.owner_id)
        : undefined;
      const channels = await subscribeChannelsAsync(communityId);
      const members = await getMapofMembers(communityId);
      let channelIndex: number = 0;
      if (channels.length >= 1 && owner?.id && community?.id && channels[0]?.id) {
        // Using a then here instead of await to defer the loading of the messages.
        // *Should*, result in a better experience for the user
        // if swapping back to community from another page
        const { community: currentCommunity } = thunkApi.getState() as RootState;
        if (currentCommunity.id === community.id) {
          channelIndex = currentCommunity.activeChannelIndex;
          subChannelMessages(
            owner.id, community.id, channels[channelIndex]?.id,
            messages => thunkApi.dispatch(setChannel({ messages, channelIndex })),
          );
        } else {
          channelIndex = community.channel_order ? community.channels.findIndex((chan) => chan.id === community.channel_order?.at(0)) : 0;
          subChannelMessages(
            owner.id, community.id, channels[channelIndex]?.id,
            messages => thunkApi.dispatch(setChannel({ messages, channelIndex: channelIndex })),
          );
        }
      }
      return { community, channels, owner, members, channelIndex };
    } catch (error: any) {
      toast.error('There was a problem switching to that community. Try refreshing the page.', {
        // Long text, lets give the user 10 seconds to read it.
        autoClose: 10000,
      });
      thunkApi.rejectWithValue(error);
    }
  },
);

export const deleteChannel = createAsyncThunk(
  `${NAMESPACE}/deleteChannel`,
  async (_, thunkAPI) => {
    const { community } = thunkAPI.getState() as RootState;
    const channelTable = new FireDB<ChannelDocument>(paths.channel(community.id));
    const channel = community.channels[community.activeChannelIndex];
    await channelTable.deleteDoc(channel.id);
    thunkAPI.dispatch(toggleEditChannelModal());
    return community.activeChannelIndex;
  },
);

export const refreshChannels = createAsyncThunk(
  `${NAMESPACE}/fetchCommunity`,
  // Payload has been deprecated
  async (_: string, thunkAPI) => {
    const { community: oldCommunity } = thunkAPI.getState() as RootState;
    const community = await getCommunityById(oldCommunity.id);
    if (community) {
      return community.channels;
    }
  },
);

/**
 * Makes the member a community of a community,
 * if they aren't already in which case it just jumps to it
 */
export const joinCommunity = createAsyncThunk<void, string>(
  `${NAMESPACE}/joinCommunity`,
  async (communityId, thunkAPI) => {
    const { user } = thunkAPI.getState() as RootState;
    // Refetch membership
    const role = await getUserRole(communityId, user.id);
    if (role < PermissionsType.Members) {
      // Jump to community
      const memberTable = new FireDB<MemberDocument>(paths.communityMembers(communityId));
      const memberDoc : MemberDocument = {
        uid: user.id,
        last_update: Timestamp.now(),
        role: PermissionsType.Members,
        tier: 0,
      };
      memberTable.setDoc(memberDoc, user.id);

      // FUF firebase is slow, so we'll add the membership to the user state too to make UI snappier
      await thunkAPI.dispatch(updateMemberships({
        ...memberDoc,
        id: communityId,
      }));
    }

    // Jump to community
    await thunkAPI.dispatch(changeCommunity(communityId));
    thunkAPI.dispatch(push(APP.COMMUNITY.INDEX));
  },
);

type UpdateCommunityPayload = {
  id: string;
  state: Partial<CommunityDocument>
};

export const updateCommunity = createAsyncThunk(
  `${NAMESPACE}/updateCommunity`,
  async ({ id, state }: UpdateCommunityPayload, thunkAPI) => {
    await communityTable.updateDoc(id, state);
    await thunkAPI.dispatch(changeCommunity(id));
  },
);

export const fetchTiers = createAsyncThunk(
  `${NAMESPACE}/fetchTiers`,
  async (payload, thunkAPI) => {
    const { community } = thunkAPI.getState() as RootState;
    const tierTable = new FireDB<TierDocument>(paths.premiumTiers(community.id));
    const tiers = await tierTable.getAllWithId();
    return tiers;
  },
);

export const createTier = createAsyncThunk(
  `${NAMESPACE}/createTier`,
  async (tier: TierDocument, thunkAPI) => {
    const { community } = thunkAPI.getState() as RootState;
    const tierTable = new FireDB<TierDocument>(paths.premiumTiers(community.id));
    const doc = await tierTable.addDoc(tier);
    await thunkAPI.dispatch(fetchTiers());
    await createNewPrice(tier.price, community.id, doc.id).catch((e) => {throw e;});
  },
);

/** Updating anything but the price */
export const updateTier = createAsyncThunk(
  `${NAMESPACE}/updateTiers`,
  async (tier: WithId<TierDocument>, thunkAPI) => {
    const { community } = thunkAPI.getState() as RootState;
    const tierTable = new FireDB<TierDocument>(paths.premiumTiers(community.id));
    await tierTable.updateDoc(tier.id, tier);
  },
);

/** Updating everything on the tier. Use this only if the price changes */
export const updateTierPrice = createAsyncThunk(
  `${NAMESPACE}/updateTiers`,
  async (tier: WithId<TierDocument>, thunkAPI) => {
    const { community } = thunkAPI.getState() as RootState;
    const tierTable = new FireDB<TierDocument>(paths.premiumTiers(community.id));
    await tierTable.updateDoc(tier.id, tier);
    await updatePrice(tier.price, community.id, tier.id).catch((e) => {throw e;});
  },
);

const CHANNEL_DEFAULTS = {
  profile: false,
  mod_list: [],
  id: '',
};

export const createChannel = createAsyncThunk<void, NewChannelState>(
  `${NAMESPACE}/createChannel`,
  async (formState, thunkAPI) => {
    const { community } = thunkAPI.getState() as RootState;
    const channelTable = new FireDB<ChannelDocument>(paths.channel(community.id));
    const newChannel : ChannelDocument = {
      type: formState[NewChannelFields.Type],
      name: formState[NewChannelFields.Name],
      description: formState[NewChannelFields.Description],
      access: formState[NewChannelFields.Access],
      permissions: formState[NewChannelFields.Post],
      ...CHANNEL_DEFAULTS,
      owner_id: community.id,
    };
    await channelTable.addDoc(newChannel, true);
    toast.info('Room Created.');
    thunkAPI.dispatch(toggleCreateChannelModal(false));
    thunkAPI.dispatch(refreshChannels(community.id));
  },
);

export const updateChannel = createAsyncThunk<void, NewChannelState>(
  `${NAMESPACE}/updateChannel`,
  async (formState, thunkAPI) => {
    const { community } = thunkAPI.getState() as RootState;
    if (formState.id) {
      const channelTable = new FireDB<Partial<ChannelDocument>>(paths.channel(community.id));
      const updatedChannel : Partial<ChannelDocument> = {
        type: formState[NewChannelFields.Type],
        name: formState[NewChannelFields.Name],
        description: formState[NewChannelFields.Description],
        access: formState[NewChannelFields.Access],
        permissions: formState[NewChannelFields.Post],
      };
      await channelTable.updateDoc(formState.id, updatedChannel);
      toast.info('Channel Updated.');
      thunkAPI.dispatch(toggleEditChannelModal());
      thunkAPI.dispatch(refreshChannels(community.id));
    }
  },
);

const LEAVE_TOAST_ID = `${NAMESPACE}/leaveCommunity`;

export const leaveCommunity = createAsyncThunk(
  `${NAMESPACE}/leaveCommunity`,
  async (_, thunkAPI) => {
    const { community, user } = thunkAPI.getState() as RootState;
    const membershipTable = new FireDB<MemberDocument>(paths.communityMembers(community.id));
    await membershipTable.deleteDoc(user.id);
    // Firebase updating userMemberships automatically is too slow
    // With a real db, this would be a transactional process and this timeout would not be necessary
    toast.loading(`Leaving ${community.name}`, { toastId: LEAVE_TOAST_ID });
    window.setTimeout(async () => {
      const memberships = await thunkAPI.dispatch(refreshMemberships()).unwrap();
      await thunkAPI.dispatch(changeCommunity((memberships[0] || user).id));
      thunkAPI.dispatch(toggleCommunitySettingsModal());
      toast.update(LEAVE_TOAST_ID, {
        render: `You've left ${community.name}`,
        type: toast.TYPE.SUCCESS,
        isLoading: false,
        autoClose: 5000,
      });
    }, 2000);
  },
);

type UpdateMemberPayload = {
  id: string;
  role: PermissionsType;
};

export const updateMember = createAsyncThunk<void, UpdateMemberPayload>(
  `${NAMESPACE}/updateMember`,
  async ({ id, role }, thunkAPI) => {
    const { community } = thunkAPI.getState() as RootState;
    const memberTable = new FireDB<MemberDocument>(paths.communityMembers(community.id));
    await memberTable.updateDoc(id, { role });
  },
);

export type MemberUnion = MemberDocument & {
  user: User;
};

type CommunityState = CommunityUnion & {
  activeChannelIndex : number
  // Used for when editing premium tiers on a community
  premium_tiers?: WithId<TierDocument>[]
  members?: MemberUnion[];
  channel_messages?: MessageUnion[];
  owner_name?: string;
};

const initialState: CommunityState = {
  id: '',
  name: '',
  description: '',
  channels: [],
  image: '',
  owner_id: '',
  message_count: 0,
  activeChannelIndex: -1,
};

export const communitySlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    setChannel(state, { payload }: PayloadAction<{ messages: any[]; channelIndex: number; }>) {
      state.channel_messages = payload.messages;
      state.activeChannelIndex = payload.channelIndex;
    },
    /** @deprecated updating just the messages will cause inconsistencies */
    setChannelMessages: (state, action) => {
      state.channel_messages = action.payload;
    },
    clearMessages(state) {
      state.channel_messages = [];
    },
    updateChannels: (state, action) => {
      state.channels = action.payload;
    },
    /** Clear all data relating to community settings modal */
    clearCommunitySettings(state) {
      delete state.members;
      delete state.premium_tiers;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(changeCommunity.fulfilled, (state, action) => {
      if (action.payload) {
        const { community, channels, owner, channelIndex } = action.payload;
        if (community) {
          // Just refreshing
          if (state.id === community.id) {
            return {
              ...state,
              ...community,
              ...channels,
              owner_name: owner?.username,
            };

          } else { // Changing community
            // const tempActiveChannel = community.channel_order ? community.channels.findIndex((chan) => chan.id == community.channel_order?.at(0)) : 0;
            return {
              ...state,
              ...community,
              ...channels,
              activeChannelIndex: channelIndex, // Changed from 0 to -1 due to some buggy behaviour with showing a channel by default
              owner_name: owner?.username,
            };
          }
        }
        // Why is this below the return? 🤷🏻‍♂️ - I tried moving it up, breaks the app. Just leave it for now
        if (channels) {
          state.channels = channels;
        }
      }
    });
    builder.addCase(updateCommunity.fulfilled, () => {
      toast.success('Community Change Saved.');
    });
    builder.addCase(updateCommunity.rejected, (_, { error }) => {
      toast.error('Something went wrong :/');
      console.error(error);
    });
    builder.addCase(refreshChannels.fulfilled, (state, { payload }) => {
      if (payload) {
        // if someone deletes/adds a channel while this is happening, worst case is the channel focus shifts.
        // No out of indexes should happen anywhere else in the app.
        const maxIndex = payload.length - 1;
        state.activeChannelIndex = state.activeChannelIndex < maxIndex
          ? state.activeChannelIndex
          : 0;
        state.channels = payload;
      }
    });
    builder.addCase(fetchTiers.fulfilled, (state, { payload }) => {
      state.premium_tiers = payload;
    });
    builder.addCase(createTier.fulfilled, () => {
      toast.success('Tier Created!');
    });
    builder.addCase(updateTier.fulfilled, () => {
      toast.success('Tier Saved!');
    });
    // builder.addCase(deleteTier.fulfilled, () => {
    //   toast.success('Tier Saved!');
    // });
    builder.addCase(updateTier.rejected, (_, { error }) => {
      toast.error('Something went wrong :/');
      console.error(error);
    });
    builder.addCase(fetchMembers.fulfilled, (state, { payload }) => {
      state.members = payload;
    });
    builder.addCase(updateMember.fulfilled, () => {
      toast('Updated member');
    });
    builder.addCase(deleteChannel.fulfilled, (state, { payload }) => {
      state.channels = state.channels.filter((_, index) => payload !== index);
      toast('Room Deleted.');
    });
    builder.addCase(deleteChannel.rejected, () => {
      toast.error('Could not delete room at this time.');
    });
  },
});

// Action creators are generated for each case reducer function
export const {
  updateChannels,
  clearCommunitySettings,
  clearMessages,
  setChannel,
} = communitySlice.actions;

export default communitySlice.reducer;


export const selectCurrentCommunity = (state: RootState) => state.community;
export const selectCurrentChannelIndex = (state: RootState) => state.community.activeChannelIndex;
export const selectOwner = (state: RootState) => ({
  id: state.community.owner_id,
  name: state.community.owner_name,
});