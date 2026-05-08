// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { HorizontalLine } from 'styles/Dividers';
import { OldCol, OldRow } from 'styles/Flex';
import { Icon } from 'styles/Globals';

import { ListItem } from '../Community/ChannelItem/styled';

// Community Bar
export const CommunityBarContainer = styled(OldCol)`
  width: 100%;
  max-width: 108px;
  height: 100%;
  align-items: center;

  padding-top: 10px;
  background: transparent;
  border-right: 2px solid ${({ theme }) => theme.backgroundLight};
`;

export const ColumnBreak = styled(HorizontalLine)`
  width: 80%;
  margin: 15px 0px;
`;

//Same as style in CommunityIcon
export const ImageButton = styled.button`
  cursor:pointer;

  position: relative;

  font-size: 20px;
  line-height: 24px;

  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.backgroundLight};

  width: 48px;
  height: 48px;
  border-radius: 8px;

  margin: 5px auto;
  padding: 15px;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  fill: ${({ theme }) => theme.fontFocus};

  &:hover {
    border: 2px solid ${({ theme }) => theme.secondary};
    fill: ${({ theme }) => theme.secondary};
  }
`;

// Channel Bar
export const ChannelBarContainer = styled(OldCol)`
  width: 100%;
  max-width: 254px;
  height: 100%;
  align-items: center;
  background: ${({ theme }) => theme.backgroundNormal};
  text-align: left;
`;

export const BannerImageContainer = styled.div`
  position: relative;
  width: inherit;
  height: 125px;
  margin-bottom: 10px;
`;

export const BannerImage = styled.img`
  width: inherit;
  height: inherit;
  object-fit: cover;
`;

export const Overlay = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(rgba(0,0,0,0.9), rgba(0,0,0,0), rgba(0,0,0,0.9));
`;

export const CommunityTitle = styled.h4`
  color: ${({ theme }) => theme.fontPrimary};
  position: absolute;
  top: 10px;
  left: 20px;
  width: 80%;
`;


export const ChannelListLabel = styled(OldRow)`
  width: 80%;
  text-align: left;
  justify-content: space-between;
  margin-bottom: 10px;
`;

// Reusing listitem so it changes if we change channel bar
export const AddChannel = styled(ListItem)`
  opacity: 1.0;

  &:hover {
    color: ${({ theme }) => theme.fontFocus};
    background: transparent;
    filter: brightness(1.3);
  }
`;

export const MemberList = styled(OldCol)`
  margin: 20px;
  width: fit-content;
  height: fit-content;
`;

export const PermissionLabel = styled.h5`
   color: ${({ theme }) => theme.primary};
`;

export const CommunityActions = styled(OldRow)`
  position: absolute;
  bottom: 10px;
  left: 10px;
`;

export const CommunityActionIcon = styled(Icon)`
  margin: 5px;
`;
