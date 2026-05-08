/* eslint-disable @typescript-eslint/naming-convention */
// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { 
  AccessCode,
  ChannelDocument, ChannelMessageDocument, ChannelType, Collections, CommunityDocument, ConversationDocument, 
  DirectMessageDocument, FollowDocument, LikeDocument, MediaType, MemberDocument, MessageDocument, MessageType, NotificationDocument, NotificationType, OnlinePresence, PermissionsType, PostDocument, PrivateUserDocument, SubscribeDocument, TierDocument, UserDocument, WithId, 
} from '../../src/shared/types/documents';
import { CreateAccountLink, CreateNewStripeCustomer, CreateNewStripeAccount, GetPaymentMethods, AttachPaymentMethod, getStripeAccount, getLoginLink, createPriceAndProduct, createStripePrice, disableStripePrice, removeStripeProduct, createStripeSubscription, removeStripeSubscription, setDefaultSource, detachPaymentMethod, getAllSubscriptions } from './stripe';
import Stripe from 'stripe';
import { stripe } from './stripe';
import { sendPushNotification } from './expo';
import { findMentions } from './mention';
import sendWelcome from './sendgrid';
import { StripeCountries } from '../../src/types/stripeAccount';

import { isAdmin } from '../../src/shared/common_utils';


// Required before interacting with the admin functions
admin.initializeApp();

/*
 *  Function:       CreateNewUser
 *  Description:    On an new user auth event, creates all the database objects
 *  Trigger:        Triggers on a new auth user
 *  Input:          NA
 *  Output:         NA
 *
 *  Notes:          
*/
export const CreateNewUser = functions
  .runWith({ secrets: ['SENDGRID_API_KEY'] })
  .auth.user().onCreate((user) => {

    const db = admin.firestore(); //Default database agent
    const FieldValue = admin.firestore.FieldValue; //Access in-built fileds such as timestamp
    let defaultCommunity = user.uid; //Channel that user's self content will post to
    let timeStamp = FieldValue.serverTimestamp();

    const newUser : UserDocument = {
      id: user.uid,
      username: '',
      featured: {
        community: defaultCommunity,
        channel: defaultCommunity,
      },
      last_signin: timeStamp,
      creation: timeStamp,
      follower_count: 0,
      subscriber_count: 0,
      profile_image:'',
      banner_image:'',
      onboarded: false,
    };

    const newPrivateUser : PrivateUserDocument = {
      uid: user.uid,
      email: user.email,
      email_verified: user.emailVerified,
      phone_number: user.phoneNumber,
    };

    const newCommunity : CommunityDocument = {
      id: defaultCommunity,
      name: 'My Space',
      description: '',
      owner_id: user.uid,
    };

    const newChannel : ChannelDocument = {
      profile: true,
      id: defaultCommunity, // Will be defined immediately following channel creation
      name: 'Profile',
      description: 'Any content you post here will be shown publically. This channel sets your public brand.',
      owner_id: user.uid,
      access: PermissionsType.Anyone,
      permissions: PermissionsType.Moderators,
      type: ChannelType.Post,
    };

    const newMember : MemberDocument = {
      uid: user.uid,
      role: PermissionsType.Admin,
      tier: 0,
      last_update: FieldValue.serverTimestamp(),
    };
  
    const welcomeDM : DirectMessageDocument = {
      sender: 'p8oSiI8aMXRQ3qh6yhflTAPXSjB2', //Faiz on prod
      recipient: user.uid,
      //@ts-expect-error
      timestamp: timeStamp,
      text: '[{"type":"paragraph","children":[{"text":"Hey I’m Faiz, the founder of Backspace 👋"}]},{"type":"paragraph","children":[{"text":"Just wanted to check in and say hello."}]},{"type":"paragraph","children":[{"text":"Let me know if you have any questions or concerns 🙌"}]},{"type":"paragraph","children":[{"text":""}]}]',
      media: '',
      media_type: MediaType.None,
    };

    //Create user document
    let createUser = db.collection(Collections.Users)
      .doc(user.uid)
      .set(newUser, { merge: false })
      .then(() => {
        return db.collection(Collections.Users).doc(user.uid).collection(Collections.Memberships).doc(defaultCommunity)
          .set(newMember);
      })
      .catch((error) => console.log(error));

    //Create private document
    let createPrivateUser = db.collection(Collections.UsersPrivate)
      .doc(user.uid)
      .set(newPrivateUser, { merge: false })
      .catch((error) => console.log(error));

    // Create default community
    let createCommunity = db.collection(Collections.Communities).doc(user.uid)
      .set(newCommunity, { merge: true })
      .then(() => {
        return db.collection(Collections.Communities).doc(defaultCommunity).collection(Collections.Members).doc(user.uid)
          .set(newMember);
      })
      .catch((error) => console.log(error));

    //Create main user channel
    let createDefaultChannel = db.collection(Collections.Communities).doc(user.uid).collection(Collections.Channels).doc(defaultCommunity)
      .set(newChannel, { merge: true })
      .catch((error) => console.log(error));

    let welcome;
    if (user.email) welcome = sendWelcome(user.email);
    else console.warn('Not sending welcome email');

    /** 
   * Wait for all promises to return before exiting. This is a nice to have and not mandatory.
   * Put any follow-on actions here with a .then
   */
    return Promise.all([createUser, createPrivateUser, createCommunity, createDefaultChannel, welcome])
      .then(() =>  {
        console.log('Creating Stripe Account');
        if (user.email) return CreateNewStripeCustomer(user.uid, user.email);
        else return;
      })
      .then(() => {
        console.log('sending welcome DM');
        return db.collection(Collections.DirectMessageQueue).add(welcomeDM);
      });

  });

