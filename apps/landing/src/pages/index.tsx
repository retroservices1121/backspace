import { useEffect, useMemo, useRef, useState } from 'react';
import {
  REJECTION_COPY,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  normalizeUsername,
  validateUsernameFormat,
} from '@backspace/usernames';

type CheckResponse =
  | { available: true; normalized: string }
  | { available: false; reason: string; message: string };

type SubmitResponse =
  | { ok: true; referralCode: string; alreadyOnList: boolean }
  | { ok: false; error: string; field?: 'email' | 'username' };

type Status = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';

export default function Home() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    referralCode: string;
    alreadyOnList: boolean;
  } | null>(null);
  const checkAbort = useRef<AbortController | null>(null);

  // Local format check, runs on every keystroke. Cheap, no network.
  const formatCheck = useMemo(
    () => (username ? validateUsernameFormat(username) : null),
    [username],
  );

  // Debounced availability check against /api/username/check. Only runs
  // after a valid local format check passes; otherwise the local error
  // takes priority and we save a roundtrip.
  useEffect(() => {
    if (!username) {
      setStatus('idle');
      setStatusMessage('');
      return;
    }
    if (formatCheck && !formatCheck.ok) {
      setStatus('invalid');
      setStatusMessage(REJECTION_COPY[formatCheck.reason]);
      return;
    }
    setStatus('checking');
    setStatusMessage('Checking…');
    checkAbort.current?.abort();
    const ctrl = new AbortController();
    checkAbort.current = ctrl;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/username/check?u=${encodeURIComponent(username)}`,
          { signal: ctrl.signal },
        );
        const json = (await res.json()) as CheckResponse;
        if (ctrl.signal.aborted) return;
        if (json.available) {
          setStatus('available');
          setStatusMessage(`@${json.normalized} is yours.`);
        } else {
          setStatus('unavailable');
          setStatusMessage(json.message);
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setStatus('idle');
        setStatusMessage('');
      }
    }, 300);
    return () => {
      clearTimeout(handle);
      ctrl.abort();
    };
  }, [username, formatCheck]);

  const canSubmit =
    email.includes('@') &&
    !submitting &&
    (status === 'available' || status === 'idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          username: username ? normalizeUsername(username) : undefined,
        }),
      });
      const json = (await res.json()) as SubmitResponse;
      if (json.ok) {
        setSuccess({
          referralCode: json.referralCode,
          alreadyOnList: json.alreadyOnList,
        });
      } else {
        setError(json.error);
      }
    } catch {
      setError('Network error. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const referralUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/?r=${success.referralCode}`
        : '';
    return (
      <main>
        <div className="shell">
          <div className="brand">Backspace</div>
          <div className="success">
            <h2>
              {success.alreadyOnList ? "You're already in." : "You're in."}
            </h2>
            <p>
              We'll email you at <strong>{email}</strong> when it's your turn.
              {username && ` Your handle @${normalizeUsername(username)} is held for you.`}
            </p>
            <label htmlFor="referral">Share your link to skip the line</label>
            <div className="referral">
              <input id="referral" type="text" value={referralUrl} readOnly />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(referralUrl);
                }}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="shell">
        <div className="brand">Backspace</div>
        <h1>
          The <em>prediction-market</em> social layer.
        </h1>
        <p className="tagline">
          A feed ranked by who's been right, not who's been loud. Tradeable
          posts. Communities that move with the markets. Reserve your handle
          before launch.
        </p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <div className="input-wrap">
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@somewhere.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="username">
              Username (optional — but first come, first served)
            </label>
            <div className="input-wrap">
              <span className="input-prefix">@</span>
              <input
                id="username"
                className="has-prefix"
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="yourname"
                minLength={USERNAME_MIN_LENGTH}
                maxLength={USERNAME_MAX_LENGTH}
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/\s+/g, ''))
                }
                disabled={submitting}
              />
            </div>
            <div
              className={
                'field-feedback ' +
                (status === 'available'
                  ? 'good'
                  : status === 'unavailable' || status === 'invalid'
                  ? 'bad'
                  : 'muted')
              }
            >
              {statusMessage}
            </div>
          </div>

          <button type="submit" disabled={!canSubmit}>
            {submitting ? 'Reserving…' : 'Join the waitlist'}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </form>

        <p className="footer">
          By joining you agree to be emailed when launch is near. No spam, no
          resale.
        </p>
      </div>
    </main>
  );
}
