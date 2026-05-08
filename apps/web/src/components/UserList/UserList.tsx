// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { User } from '@src/types/prisma';

import UserTile from 'components/User/UserTile';

import { ListContainer, ListItem } from './styled';

interface Props {
  users: User[];
}

const UserList: React.FC<Props> = ({
  users,
}) => {
  return (
    <ListContainer>
      {users.map((user) => (
        <ListItem key={`tile-${user.uuid}`}>
          <UserTile user={user} withDescription={true} />
        </ListItem>
      ))}
    </ListContainer>
  );
};


export default UserList;
