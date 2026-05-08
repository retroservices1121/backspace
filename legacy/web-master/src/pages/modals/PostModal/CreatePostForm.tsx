// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { getChannels, getCommunityById } from 'api/communityAPI';
import { MessageUnion } from 'api/communityAPI';
import { PostUnion } from 'api/PostAPI';
import { ErrorMessage } from 'components/FormInput';
import { Avatar } from 'components/MediaPost/styled';
import FormikInput from 'components/Rich/FormikInput';
import { SelectOption } from 'components/Select';
// import { FieldError } from 'styles/form';
import { FormToggle } from 'components/Toggle';
import useConstructor from 'hooks/useConstructor';
import { FormEffect } from 'lib/formik';
import { APP } from 'pages';
import { PermissionsName, PermissionsType } from 'shared/types/documents';
import { selectActiveChannel } from 'store/selectors';
import { RootState } from 'store/store';
import { ButtonLarge } from 'styles/Buttons';
import { Col, FlexSpaceBetween, Row } from 'styles/Flex';
import { Space } from 'styles/layout';
import { PostFormFields, PostFormState } from 'types/feed';
import { FormType } from 'types/forms';
import { FormDebug } from 'util/FormDebug';

import PostDestinationField, { PostDestinationFields } from './components/PostDestinationField';
import { CancelButton, ColoredSpan, DisplayName, InputTitle, Option as OptionSection, UserName } from './styled';


export type ChannelSelectOption = SelectOption & {
  permission: PermissionsType,
};

const CreatePostSchema = Yup.object().shape({
  [PostFormFields.Title]: Yup.string()
    .min(1, 'is too short')
    .required('is required'),
  [PostFormFields.Caption]: Yup.string()
    .max(12000, 'Caption is too long'),
});

type Props = {
  onCancel: () => void;
  onTouched: () => void;
  post?: MessageUnion;
};

