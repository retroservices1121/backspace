// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { APP } from 'pages';

const Dev: React.FC<any> = () => {
  const router = useRouter();

  useEffect(() => {
    router.push(APP.DEV.STYLE_GUIDE);
  }, []);

  if (process.env.NODE_ENV === 'development') {
    return (
      <div>
        Theres no index page for dev atm, so lets redirect to the style guide page
      </div>
    );
  }
  return null;
};

export default Dev;
