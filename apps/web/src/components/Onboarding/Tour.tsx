// First-run onboarding tour. Spotlights the LeftNav, the composer,
// and the Markets/Tokens entries the moment a fresh user lands on
// the home feed. Persists completion via POST /api/users/me/tour-completed
// so the same user never sees it twice (unless they replay it from
// settings).
//
// Why react-joyride: it ships its own portal + spotlight overlay so
// it doesn't need to know about our DesktopShell layout, and the
// styles props let us match Backspace's purple/ink palette without
// forking the lib.
//
// SSR note: react-joyride touches `document` at import time. The
// hook below dynamic-imports it on mount so Next 12's getStaticProps
// "collect page data" pass never evaluates it.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CallBackProps, Step } from 'react-joyride';
import axios from '@src/lib/axios';

// react-joyride is a default export. We can't `import Joyride` at top
// level because that touches `document` during SSR (Next 12's page-data
// collection step evaluates every module). Load it lazily.
type JoyrideComponent = typeof import('react-joyride').default;

const STORAGE_KEY = 'backspace:onboardingTourCompleted';

// Steps in user-facing order. `data-tour="..."` selectors are added
// to the targeted elements in LeftNav / InlineCompose so the tour
// keeps working even if class names get reshuffled in a redesign.
const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome to Backspace',
    content:
      'The social layer for markets. Post takes, trade real markets, and track your accuracy — all in one feed.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="left-nav"]',
    placement: 'right',
    title: 'Your nav',
    content:
      'Jump between Home, Markets, Tokens, and your Portfolio from here. Your profile chip lives up top.',
  },
  {
    target: '[data-tour="composer"]',
    placement: 'bottom',
    title: 'Post anything',
    content:
      'Drop a take, attach a market, or share a token. The destination dropdown lets you cross-post into a community.',
  },
  {
    target: '[data-tour="nav-markets"]',
    placement: 'right',
    title: 'Markets',
    content:
      'Browse every Polymarket question we track. Buy YES or NO straight from the card once your wallet is enabled.',
  },
  {
    target: '[data-tour="nav-tokens"]',
    placement: 'right',
    title: 'Tokens',
    content:
      'Sortable catalog of Solana tokens. Swap in-feed once you have a funded wallet.',
  },
  {
    target: '[data-tour="post-button"]',
    placement: 'right',
    title: 'Start posting',
    content:
      'When you\'re ready, hit Post to open the full composer. Have fun.',
  },
];

export type OnboardingTourProps = {
  // If undefined we skip — caller decides who sees the tour.
  shouldRun: boolean;
  // Fired when the user finishes or skips. Used by the caller to
  // tear the component down and persist server-side completion.
  onClose: () => void;
};

const Tour: React.FC<OnboardingTourProps> = ({ shouldRun, onClose }) => {
  const [Joyride, setJoyride] = useState<JoyrideComponent | null>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!shouldRun) return;
    let mounted = true;
    import('react-joyride').then((mod) => {
      if (!mounted) return;
      setJoyride(() => mod.default);
      setRun(true);
    });
    return () => {
      mounted = false;
    };
  }, [shouldRun]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      // 'finished' fires on last-step click; 'skipped' fires on the
      // skip button. Either way we lock the flag.
      if (data.status === 'finished' || data.status === 'skipped') {
        setRun(false);
        try {
          localStorage.setItem(STORAGE_KEY, '1');
        } catch {
          /* private mode etc. — server flag still works */
        }
        axios()
          .post('/users/me/tour-completed', { completed: true })
          .catch(() => {
            // Non-fatal — the localStorage flag still hides the
            // tour for the rest of this session.
          });
        onClose();
      }
    },
    [onClose],
  );

  // Brand-styled tooltip: purple accent, ink text, JetBrains Mono for
  // the title to match the rest of the new design system. Avoids the
  // default white/blue Joyride look which screams "third-party widget".
  const styles = useMemo(
    () => ({
      options: {
        zIndex: 10000,
        primaryColor: '#5822FB',
        backgroundColor: '#0F0F12',
        textColor: '#EDEDF3',
        arrowColor: '#0F0F12',
        overlayColor: 'rgba(0,0,0,0.55)',
        spotlightShadow: '0 0 0 4px rgba(88,34,251,0.35)',
      },
      tooltip: {
        borderRadius: 14,
        padding: '20px 22px',
        border: '1px solid rgba(255,255,255,0.08)',
        fontFamily: '"Poppins", system-ui, sans-serif',
      },
      tooltipTitle: {
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: 13,
        letterSpacing: '0.02em',
        textTransform: 'uppercase' as const,
        color: '#FF8800',
        marginBottom: 6,
      },
      tooltipContent: {
        fontSize: 14,
        lineHeight: 1.5,
        padding: 0,
      },
      buttonNext: {
        backgroundColor: '#5822FB',
        borderRadius: 999,
        padding: '8px 18px',
        fontSize: 13,
        fontWeight: 600,
      },
      buttonBack: {
        color: '#9A9AA8',
        fontSize: 13,
        marginRight: 8,
      },
      buttonSkip: {
        color: '#9A9AA8',
        fontSize: 13,
      },
    }),
    [],
  );

  if (!Joyride || !run) return null;

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      disableScrolling
      hideCloseButton
      callback={handleCallback}
      styles={styles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Got it',
        next: 'Next',
        skip: 'Skip',
      }}
    />
  );
};

// Convenience for callers: localStorage gate so a user who finished
// the tour on this device doesn't see it flash before /user/self
// resolves on a cold page load.
export function tourAlreadyDismissedLocally(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

// Replay surface — fired by the "Replay welcome tour" link on
// /settings/account. Clears both the server flag and the local
// gate so the next home-feed mount picks the tour up again.
export async function resetOnboardingTour(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  await axios().post('/users/me/tour-completed', { completed: false });
}

export default Tour;
