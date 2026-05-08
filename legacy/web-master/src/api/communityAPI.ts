/*eslint-disable*/
import { db } from 'util/firebase';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  setDoc,
  query,
  orderBy,
  where,
  getDocs,
  limit,
  onSnapshot,
  Timestamp,
  updateDoc,
  DocumentData,
  QueryDocumentSnapshot,
  deleteDoc,
  startAfter,
  Unsubscribe,
} from 'firebase/firestore';
import log from 'loglevel';
import {
  ActivityDocument,
  ChannelDocument,
  ChannelMessageDocument,
  Collections,
  CommunityDocument,
  MemberDocument,
  MessageDocument,
  PermissionsName,
  PermissionsType,
  PostDocument,
  TierDocument,
  UserDocument,
  WithId
} from 'shared/types/documents';
import { memoizeAsync } from 'lib/memo';
import { getUserById } from './userAPI';
import MediaAPI, { getMediaUrl } from './mediaAPI';
import { fireStorage } from 'api/firebase';
import { User } from 'store/userSlice';
import { FireDB, mapCollection, paths } from './firebase';
import { toast } from 'react-toastify';
import logEvent, { EventMessages } from 'lib/events';

export const getMemoizedUser = memoizeAsync<UserDocument | null>(getUserById);
export const getMemoizedMedia = memoizeAsync<string>(getMediaUrl);

export const communityTable = new FireDB<CommunityDocument>(Collections.Communities);

export type CommunityUnion = CommunityDocument & {
  channels: Array<ChannelDocument>;
  message_count : number
}

export type MessageUnion = MessageDocument & {
  author: User;
  mediaURL?: string;
};

export type Member = User & {
  role: PermissionsType,
  tier: number,
};

// Takes a community ID and returns the community info
export const getCommunityById = async (communityID : string) : Promise<CommunityUnion | null> =>  {
  const functionName = 'CommunityAPI | getCommunityById';
  if(communityID.length < 1) return null

  try {
    const docRef = doc(db, Collections.Communities, communityID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const docData = docSnap.data() as CommunityDocument;
      const q = query(collection(db, Collections.Communities, communityID, Collections.Channels), where('profile', '!=', true));
      const querySnapshot = await getDocs(q);
      let channels : Array<ChannelDocument> = [];
      let messageCount = 0;
      await querySnapshot.forEach((chan : DocumentData) => {
        // doc.data() is never undefined for query doc snapshots
        const chanData = chan.data() as ChannelDocument;
        messageCount = messageCount + (chanData.message_count || 0);
        channels.push(chanData);
      });

      // This overwrites the community name to user's backspace if it is the default
      if (docData.name === 'My Backspace') {
        const user = await getMemoizedUser(docData.owner_id);
          if (user) {
            docData.name = `${user.display_name}'s backspace`
          }
      }

      //DO NOT PUT THIS BACK IN UNLESS APPLIED GLOBALLY
      // channels.sort((a,b) => {
      //   if(a.name > b.name) return 1;
      //   else if (b.name > a.name) return -1;
      //   else return 0;
      // })

      return {
        ...docData,
        channels: channels,
        message_count: messageCount,
      }
    } else {
      log.debug('No such community document', functionName);
      return null
    }

  } catch (e) {
    log.error(e);
    return null
  }
};



export async function getChannels(communityId: string): Promise<ChannelDocument[]> {
  const channelTable = new FireDB<ChannelDocument>(paths.channel(communityId));
  const channels = await channelTable.query(where('profile', '!=' , true))
  return channels;
}

// We store the unsub method returned by onSnapshot to call it before we resubscribe.
let unsubChannels = () => {};
export function subscribeChannelsAsync(communityId : string) : Promise<ChannelDocument[]> {
  return new Promise((resolve) => {
    const collectionRef = collection(db, Collections.Communities, communityId, Collections.Channels);
    const q = query(collectionRef, where('profile', '!=' , true))
    unsubChannels();
    unsubChannels = onSnapshot(q, async (collectionSnapshot) => {
      const channels = mapCollection(collectionSnapshot, chan => chan.data() as ChannelDocument);
      resolve(channels);
    });
  })
}

export const getTopPosts = () => {}
export const getChronologicalPosts = () => {}

export const createPost = (newPost : PostDocument) => {}
// export const setPostViewed = (inPost : Post, uid: string) => {}
// export const setPostLiked = (inPost : Post, uid: string, likeVal: boolean) => {}



