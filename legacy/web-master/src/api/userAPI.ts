// This will abstract our API accessors (firebase in this case)

import {
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  startAt,
  Timestamp,
} from 'firebase/firestore';
import { unionBy } from 'lodash';

import logEvent, { EventMessages } from 'lib/events';
import { memoizeAsync } from 'lib/memo';
import { Collections, FollowDocument, MemberDocument, OnlinePresence, PermissionsType, PrivateUserDocument, StatusDocument, UserDocument, WithId } from 'shared/types/documents';
import { NetworkDocument } from 'shared/types/documents';
import { User } from 'store/userSlice';
import { db } from 'util/firebase';

import { FireDB, orderBy, where } from './firebase';
import { getMediaUrl } from './mediaAPI';

export const UserTable = new FireDB<UserDocument>(Collections.Users);
export const PrivateTable = new FireDB<PrivateUserDocument>(Collections.UsersPrivate);
// eslint-disable-next-line @typescript-eslint/no-use-before-define
export const memoizedGetUser = memoizeAsync<UserDocument | null>(async id => getUserById(id));

const getMemoizedAvatar = memoizeAsync<string>(getMediaUrl);

export async function getAvatar(path?: string) {
  if (path) {
    const avatar = await getMemoizedAvatar(path);
    return avatar;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  const userDoc = await UserTable.getWithId(userId);
  if (userDoc) {
    return {
      ...userDoc,
      avatar: userDoc?.profile_image
        ? await getMediaUrl(userDoc?.profile_image)
        : undefined,
    };
  }

  return null;
}

export async function getUserPrivateById(userId: string): Promise<PrivateUserDocument | null> {
  const userDoc = await PrivateTable.getWithId(userId);
  if (userDoc) {
    return {
      ...userDoc,
    };
  }

  return null;
}

export async function getUserByUsername(username: string): Promise<User> {
  const users = await UserTable.query(
    where<UserDocument>('username', '==', username),
    limit(1),
  );
  const matchingUser = users?.[0] as User;
  if (matchingUser) {
    return {
      ...matchingUser,
      avatar: matchingUser?.profile_image
        ? await getMediaUrl(matchingUser?.profile_image)
        : undefined,
    };
  }
  throw new Error('Couldn\' find user by that username');
}

// Mainly for searching for users
export async function findUsers(userInput: string): Promise<User[]> {
  const usersBySearchName = await UserTable.query(
    orderBy<UserDocument>('search_name'),
    startAt(userInput.toLowerCase()),
    // https://stackoverflow.com/questions/46460825/firebase-querying-with-partial-string-match
    endAt(`${userInput.toLowerCase()}\uf8ff`),
  );
  const usersByUsername = await UserTable.query(
    orderBy<UserDocument>('username'),
    startAt(userInput.toLowerCase().trim()),
    // https://stackoverflow.com/questions/46460825/firebase-querying-with-partial-string-match
    endAt(`${userInput.toLowerCase().trim()}\uf8ff`),
  );

  const users = unionBy(usersBySearchName, usersByUsername, user => user.id);
  return Promise.all(users.map(async value => ({
    ...value,
    avatar: await getAvatar(value?.profile_image),
  })));
}


export const updateUserInfo = (
  uid : string,
  update : Partial<UserDocument>) => {

  const docRef = doc(db, Collections.Users, uid);
  return setDoc(docRef, update, { merge: true });
};

export const updateUserPrivateInfo = (
  uid : string,
  update : Partial<PrivateUserDocument>) => {

  const docRef = doc(db, Collections.UsersPrivate, uid);
  return setDoc(docRef, update, { merge: true });
};

export function markUserVisited(uid: string, other: string) {
  const docRef = doc(db, Collections.Users, uid, Collections.Network, other);
  //Update other user they are being followed by this user
  return setDoc(docRef, { last_visited: Timestamp.now() }, { merge: true });
}

//TODO consider merging getFollowingCount and getLikesCount
export function getLikesCount(uid: string) {
  const docRef = doc(db, Collections.Network, uid);
  return getDoc(docRef).then((document) => {
    if (document.exists()) {
      let docData = document.data() as NetworkDocument;
      return docData?.likes_count || 0;
    }
    return 0;
  });
}


export function getFollowingCount(uid: string) {
  const docRef = doc(db, Collections.Network, uid);
  return getDoc(docRef).then((document) => {
    if (document.exists()) {
      let docData = document.data() as NetworkDocument;
      return docData?.following_count || 0;
    }
    return 0;
  });
}


export function getFollowerCount(uid: string) {
  const docRef = doc(db, Collections.Network, uid);
  return getDoc(docRef).then((document) => {
    if (document.exists()) {
      let docData = document.data() as NetworkDocument;
      return docData?.followed_count || 0;
    }
    return 0;
  });
}

export async function setFollowUser(uid: string, other:string, follow: boolean) {
  const docRef = doc(db, Collections.Network, uid, Collections.Following, other);
  markUserVisited(uid, other);
  if (follow) {
    logEvent(EventMessages.User.StartedFollowing);
  } else {
    logEvent(EventMessages.User.StopFollowing);
  }
  let followUpdate : FollowDocument = {
    uid: other,
    follow: follow,
    last_update: Timestamp.now(),
  };
  return setDoc(docRef, followUpdate, { merge: true });
}

export function isFollowing(uid: string, other: string) {
  const docRef = doc(db, Collections.Network, uid, Collections.Following, other);
  return getDoc(docRef).then((document) => {
    if (document.exists()) {
      let docData = document.data() as FollowDocument;
      return docData?.follow ? true : false;
    }
    return false;
  });
}

//TODO this has the potential to be expensive. If someone has 100,000 following, we'll incure $0.06 every time this is hit
// Might need to find a way to aggregate this
export async function getAllFollowedIds(uid: string, getFollowing: boolean = false) {
  const followCollection = getFollowing ? Collections.Followed : Collections.Following;

  const collectionRef = collection(db, Collections.Network, uid, followCollection);
  const q = query(collectionRef, where('follow', '==', true));
  const matches: Array<string> = [];
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((d) => {
    matches.push(d.id);
  });
  return matches;
}

export async function getAllFollowingIds(uid: string) {
  return getAllFollowedIds(uid, true);
}

export async function getAllRecentIds(uid: string) {
  const collectionRef = collection(db, Collections.Users, uid, Collections.Network);
  const q = query(collectionRef, orderBy('last_visited', 'desc'), limit(10));
  const matches: Array<string> = [];
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((d) => {
    matches.push(d.id);
  });
  return matches;
}

export const getAllFollowedUsers = async (uid: string, getFollowing: boolean = false) => {
  const idList = getFollowing ? await getAllFollowingIds(uid) : await getAllFollowedIds(uid);
  const userList = idList.map((value) => {
    return getUserById(value);
  });
  //Remove nulls
  const filteredList = await Promise.all(userList).then((list) => {
    return list.filter((a) => a);
  });
  return filteredList as Array<User>;
};

export const getAllFollowingUsers = async (uid: string) => {
  return getAllFollowedUsers(uid, true);
};

export const getAllRecentUsers = async (uid: string) => {
  const idList = await getAllRecentIds(uid);
  const userList = idList.map((value) => {
    return getUserById(value);
  });
  //Remove nulls
  const filteredList = await Promise.all(userList).then((list) => {
    return list.filter((a) => a);
  });
  return filteredList as Array<User>;
};


export const getWhereMember = async (userId : string) : Promise<WithId<MemberDocument>[]> => {
  const collectionRef = collection(db, Collections.Users, userId, Collections.Memberships);
  const q = query(collectionRef, where('role', '>=', PermissionsType.Members));
  const matches: Array<WithId<MemberDocument>> = [];
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((d) => {
    const docData = d.data() as MemberDocument;
    matches.push({
      ...docData,
      id: d.id,
    });
  });
  return matches;
};

/** Subscribes to status updates starting at this time */
// TODO add a filter for only users currently tracking
export const subscribeToStatusChanges = async (
  callback: (updates: Map<string, OnlinePresence>) => void) => {
  const collectionRef = collection(db, Collections.Status);
  const q = query(collectionRef, where('online_last_update', '>=', Timestamp.now()));
  return onSnapshot(q, (querySnapshot) => {
    const userUpdates = new Map<string, OnlinePresence>();
    querySnapshot.forEach((d) => {
      const docData = d.data() as StatusDocument;
      userUpdates.set(d.id, docData.online);
    });
    callback(userUpdates);
  });

};

export async function getUser(userId: string) {
  const userDoc = await UserTable.getWithId(userId);
  const avatar = await getAvatar(userDoc?.profile_image);
  const memberships = await getWhereMember(userId);
  const following = await getAllFollowedIds(userId);
  return {
    ...userDoc,
    avatar,
    memberships,
    following_list: following,
  } as Omit<User, 'isFetched' | 'isLoggedIn' | 'isWelcomed'>;
}

export async function blockUser(myUserId: string, otherUserId: string, value: boolean) {
  const docRef = doc(db, Collections.Users, myUserId, Collections.Network, otherUserId);
  setDoc(docRef, { blocked: value });
}

export async function isBlocked(myUserId: string, otherUserId: string){
  const docRef = doc(db, Collections.Users, myUserId, Collections.Network, otherUserId);
  const netDoc = await getDoc(docRef);
  const docData = netDoc.data();
  return docData?.blocked || false;
}

export async function getAllBlocked(myUserId: string){
  const collectionRef = collection(db, Collections.Users, myUserId, Collections.Network);
  const q = query(collectionRef, where('blocked', '==', true));
  const matches = new Map<string, boolean>();
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((d) => {
    matches.set(d.id, true);
  });
  return matches;
}

export default class {
  subscribeConversations() {
    console.log('NOOP');
  }
  subscribeConvoMessages() {
    console.log('NOOP');
  }
  newConversation() {
    console.log('NOOP');
  }
}
