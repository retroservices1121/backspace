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

import MediaUploadArea from '../MediaUploadArea';
import UserTile from '../User/UserTile';
import MarketPicker from './MarketPicker';
import TokenPicker from './TokenPicker';
import { CancelButton, ColoredSpan, Option as OptionSection } from './styled';

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

// X-style composer: no title. The post body is the single required
// field — an empty post can't be submitted.
const CreatePostSchema = Yup.object().shape({
  [PostFormFields.Caption]: Yup.string()
    .trim()
    .min(1, 'is required')
    .max(12000, 'is too long')
    .required('is required'),
});

type Props = {
  onCancel: () => void;
  onTouched: () => void;
  setMedia: (media: File | undefined) => void;
};

const CreatePostForm: FormType<PostFormState, Props> = ({
  onSubmit, onCancel, onTouched, setMedia,
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
    [PostFormFields.Caption]: post?.text || '',
    [PostFormFields.CommentsEnabled]: post?.enableComments || true,
    [PostFormFields.PermissionsRequired]: post?.message?.channel?.readPermission || Permissions.EVERYONE,
    [PostFormFields.Profile]: false,
    [PostFormFields.Community]: undefined,
    [PostFormFields.Channel]: undefined,
    [PostFormFields.Tags]: [],
    [PostFormFields.Market]: post?.marketId ? String(post.marketId) : null,
    [PostFormFields.Token]: (post as { tokenId?: bigint | string | null })?.tokenId
      ? String((post as { tokenId: bigint | string }).tokenId)
      : null,
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
        setFieldValue,
      }) => (
      <Form>
        <FormEffect<PostFormState> 
          onChange={({ touched }) => Object.entries(touched).length > 0 && onTouched()}/>
        <FormDebug name={'CreatePostForm'} />

        {/* Author: avatar + name, no follow/message action in the composer */}
        <UserTile user={user} noAction />

        <div className="max-w-prose max-h-96 overflow-y-auto">
          <Field
            name={PostFormFields.Caption}
            placeholder="What's happening?"
            value={values[PostFormFields.Caption]}
            component={FormikInput}
          />
        </div>

        <div style={{ textAlign: 'right' }}>
          {values[PostFormFields.Caption] && errors[PostFormFields.Caption] &&
          <ErrorMessage name={PostFormFields.Caption}>
            {msg => `Post ${msg}`}
          </ErrorMessage>}
        </div>

        {/* Attach a market OR a token — mutually exclusive, since both
            embed below the post text in the feed and the renderer
            shouldn't have to pick between them. Picking one clears the
            other. */}
        {!post?.id && !values[PostFormFields.Token] && (
          <MarketPicker
            value={values[PostFormFields.Market] ?? null}
            onChange={(id) => setFieldValue(PostFormFields.Market, id)}
          />
        )}
        {!post?.id && !values[PostFormFields.Market] && (
          <TokenPicker
            value={values[PostFormFields.Token] ?? null}
            onChange={(id) => setFieldValue(PostFormFields.Token, id)}
          />
        )}

        {/* Media attach + inline preview (new posts only) */}
        {!post?.id && <MediaUploadArea setMedia={setMedia} />}

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
          <ButtonLarge color='primary' type="submit">{post?.id ? 'Update' : 'Post'}</ButtonLarge>
        </FlexSpaceBetween>
        </Form>
      )}
        </Formik>
  );
};

export default CreatePostForm;
