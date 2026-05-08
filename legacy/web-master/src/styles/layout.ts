import styled from 'styled-components';

import { Col, Row } from './Flex';
import { mediaQuery } from './Globals';

export const Layout = styled(Row)`
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
  max-width: 1080px;
  margin: 0px auto;
`;

// Actually need to decide/figure out what are some good sizes, this is a placeholder
// Probably a good idea to match the font-size hierarchy
export enum SpaceSizes {
  sm = '1.5em',
  md = '4em',
  lg = '6em',
  auto = 'auto',
}

type SpaceProps = {
  size?: keyof typeof SpaceSizes;
  direction?: 'row' | 'column';
};

export const Space = styled.div<SpaceProps>(({
  size = 'sm', direction = 'row',
}) => {
  if (direction === 'row') {
    return ({ minWidth: SpaceSizes[size] });
  } else {
    return ({ minHeight: SpaceSizes[size] });
  }
});

// TODO Refactor navigation to not have to rely on this
const HEADER_HEIGHT = '80px';
const PAGE_HEIGHT = `calc(100vh - ${HEADER_HEIGHT})`;

export const SafeArea = styled.div`
  position: fixed;
  height: 100%;
  max-height: 100vh;
  width: 100%;
  max-width: 100vw;
  bottom: 0;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
`;

export const FullPage = styled.div`
  height: ${PAGE_HEIGHT};
  width: 100%;
`;


export const Footer = styled(Col)`
  width: 100%;
  margin: auto 0px 0px 0px;
  padding: 10px 0px;
`;

export const HideOnMobile = styled.div`
  ${mediaQuery.sm} {
    display: none;
  }
`;
