// Trading wallet settings — the funding + one-time-setup surface for
// each trading venue.
//   - Polymarket section: non-custodial Safe address + pUSD balance +
//     "Enable trading" (deploys Safe + approvals, gasless).
//   - Solana section: Privy embedded Solana wallet address + live SOL
//     balance + "Create wallet" (provisions on demand — Privy's
//     createOnLogin only auto-creates one chain, which we reserve for
//     Ethereum/Polymarket).
import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { toast } from 'react-toastify';
import { useDflowSwap } from '@src/hooks/useDflowSwap';
import { usePolymarketSession } from '@src/hooks/usePolymarketSession';
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

      <SolanaWalletSection />
    </Container>
  );
};

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
