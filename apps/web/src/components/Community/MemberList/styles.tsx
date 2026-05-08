// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

export const PermissionLabel = styled.h5`
  color: ${({ theme }) => theme.primary};
`;

export const Container = ({ children }) => (
  <div className="flex flex-col-reverse w-fit h-fit p-5">
    <div>
      {children}
    </div>
  </div>
);
