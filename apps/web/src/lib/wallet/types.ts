// Provider-agnostic wallet interface.
//
// Every wallet provider (Privy today, CDP tomorrow) implements
// WalletProvider. Components consume the unified shape via useWallet()
// in lib/wallet/useWallet.ts — they never reach into the underlying
// provider's SDK directly.
//
// Adding a new provider means: write providers/<name>.ts that
// implements WalletProvider, then flip the active provider in
// providers/active.ts. Application code does not change.
//
// Shape is the union of what the codebase actually uses today; do not
// add fields speculatively. If a new venue (perps, perps SDK, etc.)
// needs something not surfaced here, extend the interface and update
// every provider, don't add a one-off shim.

export type WalletUser = {
  /** Stable per-provider user identifier (Privy DID, CDP user id, …). */
  id: string;
  email?: string | null;
};

export type AuthSurface = {
  /** Provider has finished initialising. */
  ready: boolean;
  /** Caller is signed in. */
  authenticated: boolean;
  /** Minimal user shape; full provider user is intentionally hidden. */
  user: WalletUser | null;
  /** Server-verifiable bearer token for the caller. Returns null when
   *  unauthenticated or the provider has no access-token concept. */
  getAccessToken: () => Promise<string | null>;
  /** Begin sign-in. Provider decides UX (modal, redirect, etc.). */
  login: () => void | Promise<void>;
  /** End the session. Idempotent. */
  logout: () => Promise<void>;
};

export type EvmWallet = {
  /** Hex address (0x…). Canonical lowercase. */
  address: string;
  /** Origin of this wallet — 'embedded' for the provider-issued one,
   *  'external' for a wallet the user linked (MetaMask, Coinbase, …). */
  source: 'embedded' | 'external';
  /** Provider's underlying wallet client type ('privy', 'metamask',
   *  'coinbase_wallet', …). Free-form because providers differ.
   *  Components should not branch on this; expose flags here if you
   *  need to. */
  clientType?: string;
  /** Active chain id (decimal). Provider returns the wallet's currently
   *  selected chain; may be undefined when no chain is selected yet. */
  chainId?: number;
  /** Returns an ethers v5 signer for the Polymarket CLOB path. Throws
   *  if the wallet cannot produce one (e.g. read-only / hardware not
   *  connected). The abstraction commits to ethers v5 specifically —
   *  Polymarket's clob-client-v2 still requires it as of 2026-05. */
  getEthersSigner: () => Promise<unknown>;
};

export type SolanaWallet = {
  /** Base58 pubkey. */
  address: string;
  source: 'embedded' | 'external';
  clientType?: string;
  /** Sign a Solana Transaction or VersionedTransaction. Returns the
   *  signed tx in whatever shape the input was — components serialize
   *  themselves. Matches the @solana/web3.js wallet-adapter convention. */
  signTransaction: <T = unknown>(transaction: T) => Promise<T>;
  /** Sign + broadcast. Returns the txid (base58 signature). Used by
   *  Dflow / Phoenix where the SDK hands us a fully-built tx and we
   *  want to delegate broadcast to the provider's RPC. */
  signAndSendTransaction?: <T = unknown>(transaction: T) => Promise<string>;
  /** Sign a UTF-8 message. Used for SIWS-style auth. */
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
};

export type WalletProvider = AuthSurface & {
  /** All EVM wallets associated with the caller. Includes embedded +
   *  linked externals. Order: embedded first, then externals as
   *  provider returns them. */
  evmWallets: EvmWallet[];
  /** Convenience: the provider-issued embedded EVM wallet, or null. */
  embeddedEvmWallet: EvmWallet | null;

  solanaWallets: SolanaWallet[];
  embeddedSolanaWallet: SolanaWallet | null;
  /** Some providers (Privy) lazily create the Solana wallet on demand
   *  rather than at sign-in; others (CDP with createOnLogin:true)
   *  provision it automatically. This method is the explicit-create
   *  path; if a Solana wallet already exists it returns it idempotently. */
  provisionSolana: () => Promise<SolanaWallet>;
};
