// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useCurrentCommunity } from '@src/hooks/entities/useCommunity';

import { ReactiveForm, ReactiveOnChange } from 'lib/formik';
import { leaveCommunity } from 'store/communitySlice';
import { useAppDispatch } from 'store/store';
import { Button } from 'styles/Buttons';
import { Space } from 'styles/layout';
import { CommunityNotificationDocument } from 'types/documents';

import Layout from '../components/Layout';
import { CommunitySettingsTabs } from './index';

enum PingTypes {
  AllMessages = 'all_messages',
  Mentions = 'mentions',
  Nothing = 'nothing',
}

const initialValues: CommunityNotificationDocument = {
  muted: false,
  ping_type: PingTypes.AllMessages,
};

export enum NotificationsFields {
  ping_type = 'ping_type',
  muted = 'muted',
}

const Notifications: React.FC<any> = () => {
  const { actions } = useCurrentCommunity();

  const handleChange: ReactiveOnChange<CommunityNotificationDocument> = (fieldName, value) => {
    // dispatch(updateCommunityNotificationSettings({
    //   [fieldName]: value,
    // }));
  };

  // useEffect(() => {
  //   dispatch(getCommunityNotificationSettings());
  // }, []);

  return (
    <Layout title={CommunitySettingsTabs.Notifications}>
      <ReactiveForm<CommunityNotificationDocument>
        initialValues={{
          ...initialValues,
          // ...notifications,
        }}
        onChange={handleChange}
      >
        <Space direction={'column'} />
        Notification Controls Coming Soon
        {/* <Flex centerY>
          Mute "{name}"
          <Field
            component={FormToggle}
            name={NotificationsFields.muted}
          />
        </Flex>
        <HorizontalLine/>
        <Flex $direction='column'>
          <label>
            <Field
              type="radio"
              name={NotificationsFields.ping_type}
              value={PingTypes.AllMessages}
            />
            {' All Messages'}
          </label>
          <label>
            <Field
              type="radio"
              name={NotificationsFields.ping_type}
              value={PingTypes.Mentions}
            />
            {' Only @Mentions'}
          </label>
          <label>
            <Field
              type="radio"
              name={NotificationsFields.ping_type}
              value={PingTypes.Nothing}
            />
            {' Nothing'}
          </label>
        </Flex> */}

        <Space direction='column'/>
        <Button
          color='error'
          onClick={actions.leaveCommunity}
          // disabled={ownCommunity}
        >
          Leave Community
        </Button>

      </ReactiveForm>
    </Layout>
  );
};
export default Notifications;