// Note: THIS IS A REALTIME DATABASE LISTENER
export const SyncConnectionStatus = functions.database.ref('/users/{userId}/onlineStatus')
  .onWrite((change, context) => {
    const db = admin.firestore(); //Default database agent
    const FieldValue = admin.firestore.FieldValue; //Access in-built fileds such as timestamp
    const timeStamp = FieldValue.serverTimestamp();

    let uid = context.params.userId;
    const value = change.after.val() as OnlinePresence;

    const userUpdate : Partial<UserDocument> = {
      online: value,
      online_last_update: timeStamp,
    };

    // Only update on change
    if (value === change.before.val()) return false;

    //Write to status collection
    const statusRef = db.collection(Collections.Status).doc(uid);
    statusRef.set(userUpdate, { merge: true });
  
    //Write to user
    const docRef = db.collection(Collections.Users).doc(uid);
    return docRef.update(userUpdate);
  });

export const SyncMembershipToUser = functions.firestore.document(`${Collections.Communities}/{communityId}/${Collections.Members}/{userId}`)
  .onWrite(async (change, context) => {
    const db = admin.firestore(); //Default database agent
    const userId = context.params.userId;
    const communityId = context.params.communityId;
  
    const membershipRef = db.collection(Collections.Users).doc(userId).collection(Collections.Memberships).doc(communityId);
    const document = change.after.exists ? change.after.data() : null;
  
    // If the document does not exist, it has been deleted.
    if (document === null) {
      return membershipRef.delete();
    } else { //Document was updated
      return membershipRef.set(document as MemberDocument);
    }
  });

/*
 *  Function:       DirectMessageCounter
 *  Description:    Counts direct messages in a collection
 *  Trigger:        Triggers on a new or removed dm.
 *  Input:          NA
 *  Output:         NA
 *
 *  Notes:          If the same number of posts are added as removed, then count wouldn't change.
*/
export const DirectMessageCounter = functions.firestore
  .document(`${Collections.Users}/{user}/${Collections.DirectMessages}/{other}/${Collections.Messages}/{message}`)
  .onWrite((change, context) => {
    const db = admin.firestore(); //Default database agent
    const FieldValue = admin.firestore.FieldValue; //Access in-built fileds such as timestamp

    const user = context.params.user;
    const other = context.params.other; 
    const conversationRef = db.doc(`${Collections.Users}/${user}/${Collections.DirectMessages}/${other}`);

    if (!change.before.exists) {
      // New document Created : add one to count
      conversationRef.update({ message_count: FieldValue.increment(1) });
    } else if (change.before.exists && change.after.exists) {
      // Updating existing document : Do nothing
    } else if (!change.after.exists) {
      // Deleting document : subtract one from count
      conversationRef.update({ message_count: FieldValue.increment(-1) });
    }
    return;
  });

/*
 *  Function:       ChannelMessageCounter
 *  Description:    Counts channel posts in a collection
 *  Trigger:        Triggers on a new or removed post.
 *  Input:          NA
 *  Output:         NA
 *
 *  Notes:          If the same number of posts are added as removed, then count wouldn't change.
*/
export const ChannelMessageCounter = functions.firestore
  .document(`${Collections.Communities}/{community}/${Collections.Channels}/{channel}/${Collections.Posts}/{post}`)
  .onWrite((change, context) => {
    const db = admin.firestore(); //Default database agent
    const FieldValue = admin.firestore.FieldValue; //Access in-built fileds such as timestamp

    const community = context.params.community;
    const channel = context.params.channel;
    const channelRef = db.doc(`${Collections.Communities}/${community}/${Collections.Channels}/${channel}`);

    if (!change.before.exists) {
      // New document Created : add one to count
      channelRef.update({ message_count: FieldValue.increment(1) });
    } else if (change.before.exists && change.after.exists) {
      // Updating existing document : Do nothing
    } else if (!change.after.exists) {
      // Deleting document : subtract one from count
      channelRef.update({ message_count: FieldValue.increment(-1) });
    }
    return;
  });

/*
 *  Function:       newMessageProcessor
 *  Description:    Takes a message in the queue and 'sends' it to the recipient
 *  Trigger:        Triggers off of Firebase Document Updates to queue
 *  Input:          NA
 *  Output:         NA
 *
 *  Notes:          This allows a user to put a message into the queue. If it fails, the message will remain in the queue
*/
export const newMessageProcessor = functions.firestore.document(`${Collections.DirectMessageQueue}/{message}`).onCreate(async (snap) => {
  const db = admin.firestore(); //Default database agent

  const messageID = snap.id;
  let messageData = snap.data() as DirectMessageDocument;
  messageData.id = messageID;

  const sender = messageData.sender;
  const recipient = messageData.recipient;

  const FieldValue = admin.firestore.FieldValue; //Access in-built fileds such as timestamp
  const timeStamp = FieldValue.serverTimestamp();

  const messageDestinationRef = db.collection(Collections.Users).doc(recipient)
    .collection(Collections.DirectMessages).doc(sender)
    .collection(Collections.Messages).doc(messageID);

  // Destination Convo
  const theirConvo = {
    last_update: timeStamp,
    last_message: messageData,
    other_uid: sender,
    self_uid: recipient,
  };

  // Sender's convo
  const myConvo : ConversationDocument = {
    last_update: timeStamp,
    last_message: messageData,
    other_uid: recipient,
    self_uid: sender,
  };

  const newNotification : NotificationDocument = {
    id: `direct_${sender}`, //Intentionally overlaps with previous message
    type: NotificationType.Direct,
    timestamp: timeStamp,
    ref: messageDestinationRef,
    read: false,
  };

  // Update conversation, creates it if it is the first message, otherwise updates it
  const updateMyConvo =
    await db.collection(Collections.Users).doc(sender)
      .collection(Collections.DirectMessages).doc(recipient).set(myConvo, { merge: true });
  const updateTheirConvo =
    await db.collection(Collections.Users).doc(recipient)
      .collection(Collections.DirectMessages).doc(sender).set(theirConvo, { merge: true });

  // Put a copy of message in recipiants directory
  const sendMessage =
    await messageDestinationRef.set(messageData);

    
  const notification = await db.collection(Collections.Notifications).doc(recipient)
    .collection(Collections.All).doc(newNotification.id).set(newNotification)
    .then(async () => {
      const userDoc = await db.collection(Collections.Users).doc(recipient).get();
      if (userDoc.exists) {
        const userData = userDoc.data() as UserDocument;
        return userData.pushToken;
      } else {
        console.error('User not found');
        return '';
      }
    })
    .then((pushToken) => {
      if (pushToken) sendPushNotification([pushToken], newNotification);
    });


  return Promise.all([updateMyConvo, updateTheirConvo, sendMessage, notification])
    .then(() => {
      return snap.ref.delete(); // Remove queued message
    });
});

