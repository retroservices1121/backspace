// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

export {};
import React from 'react';
import Linkify from 'react-linkify';
import { SecureLink } from 'react-secure-link';
import { useRouter } from 'next/router';
import { useTheme } from 'styled-components';

import { ColoredSpan } from 'styles/Globals';

import { MentionSpan } from './styles';

type Props = {
  clickable?: boolean
};

const SmartContent: React.FC<Props> = ({ children, clickable = true }) => {
  const theme = useTheme(); 
  const router = useRouter();

  /** Process mentions */
  function parseString(text: string) {
    const headIndex = 1;
    const usernameIndex = 2;
    const tailIndex = 3;
  
    const groups = text.split(' ');
    const regex = new RegExp('(.*)@\{([a-zA-Z_\-]{1,})\}(.*)');
    const processedGroups = groups.map((each) => {
      const atMention = each.match(regex);
      if (atMention) {
        const head = atMention[headIndex];
        const username = atMention[usernameIndex];
        const tail = atMention[tailIndex];
        return (
          <>
          {head}
          { clickable ? 
            <MentionSpan onClick={() => router.push(username)}>
              @{username}
            </MentionSpan>
            :
            <ColoredSpan>
              @{username}
            </ColoredSpan>
          }
          {tail}&nbsp;
          </>
        
        );
      }
      return each + ' ';
    });
    return processedGroups;
  }

  function parse(_children: any, key: number = 0): any {
    if (typeof _children === 'string') {
      return parseString(_children);
    } else if (React.isValidElement(_children) && (_children.type !== 'a') && (_children.type !== 'button')) {
      /** @ts-ignore */
      return React.cloneElement(_children, { key: key }, parse(_children.props.children));
    } else if (Array.isArray(_children)) {
      return _children.map((child, i) => parse(child, i));
    }

    return _children;
  }

  return (
      <Linkify componentDecorator={(decoratedHref, decoratedText, key) => {
        if (clickable) {
          return <SecureLink href={decoratedHref} key={key} style={{ color: `${theme.primary}`, textDecoration: 'underline' }}>{decoratedText}</SecureLink>;
        } else {
          return <ColoredSpan>{decoratedText}</ColoredSpan>;
        }
      }} >
        {parse(children)}
    </Linkify>
  );
};

export default SmartContent;
