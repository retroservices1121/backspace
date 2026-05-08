// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';

type FlexProps = FlexCenter & {
  $direction?: 'row' | 'column';
  $full?: boolean;
  $wrap?: boolean;
};

type FlexCenter = {
  /** Horizontally and vertically center an element */
  $center?: boolean;
  /** Horizontally center an element */
  centerX?: boolean;
  /** Vertically center an element */
  centerY?: boolean;
};

// Styled-component equivalent to SASS mixin
const flexCenter = ({ $center, centerX, centerY }: FlexCenter) => {
  if ($center || (centerX && centerY)) {
    return css`
      align-items: center;
      justify-content: center;
    `;
  }
  if (centerX) {
    return css`
      justify-content: center;
    `;
  }
  if (centerY) {
    return css`
      align-items: center;
    `;
  }
  return '';
};

export const Flex = styled.div.attrs((props : FlexProps) => ({
  $direction: props.$direction || 'row',
  $center: props.$center || false,
  $full: props.$full || false,
  $wrap: props.$wrap || false,
}))`
  flex-wrap: ${({ $wrap }) => $wrap ? 'wrap' : 'no-wrap'};
  display: flex;
  flex-direction: ${({ $direction }) => $direction};
  ${flexCenter}

  ${({ $full }) => $full && css`
    width: 100%;
    height: 100%;
  `};
`;

export const FlexSpaceBetween = styled(Flex)`
  justify-content: space-between;
`;

export const FlexSpaceEvenly = styled(Flex)`
  justify-content: space-evenly;
`;

export const Row = styled(Flex)`
  flex-direction: row;
`;

export const Col = styled(Flex)`
  flex-direction: column;
`;

export const FlexBreakRow = styled.div`
  height: 0px;
  width: 100%;
`;