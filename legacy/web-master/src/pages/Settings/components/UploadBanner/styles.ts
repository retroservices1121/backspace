// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';

type Props = {
  showBorder: boolean
};

export const Container = styled.div<Props>`
  &, img {
    height: 200px;
    width: 100%;
    border-radius: 20px;
    border: 1px solid ${({ theme }) => theme.backgroundLight}
  }

  ${({ showBorder }) => showBorder && css`
    &, img {
      border: 1px dashed ${({ theme }) => theme.fontTertiary};
    }
  `}
  margin: 1.5em 0;

  // For positioning the plus button
  position: relative;
`;

export const EditButtonWrapper = styled.div`
  position: absolute;
  right: 1em;
  top: 1em;
`;
