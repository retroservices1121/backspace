import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  REJECTION_COPY,
  normalizeUsername,
  validateUsernameFormat,
} from '@backspace/usernames';

// ─────────────────────────────────────────────────────────────────────
// State shape persisted in localStorage so a refresh keeps the user in
// the success state without us needing a session cookie on the
// marketing surface.
const STORAGE_KEY = 'bs_waitlist_v1';

type SignupState = {
  handle: string;
  email: string;
  interests: string[];
  position: number;
  total: number;
  referralCode: string;
  referrals: number;
  createdAt: number;
};

function loadState(): SignupState | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
  } catch {
    return null;
  }
}

function saveState(s: SignupState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ─────────────────────────────────────────────────────────────────────
// API response shapes.
type CheckResponse =
  | { available: true; normalized: string }
  | { available: false; reason: string; message: string };

type SubmitResponse =
  | {
      ok: true;
      referralCode: string;
      alreadyOnList: boolean;
      position: number;
      total: number;
    }
  | { ok: false; error: string; field?: 'email' | 'username' };

// ─────────────────────────────────────────────────────────────────────
// Email validator. The same shape-check the prototype used.
function validateEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((e ?? '').trim());
}

// ─────────────────────────────────────────────────────────────────────
// Icons. Inline SVG, kept tiny.
const Ic = {
  arrow: () => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
  check: () => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  ),
  trend: () => (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  ),
  coins: () => (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="10" r="6" />
      <path d="M14 4.6a6 6 0 110 10.8M3 19a8 8 0 0010 0M11 19a8 8 0 0010 0M11 9v0M3 13v6M11 13v6M21 9v6" />
    </svg>
  ),
  spark: () => (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  ),
  bolt: () => (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  ),
  lock: () => (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  ),
  xLogo: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2H21.5l-7.45 8.51L23 22h-6.59l-5.16-6.74L5.4 22H2.14l7.97-9.1L1.6 2h6.74l4.66 6.16L18.244 2zm-1.15 18h1.83L7.02 3.9H5.06l12.034 16.1z" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="brand-mark">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/backspace-icon.png" alt="" />
      <span className="wm">backspace</span>
    </div>
  );
}

function Dots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'currentColor',
          animation: 'blink 1s infinite',
        }}
      />
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'currentColor',
          animation: 'blink 1s .15s infinite',
        }}
      />
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'currentColor',
          animation: 'blink 1s .3s infinite',
        }}
      />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hero form. Live availability check is debounced 300ms; submit hits
