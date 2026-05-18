import React from 'react';
import { useRouter } from 'next/router';

import ConnectionsPage from 'components/Profile/ConnectionsPage';

const FollowingRoute = () => {
  const router = useRouter();
  const username = (router.query.username as string) ?? '';
  if (!username) return null;
  return <ConnectionsPage username={username} tab="following" />;
};

export default FollowingRoute;
