// Trading wallet settings — the funding + one-time-setup surface for
// each trading venue.
//   - Polymarket section: non-custodial Safe address + pUSD balance +
//     "Enable trading" (deploys Safe + approvals, gasless).
//   - Solana section: Privy embedded Solana wallet address + live SOL
//     balance + "Create wallet" (provisions on demand — Privy's
//     createOnLogin only auto-creates one chain, which we reserve for
//     Ethereum/Polymarket).
import React, { useState } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { toast } from 'react-toastify';
import { useDflowSwap } from '@src/hooks/useDflowSwap';
import { useLinkedWallets } from '@src/hooks/useLinkedWallets';
import { usePolymarketSession } from '@src/hooks/usePolymarketSession';
import { usePublicAccuracyToggle } from '@src/hooks/usePublicAccuracyToggle';
import { useSolanaBalances } from '@src/hooks/useSolanaBalances';
import settingsLayout from '@src/layouts/settingsLayout';
import copy from 'copy-to-clipboard';

import { Container } from 'components/Settings/styledAgain';
import { Button, LargeTextButton } from 'styles/Buttons';
import { HorizontalLine } from 'styles/Dividers';
import { OldCol } from 'styles/Flex';
import { Space } from 'styles/layout';

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

  const copyAddress = () => {
    if (!safeAddress) return;
    copy(safeAddress);
    toast.success('Address copied');
  };

  if (!eoaAddress) {
    return (
      <Container>
        <h1>Trading Wallet</h1>
        <Space direction="column" />
        <h6>Log in to set up your trading wallet.</h6>
      </Container>
    );
  }

  return (
    <Container>
      <h1>Trading Wallet</h1>
      <Space direction="column" />
      <h6>
        Backspace markets settle on Polymarket. Your trades run through a
        non-custodial wallet that only you control — Backspace never holds
        your funds.
      </h6>
      <Space direction="column" />
      <HorizontalLine />
      <Space direction="column" />

      <h3>Deposit address</h3>
      <Space direction="column" />
      <h6>
        Send <strong>USDC on the Polygon network</strong> to this address to
        fund your trading balance. Don&apos;t send from another network.
      </h6>
      <Space direction="column" />
      {safeAddress ? (
        <OldCol>
          <code style={{ wordBreak: 'break-all' }}>{safeAddress}</code>
          <Space direction="column" size="sm" />
          <Button color="primary" onClick={copyAddress}>
            Copy address
          </Button>
        </OldCol>
      ) : (
        <h6>Preparing your wallet address…</h6>
      )}
      <Space direction="column" />
      <h4>
        Balance:{' '}
        {collateralBalance !== null ? `$${collateralBalance}` : '—'} pUSD
      </h4>

      <Space direction="column" />
      <HorizontalLine />
      <Space direction="column" />

      <h3>Trading status</h3>
      <Space direction="column" />
      {isReady ? (
        <h4>✓ Your wallet is set up and ready to trade.</h4>
      ) : (
        <>
          <h6>
            One-time setup: deploys your trading wallet and approves the
            Polymarket contracts. It&apos;s gasless — you just sign once.
          </h6>
          <Space direction="column" />
          <LargeTextButton color="primary" onClick={initialize} disabled={busy}>
            {busy ? STEP_LABEL[step] ?? 'Setting up…' : 'Enable trading'}
          </LargeTextButton>
        </>
      )}
      {error && (
        <>
          <Space direction="column" />
          <h6 style={{ color: 'salmon' }}>{error.message}</h6>
        </>
      )}

      <Space direction="column" />
      <HorizontalLine />
      <Space direction="column" />

      <LinkedPolymarketWalletsSection />

      <Space direction="column" />
      <HorizontalLine />
      <Space direction="column" />

      <SolanaWalletSection />
    </Container>
  );
};

