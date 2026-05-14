// Trading wallet settings — the funding + one-time-setup surface for
// Polymarket markets. Shows the user their non-custodial Safe deposit
// address (where they self-fund USDC on Polygon), their pUSD balance,
// and an "Enable trading" action that runs the one-time session setup
// (deploy Safe + token approvals, gasless).
import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { toast } from 'react-toastify';
import { usePolymarketSession } from '@src/hooks/usePolymarketSession';
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
    </Container>
  );
};

Wallet.Layout = settingsLayout;
export default Wallet;