// POST /api/waitlist and stores the response in localStorage.
function HeroForm({
  onComplete,
  referralCode,
}: {
  onComplete: (s: SignupState) => void;
  referralCode: string | null;
}) {
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<Set<string>>(
    () => new Set(['markets']),
  );
  const [checkState, setCheckState] = useState<
    | { kind: 'empty' }
    | { kind: 'invalid'; msg: string }
    | { kind: 'taken'; msg: string }
    | { kind: 'ok' }
    // Local format passed but the availability endpoint didn't return
    // (network error, 500, etc). We still let the user submit — the
    // server revalidates on POST anyway and returns a clear 409.
    | { kind: 'unknown' }
  >({ kind: 'empty' });
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailErr, setEmailErr] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const checkAbort = useRef<AbortController | null>(null);

  // Local format check first — if format is bad we don't bother hitting
  // the API. This mirrors the prototype's behavior, but using the
  // shared @backspace/usernames validator so the rules match server.
  const formatCheck = useMemo(
    () => (handle ? validateUsernameFormat(handle) : null),
    [handle],
  );

  useEffect(() => {
    if (!handle) {
      setCheckState({ kind: 'empty' });
      setChecking(false);
      return;
    }
    if (formatCheck && !formatCheck.ok) {
      const msg = REJECTION_COPY[formatCheck.reason];
      // Reuse the prototype's two-bucket UI: "invalid" (red, format)
      // vs "taken" (red, reserved/trademarked). We collapse both into
      // 'invalid' since visually it's the same.
      setCheckState({ kind: 'invalid', msg });
      setChecking(false);
      return;
    }
    setChecking(true);
    checkAbort.current?.abort();
    const ctrl = new AbortController();
    checkAbort.current = ctrl;
    const handleId = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/username/check?u=${encodeURIComponent(handle)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) {
          // Endpoint is up but errored — fall back to "unknown" so the
          // user isn't locked out by a server-side hiccup.
          if (!ctrl.signal.aborted) setCheckState({ kind: 'unknown' });
          return;
        }
        const json = (await res.json()) as CheckResponse;
        if (ctrl.signal.aborted) return;
        if (json.available) {
          setCheckState({ kind: 'ok' });
        } else {
          setCheckState({ kind: 'taken', msg: json.message });
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        // Network failure or JSON parse error — treat as unknown so
        // the user can still submit; the server will re-validate.
        setCheckState({ kind: 'unknown' });
      } finally {
        if (!ctrl.signal.aborted) setChecking(false);
      }
    }, 300);
    return () => {
      clearTimeout(handleId);
      ctrl.abort();
    };
  }, [handle, formatCheck]);

  // Submit gate: local format must pass, email must be valid, and we
  // must not have an *explicit* "taken/invalid" verdict from the API.
  // A still-pending check or a failed check doesn't block — the server
  // is the final arbiter on POST and will 409 if needed.
  const localFormatOk = formatCheck?.ok === true;
  const explicitlyBad =
    checkState.kind === 'taken' || checkState.kind === 'invalid';
  const emailValid = validateEmail(email);
  const canSubmit = localFormatOk && !explicitlyBad && emailValid && !submitting;

  function toggleInterest(k: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!emailValid) {
      setEmailErr(true);
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          username: normalizeUsername(handle),
          interests: [...interests],
          // Server normalises this; we just forward whatever the URL
          // carried so the inviter gets credited on submit.
          r: referralCode ?? undefined,
        }),
      });
      const json = (await res.json()) as SubmitResponse;
      if (!json.ok) {
        setSubmitError(json.error);
        if (json.field === 'username') {
          setCheckState({ kind: 'taken', msg: json.error });
        }
        return;
      }
      const state: SignupState = {
        handle: normalizeUsername(handle),
        email: email.trim(),
        interests: [...interests],
        position: json.position,
        total: json.total,
        referralCode: json.referralCode,
        referrals: 0,
        createdAt: Date.now(),
      };
      saveState(state);
      onComplete(state);
    } catch {
      setSubmitError('Network error. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleStatusEl = (() => {
    if (!handle) return null;
    if (checkState.kind === 'invalid')
      return (
        <span className="status bad">
          <span className="sdot" />
          {checkState.msg}
        </span>
      );
    if (checking)
      return (
        <span className="status checking">
          <span className="sdot" />
          checking…
        </span>
      );
    if (checkState.kind === 'taken')
      return (
        <span className="status bad">
          <span className="sdot" />
          {checkState.msg}
        </span>
      );
    if (checkState.kind === 'ok')
      return (
        <span className="status ok">
          <span className="sdot" />
          available
        </span>
      );
    if (checkState.kind === 'unknown')
      return (
        <span className="status checking">
          <span className="sdot" />
          format ok
        </span>
      );
    return null;
  })();

  type InterestChipProps = {
    k: string;
    label: string;
    icon: React.ReactNode;
  };
  const InterestChip = ({ k, label, icon }: InterestChipProps) => (
    <span
      className={'chip' + (interests.has(k) ? ' on' : '')}
      onClick={() => toggleInterest(k)}
    >
      <span className="ce">{icon}</span>
      {label}
    </span>
  );

  return (
    <form className="card fade d2" onSubmit={submit}>
      <div className="card-head">
        <div className="lh">
          <span className="live-dot" />
          Reserve your handle
        </div>
        <div className="card-counter">Closed beta · Summer 2026</div>
      </div>

      <div className="field-row">
        <label
          className={
            'field' +
            (checkState.kind === 'invalid' || checkState.kind === 'taken'
              ? ' has-err'
              : '')
          }
        >
          <span className="lead">@</span>
          <input
            value={handle}
            onChange={(e) =>
              setHandle(e.target.value.replace(/\s/g, '').slice(0, 20))
            }
            placeholder="your_handle"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="trail">{handleStatusEl}</div>
        </label>

        <label
          className={
            'field' + (emailErr && !emailValid ? ' has-err' : '')
          }
        >
          <span className="lead" style={{ opacity: 0.6 }}>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailErr) setEmailErr(false);
            }}
            placeholder="you@email.com"
            autoComplete="email"
          />
          <div className="trail">
            {email &&
              (emailValid ? (
                <span className="status ok">
                  <span className="sdot" />
                  valid
                </span>
              ) : emailErr ? (
                <span className="status bad">
                  <span className="sdot" />
                  check format
                </span>
              ) : null)}
          </div>
        </label>
      </div>

      <div className="interests-label">What are you here for?</div>
      <div className="chips">
        <InterestChip k="markets" label="Prediction markets" icon={Ic.trend()} />
        <InterestChip k="crypto" label="Crypto" icon={Ic.coins()} />
        <InterestChip k="community" label="Communities" icon={Ic.spark()} />
        <InterestChip k="trading" label="Trading" icon={Ic.bolt()} />
      </div>

      <button className="submit" disabled={!canSubmit} type="submit">
        {submitting ? (
          <>
            Securing handle
            <span style={{ display: 'inline-flex', marginLeft: 4 }}>
              <Dots />
            </span>
          </>
        ) : (
          <>
            Reserve @{handle || 'handle'}{' '}
            <span className="arrow">{Ic.arrow()}</span>
          </>
        )}
      </button>

      {submitError ? (
        <div
          className="help"
          style={{ color: '#ff7a8c' }}
          role="alert"
        >
          {submitError}
        </div>
      ) : (
        <div className="help">
          <Ic.lock /> &nbsp;Your handle is held for 30 days after launch.{' '}
          <b>No spam, ever.</b>
        </div>
      )}
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────
function SuccessCard({
  state,
  onReserveAnother,
}: {
  state: SignupState;
  onReserveAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('backspacethat.com');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOrigin(window.location.host || 'backspacethat.com');
  }, []);

  const refUrl = `${origin}/r/${state.referralCode}`;

  const copy = () => {
    navigator.clipboard?.writeText('https://' + refUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="card fade">
      <div className="success-wrap">
        <div className="success-head fade d1">
          <div className="check">{Ic.check()}</div>
          <div>
            <h3>You&apos;re on the list.</h3>
            <p>
              Welcome, @{state.handle}. We sent a confirmation to{' '}
              {state.email}.
            </p>
          </div>
        </div>

        <div className="handle-card fade d2">
          <div className="hl">
            <div>
              <div className="ha">handle secured</div>
              <div className="hb">@{state.handle}</div>
            </div>
          </div>
          <div className="ht">
            <Ic.lock /> Reserved
          </div>
        </div>

        <div className="ladder fade d3">
          <div className="stat">
            <div className="sl">Your position</div>
            <div className="sv">
              #{state.position.toLocaleString()}{' '}
              <small>/ {state.total.toLocaleString()}</small>
            </div>
          </div>
          <div className="stat">
            <div className="sl">Referrals</div>
            <div className="sv">
              {state.referrals} <small>invites used</small>
            </div>
          </div>
        </div>

        <div className="fade d4">
          <div className="interests-label" style={{ marginBottom: 4 }}>
            Skip the line — share your link
          </div>
          <div className="share-row">
            <span className="url">{refUrl}</span>
            <button
              type="button"
              onClick={copy}
              className={copied ? 'copied' : ''}
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        <div className="climb fade d5">
          <span>
            Each referral moves you <b>~150 spots</b> up.
          </span>
          <span
            className="mb"
            onClick={onReserveAnother}
            role="button"
            tabIndex={0}
          >
            Reserve another handle
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Network background — floating market/topic nodes + animated bezier
// connections. Ported verbatim from the prototype.
function NetworkBackdrop() {
  const nodes = [
    {
      x: '14%',
      y: '22%',
      w: 160,
      h: 108,
      label: 'BTC/USD',
      image: '/assets/thumbnails/btcusd.png',
      anim: 0,
    },
    {
      x: '46%',
      y: '8%',
      w: 140,
      h: 140,
      label: 'Geopolitics',
      image: '/assets/thumbnails/geopolitics.png',
      anim: 1,
    },
    {
      x: '80%',
      y: '18%',
      w: 140,
      h: 160,
      label: 'Tech',
      image: '/assets/thumbnails/tech.png',
      anim: 2,
    },
    {
      x: '8%',
      y: '56%',
      w: 130,
      h: 170,
      label: 'Fed',
      image: '/assets/thumbnails/fed.png',
      anim: 3,
    },
    {
      x: '74%',
      y: '48%',
      w: 120,
      h: 150,
      label: 'AI',
      image: '/assets/thumbnails/ai.png',
      anim: 4,
    },
    {
      x: '18%',
      y: '82%',
      w: 150,
      h: 118,
      label: 'Defense',
      image: '/assets/thumbnails/defense.png',
      anim: 5,
    },
    {
      x: '52%',
      y: '88%',
      w: 120,
      h: 100,
      label: 'Energy',
      image: '/assets/thumbnails/energy.png',
      anim: 1,
    },
    {
      x: '82%',
      y: '78%',
      w: 150,
      h: 130,
      label: 'Politics',
      image: '/assets/thumbnails/politics.png',
      anim: 2,
    },
    {
      x: '36%',
      y: '66%',
      w: 110,
      h: 96,
      label: 'Culture',
      image: '/assets/thumbnails/culture.png',
      anim: 0,
    },
  ];

  const tags: Array<{
    x: string;
    y: string;
    kind: 'up' | 'down' | 'cat';
    text: string;
    pct?: string;
  }> = [
    { x: '5%', y: '46%', kind: 'down', text: '-25bp' },
    { x: '25%', y: '34%', kind: 'up', text: 'Up', pct: '85%' },
    { x: '68%', y: '30%', kind: 'up', text: 'Yes', pct: '52%' },
    { x: '90%', y: '38%', kind: 'cat', text: 'Crypto' },
    { x: '42%', y: '24%', kind: 'cat', text: 'Macro' },
    { x: '78%', y: '66%', kind: 'cat', text: 'Culture' },
    { x: '14%', y: '72%', kind: 'cat', text: 'Politics' },
    { x: '42%', y: '78%', kind: 'down', text: 'No', pct: '48%' },
    { x: '72%', y: '90%', kind: 'down', text: 'Down', pct: '15%' },
    { x: '58%', y: '58%', kind: 'cat', text: 'AI' },
  ];

  const paths = [
    'M 5,30 C 18,34 24,18 36,22 S 60,18 72,18 88,28 96,30',
    'M 4,60 C 16,70 28,60 42,72 S 64,70 78,62 92,68 98,62',
    'M 12,86 C 28,80 40,92 56,86 S 78,92 92,82',
    'M 50,8 C 50,30 36,50 50,68 S 64,84 50,96',
  ];

  return (
    <div className="net">
      <svg
        className="lines"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            style={{
              strokeDasharray: i % 2 ? '2 6' : '0',
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </svg>

      {nodes.map((n, i) => (
        <div
          key={i}
          className="node"
          style={{
            left: n.x,
            top: n.y,
            width: n.w,
            height: n.h,
            animationDelay: `${n.anim * 1.1}s`,
            transform: `rotate(${(i % 2 ? -1 : 1) * (1 + (i % 3))}deg)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={n.image} alt="" loading="lazy" decoding="async" />
          <div className="lbl">{n.label}</div>
        </div>
      ))}

      {tags.map((tg, i) => (
        <span
          key={i}
          className={'tag ' + tg.kind}
          style={{ left: tg.x, top: tg.y }}
        >
          {tg.text}
          {tg.pct && <span className="pct">{tg.pct}</span>}
        </span>
      ))}
    </div>
  );
}

function Background() {
  return (
    <div className="bg-wrap">
      <div className="bg-grid" />
      <NetworkBackdrop />
      <div className="bg-scan" />
      <div className="bg-noise" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<SignupState | null>(null);
  const [liveTotal, setLiveTotal] = useState<number | null>(null);

  // Capture the referral code from either the dynamic path
  // (/r/ABCDEFGH → query.code) or a `?r=ABCDEFGH` querystring on `/`.
  // Normalise to uppercase alphanumeric so it matches the format the
  // server expects, and cap at 16 chars defensively.
  const rawCode = router.query.code ?? router.query.r;
  const referralCode = useMemo(() => {
    const v =
      typeof rawCode === 'string'
        ? rawCode
        : Array.isArray(rawCode)
        ? rawCode[0]
        : null;
    if (!v) return null;
    const norm = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    return norm || null;
  }, [rawCode]);

  // Hydrate localStorage after mount so the server-rendered HTML
  // doesn't mismatch with the client.
  useEffect(() => {
    setState(loadState());
  }, []);

  // Pull the real signup count for the meta line. Edge-cached for 30s
  // so a viral hit doesn't fan out N queries. State stays null until
  // the fetch resolves; the meta line hides until then to avoid a
  // flash of "0 already on the list" before real data lands.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) return;
        const json = (await res.json()) as { total?: number };
        if (cancelled) return;
        if (typeof json.total === 'number') setLiveTotal(json.total);
      } catch {
        // best-effort — leave liveTotal null and just don't render
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // What the meta line should show. After signup, the user's own row
  // is reflected in state.total (returned from POST /api/waitlist).
  // Otherwise use the live fetched count.
  const totalForMeta = state ? state.total : liveTotal;

  return (
    <>
      <Background />

      <div className="topbar fade">
        <Logo />
        <a
          className="sicon"
          href="https://x.com/backspacehq"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Backspace on X"
        >
          {Ic.xLogo()}
        </a>
      </div>

      <main className="hero">
        <div className="pill fade d1">
          <span className="pdot">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
          Closed beta · Summer 2026
        </div>

        <h1 className="title fade d1">
          The new <span className="accent">social</span>{' '}
          <span className="accent">layer</span> for markets.
        </h1>

        <p className="subtitle fade d2">
          Backspace is the feed where every opinion has a price. Post takes,
          run prediction markets on them, and stack reputation across
          crypto-native communities.
        </p>

        {state ? (
          <SuccessCard
            state={state}
            onReserveAnother={() => setState(null)}
          />
        ) : (
          <HeroForm onComplete={setState} referralCode={referralCode} />
        )}

        {totalForMeta !== null && (
          <div className="meta-line fade d3">
            <div className="avatars">
              <span className="av" />
              <span className="av" />
              <span className="av" />
              <span className="av" />
            </div>
            <span>
              {totalForMeta === 0 ? (
                <>Be the first to reserve a handle</>
              ) : (
                <>
                  <b style={{ color: '#fff', fontWeight: 500 }}>
                    {totalForMeta.toLocaleString()}
                  </b>{' '}
                  already on the list
                </>
              )}
            </span>
          </div>
        )}
      </main>

      <div className="ribbon">
        <span>
          <span className="rd" />
          Prediction Markets
        </span>
        <span>
          <span
            className="rd"
            style={{ background: 'var(--accent-orange)' }}
          />
          Onchain Identity
        </span>
        <span>
          <span className="rd" style={{ background: 'var(--accent-blue)' }} />
          Community Feeds
        </span>
        <span>
          <span
            className="rd"
            style={{ background: 'var(--accent-green)' }}
          />
          Reputation Scoring
        </span>
      </div>

      <footer>
        <div>© 2026 Backspace Labs · v0.4.2-beta</div>
      </footer>

      <div className="giant fill" aria-hidden="true">
        backspace
      </div>
    </>
  );
}
