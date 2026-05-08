import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CommentButton } from '@src/components/MediaPost/styled';
import usePost from '@src/hooks/usePost';
import copy from 'copy-to-clipboard';
import moment from 'moment';

import Icons from 'icons';
import { Post } from 'types/prisma';
import { timeAgoString, truncateLargeumbers } from 'utils/common_utils';

import { IconPlusText } from './styled';

interface OwnProps {
  open: () => void;
  actionLikePost: () => void;
  post: Post;
  isLiked: boolean;
}

export default function ActionsToolBar({ post, open, isLiked, actionLikePost }: OwnProps) {
  const [showDate, setShowDate] = useState<boolean>(false);
  const [likeString, setLikeString] = useState<string>('');
  const thisPost = usePost(post);
  const time = () => {
    if (showDate) {
      return moment(new Date(post.createdAt)).format('MM-DD-YY  hh:mma');
    } else {
      return timeAgoString(new Date(post.createdAt));
    }
  };

  const commentString = (comments : number) => {
    if (comments <= 0) { return 'Add Your Comment!'; }
    if (comments === 1) { return 'View 1 Comment'; }
    return `View All ${truncateLargeumbers(comments)} Comments`;
  };

  const createLikeString = (likes : number) => {
    if (likes <= 0) { return 'Be the first like!'; }
    if (likes === 1) { return '1 Like'; }
    return `${truncateLargeumbers(likes)} Likes`;
  };

  useEffect(() => {
    setLikeString(createLikeString(post?._count?.likes));
  }, [post]);



  return (
    <div className="mb-2 mx-4 flex justify-between">
      <div>
        <CommentButton onClick={open} className="">{commentString(post?._count?.comments)}</CommentButton>
        <p className="cursor-pointer"
          onClick={() => setShowDate(!showDate)}
        >{time()}</p>
      </div>

      {/* Buttons */}
      <div className="flex justify-between items-center">
        <div/>
        <div className="flex items-center">
          <p className="mr-2 sm:mr-4">{likeString}</p>
          <IconPlusText className="mx-2 p-3 flex items-center cursor-pointer rounded-xl" onClick={actionLikePost} >
            <Icons.Heart active={isLiked} allowFill={isLiked} strokeWidth={'2'} className={'sm:motion-safe:hover:animate-beat'}/>
          </IconPlusText>

          <IconPlusText className="mx-2 p-3 flex items-center cursor-pointer rounded-xl" onClick={thisPost.share}>
            <Icons.Share />
          </IconPlusText>
        </div>
      </div>
    </div>
  );
}

