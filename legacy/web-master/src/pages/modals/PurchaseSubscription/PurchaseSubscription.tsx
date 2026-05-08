// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Modal from 'components/ModalV2';
import useRouting from 'hooks/useRouting';
import logEvent, { EventMessages } from 'lib/events';
import { APP } from 'pages';
import { Tabs } from 'pages/Settings/components/common';
import { toggleSubscribeModal } from 'store/appSlice';
import { fetchTiers } from 'store/communitySlice';
import { RootState } from 'store/store';

import PurchaseSubscriptionForm, { PurchaseForm } from './components/PurchaseSubscriptionForm';
import { Container } from './styles';

type Props = {
  onSubmit: (formState: PurchaseForm) => void;
};

const PurchaseSubscription: React.FC<Props> = ({
  onSubmit,
}) => {
  const { subscribeModal } = useSelector((state: RootState) => state.app);
  const community = useSelector((state : RootState) => state.community);
  const dispatch = useDispatch();
  const history = useRouting();

  const onEditPaymentMethods = () => {
    history.navigate(`${APP.SETTINGS.INDEX}?tab=${Tabs.Billing}`);
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
      afterOpen={() => dispatch(fetchTiers())}
    >
      <Container>
        <PurchaseSubscriptionForm onSubmit={onSubmit} onEditPaymentMethods={onEditPaymentMethods} />
      </Container>
    </Modal>
  );
};
export default PurchaseSubscription;
