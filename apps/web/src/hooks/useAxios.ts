// Privy access tokens are written to the auth cookie by useAuthenticate, so
// callers no longer need to thread a token through this hook — the axios
// factory reads the cookie itself.
import axios from 'lib/axios';

export const useAxios = () => axios();
