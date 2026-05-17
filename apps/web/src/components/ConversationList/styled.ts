// Conversation row styling on the new design tokens. Block is the
// row container; Title is the headline (display name / group name);
// Description is the muted secondary line; UnreadCount is the small
// brand-2 badge for unread counts (unused for now, retained for
// future wiring).
import styled, { css } from 'styled-components';

import { OldRow } from 'styles/Flex';

type Props = {
  active?: boolean;
};

export const Block = styled.div<Props>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  border-bottom: 1px solid var(--line);
  transition: background-color 0.15s ease;

  ${({ active }) => active && css`
    background-color: var(--brand-soft);
  `}

  &:hover {
    background-color: var(--hover);
  }
`;

export const Title = styled.span`
  flex: 1;
  min-width: 0;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: var(--ink);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Time = styled.span<Props>`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 20px;
  color: var(--ink-3);
  margin-left: auto;
`;

export const Description = styled.span<Props>`
  display: block;
  font-size: 12px;
  line-height: 16px;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const UnreadCount = styled(OldRow)`
  justify-content: center;
  align-items: center;
  width: 22px;
  min-width: 22px;
  height: 22px;
  min-height: 22px;
  border-radius: 99px;
  background-color: var(--brand-2);
  color: var(--ink);
  font-size: 11px;
  font-weight: 600;
`;
