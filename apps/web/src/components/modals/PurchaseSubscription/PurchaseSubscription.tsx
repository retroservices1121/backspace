// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentCommunity } from '@src/store/community/selectors';
import { useRouter } from 'next/router';

import Modal from 'components/ModalV2';
import { Tabs } from 'components/Settings/common';
import logEvent, { EventMessages } from 'lib/events';
import { APP } from 'pages';
import { toggleSubscribeModal } from 'store/appSlice';
import { RootState, useAppDispatch } from 'store/store';

import PurchaseSubscriptionForm, { PurchaseForm } from './components/PurchaseSubscriptionForm';
import { Container } from './styles';

type Props = {
  onSubmit: (formState: PurchaseForm) => void;
};

const PurchaseSubscription: React.FC<Props> = ({
  onSubmit,
}) => {
  const { subscribeModal } = useSelector((state: RootState) => state.app);
  const community = useSelector(selectCurrentCommunity);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const onEditPaymentMethods = () => {
    router.push(`${APP.SETTINGS.INDEX}?tab=${Tabs.Billing}`);
  };

  //Used for analytics
  useEffect(() => {
    // TODO move this into redux.
    // Why react to a state change when you can imperatively call this function when the state gets set
    if (subscribeModal) {
      logEvent(EventMessages.Community.ViewSubscription, { communityId: community.id });
    }
  }, [subscribeModal]);

  return (
    <Modal
      open={subscribeModal}
      handleClose={() => dispatch(toggleSubscribeModal(false))}
      // afterOpen={() => dispatch(fetchTiers())}
    >
      <Container>
        <PurchaseSubscriptionForm onSubmit={onSubmit} onEditPaymentMethods={onEditPaymentMethods} />
      </Container>
    </Modal>
  );
};
export default PurchaseSubscription;
