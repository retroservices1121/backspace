import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { DotsHorizontalIcon } from '@heroicons/react/solid';
import useMedia from '@src/hooks/useMedia';
import { Post } from '@src/types/prisma';
import { useRouter } from 'next/router';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import Icons from 'icons';
import { RootState } from 'store/store';
import { ClickableSpan } from 'styles/Buttons';

import { DisplayName, FollowButton } from './styled';


interface HeaderProps {
  options: () => void;
  post: Post;
  followAction: () => void;
}

export default function MediaPostHeader({ post, followAction, options }: HeaderProps) {
  const { id: uid, following } = useSelector((state : RootState) => state.user);
  const [Following, setFollowing] = useState<boolean>();
  const router = useRouter();
  const author = post.author;
  const authorAvatar = useMedia(post.author.avatar);
  
  const clickBehavior = () => {throw new Error('Not implemented clickBehavior');};
  // const clickBehavior = () => {
  //   if (post.community === post.channel) {
  //     router.push(author.username);
  //   } else {
  //     dispatch(joinCommunity(post.community));
  //   }
  // };

  // FIXME: Getting weird reloading behavior when user is followed
  const followTheUser = (event: any) => {
    event.preventDefault();
    followAction();
  };

  useEffect(() => {
    const temp = following.filter(value => value?.id == post.author.id)?.length > 0 ? true : false;
    setFollowing(temp);
  }, [following]);

  return (
    <div className="flex justify-between items-center mx-3 sm:mx-0 my-4">

      {/* Avatars & Usernames */}
      <div className="flex cursor-pointer">
        <div onClick={clickBehavior}>
          <Avatar
            type={AvatarTypes.Profile} size={45}
            circle={author.accountType !== 'ORG'}
            image={authorAvatar} />
        </div>
        
        <div className="flex flex-col items-start mx-4 my-2">
          <DisplayName onClick={clickBehavior}>
            {author.name}
          </DisplayName>
          <div className="flex">
            <ClickableSpan onClick={() => router.push(author.username) }>
              @{author.username}
            </ClickableSpan>
            {author.verified && (
              author.accountType === 'ORG'
                ? <Icons.OrgVerified color="verified" />
                : <Icons.Verified color="verified" />
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center mx-3">
        { post.author?.id !== uid && !Following &&
        <FollowButton
          onClick={(e) => followTheUser(e)}
          className="mx-2 cursor-pointer py-3 px-6 font-semibold rounded-2xl border-2 
          hover:scale-[1.02] hover:-translate-y-0.5 transition ease-in-out delay-100 duration-300">
          Follow
        </FollowButton>
        }
        <DotsHorizontalIcon className="ml-6 w-8 cursor-pointer" onClick={options}/>
      </div>

    </div>
  );
}

