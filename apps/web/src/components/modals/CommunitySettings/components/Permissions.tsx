// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions } from '@prisma/client';
import useMember from '@src/hooks/useMember';
import { Field, Form, Formik } from 'formik';
import { capitalize, noop } from 'lodash';

import { AvatarTypes } from 'components/Avatar/Avatar';
import Select from 'components/Select';
import { Option } from 'components/Select/types';
import { AvatarHeader } from 'components/UserHeader/UserHeader';
import useMedia from 'hooks/useMedia';
import { useUserById } from 'hooks/useUser';
import { FormEffect } from 'lib/formik';
import { FlexSpaceBetween } from 'styles/Flex';
import { Member } from 'types/prisma';

import { CommunitySettingsTabs } from '../components';
import Layout from '../components/Layout';
import { MemberContainer, SelectContainer } from '../styled';

const SelectPermissions: Option[] = [
  {
    label: 'Banned',
    value: Permissions.BLOCKED,
  },
  {
    label: 'Non-Member',
    value: Permissions.EVERYONE,
  },
  {
    label: capitalize(Permissions.MEMBER),
    value: Permissions.MEMBER,
  },
  {
    label: capitalize(Permissions.SUBSCRIBER),
    value: Permissions.SUBSCRIBER,
  },
  {
    label: capitalize(Permissions.MODERATOR),
    value: Permissions.MODERATOR,
  },
  {
    label: capitalize(Permissions.ADMIN),
    value: Permissions.ADMIN,
  },
];

type PermissionForm = {
  role: Option;
};

type Props = {
  members: Member[];
};


// TODO get rid of this by refactoring this whole page to use something that already exists e.g. MemberList
const Avatar = ({ member }: { member: Member }) => {
  const user = useUserById(member.user.uuid);
  const avatar = useMedia(user.avatar);
  return (
    <AvatarHeader
      type={AvatarTypes.User}
      title={user.name}
      image={avatar}
      // online={OnlinePresence.Online}
      subtitle={user.username}
    />
  );
};


const PermissionsTab: React.FC<Props> = ({ members }) => {
  // const dispatch = useAppDispatch();
  const membership = useMember();
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
                    membership.update(member.communityId, member.userId, values.role.value);
                  }
                }}
              />
              <FlexSpaceBetween $center>
                <Avatar member={member}/>
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
export default PermissionsTab;
