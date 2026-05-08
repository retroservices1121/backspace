//import { FractalRoute, getPath } from 'lib/routing';
//import { APP } from 'pages';
//import { useRouter } from 'next/router';

export default function useRouting() {
  type FractalRoute = string | { INDEX: string };
  //const router = useRouter()

  return {
    ...history,
    // Imperative Navigation
    navigate(route: FractalRoute) {
      console.log(route)
      //router.push(getPath(route));
    },
    navigateToProfile(user: string) {
      console.log(user)
    // @ts-ignore FIXME: SAM IS TOO SMART
      //router.push(getPath(APP) + user);
    },
    // Functional Navigation
    // @ts-ignore FIXME: SAM IS TOO SMART
    handleNavigate(route: FractalRoute) {
      console.log(route)
    // @ts-ignore FIXME: SAM IS TOO SMART
      //return () => router.push(getPath(route));
    },
  };
}
