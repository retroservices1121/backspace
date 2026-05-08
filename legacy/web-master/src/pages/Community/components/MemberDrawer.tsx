// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Drawer from 'components/Drawer';
import UserTile from 'components/UserActionTile';
import { PermissionsName } from 'shared/types/documents';
import { fetchMembers, MemberUnion } from 'store/communitySlice';
import { RootState } from 'store/store';
import { Row } from 'styles/Flex';
import { Space } from 'styles/layout';

import { MemberList, PermissionLabel } from './styled';
// import { Icon } from 'styles/Globals';

// import { ReactComponent as RefreshIcon } from 'graphics/commonicons/refresh.svg';

type Props = {
  communityId: string;
};

const generateMemberList = (list : MemberUnion[]) => {
  let prevRole = -1;
  const sortedList = [...list]; 
  sortedList.sort((a, b) => {
    if (a.role > b.role) return -1;
    else if (a.role < b.role) return 1;
    else return 0;
  });
  return sortedList.map((mem) => {
    let roleLabel = prevRole != mem.role;
    prevRole = mem.role;
    return (
      <div key={`member-${mem.uid}`}>
        {roleLabel && 
          <PermissionLabel>{PermissionsName[mem.role]}</PermissionLabel>
        }
        <UserTile user={mem.user} />
      </div>
    );
    
  });
};

const MemberDrawer: React.FC<Props> = ({ communityId }) => {
  const dispatch = useDispatch();
  const members = useSelector((state: RootState) => state.community.members);
  
  useEffect(() => {
    dispatch(fetchMembers());
  }, [communityId]);
  

  return (
    <Drawer title="Members" color='backgroundDark' side='right' initialCollapsed hideOnMobile>
      <Space direction="column" />
      <Row $center>
        <h4>Community Members </h4>
        {/* TODO Below commented should work but doesn't */}
        {/* <Space />
        <Icon color="fontTertiary" clickable as={RefreshIcon} onClick={() => refreshMembers(communityId)}/>   */}
      </Row>
      <MemberList>
        {generateMemberList(members || [])}
      </MemberList>
    </Drawer>
  );
};

export default MemberDrawer;
