import React, { useEffect, useState } from 'react';
import Loading from 'react-loading';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Permissions } from '@prisma/client';
import PostList from '@src/components/Profile/PostList';
import { useAxios } from '@src/hooks/useAxios';
import useMedia from '@src/hooks/useMedia';
import useUser from '@src/hooks/useUser';
import { actions as communityActions } from '@src/store/community/slice';
import { selectMembership } from '@src/store/post/selectors';
import { fetchUser } from '@src/store/userSlice';
import { useRouter } from 'next/router';
import { useGetProfileByUsernameQuery } from 'services/user';

import { UserWithProfile } from 'api2/user';
import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import CommunityIcon from 'components/CommunityIcon/CommunityIcon';
import SmartContent from 'components/SmartContent';
import {
  Banner,
  Container,
  InteractionButton,
  LightInteractionButton,
  PointerCursor,
  ProfileCommunity,
  ProfileContent,
  ProfileDescription,
  ProfileHeaderContainer,
  ProfileImage,
  ProfileInfo,
  ProfileInteractions,
  ProfileStats,
} from 'components/Profile/styled';
import { VerificationIcon } from 'components/UserHeader/styled';
import { logEventScreen, Screens } from 'lib/events';
import { APP } from 'pages';
//import { setConversationFromUid } from 'store/directMessageSlice';
import { RootState, useAppDispatch } from 'store/store';
import { ButtonLarge } from 'styles/Buttons';
import { VerticalLine } from 'styles/Dividers';
import { OldCol, OldRow, Row } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { Space } from 'styles/layout';
import { makeShortNumber } from 'utils/common_utils';

import ChatIcon from 'public/graphics/commonicons/message.svg';
import Verified from 'public/graphics/commonicons/verified.svg';
import VerifiedOrg from 'public/graphics/commonicons/verified-org.svg';

import { FollowBody } from '../api/follow';

enum Tabs {
  Posts = 'Posts',
  Follows = 'Follows',
}

//TODO move to hook?
function useProfile(username: string) {
  const dispatch = useAppDispatch();
  const axios = useAxios();
  const { user } = useUser();
  const [isFollowing, setIsFollowing] = useState<boolean>(undefined);

  const followUser = async (accountId : bigint, follow : boolean = true) => {
    const followUpdate : FollowBody = {
      userId: user.id,
      accountId,
      follow,
    };
    const { status } = await axios.put('follow', followUpdate);
    if (status === 200) {
      toast.info('Toggled Follow User');
      setIsFollowing(follow);
      dispatch(fetchUser(user.authId)); //to get follow update
      return true;
    } else {
      toast.error('Error toggling follow user');
      return false;
    }
  };

  useEffect(() => {
    if (user?.following) {
      const following = user.following?.find(follow => follow.account?.username === username);
      setIsFollowing(!!following);
    }
  }, [username]);

  return {
    isFollowing,

    follow: followUser,
    joinCommunity: async (id: bigint) => {await dispatch(communityActions.joinCommunity(id));},
  };
}

