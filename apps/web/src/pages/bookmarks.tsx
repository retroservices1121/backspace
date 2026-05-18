// /bookmarks — the user's saved posts. Authed-only; renders the
// bookmarked post list with NewPost rows so the visual matches the
// home feed exactly. Backed by /api/users/me/bookmarks.

import React, { useEffect } from 'react';
import { useQuery } from 'react-query';

import axios from '@src/lib/axios';
import useAuthentication from '@src/hooks/useAuthenticate';
import { AuthStatus } from '@src/store/authSlice';
import { setPageTitle } from '@src/store/appSlice';
import { useAppDispatch } from '@src/store/store';

import NewPost from 'components/Post/NewPost';
import SkeletonLoader from 'components/MediaPost/SkeletonLoader';
import TopTabs from 'components/Shell/TopTabs';
import type { Post } from 'types/prisma';

async function fetchBookmarks(): Promise<Post[]> {
  const { data } = await axios().get<Post[]>('/users/me/bookmarks?limit=50');
  return data ?? [];
}

const Bookmarks: React.FC = () => {
  const authState = useAuthentication();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setPageTitle('Bookmarks'));
  }, []);

  const bookmarks = useQuery(
    ['my-bookmarks'],
    fetchBookmarks,
    { enabled: authState === AuthStatus.SignedIn, staleTime: 30_000 },
  );

  return (
    <>
      <div className="hidden sm:block">
        <TopTabs
          title="Bookmarks"
          tabs={[{ key: 'all', label: 'All saved' }]}
          active="all"
          onChange={() => undefined}
        />
      </div>

      <div className="font-display text-ink">
        {authState !== AuthStatus.SignedIn ? (
          <EmptyState text="Sign in to see your bookmarks." />
        ) : bookmarks.isLoading ? (
          <SkeletonLoader renderCount={6} />
        ) : bookmarks.data && bookmarks.data.length > 0 ? (
          bookmarks.data.map((post) => (
            <NewPost key={post.id?.toString()} post={post} />
          ))
        ) : (
          <EmptyState
            title="No bookmarks yet."
            text="Tap the bookmark icon on a post to save it here. Only you can see your bookmarks."
          />
        )}
      </div>
    </>
  );
};

function EmptyState({ title, text }: { title?: string; text: string }) {
  return (
    <div className="px-6 py-12 max-w-md mx-auto text-center">
      {title && (
        <h2 className="m-0 text-[20px] font-bold tracking-[-0.02em] text-ink">
          {title}
        </h2>
      )}
      <p className="mt-2 text-[14px] text-ink-2 leading-snug">{text}</p>
    </div>
  );
}

export default Bookmarks;
