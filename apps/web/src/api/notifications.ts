// // Copyright 2022 NewSocial Inc. - All Rights Reserved
// // Unauthorized copying of this file, via any medium is strictly prohibited
// // Proprietary and confidential
// // Author(s): See Git History

export default {};

// import { Timestamp } from '@google-cloud/firestore';
// import { limit, orderBy } from 'firebase/firestore';
// import { timeAgoStringAbbreviation } from 'utils/common_utils';

// import { NotificationInfo } from 'store/notificationsSlice';
// import { NotificationDocument, NotificationType } from 'types/documents';

// import { getDirectMessageByPath } from './DirectMessageAPI';
// import { FireDB, paths } from './firebase';
// import { getFollowByPath } from './follow';
// import { getPostByPath } from './PostAPI';
// import { getUserById } from './userAPI';


// export const notificationByType = async (notif : NotificationDocument) : Promise<NotificationInfo | undefined> => {
//   try {
//     switch (notif.type) {
//       /** New Follow */
//       case NotificationType.Follow:
//         let follow = await getFollowByPath(notif.ref.path);
//         const followUser = await getUserById(follow.uid);
//         const followTimeAgo = timeAgoStringAbbreviation((notif.timestamp as Timestamp).toDate());
//         if (!follow.follow) { // We don't want to be mean and tell someone they stopped
//           return undefined;
//         } else {
//           return {
//             ...notif,
//             uid: followUser?.id || '',
//             username: followUser?.username || '',
//             title: followUser?.display_name || 'New Follow',
//             image: followUser?.avatar || '',
//             description: `started following you. ${followTimeAgo}`,
//           };
//         }
//       /** New Direct Message */
//       case NotificationType.Direct:
//         let directMessage = await getDirectMessageByPath(notif.ref.path);
//         const directUser = await getUserById(directMessage.sender);
//         const directTimeAgo = timeAgoStringAbbreviation((notif.timestamp as Timestamp).toDate());
//         // const messageSnippet = '';//directMessage.text.slice(0, Math.min(directMessage.text.length, 18));
//         return {
//           ...notif,
//           uid: directUser?.id || '',
//           username: directUser?.username || '<Missing Username>',
//           title: directUser?.display_name || 'New Direct Message',
//           image: directUser?.avatar || '',
//           description: `direct messaged you. ${directTimeAgo}`,
//         };
//       /** New Post Mention */
//       case NotificationType.Post:
//         let post = await getPostByPath(notif.ref.path);
//         const postUser = await getUserById(post.sender);
//         const postTimeAgo = timeAgoStringAbbreviation((notif.timestamp as Timestamp).toDate());
//         const postSnippet = post.title.slice(0, Math.min(post.title.length, 18));
//         return {
//           ...notif,
//           uid: postUser?.id || '',
//           username: postUser?.username || '<Missing Username>',
//           title: postUser?.display_name || 'New Post Mention',
//           image: postUser?.avatar || '',
//           description: `mentioned you in post "${postSnippet}". ${postTimeAgo}`,
//         };

//       default:
//         return undefined;
//     }
//   } catch (error) {
//     console.error(error);
//     return undefined;
//   }
// };

// export const setupSubscribeRecentNotifications = async (uid: string, callback: (update: NotificationDocument[]) => void) => {
//   const notificationTable = new FireDB<NotificationDocument>(paths.notificationAll(uid));
//   return notificationTable.subscribeQuery(
//     [ 
//       orderBy('timestamp', 'desc'),
//       limit(20),
//     ],
//     callback,
//   );  
// };

// export const markNotificationRead = async (uid: string, id: string) => {
//   const notificationTable = new FireDB<NotificationDocument>(paths.notificationAll(uid));
//   return notificationTable.updateDoc(id, { read: true });
// };

