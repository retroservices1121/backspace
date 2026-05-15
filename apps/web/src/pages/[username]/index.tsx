// X-style profile route. Header (banner + avatar + bio + counts +
// Edit/Follow) followed by sticky Posts/Replies/Media/Likes tabs and
// an MediaPost-row content list per tab. Each tab loads its own data
// via react-query so switching tabs doesn't re-fetch the profile.

import React, { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import Loading from 'react-loading';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

import ProfileHeader from 'components/Profile/ProfileHeader';
import ProfileReplyCard from 'components/Profile/ProfileReplyCard';
import ProfileTabs, { ProfileTab } from 'components/Profile/ProfileTabs';
import { Container, FeedContainer } from 'components/Feed/styles';
import DesktopFeedDrawer from 'components/Feed/DesktopFeedDrawer';
import FeedDrawer from 'components/Feed/FeedDrawer';
import { HideOnMobile } from 'components/NavigationV2/styled';
import MediaPost from 'components/MediaPost';
import { useAxios } from 'hooks/useAxios';
import useUser from 'hooks/useUser';
import { useGetProfileByUsernameQuery } from 'services/user';
import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { fetchUser } from 'store/userSlice';
import { RootState, useAppDispatch } from 'store/store';
import { Post } from 'types/prisma';
import { FollowBody } from '../api/follow';

const TAB_TO_PATH: Record<ProfileTab, string> = {
  posts:   'posts',
  replies: 'replies',
  media:   'media',
  likes:   'likes',
};

function Profile() {
  const router = useRouter();
  const username = (router.query.username as string) ?? '';
  const dispatch = useAppDispatch();
  const axios = useAxios();
  const { user: viewer } = useUser();
  const currentUser = useSelector((state: RootState) => state.user);

  // Profile (header) — keep the existing RTK Query hook so the
  // profile fetch path doesn't change. Tab content uses react-query.
  const { data: profileRes, isLoading } = useGetProfileByUsernameQuery(username || '');
  const profile = profileRes?.user;

  const [tab, setTab] = useState<ProfileTab>('posts');
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  useEffect(() => {
    dispatch(setPageTitle(profile?.name || username || 'Profile'));
  }, [profile?.name, username]);

  useEffect(() => {
    if (viewer?.following && profile?.id) {
      const f = viewer.following.find((row: any) => row.accountId === profile.id);
      setIsFollowing(!!f);
    }
  }, [viewer?.following, profile?.id]);

  const { data: tabData } = useQuery<any[]>(
    ['profile-tab', username, tab],
    async () => {
      if (!username) return [];
      const { data } = await axios.get(`/users/${encodeURIComponent(username)}/${TAB_TO_PATH[tab]}`);
      return Array.isArray(data) ? data : [];
    },
    { enabled: !!username, staleTime: 15_000, keepPreviousData: true },
  );

  const toggleFollow = async () => {
    if (!viewer?.id || !profile?.id) return;
    const next = !isFollowing;
    const body: FollowBody = { userId: viewer.id, accountId: profile.id, follow: next };
    try {
      const { status } = await axios.put('follow', body);
      if (status === 200) {
        setIsFollowing(next);
        dispatch(fetchUser(viewer.authId));
      } else {
        toast.error('Failed to update follow');
      }
    } catch (err) {
      console.error('follow toggle failed', err);
      toast.error('Failed to update follow');
    }
  };

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  if (isLoading || !profile) {
    return (
      <Container>
        <div className="flex w-full justify-center py-10">
          <Loading type="spinningBubbles" color="#09A0F1" height={50} width={50} />
        </div>
      </Container>
    );
  }

  const isSelf = profile.id === currentUser.id;

  return (
    <Container>
      <HideOnMobile className="hidden sm:flex">
        <DesktopFeedDrawer contentPosition={0} />
      </HideOnMobile>
      <FeedDrawer />
      <FeedContainer>
        <div className="w-screen md:w-media">
          {/* Sticky thread-style header — back arrow + name + post count. */}
          <div className="sticky top-0 z-20 flex items-center gap-6 border-b border-dividerColor bg-backgroundDark/80 px-4 py-3 backdrop-blur">
            <button
              type="button"
              onClick={goBack}
              className="p-1 rounded-full hover:bg-backgroundLight"
              aria-label="Back"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-lg font-semibold leading-tight">
                {profile.name || profile.username}
              </span>
              <span className="text-xs text-fontTertiary">
                {(profile._count?.posts ?? 0).toLocaleString()} posts
              </span>
            </div>
          </div>

          <ProfileHeader
            profile={profile as any}
            isSelf={isSelf}
            isFollowing={isFollowing}
            onFollowToggle={toggleFollow}
            onMessage={() => router.push(APP.MESSAGES.INDEX)}
          />

          <ProfileTabs active={tab} onChange={setTab} />

          <ProfileTabContent tab={tab} items={tabData} />
        </div>
      </FeedContainer>
    </Container>
  );
}

type ContentProps = {
  tab: ProfileTab;
  items: any[] | undefined;
};

const ProfileTabContent: React.FC<ContentProps> = ({ tab, items }) => {
  if (items === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Loading type="bubbles" color="#09A0F1" height={32} width={32} />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-fontTertiary text-sm">
        {tab === 'posts'   && 'No posts yet.'}
        {tab === 'replies' && 'No replies yet.'}
        {tab === 'media'   && 'No media yet.'}
        {tab === 'likes'   && 'No likes yet.'}
      </div>
    );
  }
  if (tab === 'replies') {
    return (
      <div>
        {items.map((c) => <ProfileReplyCard key={c.id?.toString()} comment={c} />)}
      </div>
    );
  }
  // Posts / Media / Likes all render the same way — feed-style rows.
  return (
    <div>
      {items.map((p: Post) => <MediaPost key={p.id?.toString()} post={p} />)}
    </div>
  );
};

export default Profile;
