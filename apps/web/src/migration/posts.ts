// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { MediaUse, Prisma, StorageLocation } from '@prisma/client';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

import { upsertComment } from 'api2/comment';
import { createMedia } from 'api2/media';
import { createPost, findPostByFbId, updatePost, upsertPost } from 'api2/post';
import { upcertPostLike } from 'api2/postLike';
import { Collections, CommentDocument, LikeDocument, PostDocument, WithId } from 'types/documents';
import { db } from 'utils/firebaseClient';

/**
 * Clone posts from firebase to primsa DB. Note, this has poor feedback in the console when it is done. 
 * 
 */
export async function ClonePosts() {
  // Copy user's public data to supabase
  const postsRef = collection(db, Collections.Posts_All);
  const postsSnap = await getDocs(postsRef);
  const postArray : Array<PostDocument> = [];
  postsSnap.forEach(async (postSnap) => { //we do this so we avoid forEach
    const postData = postSnap.data() as PostDocument;
    postArray.push({ ...postData, id: postSnap.id });
  });
  
  for (const post of postArray) {
    let onProfile = false;
    if (post.community === post.channel) onProfile = true;
    const supaPost : Prisma.PostCreateInput = {
      title: post.title,
      text: post.text,
      fbid: post.id,
      author: {
        connect: {
          authId: post.sender,
        },
      },
      profile: onProfile ? {
        connect: {
          authId: post.sender,
        },
      } : undefined,
      message: !onProfile ? {
        create: {
          text: post.text,
          author: {
            connect: {
              authId: post.sender,
            },
          },
          community: {
            connect: {
              fbid: post.community,
            },
          },
          channel: {
            connect: {
              fbId: post.channel,
            },
          },
        },
      } : undefined,
    };
    let foundPost =  await findPostByFbId(post.id);
    if (foundPost) {
      await updatePost(foundPost.id, supaPost);
    } else {
      foundPost = await createPost(supaPost) || null;
      if (foundPost && post.media) { //Only add media to new posts we created
        const supaMedia : Prisma.MediaCreateInput = {
          type: MediaUse.POST,
          host: post.media ? StorageLocation.FIREBASE : StorageLocation.NONE,
          path: post.media,
          fileExtension: post.media.split('.').pop() || '',
          post: {
            connect: {
              id: foundPost.id,
            },
          },
        };
        createMedia(supaMedia);
      } else if (!foundPost) {
        console.error('Failed to upsert Post');
        continue;
      }
    }
    //Clone Comments
    const commentRef = collection(db, Collections.Communities, post.community, Collections.Channels, post.channel, Collections.Posts, post.id, Collections.Comments);
    const commentSnap = await getDocs(commentRef);
    const commentArray : Array<WithId<CommentDocument>> = [];
    commentSnap.forEach(each => {
      const commentData = each.data() as CommentDocument;
      commentArray.push({ ...commentData, id: each.id });
    });
    for (const each of commentArray) {
      const supaComment : Prisma.CommentCreateInput = {
        createdAt: (each.last_updated as Timestamp).toDate(),
        fbid: `${each.sender}_${each.postId}`, 
        post: {
          connect: {
            id: foundPost.id,
          },
        },
        author: {
          connect: {
            authId: each.sender,
          },
        },
        text: each.text,
        edited: each.edited,
      };
      upsertComment(each.id, supaComment);
    }
    //Clone Likes
    const likesRef = collection(db, Collections.Communities, post.community, Collections.Channels, post.channel, Collections.Posts, post.id, Collections.Likes);
    const likeSnap = await getDocs(likesRef);
    const likeArray : Array<LikeDocument> = [];
    likeSnap.forEach(each => {
      const likeData = each.data() as LikeDocument;
      likeArray.push({ ...likeData });
    });
    for (const each of likeArray) {
      if (!each.like) continue;
      const supaLike : Prisma.PostLikeCreateInput = {
        fbid: `${each.uid}_${post.id}`,
        post: {
          connect: {
            id: foundPost.id,
          },
        },
        postOwner: {
          connect: {
            id: foundPost.authorId,
          },
        },
        user: {
          connect: {
            authId: each.uid,
          },
        },
      };
      upcertPostLike(`${each.uid}_${post.id}`, supaLike, supaLike);
    }
    
    
    
  }
  console.log('Done cloning posts');

  return; 
}