function Profile() {
  const router = useRouter();
  const profileUsername = router.query.username as string;
  const username = router.query.username;
  const { data: userResponse, isLoading, error } = useGetProfileByUsernameQuery(username as string || '');
  const [profile, setProfile] = useState<UserWithProfile>(null);

  //const dispatch = useAppDispatch();
  const currentUser = useSelector((state : RootState) => state.user);
  const avatar = useMedia(profile?.avatar);
  const banner = useMedia(profile?.banner);
  const membership = selectMembership(profile?.communities[0]?.id);
  // const [hasMorePosts, setHasMorePosts] = useState<boolean>(true);

  const [tab, setTab] = useState<Tabs>(Tabs.Posts);

  logEventScreen(Screens.Profile);

  const thisProfile = useProfile(profileUsername);

  // set page user off username
  useEffect(() => {
    if (userResponse?.user) {
      setProfile(userResponse.user);
    }
  }, [userResponse]);


  const handleUpdateFollow = (update : boolean) => {
    thisProfile.follow(profile.id, update);
  };

  const handleStartConversation = () => {
    if (!currentUser.id) {
      router.push(APP.AUTH.INDEX);
      return;
    }
    if (!profile.id) return null;
    //FIXME: BRENTON: Redux needs messages update
    //dispatch(setConversationFromUid(profile.user.id));
    router.push(APP.MESSAGES.INDEX);
  };

  const handleGotoCommunity = async () => {
    if (!currentUser.id) {
      router.push(APP.AUTH.INDEX);
      return;
    }
    const community = profile.communities?.[0];
    if (!community) return;
    // The old `fbid` guard meant this only worked for legacy migrated
    // communities — a freshly created room has fbid:null, so the button
    // did nothing. Join only if not already a member (owner included),
    // then always navigate in.
    if (!(membership?.role >= Permissions.MEMBER)) {
      await thisProfile.joinCommunity(community.id);
    }
    router.push(APP.COMMUNITY.INDEX);
  };

  //NOTE: Rendering Content
  if (isLoading || profile === null)
    return (
     <Container key={`profile-${profileUsername}`}>
       <div style={{ position: 'relative', left: '50%', top: '1em' }}>
         <Loading type='spinningBubbles' height={0} width={50} />
       </div>
     </Container>
    );
  if (error || !profile) return (
     <Container key={`profile-${profileUsername}`}>
       <h3 style={{ textAlign: 'center' }}>
         <br />
        <br />
        {'No user found for this username, check the spelling in the url and please try again.'}
       </h3>
     </Container>
  );
  return (
     <Container key={`profile-${profileUsername}`}>
       <ProfileContent>
         <Banner img={banner} key={`banner-for-${profileUsername}`}>
           <ProfileImage $org={profile.accountType === 'ORG'}>
             <Avatar
               type={AvatarTypes.Profile}
               size={170}
               circle={profile.accountType !== 'ORG'}
               image={avatar}
             />
           </ProfileImage>
         </Banner>

         <ProfileHeaderContainer>
           <ProfileInfo>
             <h1>{profile.name || profileUsername}</h1>

             <OldRow centerY={true}>
               <h4>@{profileUsername}</h4>
               {profile.verified && (
                 <VerificationIcon
                   $solid={true}
                   $color='verified'
                   as={profile.accountType === 'ORG' ? VerifiedOrg : Verified}
                 />
               )}
             </OldRow>

             <ProfileDescription>
               <SmartContent>{profile.bio}</SmartContent>
             </ProfileDescription>

             {currentUser.id && (
               <ProfileInteractions>
                 {/* If your own profile */}
                 {profile.id == currentUser.id ? (
                   <>
                     <LightInteractionButton color="primary" onClick={() => router.push(APP.SETTINGS.INDEX)}>
                       Edit Profile
                    </LightInteractionButton>
                    <LightInteractionButton color="backgroundLight" onClick={() => router.push(APP.SETTINGS.INDEX)}>
                      Settings
                    </LightInteractionButton>
                  </>
                 ) : (
                  <>
                    <InteractionButton
                      color="primary"
                      selected={thisProfile.isFollowing}
                      selectedColor='backgroundLight'
                      textColor={thisProfile.isFollowing ? 'fontFocus' : 'white'}
                      onClick={() => handleUpdateFollow(!thisProfile.isFollowing)}>
                      {thisProfile.isFollowing ? 'Following' : 'Follow'}
                    </InteractionButton>
                    <LightInteractionButton color="backgroundLight" onClick={handleStartConversation}>
                      <Icon $solid $color='primary' as={ChatIcon} /> <Space />Message
                    </LightInteractionButton>
                  </>
                 )}
              </ProfileInteractions>
             )}
            <ProfileStats>
               <VerticalLine />
               <PointerCursor onClick={() => setTab(Tabs.Posts)}>
                 <OldCol $center>
                   <h2>{makeShortNumber(profile._count.posts)}</h2>
                   <h6>Posts</h6>
                 </OldCol>
               </PointerCursor>
               <VerticalLine />
               <PointerCursor onClick={() => setTab(Tabs.Follows)}>
                 <OldCol $center>
                   <h2>{makeShortNumber(profile._count.followers || 0)}</h2>
                   <h6>Followers</h6>
                 </OldCol>
               </PointerCursor>
               <VerticalLine />
               <PointerCursor onClick={() => setTab(Tabs.Follows)}>
                 <OldCol $center>
                   <h2>{makeShortNumber(profile._count.following || 0)}</h2>
                   <h6>Following</h6>
                 </OldCol>
               </PointerCursor>
              <VerticalLine />
            </ProfileStats>

           </ProfileInfo>
          {/* TODO This is an awful decision statement. Needs featured community field */}
           {(profile.communities?.length > 0 && profile.communities[0]) && (
             <ProfileCommunity>
               <h3>{profile.communities[0].name}</h3>

               <br />

               <h5>
                 {profile.communities[0].description || (
                   profile.name
                     ? `Access ${profile.name}'s exclusive content by visiting their community.`
                     : 'Access exclusive content by visiting their community'
                 )}
               </h5>

               <br />

               <div className="flex flex-wrap items-center">
                 <CommunityIcon size='large' communityName={profile.communities[0].name} onClick={handleGotoCommunity}/>
                 <div className="pl-6">
                   <ButtonLarge color="primary" onClick={handleGotoCommunity}>
                     {membership?.role >= Permissions.MEMBER ? 'Enter Community' : 'Join Community'}
                  </ButtonLarge>
                </div>
              </div>
            </ProfileCommunity>
           )}
        </ProfileHeaderContainer>
        {/* FIXME fix the type mismatch here */}
        {/* @ts-expect-error */}
        <PostList posts={profile?.posts} />
      </ProfileContent>
    </Container>
  );
}

export default Profile;
