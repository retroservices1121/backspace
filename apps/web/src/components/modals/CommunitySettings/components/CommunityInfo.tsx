// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { MediaUse, Prisma } from '@prisma/client';
import { upsertMedia } from '@src/api2/media';
import useCommunity from '@src/hooks/entities/useCommunities';
import { useAxios } from '@src/hooks/useAxios';
import useMedia from '@src/hooks/useMedia';
import { mediaStorage } from '@src/lib/media';
import { useModal } from '@src/lib/Modal';
import { CommunityV3 } from '@src/store/community/types';
import { Community } from '@src/types/prisma';
import { Modals } from '@src/utils/constants';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { ErrorMessage, FormInput, FormTextarea } from 'components/FormInput';
// Probably don't import this from here either in the future
import { ImageHeader } from 'components/Settings/styledAgain';
import UploadBanner from 'components/Settings/UploadBanner';
// TODO consolidate this and the other UploadPfp into a single component and put it in src/components
import UploadPfp from 'components/Settings/UploadPfp';
import { useCommunityMedia } from 'hooks/getCommunityMedia';
import { updateCommunity } from 'store/communitySlice';
import { RootState, useAppDispatch } from 'store/store';
import { Button } from 'styles/form';
import { Space } from 'styles/layout';
import { CommunityInfoFields, CommunityInfoState } from 'types/communitySettings';
import { FormDebug } from 'utils/FormDebug';

import { CommunitySettingsTabs } from '../components';
import Layout from '../components/Layout';


// This file is way worse than it could be. A refactor to how images are handled inside of community needs to be done.
const CommunityInfoSchema = Yup.object().shape({
  [CommunityInfoFields.Name]: Yup.string()
    .min(1, 'is too short')
    .max(250, 'is too long')
    .required('is required'),
});

type Props = {};

const CommunityInfo: React.FC<Props> = () => {
  const dispatch = useAppDispatch();
  const axios = useAxios();
  const settingModal = useModal(Modals.CommunitySettings);
  const { current: { community } } = useCommunity();

  const handleUpdate = async (state: CommunityInfoState) => {
    
    settingModal.close();
    const toastId = toast.loading('Updating Community Info');
    try {
      const avatar = state[CommunityInfoFields.ProfilePic];
      const banner = state[CommunityInfoFields.BannerPic];
      if (avatar instanceof File) {
        toast.update(toastId, {
          render: 'Setting Avatar Image',
        });
        const ms = mediaStorage(MediaUse.COMMUNITY_AVATAR);
        const result = await ms.uploadFile(avatar, community.id.toString());
        if (result.ok) {
          const mediaRecord = ms.getMediaRecord(result.path, avatar);
          await axios.put(`/media?relationId=${community.id}`, mediaRecord);
        } else {
          toast.error('Error uploading Avatar');
        }
      }
      if (banner instanceof File) {
        toast.update(toastId, {
          render: 'Setting Banner Image',
        });
        const ms = mediaStorage(MediaUse.COMMUNITY_BANNER);
        const result = await ms.uploadFile(banner, community.id.toString());
        if (result.ok) {
          const mediaRecord = ms.getMediaRecord(result.path, banner);
          await axios.put(`/media?relationId=${community.id}`, mediaRecord);
        } else {
          toast.error('Error uploading Banner');
        }
      }
      
    } catch (error) {
      toast.error('Could not upload images for some reason. :/\nPlease try again later.');
      console.error(error);
    }

    const communityUpdate : Prisma.CommunityUpdateInput = {
      name: state[CommunityInfoFields.Name],
      description: state[CommunityInfoFields.Description],
    };
    const update = await axios.put(`/community/${community.id}`, communityUpdate);
    if (update) {
      toast.update(toastId, {
        render: 'Successfully updated community',
        isLoading: false,
        type: 'success',
        autoClose: 3000,
      });
    } else {
      toast.update(toastId, {
        render: 'Problem updating community',
        isLoading: false,
        type: 'error',
        autoClose: 3000,
      });
    }
    
  };

  // const { banner, profile } = useCommunityMedia(community.id);

  const banner = useMedia(community.banner);
  const avatar = useMedia(community.avatar);


  return (
    <Layout title={CommunitySettingsTabs.CommunityInfo}>
      <Formik
        enableReinitialize
        onSubmit={handleUpdate}
        validationSchema={CommunityInfoSchema}
        initialValues={{
          name: community.name,
          description: community.description,
        }}
      >
        <Form
          onChange={console.log}
        >
          <FormDebug name='Community Settings - Info'/>
          <ImageHeader>
            <Field
              name={CommunityInfoFields.BannerPic}
              component={UploadBanner}
              preview={banner}
            />

            <Field
              name={CommunityInfoFields.ProfilePic}
              component={UploadPfp}
              preview={avatar}
            />
          </ImageHeader>

          <Space direction='column'/>
          <Space direction='column'/>

          <Field
            name={CommunityInfoFields.Name}
            as={FormInput}
            label="Name"
            placeholder="Elon Musk"
          />
          <ErrorMessage name={CommunityInfoFields.Name}>
            {msg => `Community name ${msg}`}
          </ErrorMessage>

          <Field
            name={CommunityInfoFields.Description}
            as={FormTextarea}
            label="Description"
            placeholder="Tell us about your community"
            height="10em"
          />

          <Button>Save Changes</Button>
        </Form>
      </Formik>

    </Layout>
  );
};

export default CommunityInfo;