/*
 *  Function:       syncFollows
 *  Description:    Aggregates interactions (follows)
 *  Assumptions:    interaction documents match UIDs
 *  Trigger:        Triggers off of Firebase Document Updates to network/follows
 *  Input:          NA
 *  Output:         NA
 *
 *  Notes:          
*/
export const syncFollows = functions.firestore.document(`${Collections.Network}/{user}/${Collections.Following}/{other}`).onWrite(async (change, context) => {
  const db = admin.firestore(); //Default database agent
  const FieldValue = admin.firestore.FieldValue; //Access in-built fileds such as timestamp
  const timeStamp = FieldValue.serverTimestamp();

  const previousData = change.before.data() as FollowDocument;
  const newData = change.after.data() as FollowDocument;

  const user = context.params.user;
  const other = context.params.other;

  const followOther : FollowDocument = {
    uid: user,
    follow: newData.follow,
    last_update: timeStamp,
  };

  //Copy follow status to other user
  const followedRef = db.collection(Collections.Network).doc(other).collection(Collections.Followed).doc(user);
  await followedRef.set(followOther, { merge: true });

  //Skip if follow wasn't updated
  if (previousData?.follow === newData?.follow) {
    return false; 
  } else { //Follow Boolean is new, or changed
    if (newData.follow) { //Increment counters
      await db.collection(Collections.Network).doc(user)
        .set({ following_count: FieldValue.increment(1) }, { merge: true });
      await db.collection(Collections.Network).doc(other)
        .set({ followed_count: FieldValue.increment(1) }, { merge: true });
      // Create New Follower Notification
      const newNotification : NotificationDocument = {
        id: `follow_${user}`,
        type: NotificationType.Follow,
        timestamp: timeStamp,
        ref: followedRef,
        read: false,
      };
      return db.collection(Collections.Notifications).doc(other).collection(Collections.All).doc(newNotification.id).set(newNotification)
        .then(async () => {
          const userDoc = await db.collection(Collections.Users).doc(other).get();
          if (userDoc.exists) {
            const userData = userDoc.data() as UserDocument;
            return userData.pushToken;
          } else {
            console.error('User not found');
            return '';
          }
        })
        .then((pushToken) => {
          if (pushToken) sendPushNotification([pushToken], newNotification);
        });
      
    } else { // Decrement counters
      await db.collection(Collections.Network).doc(user)
        .set({ following_count: FieldValue.increment(-1) }, { merge: true });
      return db.collection(Collections.Network).doc(other)
        .set({ followed_count: FieldValue.increment(-1) }, { merge: true });
    }
    
  }
});

export const syncSubscribed = functions.firestore.document(`${Collections.Network}/{user}/${Collections.Subscribing}/{other}`).onWrite(async (change, context) => {
  const db = admin.firestore(); //Default database agent
  const FieldValue = admin.firestore.FieldValue; //Access in-built fileds such as timestamp
  const timeStamp = FieldValue.serverTimestamp();
  const previousData = change.before.data() as SubscribeDocument;
  const newData = change.after.data() as SubscribeDocument;

  const user = context.params.user;
  const other = context.params.other;

  //Skip if subscribe wasn't updated
  if (previousData.subscribe === newData.subscribe) {
    //noop, tier could have been updated
  } else { //Follow Boolean is new, or changed
    if (newData.subscribe) { //Increment counters
      db.collection(Collections.Network).doc(user)
        .set({ subscribing_count: FieldValue.increment(1) }, { merge: true });
      db.collection(Collections.Network).doc(other)
        .set({ subscribed_count: FieldValue.increment(1) }, { merge: true });
    } else { // Decrement counters
      db.collection(Collections.Network).doc(user)
        .set({ subscribing_count: FieldValue.increment(-1) }, { merge: true });
      db.collection(Collections.Network).doc(other)
        .set({ subscribed_count: FieldValue.increment(-1) }, { merge: true });
    }
  }

  const subscribeOther : SubscribeDocument = {
    uid: user,
    subscribe: newData.subscribe,
    tier: newData.tier,
    last_update: timeStamp,
  };

  //Copy subscribe status to other user
  return db.collection(Collections.Network).doc(other)
    .collection(Collections.Subscribed).doc(user)
    .set(subscribeOther, { merge: true });
});

