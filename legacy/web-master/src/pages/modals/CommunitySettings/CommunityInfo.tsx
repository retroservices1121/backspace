// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { fireStorage } from 'api/firebase';
import { paths } from 'api/firebase';
import { ErrorMessage, FormInput, FormTextarea } from 'components/FormInput';
import { useCommunityMedia } from 'hooks/getCommunityMedia';
import UploadBanner from 'pages/Settings/components/UploadBanner';
// TODO consolidate this and the other UploadPfp into a single component and put it in src/components
import UploadPfp from 'pages/Settings/components/UploadPfp';
// Probably don't import this from here either in the future
import { ImageHeader } from 'pages/Settings/styled';
import { updateCommunity } from 'store/communitySlice';
import { RootState } from 'store/store';
import { Button } from 'styles/form';
import { Space } from 'styles/layout';
import { CommunityInfoFields, CommunityInfoState } from 'types/communitySettings';
import { FormDebug } from 'util/FormDebug';

import { CommunitySettingsTabs } from './components';
import Layout from './components/Layout';


// This file is way worse than it could be. A refactor to how images are handled inside of community needs to be done.
const CommunityInfoSchema = Yup.object().shape({
  [CommunityInfoFields.Name]: Yup.string()
    .min(1, 'is too short')
    .max(250, 'is too long')
    .required('is required'),
});

const CommunityInfo: React.FC<any> = () => {
  const dispatch = useDispatch();
  const community = useSelector((state: RootState) => state.community);

  // Could probably be improved. The way the images are handled rn is a bit unclear...
  const handleUpdate = async (state: CommunityInfoState) => {
    try {
      if (state[CommunityInfoFields.ProfilePic] instanceof File) {
        const media = state[CommunityInfoFields.ProfilePic] as File;
        const path = paths.communityProfile(community.id);
        await fireStorage.uploadFile(path, media);
      }
      if (state[CommunityInfoFields.BannerPic] instanceof File) {
        const media = state[CommunityInfoFields.BannerPic] as File;
        const path = paths.communityCover(community.id);
        await fireStorage.uploadFile(path, media);
      }
    } catch (error) {
      toast.error('Could not upload images for some reason. :/\nPlease try again later.');
      console.error(error);
    }

    dispatch(updateCommunity({
      id: community.id, state: {
        name: state.name,
        description: state.description,
      },
    }));
  };

  const { banner, profile } = useCommunityMedia(community.id);


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
              preview={profile}
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
