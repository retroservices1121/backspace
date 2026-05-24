// Trading wallet settings — funding + one-time setup for each
// trading venue. Sections:
//   - Trading Wallet (Polymarket): non-custodial Safe + pUSD balance
//     + "Enable trading" (deploys Safe + approvals, gasless).
//   - Existing Polymarket wallet: link the EOA the user already
//     trades with so we can read their on-chain history.
//   - Open in your wallet's browser: universal-link buttons for the
//     mobile in-app-browser workaround.
//   - Public accuracy toggle: privacy gate on profile stats.
//   - Solana Wallet: Privy embedded Solana wallet + balance +
//     create-on-demand button.
//
// New design tokens; all hooks and Privy/Safe wiring unchanged.

import React, { useMemo } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { toast } from 'react-toastify';
import { useDflowSwap } from '@src/hooks/useDflowSwap';
import { useLinkedWallets } from '@src/hooks/useLinkedWallets';
import { usePolymarketSession } from '@src/hooks/usePolymarketSession';
import { usePrimaryTradingWallet } from '@src/hooks/usePrimaryTradingWallet';
import { usePublicAccuracyToggle } from '@src/hooks/usePublicAccuracyToggle';
import { useSolanaBalances } from '@src/hooks/useSolanaBalances';
import { useWallet } from '@src/lib/wallet';
import settingsLayout from '@src/layouts/settingsLayout';
import copy from 'copy-to-clipboard';

const STEP_LABEL: Record<string, string> = {
  checking: 'Checking your wallet…',
  deploying: 'Deploying your trading wallet…',
  credentials: 'Generating trading credentials…',
  approvals: 'Approving tokens for trading…',
};

const Wallet: ReactLayoutComponentType = () => {
  const {
    eoaAddress,
    safeAddress,
    isReady,
    step,
    error,
    collateralBalance,
    initialize,
  } = usePolymarketSession();

  const busy = step !== 'idle' && step !== 'complete';

  if (!eoaAddress) {
    return (
      <div className="font-display text-ink">
        <Section title="Trading Wallet" sub="Log in to set up your trading wallet." />
      </div>
    );
  }

  return (
    <div className="font-display text-ink flex flex-col gap-5">
      <Section
        title="Trading Wallet"
        sub="Backspace markets settle on Polymarket. Your trades run through a non-custodial wallet that only you control — Backspace never holds your funds."
      >
        <FieldLabel>Deposit address</FieldLabel>
        <FieldHelp>
          Send <strong className="text-ink">USDC on the Polygon network</strong> to this address to fund your trading balance. Don&apos;t send from another network.
        </FieldHelp>
        {safeAddress
          ? <AddressBox address={safeAddress} />
          : <p className="text-[13px] text-ink-3">Preparing your wallet address…</p>}

        <Divider />

        <FieldLabel>Balance</FieldLabel>
        <div className="text-[18px] font-mono font-semibold text-ink">
          {collateralBalance !== null ? `$${collateralBalance}` : '—'}{' '}
          <span className="text-[12px] text-ink-3">pUSD</span>
        </div>

        <Divider />

        <FieldLabel>Trading status</FieldLabel>
        {isReady ? (
          <div className="text-[14px] text-green-2 flex items-center gap-2">
            <span>✓</span>
            <span>Your wallet is set up and ready to trade.</span>
          </div>
        ) : (
          <>
            <FieldHelp>
              One-time setup: deploys your trading wallet and approves the Polymarket contracts. It&apos;s gasless — you just sign once.
            </FieldHelp>
            <PrimaryButton onClick={initialize} disabled={busy}>
              {busy ? (STEP_LABEL[step] ?? 'Setting up…') : 'Enable trading'}
            </PrimaryButton>
          </>
        )}
        {error && <ErrorLine>{error.message}</ErrorLine>}
      </Section>

      <TradingSignerPickerSection />
      <LinkedPolymarketWalletsSection />
      <SolanaWalletSection />
    </div>
  );
};

