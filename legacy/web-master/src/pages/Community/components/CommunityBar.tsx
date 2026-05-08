// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useDispatch, useSelector } from 'react-redux';

import { markUserVisited } from 'api/userAPI';
import CommunityIcon from 'components/CommunityIcon';
//Icons
//Removed for bc-290
// import { ReactComponent as PlusIcon } from 'graphics/commonicons/plus.svg';
import { changeCommunity } from 'store/communitySlice';
import { RootState } from 'store/store';

import { ColumnBreak, CommunityBarContainer } from './styled';

type Props = {
  featured: string | undefined;
  list?: Array<string>;
};

const CommunityBar: React.FC<Props> = ({ featured, list }) => {
  const dispatch = useDispatch();
  const currentCommunity = useSelector((state: RootState) => state.community);

  const uid = useSelector((state : RootState) => state.user.id);

  //Remove featured community from displayed list
  let uniqueList = list?.map((element) => element); //cheap copy
  if (uniqueList && featured) {
    const index = uniqueList.indexOf(featured);
    if (index > -1) {
      uniqueList.splice(index, 1);
    }
  }

  const switchCommunity = (id: string) => {
    if (id !== currentCommunity.id) {
    //Mark it as visited
      markUserVisited(uid, id);
      //Switch to it
      dispatch(changeCommunity(id));
    }
  };

  const generateIcons = (communityList : Array<string>, activeId : string) => {
    return communityList.map( (id) => {
      return (
        <CommunityIcon key={id} communityId={id} active={id === activeId} handler={() => switchCommunity(id)}/>
      );
    });
  };
 
  return (
    <div className='w-[100px] h-full'>
      <CommunityBarContainer>
        {featured && generateIcons([featured], currentCommunity.id)}
        <ColumnBreak />
        {list && generateIcons(uniqueList || list, currentCommunity.id)}
        {/* Removed for bc-290*/}
        {/* <ImageButton onClick={() => {}} as={PlusIcon}></ImageButton>  */}
      </CommunityBarContainer>
    </div>
  );
};


export default CommunityBar;
