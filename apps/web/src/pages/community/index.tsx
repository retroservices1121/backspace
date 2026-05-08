// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import ReactLoading from 'react-loading';
import useConstructor from '@src/hooks/useConstructor';
import Head from 'next/head';

import ChannelFeed from 'components/Channel';
import CommunityDrawer from 'components/Community/CommunityDrawer';
import CreateChannelModal from 'components/Community/CreateChannel';
import MemberList from 'components/Community/MemberList';
import { Container } from 'components/Community/styledAgain';
import CommunitySettings from 'components/modals/CommunitySettings';
import PurchaseSubscription from 'components/modals/PurchaseSubscription';
import useCommunity from 'hooks/entities/useCommunities';
import { Screens, useScreen } from 'hooks/useAnalytics';
import useBilling from 'hooks/useBilling';
import { OldCol, OldRow } from 'styles/Flex';

type Props = {};

const Community: React.FC<Props> = ({ }) => {
  useScreen(Screens.Community);
  // Note: useCommunity bootstraps this feature.
  const { current: { community, channel }, run, noFriends } = useCommunity();
  const { purchaseSubscription } = useBilling();

  useConstructor(run.init);

  if (!community) {
    return <ReactLoading type='bubbles' />;
  } 

  if (noFriends) {
    return (
      <div className='col full'>
        <h4>You are not part of any communities</h4>
      </div>
    );
  }

  return (
    <Container>
      <Head>
        <title>{community?.name || 'My Spaces' }</title>
      </Head>
      <CreateChannelModal edit={false} />
      {/* <EditChannelModal /> */}
      <CommunitySettings />

      {/* Left side */}

      <PurchaseSubscription onSubmit={purchaseSubscription}/>
      <CommunityDrawer />

      {/* Main section */}

      {!channel ? (
        <OldCol $full>
          <OldRow $full $center>You have no channel selected.</OldRow>
        </OldCol>
      ) : (
        <ChannelFeed id={channel.uuid}/>
      )}


      {/* Right side */}

      <MemberList />
    </Container>
  );
};

export default Community;

