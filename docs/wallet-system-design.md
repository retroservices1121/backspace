# Backspace auth and trading wallet system: design proposal

- **Status:** proposal only. Nothing in this document is implemented. No tables, migrations, registration routes, deposit or withdraw UI exist yet.
- **Date:** 26 Nov 2026
- **Context:** Gate DexBuilder is Backspace's only market provider and the authority for orders, positions, balances and fills. Slice 1 (branch `feat/gate-broker`) added the server-only Broker client (`@backspace/markets/server`) and wired private REST. Private routes return 409 because no user has a registered Gate wallet yet.
- **Decision driver:** JP rejected Privy for trading wallets because it costs too much at volume, and wants Backspace to own its auth and wallet system. Deposits and withdrawals ship in the first trading release.
- **Sources:** Gate DexBuilder docs (Broker auth, user wallet, Platform API `dexbuilder-en.yaml`, Prediction and Event Contracts OpenAPI), `packages/db/prisma/schema.prisma`, `apps/web/src/lib/gate/brokerAccount.ts`.

Vendor prices below are order-of-magnitude figures from public pricing as last known. They change often and enterprise deals differ a lot. **Get current quotes before deciding.**

---

## 1. What Gate actually requires a wallet to do

The key point for cost and UX: **Gate orders do not need a user wallet signature.** The Broker signs every private REST call with HMAC-SHA512 on our server and identifies the user with `X-User-Wallet-Address`. The user's wallet key is only needed for these rare events:

| Event | Who signs | What is signed | How often |
|---|---|---|---|
| Registration | User wallet | Gate `sign-message` text: EIP-191 `personal_sign` (EVM) or Ed25519 over the UTF-8 bytes, `0x` hex (Solana) | Once per wallet |
| Deposit | User wallet | An onchain transaction to the Gate Vault contract, built from `deposit/sign_data` calldata. Needs native gas on that chain. | Per deposit |
| Withdrawal | User wallet | EIP-712 TypedData from `withdraw/sign_data` (EVM), submitted as `r`/`v`/`s` to `withdraw/submit` | Per withdrawal |
| Solana withdrawal to a new account | Payer wallet | Base64 transaction from `withdraw/ata/check-and-build` that creates the SPL token account (ATA) | First Solana withdrawal |
| Moving funds out of the wallet | User wallet | Ordinary onchain transfer | User-initiated |

Gate rules that shape the design:

- `withdraw/sign_data`: `to_address` "must equal the bound signing wallet address; third-party withdrawal destinations are not supported." Vault funds can only go back to the registered wallet. So **whoever controls that wallet's key controls the user's money** once it leaves the Vault.
- Registration requires `dex_builder` read-write permission and an `Idempotency-Key`. Re-registering the same address is allowed. Save `user_id` and `broker_uid`, then confirm with `users/resolve`.
- Supported chains: registration `evm | solana`. Funding networks: `base, bsc, ethereum, arbitrum, solana`. Deposits include a LayerZero fee (`lz_fee`), so a deposit on one network can be credited cross-chain.
- Some Platform endpoints (`deposit/sign_data`, `withdraw/submit`, `user/balance`) need `x-perp-device-type` (1 Android, 2 iOS, 3 Web). The Slice 1 client has no custom-header option yet. Add one in Slice 2.
- Platform responses use `{ code, message, data, trace_id }`, and some business errors return HTTP 200 with `code != 0`. The Slice 1 client already handles this.
- Gate checks the address and signature, so the address must be able to produce **EOA-style signatures**: EIP-191 and EIP-712 recovering to the address. A plain ERC-4337 smart-contract account would need EIP-1271, which Gate does not document. Assume an **EOA** (optionally upgraded with EIP-7702 later for gas sponsorship; see open questions).

## 2. Registration flow (Slice 2)

All Gate calls run on the Backspace server with the Broker key. Only the wallet signature comes from the user's signer.

