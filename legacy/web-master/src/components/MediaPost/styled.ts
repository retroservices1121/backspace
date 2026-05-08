// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

/*eslint-disable*/
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

export const Card = styled.div<{ isFeatured?: boolean }>`
  background: ${({ theme }) => theme.backgroundMedium};
	${tw`my-3 sm:my-6 sm:mx-2 sm:px-2 sm:px-6 pt-2 pb-4 w-[screen] md:w-[550px] sm:rounded-3xl`}
  ${({ isFeatured }) => isFeatured && css`
    border: 2px solid;
    border-color: ${({ theme }) => theme.primary};
  `}
  border: 1px solid ${({theme}) => theme.dividerColor};
`;

export const FadeText = styled.p<{ exists?: boolean }>`
  ${tw`mx-4 my-4 cursor-pointer`}
  ${({ exists }) => exists && css`
    background-image: linear-gradient(to top, transparent, ${({ theme }) => theme.fontPrimary});
    ${tw`overflow-hidden max-h-36 text-transparent bg-clip-text`}
  `}

`;

// TODO: Make This Into A Global Icon
export const IconPlusText = styled.div`
  background: ${({ theme }) => theme.backgroundLight};
	${tw`mx-2 p-3 flex items-center cursor-pointer rounded-xl`}
`;
export const ReadMoreButton = styled.div`
  background: ${({ theme }) => theme.backgroundMedium};
	${tw`absolute right-0 bottom-0 pl-2 pb-0.5`}
`;

export const OptionsButton = styled.div`
  border-color: ${({ theme }) => theme.fontSecondary};
	${tw`py-6 text-center cursor-pointer`}
`;

export const DisplayName = styled.h4`
  color: ${({ theme }) => theme.fontPrimary};
`;

export const FollowButton = styled.button`
  border-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
	${tw`mx-2 cursor-pointer py-3 px-6 font-semibold rounded-2xl border-2`}
`;

export const CommentButton = styled.button`
  color: ${({ theme }) => theme.primary};
`;

/** Old references from MediaPostV1*/

/*eslint-disable*/
import ReactPlayer from 'react-player';
import { Col, Row } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { mediaQuery } from 'styles/Globals';

export const Avatar = styled.img`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin: 0px 16px;
`;

export const MediaContainer = styled(Col)`
  position: relative;
  justify-content: space-around;
  align-items: center;
  background-color: ${({ theme }) => theme.backgroundNormal}; 
  width: 500px;
  height: auto;
  ${mediaQuery.sm} {
    max-width: 100%;
    max-height: 100%;
  }
  border-radius: 15px;
  /* border: 2px solid ${({ theme }) => theme.backgroundLight}; */
  margin: 20px auto;
`;

export const Media = styled.img`
  border-radius: 15px;
  width: 100%;
  height: auto;
  max-height: 800px;
  object-fit: cover;
  ${mediaQuery.sm} {
    max-height: 300px;
  }
`;

export const MediaPlayer = styled(ReactPlayer)`
  border-radius: 15px;
  width: 100%;
  height: auto;
  max-height: 800px;
  object-fit: cover;
  ${mediaQuery.sm} {
    max-height: 300px;
  }
`;

export const FilledIcon = styled(Icon)`
  /* If Active */
  ${({ $active: active, $activeColor: activeColor }) => active && css`
    stroke: ${active ? activeColor : 'none'};
    fill: ${active ? activeColor : 'none'};
  `}
`;

export const PostStatistics = styled(Row)`
  margin-right: 15px;
  width: fit-content;
  font-size: 14px;
  color: var(--fontTertiary);
`;


export const AuthorContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

export const ActionContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

export const UserName = styled.span`
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontTertiary};
  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`;

export const Title = styled.div`
  font-weight: bold;
  font-size: 20px;
  line-height: 26px;
  color: var(--fontFocus);
  margin: 10px 0px;
  overflow-wrap: break-word;
`;

export const Text = styled.div`
  font-weight: normal;
  font-size: 16px;
  line-height: 24px;
  color: var(--fontSecondary);
  overflow-wrap: break-word;
  margin: 5px 0px;
  white-space: pre-line;
`;

export const PostTime = styled.div`
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  color: var(--fontTertiary);
  margin-top: 8px;
`;

export const UserTime = styled.div`
  display: flex;
  align-items: center;
`;