/*
 *  Function:       likeCounter
 *  Description:    Aggregates all interactions to reflect on the post (i.e. likes count)
 *  Assumptions:    interaction documents match UIDs
 *  Trigger:        Triggers off of Firebase Document Updates to interactions
 *  Input:          NA
 *  Output:         NA
 *
 *  Notes:          Aggregates statistics to prevent spam reading interaction documents
*/
//TODO We need to write auditors that run like once a day to make sure these automic operations are done correctly
export const likeCounter = functions.firestore.document('communities/{community}/channels/{channel}/posts/{post}/likes/{uid}')
  .onWrite(async (change, context) => {
    const db = admin.firestore(); //Default database agent
    const FieldValue = admin.firestore.FieldValue; //Access built-in fields

    const previousData = change.before.data() as LikeDocument;
    const messageData = change.after.data() as LikeDocument;

    let community = context.params.community;
    let channel = context.params.channel;
    let post = context.params.post;


    /** Likes */
    // Determine if it is change to like value
    if (previousData?.like == messageData.like) {
      console.log('No change to like value, return');
      return;
    }
    //Determine to increment or decrement
    let update  = FieldValue.increment(1);
    if (!messageData?.like) {
      update = FieldValue.increment(-1);
    }

    const postsRef = db.collection(`${Collections.Communities}/${community}/${Collections.Channels}/${channel}/${Collections.Posts}`);
    postsRef.doc(post).update({ likes: update });

    return postsRef.doc(post).get()
      .then((document) => {
        if (document.exists) {
          const docData = document.data() as PostDocument;
          const sender = docData.sender;
          if (sender) {
            const docRef = db.doc(`${Collections.Network}/${sender}`);
            docRef.set({ likes_count: update }, { merge: true });
          }
        }
      });
  });

export const commentCounter = functions.firestore.document('communities/{community}/channels/{channel}/posts/{post}/comments/{commentId}')
  .onWrite(async (change, context) => {
    const db = admin.firestore(); //Default database agent
    const FieldValue = admin.firestore.FieldValue; //Access built-in fields

    let community = context.params.community;
    let channel = context.params.channel;
    let post = context.params.post;
  
    const postsRef = db.collection(Collections.Communities).doc(community)
      .collection(Collections.Channels).doc(channel).collection(Collections.Posts).doc(post);
    const document = change.after.exists ? change.after.data() : null;

    // If the document does not exist, it has been deleted.
    if (document === null) {
      return postsRef.update({ comments: FieldValue.increment(-1) });
    } else { //Document was updated
      return postsRef.update({ comments: FieldValue.increment(1) });
    }
  });

/**
   * 
   * @param post 
   * returns true/false. true = good to stay, false = delete
   */
const discoverAuditPost = (post: PostDocument, exists: boolean = true) => {
  let keepPost : boolean | undefined = undefined;

  const now : number = Date.now();
  const secondsSincePost = (now - post.timestamp.toDate().getTime()) / 1000;
  const likePerMinuteRequirement = 0.033; //2 like per 60 minutes
  const likeRate =  post.likes / (secondsSincePost / 60);
  // If post is more than 120 seconds old and we're seeing a new post entry, someone intentionally
  //  deleted it from discover. Meaning, don't bring it back.
  if (exists || secondsSincePost <= 60) {
    // Discover Filter (require media and open permissions, and some activity)
    if (post.media && post.permission_required === PermissionsType.Anyone) {
      if (post.likes >= 3 || secondsSincePost <= (30 * 60) || likeRate >= likePerMinuteRequirement) { // < 30 minutes or hot
        keepPost = true;
      } else { //Didn't make the threshold. Delete it
        keepPost = false;
      }
    }
  }
  return keepPost;
};

/**
 * Function:       flattenPosts
 *  Description:    Clones a post from their nested structure to a flattened read-only structure
 *  Assumptions:    NA
 *  Trigger:        Triggers off of Firebase Document Updates to posts
 *  Input:          NA
 *  Output:         NA
 *
 *  Notes:          This flattens posts into a single collection for the sake of queries
*/
export const flattenPosts = functions.firestore.document('communities/{community}/channels/{channel}/posts/{post}').onWrite(async (change, context) => {
  const db = admin.firestore(); //Default database agent
  const FieldValue = admin.firestore.FieldValue; //Access in-built fileds such as timestamp
  const timeStamp = FieldValue.serverTimestamp();
  let postId = context.params.post;

  const discoverRef = db.collection(Collections.Discover).doc(postId);
  const postRef = db.collection(Collections.Posts_All).doc(postId);
  const messageRef = db.collection(Collections.ChannelMessages_All).doc(postId);
  const beforeDocument = change.before.exists 
    ? { ...change.before.data(), id: change.before.id } as MessageDocument 
    : null;
  const document = change.after.exists 
    ? { ...change.after.data(), id: change.after.id } as PostDocument 
    : null;
  // If new post, process @mentions
  const isNew = !change.before.exists;
  if (isNew && document) {
    const usernames = findMentions(document.text);
    //TODO make this smarter
    // const searchRegex = /\@([\w]{1,})[\s\"]/g;
    //get all @mentions
    // const mentions = [...document.text.matchAll(searchRegex)];
    usernames.map( async (username) => {
      // const username = match[1];
      await db.collection(Collections.Users).where('username', '==', username).get().then(async (results) => {
        if (!results.empty) {
          const newNotification : NotificationDocument = {
            id: `post_${postId}`, //Intentionally overlaps with previous message
            type: NotificationType.Post,
            timestamp: timeStamp,
            ref: postRef,
            read: false,
          };
          const matchedUser = results.docs[0];
          const userData = await matchedUser.data() as UserDocument;
          await db.collection(Collections.Notifications).doc(userData.id).collection(Collections.All).doc(newNotification.id).set(newNotification);
          if (userData.pushToken) sendPushNotification([userData.pushToken], newNotification);
        }
      });
    });
  }

  // If the document does not exist, it has been deleted.
  if (document === null) {
    
    if (beforeDocument?.type === MessageType.Post) {
      await discoverRef.delete();
      return postRef.delete();
    } else {
      return messageRef.delete();
    }
    
  } else if (document.type == MessageType.Post) { //Document was updated
    const shouldKeep = discoverAuditPost(document, (await discoverRef.get()).exists);
    if (shouldKeep) {
      await discoverRef.set(document);
    } else if (shouldKeep === false) {
      await discoverRef.delete();
    }
    return postRef.set(document as MessageDocument);
  } else if (document.type == MessageType.Channel) { //Document was updated
    return messageRef.set(document as MessageDocument);
  } else {
    return false;
  }
});