```
App (signed-in user)                 Backspace API                         Gate DexBuilder
--------------------                 -------------                         ---------------
1. "Enable trading" ───────────────▶ ensure trading wallet exists
                                     (create via signer backend, §4)
                                     GET /users/resolve?chain&address ───▶ registered? (Broker-signed)
                                     if registered and broker_uid known: done
2.                                   GET /users/sign-message?chain&address ▶ { message, timestamp }
   ◀─── message to sign ────────────
3. signer signs message
   EVM: personal_sign (EIP-191)
   Solana: Ed25519(UTF-8 bytes) → 0x hex
   ──── signature ─────────────────▶ 4. POST /users/register ─────────────▶ { user_id, broker_uid,
                                        body {chain,address,sign,timestamp}   created, bound, project_id }
                                        Idempotency-Key = uuid per attempt
                                     5. GET /users/resolve ────────────────▶ registered, same user_id
                                     6. persist mapping (no balances)
   ◀─── trading enabled ────────────
```

After step 6, `resolveGateWallet(authId)` in `apps/web/src/lib/gate/brokerAccount.ts` returns the stored address. Every private call then sends `X-User-Wallet-Address`, which is **not** part of the REST signature string.

Proposed mapping (Slice 2 migration, **not** created in this slice):

```
GateAccount
  id, userId (FK User), chain ('evm' | 'solana'), address (EVM lowercased),
  gateUserId, brokerUid, projectId, registeredAt, resolvedAt, active,
  signerProvider ('turnkey' | 'cdp' | 'inhouse' | 'external'), signerRef (vendor wallet/sub-org id)
  @@unique([chain, address]), @@unique([userId, chain])
```

The table holds identity and mapping only. **Never store orders, positions, balances or fills.** Gate stays authoritative, and the existing `User.positions` / `User.trades` relations stay unused for Gate.

Relation to existing fields:

- `Wallet` (`chain`, `address`, `custodial`, `source`, `isPrimary`) can hold the trading wallet row with `source = 'backspace-trading'`. `GateAccount` points to it.
- `User.primaryTradingWalletAddress` is a lowercased EVM address used by the web `useEvmTradeSigner` for Dflow and EVM spot flows. Do **not** overload it for Gate. The Gate wallet is chosen by `GateAccount`, and the Gate wallet must be a signer the server can drive (§4). A random external wallet the user later unlinks would strand Vault funds.
- Existing Solana rows come from Dflow audits (`source = 'audit-solana'`). These are external wallets Backspace cannot sign for. Do not register them with Gate on the user's behalf.

## 3. EVM or Solana for the first release

| | EVM (secp256k1 EOA) | Solana (Ed25519) |
|---|---|---|
| Registration | `personal_sign` | Ed25519, `0x` hex |
| Withdrawal signing | Documented EIP-712 `r/v/s` | Solana path not fully documented; ATA helper exists |
| Funding networks | arbitrum, base, bsc, ethereum (one key covers all) | solana |
| Backspace today | CDP/wagmi on web, `primaryTradingWalletAddress`, Privy embedded EVM | Dflow spot, audit-only rows |
| Gas for deposit | ETH/BNB on the chosen network | SOL, plus ATA rent on the first withdrawal |

**Recommendation: EVM first.** The withdrawal path is fully specified, one key covers four funding networks, and most signer vendors support secp256k1 best. Pick the default deposit network after checking `GET /dexbuilder/assets` and `/fee` for USDT availability and fees. Arbitrum or BSC (native USDT) are likely candidates; Base mostly carries USDC. Add Solana as a second chain once Gate documents its withdrawal signing end to end.

## 4. Custody options

The real question: who can produce a signature for the trading wallet, and under what authorization?

### A. Custodial, in-house keys (Backspace holds the keys)

The server generates keys and stores them encrypted under a KMS/HSM key-encryption key (envelope encryption, never one KMS key per user, which costs about $1 per key per month). It signs inside a hardened service, ideally a Nitro Enclave or another TEE.