function LinkedPolymarketWalletsSection() {
  const {
    wallets,
    isLoading,
    candidate,
    phase,
    error: linkError,
    startLinking,
    finishLinking,
  } = useLinkedWallets();
  const accuracyToggle = usePublicAccuracyToggle();
  const signing = phase === 'signing' || phase === 'linking';
  const connecting = phase === 'connecting';
  const hasCandidate = !!candidate;

  return (
    <>
      <h1>Existing Polymarket wallet</h1>
      <Space direction="column" />
      <h6>
        Already trade on Polymarket? Link the wallet you use there to import
        your trade history. Your accuracy stats are computed across every
        linked wallet plus your Backspace trading wallet — all under one
        Backspace handle, no matter which one signs.
      </h6>
      <Space direction="column" />

      {isLoading ? (
        <h6>Loading linked wallets…</h6>
      ) : (
        <>
          {wallets.map((w) => (
            <OldCol key={w.id}>
              <h4>Wallet</h4>
              <code style={{ wordBreak: 'break-all' }}>{w.address}</code>
              {w.safeAddress && (
                <>
                  <Space direction="column" size="sm" />
                  <h4>Polymarket Safe</h4>
                  <code style={{ wordBreak: 'break-all' }}>{w.safeAddress}</code>
                </>
              )}
              <Space direction="column" />
            </OldCol>
          ))}

          {hasCandidate ? (
            // A wallet finished connecting but hasn't been signed-
            // and-linked yet. This is the explicit recovery step the
            // mobile flow needs — the second deep-link to the wallet
            // for the actual signature has to come from a fresh user
            // gesture or it silently drops on iOS / Android.
            <>
              {wallets.length === 0 && (
                <h6>
                  Wallet connected. Tap below to sign and link it to your
                  Backspace handle. Backspace never moves your funds —
                  this signature only proves ownership.
                </h6>
              )}
              <Space direction="column" />
              <code style={{ wordBreak: 'break-all', display: 'block' }}>
                {candidate.address}
              </code>
              <Space direction="column" size="sm" />
              <LargeTextButton
                color="primary"
                onClick={() => finishLinking().catch(() => undefined)}
                disabled={signing}
              >
                {phase === 'signing'
                  ? 'Sign in your wallet…'
                  : phase === 'linking'
                    ? 'Linking…'
                    : 'Sign to finish linking'}
              </LargeTextButton>
            </>
          ) : wallets.length === 0 ? (
            <>
              <h6>
                No external wallet linked yet. We never move your funds —
                linking only proves ownership so we can read your on-chain
                history.
              </h6>
              <Space direction="column" />
              <LargeTextButton
                color="primary"
                onClick={startLinking}
                disabled={connecting}
              >
                {connecting ? 'Opening wallet…' : 'Link Polymarket wallet'}
              </LargeTextButton>
            </>
          ) : (
            <Button
              color="primary"
              onClick={startLinking}
              disabled={connecting}
            >
              {connecting ? 'Opening wallet…' : 'Link another wallet'}
            </Button>
          )}

          {linkError && (
            <>
              <Space direction="column" />
              <h6 style={{ color: 'salmon' }}>{linkError.message}</h6>
            </>
          )}

          <Space direction="column" />
          <ManualLinkSection />
        </>
      )}

      <Space direction="column" />
      <Space direction="column" />
      <h3>Show accuracy on profile</h3>
      <Space direction="column" />
      <h6>
        When on, your Calls / Accuracy / Brier stats render on your public
        profile. When off, only you can see them. Linking a wallet alone
        never publishes anything — this toggle controls visibility.
      </h6>
      <Space direction="column" />
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: accuracyToggle.isSaving ? 'wait' : 'pointer',
          opacity: accuracyToggle.isLoading ? 0.5 : 1,
        }}
      >
        <input
          type="checkbox"
          checked={accuracyToggle.enabled}
          onChange={(e) => accuracyToggle.set(e.target.checked)}
          disabled={accuracyToggle.isLoading || accuracyToggle.isSaving}
        />
        <span>Show my accuracy stats on my public profile</span>
      </label>
    </>
  );
}