//Make sure discover posts still deserve to be on discover
export const auditDiscover = functions.pubsub.schedule('every 60 minutes').onRun(() => {
  const db = admin.firestore();
  db.collection(Collections.Discover).get().then(docs => {
    docs.forEach((doc) => {
      const docData = { ...doc.data(), id: doc.id };
      if (discoverAuditPost(docData as PostDocument) === false) {
        doc.ref.delete();
      }
    });
  });
});

/**
 * Function:       deleteMessage
 *  Description:    Deletes DMs or Channel Messages
 *  Assumptions:    NA
 *  Trigger:        OnCall
 *  Input:          NA
 *  Output:         NA
 *
 *  Notes:          Document ID is required to be passed as part of MessageDocument  
*/
export const deleteMessage = functions.https.onCall( async (message : MessageDocument, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  const senderUID = message.sender;
  const messageId = message.id;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'deleteMessage');
  if (!messageId) throw new functions.https.HttpsError('invalid-argument', 'Missing document ID');
  

  if (message.type === MessageType.Channel) {
    const communityId = message.community;
    const channelId = message.channel;
    const messageRef = db.collection(Collections.Communities).doc(communityId).collection(Collections.Channels).doc(channelId).collection(Collections.Posts).doc(messageId);
    if (messageRef) messageRef.delete();
    else throw new functions.https.HttpsError('aborted', 'deleteMessage');
  } else if (message.type === MessageType.Direct) {
    //For DMs, the only person who can delete is the sender
    if (senderUID === uid && message.recipient) {
      //Delete from sender
      const senderMessageRef = db.collection(Collections.Users).doc(senderUID).collection(Collections.DirectMessages).doc(message.recipient).collection(Collections.Messages).doc(messageId);
      if (senderMessageRef) senderMessageRef.delete();
      else throw new functions.https.HttpsError('aborted', 'deleteMessage'); 
      //Delete from recipient
      const recipientMessageRef = db.collection(Collections.Users).doc(message.recipient).collection(Collections.DirectMessages).doc(senderUID).collection(Collections.Messages).doc(messageId);
      if (recipientMessageRef) recipientMessageRef.delete();
      else throw new functions.https.HttpsError('aborted', 'deleteMessage'); 
    } else {
      throw new functions.https.HttpsError('permission-denied', 'deleteMessage');
    }
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'deleteMessage');
  }
  return true;
});

/** 
 * Create Stripe Business Account. 
 * Reads data from User's database record and creates a new Stripe account using it
 */
export type NewStripeAccountParams = {
  country: StripeCountries
};

export const NewStripeAccount = functions.https.onCall( async (data : NewStripeAccountParams, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'FailedStripeAccountCreation');

  //Get User Data
  const User = await db.collection(Collections.Users).doc(uid).get().then((document) => {
    if (document.exists) {
      const docData = document.data();
      return {
        uid: docData?.id,
        username: docData?.username,
      };
    } else return {};
  });
  const UserPrivate = await db.collection(Collections.UsersPrivate).doc(uid).get().then((document) => {
    if (document.exists) {
      const docData = document.data();
      return {
        uid: docData?.uid,
        email: docData?.email,
        first_name: docData?.first_name,
        last_name: docData?.last_name, 
        dob: docData?.dob,
      };
    } else return {};
  });
  
  //Request new Stripe Account 
  //TODO Add Error and loggin
  if (!UserPrivate.email || !uid || !User.username) {
    console.log('Missing Required information', UserPrivate.email, uid, User.username);
    throw new functions.https.HttpsError('invalid-argument', 'MissingRequiredData');
  }
  return CreateNewStripeAccount(
    User.uid, UserPrivate.email, User.username, 
    UserPrivate.first_name, UserPrivate.last_name, UserPrivate.dob, data?.country)
    .then((account : Stripe.Account) => {
      if (account) {
        db.collection(Collections.UsersPrivate).doc(uid).collection(Collections.Stripe).doc('account').set(account, { merge: true });
        return account.id;
      } else {
        console.log('Stripe account was not created');
        throw new functions.https.HttpsError('unknown', 'StripeAccountNull');
      }
    })
    .then((accountId : string) => CreateAccountLink(accountId))
    .then((link : Stripe.AccountLink) => {
      db.collection(Collections.UsersPrivate).doc(uid).update({ account_link: link });
      return link;
    })
    .catch((error : any) => {
      console.log(error); throw new functions.https.HttpsError('unknown', 'FailedStripeAccount');
    });
});

/** Returns account link*/
export const newAccountLink = functions.https.onCall( async (data, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Failed NewAccountLink');


  let account = await db.collection(Collections.UsersPrivate).doc(uid).collection(Collections.Stripe).doc('account').get()
    .then((document) => {
      if (document.exists) {
        return document.data();
      } else {
        throw new functions.https.HttpsError('not-found', 'FailedFetchUserPrivate');
      }
    }) as Stripe.Account;

  if (account.id) {
    return CreateAccountLink(account.id);
  } else {
    throw new functions.https.HttpsError('not-found', 'MissingStripeAccount');
  }
    
});

