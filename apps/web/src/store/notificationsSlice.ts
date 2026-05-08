// // Copyright 2021 NewSocial Inc. - All Rights Reserved
// // Unauthorized copying of this file, via any medium is strictly prohibited
// // Proprietary and confidential
// // Author(s): See Git History

// /* eslint-disable @typescript-eslint/no-use-before-define */
export default {};

// import React from 'react';
// import { toast } from 'react-toastify';
// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// import { FireDB, paths } from 'api/firebase';
// import { notificationByType, setupSubscribeRecentNotifications } from 'api/notifications';
// import { CommunityNotificationDocument, NotificationDocument, PingTypes, WithId } from 'types/documents';

// import { RootState } from './store';

// const NAMESPACE = 'notifications';

// export type NotificationInfo = NotificationDocument & {
//   title: string; 
//   uid: string;
//   username: string;
//   image: string;
//   description: string;
// };

// //Global for subscribeRecentNotifications
// let unsubNotifcations = () => {};

// export const processNotificationsUpdate = createAsyncThunk(
//   `${NAMESPACE}/processNotificationsUpdate`,
//   async (updatedNotifications : Array<NotificationDocument>, thunkAPI) => {
//     let unreadTracker = false;
//     const translatedNotification = await Promise.all(updatedNotifications.map(async (notif) => {
//       let notifInfo = await notificationByType(notif);
//       if (notifInfo && !notifInfo.read) {
//         unreadTracker = true;
//       }
//       return notifInfo;
//     }));
//     await thunkAPI.dispatch(setUnreadIndicator(unreadTracker));
//     //Removed undefined returns (usually for 'don't show this notif')
//     const filterdNotifications = translatedNotification.filter((value) => value != undefined);
//     thunkAPI.dispatch(setRecentNotifications(filterdNotifications));
//   },
// );

// export const subscribeRecentNotifications = createAsyncThunk(
//   `${NAMESPACE}/subscribeRecentNotifications`,
//   async (_, thunkAPI) => {
//     const { user } = thunkAPI.getState() as RootState;
//     unsubNotifcations();
//     unsubNotifcations = await setupSubscribeRecentNotifications(
//       user.id, 
//       (update : NotificationDocument[]) => thunkAPI.dispatch(processNotificationsUpdate(update)),
//     );
//   },
// );

// export const getCommunityNotificationSettings = 
//   //Fulfilled Value, Payload, onRejection
//   createAsyncThunk<WithId<CommunityNotificationDocument>, undefined, { rejectValue: string }>(
//     `${NAMESPACE}/getCommunityNotificationSettings`,
//     async (_, thunkAPI) => {
//       const { community, user } = thunkAPI.getState() as RootState;
//       const notificationsTable = new FireDB<CommunityNotificationDocument>(paths.notification(user.id));
//       const data = await notificationsTable.getWithId(community.id);
//       if (data === null) {
//         return thunkAPI.rejectWithValue(community.id);
//       }
//       return data;
//     },
//   );

// export const updateCommunityNotificationSettings = 
//   createAsyncThunk<() => void, Partial<CommunityNotificationDocument>>(
//     `${NAMESPACE}/updateCommunityNotificationSettings`, async (payload, thunkAPI) => {
//     const { community, user } = thunkAPI.getState() as RootState;
//     const notifications = new FireDB<CommunityNotificationDocument>(paths.notification(user.id));
//     await notifications.updateDoc(community.id, payload);

//     return () => thunkAPI.dispatch(notificationsSlice.actions.clearToastId());
//   });

  
// type NotificationsState = {
//   recent: NotificationInfo[],
//   /** Show indicator for unread notifications */
//   unreadIndicator: boolean,
//   communities: {
//     [communityId: string]: WithId<CommunityNotificationDocument>;
//   };
//   /** Meta field for UX */
//   _updateToastId?: React.ReactText;
// };

// const initialState: NotificationsState = {
//   recent: [],
//   unreadIndicator: false,
//   communities: {},
//   _updateToastId: undefined,
// };

// const notificationsSlice = createSlice({
//   name: NAMESPACE,
//   initialState,
//   reducers: {
//     setUnreadIndicator: (state, { payload }) => {state.unreadIndicator = payload;},
//     clearToastId: (state) => state._updateToastId = undefined,
//     setRecentNotifications: (state, { payload }) => {state.recent = payload;},
//   },
//   extraReducers: builder => {
//     // Get
//     builder.addCase(getCommunityNotificationSettings.fulfilled, (state, { payload }) => {
//       state.communities[payload.id] = payload;
//     });
//     builder.addCase(getCommunityNotificationSettings.rejected, (state, { payload }) => {
//       // TODO not entirely sure if payload is meant to be potentially undefined.
//       if (payload) {
//         state.communities[payload] = {
//           id: payload,
//           muted: false,
//           ping_type: PingTypes.AllMessages,
//         };
//       }
//     });
//     // Update
//     builder.addCase(updateCommunityNotificationSettings.fulfilled, (state, { payload: clearToast }) => {
//       if (state._updateToastId === undefined) {
//         state._updateToastId = toast.success('Updated!', { onClose: clearToast });
//       } else {
//         toast.update(state._updateToastId);
//       }
//       // In case they fiddle with the messages, I don't want the user to have a wall of toasts.
//     });
//     builder.addCase(updateCommunityNotificationSettings.rejected, () => {
//       toast.error('Couldn\'t update notifications. Please try again later. :(');
//     });
//   },
// });

// export default notificationsSlice.reducer;
// export const { clearToastId, setRecentNotifications, setUnreadIndicator } = notificationsSlice.actions;
