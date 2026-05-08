// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Database/Server Interface for Direct Messaging

import { toast } from 'react-toastify';
import { addDoc, collection, doc, DocumentData, getDoc, getDocs, limit, onSnapshot, orderBy, query, QueryDocumentSnapshot, setDoc, startAfter, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { fireStorage } from 'api/firebase';
import logEvent, { EventMessages } from 'lib/events';
import { memoizeAsync } from 'lib/memo';
import { OldUser } from 'store/userSlice';
import { ActivityDocument, Collections, ConversationDocument, DirectMessageDocument, MessageDocument } from 'types/documents';
import { db } from 'utils/firebase';

import { getMemoizedMedia, MessageUnion } from './communityAPI';
import MediaAPI from './mediaAPI';
import { getUserById } from './userAPI';

export type ConversationUnion = ConversationDocument & {
  other: OldUser
};

const getMemoizedUser = memoizeAsync<OldUser | null>(getUserById);

export const newConversation = async (uid : string, otherUid : string) => {
  logEvent(EventMessages.Messages.NewConversation);
  const docRef = doc(db, Collections.Users, uid, Collections.DirectMessages, otherUid);
  const temp : ConversationDocument = {
    self_uid: uid,
    other_uid: otherUid,
    last_message: <DirectMessageDocument>{},
    last_update: Timestamp.now(),
  };
  return setDoc(docRef, temp, { merge: true });
};

export const updateReadCount = async (conversation : ConversationDocument | ConversationUnion) : Promise<void> => {
  //Assume conversation object may not be up to date
  const update : Partial<ActivityDocument> = {
    [Collections.DirectMessages] : {
      [conversation.other_uid] : conversation.message_count || 0,
    },
  };
  const docRef = doc(db, Collections.Activity, conversation.self_uid);

  setDoc(docRef, update, { merge: true });

};

let currentMessagesUnsubscribe = () => {return;};
// Last message tracks the last message in the query so we can load static data behind it
let lastMessage : QueryDocumentSnapshot<DocumentData> | null = null;
export const subscribeMessages = (conversation: ConversationUnion | ConversationDocument, callback: (messages: Array<MessageUnion>) => void) => {
  currentMessagesUnsubscribe();
  const conversationRef = collection(db,
    Collections.Users, conversation.self_uid,
    Collections.DirectMessages, conversation.other_uid,
    Collections.Messages);
  const q = query(conversationRef, orderBy('timestamp', 'desc'), limit(20));

  currentMessagesUnsubscribe = onSnapshot(q, async (documentSnapshots) => {
    const messages : Array<MessageUnion> = [];
    const newArray : Array<DirectMessageDocument> = [];
    lastMessage = documentSnapshots.docs[documentSnapshots.docs.length - 1];
    documentSnapshots.forEach((document) => {
      let temp = document.data() as DirectMessageDocument;
      temp.id = document.id;
      newArray.push(temp);
    });
    for (let value of newArray) {
      let author = await getMemoizedUser(value.sender);

      if (author) {
        messages.push({
          ...value,
          author: {
            ...author,
            avatar: author.profile_image && await getMemoizedMedia(author.profile_image) || '',
          },
          mediaURL:  value.media ? await MediaAPI.getDownloadURL(value.media) : undefined,
        });
      }
    }
    callback(messages);
  });
};

/** Paired with subscribe messages to reach back and get addtional messages */
export const getMoreMessages = async (conversation: ConversationUnion | ConversationDocument, count: number = 20) : Promise<Array<MessageUnion>> => {
  if (!lastMessage) return []; //We have nothing to start at
  const conversationRef = collection(db,
    Collections.Users, conversation.self_uid,
    Collections.DirectMessages, conversation.other_uid,
    Collections.Messages);
  //The reason this keeps reaching further and further back from last message is so a user has continuity of messages
  // Otherwise if they type after going backwards, you drop messages out of the history.
  const q = query(conversationRef, orderBy('timestamp', 'desc'), startAfter(lastMessage), limit(count));
  const querySnapshot = await getDocs(q);
  const messages : Array<MessageUnion> = [];
  const newArray : Array<DirectMessageDocument> = [];
  querySnapshot.forEach((document) => {
    let temp = document.data() as DirectMessageDocument;
    temp.id = document.id;
    newArray.push(temp);
  });
  for (let value of newArray) {
    let author = await getMemoizedUser(value.sender);

    if (author) {
      messages.push({
        ...value,
        author: author,
        mediaURL:  value.media ? await MediaAPI.getDownloadURL(value.media) : undefined,
      });
    }
  }
  return messages || [];
};

export const getDirectMessageByPath = async (path: string) => {
  const docRef = doc(db, path);
  let document = await getDoc(docRef);
  if (document.exists()) {
    return document.data() as DirectMessageDocument;
  } else {
    return {} as DirectMessageDocument;
  }
};

export const sendDirectMessage = async (message : DirectMessageDocument, media? : File) => {
  logEvent(EventMessages.Messages.SendMessage);
  let dm = message;
  if (media) {
    let imagePath = null;
    // Put uids in alphabetical order (matches convoID)
    const uidArray = [dm.recipient, dm.sender];
    uidArray.sort();
    // const imageDirectory = `${uidArray[0]}_${uidArray[1]}`;
    imagePath = MediaAPI.getDirectMessageMediaPath(dm, media);
    // imagePath = dm.mediaPath;
    try {
      await fireStorage.uploadFile(imagePath, media);
    } catch (error) {
      toast.error('File cannot be larger than 10MB');
      return;
    }

    dm.media = imagePath;
  }
  const messagesRef = collection(db,
    Collections.Users, dm.sender,
    Collections.DirectMessages, dm.recipient,
    Collections.Messages);
  addDoc(messagesRef, dm)
    .then((docRef) => {
      const queueRef = doc(db, Collections.DirectMessageQueue, docRef.id);
      return setDoc(queueRef, dm);
    });
};

export const getReadCount = (conversation : ConversationDocument | ConversationUnion) : Promise<number> => {

  if (conversation.self_uid) {
    const docRef = doc(db, Collections.Activity, conversation.self_uid);
    return getDoc(docRef).then((document) => {
      const directMessageMap  = document.get(Collections.DirectMessages);
      const readCount = directMessageMap && directMessageMap[conversation.other_uid];
      return readCount || 0;
    });
  }
  return new Promise(() : number => 0);
};

export const deleteMessage = async (message: MessageDocument) => {
  // logEvent(EventMessages.Billing.UnSubcribe, { communityId: communityId, subscriptionId: subscriptionId });
  const functions = getFunctions();
  const fbFunction = httpsCallable(functions, 'deleteMessage');
  return fbFunction(message)
    .catch((error) => {console.error(error); throw new Error('Failed to remove message');});
};
