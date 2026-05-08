// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { PencilIcon, TrashIcon } from '@heroicons/react/outline';
import { IconPlusText } from '@src/components/MediaPost/styled';
import usePost from '@src/hooks/usePost';
import useUser from '@src/hooks/useUser';
import { Post } from '@src/types/prisma';

import Icons from 'icons';

interface OwnProps {
  post: Post;
  deletePost: () => void
}

export default function PostToolBar({ post, deletePost }: OwnProps) {
  const thisPost = usePost(post);
  const { user } = useUser();

  const likeString = (likes : number) => {
    if (likes === 0) {
      return '';
    } if (likes === 1) {
      return '1 Like';
    }
    // toLocaleString will throw commas in
    return `${likes.toLocaleString()} Likes`;
  };

  return (
    <div className="my-2 flex justify-between flex-wrap w-full" >
      <div className="flex items-center">
        {/* Post Actions */}
        <IconPlusText 
          className="mx-2 p-3 flex items-center cursor-pointer rounded-xl" 
          onClick={thisPost.share}>
          <Icons.Share />
        </IconPlusText>
        <IconPlusText 
          className="mx-2 p-3 flex items-center cursor-pointer rounded-xl" 
          onClick={() => thisPost.setLike()} >
          <Icons.Heart 
            active={thisPost.isLiked} 
            allowFill={thisPost.isLiked} 
            strokeWidth={'2'} className={'sm:motion-safe:hover:animate-beat'}/>
        </IconPlusText>
        <div className="ml-6">
          {likeString(Math.max(post._count.likes || 0, 0))}
        </div>
      </div>

      {/* Owner Actions */}
      <div className="flex w-fit h-fit my-4 sm:m-0">
        { user.id === post.authorId &&
        <>
          <IconPlusText
            className="mx-2 p-1 flex items-center cursor-pointer rounded-xl" 
          >
            <TrashIcon
              className="w-8 m-1"
              onClick={() => deletePost()}
            />
          </IconPlusText>
          <IconPlusText
            className="mx-2 p-1 flex items-center cursor-pointer rounded-xl" 
          >
            <PencilIcon
              className="w-8 m-1 -translate-y-0.5"
              onClick={thisPost.edit}
            />
          </IconPlusText>
        </>
        }
      </div>
    </div>
  );
}