export const getCommunityUnread = async (uid : string, community : CommunityUnion) : Promise<number> => {
  const totalCount = community.message_count || 0;
  let readCount = 0;
  for(let chan of community.channels) {
    const thisRead = await getChannelReadCount(uid, chan.id);
    readCount = readCount + (thisRead || 0);
  }
  return totalCount - readCount;
};

export const getChannelReadCount = (uid : string, channelid : string) : Promise<number> => {
  if (uid && channelid) {
    const docRef = doc(db, Collections.Activity, uid);
    return getDoc(docRef).then((document) => {
      const channelMap  = document.get(Collections.Channels);
      if(channelMap) {
        const readCount = channelMap[channelid];
        return readCount || 0;
      }
       return 0;
    });
  }
  return new Promise(() : number => 0);
};


export const updateCommunityReadCount = async (uid: string, communityId : string) : Promise<void> => {
  if(!uid || !communityId ) return;
  let community : CommunityUnion | null = await getCommunityById(communityId)
  let newValue = 0;
  if (community) {
    newValue = community.message_count || 0;
  }
  const update : Partial<ActivityDocument> = {
    [Collections.Communities] : {
      [communityId] : newValue,
    },
  };
  const docRef = doc(db, Collections.Activity, uid);

  setDoc(docRef, update, { merge: true });
};


export const updateChannelReadCount = async (uid: string, community : string, channel : string ) : Promise<void> => {
  if(!uid || !community || !channel) return;
  //Assume conversation object may not be up to date
  const convoRef = doc(db, Collections.Communities, community, Collections.Channels, channel);
  const channelDoc = await getDoc(convoRef);
  let newValue = 0;
  if (channelDoc.exists()) {
    newValue = (channelDoc.data() as ChannelDocument).message_count || 0;
  }
  const update : Partial<ActivityDocument> = {
    [Collections.Channels] : {
      [channel] : newValue,
    },
  };
  const docRef = doc(db, Collections.Activity, uid);

  setDoc(docRef, update, { merge: true });
};

const markChannelLastSeen = (uid: string, communityId: string, channelId : string) => {
  //FIXME put last seen in activities
  // const docRef = doc(db, Collections.Communities, communityId, Collections.Channels, channelId);
  // const time = Timestamp.now();
  return updateChannelReadCount(uid, communityId, channelId);
  // return updateDoc(docRef, {last_seen: time})
}


let unsubChannelMessages : Unsubscribe = () => {};
// Last message tracks the last message in the query so we can load static data behind it
let lastMessage : QueryDocumentSnapshot<DocumentData> | null = null;
export const subChannelMessages =  async (
  uid: string,
  communId: string,
  chanId: string,
  callback: (messages: Array<MessageUnion>) => void,
) => {
  const collectionRef = collection(db,
    Collections.Communities, communId,
    Collections.Channels, chanId,
    'posts');
  const q = query(collectionRef, orderBy('timestamp', 'desc'), limit(20));
  unsubChannelMessages = await onSnapshot(q, async (collectionSnapshot) => {
    const messages : Array<MessageDocument> = [];
    const results : Array<MessageUnion> = [];
    lastMessage = collectionSnapshot.docs[collectionSnapshot.docs.length - 1];
    collectionSnapshot.forEach((d) => {
      const docData = d.data() as MessageDocument;
      docData.id = d.id; // Needed so we can access the document later
      messages.push(docData);
    });

    for(let value of messages) {
      const author = await getMemoizedUser(value.sender);
      if(author) {
        results.push({
          ...value,
          author: {
            ...author,
            avatar: author.profile_image && await getMemoizedMedia(author.profile_image) || '',
          },
          mediaURL:  value.media ? await MediaAPI.getDownloadURL(value.media) : undefined,
        })
      }
    }
    // console.log('sub callback', results);
    markChannelLastSeen(uid, communId, chanId);
    callback(results);
  });
}