- **UX:** best. The user never sees a signing prompt, and email OTP alone is enough.
- **Recovery:** trivial, because Backspace has the key.
- **Who can sign registration and withdrawals:** Backspace, alone.
- **Cost:** low marginal cost (KMS requests about $0.03 per 10k). High fixed cost: HSM/KMS setup, enclave engineering, key ceremonies, audits, on-call, and insurance.
- **Risk:** Backspace has full independent control of user funds once they are withdrawn to the wallet. Under US FinCEN guidance (2019 CVC guidance) a hosted-wallet provider with independent control is generally a **money transmitter**: FinCEN MSB registration, state money transmitter licenses or the NY BitLicense, AML/KYC program, and custody insurance. Insider and breach risk sits entirely with us. This is a regulated business line, not a feature.

### B. Non-custodial, user-held key (external wallet or local key)

The user connects MetaMask/Phantom, or the app generates a key in Secure Enclave or Keychain.

- **UX:** poor for an email-first social app. Wallet installs, seed phrases, and lost-device risk.
- **Recovery:** the user's problem. A local key with no backup means lost funds.
- **Cost:** about $0.
- **Risk:** lowest regulatory exposure, highest support burden and user-loss risk. Keep this as an **advanced option** ("bring your own wallet") rather than the default.

### C. Non-custodial embedded wallet on signing infrastructure (TEE or MPC), user-authorized (recommended)

The key lives in a vendor's secure enclave, or is split by MPC/threshold signing. It signs only when an **authenticator controlled by the user** approves: a passkey on their device, plus email-OTP recovery. Backspace's server can request signatures but cannot approve them alone. Vendor policy engines can restrict what gets signed: only Gate registration messages, deposits to the Gate Vault contract, EIP-712 withdrawals whose `to_address` equals the wallet.

- **UX:** email sign-in as today. "Enable trading" adds one Face ID or Touch ID passkey prompt. Registration, deposits and withdrawals each take one biometric tap. No seed phrase.
- **Recovery:** a new device recovers through email OTP plus vendor recovery, with a cooldown before withdrawals. Optional export of the key to the user.
- **Who can sign:** registration and withdrawals need the user's authenticator. A Backspace operator or a compromised server cannot drain funds.
- **Cost:** per signature or per active wallet (§6). Signatures are rare because orders are Broker-signed.
- **Risk:** vendor dependency and lock-in. Mitigate with a `TradingSigner` interface and user key export. Regulatory posture is generally treated as non-custodial, but get counsel to confirm (§7).

### D. In-house MPC/threshold signing (2-of-2 or 2-of-3)

This is option C built ourselves: a user share on the device in Secure Enclave, a server share in our HSM, and an optional recovery share with a third party.

- Same non-custodial properties as C, with no per-signature vendor fees.
- **Cost:** high. Cryptography engineering (DKLs or CGGMP libraries), mobile SDK work, audits, and ongoing security staff. Realistic only after volume proves it out. Moving from C to D later is possible behind the same interface.

### Comparison

| | A Custodial in-house | B User-held | C Embedded TEE/MPC vendor | D In-house MPC |
|---|---|---|---|---|
| Email-first UX | Excellent | Poor | Good (passkey) | Good |
| Backspace can move funds alone | **Yes** | No | No (policy + user authenticator) | No |
| Money-transmitter exposure | **High** | Low | Low–medium (confirm) | Low–medium |
| Build effort | High | Low | Low–medium | Very high |
| Marginal cost | Very low | 0 | Per signature / active wallet | Very low |
| Time to first trading release | Months | Weeks | Weeks | Quarters |

## 5. Deposits and withdrawals on the recommended option (C, EVM)

Slice 3 or later; not built now. All Gate calls are Broker-signed on the server with `X-User-Wallet-Address` (and `x-perp-device-type`).

**Deposit (USDT from outside → Gate Vault)**

