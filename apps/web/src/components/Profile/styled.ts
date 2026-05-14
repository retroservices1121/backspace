// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';

import { ButtonLarge, IconButton } from 'styles/Buttons';
import { OldCol, OldRow } from 'styles/Flex';
import { mediaQuery } from 'styles/Globals';
import { Layout } from 'styles/layout';

type BannerProps = {
  img?: string;
};

const bannerHeight = '200px';

export const ProfileHeaderContainer = styled.div`
  margin-bottom: 10px;
  display: flex;
  flex-wrap: nowrap;
  ${mediaQuery.sm} {
    flex-wrap: wrap;
  }
`;

export const Container = styled(OldCol)`
  height: 100%;
  max-height: 100%;
  width: 100%;
  max-width: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
  h4 {
    margin: 10px 0px;
  }
`;

export const Banner = styled.div<BannerProps>`
  position: relative;
  width: inherit;
  height: ${bannerHeight};
  min-height: ${bannerHeight};
  object-fit: cover;
  border-radius: 20px;
  margin: 5px auto 50px auto;
  border: 2px solid ${({ theme }) => theme.backgroundLight};
  ${({ img, theme }) => (img && css`
    background: no-repeat center/100% url(${img});
  `) || css`
    background: linear-gradient(to top, rgba(${theme.primary_rgb}, 0.2), ${theme.none});
  `}
  
`;

export const ProfileContent = styled(Layout)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: fit-content;
  margin: 0px auto;
  padding: 10px;
`;

// $org squares off the frame (matching the Avatar's 10% radius) so an
// ORG account's square avatar isn't ringed by a leftover circle.
export const ProfileImage = styled.div<{ $org?: boolean }>`
  position: absolute;
  top: calc(${bannerHeight}/3);
  left: 10%;
  border: 5px solid var(--backgroundLight);
  box-sizing: border-box;
  border-radius: ${({ $org }) => ($org ? '10%' : '50%')};
  object-fit: cover;
`;

export const ProfileInfo = styled.div`
  text-align: left;
  width: 100%;
  margin-right: auto;
  padding: 20px;
`;

export const ProfileInteractions = styled(OldRow)`
  width: 100%;
  //TODO do something better for mobile
  max-width: 90vw;
  margin: 20px 0px;
`;

export const InteractionButton = styled(ButtonLarge)`
  font-weight: normal;
  font-size: 16px;
  line-height: 24px;
  margin-right: 10px;
  width: 200px;
  max-width: 100%;
  border: 1px solid ${({ theme }) => theme.backgroundLight};
`;

export const LightInteractionButton = styled(ButtonLarge)`
  font-weight: bold;
  font-size: 16px;
  line-height: 24px;
  margin-right: 10px;
  width: 200px;
  max-width: 100%;
  ${({ theme }) => css`
    border-color: transparent;
    background-color: rgba(${theme.primary_rgb}, 0.2);
    color: ${theme.primary};
  `}
`;

export const SocialButton = styled(IconButton)`
  margin: 0px;
  margin-right: 10px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.backgroundLight};
`;

export const ProfileStats = styled(OldRow)`
  justify-content: space-between;
  width: 100%;
  margin: 20px auto;
`;

export const ProfileDescription = styled.div`
  font-weight: normal;
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.fontSecondary};
  width: 100%;
  height: fit-content;
`;

export const ProfileCommunity = styled(OldCol)`
  background: var(--backgroundNormal);
  width: 100%;
  height: fit-content;
  max-height: 100%;
  border-radius: 20px;
  padding: 20px 30px;
  justify-content: center;
  align-content: center;
  text-align: center;
  * {
    margin: 5px auto;
  }

  margin-left: 30px;
  margin-right: auto;
  ${mediaQuery.sm} {
    margin-left: 5px;
  }
`;

export const PostList = styled(OldRow)`
  justify-content: flex-start;
  width: 100%;
  height: fit-content;
  flex-wrap: wrap;
  margin: 20px auto;
`;

export const ContentContainer = styled.div`
 display: flex;
 justify-content: center;
`;

export const FollowContainer = styled.div`
  margin: 40px;
`;

export const TabSwitchContainer = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.backgroundMedium};
  margin-bottom: 30px;
  padding: 15px 30px;
  border-radius: 10px;
`;

export const PointerCursor = styled.div`
  cursor: pointer;
`;