function ManualLinkSection() {
  const { generateManualMessage, submitManualLink, phase, error } =
    useLinkedWallets();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [signature, setSignature] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setAddress('');
    setMessage(null);
    setSignature('');
    setLocalError(null);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          padding: 0,
          cursor: 'pointer',
          textDecoration: 'underline',
          fontSize: 12,
        }}
      >
        Trouble linking? Use manual link
      </button>
    );
  }

  const handleGenerate = async () => {
    setLocalError(null);
    setBusy(true);
    try {
      const msg = await generateManualMessage(address);
      setMessage(msg);
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!message) return;
    setLocalError(null);
    setBusy(true);
    try {
      await submitManualLink({ message, signature });
      toast.success('Wallet linked');
      reset();
      setOpen(false);
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = () => {
    if (!message) return;
    copy(message);
    toast.success('Message copied');
  };

  return (
    <OldCol>
      <h3>Manual link</h3>
      <h6>
        Skip the wallet popup. Paste your address, sign the message in any
        wallet, paste the signature back. Backspace never moves your funds —
        this signature only proves ownership.
      </h6>
      <Space direction="column" />

      <h4>1. Wallet address</h4>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="0x…"
        disabled={!!message}
        style={{
          width: '100%',
          padding: '8px 10px',
          fontFamily: 'monospace',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(0,0,0,0.3)',
          color: 'white',
        }}
      />
      <Space direction="column" size="sm" />
      {!message ? (
        <Button color="primary" onClick={handleGenerate} disabled={busy || !address}>
          {busy ? 'Generating…' : 'Generate message'}
        </Button>
      ) : (
        <>
          <Space direction="column" />
          <h4>2. Sign this message in your wallet</h4>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 12,
            }}
          >
            {message}
          </pre>
          <Button color="primary" onClick={handleCopy}>
            Copy message
          </Button>

          <Space direction="column" />
          <h4>3. Paste the signature</h4>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="0x… (the signature your wallet produced)"
            style={{
              width: '100%',
              padding: '8px 10px',
              fontFamily: 'monospace',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
            }}
          />
          <Space direction="column" size="sm" />
          <Button
            color="primary"
            onClick={handleSubmit}
            disabled={busy || !signature || phase === 'linking'}
          >
            {phase === 'linking' || busy ? 'Linking…' : 'Link wallet'}
          </Button>
        </>
      )}

      {(localError || error) && (
        <>
          <Space direction="column" />
          <h6 style={{ color: 'salmon' }}>{localError ?? error?.message}</h6>
        </>
      )}

      <Space direction="column" />
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(false);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          padding: 0,
          cursor: 'pointer',
          textDecoration: 'underline',
          fontSize: 12,
        }}
      >
        Cancel manual link
      </button>
    </OldCol>
  );
}

function SolanaWalletSection() {
  const {
    walletAddress,
    walletsReady,
    isReady,
    provisionWallet,
    error,
  } = useDflowSwap();
  const balances = useSolanaBalances(walletAddress);
  const sol = balances.data?.find((b) => b.mint === 'SOL');

  const copyAddress = () => {
    if (!walletAddress) return;
    copy(walletAddress);
    toast.success('Address copied');
  };

  return (
    <>
      <h1>Solana Wallet</h1>
      <Space direction="column" />
      <h6>
        Spot swaps on Solana run through this non-custodial wallet.
        Backspace never holds your funds — send SOL here to start trading
        tokens via Dflow.
      </h6>
      <Space direction="column" />

      {!walletsReady ? (
        <h6>Loading wallet…</h6>
      ) : !isReady ? (
        <>
          <h6>
            One-time setup: provisions your Solana embedded wallet. No
            signature required — Privy generates it on the spot.
          </h6>
          <Space direction="column" />
          <LargeTextButton
            color="primary"
            onClick={() => provisionWallet().catch(() => undefined)}
          >
            Create Solana wallet
          </LargeTextButton>
        </>
      ) : (
        <>
          <h3>Deposit address</h3>
          <Space direction="column" />
          <h6>
            Send <strong>SOL on the Solana network</strong> to this address
            to fund swaps. Don&apos;t send from another chain.
          </h6>
          <Space direction="column" />
          <OldCol>
            <code style={{ wordBreak: 'break-all' }}>{walletAddress}</code>
            <Space direction="column" size="sm" />
            <Button color="primary" onClick={copyAddress}>
              Copy address
            </Button>
          </OldCol>
          <Space direction="column" />
          <h4>
            Balance:{' '}
            {balances.isLoading
              ? '—'
              : sol
                ? `${sol.uiAmount.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })} SOL`
                : '0 SOL'}
          </h4>
        </>
      )}

      {error && (
        <>
          <Space direction="column" />
          <h6 style={{ color: 'salmon' }}>{error.message}</h6>
        </>
      )}
    </>
  );
}

Wallet.Layout = settingsLayout;
export default Wallet;
