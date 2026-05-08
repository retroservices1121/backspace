import React, { useState } from 'react';
import Loading from 'react-loading';
import ReactLoading from 'react-loading';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom'; // For accessing route params
import Icons from 'icons';
import { useTheme } from 'styled-components';

import { CommunityUnion, getCommunityById, getUserRole, MessageUnion } from 'api/communityAPI';
import { getMediaUrl } from 'api/mediaAPI';
import {  getMorePosts, getPosts, PostUnion } from 'api/PostAPI';
import { getFollowerCount, getLikesCount, getUserByUsername, markUserVisited, setFollowUser } from 'api/userAPI';
import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import CommunityIcon from 'components/CommunityIcon/CommunityIcon';
import MessageList from 'components/MessageList';
import { VerificationIcon } from 'components/UserHeader/styled';
import { ReactComponent as Verified } from 'graphics/commonicons/verified.svg';
import useAsyncEffect from 'hooks/useAsyncHook';
import useRouting from 'hooks/useRouting';
import go from 'lib/async';
import { logEventScreen, Screens } from 'lib/events';
import { APP } from 'pages';
import { Container as ListContainer } from 'pages/Community/components/styled';
import { makeShortNumber } from 'shared/common_utils';
import { PermissionsType } from 'shared/types/documents';
import { setPageTitle } from 'store/appSlice';
import { joinCommunity } from 'store/communitySlice';
import { setConversationFromUid } from 'store/directMessageSlice';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';
import { ButtonLarge } from 'styles/Buttons';
import { VerticalLine } from 'styles/Dividers';
import { Col, Row } from 'styles/Flex';
import { HideOnMobile } from 'styles/layout';
import { Sort } from 'types/feed';

import Follow from './components/Follow';
import OptionsModal from './OptionsModal';
import {
  Banner,
  Container,
  InteractionButton,
  LightInteractionButton,
  MoreButton,
  PointerCursor,
  ProfileCommunity,
  ProfileContent,
  ProfileDescription,
  ProfileHeaderContainer,
  ProfileImage,
  ProfileInfo,
  ProfileInteractions,
  ProfileStats,
} from './styled';

type InitialPaintState = {
  user: User;
  featuredCommunity: CommunityUnion;
};

type Params = {
  user? : string,
};

enum Tabs {
  Posts = 'Posts',
  Follows = 'Follows',
  Like = 'Like',
}

