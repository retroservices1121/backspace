// The one correct logout path. Tears down the Privy session first, then
// clears local redux state. useAuthenticate observes the resulting
// !authenticated state and handles cookie removal + the redirect to
// /auth/login.
//
// Dispatching the redux `logout` thunk on its own is NOT a logout: the
// Privy session stays alive and useAuthenticate logs the user straight
// back in on the next render. Always go through this hook.
import { usePrivy } from '@privy-io/react-auth';
import { useAppDispatch } from '@src/store/store';
import { logout } from '@src/store/userSlice';

export default function useLogout() {
  const dispatch = useAppDispatch();
  const { logout: privyLogout } = usePrivy();

  return async (reason: string = 'user logout') => {
    try {
      await privyLogout();
    } finally {
      dispatch(logout(reason));
    }
  };
}
