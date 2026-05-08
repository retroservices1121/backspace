/* eslint-disable @typescript-eslint/no-use-before-define */
// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useRouter } from 'next/router';

import { CustomText, MentionElement, SupportedElements } from './CustomTypes';
import { CodeCustom, MentionSpan } from './styled';

type MentionProps = {
  attributes: any;
  children: any; 
  element: MentionElement;
};

type DefaultProps = {
  attributes: any;
  children: any; 
};

type LeafProps = {
  attributes: any;
  children: any; 
  leaf: CustomText;
};

type ElementProps = {
  attributes: any;
  children: any; 
  element: SupportedElements;
};

export const Leaf = ({ attributes, children, leaf } : LeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <CodeCustom>{children}</CodeCustom>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  return <span {...attributes}>{children}</span>;
};

export const Mention = ({ attributes, children, element } : MentionProps) => {
  const router = useRouter();
  return (
    <MentionSpan
      {...attributes}
      contentEditable={false}
      data-cy={`mention-${element.user.replace(' ', '-')}`}
      onClick={() => router.push(element.user)}
    >
      @{element.user || children}
    </MentionSpan>
  );
};

export const DefaultElement = (props : DefaultProps) => {
  return <p {...props.attributes}>{props.children}</p>;
};

export const Code = (props : DefaultProps) => {
  return (
    <CodeCustom {...props.attributes}>
      <code>{props.children}</code>
    </CodeCustom>
  );
};

export const Element = (props : ElementProps) => {
  const { attributes, children, element } = props;
  switch (element.type) {
    case 'mention':
      // @ts-ignore
      return <Mention {...props} />;
    case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>;
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>;
    case 'heading-one':
      return <h2 {...attributes}>{children}</h2>;
    case 'heading-two':
      return <h3 {...attributes}>{children}</h3>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'code':
      return <Code {...props} />;
    case 'link': 
      return (
      <a href={'//' + element.url}>{element.url || children}</a>
      );
    default:
      return <DefaultElement {...props} />;
  }
};
