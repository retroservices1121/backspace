// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import Loading from '@src/components/Loading';
import { useRouter } from 'next/router';

import { APP } from '..';

type Props = {};

const index: React.FC<Props> = ({}) => {
  const router = useRouter();
  router.replace(APP.SETTINGS.ACCOUNT);
  return (
    <Loading loading={true} />
  );
};

export default index;