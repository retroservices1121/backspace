// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Expanding/Collapsing Left-Hand Options Menu

import React, { useEffect, useRef, useState } from 'react';
import { DefaultTheme } from 'styled-components';

import { DrawerContent, Panel, Tab } from './styled';

type Props = {
  title : string;
  color?: keyof DefaultTheme;
  contentPosition?: number;
  syncScroll?: boolean;
  invisibleScroll?: boolean;
  side?: 'left' | 'right';
  initialCollapsed?: boolean;
  hideOnMobile?: boolean;
  allowOverFlow?: boolean;
};

const Drawer : React.FC<Props> = ({
  title, children, color, contentPosition, hideOnMobile = false, allowOverFlow = false,
  syncScroll = false, invisibleScroll = false, side = 'left', initialCollapsed = false }) => {
  const [myExpand, setMyExpand] = useState(!initialCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (window.innerWidth < 1000) {setMyExpand(false);}
    if (syncScroll && contentPosition && contentRef.current) {
      contentRef.current.scrollTo(0, contentPosition);
    }
  }, [contentPosition]);

  return (
    <Panel expand={myExpand} color={color} side={side} hideOnMobile={hideOnMobile}>
      {/* Drawer Tab to Open Drawer */}
      <Tab onClick={() => setMyExpand(!myExpand)} side={side}>
        {title}
      </Tab>
      {/* Main Content */}
      <DrawerContent ref={contentRef} invisibleScroll={invisibleScroll} side={side} allowOverFlow={allowOverFlow}>{children}</DrawerContent>
    </Panel>
  );
};

export default Drawer;
