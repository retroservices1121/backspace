// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { mediaQuery } from 'styles/Globals';

export const EndOfMessages = styled.h5` 
  white-space: nowrap;
  width: max-content;
  color: ${({ theme }) => theme.primary};
  ${mediaQuery.sm} {
    width: 60%;
  }
`;

export const LoadMoreNotice = styled.div`
  text-align: center;
  width: 100%;
  height: 100%;
  padding: 30px;
`;

export const Container: React.FC = ({ children }) => (
  <div className='w-full h-full overflow-auto flex flex-col-reverse hide-scroll'>
    {/* This div is needed to avoid needing to reverse the content */}
    <div>
      {children}
    </div>
  </div>
);