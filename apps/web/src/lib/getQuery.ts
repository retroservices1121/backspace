/*
FIXME: I am perserving the old code because I don;t know if I am solving this right
import React from 'react';
import { useLocation } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}
export default useQuery;
*/

import React from 'react';
import { useRouter } from 'next/router';


function useQuery() {
  const router = useRouter();
  return React.useMemo(() => new URLSearchParams(router.asPath), [router.asPath]);
}
export default useQuery;
