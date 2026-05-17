// Login — port of welcomeui's split-screen design. Desktop has a
// pitch panel on the left (brand-purple gradient + grid overlay +
// three feature cards) and an auth card on the right with email,
// Google, Apple, and Connect wallet entry points. Mobile stacks
// the same auth card under a centered brand block.
//
// Every button calls usePrivy().login() — Privy v1.99 doesn't
// expose scoped login-method helpers on the public hook, so the
// branded card hands off to Privy's themed modal once tapped.
// The win is the landing experience: users land on a branded page
// instead of an unstyled "Continue" stub.

import React, { useEffect, useState } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import useAuthentication from '@src/hooks/useAuthenticate';
import { AuthStatus } from '@src/store/authSlice';
import { usePrivy } from '@privy-io/react-auth';
import AuthLayout from 'layouts/authLayout';
import { useRouter } from 'next/router';

import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { useAppDispatch } from 'store/store';

const pageTitle = 'Sign in';

const Login: ReactLayoutComponentType = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authStatus = useAuthentication();
  const { ready, authenticated, login } = usePrivy();
  const [email, setEmail] = useState('');

  useEffect(() => { dispatch(setPageTitle(pageTitle)); }, []);

  useEffect(() => {
    if (authStatus === AuthStatus.SignedIn) {
      router.push(APP.INDEX);
    }
  }, [authStatus]);

  const start = () => { if (ready && !authenticated) login(); };

  return (
    <div
      className="
        relative min-h-screen w-full
        font-display text-ink bg-canvas
        lg:grid lg:grid-cols-[1.05fr_minmax(0,1fr)]
      "
    >
      {/* ─── Left panel (desktop only): pitch + feature cards ─── */}
      <aside
        className="
          relative hidden lg:flex flex-col justify-between
          px-12 py-10 overflow-hidden
        "
        style={{
          background: [
            'radial-gradient(circle at 25% 25%, rgba(88,34,251,0.55), transparent 55%)',
            'radial-gradient(circle at 80% 70%, rgba(255,136,0,0.32), transparent 55%)',
            'linear-gradient(180deg, #0c0a16 0%, #08070d 100%)',
          ].join(','),
        }}
      >
        {/* Grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: [
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px)',
              'linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
            ].join(','),
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <img
            src="/webui/backspace-icon.png"
            alt=""
            className="w-9 h-9 rounded-lg shadow-[0_20px_40px_-10px_rgba(88,34,251,0.45)]"
          />
          <span className="text-[20px] font-bold tracking-[-0.01em] text-ink">
            backspace
          </span>
        </div>

        <div className="relative max-w-[560px]">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-brand-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-2 shadow-[0_0_0_3px_rgba(123,76,255,0.2)]" />
            The conviction layer
          </div>
          <h1 className="mt-3 text-[56px] xl:text-[64px] font-bold leading-[1.02] tracking-[-0.025em] text-ink">
            Every opinion has a{' '}
            <em
              className="not-italic"
              style={{
                background: 'linear-gradient(135deg, #7B4CFF 0%, #FF8800 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontStyle: 'italic',
                fontWeight: 500,
              }}
            >
              price.
            </em>
          </h1>
          <p className="mt-4 max-w-[48ch] text-[15px] leading-snug text-ink-2">
            Browse markets and tokens, take a position right from a post, and
            build a verifiable track record.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 max-w-[460px]">
            <FeatureCard
              title="Trade any take"
              sub="Attach a prediction market or a Solana token to any post — readers buy or sell in one tap."
              icon={<MarketIcon />}
            />
            <FeatureCard
              title="Build a track record"
              sub="Closed positions feed your accuracy rating. Better record, more reach."
              icon={<SparkIcon />}
            />
            <FeatureCard
              title="Communities"
              sub="Channels for the people you actually want to argue with."
              icon={<CommIcon />}
            />
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-[11px] font-mono text-ink-3">
          <span>Waitlist invite-only</span>
          <span className="w-1 h-1 rounded-full bg-ink-4" />
          <span>v0.4 beta</span>
        </div>
      </aside>

      {/* ─── Right panel: auth card (desktop) / full screen (mobile) ─── */}
      <section
        className="
          relative flex items-center justify-center
          px-6 py-10 sm:px-8
          min-h-screen
        "
        style={{
          background:
            'linear-gradient(180deg, #0c0a16 0%, #08070d 100%)',
        }}
      >
        <div className="w-full max-w-[440px]">
          {/* Mobile-only top brand block (the left panel is hidden) */}
          <div className="lg:hidden mb-6 flex flex-col items-center text-center">
            <div className="flex items-center gap-2.5">
              <img
                src="/webui/backspace-icon.png"
                alt=""
                className="w-9 h-9 rounded-lg"
              />
              <span className="text-[20px] font-bold tracking-[-0.01em] text-ink">
                backspace
              </span>
            </div>
            <h1 className="mt-5 text-[32px] font-bold leading-tight tracking-[-0.02em] text-ink">
              Every opinion has a{' '}
              <em
                className="not-italic"
                style={{
                  background: 'linear-gradient(135deg, #7B4CFF 0%, #FF8800 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontStyle: 'italic',
                  fontWeight: 500,
                }}
              >
                price.
              </em>
            </h1>
            <p className="mt-2 text-[14px] text-ink-2 max-w-[34ch]">
              Sign in to claim your handle and take a position from any post.
            </p>
          </div>

          <div className="hidden lg:block">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-line text-[11px] font-mono text-ink-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-vivid shadow-[0_0_0_3px_rgba(14,173,105,0.2)]" />
              Waitlist beta · Summer 2026
            </span>
            <h2 className="mt-4 text-[34px] font-bold leading-tight tracking-[-0.02em] text-ink">
              Sign in to{' '}
              <em
                className="not-italic"
                style={{
                  background: 'linear-gradient(135deg, #7B4CFF 0%, #FF8800 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontStyle: 'italic',
                  fontWeight: 500,
                }}
              >
                Backspace.
              </em>
            </h2>
            <p className="mt-2 text-[14px] text-ink-2">
              Browse markets and tokens, take a position right from a post,
              and build a verifiable track record.
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-[10px] font-mono uppercase tracking-[0.08em] text-ink-3 mb-1.5">
              Email
            </label>
            <div className="relative flex items-center h-[52px] rounded-[12px] bg-surface border border-line focus-within:border-brand-2 focus-within:shadow-[0_0_0_4px_rgba(88,34,251,0.18)] transition">
              <span className="absolute left-3.5 text-ink-3"><MailIcon /></span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                type="email"
                className="
                  flex-1 h-full pl-11 pr-2 bg-transparent text-[15px] text-ink
                  placeholder:text-ink-3 outline-none font-display
                "
              />
              <button
                type="button"
                onClick={start}
                disabled={!ready || authenticated}
                className="
                  mr-1.5 h-[42px] px-4 rounded-[9px]
                  bg-brand hover:bg-brand-2
                  text-ink text-[13px] font-semibold inline-flex items-center gap-1.5
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-150
                "
              >
                Continue <ArrowIcon />
              </button>
            </div>
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="flex-1 h-px bg-line" />
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3">
              or continue with
            </span>
            <span className="flex-1 h-px bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <SocialButton
              onClick={start}
              disabled={!ready || authenticated}
              icon={<GoogleMark />}
              label="Google"
              sub="Most used"
            />
            <SocialButton
              onClick={start}
              disabled={!ready || authenticated}
              icon={<AppleMark />}
              label="Apple"
              sub="iOS / macOS"
            />
          </div>

          <button
            type="button"
            onClick={start}
            disabled={!ready || authenticated}
            className="
              mt-2.5 w-full h-[52px] px-4 rounded-[12px]
              bg-surface border border-line hover:border-brand-2 hover:bg-surface-2
              flex items-center gap-3 text-left
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
            "
          >
            <span className="text-brand-2"><WalletIcon /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-semibold text-ink">Connect wallet</span>
              <span className="block text-[11px] font-mono text-ink-3 mt-0.5 tracking-[0.04em] truncate">
                MetaMask · Phantom · Coinbase · 100+
              </span>
            </span>
            <span className="text-[9.5px] font-mono uppercase tracking-[0.12em] font-semibold text-green-2 bg-green-vivid/12 border border-green-vivid/30 px-2 py-1 rounded">
              Recommended
            </span>
          </button>

          <p className="mt-5 text-[11.5px] text-ink-3 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#tos" className="text-ink-2 underline hover:text-ink">Terms</a>
            {' '}and{' '}
            <a href="#priv" className="text-ink-2 underline hover:text-ink">Privacy Policy</a>.
            <br />New here? Your account is created automatically.
          </p>

          <div className="mt-4 flex items-center gap-1.5 text-[10.5px] font-mono text-ink-4">
            <LockIcon />
            Secured by <b className="text-ink-3">privy</b>
            <span className="w-1 h-1 rounded-full bg-ink-4" />
            Self-custodial
          </div>
        </div>
      </section>
    </div>
  );
};