1. The user funds the trading wallet's address with USDT and a little gas on the chosen network. Show the address and QR. Optionally add an onramp later.
2. `GET /dexbuilder/assets`, `/networks`, `/dw_status`: show only enabled assets and networks.
3. `POST /dexbuilder/deposit/fee` → `native_fee`, `lz_fee`.
4. `POST /dexbuilder/deposit/sign_data` with `lz_fee` converted to an int64 with 6 decimals and `native_fee` unchanged → `{ contract_address, data }`.
5. The app builds the transaction (`to = contract_address`, `data`, `value = native_fee` where required) and asks the signer to sign and broadcast it. One passkey tap. Signer policy allows only `contract_address` from Gate's asset config. An ERC-20 approve may come first; confirm with Gate.
6. Poll `GET /dexbuilder/deposit/status?tx_hash=` and `/user/balance`. Gate's balance is shown live and never stored.

**Withdrawal (Gate Vault → the user's own wallet)**

1. Show `GET /dexbuilder/withdraw_limit` and `/fee`.
2. `POST /dexbuilder/withdraw/sign_data` (`address` = `to_address` = the trading wallet) → `{ data: EIP-712 JSON as hex, timestamp (ms) }`.
3. The app decodes and shows the TypedData (amount, token, network). The signer signs the EIP-712 hash after a passkey prompt. Policy: the typed-data domain is the Gate Vault, and the recipient equals the wallet.
4. `POST /dexbuilder/withdraw/submit` with `r`, `v`, `s`, the same `timestamp`, and an `Idempotency-Key` (UUID, reused on retry).
5. Poll `/withdraw/status?event_id=` and `/withdraw/history`.
6. Moving funds onward (to an exchange, say) is a normal onchain transfer from the wallet, signed with a passkey. Backspace should add address allowlisting and a new-device cooldown here.

**Solana (later):** `withdraw/ata/check-and-build` returns a base64 transaction to create the recipient's USDT ATA. The payer (the user's Solana wallet, or a Backspace fee-payer if we choose to sponsor rent) signs it before withdrawing.

