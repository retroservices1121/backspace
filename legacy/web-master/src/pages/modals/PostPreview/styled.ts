// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford, Brenton Beltrami
// Description: Styling

import ReactPlayer from 'react-player';
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { IconButton } from 'styles/Buttons';
import { Col, Row } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { mediaQuery } from 'styles/Globals';

type Props = {
  show : boolean
};

export const CloseContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 5px;
`;

export const PreviewContainer = styled.div`
  display: flex;
  min-height: 500px;
  width: fit-content;
  ${mediaQuery.sm} {
    display: inline;
  }
`;

export const InputContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundNormal};
  ${tw`w-full absolute bottom-0 sm:static`}
`;

export const MediaContainer = styled(Col)`
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.backgroundNormal};
  width: 800px;
  max-width: 50vw;
  height: inherit;
  max-height: 1000px;
  ${mediaQuery.sm} {
    width: fit-content;
    max-width: 100%;
    height: auto;
    max-height: 100%;
    display: none; //dylan added this
  }
  border-radius: 15px;
  border: 2px ridge ${({ theme }) => theme.backgroundLight};
  margin: auto;
`;

export const Media = styled.img`
  border-radius: 15px;
  width: 100%;
  height: 100%;
  object-fit: cover;
  ${mediaQuery.sm} {
    max-height: 300px;
  }
`;

export const MediaPlayer = styled(ReactPlayer)`
  border-radius: 15px;
  width: 100%;
  height: 100%;
  ${mediaQuery.sm} {
    max-height: 300px;
  }
`;

export const CommentTime = styled.div`
  color: ${({ theme }) => theme.fontSecondary};
  padding-left: 10px;
`;

export const LikeIconContainer = styled.div`
  width: 18px;
  padding-right: 3px;
  stroke: white;
`;

export const AuthorContainer = styled.div`
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  width: 500px;
`;

export const DetailsContainer = styled.div`
  margin: 10px;
  width: 500px;
  max-width: 100%;
  height: inherit;
  display: flex;
  flex-direction: column;
  ${mediaQuery.sm} {
    height: 100%;
    width: 100%;
  }
`;
export const CommentsContainer = styled.div`
  width: 500px;
  height: 400px;
  max-height: 80vh;
  max-width: 500px;
  overflow-y: auto;
  ${mediaQuery.sm} {
    height: 100%;
    width: 100%;
  }
`;

export const SubmitCommentContainer = styled.div<{ hasMedia?: boolean }>`
  position: absolute;
  bottom: 0;
  width: 39%;

  ${({ hasMedia }) => hasMedia === false && css`
    width: 97%;
  `}
`;


export const PostMessageContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.backgroundLight};
`;

export const BlueButton = styled.div`
  background-color: ${({ theme }) => theme.primary};
  border-radius: 20%;
  padding: 10px 4px 0px 8px;
  width: 40px;
  height: 40px;
`;

export const EmojiContainer = styled.div`
  margin-top: 10px;
`;

export const ActionContainer = styled.div`
  margin-top: 10px;
`;

export const LikesContainer = styled.div`
  display: flex;
  margin: 10px 0px;
`;

export const Likes = styled.div`
  font-weight: normal;
  font-size: 14px;
  color: ${({ theme }) => theme.fontSecondary};
`;

export const LikesAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin: 0px 10px;
`;

export const ActionButton = styled(IconButton)`
  background-color: ${({ theme }) => theme.backgroundLight};
  border-radius: 20%;
  margin: 0px 4px;
  width: 40px;
  height: 40px;
`;
/*
  white-space: pre-line;
 -ms-overflow-style: none;
  scrollbar-width: none;
    &::-webkit-scrollbar {
    display: none;
  }
    */

export const Text = styled.div`
  color: ${({ theme }) => theme.fontSecondary};
  ${tw`text-2xl leading-9 break-words min-h-[45px] overflow-auto`}
`;

export const BackgroundOverlay = styled.div<Props>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(10px);
  z-index: 3;
  display: flex;
  justify-content: center;

  ${({ show }) => !show && css`
    display: none;
  `}
`;

export const PostOptions = styled(Col)`
  width: 100%;
  height: 100%;
  padding: 20px;
  text-align: left;
`;

export const ClosePostIcon = styled(Icon)`
  position: absolute;
  top: 20px;
  right: 20px;
`;

export const UserName = styled.span`
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontTertiary};
  &:hover {
    color: ${({ theme }) => theme.primary};
  }
`;

export const TimeContainer = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.fontSecondary};
  margin: 0px 10px;
`;

export const InputTitle = styled.input`
  min-height: 47px;
  width: 100%;

  margin-top: 20px;

  background-color: transparent;
  border: none;

  color: ${({ theme }) => theme.fontSecondary};
  font-weight: bold;
  font-size: 26px;
  line-height: 32px;
  &:focus {
    color: ${({ theme }) => theme.fontFocus};
  }
`;

export const InputText = styled.textarea`
  min-height: 150px;
  width: 100%;
  background-color: transparent;
  border: none;

  color: ${({ theme }) => theme.fontSecondary};
  font-size: 16px;
  line-height: 24px;
  &:focus {
    color: ${({ theme }) => theme.fontFocus};
  }
`;

export const Option = styled(Row)`
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  line-height: 34px;
  color: ${({ theme }) => theme.fontFocus};
  border-top: 1px dotted ${({ theme }) => theme.backgroundLight};
  padding: 10px 0px;
`;

export const OptionDescription = styled.div`
  width: 100%;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontTertiary};
  text-align: left;
`;

export const Select = styled.select`
  background-color: transparent;
  margin: 10px 20px;
  min-width: 200px;
  min-height: 34px;
  border: 1px solid ${({ theme }) => theme.backgroundLight};
  border-radius: 8px;
  color: ${({ theme }) => theme.primary};
`;
