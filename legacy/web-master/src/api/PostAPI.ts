// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Database/Server Interface for Media Posts

import { toast } from 'react-toastify';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, startAfter, Timestamp, where } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import placeholderProfile from 'graphics/placeholders/1.png';
import logEvent, { EventMessages } from 'lib/events';
import { memoizeAsync } from 'lib/memo';
import { Collections, CommentDocument, LikeDocument, MediaType, MemberDocument, MessageType, PermissionsType, PostDocument, WithId } from 'shared/types/documents';
import { User } from 'store/userSlice';
import { Sort } from 'types/feed';
import { db } from 'util/firebase';

import { FireDB, fireStorage, paths } from './firebase';
import { getMediaUrl } from './mediaAPI';
import { memoizedGetUser } from './userAPI';



const postsCollection = new FireDB<PostDocument>(Collections.Posts_All);
const discoverCollection = new FireDB<PostDocument>(Collections.Discover);

export type PostConfig = {
  disable_comments: boolean
};

export type PostUnion = PostDocument & {
  author: User;
  mediaURL: string;
};

export type CommentUnion = CommentDocument & {
  author: User;
};

const getMemoizedMedia = memoizeAsync<string>(getMediaUrl);

async function getPostDocumentsByQuery(matchList: string[] = [], sorting: Sort = Sort.Discover, count: number = 20, lastPostId: string = '') {
  let posts : WithId<PostDocument>[] = [];
  switch (sorting){

      

    case Sort.Memberships: 
      if (lastPostId?.length > 0) {
        const lastPost = await getDoc(doc(db, Collections.Posts_All, lastPostId));
        posts = await postsCollection.queryWithId(
          where('community', 'in', matchList),
          orderBy('timestamp', 'desc'),
          startAfter(lastPost),
          limit(count),
        );
      } else {
        posts = await postsCollection.queryWithId(
          where('community', 'in', matchList),
          orderBy('timestamp', 'desc'),
          limit(count),
        );
      }
      break;
    case Sort.Profile:
      if (lastPostId?.length > 0) {
        const lastPost = await getDoc(doc(db, Collections.Posts_All, lastPostId));
        posts = await postsCollection.queryWithId(
          //This is a hack to use matchList[0] instead of a new method
          where('community', '==', matchList[0]),
          where('channel', '==', matchList[0]),
          orderBy('timestamp', 'desc'),
          startAfter(lastPost),
          limit(count),
        );
      } else {
        posts = await postsCollection.queryWithId(
          where('community', '==', matchList[0]),
          where('channel', '==', matchList[0]),
          orderBy('timestamp', 'desc'),
          limit(count),
        );
      }
      break;

    case Sort.Following:
      if (lastPostId?.length > 0) {
        const lastPost = await getDoc(doc(db, Collections.Posts_All, lastPostId));
        posts = await postsCollection.queryWithId(
          where('sender', 'in', matchList),
          orderBy('timestamp', 'desc'),
          startAfter(lastPost),
          limit(count),
        );
      } else {
        posts = await postsCollection.queryWithId(
          where('sender', 'in', matchList),
          orderBy('timestamp', 'desc'),
          limit(count),
        );
      }
      break;
    //Expect fallthrough
    //@ts-ignore
    case Sort.Discover:
      if (lastPostId?.length > 0) {
        const lastPost = await getDoc(doc(db, Collections.Discover, lastPostId));
        try { //If not enough discover posts, allows us to fill with recent
          posts = await discoverCollection.queryWithId(
            orderBy('timestamp', 'desc'),
            startAfter(lastPost),
            limit(count),
          );
        } catch (error) {
          console.warn('could not index off of discover post');
        }
      } else {
        posts = await discoverCollection.queryWithId(
          orderBy('timestamp', 'desc'),
          limit(count),
        );
      }
      if (posts.length >= count) {
        break;
      }
    case Sort.Recent:
    default:
      if (lastPostId?.length > 0) {
        const lastPost = await getDoc(doc(db, Collections.Posts_All, lastPostId));
        posts = posts.concat(
          await postsCollection.queryWithId(
            orderBy('timestamp', 'desc'),
            startAfter(lastPost),
            limit(count),
          ));
      } else {
        posts = posts.concat(
          await postsCollection.queryWithId(
            orderBy('timestamp', 'desc'),
            limit(count),
          ));
      }
      break;
  }
  const postList = new Map<string, boolean>();
  posts = posts.filter((post) => {
    if (postList.get(post.id)) {
      return false;
    } else {
      postList.set(post.id, true);
      if ((sorting === Sort.Discover) && post.hidden) { //Filter on Discover posts
        return false;
      } else {
        return true;
      }
    }
  });
  return posts;
}


