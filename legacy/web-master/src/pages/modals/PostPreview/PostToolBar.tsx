import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { PencilIcon, TrashIcon } from '@heroicons/react/outline';
import copy from 'copy-to-clipboard';
import Icons from 'icons';

import { MessageUnion } from 'api/communityAPI';
import { getMyLike, likePost, PostUnion } from 'api/PostAPI';
import { IconPlusText } from 'components/MediaPost/styled';
import { PostDocument } from 'shared/types/documents';
import { toggleEditModal } from 'store/appSlice';
import { RootState } from 'store/store';

interface OwnProps {
  post: MessageUnion;
  showDeleteModal: Dispatch<SetStateAction<boolean>>
}

export default function PostToolBar({ post: parentPost, showDeleteModal }: OwnProps) {
  const post = parentPost as PostUnion;
  const dispatch = useDispatch();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(post.likes);
  const uid = useSelector((state: RootState) => state.user.id);

  const actionLikePost = () => {
    const newLike = !isLiked;
    if (likePost(uid, post, newLike)) {
      setIsLiked(newLike);
      //TODO This count is not accurate, but gives the user the illusion their like is immediately showing
      setLikesCount(likesCount + (newLike ? 1 : -1));
    }
  };

  const shareLink = (id: string | undefined) => {
    if (id) {
      const url = `${window.location.origin}/?post=${id}`;
      toast.info('Link copied to clipboard');
      copy(url);
    } else {
      toast.error('unable to copy link to post');
    }
  };

  const likeString = (likes : number) => {
    if (likes === 0) {
      return 'Be the first to like this!';
    } if (likes === 1) {
      return '1 Like';
    }
    // toLocaleString will throw commas in
    return `${likes.toLocaleString()} Likes`;
  };

  //Likes
  useEffect(() => {
    if (post && uid) {
      getMyLike(uid, post as PostDocument).then((result : boolean) => {
        return setIsLiked(result);
      });
    }
  }, [post.likes]);

  return (
    <div className="my-2 flex justify-between" >
      <div className="flex items-center">
        {/* Post Actions */}
        <IconPlusText onClick={() => { shareLink(parentPost?.id); } }>
          <Icons.Share />
        </IconPlusText>
        <IconPlusText onClick={actionLikePost}>
          <Icons.Heart active={isLiked} allowFill={isLiked} className={'w-10 sm:motion-safe:hover:animate-beat'}/>
        </IconPlusText>
        <div className="ml-6">
          {likeString(Math.max(likesCount || 0, 0))}
        </div>
      </div>

      {/* Owner Actions */}
      <div className="flex">
        { uid === parentPost.author.id &&
        <>
          <IconPlusText>
            <TrashIcon
              className="w-8 m-1"
              onClick={() => showDeleteModal(true)}
            />
          </IconPlusText>
          <IconPlusText>
            <PencilIcon
              className="w-8 m-1 -translate-y-0.5"
              onClick={() => dispatch(toggleEditModal(true))}
            />
          </IconPlusText>
        </>
        }
      </div>
    </div>
  );
}

