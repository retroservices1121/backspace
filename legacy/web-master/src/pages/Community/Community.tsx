// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { getUserById } from 'api/userAPI';
import useScreen from 'hooks/useScreen';
import useStripeCustomer from 'hooks/useStripeCustomer';
import { Screens } from 'lib/events';
import CommunitySettings from 'pages/modals/CommunitySettings';
import PurchaseSubscription from 'pages/modals/PurchaseSubscription';
import { PurchaseForm } from 'pages/modals/PurchaseSubscription/components/PurchaseSubscriptionForm';
import { toggleSubscribeModal } from 'store/appSlice';
import { changeCommunity, selectCurrentCommunity } from 'store/communitySlice';
import { selectFollowedCommunities, selectUid } from 'store/userSlice';

import ChannelFeed from './components/ChannelFeed';
import CommunityDrawer from './components/CommunityDrawer';
import CreateChannelModal from './components/CreateChannel';
import EditChannelModal from './components/CreateChannel/EditChannel';
import MemberDrawer from './components/MemberDrawer';
import { Container } from './styled';


type Props = {};

const Community: React.FC<Props> = ({}) => {
  useScreen(Screens.Community);
  const uid = useSelector(selectUid);
  const currentCommunity =  useSelector(selectCurrentCommunity);
  const followedCommunities = useSelector(selectFollowedCommunities);
  const stripeCustomer = useStripeCustomer();
  const dispatch = useDispatch();
  const [featuredCommunity, setFeaturedCommunity] = useState<string>();

  const handlePurchaseSubscription = async (formState : PurchaseForm) => {
    if (formState.tier) {
      dispatch(toggleSubscribeModal(false));
      const toastId = toast.loading('Submitting Payment...');
      try {
        await stripeCustomer.subscriptions.new(currentCommunity.id, formState.tier);
        // await stripeCustomer.newSubscription(currentCommunity.id, formState.tier);
        toast.update(toastId, { render: 'Successfully subscribed to community', type: 'success', isLoading: false, autoClose: 3000 });
        setTimeout(() => location.reload(), 2000); //let user see notifications

      } catch (error) {
        toast.update(toastId, { render: 'Error subscribing, please try again.', type: 'error', isLoading: false, autoClose: 5000 });
        console.error(error);
      }
    }
    
  };

  // When loading community page
  // If previously loaded a community, refresh data
  // If no community selected, grab the first joined community and load that one
  useEffect(() => {
    const communityId = currentCommunity.id || followedCommunities?.[0].id;
    if (communityId) {
      dispatch(changeCommunity(communityId));
    }
  }, []);

  //On Init
  useEffect(() => {
    // FIXME put this in redux
    if (!featuredCommunity && uid) getUserById(uid).then((user) => {
      if (user?.featured?.community) {
        setFeaturedCommunity(user.featured.community);
      }
    });
  }, [uid]);

  return (
      <Container>
        <Helmet>
          <title>{currentCommunity.name || 'My Communities'}</title>
        </Helmet>

        <CreateChannelModal />
        <EditChannelModal />
        <CommunitySettings/>

        {/* Left side */}

        <PurchaseSubscription
          onSubmit={handlePurchaseSubscription}
        />

        <CommunityDrawer
          featuredCommunity={featuredCommunity}
          followedCommunities={followedCommunities?.map(each => each.id) || []}
        />

        {/* Main section */}

        <ChannelFeed/>

        {/* Right side */}

        <MemberDrawer
          communityId={currentCommunity.id}
        />
      </Container>
  );
};

export default Community;
