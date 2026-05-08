// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import {
  BaseEditor,
  Descendant,
} from 'slate';
import { HistoryEditor } from 'slate-history';
import { ReactEditor } from 'slate-react';

export type BlockQuoteElement = {
  type: 'block-quote'
  align?: string
  children: Descendant[]
};

export type BulletedListElement = {
  type: 'bulleted-list'
  align?: string
  children: Descendant[]
};

export type CheckListItemElement = {
  type: 'check-list-item'
  checked: boolean
  children: Descendant[]
};

export type EditableVoidElement = {
  type: 'editable-void'
  children: EmptyText[]
};

export type HeadingElement = {
  type: 'heading-one'
  align?: string
  children: Descendant[]
};

export type HeadingTwoElement = {
  type: 'heading-two'
  align?: string
  children: Descendant[]
};

export type ImageElement = {
  type: 'image'
  url: string
  children: EmptyText[]
};

export type LinkElement = { type: 'link'; url: string; children: Descendant[] };

export type ButtonElement = { type: 'button'; children: Descendant[] };

export type ListItemElement = { type: 'list-item'; children: Descendant[] };

export type MentionElement = {
  type: 'mention'
  user: string
  children: CustomText[]
};

export type ParagraphElement = {
  type: 'paragraph'
  align?: string
  children: Descendant[]
};

export type CodeElement = {
  type: 'code'
  children: Descendant[]
};

// export type TableElement = { type: 'table'; children: TableRow[] };

export type TableCellElement = { type: 'table-cell'; children: CustomText[] };

// export type TableRowElement = { type: 'table-row'; children: TableCell[] };

export type TitleElement = { type: 'title'; children: Descendant[] };

export type VideoElement = { type: 'video'; url: string; children: EmptyText[] };

export type CustomElement =
  | BlockQuoteElement
  | BulletedListElement
  | CodeElement
  | CheckListItemElement
  | EditableVoidElement
  | HeadingElement
  | HeadingTwoElement
  | ImageElement
  | LinkElement
  | ButtonElement
  | ListItemElement
  | MentionElement
  | ParagraphElement
  // | TableElement
  // | TableRowElement
  | TableCellElement
  | TitleElement
  | VideoElement;

export type CustomText = {
  bold?: boolean
  underline?: boolean
  italic?: boolean
  code?: boolean
  text: string
};

export type EmptyText = {
  text: string
};

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

// export type SupportedElements = LinkElement | MentionElement | ParagraphElement | CodeElement | ImageElement;
export type SupportedElements = CustomElement;
declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: SupportedElements
    Text: CustomText | EmptyText
  }
}