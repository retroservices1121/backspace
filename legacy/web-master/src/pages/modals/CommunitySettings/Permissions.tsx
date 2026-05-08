// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useDispatch, useSelector } from 'react-redux';
import { Field, Form, Formik } from 'formik';
import { noop } from 'lodash';

import { AvatarTypes } from 'components/Avatar/Avatar';
import Select from 'components/Select';
import { Option } from 'components/Select/types';
import { AvatarHeader } from 'components/UserHeader/UserHeader';
import { FormEffect } from 'lib/formik';
import { OnlinePresence, PermissionsName, PermissionsType } from 'shared/types/documents';
import { updateMember } from 'store/communitySlice';
import { RootState } from 'store/store';
import { FlexSpaceBetween } from 'styles/Flex';

import { CommunitySettingsTabs } from './components';
import Layout from './components/Layout';
import { MemberContainer, SelectContainer } from './styled';

const SelectPermissions: Option[] = [
  {
    label: 'Banned',
    value: PermissionsType.Banned,
  },
  {
    label: 'Non-Member',
    value: PermissionsType.Anyone,
  },
  {
    label: PermissionsName[PermissionsType.Members],
    value: PermissionsType.Members,
  },
  {
    label: PermissionsName[PermissionsType.Subscribers],
    value: PermissionsType.Subscribers,
  },
  {
    label: PermissionsName[PermissionsType.Moderators],
    value: PermissionsType.Moderators,
  },
  {
    label: PermissionsName[PermissionsType.Admin],
    value: PermissionsType.Admin,
  },
];

type PermissionForm = {
  role: Option;
};

const Permissions: React.FC = () => {
  const members = useSelector((state: RootState) => state.community.members || []);
  const dispatch = useDispatch();

  return (
    <Layout title={CommunitySettingsTabs.RolesAndPermissions}>
      <MemberContainer>
        {members.map(member => (
          <Formik<PermissionForm>
            initialValues={{
              role: SelectPermissions.find(option => option.value === member.role) || SelectPermissions[0],
            }}
            onSubmit={noop}
          >
            <Form>
              <FormEffect<PermissionForm>
                onChange={({ values, touched }) => {
                  if (touched.role) {
                    dispatch(updateMember({ id: member.uid, role: values.role.value }));
                  }
                }}
              />
              <FlexSpaceBetween $center>
                <AvatarHeader
                  type={AvatarTypes.User}
                  title={member.user.display_name}
                  image={member.user.avatar}
                  online={OnlinePresence.Online}
                  subtitle={member.user.username}
                />

                <SelectContainer>
                  <Field
                    name="role"
                    component={Select}
                    options={SelectPermissions}
                  />
                </SelectContainer>
              </FlexSpaceBetween>
            </Form>
          </Formik>
        ))}
      </MemberContainer>
    </Layout>
  );
};
export default Permissions;
