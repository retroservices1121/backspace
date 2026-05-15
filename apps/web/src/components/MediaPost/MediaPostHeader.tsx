import { useEffect, useRef, useState } from 'react';
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
  post: Post;
  followAction: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MediaPostHeader({ post, followAction, onEdit, onDelete }: HeaderProps) {
  const { id: uid, following } = useSelector((state : RootState) => state.user);
  const [Following, setFollowing] = useState<boolean>();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const author = post.author;
  const authorAvatar = useMedia(post.author.avatar);
  const isAuthor = post.author?.id === uid;

  // Close the menu on outside click — matches how every other dropdown
  // in the app feels and avoids stuck-open states on mobile.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);
  
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
        <div className="relative ml-6" ref={menuRef}>
          <DotsHorizontalIcon
            className="w-8 cursor-pointer"
            onClick={() => setMenuOpen((o) => !o)}
          />
          {menuOpen && isAuthor && (
            <div className="absolute right-0 top-10 z-20 min-w-[10rem] overflow-hidden rounded-xl border border-white/10 bg-backgroundLight shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit?.();
                }}
                className="block w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
              >
                Edit post
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm('Delete this post? This cannot be undone.')) {
                    onDelete?.();
                  }
                }}
                className="block w-full px-4 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/20"
              >
                Delete post
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