export async function getPostByID(id: string) {
  const post = (await postsCollection.getWithId(id));

  if (post) {
    const author = await memoizedGetUser(post.sender);
    if (author) {
      const postWithAuthor = {
        ...post,
        mediaURL: post.media ? await getMediaUrl(post.media) : '',
        author: {
          ...author,
          avatar: author.profile_image ? await getMediaUrl(author.profile_image) : placeholderProfile,
        },
      };
      return postWithAuthor;
    }
  }
}

//Common post processing
const processPosts = async ( documents : WithId<PostDocument>[], memberships: WithId<MemberDocument>[] = []) => {
  const posts: PostUnion[] = [];
  //Build a map for quick lookups
  const membershipMap = new Map<string, PermissionsType>();
  memberships.forEach((membership) => {
    membershipMap.set(membership.id, membership.role);
  });
  for (const post of documents) {
    // Determine if you should have access using memberships
    let sufficientPermission = false;
    const postMembership = membershipMap.get(post.community);
    // Permissions for everyone
    if (!post.permission_required || post.permission_required <= PermissionsType.Members) sufficientPermission = true;
    // Permissions for restricted posts
    else if (postMembership && (postMembership >= post.permission_required)) sufficientPermission = true;

    if (sufficientPermission) {
      const author = await memoizedGetUser(post.sender);
      if (author) {
        posts.push({
          ...post,
          mediaURL: post.media && await getMemoizedMedia(post.media) || '',
          author: author,
        });
      }
    }
  }
  return posts;
};

export async function getPosts(matchList: string[] = [], sorting: Sort = Sort.Discover, memberships: WithId<MemberDocument>[] = [], count?: number, lastPostId?: string ) {
  //Firebase has a max array match list of 10, work around this
  //FIXME this is garbage, but keeps the app working. We need a better database than firestore
  let miniMatchList = matchList.slice(0, 10);
  let documents = await getPostDocumentsByQuery(miniMatchList, sorting, count, lastPostId);
  try {
    return await processPosts(documents, memberships);
  } catch (error) {
    console.error(error);
    return [];
  }
  
}

export async function getMorePosts(lastPostId: string, matchList: string[] = [], sorting: Sort = Sort.Discover, memberships: WithId<MemberDocument>[] = [], count: number = 20) {
  if (lastPostId) {
    return getPosts(matchList, sorting, memberships, count, lastPostId);
  } else {
    return [];
  }
}

