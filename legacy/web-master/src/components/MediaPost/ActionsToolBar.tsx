import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import copy from 'copy-to-clipboard';
import Icons from 'icons';
import moment from 'moment';

import { MessageUnion } from 'api/communityAPI';
import { CommentButton } from 'components/MediaPost/styled';
import { timeAgoString, truncateLargeumbers } from 'shared/common_utils';
import { PostDocument } from 'shared/types/documents';

import { IconPlusText } from './styled';

interface OwnProps {
  preview: () => void;
  actionLikePost: () => void;
  post: MessageUnion;
  isLiked: boolean;
  likesCount: number;
}

export default function ActionsToolBar({ post: parentPost, preview, isLiked, likesCount, actionLikePost }: OwnProps) {
  const post = parentPost as PostDocument;
  const [showDate, setShowDate] = useState<boolean>(false);
  const [likeString, setLikeString] = useState<string>('');
  const url = `${window.location.origin}/?post=${post.id}`;

  const time = () => { return showDate ? moment(post.timestamp.toDate()).format('MM-DD-YY / hh:mma') : timeAgoString(post.timestamp?.toDate());};

  const copyLink = () => {
    copy(url);
    toast.info('Link copied to clipboard');
  };

  const shareLink = async () => {
    const shareData = {
      title: 'Check out this post on backspace',
      text: post.title,
      url: url,
    };

    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log(err);
      copyLink();
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
    setLikeString(createLikeString(likesCount));
  }, [likesCount]);



  return (
    <div className="mb-2 mx-4 flex justify-between">
      <div>
        <CommentButton onClick={preview} className="">{commentString(post.comments)}</CommentButton>
        <p className="cursor-pointer text-xl"
          onClick={() => setShowDate(!showDate)}
        >{time()}</p>
      </div>

      {/* Buttons */}
      <div className="flex justify-between items-center">
        <div/>
        <div className="flex items-center">
          <p className="text-xl mr-2 sm:mr-4">{likeString}</p>
          <IconPlusText onClick={actionLikePost} >
            <Icons.Heart active={isLiked} allowFill={isLiked} className={'w-10 sm:motion-safe:hover:animate-beat'}/>
          </IconPlusText>

          <IconPlusText onClick={shareLink}>
            <Icons.Share />
          </IconPlusText>
        </div>
      </div>
    </div>
  );
}

