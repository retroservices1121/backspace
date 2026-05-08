// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { ClickableSpan } from 'styles/Buttons';

export const MentionSpan = styled(ClickableSpan)`
  color: ${({ theme }) => theme.primary};
  font-size: inherit;
  line-height: inherit;
`;