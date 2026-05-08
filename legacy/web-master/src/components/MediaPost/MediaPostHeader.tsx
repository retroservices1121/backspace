import { useEffect, useState } from 'react';
import { DotsHorizontalIcon } from '@heroicons/react/solid';

import { getCommunityById, MessageUnion } from 'api/communityAPI';
import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import { useCommunityMedia } from 'hooks/getCommunityMedia';
import useRouting from 'hooks/useRouting';
import { PostDocument } from 'shared/types/documents';
import { joinCommunity } from 'store/communitySlice';
import { ClickableSpan } from 'styles/Buttons';

import { DisplayName, FollowButton } from './styled';

interface HeaderProps {
  options: () => void;
  post: MessageUnion;
}


import { useDispatch, useSelector } from 'react-redux';
import Icons from 'icons';

import { setFollowUser } from 'api/userAPI';
import { fetchFollowedUsers } from 'store/feedSlice';
import { RootState } from 'store/store';
export default function MediaPostHeader({ post: parentPost, options }: HeaderProps) {
  const { followedUsers } = useSelector((state : RootState) => state.feed);
  const uid = useSelector((state : RootState) => state.user.id);
  const [Following, setFollowing] = useState<boolean>();
  const [ communityName, setCommunityName ] = useState<string | undefined>();
  const post = parentPost as PostDocument;
  const communityImage = useCommunityMedia(post.community);
  const history = useRouting();
  const dispatch = useDispatch();
  const author = parentPost.author;

  useEffect(() => {
    getCommunityById(post.community).then((data) => setCommunityName(data?.name));
  }, []);

  const clickBehavior = () => {
    if (post.community === post.channel) {
      history.navigateToProfile(author.username);
    } else {
      dispatch(joinCommunity(post.community));
    }
  };

  // FIXME: Getting weird reloading behavior when user is followed
  const followTheUser = (event: any) => {
    event.preventDefault();
    setFollowUser(uid, parentPost.sender, !Following).then(() => {
      setFollowing(!Following);
      dispatch(fetchFollowedUsers(uid));
    });
  };

  useEffect(() => {
    const temp = followedUsers.filter(value => value?.id == parentPost.sender)?.length > 0 ? true : false;
    setFollowing(temp);
  }, [followedUsers]);

  return (
    <div className="flex justify-between items-center mx-3 sm:mx-0 my-4">

      {/* Avatars & Usernames */}
      <div className="flex cursor-pointer">
        {post.community === post.channel ?
          <div onClick={clickBehavior}>
            <Avatar type={AvatarTypes.User} size={45} circle online={parentPost.author?.online} image={parentPost.author?.avatar} />
          </div>
          :
          <div onClick={clickBehavior}>
            <Avatar type={AvatarTypes.Community} size={50} image={communityImage.profile} />
          </div>
        }
        <div className="flex flex-col items-start mx-4 my-2">
          {post.community !== post.channel ?
            <ClickableSpan onClick={clickBehavior}>
              {communityName}
            </ClickableSpan>
            :
            <DisplayName onClick={clickBehavior}>
              {author.display_name}
            </DisplayName>
          }
          <div className="flex">
            <ClickableSpan onClick={() => history.navigateToProfile(author.username) }>
              @{author.username}
            </ClickableSpan>
            {author.verified && <Icons.Verified color="primary" />}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center mx-3">
        { post.sender !== uid && !Following &&
        <FollowButton onClick={(e) => followTheUser(e)} className="hover:scale-[1.02] hover:-translate-y-0.5 transition ease-in-out delay-100 duration-300">Follow</FollowButton>
        }
        <DotsHorizontalIcon className="ml-6 w-8 cursor-pointer" onClick={options}/>
      </div>

    </div>
  );
}