function TradingSignerPickerSection() {
  const { evmWallets, embeddedEvmWallet } = useWallet();
  const { address: preferred, set, isSaving } = usePrimaryTradingWallet();

  // Build the option list: embedded first (always present once
  // provisioned), then each linked external wallet. We don't expose
  // a "none" option — picking is optional, and clearing means
  // selecting nothing, surfaced via the explicit Auto row.
  const externals = evmWallets.filter((w) => w.source === 'external');
  const hasOptions = embeddedEvmWallet || externals.length > 0;

  if (!hasOptions) return null;

  const selectedKey = preferred ? preferred.toLowerCase() : '__auto__';

  const handlePick = async (key: string) => {
    try {
      await set(key === '__auto__' ? null : key);
      toast.success('Trading wallet updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update');
    }
  };

  return (
    <Section
      title="Trading wallet"
      sub="Which wallet signs your trades. Defaults to your most-recently linked wallet — switch here if you want a specific one to handle every order."
    >
      <PickerRow
        key="__auto__"
        label="Auto (most recent linked wallet)"
        sub="Default. Picks the latest linked EOA, or your embedded wallet if none are linked."
        checked={selectedKey === '__auto__'}
        disabled={isSaving}
        onPick={() => handlePick('__auto__')}
      />
      {embeddedEvmWallet && (
        <PickerRow
          key={embeddedEvmWallet.address}
          label="Backspace embedded wallet"
          sub={embeddedEvmWallet.address}
          mono
          checked={selectedKey === embeddedEvmWallet.address.toLowerCase()}
          disabled={isSaving}
          onPick={() => handlePick(embeddedEvmWallet.address.toLowerCase())}
        />
      )}
      {externals.map((w) => (
        <PickerRow
          key={w.address}
          label="Linked wallet"
          sub={w.address}
          mono
          checked={selectedKey === w.address.toLowerCase()}
          disabled={isSaving}
          onPick={() => handlePick(w.address.toLowerCase())}
        />
      ))}
    </Section>
  );
}

function PickerRow({
  label, sub, checked, disabled, onPick, mono,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  disabled?: boolean;
  onPick: () => void;
  mono?: boolean;
}) {
  return (
    <label
      className={[
        'flex items-start gap-3 rounded-[10px] border px-3 py-2.5 transition-colors',
        checked ? 'border-brand-2/60 bg-brand-soft/40' : 'border-line bg-canvas hover:border-line-2',
        disabled ? 'opacity-50 cursor-wait' : 'cursor-pointer',
      ].join(' ')}
    >
      <input
        type="radio"
        name="primaryTradingWallet"
        checked={checked}
        disabled={disabled}
        onChange={onPick}
        className="mt-1 w-4 h-4 accent-brand-2 flex-none"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-ink">{label}</div>
        {sub && (
          <div
            className={[
              'text-[12px] text-ink-3 leading-snug break-all mt-0.5',
              mono ? 'font-mono' : '',
            ].join(' ')}
          >
            {sub}
          </div>
        )}
      </div>
    </label>
  );
}

