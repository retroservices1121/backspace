// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';

import { APP } from 'pages';
//import { Tabs } from 'pages/Settings/components/common';
import { createTier } from 'store/communitySlice';
import { RootState, useAppDispatch } from 'store/store';
import { LargeTextButton } from 'styles/Buttons';
import { ClickableSpan } from 'styles/Buttons';
import { OldCol } from 'styles/Flex';
import { TierDocument } from 'types/documents';

import { CommunitySettingsTabs } from '../components';
import { Layout, Tier } from '../components';
import { CenterText, RejectionContainer } from '../styled';

const PremiumTiers: React.FC<any> = () => {
  // const tiers = useSelector((state: RootState) => state.community. || []);
  // const user = useSelector((state: RootState) => state.user || []);
  const dispatch = useAppDispatch();
  const maxTiers = 1;
  const router = useRouter();


  const createTierHandler = () => {
    const newTier : TierDocument = {
      title: 'New Tier',
      description: 'This is a new tier',
      price: 2.99,
      perks: [],
    };
    throw new Error('Not implemented');
    // dispatch(createTier( newTier ));
  };

  return null;

  // return (
  //   <Layout title={CommunitySettingsTabs.PremiumTier}>
  //     {tiers.map(tier => (
  //       <Tier initialValues={tier}/>
  //     ))}
  //     {
  //       //@ts-ignore FIXME: BRENTON
  //         !user?.isCreator && <RejectionContainer>
  //       <CenterText>You need a creator account to create premium tiers.</CenterText>
  //       <ClickableSpan onClick={() => router.push(APP.SETTINGS.INDEX )}>Setup your creator account in settings.</ClickableSpan>
  //       {/* FIXME: Figure out how to go to a specific tab
  //       <ClickableSpan onClick={() => router.push(APP.SETTINGS.INDEX, { tab: Tabs.Creator })}>Setup your creator account in settings.</ClickableSpan>*/}
  //     </RejectionContainer>}
  //     {
  //       //@ts-ignore FIXME: BRENTON
  //       user?.isCreator && tiers.length < maxTiers ?
  //     <LargeTextButton onClick={createTierHandler}>Create New Tier</LargeTextButton>
  //         :
  //     <Col $center>
  //       <p>Max of {maxTiers} Tiers</p>
  //       <p style={{ textAlign: 'center' }}>
  //         Platform fees are currently 10% + $0.30. Meaning you keep ~90% of all subscriptions.
  //         These fees cover card processing, hosting costs, and new feature development.<br /><br />
  //         Contact support to get help removing or updating tiers.<br />
  //         We have to cancel all active subscribers before the tier can be removed.<br />
  //         <a href='mailto: support@backspace.com'>support@backspace.com</a> <br />
  //         You can also reach support on backspace by visiting <a href={'../support'}>support</a>
  //         <br />
  //         Alpha releases... am I right?<br />
  //         <br />
  //         We're working on releasing multi-tier support in a future release.<br />
  //       </p>
  //     </Col>
  //     }
  //   </Layout>
  // );
};
export default PremiumTiers;
