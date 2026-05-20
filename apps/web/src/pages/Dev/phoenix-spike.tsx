// THROWAWAY — Phase 0 de-risk spike for Phoenix Rise perpetuals.
//
// Goals (per the approved plan):
//   1. Verify @ellipsis-labs/rise bundles under Next 12 (ESM-only pkg).
//   2. Probe Privy embedded Solana wallet for the Authority address.
//   3. Build a PhoenixClient with the Flight builder config injected.
//   4. Fetch the exchange snapshot — confirms RPC reachability + the
//      market catalog shape we'll import in Phase 2.
//   5. Derive the user's trader account address.
//   6. (Manual) activate the user's trader account with an access code
//      provided in the UI — Phoenix's docs imply per-user invite codes.
//   7. (Manual) place a tiny Flight-wrapped limit order and verify the
//      builder fee accrues to our trader account.
//
// Env vars consumed:
//   NEXT_PUBLIC_SOLANA_RPC_URL          — same as Dflow uses
//   NEXT_PUBLIC_PHOENIX_BUILDER_AUTHORITY     — base58 builder authority
//   NEXT_PUBLIC_PHOENIX_BUILDER_PDA_INDEX     — defaults to 0
//   NEXT_PUBLIC_PHOENIX_BUILDER_SUBACCOUNT_INDEX — defaults to 0
//
// DELETE this file once Phase 0 closes.

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

type Line = { label: string; value: string; tone?: 'ok' | 'err' | 'info' };

const PHOENIX_BUILDER_AUTHORITY =
  process.env.NEXT_PUBLIC_PHOENIX_BUILDER_AUTHORITY ?? '';
const PHOENIX_BUILDER_PDA_INDEX = Number.parseInt(
  process.env.NEXT_PUBLIC_PHOENIX_BUILDER_PDA_INDEX ?? '0',
  10,
);
const PHOENIX_BUILDER_SUBACCOUNT_INDEX = Number.parseInt(
  process.env.NEXT_PUBLIC_PHOENIX_BUILDER_SUBACCOUNT_INDEX ?? '0',
  10,
);
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? '';