/** returns one time use link */
export const newExpressLoginLink = functions.https.onCall( async (data, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Failed NewAccountLink');


  let account = await db.collection(Collections.UsersPrivate).doc(uid).collection(Collections.Stripe).doc('account').get()
    .then((document) => {
      if (document.exists) {
        return document.data();
      } else {
        throw new functions.https.HttpsError('not-found', 'FailedFetchUserPrivate');
      }
    }) as Stripe.Account;

  if (account.id) {
    return getLoginLink(account.id);
  } else {
    throw new functions.https.HttpsError('not-found', 'MissingStripeAccount');
  }
});

/** 
 * Create Stripe Customer Account. 
 * Reads data from User's database record and creates a new Stripe account using it
 */

export const NewStripeCustomer = functions.https.onCall( async (data : { uid? : string }, context) => {
  const db = admin.firestore(); //Default database agent
  let uid : string = context.auth?.uid || '';
  //Allow admin uids to create accounts for others
  if (data?.uid && context.auth?.uid && isAdmin(context.auth?.uid)){
    uid = data?.uid || '';
  } else if (data?.uid) {
    console.log('submitted user parameter but was not admin');
    throw new functions.https.HttpsError('permission-denied', 'FailedStripeCustomerCreation');
  }
  console.log('isAdmin: ', isAdmin(context.auth?.uid || ''));
  console.log('input uid: ', data?.uid);
  console.log('uid: ', uid);
  
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'FailedStripeCustomerCreation');

  return db.collection('users_private').doc(uid).get().then((document) => {
    if (document.exists) {
      const docData = document.data();
      return {
        uid: docData?.uid,
        email: docData?.email,
        first_name: docData?.first_name,
        last_name: docData?.last_name, 
        dob: docData?.dob,
        phone_number : docData?.phone_number,
      };
    } else return {};
  }).then((value) => {
    if (value.uid) {
      const name = value.first_name ? `${value.first_name} ${value.last_name}` : undefined;
      return CreateNewStripeCustomer(uid, value.email, name, value.phone_number);
    }
    throw new functions.https.HttpsError('unknown', 'StripeAPICallFailed');
  }).then((customer) => {
    db.collection('users_private').doc(uid).collection(Collections.Stripe).doc(Collections.StripeCustomer).set(customer, { merge: false });
    return customer;
  }).catch((error : any) => {
    console.log(error); 
    throw new functions.https.HttpsError('unknown', 'FailedStripeCustomerCreation');
  });
});

/**
 * Webhook for Stripe to send customer updates
 */
export const StripeCustomerEvents = functions.https.onRequest((request, response) => {
  const db = admin.firestore(); //Default database agent
  //TODO Replace hardcoded test secret
  // const stripewebhooksecretkey = 'whsec_RIlwr1IRVy3wIRMMeGUgZzi75uTSfwoC';
  const stripewebhooksecretkey = functions.config().stripe.customerwebhook;
  const stripesignature = request.headers['stripe-signature'] as string;
  let stripeevent:Stripe.Event;
  try {
    stripeevent = stripe.webhooks.constructEvent(request.rawBody, stripesignature, stripewebhooksecretkey);
    const customer = stripeevent.data.object as Stripe.Customer;
    if (customer?.metadata?.uid) {
      db
        .collection(Collections.UsersPrivate)
        .doc(customer.metadata.uid)
        .collection(Collections.Stripe)
        .doc(Collections.StripeCustomer)
        .set(customer, { merge: true });
    }
    
  } catch (error) {
    response.status(400).end();
    return;
  } 
  response.sendStatus(200);
});

/** Returns array of payment methods */
export const getPaymentSources = functions.https.onCall( async (data, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'FailedGetPaymentSources');

  let customerId = await db
    .collection(Collections.UsersPrivate)
    .doc(uid)
    .collection(Collections.Stripe)
    .doc(Collections.StripeCustomer)
    .get()
    .then((document) => {
      if (document.exists) {
        return document.data()?.id;
      } else {
        throw new functions.https.HttpsError('not-found', 'FailedFetchUserPrivate');
      }
    });

  if (customerId) {
    return GetPaymentMethods(customerId, 'card').then((value : any) => {
      if (value?.data) return value.data;
      else return [];
    }); //Defaults to card
  } else {
    throw new functions.https.HttpsError('not-found', 'FailedFetchCustomerId');
  }
    
});

/** Create Payment Method (using stripe.js) */
export const addSourceToCustomer = functions.https.onCall( async (data : string, context) => {
  const db = admin.firestore(); //Default database agent
  const uid : string | undefined = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'addSourceToCustomer');


  let customerId = await db
    .collection(Collections.UsersPrivate)
    .doc(uid)
    .collection(Collections.Stripe)
    .doc(Collections.StripeCustomer)
    .get()
    .then((document) => {
      if (document.exists) {
        return document.data()?.id;
      } else {
        throw new functions.https.HttpsError('not-found', 'FailedFetchUserPrivate');
      }
    });

  if (customerId) {
    return AttachPaymentMethod(customerId, data);
  }
  
});

/** Set Default Payment Method (using stripe.js) */
export const setDefaultPaymentSource = functions.https.onCall( async (sourceId : string, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'setDefaultPaymentSource');


  let customerId = await db
    .collection(Collections.UsersPrivate)
    .doc(uid)
    .collection(Collections.Stripe)
    .doc(Collections.StripeCustomer)
    .get()
    .then((document) => {
      if (document.exists) {
        return document.data()?.id;
      } else {
        throw new functions.https.HttpsError('not-found', 'FailedFetchUserPrivate');
      }
    });

  if (customerId && sourceId) {
    return setDefaultSource(customerId, sourceId);
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'setDefaultPaymentSource');
  }
});

