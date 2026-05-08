import styled, { css } from 'styled-components';

import { ButtonSmall } from 'styles/Buttons';

export const InterestButton = styled(ButtonSmall)`
  font-size: 16px;
  line-height: 1;
  ${({ selected }) => !selected && css`
    opacity: 0.5;
  `}
  border: 1px outset ${({ theme }) => theme.primary};
`;


