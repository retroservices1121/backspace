// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useRef } from 'react';

import InfinitePaginator, { Props as PaginatorProps } from './InfinitePaginator';

// Note! Some weird behavior with infinite loading: 
// Having a loader at the top of the list "in view", will cause the user to be at the top of the list
// once new content is loaded. To prevent this, we need to make sure the previous list item is at "the top"
// This is what InfiniteList handles.

type Props<T> = PaginatorProps & {
  list: T[]
  /** If items are added to the list via unshift instead of push set to true */
  reversed?: boolean;
  children: (item: T, index: number) => JSX.Element;
};
function InfiniteList<T>({ list = [], reversed, children, ...props }: Props<T>): JSX.Element {
  const lastElement = useRef(null);

  const lastIndex = reversed ? 0 : list.length - 1;
  const items = list.map(children);

  items[lastIndex] = (
    <div ref={lastElement}>
      {items[lastIndex]}
    </div>
  );
  
  const handlePaginate = () => {
    props.paginate();
    lastElement.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <>
      <InfinitePaginator
        paginate={handlePaginate}
        canPaginate={props.canPaginate}
      />
      {items}
    </>
  );
}

export default InfiniteList;

export function InfiniteListFull<T>(props: Props<T>) {
  return (
  <div className='w-full h-full overflow-auto flex flex-col-reverse hide-scroll'>
    {/* This div is needed to avoid needing to reverse the content */}
    <div>
      <InfiniteList<T> {...props}/>
    </div>
  </div>
  );
}