function LinkedPolymarketWalletsSection() {
  const {
    wallets, isLoading, candidate, phase,
    error: linkError, startLinking, finishLinking,
    unlink, unlinking,
  } = useLinkedWallets();
  const accuracyToggle = usePublicAccuracyToggle();
  const signing = phase === 'signing' || phase === 'linking';
  const connecting = phase === 'connecting';
  const hasCandidate = !!candidate;

  const handleUnlink = async (id: string, address: string) => {
    if (typeof window !== 'undefined') {
      const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
      const ok = window.confirm(
        `Unlink ${short}? Past trades stay on your accuracy stats — this just removes the wallet from your active list.`,
      );
      if (!ok) return;
    }
    try {
      await unlink(id, address);
      toast.success('Wallet unlinked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not unlink wallet');
    }
  };

  return (
    <Section
      title="Existing Polymarket wallet"
      sub="Already trade on Polymarket? Link the wallet you use there to import your trade history. Your accuracy stats are computed across every linked wallet plus your Backspace trading wallet — all under one Backspace handle, no matter which one signs."
    >
      {isLoading ? (
        <p className="text-[13px] text-ink-3">Loading linked wallets…</p>
      ) : (
        <>
          {wallets.map((w) => (
            <div key={w.id} className="mb-4">
              <FieldLabel>Wallet</FieldLabel>
              <AddressBox address={w.address} />
              {w.safeAddress && (
                <>
                  <div className="h-2" />
                  <FieldLabel>Polymarket Safe</FieldLabel>
                  <AddressBox address={w.safeAddress} />
                </>
              )}
              <div className="h-2" />
              <button
                type="button"
                onClick={() => handleUnlink(w.id, w.address)}
                disabled={unlinking}
                className="
                  self-start text-[12px] font-mono uppercase tracking-[0.06em]
                  text-pink-2 hover:text-pink-vivid
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {unlinking ? 'Unlinking…' : 'Unlink wallet'}
              </button>
            </div>
          ))}

          {hasCandidate ? (
            <>
              {wallets.length === 0 && (
                <FieldHelp>
                  Wallet connected. Tap below to sign and link it to your Backspace handle. Backspace never moves your funds — this signature only proves ownership.
                </FieldHelp>
              )}
              <AddressBox address={candidate.address} />
              <div className="h-3" />
              <PrimaryButton
                onClick={() => finishLinking().catch(() => undefined)}
                disabled={signing}
              >
                {phase === 'signing'
                  ? 'Sign in your wallet…'
                  : phase === 'linking'
                    ? 'Linking…'
                    : 'Sign to finish linking'}
              </PrimaryButton>
            </>
          ) : wallets.length === 0 ? (
            <>
              <FieldHelp>
                No external wallet linked yet. We never move your funds — linking only proves ownership so we can read your on-chain history.
              </FieldHelp>
              <PrimaryButton onClick={startLinking} disabled={connecting}>
                {connecting ? 'Opening wallet…' : 'Link Polymarket wallet'}
              </PrimaryButton>
            </>
          ) : (
            <SecondaryButton onClick={startLinking} disabled={connecting}>
              {connecting ? 'Opening wallet…' : 'Link another wallet'}
            </SecondaryButton>
          )}

          {linkError && <ErrorLine>{linkError.message}</ErrorLine>}

          <Divider />
          <WalletBrowserLinksSection />
        </>
      )}

      <Divider />

      <FieldLabel>Show accuracy on profile</FieldLabel>
      <FieldHelp>
        When on, your Calls / Accuracy / Brier stats render on your public profile. When off, only you can see them. Linking a wallet alone never publishes anything — this toggle controls visibility.
      </FieldHelp>
      <ToggleRow
        checked={accuracyToggle.enabled}
        disabled={accuracyToggle.isLoading || accuracyToggle.isSaving}
        onChange={(v) => accuracyToggle.set(v)}
        label="Show my accuracy stats on my public profile"
      />
    </Section>
  );
}

function WalletBrowserLinksSection() {
  const currentUrl = useMemo(() => (typeof window === 'undefined' ? '' : window.location.href), []);
  const hostPath = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return `${u.host}${u.pathname}${u.search}`;
  }, []);
  const enc = encodeURIComponent(currentUrl);

  const wallets = [
    { name: 'Coinbase Wallet', url: `https://go.cb-w.com/dapp?cb_url=${enc}` },
    { name: 'MetaMask', url: `https://metamask.app.link/dapp/${hostPath}` },
  ];

  return (
    <>
      <FieldLabel>Open in your wallet&apos;s browser</FieldLabel>
      <FieldHelp>
        Mobile wallets sometimes can&apos;t handle connect requests from outside their own browser. Open Backspace inside your wallet&apos;s app — then the Link button works on the first tap.
      </FieldHelp>
      <div className="flex flex-col gap-2">
        {wallets.map((w) => (
          // Universal-link buttons must be real <a> tags so iOS
          // promotes them to associated-domains lookups; a JS-driven
          // window.open call gets blocked or stripped of its
          // universal-link metadata on iOS Safari.
          <a
            key={w.name}
            href={w.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <SecondaryButton as="span">Open in {w.name}</SecondaryButton>
          </a>
        ))}
      </div>
      <div className="h-2" />
      <p className="text-[11px] font-mono text-ink-3">
        Once inside the wallet&apos;s browser, scroll to{' '}
        <strong className="text-ink-2">Existing Polymarket wallet</strong> and tap{' '}
        <strong className="text-ink-2">Link Polymarket wallet</strong>.
      </p>
    </>
  );
}

