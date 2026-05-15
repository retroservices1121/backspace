// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { MediaUse } from '@prisma/client';
import { mediaToURL } from '@src/api2/storage';
import { useModal } from '@src/lib/Modal';
import { FollowBody } from '@src/pages/api/follow';
import { LikeBody } from '@src/pages/api/like';
import { PostBody } from '@src/pages/api/post';
import { communityActions } from '@src/store/community/slice';
import { prependPost, removePostFromFeed, updatePostInFeed } from '@src/store/feedSlice';
import { selectFollow, selectMembership } from '@src/store/post/selectors';
import { clearPost, setPost, updatePost } from '@src/store/postSlice';
import { RootState, useAppDispatch, useAppSelector } from '@src/store/store';
import { PostFormState } from '@src/types/post';
import { CreateMediaBody } from '@src/types/requests/media';
import { getFileExtension } from '@src/utils/common_utils';
import { Modals } from '@src/utils/constants';
import copy from 'copy-to-clipboard';
import { useRouter } from 'next/router';

import { mediaStorage } from 'lib/media';
import { Post } from 'types/prisma';

import useAsyncEffect from './useAsyncHook';
import { useAxios } from './useAxios';
import useUser from './useUser';

/**
 * 
 * @param post post object from prisma models
 * @param fetchURLs whether media URLs should be fetched 
 * @returns lots of useful things
 */

export default function usePost(post: Post, fetchURLs: boolean = false) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useUser();
  const axios = useAxios();
  const postModal = useModal(Modals.PostViewer);
  const createPostModal = useModal(Modals.CreatePost);
  /** Match post to memberships */
  const membership = selectMembership(post?.message?.communityId);
  /** Match post author to follows */
  const follow = selectFollow(post?.authorId);
  const [mediaURL, setMediaURL] = useState<string[]>([]);
  //With current design, only my likes should be in post.likes
  const [isLiked, setIsLiked] = useState<boolean>(post?.likes && post.likes.length > 0);
  const [isFollowing, setIsFollowing] = useState<boolean>(follow);

  const update = async (formData: PostFormState) => {
    const changes : PostBody = {
      ...formData,
      id: post.id,
    };
    const { status, data } = await axios.put('post', changes);
    if (status === 200) {
      dispatch(updatePost(data)); //update so the user sees the update
      // Also mirror into the feed list so the inline post row updates
      // without a refresh.
      dispatch(updatePostInFeed(data));
      return true;
    } else {
      return false;
    }
  };

  const createPost = async (formData: PostFormState, media: File) => {
    const ms = mediaStorage(MediaUse.POST);
    let mediaId = undefined;
    if (media && media instanceof File) {
      const result = await ms.uploadFile(media, user.uuid);
      if (result.ok) {
        const newMedia : CreateMediaBody = {
          type: MediaUse.POST,
          host: ms.host,
          path: result.path,
          fileExtension: getFileExtension(media),
        };
        const { data } = await axios.post('media', newMedia);
        mediaId = data?.id;
      }
    }
    const newPost : PostBody = {
      ...formData, 
      mediaId: mediaId,
    };
    const { status, data } = await axios.post('/post', newPost);
    if (status === 200) {
      // Optimistically push the new post to the top of every loaded
      // feed bucket so the user sees their post without a refresh.
      if (data) {
        dispatch(prependPost(data));
        // Community posts also live as a Message inside a channel — if
        // the user has that channel loaded, mirror the message into it
        // so the channel view doesn't go stale.
        if (data.message) dispatch(communityActions.appendChannelMessage(data.message));
      }
      return true;
    } else {
      return false;
    }
  };

  const findLike = async () => {
    return axios.get(`like?postId=${post.id}&userId=${user?.id}`);
  };

  /** Adds post query to URI */
  const updateURIQuery = (uuid: string) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, post: `${uuid}` },
    }, 
    undefined, { shallow: true },
    );
  };

  /** Removes post query from URI */
  const clearURIQuery = () => {
    const newQuery = router.query;
    delete newQuery.post;
    router.push({
      pathname: router.pathname,
      query: newQuery,
    }, 
    undefined, { shallow: true },
    );
  };

  /** Opens current post with postviewer */
  const openPost = () => {
    dispatch(setPost(post));
    updateURIQuery(post.uuid);
    postModal.open();
  };

  const editPost = () => {
    dispatch(setPost(post));
    updateURIQuery(post.uuid);
    createPostModal.open();
  };

  /** Closes and clears current postviewer */
  const closePost = () => {
    dispatch(clearPost());
    clearURIQuery();
    postModal.close();
  };

  const deletePost = async () => {
    const { status } = await axios.delete(`/post?id=${post.id}`);
    if (status === 200) {
      dispatch(removePostFromFeed(post.id));
      toast.info('Post deleted');
      return true;
    } else {
      toast.error('Delete failed');
      return false;
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/?post=${post.uuid}`;
    const shareData = {
      title: 'Check out this post on backspace',
      text: post.title,
      url: url,
    };

    try { //https only, so wrap in try/catch
      await navigator.share(shareData);
    } catch (err) {
      console.warn(err);
      copy(url);
      toast.info('Link copied to clipboard');
    }
  };

  const setLike = (value: boolean = !isLiked) => {
    setIsLiked(value); //Assume positive
    const likeBody : LikeBody = {
      postId: post.id,
      authorId: post.authorId,
      like: value,
      userId: user.id,
    };

    axios.put('like', likeBody);
  };

  const setFollow = (value: boolean = true) => {
    setIsFollowing(value); //Assume positive
    const followBody : FollowBody = {
      accountId: post.authorId,
      userId: user.id,
      follow: value,
    };

    axios.put('follow', followBody);
  };

  //TODO this can be optimized
  //fetch like if likes are not on the post
  // useAsyncEffect([myUser?.user?.id], async () => {
  //   if (post?.id && myUser?.user?.id && isLiked === undefined) {
  //     const { data: like } = await findLike();
  //     setIsLiked(like || false);
  //   }
  // });

  //Get urls from post media
  useAsyncEffect([post.media], async () => {
    if (post.media && fetchURLs) {
      let urls : string[] = [];
      for (const media of post.media) {
        const url = await mediaToURL(media);
        if (url) {
          urls.push(url);
        }
      }
      setMediaURL(urls);
    }
  });

  //If props change, reset state variables
  useEffect(() => {
    setIsLiked(post.likes && post.likes.length > 0);
    setIsFollowing(follow);
    setMediaURL([]);
  }, [post.id]);

  return {
    post,
    /** Array of media urls, only populated if fetchURLs is true */
    mediaURL,
    
    /** Display value for if post is liked */
    isLiked,
    /** Display value for if author of post is followed */
    isFollow: isFollowing,
    /** membership level of post */
    membership,

    setLike,
    setFollow,
    share,
    open: openPost,
    edit: editPost,
    close: closePost,
    delete: deletePost,
    update: update,
    create: createPost,
  };

}
