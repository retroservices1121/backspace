// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { ReactElement } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import useTheme from '@src/hooks/useTheme';

import 'react-loading-skeleton/dist/skeleton.css';

import { Card } from './styled';

type Props = {
  renderCount: number,
};

const SkeletonLoader: React.FC<Props> = ({ renderCount }) => {
  const theme = useTheme();
  const values : ReactElement<any, any>[] = [];
  for (let index = 0; index < renderCount; index++) {
    values.push(
      <Card 
        className="my-3 sm:my-6 sm:mx-2 sm:px-6 pt-2 pb-4 w-screen md:w-[550px] sm:rounded-3xl"
        >
        <div className='flex flex-row' >
          <Skeleton count={1} circle width="50px" height="50px"/>
          <div className='flex flex-col ml-5 mt-1'>
            <Skeleton count={2} width="150px" />
          </div>
        </div>
        <Skeleton height="300px" className='my-3'/>
        <Skeleton count={4}/>
      </Card>,
      
    );
    
  }
  return (
    <SkeletonTheme baseColor={theme.backgroundNormal} highlightColor={theme.backgroundLight}>
      {values}
    </SkeletonTheme>
  );
};

export default SkeletonLoader;