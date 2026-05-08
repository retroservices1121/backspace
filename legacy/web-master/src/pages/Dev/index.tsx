// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Route } from 'lib/routing';
import { APP } from 'pages';

import StyleGuide from './StyleGuide';


const Dev: React.FC<any> = () => {
  if (process.env.NODE_ENV === 'development') {
    return (
      <div>
        {/* Theres no index page for dev atm, so lets redirect to the style guide page */}
        <Route exact path={APP.DEV.INDEX} redirect={APP.DEV.STYLE_GUIDE}/>
        <Route path={APP.DEV.STYLE_GUIDE} component={StyleGuide} />
      </div>
    );
  }
  return null;
};

export default Dev;
