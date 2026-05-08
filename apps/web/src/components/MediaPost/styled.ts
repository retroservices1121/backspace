// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Icon } from '@src/styles/Globals';
import styled, { css } from 'styled-components';

export const Card = styled.div<{ isFeatured?: boolean }>`
  background: ${({ theme }) => theme.backgroundMedium};
  ${({ isFeatured }) => isFeatured && css`
    border: 2px solid;
    border-color: ${({ theme }) => theme.primary};
  `}
`;

/*
export const FadeText = styled.p<{ exists?: boolean }>`
  ${tw`mx-4 my-4 cursor-pointer`}
  ${({ exists }) => exists && css`
    background-image: linear-gradient(to top, transparent, ${({ theme }) => theme.fontPrimary});
    ${tw`overflow-hidden max-h-36 text-transparent bg-clip-text`}
  `}
`;
*/

export const Title = styled.div`
  font-weight: bold;
  font-size: 20px;
  line-height: 26px;
  color: var(--fontFocus);
  margin: 10px 0px;
  overflow-wrap: break-word;
`;

export const FilledIcon = styled(Icon)`
  /* If Active */
  ${({ $active: active, $activeColor: activeColor }) => active && css`
    stroke: ${active ? activeColor : 'none'};
    fill: ${active ? activeColor : 'none'};
  `}
`;

export const IconPlusText = styled.div`
  background: ${({ theme }) => theme.backgroundLight};
`;
export const ReadMoreButton = styled.div`
  background: ${({ theme }) => theme.backgroundMedium};
`;

export const OptionsButton = styled.div`
  border-color: ${({ theme }) => theme.fontSecondary};
`;

export const DisplayName = styled.h4`
  color: ${({ theme }) => theme.fontPrimary};
`;

export const FollowButton = styled.button`
  border-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
`;

export const CommentButton = styled.button`
  color: ${({ theme }) => theme.primary};
`;