/** Remove Payment Method (using stripe.js) */
export const removePaymentMethod = functions.https.onCall( async (sourceId : string, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'removePaymentMethod');

  if (sourceId) {
    return detachPaymentMethod(sourceId);
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'removePaymentMethod');
  }
});

export const getSubscriptionHistory = functions.https.onCall( async (data : string, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'FailedAddCreditCard');
  let customer = await db
    .collection(Collections.UsersPrivate)
    .doc(uid)
    .collection(Collections.Stripe)
    .doc(Collections.StripeCustomer)
    .get()
    .then((document) => {
      if (document.exists) {
        return document.data();
      } else {
        throw new functions.https.HttpsError('not-found', 'FailedFetchUserPrivate');
      }
    }) as Stripe.Customer;

  if (customer.id) {
    return getAllSubscriptions(customer.id);
  }
});

export const fetchStripeAccount = functions.https.onCall( async (data : string, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'fetchStripeAccount');
  let account = await db
    .collection(Collections.UsersPrivate)
    .doc(uid)
    .collection(Collections.Stripe)
    .doc(Collections.StripeAccount)
    .get()
    .then((document) => {
      if (document.exists) {
        return document.data();
      } else {
        throw new functions.https.HttpsError('not-found', 'FailedFetchUserPrivate');
      }
    }) as Stripe.Account;

  if (account.id) {
    return getStripeAccount(account.id).then((result) => {
      if (result) {
        db
          .collection(Collections.UsersPrivate)
          .doc(uid)
          .collection(Collections.Stripe)
          .doc(Collections.StripeAccount)
          .set(result);
        return result;
      } else {
        throw new functions.https.HttpsError('not-found', 'MissingStripeAccount');
      }
    });
  } else {
    throw new functions.https.HttpsError('not-found', 'StripeSaidNo');
  }
});

type CreateNewPriceParams = {
  /** Price in decimal USD */
  price: number, 
  communityId: string,
  tierId: string,
};
export const createNewPrice = functions.https.onCall( async (data : CreateNewPriceParams, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'createNewPrice');
  return createPriceAndProduct('Premium', data.price * 100, data.tierId, uid).then((result) => {
    if (result) {
      db.collection(Collections.Communities).doc(data.communityId).collection(Collections.PremiumTiers).doc(data.tierId)
        .update({ price: data.price, stripe_price: result });
      return result;
    } else {
      throw new functions.https.HttpsError('not-found', 'FailedToSavePrice');
    }
  }).catch((error) => {
    console.error(error); 
    throw new functions.https.HttpsError('unknown', 'SomethingWentWrong');
  });
});

type UpdatePriceParams = {
  /** Price in decimal USD */
  price: number, 
  communityId: string,
  tierId: string,
};
export const updatePrice = functions.https.onCall( async (data : UpdatePriceParams, context) => {
  const db = admin.firestore(); //Default database agent
  const uid : string | undefined = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'updatePrice');

  //Get old Price (so we can disable it)
  const oldTier = await db.collection(Collections.Communities).doc(data.communityId)
    .collection(Collections.PremiumTiers).doc(data.tierId).get().then((document) => document.data() as TierDocument);
  //Create new Price and save it
  const newPrice = await createStripePrice(data.price * 100, data.tierId, uid);
  //Disable old price (not needed, but correct to do)
  if (oldTier.stripe_price?.id && newPrice.id) {
    disableStripePrice(oldTier.stripe_price.id);  //Save new price to firebase
    await db.collection(Collections.Communities).doc(data.communityId)
      .collection(Collections.PremiumTiers).doc(data.tierId).update({ price: data.price, stripe_price: newPrice })
      .catch((error) => {
        console.error(error); 
        throw new functions.https.HttpsError('unknown', 'SomethingWentWrong');
      });
    return newPrice;
  } else {
    console.error('Something went wrong, potentially a new price was created, but old one is still active.');
    throw new functions.https.HttpsError('unknown', 'SomethingWentWrong');
  }
});

type RemoveTierParams = {
  communityId: string,
  tierId: string,
};
export const removeTier = functions.https.onCall( async (data : RemoveTierParams, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'updatePrice');

  // TODO Cancel all subscriptions

  // Delete Firebase Document
  await db.collection(Collections.Communities).doc(data.communityId)
    .collection(Collections.PremiumTiers).doc(data.tierId).delete();
  // Remove Stripe Product
  await removeStripeProduct(data.tierId);
});



type CreateNewSubscription = {
  communityId: string,
  tierId: string,
};
/** Creates a subscription on behalf of a community */
export const createNewSubscription = functions.https.onCall( async (data : CreateNewSubscription, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'createNewSubscription');

  const FieldValue = admin.firestore.FieldValue; //Access in-built fileds such as timestamp
  let timeStamp = FieldValue.serverTimestamp();

  const customerId : string = await db.collection(Collections.UsersPrivate).doc(uid).collection(Collections.Stripe).doc(Collections.StripeCustomer).get()
    .then((document) => {
      if (document.exists) {
        return document.data()?.id;
      } else {
        throw new functions.https.HttpsError('not-found', 'FailedFetchUserPrivate');
      }
    });

  const price = await db.collection(Collections.Communities).doc(data.communityId).collection(Collections.PremiumTiers)
    .doc(data.tierId).get().then((doc) => {
      if (doc.exists) {
        const docData = doc.data() as TierDocument;
        return docData.stripe_price as Stripe.Price;
      } else {
        return undefined;
      }
    });

  const ownerId = await db.collection(Collections.Communities).doc(data.communityId).get().then((doc) => {
    if (doc.exists) {
      const docData = doc.data() as CommunityDocument;
      return docData.owner_id;
    } else {
      return undefined;
    }
  });

  if (!ownerId) {throw new functions.https.HttpsError('not-found', 'FailedFetchUserPrivateForCommunityOwner');}
  const account = await db.collection(Collections.UsersPrivate).doc(ownerId).collection(Collections.Stripe).doc('account').get()
    .then((document) => {
      if (document.exists) {
        return document.data();
      } else {
        throw new functions.https.HttpsError('not-found', 'FailedFetchUserPrivate');
      }
    }) as Stripe.Account;

  if (customerId && account.id && price?.id ) {
    return createStripeSubscription(customerId, price, account.id, data.communityId, uid).then(async (subscription) => {
      const memberUpdate : MemberDocument = {
        uid: uid,
        role: PermissionsType.Subscribers,
        tier: 1,
        last_update: timeStamp,
      };
      //Update user role
      await db.collection(Collections.Communities).doc(data.communityId).collection(Collections.Members)
        .doc(uid).set(memberUpdate, { merge: true });
      return subscription;
    });
  } else {
    throw new functions.https.HttpsError('unknown', 'FailedSeeServerLogs');
  }
});


