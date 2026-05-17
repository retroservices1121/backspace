// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled, { css } from 'styled-components';

import { Icon } from 'styles/Globals';

export const Container = styled.div`
  background-color: var(--canvas);
  border-bottom: 1px solid var(--line);
  color: var(--ink);
`;

export const ClickableContainer = styled.div<{ clickable?: boolean }>`
  display: flex;
  align-items: center;
  ${({ clickable }) => clickable && css`
    cursor: pointer;
  `}
`;

export const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin: 0px 16px;
`;

export const Title = styled.h3`
  margin: 0px 15px;
  color: var(--ink);
`;

export const VerificationIcon = styled(Icon)`
  margin-top: 7px;
  margin-left: -10px;
  height: 25px;
  width: 25px;
`;
export const Description = styled.h5`
  margin-left: 10px;
  color: var(--ink-3);
  overflow-wrap: break-word; //Shouldn't be need, but might be on mobile
`;

export const TextHighlight = styled.span`
  margin: 0px 15px;
  font-weight: 600;
  color: var(--brand-2);
`;
