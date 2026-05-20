// Public surface for lib/wallet. Application code imports from here.

export { useWallet } from './useWallet';
export type {
  AuthSurface,
  EvmWallet,
  SolanaSignable,
  SolanaWallet,
  WalletProvider,
  WalletUser,
} from './types';