export default function PhoenixSpike() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [log, setLog] = useState<Line[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);
  const [accessCode, setAccessCode] = useState('');
  const [orderSymbol, setOrderSymbol] = useState('');
  const [orderPriceUsd, setOrderPriceUsd] = useState('1.00');
  const [orderBaseUnits, setOrderBaseUnits] = useState('0.001');
  const [orderSide, setOrderSide] = useState<'BID' | 'ASK'>('BID');

  const push = (label: string, value: string, tone?: Line['tone']) =>
    setLog((prev) => [...prev, { label, value, tone }]);

  // Solana wallet — Privy provisions embedded Solana wallets via the
  // useWallets hook. Each wallet has a chain identifier; on the current
  // privy-io/react-auth this is 'solana'.
  const solanaWallet = wallets.find((w) => (w as any).chain === 'solana');
  const solanaAddress = solanaWallet?.address ?? null;

  // ─── Step 1: bundling probe ──────────────────────────────────────
  async function probeImports() {
    setRunning('imports');
    setLog([]);
    try {
      const rise = await import('@ellipsis-labs/rise');
      push('@ellipsis-labs/rise', 'imported', 'ok');
      push('createPhoenixClient', typeof rise.createPhoenixClient === 'function' ? 'function ok' : 'MISSING', typeof rise.createPhoenixClient === 'function' ? 'ok' : 'err');
      push('orderPackets builders', typeof (rise as any).buildLimitOrderPacketFromMarketParams === 'function' || (rise as any).PhoenixOrderPacketBuilders ? 'present' : 'check', 'info');
      push('Flight helpers', typeof (rise as any).wrapInstructionWithFlight === 'function' ? 'wrapInstructionWithFlight ok' : 'MISSING', typeof (rise as any).wrapInstructionWithFlight === 'function' ? 'ok' : 'err');
    } catch (err) {
      push('IMPORT FAILED', err instanceof Error ? err.message : String(err), 'err');
    } finally {
      setRunning(null);
    }
  }

  // ─── Step 2: Privy Solana wallet probe ───────────────────────────
  function probeWallet() {
    setLog([]);
    push('Privy ready', String(ready), ready ? 'ok' : 'info');
    push('Authenticated', String(authenticated), authenticated ? 'ok' : 'info');
    push('Wallets count', String(wallets.length), 'info');
    for (const w of wallets) {
      push(`  wallet[${(w as any).chain ?? '?'}]`, w.address, 'info');
    }
    push('Solana wallet found', solanaAddress ? 'yes' : 'NO — no Solana embedded wallet', solanaAddress ? 'ok' : 'err');
    if (PHOENIX_BUILDER_AUTHORITY) {
      push('Builder authority (env)', PHOENIX_BUILDER_AUTHORITY, 'ok');
    } else {
      push('Builder authority', 'NEXT_PUBLIC_PHOENIX_BUILDER_AUTHORITY not set', 'err');
    }
    push('Builder PDA index', String(PHOENIX_BUILDER_PDA_INDEX), 'info');
    push('Builder subaccount index', String(PHOENIX_BUILDER_SUBACCOUNT_INDEX), 'info');
    push('RPC URL', SOLANA_RPC_URL || '(unset — falling back to mainnet-beta)', SOLANA_RPC_URL ? 'ok' : 'info');
  }

  // ─── Step 3: construct client w/ Flight config ───────────────────
  async function buildClient() {
    setRunning('client');
    setLog([]);
    try {
      if (!PHOENIX_BUILDER_AUTHORITY) {
        push('Cannot build', 'NEXT_PUBLIC_PHOENIX_BUILDER_AUTHORITY missing', 'err');
        return;
      }
      const rise = await import('@ellipsis-labs/rise');
      const c = rise.createPhoenixClient({
        rpcUrl: SOLANA_RPC_URL || undefined,
        // Flight config — wraps every supported order instruction with
        // builder-routing so fees accrue to our trader account.
        flight: {
          builderAuthority: PHOENIX_BUILDER_AUTHORITY as any,
          builderPdaIndex: PHOENIX_BUILDER_PDA_INDEX,
          builderSubaccountIndex: PHOENIX_BUILDER_SUBACCOUNT_INDEX,
        },
      } as any);
      setClient(c);
      push('Client constructed', 'ok', 'ok');
      push('client.exchange', c.exchange ? 'present' : 'missing', c.exchange ? 'ok' : 'err');
      push('client.orderPackets', c.orderPackets ? 'present' : 'missing', c.orderPackets ? 'ok' : 'err');
      push('client.ixs', c.ixs ? 'present' : 'missing', c.ixs ? 'ok' : 'err');
      push('client.traders()', typeof c.traders === 'function' ? 'function ok' : 'missing', typeof c.traders === 'function' ? 'ok' : 'err');
    } catch (err) {
      push('Client construction failed', err instanceof Error ? err.message : String(err), 'err');
    } finally {
      setRunning(null);
    }
  }

  // ─── Step 4: exchange snapshot ───────────────────────────────────
  async function fetchSnapshot() {
    setRunning('snapshot');
    try {
      if (!client) {
        push('No client', 'Run Step 3 first', 'err');
        return;
      }
      const exchange = client.exchange;
      // The exact method name to call may vary by SDK version — try a few.
      let snap: any;
      if (typeof exchange.getSnapshot === 'function') {
        snap = await exchange.getSnapshot();
      } else if (typeof exchange?.fetch === 'function') {
        snap = await exchange.fetch();
      } else if (typeof exchange === 'function') {
        snap = await exchange();
      } else {
        push('Snapshot method?', 'No .getSnapshot / .fetch found — log exchange keys below', 'info');
        push('  exchange keys', Object.keys(exchange).join(', '), 'info');
        return;
      }
      const markets = snap?.markets ?? snap?.marketParams ?? snap?.value ?? [];
      const count = Array.isArray(markets) ? markets.length : Object.keys(markets ?? {}).length;
      push('Snapshot ok', `${count} markets`, 'ok');
      const list: any[] = Array.isArray(markets) ? markets : Object.values(markets ?? {});
      for (const m of list.slice(0, 6)) {
        const sym = m.symbol ?? '?';
        const tick = m.tickSize ?? '?';
        const maxLev = m.leverageTiers?.[0]?.maxLeverage ?? '?';
        push('  market', `${sym} · tick ${tick} · maxLev ${maxLev}`, 'info');
      }
      if (list.length > 0 && !orderSymbol) {
        setOrderSymbol(list[0]?.symbol ?? '');
      }
    } catch (err) {
      push('Snapshot failed', err instanceof Error ? err.message : String(err), 'err');
    } finally {
      setRunning(null);
    }
  }

  // ─── Step 5: derive trader address ───────────────────────────────
  async function deriveTrader() {
    setRunning('trader');
    try {
      if (!client) {
        push('No client', 'Run Step 3 first', 'err');
        return;
      }
      if (!solanaAddress) {
        push('No Solana wallet', 'Privy not signed in or no embedded wallet', 'err');
        return;
      }
      // Phoenix derives a trader account PDA from (authority, pdaIndex).
      // The PDA client is on client.pda — exact method varies, probe.
      const pda = client.pda;
      if (!pda) {
        push('client.pda missing', '', 'err');
        return;
      }
      push('pda methods', Object.keys(pda).join(', ').slice(0, 200), 'info');
      // Try a likely name:
      const candidate =
        pda.deriveTraderAddress ?? pda.traderAddress ?? pda.getTraderAddress;
      if (typeof candidate === 'function') {
        const addr = await candidate.call(pda, {
          authority: solanaAddress,
          traderPdaIndex: 0,
        });
        push('Trader address (pdaIndex 0)', String(addr), 'ok');
      } else {
        push('No obvious deriveTraderAddress', 'inspect pda methods above', 'info');
      }
    } catch (err) {
      push('Derive failed', err instanceof Error ? err.message : String(err), 'err');
    } finally {
      setRunning(null);
    }
  }

  // ─── Step 6: activate trader (invite code) ───────────────────────
  async function activateTrader() {
    setRunning('activate');
    try {
      if (!client) {
        push('No client', 'Run Step 3 first', 'err');
        return;
      }
      if (!solanaAddress) {
        push('No Solana wallet', '', 'err');
        return;
      }
      if (!accessCode) {
        push('Missing access code', 'Enter the code Phoenix gave you for this trader', 'err');
        return;
      }
      // The SDK shape from the docs: invite().activateInvite({ authority, code })
      const inviteCli = client.invite?.() ?? client.api?.invite ?? null;
      if (!inviteCli || typeof inviteCli.activateInvite !== 'function') {
        push('No invite() client', 'inspect client root keys', 'err');
        push('  client keys', Object.keys(client).join(', '), 'info');
        return;
      }
      const resp = await inviteCli.activateInvite({
        authority: solanaAddress,
        code: accessCode,
      });
      push('Activation response', JSON.stringify(resp).slice(0, 200), 'ok');
    } catch (err) {
      push('Activate failed', err instanceof Error ? err.message : String(err), 'err');
    } finally {
      setRunning(null);
    }
  }

  // ─── Step 7: tiny Flight-wrapped limit order ─────────────────────
  async function placeTestOrder() {
    setRunning('order');
    try {
      if (!client) { push('No client', '', 'err'); return; }
      if (!solanaAddress) { push('No Solana wallet', '', 'err'); return; }
      if (!orderSymbol) { push('No symbol', 'Run snapshot first or enter one', 'err'); return; }

      // Build a limit-order packet via the SDK's builder.
      const packet = await client.orderPackets.buildLimitOrderPacket?.({
        symbol: orderSymbol,
        side: orderSide === 'BID' ? 0 : 1, // Side.Bid / Side.Ask — actual enum name varies
        priceUsd: orderPriceUsd,
        baseUnits: orderBaseUnits,
      });
      if (!packet) {
        push('No buildLimitOrderPacket', 'inspect client.orderPackets', 'err');
        push('  keys', Object.keys(client.orderPackets ?? {}).join(', '), 'info');
        return;
      }
      push('Order packet built', 'ok', 'ok');

      // Build placement instruction — when the client was constructed
      // with `flight: {...}` this is supposed to wrap automatically.
      const ix = await client.ixs.placeLimitOrder?.({
        authority: solanaAddress,
        symbol: orderSymbol,
        orderPacket: packet,
      });
      if (!ix) {
        push('placeLimitOrder missing', 'inspect client.ixs', 'err');
        return;
      }
      push('Instruction built', 'ok — would broadcast next', 'ok');
      push('NOTE', 'Spike stops short of broadcast. Sign + sendTransaction with Privy Solana wallet is the next layer (Phase 3).', 'info');
    } catch (err) {
      push('Order build failed', err instanceof Error ? err.message : String(err), 'err');
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="min-h-screen bg-canvas px-6 py-8 font-display text-ink">
      <div className="mx-auto max-w-[920px]">
        <h1 className="text-[22px] font-bold tracking-[-0.01em]">
          Phoenix Rise — Phase 0 spike
        </h1>
        <p className="mt-1 text-[13px] text-ink-3">
          Throwaway probe. Step through each button, watch the log, stop where it breaks.
        </p>

        <section className="mt-6 flex flex-wrap gap-2">
          <Btn onClick={probeImports} disabled={running !== null} active={running === 'imports'}>
            1. Imports
          </Btn>
          <Btn onClick={probeWallet} disabled={running !== null}>
            2. Wallet probe
          </Btn>
          <Btn onClick={buildClient} disabled={running !== null} active={running === 'client'}>
            3. Build client
          </Btn>
          <Btn onClick={fetchSnapshot} disabled={running !== null || !client} active={running === 'snapshot'}>
            4. Exchange snapshot
          </Btn>
          <Btn onClick={deriveTrader} disabled={running !== null || !client} active={running === 'trader'}>
            5. Derive trader addr
          </Btn>
        </section>

        <section className="mt-4 rounded-[12px] border border-line bg-surface p-4">
          <div className="text-[12px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-2">
            6. Activate trader account
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Access code from Phoenix"
              style={{ background: 'transparent' }}
              className="flex-1 min-w-[200px] h-9 px-3 rounded-[8px] border border-line text-[13px] text-ink placeholder:text-ink-3 outline-none focus:border-brand-2"
            />
            <Btn onClick={activateTrader} disabled={running !== null || !client} active={running === 'activate'}>
              Activate
            </Btn>
          </div>
        </section>

        <section className="mt-4 rounded-[12px] border border-line bg-surface p-4">
          <div className="text-[12px] font-mono uppercase tracking-[0.06em] text-ink-3 mb-2">
            7. Tiny Flight-wrapped limit order (build only — no broadcast)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input value={orderSymbol} onChange={(e) => setOrderSymbol(e.target.value)} placeholder="SYMBOL" style={{ background: 'transparent' }} className="h-9 px-3 rounded-[8px] border border-line text-[13px] text-ink placeholder:text-ink-3 outline-none focus:border-brand-2" />
            <select value={orderSide} onChange={(e) => setOrderSide(e.target.value as any)} style={{ background: 'transparent' }} className="h-9 px-3 rounded-[8px] border border-line text-[13px] text-ink outline-none focus:border-brand-2">
              <option value="BID">BID (long)</option>
              <option value="ASK">ASK (short)</option>
            </select>
            <input value={orderPriceUsd} onChange={(e) => setOrderPriceUsd(e.target.value)} placeholder="priceUsd" style={{ background: 'transparent' }} className="h-9 px-3 rounded-[8px] border border-line text-[13px] text-ink placeholder:text-ink-3 outline-none focus:border-brand-2" />
            <input value={orderBaseUnits} onChange={(e) => setOrderBaseUnits(e.target.value)} placeholder="baseUnits" style={{ background: 'transparent' }} className="h-9 px-3 rounded-[8px] border border-line text-[13px] text-ink placeholder:text-ink-3 outline-none focus:border-brand-2" />
          </div>
          <div className="mt-2">
            <Btn onClick={placeTestOrder} disabled={running !== null || !client} active={running === 'order'}>
              Build order instruction
            </Btn>
          </div>
        </section>

        <section className="mt-6 rounded-[12px] border border-line bg-surface p-4 font-mono text-[12px] leading-snug">
          {log.length === 0 ? (
            <div className="text-ink-3">Log empty — click a step above.</div>
          ) : (
            log.map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-ink-3 flex-none w-44 truncate">{l.label}</span>
                <span
                  className={
                    l.tone === 'err'
                      ? 'text-pink-vivid'
                      : l.tone === 'ok'
                        ? 'text-green-2'
                        : 'text-ink'
                  }
                >
                  {l.value}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function Btn({
  children, onClick, disabled, active,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-full px-3.5 h-9 text-[13px] font-semibold transition-colors duration-150',
        active
          ? 'bg-brand-2 text-ink'
          : 'bg-brand text-ink hover:bg-brand-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      ].join(' ')}
    >
      {active ? 'Running…' : children}
    </button>
  );
}
