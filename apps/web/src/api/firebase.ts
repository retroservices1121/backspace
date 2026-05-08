// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { toast } from 'react-toastify';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy as fireOrderBy,
  OrderByDirection,
  PartialWithFieldValue,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
  setDoc,
  Timestamp,
  updateDoc,
  where as fireWhere,
  WhereFilterOp,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import logEvent, { EventMessages } from 'lib/events';
import { Collections, MediaType, WithId } from 'types/documents';

const db = getFirestore();
const storage = getStorage();

// Are you annoyed firebase doesn't let you map collections?
// Well fear not citizen of this codebase, for I have a helper for you!

// The Return = any generic gives this function dynamic type inferrence.
// docArray will be an array of whatever types the mapper returns.
const MAX_BYTES = 10000000;
const MAX_VIDEO_BYTES = 1000000000;

type Falsey = false | undefined | null;


type MapTransform<R> = (element: QueryDocumentSnapshot<DocumentData>) => R;

/**
 * Used for mapping over firebase document collections.
 *
 * Should the mapper return a falsey value, that item will not be part of the final array.
 */
export function mapCollection<Return = any, DocType = DocumentData>(
  snapshot: QuerySnapshot<DocType>,
  mapper: MapTransform<Return | Falsey>,
) {
  const docArray : Return[] = [];
  snapshot.forEach((document) => {
    const data = mapper(document);
    if (data) docArray.push(data);
  });
  return docArray;
}

export const paths = {
  // FireStore
  posts: (
    community: string, channel: string,
  ) => `${Collections.Communities}/${community}/${Collections.Channels}/${channel}/${Collections.Posts}/`,
  comments: (
    community: string, channel: string, postId: string,
  ) => `${Collections.Communities}/${community}/${Collections.Channels}/${channel}/${Collections.Posts}/${postId}/${Collections.Comments}`,
  post: (
    community: string, channel: string, postId: string,
  ) => `${Collections.Communities}/${community}/${Collections.Channels}/${channel}/${Collections.Posts}/${postId}`,
  like: (
    community: string, channel: string, postId: string, uid: string,
  ) => `${Collections.Communities}/${community}/${Collections.Channels}/${channel}/${Collections.Posts}/${postId}/${Collections.Likes}/${uid}`,
  // eslint-disable-next-line
  updateDoc(id: string, state: Partial<import('types/documents').CommunityDocument>) {
    throw new Error('Method not implemented.');
  },
  notificationAll: (
    userId: string,
  ) => `${Collections.Notifications}/${userId}/${Collections.All}/`,
  notification: (
    userId: string,
  ) => `${Collections.Notifications}/${userId}/${Collections.Communities}/`,
  // Storage
  postMedia: (
    community: string, channel: string, fileName: string,
  ) => `${Collections.Communities}/${community}/${Collections.Channels}/${channel}/${uuidv4()}_${fileName}`,
  // We'll just omit the extension for consistency and easy replace old. #FUF
  // The browser will manage to figure out the type based on mimetype.
  communityProfile: (
    communityId: string,
  ) => `${Collections.Communities}/${communityId}/profilePic`,
  communityCover: (
    communityId: string,
  ) => `${Collections.Communities}/${communityId}/coverPic`,
  premiumTiers: (
    communityId: string,
  ) => `${Collections.Communities}/${communityId}/${Collections.PremiumTiers}/`,
  communityMembers: (
    communityId: string,
  ) => `${Collections.Communities}/${communityId}/${Collections.Members}/`,
  userMembership: (
    userId: string,
  ) => `${Collections.Users}/${userId}/${Collections.Members}`,
  channel: (
    communityId: string,
  ) => `${Collections.Communities}/${communityId}/${Collections.Channels}/`,
  follow: (
    userId: string,
  ) => `${Collections.Network}/${userId}/${Collections.Followed}/`,
  dms: (
    userId: string,
  ) => `${Collections.Users}/${userId}/${Collections.DirectMessages}`,
};

// Why does this exist? Just fucking give me the stuff
export class FireDB<DocType> {
  static Timestamp = Timestamp;
  constructor(private collectionPath: Collections | string) {}