export type CreatePostType = Pick<PostDocument, 'text' | 'title' | 'disable_comments' | 'permission_required' | 'community' | 'channel'>;
export async function createPost(post: CreatePostType, user: User, mediaFile?: File) {
  logEvent(EventMessages.Posts.NewPost);
  let mediaPath = '';
  let typeofMedia = MediaType.None;

  if (mediaFile) {
    mediaPath = paths.postMedia(
      post.community,
      post.channel,
      `${mediaFile.name}`,
    );
    try {
      typeofMedia = await fireStorage.uploadFile(mediaPath, mediaFile).catch((e) => {
        throw e;
      });

    } catch (error) {
      toast.error('Media size too large.');
      return;
    }
  }

  const channelPostTable = new FireDB<PostDocument>(paths.posts(post.community, post.channel));
  await channelPostTable.addDoc({
    channel: post.channel,
    community: post.community,
    media: mediaPath,
    timestamp: Timestamp.now(),
    type: MessageType.Post,
    media_type: typeofMedia,
    sender: user.id,
    text: post.text,
    title: post.title,
    disable_comments: post.disable_comments,
    permission_required: post.permission_required,
    likes: 0,
    comments: 0,
  });
  toast.success('Post Created!');
}

type UpdatePostType = Omit<CreatePostType, 'community' | 'channel'>;
export async function updatePost(postId: string, collectionPath: string, post: UpdatePostType) {
  const PostTable = new FireDB<PostDocument>(collectionPath);
  PostTable.updateDoc(postId, post);
}


export function likePost(uid: string, post: PostDocument, like: boolean = true) {
  if (!uid || !post || !post.id) {
    toast.error('Error liking post');
    return null;
  }
  if (like) {
    logEvent(EventMessages.Posts.LikePost);
  } else {
    logEvent(EventMessages.Posts.UnlikePost);
  }
  let updateLike : LikeDocument = {
    uid: uid,
    like: like,
    last_update: Timestamp.now(),
  };
  const docPath = doc(db, paths.like(post.community, post.channel, post.id, uid));
  return setDoc(docPath, updateLike, { merge : true });
}

export async function getMyLike(uid: string, post: PostDocument) : Promise<boolean> {
  if (!uid || !post || !post.id) {
    toast.warn('Could not fetch like');
    return false;
  }

  const docPath = doc(db, paths.like(post.community, post.channel, post.id, uid));
  return getDoc(docPath).then((document) => {
    if (document.exists()) {
      const docData = document.data() as LikeDocument;
      return docData.like ? true : false;
    } else {
      return false;
    }
  });
}

type CreateComment = Omit<CommentDocument, 'edited' | 'last_updated' | 'creation'>;
export async function createComment(
  comment: CreateComment,
  community: string,
  channel: string) {

  logEvent(EventMessages.Posts.NewComment);
  const collectionPath = paths.comments(community, channel, comment.postId);
  const collectionRef = collection(db, collectionPath);
  try {
    await addDoc(collectionRef, {
      ...comment,
      edited: false,
      last_updated: Timestamp.now(),
      creation: Timestamp.now(),
    });
    return;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const getComments = async (postId: string, community: string, channel: string) : Promise<CommentDocument[]> => {
  const collectionPath = paths.comments(community, channel, postId);
  const collectionRef = collection(db, collectionPath);
  const q = query(collectionRef, orderBy('creation', 'asc'));
  const docSnap = await getDocs(q);
  const comments: Array<CommentDocument> = [];
  docSnap.forEach((d) => {
    const docData = d.data() as CommentDocument;
    comments.push({ id: uuidv4(), ...docData });
  });
  return comments;
};

export const getCommentsWithAuthor = async (postId: string, community: string, channel: string) : Promise<CommentUnion[]> => {
  const commentDocs = (await getComments(postId, community, channel));
  const comments: Array<CommentUnion> = [];
  for (const comment of commentDocs) {
    const author = await memoizedGetUser(comment.sender);
    if (author) {
      comments.push({
        ...comment,
        author: {
          ...author,
          avatar: author.profile_image ? await getMediaUrl(author.profile_image) : placeholderProfile,
        },
      });
    }
  }
  //reverse order since rendered to bottom first
  comments.reverse();
  return comments;
};

export const getPostByPath = async (path: string) => {
  const docRef = doc(db, path);
  let document = await getDoc(docRef);
  if (document.exists()) {
    return document.data() as PostDocument;
  } else {
    return {} as PostDocument;
  }
};
