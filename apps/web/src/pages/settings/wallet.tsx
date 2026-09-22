import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import settingsLayout from '@src/layouts/settingsLayout';

const Wallet: ReactLayoutComponentType = () => (
  <div className="font-display text-ink flex flex-col gap-5">
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <h2 className="m-0 text-[18px] font-semibold">Prediction market account</h2>
      <p className="mt-2 text-[13px] leading-snug text-ink-3">
        Backspace Markets is connected exclusively to Gate DexBuilder. Wallet
        enrollment, deposits, withdrawals, and trading will become available here
        when Gate activates the Backspace Builder account flow.
      </p>
    </section>
    <section className="rounded-[14px] border border-line bg-surface p-5">
      <h2 className="m-0 text-[18px] font-semibold">Spot wallet</h2>
      <p className="mt-2 text-[13px] leading-snug text-ink-3">
        Existing Backspace spot-wallet support remains separate from prediction
        markets while the Gate account integration is completed.
      </p>
    </section>
  </div>
);

Wallet.Layout = settingsLayout;
export default Wallet;
