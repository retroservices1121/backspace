// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { MutableRefObject } from 'react';

export type Transition<D> = React.FC<{ current: D }>;

type Props<D> = {
  /** A reference generated outside the ListTransition can keep track of previous values without  */
  previous: MutableRefObject<D>;
  current: D;
  children: Transition<D>
  equality?: (previous: D, current: D) => boolean;
};


/** Whenever theres a difference between previous and current element of a sorted list,
 * we run the component with the current value, generating a transition */
export default function ListTransition<D>({
  previous,
  current,
  children,
  equality = (a, b) => a !== b,
}: Props<D>) {
  const isDifferent = equality(previous?.current, current);
  previous.current = current;

  return isDifferent ? children({ current }) : null;
}
