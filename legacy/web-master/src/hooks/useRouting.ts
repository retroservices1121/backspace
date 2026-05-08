import { useHistory } from 'react-router';

import { FractalRoute, getPath } from 'lib/routing';
import { APP } from 'pages';

export default function useRouting() {
  const history = useHistory();

  return {
    ...history,
    // Imperative Navigation
    navigate(route: FractalRoute) {
      history.push(getPath(route));
    },
    navigateToProfile(user: string) {
      history.push(getPath(APP) + user);
    },
    // Functional Navigation
    handleNavigate(route: FractalRoute) {
      return () => history.push(getPath(route));
    },
  };
}