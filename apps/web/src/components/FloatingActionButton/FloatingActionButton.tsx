// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';

import { Container, TooltipText } from './styled';

export type FabProps =  {
  text?: string;
  onClick: () => void;
};

const FloatingActionButton: React.FC<FabProps> = ({
  text: tooltipText, onClick, children, ...props
}) => {
  return (
    <Container
      {...props}
      className="hidden sm:flex"
      onClick={() => onClick()}
    >
      {tooltipText && <TooltipText>{tooltipText}</TooltipText>}
      {children}
    </Container>
  );
};
export default FloatingActionButton;