  async get(id: string) {
    const docRef = doc(db, this.collectionPath, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as DocType : null;
  }

  async getWithId(id: string) {
    const docRef = doc(db, this.collectionPath, id);
    const document = await getDoc(docRef);
    if (document.exists()) {
      return {
        ...document.data(),
        id: document.id,
      } as WithId<DocType>;
    }

    return null;
  }

  async getAll() {
    const result = await getDocs(collection(db, this.collectionPath));
    return mapCollection<DocType>(result, row => row.exists() && row.data() as DocType);
  }

  async getAllWithId() {
    const result = await getDocs(collection(db, this.collectionPath));
    return mapCollection<WithId<DocType>>(result, row => row.exists() && {
      ...row.data() as DocType,
      id: row.id,
    });
  }

  /**
   * Perform a transform on every document of a collection.
   *
   * Supports an async transform for optimizing with promise.all
   *
   * NOTE: Theres no joinWithId as join always includes the ids in the `data` passed to the callback.
   */
  async join<UnionType = any>(transform: (data: DocType) => Promise<UnionType | Falsey>) {
    const result = await getDocs(collection(db, this.collectionPath));
    // @ts-ignore Fuck off typescript. This works. And its also optimized.
    // Basically, typescript didn't believe me that mapCollection's transform is allowed to return Falsey
    // However for some reason those Falseys were leaking out to the `unions[]` even though mapCollection has a filter
    const unions = mapCollection<UnionType>(result, row => {
      if (row.exists()) {
        const data = row.data() as DocType;
        return transform(data);
      }
    });

    return Promise.all(unions);
  }

  async query(...queryConstraint: QueryConstraint[]) {
    const matches: DocType[] = [];
    const q = query(collection(db, this.collectionPath), ...queryConstraint);
    const result = await getDocs(q);
    result.forEach(row => row.exists() && matches.push(row.data() as DocType));

    return matches;
  }

  async queryWithId(...queryConstraint: QueryConstraint[]) {
    const matches: WithId<DocType>[] = [];
    const q = query(collection(db, this.collectionPath), ...queryConstraint);
    const result = await getDocs(q);
    result.forEach(row => row.exists() && matches.push({
      ...row.data(),
      id: row.id,
    } as WithId<DocType>));

    return matches;
  }

  async subscribeQuery(queryConstraint: QueryConstraint[], callback: (update: DocType []) => void) {
    const q = query(collection(db, this.collectionPath), ...queryConstraint);
    const unsubcribe = await onSnapshot(q, async (result) => {
      const matches: DocType[] = [];
      result.forEach(row => row.exists() && matches.push(row.data() as DocType));
      callback(matches);
    });

    return unsubcribe;
  }

  /**
   * Adds a document to a collection
   * @param setId if true, updates the document with the id of the document
   */
  async addDoc(data: DocType, setId?: boolean) {
    const collectionRef = collection(db, this.collectionPath);
    const document = await addDoc(collectionRef, data);
    if (setId) {
      updateDoc(document, { id: document.id });
    }
    return document;
  }

  /**
   * Add a document with a specific Id to a collection
   */
  async setDoc(data: DocType, id: string) {
    const docRef = doc(db, this.collectionPath + id);
    return setDoc(docRef, data, { merge: true });
  }

  /**
   * Basically, firebase specifically wants null instead of undefined for missing properties on partials
   *
   * But Typescript is neater when we use undefined, so this lets us use undefined.
   * */
  private sanitizeUpdate<T = any>(data: T ) : T {
    const newUpdate: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        newUpdate[key] = null;
      } else {
        newUpdate[key] = value;
      }
    }
    return newUpdate as T;
  }

  async updateDoc(id: string, update: PartialWithFieldValue<DocType>) {
    const docRef = doc(db, this.collectionPath, id) as DocumentReference<DocType>;
    return setDoc(docRef, this.sanitizeUpdate(update), { merge: true });
  }

  async deleteDoc(id: string) {
    const docRef = doc(db, this.collectionPath, id) as DocumentReference<DocType>;
    const response = await deleteDoc(docRef);
    return response;
  }

  async getMeta<MetaType>() {
    const docRef = doc(db, this.collectionPath, 'meta');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as MetaType : null;
  }
}

class FireStorage {
  determineType(file: File) {
    if (file.type.includes('image')) {
      return MediaType.Image;
    } else if (file.type.includes('video')) {
      return MediaType.Video;
    } else { //TODO add error?
      return MediaType.None;
    }
  }

  async getDownloadURL(storagePath: string) {
    return getDownloadURL(ref(storage, storagePath));
  }

  async uploadFile(storagePath: string, file: File) {
    logEvent(EventMessages.Media.MediaUpload, { size: file.size, type: file.type });
    const isVideo = file.type.toString().includes('video');

    if (file.size > MAX_BYTES && !isVideo) {
      throw new Error('File cannot be larger than 10 MB');
    }
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      throw new Error('Video cannot be larger than 1 GB');
    }

    const storageRef = ref(storage, storagePath);
    const result = await uploadBytes(storageRef, file).catch((e) => {
      console.error(e);
      toast.error('Media failed to upload');
      throw new Error('Issue Uploading Media');
    } );
    if (result) {
      console.log(`Uploaded Media: ${result.metadata.name}`);
      return this.determineType(file);
    } else {
      return MediaType.None;
    }
  }
}

export const fireStorage = new FireStorage();

/* These functions add handy type checking for field names */

export function where<DocType>(fieldPath: keyof DocType, opStr: WhereFilterOp, value: unknown) {
  // @ts-ignore I'm not entirely sure how to tell fireWhere that a key of DocType is a string. I don't use keyof enough
  return fireWhere(fieldPath, opStr, value);
}

export function orderBy<DocType>(fieldPath: keyof DocType, directionStr?: OrderByDirection) {
  // @ts-ignore I'm not entirely sure how to tell fireWhere that a key of DocType is a string. I don't use keyof enough
  return fireOrderBy(fieldPath, directionStr);
}
