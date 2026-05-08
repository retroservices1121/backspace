// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import ReactDOM from 'react-dom';
import { Transforms } from 'slate';

import { CustomEditor, MentionElement } from './CustomTypes';

//** ##### MENTIONS SUPPORT #### */

export const Portal = ({ children } : { children:any }) => {
  return typeof document === 'object'
    ? ReactDOM.createPortal(children, document.body)
    : null;
};


export const withMentions = (editor : CustomEditor) => {
  const { isInline, isVoid } = editor;

  editor.isInline = element => {
    return element.type === 'mention' ? true : isInline(element);
  };

  editor.isVoid = element => {
    return element.type === 'mention' ? true : isVoid(element);
  };

  return editor;
};

export const insertMention = (editor : CustomEditor, username: string) => {
  const mention: MentionElement = {
    type: 'mention',
    user: username,
    // @ts-ignore
    children: [{ text: `@${username}` }],
  };
  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
};