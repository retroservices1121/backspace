// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useRef } from 'react';
import { Permissions } from '@prisma/client';

import Drawer from 'components/Drawer';
import ListTransition from 'components/ListTransition';
import UserTile from 'components/User/UserTile';
import { useCurrentCommunity } from 'hooks/entities/useCommunity';
import { OldRow } from 'styles/Flex';
import { Space } from 'styles/layout';

import RoleTransition from './RoleTransition';
import { Container } from './styles';

type Props = {};

const MemberList: React.FC<Props> = () => {
  const { members } = useCurrentCommunity();
  const roleRef = useRef(Permissions.EVERYONE);

  return (
    <Drawer title="Members" color='backgroundDark' side='right' initialCollapsed hideOnMobile>
      <Space direction="column" />
      <OldRow $center>
        <h4>Community Members </h4>
      </OldRow>
      <Container>
        {members.map((member) => (
          <>
            <ListTransition
              previous={roleRef}
              current={member.role}
              children={RoleTransition}
            />
            <UserTile user={member.user} />
          </>
        ))}
      </Container>
    </Drawer>
  );
};

export default MemberList;
