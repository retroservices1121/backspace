// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { useTheme } from 'styled-components';

import { Row } from 'styles/Flex';
import { Space } from 'styles/layout';

import 'react-loading-skeleton/dist/skeleton.css';

import { Card } from './styled';

type Props = {
};

const LoadingMediaPost:React.FC<Props> = () => {
  const theme = useTheme();

  return (
    <Card>
      <SkeletonTheme enableAnimation baseColor={theme.backgroundLight} highlightColor={theme.fontTertiary} >
        <Row className="m-2">
          <Skeleton circle width={50} height={50} />
          <Space />
          <h1><Skeleton width={150} height={50} /></h1>
        </Row>      
        <Space direction='column' size='sm' />
        <Skeleton count={1} height={300} />
        <Space direction='column' size='sm' />
        <Skeleton count={3} />
      </SkeletonTheme>
    </Card>
  );
};

export default LoadingMediaPost;