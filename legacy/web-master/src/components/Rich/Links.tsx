// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Editor, Range, Transforms } from 'slate';

import { CustomEditor, LinkElement } from './CustomTypes';

const validURL = (str : string)=> {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
};

export const insertLink = (editor : CustomEditor, url: string) => {
  const link: LinkElement = {
    type: 'link',
    url: url,
    children: [{ text: url }],
  };
  Transforms.insertNodes(editor, link);
  Transforms.move(editor);
};

export const withLinks = (editor : CustomEditor) => {
  const { insertText, isInline, isVoid } = editor;

  editor.isInline = element => {
    return element.type === 'link' ? true : isInline(element);
  };

  editor.isVoid = element => {
    return element.type === 'link' ? true : isVoid(element);
  };
  

  editor.insertText = (text) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const wordArray = Editor.string(editor, []).split(' ');
      const lastWord = wordArray[wordArray.length - 1];
      const wordLength = lastWord.length - 1; // -1 is for whitespace
      const wordBefore = Editor.before(editor, start, { distance: wordLength });
      // const wordBefore = Editor.before(editor, start, { unit: 'word' });
      const before = wordBefore && Editor.before(editor, wordBefore);
      const beforeRange = before && Editor.range(editor, before, start);
      // const beforeText = beforeRange && Editor.string(editor, beforeRange).trim();
      // const beforeMatch = beforeText && beforeText.match(/^\<(\w+)$/);
      const beforeMatch = lastWord && validURL(lastWord);
      const afterMatch = text.match(/(\s)/);

      if (beforeMatch && afterMatch) {
        Transforms.select(editor, beforeRange || start);
        insertLink(editor, lastWord);
        Transforms.select(editor, Editor.end(editor, []));
      }
    }

    insertText(text);
  };

  return editor;
};