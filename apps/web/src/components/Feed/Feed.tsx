// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useAuthentication from '@src/hooks/useAuthenticate';
import { useFeed } from '@src/hooks/useFeed';
import { AuthStatus } from '@src/store/authSlice';
import { FilterOptions } from '@src/store/feedSlice';
import { isEmpty } from 'lodash';

import { CatalogMarketCard } from '@src/components/Market/CatalogMarketCard';
import { TokenCatalogCard } from '@src/components/Dflow/TokenCatalogCard';
import axios from '@src/lib/axios';

import type { MessageUnion } from 'types/legacy-aliases';
import FeedDrawer from 'components/Feed/FeedDrawer';
import InlineCompose from 'components/Feed/InlineCompose';
import { Container, FeedContainer } from 'components/Feed/styles';
import SkeletonLoader from 'components/MediaPost/SkeletonLoader';
import DiscoverModal from 'components/modals/DiscoverModal';
import TopTabs from 'components/Shell/TopTabs';
import { logEventScreen, Screens } from 'lib/events';
import useQuery from 'lib/getQuery';
import { setPageTitle } from 'store/appSlice';
import { fetchFollowedUsers, fetchRecentUsers, setFeaturedPost } from 'store/feedSlice';
import { RootState, useAppDispatch } from 'store/store';
import { Col } from 'styles/Flex';

import NewPost from '../Post/NewPost';
// MediaPost is still used on profile + post permalink pages — only
// the feed has been migrated to NewPost (Phase 12.4). Don't remove
// the legacy component until those routes are ported too.

type Props = {};

function useFeaturedPost() {
  const featuredPost = useSelector((state: RootState) => state.feed.featuredPost);
  const [addFeaturedPost, setAddFeaturedPost] = useState<MessageUnion | undefined>();
  const query = useQuery();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const postQuery = query.get('post');
    if (!isEmpty(postQuery)) {
      // Postgres-backed lookup. The post route is /api/post (singular)
      // with id as a query param — see pages/api/post/index.ts.
      axios()
        .get(`/post?id=${postQuery as string}`)
        .then(({ data: post }) => {
          if (post) {
            //@ts-ignore FIXME: StaticImage
            setAddFeaturedPost(post);
          }
        })
        .catch(() => console.error(`Post with id ${postQuery} doesn't exist`));
    }
    if (isEmpty(postQuery) && featuredPost) {
      dispatch(setFeaturedPost(undefined));
    }

  }, [query]);

  return addFeaturedPost;
}


const Feed: React.FC<Props> = ({}) => {
  const user = useSelector((state: RootState) => state.user);
  const authState = useAuthentication();
  const featuredPost = useFeaturedPost();
  const myFeed = useFeed();
  const dispatch = useAppDispatch();
  const query = useQuery();

  // const loadMore = async () => {
  //   const increment: number = 10;
  //   return dispatch(fetchMorePosts({ sorting, count: increment }));
  // };

  //Run once
  useEffect(() => {
    logEventScreen(Screens.Feed);
    dispatch(setPageTitle('Home'));
  }, []);

  useEffect(() => {
    if (authState === AuthStatus.SignedIn) {
      myFeed.fetchPosts();
      dispatch(fetchFollowedUsers(user.authId));
      dispatch(fetchRecentUsers(user.authId));
    }
  }, [authState]);

  // add featured post to redux
  function hasFeaturedPost() {
    const postQuery = query.get('post');
    if (!isEmpty(postQuery)) {
      if (postQuery) {
        dispatch(setFeaturedPost(postQuery));
      }
    }
  }


  // Filter tabs map directly to FilterOptions. Order matches the
  // design's pattern: rank-first tab leading, then the discoverable
  // alternatives, with the Markets catalog last. The LIVE pill on
  // Markets mirrors the LeftNav badge so the navigation language
  // stays consistent.
  const tabs = [
    { key: FilterOptions.ACCURACY, label: 'For you' },
    { key: FilterOptions.DISCOVER, label: 'Discover' },
    { key: FilterOptions.FOLLOWING, label: 'Following' },
    { key: FilterOptions.COMMUNITY, label: 'Communities' },
    { key: FilterOptions.MARKETS, label: 'Markets' },
    { key: FilterOptions.TOKENS, label: 'Tokens' },
  ];

  return (
    <>
      <DiscoverModal />

      {/* Desktop: TopTabs at the top of the center column, sticky.
          Replaces the legacy DesktopFeedDrawer (the side strip with
          radio-style filter buttons) — same destination, much
          tighter visual. */}
      <div className="hidden sm:block">
        <TopTabs
          title="Home"
          tabs={tabs.map((t) => ({ key: t.key as string, label: t.label }))}
          active={myFeed.filter as string}
          onChange={(key) => myFeed.setFilter(key as FilterOptions)}
        />
      </div>

      {/* Mobile keeps the existing collapsible drawer until the mobile
          UI lands separately. */}
      <div className="sm:hidden">
        <FeedDrawer />
      </div>

      <Container>
        <FeedContainer>
          <Col>
            {/* Inline composer at the top of every post-style filter
                (X parity). Hidden on the Markets + Tokens catalog tabs. */}
            {authState === AuthStatus.SignedIn
              && myFeed.filter !== FilterOptions.MARKETS
              && myFeed.filter !== FilterOptions.TOKENS && (
              <InlineCompose />
            )}
            {myFeed.filter === FilterOptions.MARKETS ? (
              myFeed.markets && myFeed.markets.length > 0 ? (
                myFeed.markets.map((m) => (
                  <CatalogMarketCard key={`${m.venue}:${m.externalId}`} market={m} />
                ))
              ) : (
                <SkeletonLoader renderCount={10} />
              )
            ) : myFeed.filter === FilterOptions.TOKENS ? (
              myFeed.tokens && myFeed.tokens.length > 0 ? (
                myFeed.tokens.map((t) => (
                  <TokenCatalogCard key={t.id} token={t} />
                ))
              ) : (
                <SkeletonLoader renderCount={10} />
              )
            ) : myFeed.posts ? (
              myFeed.posts.map((post) => <NewPost key={post.id?.toString()} post={post} />)
            ) : (
              <SkeletonLoader renderCount={10} />
            )}
          </Col>
        </FeedContainer>
      </Container>
    </>
  );
};

export default Feed;

