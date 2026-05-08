// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { useFeed } from '@src/hooks/useFeed';
import { FilterOptions } from '@src/store/feedSlice';
import { CenterCol, Row } from '@src/styles/Flex';

import Icons from 'icons';

type FilterType = {
  name: string,
  sort: FilterOptions,
  icon: (any) => JSX.Element
}; 

const filters : Array<FilterType> = [
  {
    // Web3 pivot: ranks by author's prediction-market accuracy first, recency second
    name: 'Accuracy',
    sort: FilterOptions.ACCURACY,
    icon: Icons.Discover,
  },
  {
    name: 'Discover',
    sort: FilterOptions.DISCOVER,
    icon: Icons.Discover,
  },
  {
    name: 'Following',
    sort: FilterOptions.FOLLOWING,
    icon: Icons.Heart,
  },
  {
    name: 'Communities',
    sort: FilterOptions.COMMUNITY,
    icon: Icons.Community,
  },
];


type Props = {};

const FeedFilter: React.FC<Props> = ({}) => {
  const myFeed = useFeed();

  function renderFilterOption(item: FilterType) {
    return (
      <Row className={'clickable py-1 w-full'} onClick={() => myFeed.setFilter(item.sort)}>
        <item.icon active={myFeed.filter == item.sort}/>
        <h3 className={'px-2'}>{item.name}</h3>
      </Row>
    );
  }

  return (
    <CenterCol className={'m-5 w-full'}>
      {filters.map((filter) => {
        return renderFilterOption(filter);
      })}
    </CenterCol>
  );
};

export default FeedFilter;