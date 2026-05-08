// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { toast } from 'react-toastify';

import useUser from 'hooks/useUser';
import axios from 'lib/axios';
import { pushComment } from 'store/postSlice';
import { useAppDispatch } from 'store/store';

/**
 * NOTE: ONLY DESIGNED TO BE USED IN POSTVIEWER RIGHT NOW
 * @param post requires a post object for reference
 * @returns 
 */
export default function useComment(postId: bigint) {
  const dispatch = useAppDispatch();
  const { user } = useUser();

  const addComment = async (text: string) => {
    if (postId && text) {
      const { status, data } = await axios().post('/comment', {
        postId,
        text,
      });
      if (status >= 300) toast.error('Failed to add comment');
      else {
        //Add user info to new comment so we see an avatar and such
        const newComment = { ...data, author: user };
        dispatch(pushComment(newComment)); //Adds comment to PostPreview
      }
    } else { //TODO enhance error case
      toast.error('Cannot submit comment.');
    }
  };
  /** Untested */
  const deleteComment = async (id: bigint) => {
    if (postId && id) {
      const { status } = await axios().delete('/comment?id=${bigint}');
      if (status >= 300) toast.error('Failed to delete comment');
      else toast.info('Comment deleted');
    } else { //TODO enhance error case
      toast.error('Cannot delete comment.');
    }
  };

  return {
    add: addComment,
    delete : deleteComment,
  };

}
