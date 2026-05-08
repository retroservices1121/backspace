// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';

import { Row } from 'styles/Flex';

type TimeCrossProps = {
  show : boolean
};


export const TimeCrossOver = styled(Row)<TimeCrossProps>`
  width: 100%;
  margin: 20px 0px;
  text-align: center;
  align-items: center;

  ${({ show }) => !show && css`
    display: none;
  `};
`;

export const TimeText = styled.span`
  min-width: fit-content;
  font-weight: normal;
  font-size: 14px;
  line-height: 20px;
  margin: 0px 10px;
  color: ${({ theme }) => theme.fontTertiary};
`;
