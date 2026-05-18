import React from 'react';
import { useRouter } from 'next/router';

import ConnectionsPage from 'components/Profile/ConnectionsPage';

const FollowersRoute = () => {
  const router = useRouter();
  const username = (router.query.username as string) ?? '';
  if (!username) return null;
  return <ConnectionsPage username={username} tab="followers" />;
};

export default FollowersRoute;
