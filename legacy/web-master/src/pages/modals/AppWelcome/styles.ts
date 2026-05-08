// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

export const Container = styled.div`
  padding: 30px 20px;
  width: 100%;
  max-Width: 800px;
  margin: auto;
  text-align: center;
`;

export const Header = styled.div`
  width: 100%;
  height: fit-content;
  border: 2px outset ${({ theme }) => theme.backgroundLight};
  background-color: ${({ theme }) => theme.backgroundLight};
  border-radius: 0.2em;
  padding: 20px;
  font-size: 26px;
  line-height: 35px;
  font-weight: bold;
  margin: 0px 0px 10px 0px;
`;

export const Content = styled.div`
  margin: auto;
  padding: 20px;

  font-size: 18px;
  line-height: 24px;
  font-weight: normal;
`;

export const Media = styled.img`
  width: 100%;
  height: auto;
  padding: 15px;
`;

export const ColoredSpan = styled.span`
  color: ${({ theme }) => theme.primary}
`;