type RemoveSubscriptionParams = {
  subscriptionId: string,
  communityId: string,
};
export const removeSubscription = functions.https.onCall( async (data : RemoveSubscriptionParams, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'removeSubscription');

  //Downgrade tier
  await db.collection(Collections.Communities).doc(data.communityId)
    .collection(Collections.Members).doc(uid).update({ 
      role: PermissionsType.Members,
      tier: 0,
    });
  //Stop Stripe from charging again
  return removeStripeSubscription(data.subscriptionId);
});


export const submitAccessCode = functions.https.onCall( async (code : string, context) => {
  const db = admin.firestore(); //Default database agent
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'removeSubscription');

  const FieldValue = admin.firestore.FieldValue; //Access built-in fields

  const accessCodesRef = db.collection(Collections.AccessCodes);
  const matchingCodes = await accessCodesRef.where('value', '==', code).get();

  const matchArray : Array<WithId<AccessCode>> = [];
  matchingCodes.forEach((doc) => {
    const docData = doc.data() as WithId<AccessCode>;
    matchArray.push({
      ...docData,
      id: doc.id,
    });
  });

  //Find first match
  const matchCode = matchArray.find((accessData) => {
    if (accessData) {
      const spotsRemaining = accessData.max_uses == 0 || (accessData.current_uses || 0 < accessData.max_uses);
      if (spotsRemaining) { // uses available
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  });
  if (matchCode) {
    const update : Partial<UserDocument> = {
      access_code: {
        value: code,
        validated: true,
      },
    };
    //Increment uses
    accessCodesRef.doc(matchCode.id).update({ current_uses: FieldValue.increment(1) });
    //Save user as validated
    db.collection(Collections.Users).doc(uid).update(update);
    return true;
  } else {
    return false;
  }
});


type AuthChangeData = {
  uid: string,
  removeContent: boolean,
};

export const accountDisable = functions.https.onCall( async (data : AuthChangeData, context) => {
  const db = admin.firestore(); //Default database agent
  const uid : string = context.auth?.uid || '';
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'accountDisable');
  //rn it is Dylan (dev and prod), Sam, Faiz
  const adminList = ['j9i6PloH7pMgaPIUfUVcgPYRihl1', 'dVyeS0gmwnS6I6A0kYU05RZ1cXo1', 'qemXMFFBvxPpsd6HlQuCNzjvspq1', 'p8oSiI8aMXRQ3qh6yhflTAPXSjB2'];
  if (adminList.find((id) => id === uid)) {//find adminList match
    if (data?.uid) {
      await admin.auth().updateUser(data.uid, {
        disabled: true,
      });
      if (data?.removeContent) {
        //Remove Posts
        await db.collection(Collections.Posts_All).where('sender', '==', data.uid)
          .get()
          .then(async (docs) => {
            const docArray : any[] = [];
            docs.forEach((doc) => docArray.push(doc));
            for (const doc of docArray) {
              try {
                const docData = doc.data() as PostDocument;
                //Delete original
                await db.collection(Collections.Communities).doc(docData.community)
                  .collection(Collections.Channels).doc(docData.channel)
                  .collection(Collections.Posts).doc(doc.id).delete();
                //Delete flattened copy (should propegate)
                // await doc.ref.delete();
              } catch (error) {
                console.error(`failed to delete ${doc.id}`);
              }
            }
          });
        //Remove Channel messages
        await db.collection(Collections.ChannelMessages_All).where('sender', '==', data.uid)
          .get()
          .then(async (docs) => {
            const docArray : any[] = [];
            docs.forEach((doc) => docArray.push(doc));
            for (const doc of docArray) {
              try {
                const docData = doc.data() as ChannelMessageDocument;
                //Delete original
                await db.collection(Collections.Communities).doc(docData.community)
                  .collection(Collections.Channels).doc(docData.channel)
                  .collection(Collections.Posts).doc(doc.id).delete();
                //Delete flattened copy (should propegate)
                // await doc.ref.delete();
              } catch (error) {
                console.error(`failed to delete ${doc.id}`);
              }
            }
          });
        //Clean up discover (should not be needed, but for good measure)
        await db.collection(Collections.Discover).where('sender', '==', data.uid)
          .get()
          .then(async (docs) => {
            const docArray : any[] = [];
            docs.forEach((doc) => docArray.push(doc));
            for (const doc of docArray) {
              try {
                //Delete flattened copy
                await doc.ref.delete();
              } catch (error) {
                console.error(`failed to delete ${doc.id}`);
              }
            }
          });
      }
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'accountDisable');
    }
    
  } else {
    throw new functions.https.HttpsError('permission-denied', 'accountDisable');
  }
});