// Replaces the legacy AuthLayout entirely — bare passthrough so the
// Login page owns the full chrome. (The Navigation router in
// _app.tsx detects onAuth routes and skips the desktop shell, so
// the login lands with no LeftNav/RightRail.)
const BareLayout: React.FC = ({ children }) => <>{children}</>;
(Login as any).Layout = BareLayout;
// Kept import to preserve route compatibility — if Layout is ever
// re-required we can switch back without touching imports.
void AuthLayout;

export default Login;

// ─── pieces ───────────────────────────────────────────────────────

function FeatureCard({
  icon, title, sub,
}: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div
      className="
        flex items-start gap-3 px-4 py-3.5 rounded-[12px]
        border border-line bg-surface/50 backdrop-blur-md
      "
    >
      <span className="flex-none w-[34px] h-[34px] rounded-[8px] bg-brand-soft text-brand-2 flex items-center justify-center">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-ink">{title}</div>
        <div className="text-[12px] text-ink-3 mt-0.5 leading-snug">{sub}</div>
      </div>
    </div>
  );
}

function SocialButton({
  icon, label, sub, onClick, disabled,
}: {
  icon: React.ReactNode; label: string; sub: string;
  onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        h-[52px] px-3 rounded-[12px]
        bg-surface border border-line hover:border-line-2 hover:bg-surface-2
        flex items-center gap-2.5 text-left
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-150
      "
    >
      <span className="flex-none flex items-center justify-center w-[24px] h-[24px]">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-semibold text-ink truncate">{label}</span>
        <span className="block text-[10.5px] font-mono text-ink-3 mt-0.5 tracking-[0.04em] truncate">
          {sub}
        </span>
      </span>
    </button>
  );
}

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
);
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
);
const WalletIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 010-4h13" /><circle cx="17" cy="13" r="1.4" fill="currentColor" /></svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
);
const MarketIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>
);
const CommIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3" /><circle cx="17" cy="11" r="2.5" /><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" /><path d="M14 18c0-2 2-3 3-3s3 1 3 3" /></svg>
);
const SparkIcon = ({ small }: { small?: boolean }) => (
  <svg viewBox="0 0 24 24" width={small ? 14 : 18} height={small ? 14 : 18} fill="currentColor"><path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z" /></svg>
);
const GoogleMark = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22 12.2c0-.7-.06-1.4-.18-2H12v3.9h5.6c-.24 1.3-.97 2.4-2.07 3.13v2.6h3.35C20.9 18.1 22 15.4 22 12.2z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.35-2.6c-.93.62-2.12.98-3.27.98-2.51 0-4.64-1.7-5.4-3.97H3.13v2.5C4.77 19.74 8.13 22 12 22z" />
    <path fill="#FBBC04" d="M6.6 13.98a6 6 0 010-3.96V7.52H3.13a10 10 0 000 8.96l3.47-2.5z" />
    <path fill="#EA4335" d="M12 6.05c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.97 3.1 14.7 2 12 2 8.13 2 4.77 4.26 3.13 7.52l3.47 2.5C7.36 7.75 9.49 6.05 12 6.05z" />
  </svg>
);
const AppleMark = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
    <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 2.9 2.4 1.2 0 1.6-.8 3-.8s1.8.8 3.1.8c1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.5-.9-2.5-3.7zM14.3 5.8c.6-.8 1-1.9.9-3-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.3-.6 2.9-1.3z" />
  </svg>
);