const CreatePostForm: FormType<PostFormState, Props> = ({
  onSubmit, onCancel, onTouched, post : parentPost,
}) => {
  const post = parentPost as PostUnion;
  const community = useSelector((state: RootState) => state.community);
  const currentChannel = useSelector(selectActiveChannel);
  const user = useSelector((state: RootState) => state.user);
  const location = useLocation();

  const [communityOptions, setCommunities] = useState<SelectOption[]>([]);
  const [channelOptions, setChannels] = useState<Record<string, ChannelSelectOption[]>>({});

  const isProfile = post && (post.community === post.sender) || location.pathname !== APP.COMMUNITY.INDEX;
  const INITIAL_STATE: PostFormState = {
    [PostFormFields.Title]: post?.title || '',
    [PostFormFields.Caption]: post?.text || '',
    [PostFormFields.CommentsDisabled]: post?.disable_comments || false,
    [PostFormFields.PermissionsRequired]: post?.permission_required || PermissionsType.Anyone,
    [PostFormFields.Profile]: isProfile,
    [PostFormFields.Destination]: {
      [PostDestinationFields.Community]: {
        label: post ? post.community : isProfile ? 'My Community' : community.name,
        value: post ? post.community : isProfile ? user.id : community.id,
      },
      [PostDestinationFields.Channel]: {
        // If empty string, we're likely on profile, so this shouldn't matter
        label: post ? post.channel : isProfile ? 'Profile' : (currentChannel?.name || ''),
        value: post ? post.channel : isProfile ? user.id : (currentChannel?.id || ''),
        permission: post ? post?.permission_required : (currentChannel?.access || PermissionsType.Anyone),
      },
    },
    [PostFormFields.Tags]: [],
  };


  useConstructor(async () => {
    const tempCommunities: typeof communityOptions = [];
    const tempChannels: typeof channelOptions = {};
    const memberships = user.memberships || [];
    for (const { id: communityId, role } of memberships) {
      // Get community
      const communityDoc = await getCommunityById(communityId);
      if (!communityDoc) {
        // Realistically, communityDoc can't be null if its in memberships.
        // eslint-disable-next-line no-console
        console.error(`Community ${communityId} exists in memberships but can't get by id`);
        continue;
      }

      // Get that community's channels
      const communityChannels = await getChannels(communityId);


      const temp : Array<ChannelSelectOption> = [];
      // Only add channel if I have permission to post to that channel
      communityChannels.forEach((chan) => {
        if (chan.permissions <= role){
          let value : ChannelSelectOption = {
            label: chan.name,
            value: chan.id,
            permission: chan.permissions,
          };
          temp.push(value);
        }
      });

      // If a community has no channels, we're not dealing with that here.
      if (temp.length === 0) {
        continue;
      } else {
        // Add channels to list
        tempChannels[communityId] = temp;
        // Add community to list
        tempCommunities.push({
          label: communityDoc.name,
          value: communityId,
        });
      }
    }

    // Alphabetize labels
    tempCommunities.sort((a, b) => a.label === b.label ? 0 : a.label > b.label ? 1 : -1 );

    setCommunities(tempCommunities);
    setChannels(tempChannels);
  });

  return (
    <Formik<PostFormState>
      onSubmit={onSubmit}
      validationSchema={CreatePostSchema}
      enableReinitialize
      initialValues={ INITIAL_STATE }
    >
      {({
        errors,
        values,
      }) => (
      <Form>
        <FormEffect<PostFormState> onChange={({ touched }) => Object.entries(touched).length > 0 && onTouched()}/>
        <FormDebug name={'CreatePostForm'} />

        {/* Displays User info */}
        <Row>
          <Avatar src={user.avatar} alt="img" />
          <Col>
            <DisplayName>{user.display_name}</DisplayName>
            <UserName>
              @{user.username}
            </UserName>
          </Col>
        </Row>


        <Field
          name={PostFormFields.Title}
          placeholder="Post Title"
          as={InputTitle}
        />
        <ErrorMessage name={PostFormFields.Title}>
          {msg => `Post title ${msg}`}
        </ErrorMessage>
        <Space />
        <div className="max-w-prose max-h-96 overflow-y-auto">
          <Field
            name={PostFormFields.Caption}
            placeholder="Write a caption..."
            value={values[PostFormFields.Caption]}
            component={FormikInput}
          />
        </div>

        <FlexSpaceBetween>
          <br/>
          <div style={{ textAlign: 'right' }}>
            {/* <h4>{values[PostFormFields.Caption].length}/2500</h4> */}
            {values[PostFormFields.Caption] && errors[PostFormFields.Caption] &&
            <ErrorMessage name={PostFormFields.Caption}>
              {msg => `Post ${msg}`}
            </ErrorMessage>}
          </div>
        </FlexSpaceBetween>

        <Space direction={'column'}/>

        {!post &&
        <OptionSection>
          Post to Profile
          <Field
            name={PostFormFields.Profile}
            component={FormToggle}
          />
        </OptionSection>
        }

        {!post && !values.profile &&
          <OptionSection>
            <Col $center $full>
              <PostDestinationField
                name={PostFormFields.Destination}
                channelOptions={channelOptions}
                communityOptions={communityOptions}
                permissionField={PostFormFields.PermissionsRequired}
              />
              <ColoredSpan>Post is viewable by {PermissionsName[values.permissionsRequired]}</ColoredSpan>
            </Col>
          </OptionSection>
        }
        <OptionSection>
          Disable Comments
          <Field
            name={PostFormFields.CommentsDisabled}
            component={FormToggle}
          />
        </OptionSection>

        <Space direction={'column'}/>

        <FlexSpaceBetween>
          <CancelButton color='none' onClick={onCancel}>Cancel</CancelButton>
          <ButtonLarge color='primary' className='mb-20 sm:mb-0' type="submit" >{post ? 'Update' : 'Create'} Post</ButtonLarge>
        </FlexSpaceBetween>
        </Form>
      )}
        </Formik>
  );
};

export default CreatePostForm;
