// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { APP } from 'pages';
import { Tabs } from 'pages/Settings/components/common';
import { TierDocument } from 'shared/types/documents';
import { createTier } from 'store/communitySlice';
import { RootState } from 'store/store';
import { LargeTextButton } from 'styles/Buttons';
import { ClickableSpan } from 'styles/Buttons';
import { Col } from 'styles/Flex';

import { CommunitySettingsTabs } from './components';
import { Layout, Tier } from './components';
import { CenterText, RejectionContainer } from './styled';

const PremiumTiers: React.FC<any> = () => {
  const tiers = useSelector((state: RootState) => state.community.premium_tiers || []);
  const user = useSelector((state: RootState) => state.user || []);
  const dispatch = useDispatch();
  const maxTiers = 1;
  const history = useHistory();


  const createTierHandler = () => {
    const newTier : TierDocument = {
      title: 'New Tier',
      description: 'This is a new tier',
      price: 2.99,
      perks: [],
    };
    dispatch(createTier( newTier ));
  };

  return (
    <Layout title={CommunitySettingsTabs.PremiumTier}>
      {tiers.map(tier => (
        <Tier initialValues={tier}/>
      ))}
      {!user?.isCreator && <RejectionContainer>
        <CenterText>You need a creator account to create premium tiers.</CenterText>
        <ClickableSpan onClick={() => history.push(APP.SETTINGS.INDEX, { tab: Tabs.Creator })}>Setup your creator account in settings.</ClickableSpan>
      </RejectionContainer>}
      {user?.isCreator && tiers.length < maxTiers ?
      <LargeTextButton onClick={createTierHandler}>Create New Tier</LargeTextButton>
        :
      <Col $center>
        <p>Max of {maxTiers} Tiers</p>
        <p style={{ textAlign: 'center' }}>
          Platform fees are currently 10% + $0.30. Meaning you keep ~90% of all subscriptions.
          These fees cover card processing, hosting costs, and new feature development.<br /><br />
          Contact support to get help removing or updating tiers.<br />
          We have to cancel all active subscribers before the tier can be removed.<br />
          <a href='mailto: support@backspace.com'>support@backspace.com</a> <br />
          You can also reach support on backspace by visiting <a href={'../support'}>support</a>
          <br />
          Alpha releases... am I right?<br />
          <br />
          We're working on releasing multi-tier support in a future release.<br />
        </p>
      </Col>
      }
    </Layout>
  );
};
export default PremiumTiers;
