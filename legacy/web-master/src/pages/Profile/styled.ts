// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { ButtonLarge, IconButton } from 'styles/Buttons';
import { Col, Row } from 'styles/Flex';
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

export const Container = styled(Col)`
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

export const ProfileImage = styled.div`
  position: absolute;
  top: calc(${bannerHeight}/3);
  left: 10%;
  border: 5px solid var(--backgroundLight);
  box-sizing: border-box;
  border-radius: 50%;
  object-fit: cover;
`;

export const ProfileInfo = styled.div`
  text-align: left;
  width: 100%;
  margin-right: auto;
  padding: 20px;
`;

export const ProfileInteractions = styled(Row)`
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
  min-width: 150px;
  max-width: 100%;
  border: 1px solid ${({ theme }) => theme.backgroundLight};
`;

export const LightInteractionButton = styled(ButtonLarge)`
  font-weight: bold;
  font-size: 16px;
  line-height: 24px;
  margin-right: 10px;
  min-width: 150px;
  width: 200px;
  max-width: 100%;
  ${({ theme }) => css`
    border-color: transparent;
    background-color: rgba(${theme.primary_rgb}, 0.2);
    color: ${theme.primary};
  `}
`;

export const MoreButton = styled(ButtonLarge)`
  font-weight: normal;
  font-size: 16px;
  line-height: 24px;
  margin-right: 10px;
  padding-left: 10px;
  padding-right: 10px;
  width: fit-content;
  max-width: 100%;
  border: 1px solid ${({ theme }) => theme.none};
`;

export const SocialButton = styled(IconButton)`
  margin: 0px;
  margin-right: 10px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.backgroundLight};
`;

export const ProfileStats = styled(Row)`
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

export const ProfileCommunity = styled(Col)`
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

export const PostList = styled(Row)`
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

export const OptionsButton = styled.div`
  border-color: ${({ theme }) => theme.fontSecondary};
	${tw`py-6 text-center cursor-pointer`}
`;



