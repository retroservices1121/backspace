// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';
import { Field } from 'formik';

import Select, { SelectOption } from 'components/Select';
import { makeField } from 'lib/formik';
import { Row } from 'styles/Flex';
import { Space } from 'styles/layout';

import { ChannelSelectOption } from '../CreatePostForm';

export enum PostDestinationFields {
  Community = 'community',
  Channel = 'channel',
}

export type Destination = {
  [PostDestinationFields.Community]: SelectOption;
  [PostDestinationFields.Channel]: ChannelSelectOption;
};

export type PostDestinationProps = {
  channelOptions: Record<string, ChannelSelectOption[]>;
  communityOptions: SelectOption[];
  permissionField: string;
};

const PostDestinationField = makeField<Destination, PostDestinationProps>(({
  field: { name, value },
  form: { setFieldValue },
  channelOptions,
  communityOptions,
  permissionField,
}) => {
  // const communityChanged = useValueChanged(value.community.value);
  // When user picks a new community, lets auto-change the channel for them to the first in the list.
  useEffect(() => {
    if (value.community.value && channelOptions[value.community.value]) {
      setFieldValue(`${name}.${PostDestinationFields.Channel}`, channelOptions[value.community.value][0]);
    }
  }, [value.community.value]);

  useEffect(() => {
    setFieldValue(permissionField, value.channel.permission);
  }, [value.channel]);

  return (
    <Row>
      <Field
        name={`${name}.${PostDestinationFields.Community}`}
        component={Select}
        placeholder="Community"
        options={communityOptions}
      />

      <Space dir='column'/>

      <Field
        name={`${name}.${PostDestinationFields.Channel}`}
        component={Select}
        placeholder="Channel"
        options={channelOptions[value.community.value]}
      />
    </Row>
  );
});

export default PostDestinationField;
