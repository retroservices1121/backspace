// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Permissions } from '@prisma/client';
import useUser from '@src/hooks/useUser';
import { selectPostableCommunities } from '@src/store/community/selectors';
import { Field, Form, Formik, useField, useFormikContext } from 'formik';
import { useRouter } from 'next/router';
import * as Yup from 'yup';

import { ErrorMessage } from 'components/FormInput';
import FormikInput from 'components/Rich/FormikInput';
import Select, { SelectOption } from 'components/Select';
// import { FieldError } from 'styles/form';
import { FormToggle } from 'components/Toggle';
import useConstructor from 'hooks/useConstructor';
import { FormEffect } from 'lib/formik';
import { useAppSelector } from 'store/store';
import { RootState } from 'store/store';
import { ButtonLarge } from 'styles/Buttons';
import { Col, FlexSpaceBetween, Row } from 'styles/Flex';
import { Space } from 'styles/layout';
import { FormType } from 'types/forms';
import { PostFormFields, PostFormState } from 'types/post';
import { FormDebug } from 'utils/FormDebug';

import UserTile from '../User/UserTile';
import { CancelButton, ColoredSpan, InputTitle, Option as OptionSection } from './styled';

/** The entire point of this is to reset channel if community changes */
const ChannelField = (props) => {
  const {
    //@ts-expect-error 
    values: { community },
    touched,
    setFieldValue,
  } = useFormikContext();
  const [field, meta] = useField(props);

  useEffect(() => {
    //@ts-expect-error 
    if (touched.community) {
      setFieldValue(props.name, '');
    }
  }, [community, props.name]);

  return (
    <>
      <Field {...props} {...field} />
      {!!meta.touched && !!meta.error && <div>{meta.error}</div>}
    </>
  );
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
};

const CreatePostForm: FormType<PostFormState, Props> = ({
  onSubmit, onCancel, onTouched,
}) => {
  const { user } = useUser();
  const post = useAppSelector((state: RootState) => state.post);
  const postLocations = useSelector(selectPostableCommunities);

  const [selectCommunities, setSelectCommunities] = useState<SelectOption[]>();
  const [selectChannels, setSelectChannels] = useState<Map<string, SelectOption[]>>();

  /** Build up our channel and community options */
  useConstructor(() => {
    const channelMap = new Map<string, SelectOption[]>;
    const communities = postLocations.map((loc) => {
      const newSelect : SelectOption = {
        value: loc.community,
        label: loc.community.name,
      };
      const channels = loc.channels.map((chan) => {
        const chanSelect : SelectOption = {
          value: chan,
          label: chan.name,
        };
        return chanSelect;
      });
      channelMap.set(loc.community.id.toString(), channels);
      return newSelect;
    });
    setSelectCommunities(communities);
    setSelectChannels(channelMap);
  });

  const INITIAL_STATE: PostFormState = {
    [PostFormFields.Title]: post?.title || '',
    [PostFormFields.Caption]: post?.text || '',
    [PostFormFields.CommentsEnabled]: post?.enableComments || true,
    [PostFormFields.PermissionsRequired]: post?.message?.channel?.readPermission || Permissions.EVERYONE,
    [PostFormFields.Profile]: false,
    [PostFormFields.Community]: undefined,
    [PostFormFields.Channel]: undefined,
    [PostFormFields.Tags]: [],
  };

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
        <FormEffect<PostFormState> 
          onChange={({ touched }) => Object.entries(touched).length > 0 && onTouched()}/>
        <FormDebug name={'CreatePostForm'} />

        {/* Displays User info */}
        <UserTile user={user} />


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
        {!post?.id && 
          <>
            <OptionSection>
              Post to Profile
              <Field
                name={PostFormFields.Profile}
                component={FormToggle}
              />
            </OptionSection>        
            {!values.profile &&
              <OptionSection>
                <Col className='justify-center align-center w-full my-2'>
                  <Row className='justify-center align-center my-2'>
                    <Field
                      name={PostFormFields.Community}
                      component={Select}
                      placeholder="Community"
                      options={selectCommunities}
                    />
                    <Space dir='column'/>
                    <ChannelField
                      name={PostFormFields.Channel}
                      component={Select}
                      placeholder="Channel"
                      options={
                        values[PostFormFields.Community]?.value
                          ? selectChannels.get((values[PostFormFields.Community]?.value.id).toString()) 
                          : undefined 
                      }
                    />
                  </Row>
                  {
                  values[PostFormFields.Channel]?.value 
                    ? <ColoredSpan className='mx-auto'>
                          Post will be viewable by {values[PostFormFields.Channel].value?.readPermission}
                      </ColoredSpan>
                    : <ColoredSpan className='mx-auto'>Post will be viewable by _________</ColoredSpan>
                  }
                </Col>
              </OptionSection>
            }
          </>
        }
        
        <OptionSection>
          Comments Enabled
          <Field
            name={PostFormFields.CommentsEnabled}
            component={FormToggle}
          />
        </OptionSection>

        <Space direction={'column'}/>

        <FlexSpaceBetween>
          <CancelButton color='none' onClick={onCancel}>Cancel</CancelButton>
          <ButtonLarge color='primary' type="submit" >{post?.id ? 'Update' : 'Create'} Post</ButtonLarge>
        </FlexSpaceBetween>
        </Form>
      )}
        </Formik>
  );
};

export default CreatePostForm;
