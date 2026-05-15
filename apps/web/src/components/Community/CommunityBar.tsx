// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import CommunityIcon from 'components/CommunityIcon';
import useCommunity from 'hooks/entities/useCommunities';
import useCommunityById from 'hooks/entities/useCommunity';
import useMedia from 'hooks/useMedia';
import useModals from 'hooks/useModals';
import constants from 'styles/Globals';

import { ColumnBreak, CommunityBarContainer } from './styled';

type ItemProps = {
  id: string;
  active: boolean;
};

const CommunityItem: React.FC<ItemProps> = ({ id, active }) => {
  const { community, changeCommunity } = useCommunityById(id);
  const avatar = useMedia(community?.avatar);
  const { toggleDrawer } = useModals();
  const handleClick = () => {
    changeCommunity();
    // On mobile the drawer is a fullscreen overlay — close it so the
    // user sees the newly-selected community's channel feed update.
    if (typeof window !== 'undefined'
        && window.innerWidth <= parseInt(constants.SMALLSCREEN_WIDTH, 10)) {
      toggleDrawer();
    }
  };
  return (
    <CommunityIcon
      image={avatar}
      communityName={community.name}
      active={active}
      onClick={handleClick}
    />
  );
};

const CommunityBar: React.VFC = () => {
  const { current, communityOrder, featured } = useCommunity();
  return (
    <CommunityBarContainer>
      {/* FIXME featured breaks a bunch of stuff, so for now -> no featured :( -Sam */}
      {/* {featured && (
        <CommunityItem
          id={featured.uuid}
          active={featured.uuid === current.community.uuid}
        />
      )}
      {featured && <ColumnBreak/>} */}
      {communityOrder.map((uuid) => (
        <CommunityItem
          id={uuid}
          active={uuid === current.community.uuid}
        />
      ))}
      {/* Removed for bc-290*/}
      {/* <ImageButton onClick={() => {}} as={PlusIcon}></ImageButton>  */}
    </CommunityBarContainer>
  );
};

export default CommunityBar;
