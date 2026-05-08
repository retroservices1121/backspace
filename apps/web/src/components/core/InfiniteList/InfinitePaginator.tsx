// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useRef } from 'react';
import ReactLoading from 'react-loading';

import { HorizontalLine } from 'styles/Dividers';
import { FlexBreakRow, Row } from 'styles/Flex';

import { EndOfMessages, LoadMoreNotice } from './styles';

export type Props = {
  /** Called when Infinite loader is on screen */
  paginate: () => void;
  /** False if either channel is empty or top of the channel has been reached */
  canPaginate?: boolean;
};

// TODO refactor

const InfinitePaginator: React.VFC<Props> = ({
  paginate, canPaginate,
}) => {
  const loaderElementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting) {
        if (canPaginate) {
          paginate();
        }
      }
    });
  }, []);

  //Observer Logic
  useEffect(() => {
    const loader = loaderElementRef.current;
    const observer = observerRef.current;

    if (loader && observer) {     
      observer.observe(loader);
      // The copied refs are important here
      return () => observer.unobserve(loader);
    }
  }, [loaderElementRef.current]);

  return (
    <div>
      {/* Flex Break Row for grid view support */}
      <FlexBreakRow />
        {canPaginate ? (
          <LoadMoreNotice ref={loaderElementRef}>
            <ReactLoading type='bubbles' />
          </LoadMoreNotice>
        ) : (
        <Row $center $full>
          <HorizontalLine />
          <EndOfMessages>Beginning of History</EndOfMessages>
          <HorizontalLine />
        </Row>
        )}
    </div>
  );
};

export default InfinitePaginator;
