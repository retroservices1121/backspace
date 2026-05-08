// Copyright 2021 NewSocial Inc.
// Author(s): Brenton Beltrami
// Description: Styling

import { Editable } from 'slate-react';
import styled, { css } from 'styled-components';

import { ClickableSpan } from 'styles/Buttons';

export const InputContainer = styled.div`
	position: relative;
	margin: 1.5rem;
	padding: 0 1.0rem;
	border: 1px solid transparent;
	border-radius: 1rem;
	&:focus-within{
		border: 1px solid #fff;
		border-radius: 1rem;
	}
	background: ${({ theme }) => theme.backgroundLight};
`;

export const ActionsContainer = styled.div`
	border-radius: 1rem;
`;

export const ButtonContainer = styled.div`
	width: 100%;
	border: none;
	border-radius: 1rem;

	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	padding: 5px 0.5rem;
	cursor: text;
`;

export const Counter = styled.div`
	position: absolute;
	bottom: 60px;
	right: 15px;
	padding: 5px 10px;
	border-radius: 0.5rem;
  background: ${({ theme }) => theme.error};
`;

// type SlateInputProps = Editable.EditableProps & { maxHeight?: number };

export const SlateInput = styled(Editable)<{ $maxHeight?: number }>`
	line-height: 1;
	font-size: 16px;
	border: none;
	outline: none;
	resize: none;
	border-radius: 1rem;
	width: 100%;
	height: 100%;
	min-height: 20px;
  max-height: 500px;
  overflow-y: auto;
	overflow-x: hidden;
  ${({ $maxHeight }) => $maxHeight && css`
		max-height: ${$maxHeight}px;
  `}
	margin: auto 0px;
`;


export const PreviewImage = styled.img`
  margin-top: 10px;
  margin-left: 10px;
	overflow: hidden;
  height: 80px;
  max-width: 115px;
  padding: 2px;
  border-radius: 8px;
  &:hover {
    filter: brightness(0.8);
    background-color: red;
  }
`;


export const CodeCustom = styled.pre`
	background-color: ${({ theme }) => theme.backgroundMedium};
	color: ${({ theme }) => theme.fontSecondary};
	font-style: italic;
`;

export const MentionSpan = styled(ClickableSpan)`
  color: ${({ theme }) => theme.primary};
  font-size: inherit;
  line-height: inherit;
`;