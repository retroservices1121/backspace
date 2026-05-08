// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useAuthentication from '@src/hooks/useAuthenticate';
import { useFeed } from '@src/hooks/useFeed';
import { AuthStatus } from '@src/store/authSlice';
import { isEmpty } from 'lodash';

import { MessageUnion } from 'api/communityAPI';
import { getPostByID } from 'api/PostAPI';
import DesktopFeedDrawer from 'components/Feed/DesktopFeedDrawer';
import FeedDrawer from 'components/Feed/FeedDrawer';
import { Container, FeedContainer } from 'components/Feed/styles';
import SkeletonLoader from 'components/MediaPost/SkeletonLoader';
import DiscoverModal from 'components/modals/DiscoverModal';
import { HideOnMobile } from 'components/NavigationV2/styled';
import { logEventScreen, Screens } from 'lib/events';
import useQuery from 'lib/getQuery';
import { setPageTitle } from 'store/appSlice';
import { fetchFollowedUsers, fetchRecentUsers, setFeaturedPost } from 'store/feedSlice';
import { RootState, useAppDispatch } from 'store/store';
import { Col } from 'styles/Flex';

import MediaPost from '../MediaPost';

type Props = {};

function useFeaturedPost() {
  const featuredPost = useSelector((state: RootState) => state.feed.featuredPost);
  const [addFeaturedPost, setAddFeaturedPost] = useState<MessageUnion | undefined>();
  const query = useQuery();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const postQuery = query.get('post');
    if (!isEmpty(postQuery)) {
      getPostByID(postQuery as string)
        .then(post => {
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
  const [contentPosition, setContentPosition] = useState(0);
  const loadingPlaceholderCount = 10;
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


  return (
    <>
      <DiscoverModal />
      <Container>

        <HideOnMobile className="hidden sm:flex">
          <DesktopFeedDrawer contentPosition={contentPosition} />
        </HideOnMobile>

        <FeedDrawer />

        <FeedContainer>
          <Col>
            {
            myFeed.posts ? 
              myFeed.posts.map((post) => {
                return (
                  <MediaPost post={post} />
                );
              })
              :
              <SkeletonLoader renderCount={10} />
          }
          </Col>
        </FeedContainer>
      </Container>
    </>
  );
};

export default Feed;

