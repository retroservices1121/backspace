// Profile route. Ports the design's profile screen (banner + bio +
// stats + tabs) via NewProfileScreen. Data still flows through the
// same hooks: useGetProfileByUsernameQuery for the profile blob,
// react-query for per-tab content, useUser for the viewer's follow
// graph.

import React, { useEffect, useState } from 'react';
import Loading from 'react-loading';
import { useSelector } from 'react-redux';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

import NewProfileScreen, { ProfileTab } from 'components/Profile/NewProfileScreen';
import { useAxios } from 'hooks/useAxios';
import useUser from 'hooks/useUser';
import { useGetProfileByUsernameQuery } from 'services/user';
import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { fetchUser } from 'store/userSlice';
import { RootState, useAppDispatch } from 'store/store';
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

  if (isLoading || !profile) {
    return (
      <div className="flex w-full justify-center py-10">
        <Loading type="spinningBubbles" color="#7B4CFF" height={50} width={50} />
      </div>
    );
  }

  const isSelf = profile.id === currentUser.id;

  return (
    <NewProfileScreen
      profile={profile as any}
      isSelf={isSelf}
      isFollowing={isFollowing}
      onFollowToggle={toggleFollow}
      onMessage={() => router.push(APP.MESSAGES.INDEX)}
      tab={tab}
      onTabChange={setTab}
      tabData={tabData}
    />
  );
}

export default Profile;
