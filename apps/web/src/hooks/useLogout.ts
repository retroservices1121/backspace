// The one correct logout path. Tears down the wallet-provider session
// first, then clears local redux state. useAuthenticate observes the
// resulting !authenticated state and handles cookie removal + the
// redirect to /auth/login.
//
// Dispatching the redux `logout` thunk on its own is NOT a logout: the
// wallet-provider session stays alive and useAuthenticate logs the
// user straight back in on the next render. Always go through this
// hook.
//
// Uses the provider-agnostic useWallet() rather than reaching into
// @privy-io/react-auth directly — see lib/wallet/.
import { useWallet } from '@src/lib/wallet';
import { useAppDispatch } from '@src/store/store';
import { logout } from '@src/store/userSlice';

export default function useLogout() {
  const dispatch = useAppDispatch();
  const { logout: walletLogout } = useWallet();

  return async (reason: string = 'user logout') => {
    try {
      await walletLogout();
    } finally {
      dispatch(logout(reason));
    }
  };
}
