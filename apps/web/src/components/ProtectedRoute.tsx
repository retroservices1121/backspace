// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

//@ts-nocheck FIXME: Create ProtectedRoutes
/*
import { Route } from 'react-router-dom';

import { WithRest } from 'types/utilityTypes';

export type ConditionRedirectPair = {
  pass: boolean;
  redirect: React.FC<any>;
};
type Props = WithRest<{
  component: React.FC<any>;
  condition: Array<ConditionRedirectPair>;
}>;

const ProtectedRoute: React.FC<Props> = ({ component: Component, condition, ...rest }) => {

  //finds first failure
  const redirectMatch = condition.find((cond) => !cond.pass);

  const routeComponent = (props: any) => (
    redirectMatch
      ? <Route path="*" component={redirectMatch.redirect} />
      : <Component {...props} />
  );
  return <Route {...rest} render={routeComponent}/>;
};

export default ProtectedRoute;
*/
export default hello = {};
