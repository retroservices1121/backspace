// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ReactiveForm, ReactiveOnChange } from 'lib/formik';
import { CommunityNotificationDocument } from 'shared/types/documents';
import { leaveCommunity } from 'store/communitySlice';
import { getCommunityNotificationSettings, updateCommunityNotificationSettings } from 'store/notificationsSlice';
import { selectCommunityNotifications } from 'store/selectors';
import { RootState } from 'store/store';
import { Button } from 'styles/Buttons';
import { Space } from 'styles/layout';

import { CommunitySettingsTabs } from './components';
import Layout from './components/Layout';

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
  const dispatch = useDispatch();
  const notifications = useSelector(selectCommunityNotifications);
  const ownCommunity = useSelector((state: RootState) => state.user.id === state.community.id);

  const handleChange: ReactiveOnChange<CommunityNotificationDocument> = (fieldName, value) => {
    dispatch(updateCommunityNotificationSettings({
      [fieldName]: value,
    }));
  };

  useEffect(() => {
    dispatch(getCommunityNotificationSettings());
  }, []);

  return (
    <Layout title={CommunitySettingsTabs.Notifications}>
      <ReactiveForm<CommunityNotificationDocument>
        initialValues={{
          ...initialValues,
          ...notifications,
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
        <Button color='error' onClick={() => dispatch(leaveCommunity())} disabled={ownCommunity}>
          Leave Community
        </Button>

      </ReactiveForm>
    </Layout>
  );
};
export default Notifications;