function SolanaWalletSection() {
  const { walletAddress, walletsReady, isReady, provisionWallet, error } = useDflowSwap();
  const balances = useSolanaBalances(walletAddress);
  const sol = balances.data?.find((b) => b.mint === 'SOL');

  return (
    <Section
      title="Solana Wallet"
      sub="Spot swaps on Solana run through this non-custodial wallet. Backspace never holds your funds — send SOL here to start trading tokens via Dflow."
    >
      {!walletsReady ? (
        <p className="text-[13px] text-ink-3">Loading wallet…</p>
      ) : !isReady ? (
        <>
          <FieldHelp>
            One-time setup: provisions your Solana embedded wallet. No signature required — Privy generates it on the spot.
          </FieldHelp>
          <PrimaryButton onClick={() => provisionWallet().catch(() => undefined)}>
            Create Solana wallet
          </PrimaryButton>
        </>
      ) : (
        <>
          <FieldLabel>Deposit address</FieldLabel>
          <FieldHelp>
            Send <strong className="text-ink">SOL on the Solana network</strong> to this address to fund swaps. Don&apos;t send from another chain.
          </FieldHelp>
          <AddressBox address={walletAddress!} />

          <Divider />

          <FieldLabel>Balance</FieldLabel>
          <div className="text-[18px] font-mono font-semibold text-ink">
            {balances.isLoading
              ? '—'
              : sol
                ? `${sol.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}`
                : '0'}{' '}
            <span className="text-[12px] text-ink-3">SOL</span>
          </div>
        </>
      )}

      {error && <ErrorLine>{error.message}</ErrorLine>}
    </Section>
  );
}

// ─── shared primitives ────────────────────────────────────────────

function Section({
  title, sub, children,
}: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      {sub && <p className="mt-1.5 text-[13px] text-ink-3 leading-snug">{sub}</p>}
      {children && <div className="mt-4 flex flex-col gap-2">{children}</div>}
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.08em] text-ink-3 font-mono mt-2">
      {children}
    </div>
  );
}

function FieldHelp({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-ink-3 leading-snug">{children}</p>
  );
}

function Divider() {
  return <div className="my-2 border-t border-line" />;
}

function AddressBox({ address }: { address: string }) {
  const onCopy = () => {
    copy(address);
    toast.success('Address copied');
  };
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-line bg-canvas px-3 py-2">
      <code className="flex-1 text-[12px] font-mono text-ink break-all">{address}</code>
      <button
        type="button"
        onClick={onCopy}
        className="
          flex-none text-[11px] font-mono uppercase tracking-[0.06em]
          text-brand-2 hover:text-ink-2 transition-colors
        "
      >
        Copy
      </button>
    </div>
  );
}

function PrimaryButton({
  children, onClick, disabled,
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        self-start rounded-full bg-brand hover:bg-brand-2
        text-ink text-[14px] font-semibold
        h-10 px-5
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-150
        shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)]
      "
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children, onClick, disabled, as,
}: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; as?: 'button' | 'span' }) {
  const Tag: any = as === 'span' ? 'span' : 'button';
  return (
    <Tag
      type={as === 'span' ? undefined : 'button'}
      onClick={onClick}
      aria-disabled={disabled}
      className="
        self-start inline-flex items-center rounded-full
        border border-line-2 text-ink text-[14px] font-semibold
        h-10 px-5
        hover:bg-hover transition-colors
        cursor-pointer
      "
    >
      {children}
    </Tag>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] text-pink-2 mt-2">{children}</p>
  );
}

function ToggleRow({
  checked, onChange, disabled, label,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <label
      className={[
        'inline-flex items-center gap-2 select-none',
        disabled ? 'opacity-50 cursor-wait' : 'cursor-pointer',
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="
          w-4 h-4 rounded
          accent-brand-2
        "
      />
      <span className="text-[13px] text-ink">{label}</span>
    </label>
  );
}

Wallet.Layout = settingsLayout;
export default Wallet;