**Gas:** an EOA needs native gas for deposits. Options: tell users to send a little ETH/BNB, have Backspace top up gas from a hot wallet (treasury cost, abuse risk), or EIP-7702 delegation with a paymaster (keeps the EOA address, but check Gate's signature verification after delegation). Open question 6.

## 6. Cost compared with Privy

Assumptions for the comparison:

- Social MAU far exceeds funded traders: for example, 500k MAU and 25k monthly active traders.
- Per trader per month: about 2 deposits, 1 withdrawal and 1 onward transfer, so ~4 user signatures. Registration is a one-time signature. **Orders cost no user signatures** because the Broker signs them.
- That is about 100k user signatures per month at 25k traders.

| Option | Pricing model (verify) | Rough monthly cost at 25k traders / 500k MAU |
|---|---|---|
| Privy (auth + embedded wallets) | Per monthly active user, enterprise tiers above the self-serve plans | Scales with **all** MAU who log in, not only traders. Low-to-mid five figures per month at 500k MAU is plausible on list-style pricing. JP's reason for rejecting it. |
| Turnkey (TEE, policy engine, passkeys, email auth) | Per signature, with volume tiers (roughly cents down to sub-cent per signature) | ~100k signatures → low thousands per month or less. Wallets for non-traders cost ~0 if created lazily. |
| Coinbase CDP embedded / server wallets | Per wallet operation (sub-cent list price, with a free monthly allowance) | ~100k operations → hundreds to low thousands per month |
| Dfns | Per wallet and enterprise contract | Typically a fixed annual contract in the tens of thousands. Fits institutional use more than consumer use. |
| Web3Auth (MetaMask Embedded Wallets) | Per monthly active wallet | Cheap per wallet. Scales with wallets used, not total MAU, if created lazily. |
| Lit Protocol | Network and PKP minting fees | Low direct cost. Higher integration and operational complexity, and a decentralized-network dependency. |
| In-house custodial (A) | KMS/HSM + enclave infra | Infra in the hundreds per month, but people, audit, licensing and insurance dominate (six to seven figures per year once licensed) |
| In-house MPC (D) | Infra + team | Infra low. Two to three security engineers plus audits. Pays off only at large scale. |

Takeaways:

- With Privy the cost driver is login MAU. Under C it is trading signatures, which are far fewer because orders are Broker-signed.
- Create trading wallets **lazily**, only when a user taps "Enable trading". Most social users never cost anything.
- Moving app login off Privy (§8) removes the MAU charge entirely, whichever wallet vendor we pick.

## 7. Security and compliance risks

| Risk | Notes and mitigations |
|---|---|
| Key custody | A: Backspace is a honeypot. C/D: no single party can sign. Use vendor policies that only allow Gate Vault deposits, Gate EIP-712 withdrawals to self, and registration messages. |
| Money transmission / custodial status | A is very likely an MSB and money transmitter in the US (FinCEN MSB, state MTLs/BitLicense), with similar regimes abroad (EU MiCA CASP, UK FCA). C/D are generally treated as unhosted or non-custodial when the user's authenticator is required. Prediction-market and event-contract access also raises gambling and derivatives questions (CFTC, state law, geo-blocking) **independent of the wallet choice**. Get counsel before launch. |
| Withdrawal authorization | Require a passkey for every withdrawal and outbound transfer. Add a cooldown (for example 24–48 h) after email change, new device or recovery. Use per-day limits that mirror Gate `withdraw_limit`. Notify the user by email and push. Gate already restricts Vault withdrawals to the bound wallet. |
| Device compromise | Passkeys are device-bound and need biometrics. Session tokens are short-lived. Prompt again for sensitive actions. Never put Broker secrets in the app (already enforced: server-only entry, no `EXPO_PUBLIC_*`). |
| Email account takeover | Email OTP is the weakest factor. Use it only for login and recovery, never to approve withdrawals alone. Add a recovery cooldown and notify the old email on change. |
| Insider risk | The Broker key can act for any registered wallet on Gate, including placing and cancelling orders. It cannot withdraw, because withdrawals need the user's EIP-712 signature. Store the Broker secret only in server env, rotate it, restrict Gate IP allowlist to Railway egress, and keep an audit log of every private call (method, path, wallet, request id, never SIGN or bodies). Two-person rule for production env changes. |
| Broker key compromise | An attacker could trade or cancel orders for users, but not withdraw. Mitigate with IP allowlist, rotation runbook, anomaly alerts on order volume, and a kill switch that unsets keys so routes fail closed with 503. |
| Vendor risk (C) | Vendor outage blocks deposits and withdrawals, but not trading, since orders are Broker-signed. Keep a `TradingSigner` interface, support user key export, and get SOC 2 reports and audit summaries. |
| Auditability | Append-only log of registration, deposit and withdrawal requests (ids, tx hashes, Gate `trace_id`). Gate remains the ledger of record. Backspace does not store balances. |

## 8. Moving app login off Privy

Today, login is Privy email OTP. `User.authId` stores the Privy identifier, and `legacyAuthId` already exists from an earlier in-place migration that matched users on email. Native and web send a Privy access token that the API verifies.

Proposal:

1. **Slice 2 (registration):** keep Privy for login unchanged. Build the trading wallet on option C, independent of Privy, keyed by Backspace `User.id`, not by Privy's embedded wallet. This removes Privy from the trading path immediately.
2. **Slice 3+:** replace Privy login with Backspace-owned email OTP.
   - Self-hosted: OTP codes hashed with a short TTL and rate limits, sent by an email provider such as SES, Resend or Postmark. Backspace issues its own short-lived access JWT plus a rotating refresh token, verified in `nextconnect` instead of Privy's verifier. Cost: email sending only, fractions of a cent per login.
   - Alternative: the wallet vendor's email auth (for example Turnkey email OTP), which unifies login and wallet authenticators.
   - Or a cheaper hosted provider (Supabase Auth, Firebase Auth, Stytch, Clerk) if we don't want to own OTP delivery. Firebase config already exists in `apps/web`.
3. **Moving existing `authId` users:** on first login through the new provider, match on **verified email**. If matched, move the current `authId` into `legacyAuthId` and set the new `authId`, the same pattern used before. Run a dual-verify window where the API accepts both Privy and Backspace tokens, then switch new logins, then retire Privy. Users without email (social-only logins, if any) need a one-time email verification step.
4. **Privy embedded wallets** (`Wallet.source = 'privy-embedded'`): these are not Gate wallets and hold no Gate funds. Offer users Privy's key export or an in-app "move funds" transfer before the Privy contract ends. Never import their keys into Backspace.
5. **Social login:** stay on email OTP. Add Sign in with Apple and Google later via our own OAuth handling, since the iOS app may need Apple sign-in if other third-party social logins are offered.

## 9. Recommendation

**Adopt option C: non-custodial embedded EVM EOA wallets on a per-signature TEE/MPC signing vendor (Turnkey first choice, Coinbase CDP as the alternative to quote), with Backspace-owned identity, sessions, wallet records and UX.**

Why:

- **Cost fits the product.** A social app has many more readers than traders. Orders are Broker-signed, so user signatures happen only at registration, deposits and withdrawals. Lazy wallet creation means non-traders cost nothing.
- **Fewest regulatory unknowns among the options that keep the UX.** Backspace never gains unilateral control of funds. Gate already forces Vault withdrawals to the bound wallet.
- **Email-first UX holds.** Email OTP stays the login. Trading adds one passkey, with no seed phrases.
- **Ships with the first trading release.** Weeks of work, not quarters. The `TradingSigner` interface keeps an exit path to in-house MPC (D) if volume justifies it.
- **"Our own system" is satisfied where it matters.** Backspace owns the user identity, session tokens, wallet mapping, Gate registration, policies and UX. The vendor is a replaceable signing backend.

Proposed slices:

1. **Slice 2:** signer vendor integration (`TradingSigner`), lazy wallet creation, `GateAccount` mapping, registration routes (sign-message, register, resolve), and `resolveGateWallet` reading the mapping. Add `x-perp-device-type` support to the Broker client.
2. **Slice 3:** deposits and withdrawals (EVM), status polling, limits, notifications, cooldowns, and private WebSocket proxy for order and position updates.
3. **Slice 4:** Backspace-owned email OTP login and Privy retirement. Solana support. Gas sponsorship.

## 10. Open questions for JP

1. **Custody stance:** confirm that Backspace must never be able to move user funds alone (option C or D), not a custodial model (A) with licensing.
2. **Vendor:** may we get quotes from Turnkey and Coinbase CDP (and optionally Dfns and Web3Auth) for the volumes in §6? What MAU and trader numbers should we plan for in year one?
3. **Chain and network:** is EVM-first acceptable? Which deposit network should be the default (Arbitrum, BSC, Base, Ethereum), given Gate's USDT support and fees? Is Solana needed at launch?
4. **Broker key:** does the Gate Broker key have `prediction`, `event_contracts` and `dex_builder` read-write permissions? Is an IP allowlist required, and do we have a static Railway egress IP?
5. **Event Contracts:** should Event Contracts be tradable in the first trading release, or only browsable?
6. **Gas:** should Backspace sponsor deposit gas (a hot-wallet top-up, or EIP-7702 plus a paymaster if Gate's signature checks still pass), or ask users to bring gas?
7. **Market order semantics:** Slice 1 defaults market orders to `FOK` (all or nothing). Is `FAK` (partial fills allowed) preferred? Gate should confirm which one they recommend with `total_cost`.
8. **Legal:** who is counsel for money transmission and for prediction-market and event-contract eligibility (geo-blocking, KYC)? Does Gate perform KYC, or do we?
9. **Login migration timing:** is the plan to keep Privy login through the first trading release and replace it in Slice 3+? Do we self-host email OTP or use a cheaper hosted provider?
10. **Existing Privy embedded wallets:** do any users hold meaningful funds in them, and what notice period do they need before Privy is retired?
11. **Withdrawal policy:** cooldown length after recovery or device change, and daily limits.
12. **Recovery:** is email-OTP recovery with a cooldown acceptable, or should we require a second factor (a second passkey, or a recovery code)?