export const getMoreMessages =  async (lastMessage: MessageDocument, commun: CommunityDocument, chan: ChannelDocument, count: number = 20) => {
  if(!commun || !chan || !lastMessage?.id) return [];
  const collectionRef = collection(db,
    Collections.Communities, commun.id,
    Collections.Channels, chan.id,
    'posts');
  const lastMessageRef = doc(db, paths.post(commun.id, chan.id, lastMessage.id));
  const lastMessageDoc = await getDoc(lastMessageRef);
  const q = query(collectionRef, orderBy('timestamp', 'desc'), startAfter(lastMessageDoc), limit(count));
  const querySnapshot = await getDocs(q);
  const messages : Array<MessageDocument> = [];
  const results : Array<MessageUnion> = [];
  querySnapshot.forEach((d) => {
    const docData = d.data() as MessageDocument;
    docData.id = d.id; // Needed so we can access the document later
    messages.push(docData);
  });

  for(let value of messages) {
    const author = await getMemoizedUser(value.sender);
    if(author) {
      results.push({
        ...value,
        author: {
          ...author,
          avatar: author.profile_image && await getMemoizedMedia(author.profile_image) || '',
        },
        mediaURL:  value.media ? await MediaAPI.getDownloadURL(value.media) : undefined,
      })
    }
  }
  return results;
}

  // Takes a community ID and returns the channel info
  export const sendChannelMessage = async (message : ChannelMessageDocument, media?: File) => {
    logEvent(EventMessages.Community.SendMessage);
    let channelMessage = message;

    if (media) {
       const imagePath = paths.postMedia(
       channelMessage.community,
       channelMessage.channel,
       `${media.name}`,
     );
      try {
        imagePath && await fireStorage.uploadFile(imagePath, media);
      } catch (error) {
        toast.error('File cannot be larger than 10MB');
      }

      channelMessage.media = imagePath || '';
    }
    const docRef = await addDoc(collection(db,
      Collections.Communities, message.community,
      Collections.Channels, message.channel,
      'posts'), channelMessage);
    log.debug(`Document written with ID: ${docRef.id}`);
  }

/**
 * Community Membership Controls
 */

export const getUserRole = async (communityId : string, userId : string) => {
  const docRef = doc(db, Collections.Communities, communityId, Collections.Members, userId)
  let document = await getDoc(docRef);
  if(document.exists()) {
    let docData = document.data() as MemberDocument
    return docData.role;
  } else { // Not a member, must be anyone
    return PermissionsType.Anyone;
  }
}

export const addNewMember = async (communityId : string, userId : string): Promise<WithId<MemberDocument>> => {
  logEvent(EventMessages.Community.NewMember);
  const docRef = doc(db, Collections.Communities, communityId, Collections.Members, userId)
  const memberDoc : MemberDocument = {
    uid: userId,
    last_update: Timestamp.now(),
    role: PermissionsType.Members,
    tier: 0,
  }
  await setDoc(docRef, memberDoc, {merge: true});
  return {
    ...memberDoc,
    id: communityId
  }
}

export const removeMember = (communityId : string, userId : string) => {
  logEvent(EventMessages.Community.RemoveMember);
  const docRef = doc(db, Collections.Communities, communityId, Collections.Members, userId)
  return deleteDoc(docRef)
}


export const setRole = (communityId : string, userId : string, role : PermissionsType) => {
  logEvent(EventMessages.Community.RoleUpdate, {role: PermissionsName[role]})
  const docRef = doc(db, Collections.Communities, communityId, Collections.Members, userId)
  const memberDoc : Partial<MemberDocument> = {
    role: PermissionsType.Members,
  }
  return updateDoc(docRef, memberDoc)
}

export const getMapofMembers = async (communityId: string) : Promise<Map<string, MemberDocument>> => {
  const collectionRef  = collection(db, Collections.Communities, communityId, Collections.Members)
  const q = query(collectionRef, orderBy('role', 'desc'));
  const members = await getDocs(q);
  const resultsMap = new Map<string, MemberDocument>();
  members.forEach((document) => {
    const docData = document.data() as MemberDocument;
    resultsMap.set(document.id, docData);
  })
  return resultsMap;
}

export const createTier = async (communityId: string, tierDoc: TierDocument) => {
  logEvent(EventMessages.Community.NewTier);
  const collectionRef = collection(db, Collections.Communities, communityId, Collections.PremiumTiers)
  return addDoc(collectionRef, tierDoc)
}


export const removeTier = async (communityId: string, tierId: string) => {
  logEvent(EventMessages.Community.RemoveTier);
  const docRef = doc(db, Collections.Communities, communityId, Collections.PremiumTiers, tierId)
  return deleteDoc(docRef)
}
