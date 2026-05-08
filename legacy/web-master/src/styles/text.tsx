// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';


export const Strong = styled.h2`
  display: inline;
`;

export const Price: React.FC<{ value: string }> = ({ value }) => (
  <span>
    <Strong>{value}</Strong>/month
  </span>
);



export const EnableHighlight = css`
  //Disable text highlighting for UI feel
  -webkit-touch-callout:  text; /* iOS Safari */
  -webkit-user-select:    text; /* Safari */
    -khtml-user-select:   text; /* Konqueror HTML */
      -moz-user-select:   text; /* Old versions of Firefox */
      -ms-user-select:    text; /* Internet Explorer/Edge */
          user-select:    text; /* Non-prefixed version, currently */
`;

export const DisableHighlight = css`
  //Disable text highlighting for UI feel
  -webkit-touch-callout:  none; /* iOS Safari */
  -webkit-user-select:    none; /* Safari */
    -khtml-user-select:   none; /* Konqueror HTML */
      -moz-user-select:   none; /* Old versions of Firefox */
      -ms-user-select:    none; /* Internet Explorer/Edge */
          user-select:    none; /* Non-prefixed version, currently */ 
`;