const Profile: React.FC<RouteComponentProps<Params>> = ({ match }) => {
  const pageUsername = match.params.user;
  const history = useRouting();
  const dispatch = useDispatch();
  const theme = useTheme();
  const currentUser = useSelector((state : RootState) => state.user);
  // If you're wondering why followedUsers is instantiated on profile
  // its part of the fetchUser thunk
  const { followedUsers } = useSelector((state : RootState) => state.feed);
  const [pageBanner, setPageBanner] = useState<string>('');
  const [followed, setFollowed] = useState<boolean>();
  const [followerCount, setFollowerCount] = useState<number>();
  const [likesCount, setLikesCount] = useState<number>();
  const [posts, setPosts] = useState<Array<PostUnion>>();
  const [hasMorePosts, setHasMorePosts] = useState<boolean>(true);
  const [isMember, setIsMember] = useState(false);
  const [tab, setTab] = useState<Tabs>(Tabs.Posts);
  const [ optionsOpen, setOptionsOpen ] = useState(false);
  logEventScreen(Screens.Profile);

  // Generally, don't group data. However, this page is being optimized to give new users the best load time.
  const [profile, setProfile] = useState<InitialPaintState | undefined | null>(undefined);

  const fetchMorePosts = async () => {
    const requestSize = 10;
    if (profile?.user.id && posts && posts.length) {
      const newPosts = await getMorePosts(
        posts[posts.length - 1].id || '',
        [profile?.user.id],
        Sort.Profile,
        currentUser.memberships,
        requestSize,
      );
      if (newPosts.length != requestSize) {
        setHasMorePosts(false);
      }
      setPosts((current) => {
        return current ? current.concat(newPosts) : newPosts;
      });
    }
    
  };

  // This effect loads everything thats "required" for a profile.
  // featuredCommunity & isMember are being included since them popping in is jarring
  // In the future, skeletons would be used
  useAsyncEffect([pageUsername], async () => {
    if (pageUsername) {
      const temp: any = {};
      setPageBanner(''); // clear banner
      setTab(Tabs.Posts);
      dispatch(setPageTitle(pageUsername));
      // Get the profile user
      const userResponse = await go(getUserByUsername(pageUsername));
      if (userResponse.type === 'error') {
        console.error(userResponse.error);
        setProfile(null);
        return;
      }

      temp.user = userResponse.data;

      if (userResponse.data?.featured?.community) {
        const communityResponse = await go(getCommunityById(userResponse.data.featured.community));
        if (communityResponse.type !== 'error') {
          temp.featuredCommunity = communityResponse.data;
        }
      }

      setProfile(temp as InitialPaintState);
      markUserVisited(currentUser.id, temp?.user?.id);
    } else {
      // How did you get here without a username after the / ???
      setProfile(null);
    }
  });

  useAsyncEffect([profile?.user?.id], async () => {
    if (profile?.featuredCommunity && currentUser.id) {
      const roleResponse = await go(getUserRole(profile.featuredCommunity.id, currentUser.id));
      if (roleResponse.type === 'error') return;
      if (roleResponse.data >= PermissionsType.Members) {
        setIsMember(true);
      }
    }
  });

  // Load if currentUser is a follower or not
  useAsyncEffect([profile?.user?.id], async () => {
    if (profile?.user?.id && followedUsers) {
      const following = followedUsers.filter(value => value?.id == profile?.user.id)?.length > 0;
      setFollowed(following);
    }
  });

  // Get posts
  useAsyncEffect([profile?.user?.id], async () => {
    if (profile?.user?.id) {
      const postResponse = await go(getPosts([profile?.user.id], Sort.Profile, currentUser.memberships, 1000));
      if (postResponse.type === 'error') {console.error(postResponse); return;}
      setPosts(postResponse.data);
    }
  });

  // Load Banner
  useAsyncEffect([profile?.user?.id], async () => {
    if (profile?.user?.banner_image) {
      const url = await getMediaUrl(profile?.user.banner_image);
      setPageBanner(url);
    }
  });

  // Load profile stats
  useAsyncEffect([profile?.user?.id], async () => {
    if (profile?.user?.id) {
      const followers = await getFollowerCount(profile?.user.id);
      setFollowerCount(followers);
      const likes = await getLikesCount(profile?.user.id);
      setLikesCount(likes);
    }
  });

  const handleUpdateFollow = (update : boolean) => {
    if (!currentUser.id) {
      history.navigate(APP.AUTH.INDEX);
      return;
    }
    if (!profile?.user?.id) return null;
    setFollowUser(currentUser.id, profile?.user.id, update);
    setFollowed(update);
  };

  const handleStartConversation = () => {
    if (!currentUser.id) {
      history.navigate(APP.AUTH.INDEX);
      return;
    }
    if (!profile?.user?.id) return null;
    dispatch(setConversationFromUid(profile.user.id));
    history.navigate(APP.MESSAGES.INDEX);
  };

  const handleGotoCommunity = async () => {
    if (!currentUser.id) {
      history.navigate(APP.AUTH.INDEX);
      return;
    }
    if (profile?.featuredCommunity) {
      dispatch(joinCommunity(profile?.featuredCommunity.id));
    }
  };

  // profile is undefined while loading
  if (profile === undefined) return (
    <Container key={`profile-${pageUsername}`}>
      <div style={{ position: 'relative', left: '50%', top: '1em' }}>
        <Loading type='spinningBubbles' height={0} width={50} />
      </div>
    </Container>
  );

  // profile is null if we tried to find them but they don't exist/cant find them
  if (profile === null) return (
    <Container key={`profile-${pageUsername}`}>
      <h3 style={{ textAlign: 'center' }}>
        <br />
        <br />
        {'No user found for this username, check the spelling in the url and please try again.'}
      </h3>
    </Container>
  );

  const tabOptions = (currentTab : Tabs) => {
    switch (currentTab) {
      case Tabs.Follows:
        if (profile?.user)
          return (<Follow profileUser={profile.user}/>);
        break;
      case Tabs.Like:
        //TODO: Sort Posts by likes
        break;
      case Tabs.Posts:
      default:
        return (
          <ListContainer>
            <MessageList 
              grid
              disableAutoScroll
              messages={posts as MessageUnion[]} 
              initialPosition={'top'} 
              hasMore={hasMorePosts} 
              loadMore={fetchMorePosts} 
            />
          </ListContainer>
        );
    }
  };

  return (
    <>
      <Container key={`profile-${pageUsername}`}>
        <ProfileContent>
          <Banner img={pageBanner} key={`banner-for-${pageUsername}`}>
            <ProfileImage>
              <Avatar type={AvatarTypes.Profile} size={170} circle image={profile.user?.avatar} />
            </ProfileImage>
          </Banner>

          <ProfileHeaderContainer>
            <ProfileInfo>
              <h1>{profile.user?.display_name || pageUsername}</h1>

              <Row centerY={true}>
                <h4>@{pageUsername}</h4>
                {profile.user.verified && (
                  <VerificationIcon $solid={true} $color='primary' as={Verified} />
                )}
              </Row>

              <ProfileDescription>{profile.user?.description}</ProfileDescription>

              {currentUser.id && (
                <ProfileInteractions>
                  {/* If your own profile */}
                  {profile.user?.id == currentUser.id ? (
                    <>
                      <LightInteractionButton color="primary" onClick={() => history.navigate(APP.SETTINGS.INDEX)}>
                        Edit Profile
                      </LightInteractionButton>
                      <LightInteractionButton color="backgroundLight" onClick={() => history.navigate(APP.SETTINGS.INDEX)}>
                        Settings
                      </LightInteractionButton>
                      <MoreButton color="none" onClick={() => setOptionsOpen(true)}>
                        <Icons.More color='fontSecondary' />
                      </MoreButton>
                    </>
                  ) : (
                    <>
                      <InteractionButton
                        color="primary"
                        selected={followed}
                        selectedColor='backgroundLight'
                        textColor={followed ? 'fontFocus' : 'white'}
                        onClick={() => handleUpdateFollow(!followed)}>
                        {followed ? 'Following' : 'Follow'}
                      </InteractionButton>
                      <LightInteractionButton color="backgroundLight" onClick={handleStartConversation}>
                        <HideOnMobile>
                          <Icons.Chat color='primary' allowFill={false} style={{ marginRight: '8px' }}/>
                        </HideOnMobile>
                        Message
                      </LightInteractionButton>
                      <MoreButton color="none" onClick={() => setOptionsOpen(true)}>
                        <Icons.More color='fontSecondary' />
                      </MoreButton>
                    </>
                  )}
                </ProfileInteractions>
              )}

              <ProfileStats>
                <VerticalLine />
                <PointerCursor onClick={() => setTab(Tabs.Posts)}>
                  <Col $center>
                    <h2>{posts ? 
                      makeShortNumber(posts.length) : 
                      <ReactLoading width={32} height={32} type="spinningBubbles" color={theme.fontFocus} />
                    }</h2>
                    <h6>Posts</h6>
                  </Col>
                </PointerCursor>
                <VerticalLine />
                <PointerCursor onClick={() => setTab(Tabs.Follows)}>
                  <Col $center>
                    <h2>{makeShortNumber(followerCount || 0)}</h2>
                    <h6>Followers</h6>
                  </Col>
                </PointerCursor>
                <VerticalLine />
                <PointerCursor onClick={() => setTab(Tabs.Like)}>
                  <Col $center>
                    <h2>{makeShortNumber(Math.max(likesCount || 0, 0))}</h2>
                    <h6>Likes</h6>
                  </Col>
                </PointerCursor>
                <VerticalLine />
              </ProfileStats>

            </ProfileInfo>

            {profile.featuredCommunity?.id && (
              <ProfileCommunity>
                <h3>{profile.featuredCommunity.name}</h3>

                <br />

                <h5>
                  { profile.featuredCommunity.description || (
                    profile.user?.display_name
                      ? `Access ${profile.user?.display_name}'s exclusive content by visiting their community.`
                      : 'Access exclusive content by visiting their community'
                  )}
                </h5>

                <br />

                <div className="flex flex-wrap items-center">
                  <CommunityIcon size='large' communityId={profile.featuredCommunity.id} handler={handleGotoCommunity}/>
                  <div className="pl-6">
                    <ButtonLarge color="primary" onClick={handleGotoCommunity}>
                      {isMember ? 'Enter Community' : 'Join Community'}
                    </ButtonLarge>
                  </div>
                </div>
              </ProfileCommunity>
            )}
          </ProfileHeaderContainer>
          {tabOptions(tab)}
        </ProfileContent>
      </Container>

      <OptionsModal
      isOpen={optionsOpen}
      onRequestClose={() => setOptionsOpen(false)}
      user={profile.user}
      />
    </>
  );
};

export default Profile;
