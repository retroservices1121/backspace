// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty } from 'lodash';

import { MessageUnion } from 'api/communityAPI';
import { getPostByID } from 'api/PostAPI';
import LoadingMediaPost from 'components/MediaPost/LoadingMediaPost';
import MessageList from 'components/MessageList';
import { HideOnMobile } from 'components/NavigationV2/styled';
import { logEventScreen, Screens } from 'lib/events';
import useQuery from 'lib/getQuery';
import { setPageTitle } from 'store/appSlice';
import { fetchFollowedUsers, fetchMorePosts, fetchPosts, fetchRecentUsers, setFeaturedPost } from 'store/feedSlice';
import { RootState } from 'store/store';
import { Sort } from 'types/feed';

import DiscoverModal from '../modals/DiscoverModal';
import DesktopFeedDrawer from './DesktopFeedDrawer';
import FeedDrawer from './FeedDrawer';
import { Container, FeedContainer } from './styles';

type Props = {};

function useFeaturedPost() {
  const featuredPost = useSelector((state: RootState) => state.feed.featuredPost);
  const [addFeaturedPost, setAddFeaturedPost] = useState<MessageUnion | undefined>();
  const query = useQuery();
  const dispatch = useDispatch();

  useEffect(() => {
    const postQuery = query.get('post');
    if (!isEmpty(postQuery)) {
      getPostByID(postQuery as string)
        .then(post => {
          if (post) {
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
  const { posts, followedUsers } = useSelector((state: RootState) => state.feed);
  const [sorting, setSorting] = useState<Sort>(Sort.Discover);
  const [contentPosition, setContentPosition] = useState(0);
  const loadingPlaceholderCount = 10;
  const featuredPost = useFeaturedPost();

  const dispatch = useDispatch();
  const query = useQuery();

  const loadMore = async () => {
    const increment: number = 10;
    return dispatch(fetchMorePosts({ sorting, count: increment }));
  };

  const generateLoadPlaceholders = (count : number) => {
    const results : Array<JSX.Element> = [];
    for (let iter = 0; iter < count; iter++) {
      results.push(<LoadingMediaPost />);
    }
    return results;
  };

  //Run once
  useEffect(() => {
    logEventScreen(Screens.Feed);
    dispatch(setPageTitle('Home'));
  }, []);

  useEffect(() => {
    if (user.isLoggedIn) {
      dispatch(fetchPosts({ sorting }));
      dispatch(fetchFollowedUsers(user.id));
      dispatch(fetchRecentUsers(user.id));
    }
  }, [user.isLoggedIn, user.memberships]);

  // add featured post to redux
  function hasFeaturedPost() {
    const postQuery = query.get('post');
    if (!isEmpty(postQuery)) {
      if (postQuery) {
        dispatch(setFeaturedPost(postQuery));
      }
    }
  }

  function sortClick(sort: Sort) {
    setSorting(sort);
    dispatch(fetchPosts({ sorting: sort }));
  }

  useEffect(() => {
    if (user.isLoggedIn) {
      dispatch(fetchPosts({ sorting }));
      hasFeaturedPost();
    }
  }, [user.isLoggedIn, followedUsers, sorting]);


  return (
    <>
      <DiscoverModal />
      <Container>

        <HideOnMobile>
          <DesktopFeedDrawer contentPosition={contentPosition} sorting={sorting} setSorting={sortClick}/>
        </HideOnMobile>

        <FeedDrawer sorting={sorting} setSorting={sortClick}/>

        <FeedContainer>
          {posts?.length === 0 &&
            <div className='flex flex-col px-0 sm:px-12 w-full h-fit'>
              {generateLoadPlaceholders(loadingPlaceholderCount)} 
            </div>
          }
          <MessageList
            messages={featuredPost ? [featuredPost, ...posts.filter(post => post.id != featuredPost.id)] : posts}
            initialPosition='top'
            hasMore={true}
            loadMore={loadMore}
            onScrollHandler={setContentPosition}
            disableAutoScroll
          />
        </FeedContainer>
      </Container>
    </>
  );
};

export default Feed;

