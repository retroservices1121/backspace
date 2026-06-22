// Mobile bottom tab bar (< sm). Translated from the
// Backspace_Mobile_App prototype: Home · Markets · center compose FAB ·
// Messages · Profile, with a brand-2 active state. Fixed to the bottom
// of the viewport with safe-area padding for the iOS home indicator.
//
// Tabs: Home · Markets · compose FAB · Portfolio · Profile. Deltas from
// the prototype, by design:
//  - The prototype's 4th slot is "Activity" (notifications). We don't
//    have a notifications backend yet (the LeftNav item is disabled), so
//    the slot is Portfolio instead — your open positions + token buys,
//    the most-used surface for a markets/tokens product. Messages stays
//    reachable in the account drawer (the avatar in the header).
//  - Signed-out users keep the existing AuthButtons (Login / Register)
//    so we don't regress the logged-out entry point.

import React from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';

import useAuthentication from '@src/hooks/useAuthenticate';
import useUser from '@src/hooks/useUser';
import { AuthStatus } from '@src/store/authSlice';

import { APP } from 'pages';
import { togglePostModal } from 'store/appSlice';
import { AuthButtons } from 'components/NavigationV2/AuthButtons';

import { ShellIcons as I } from './icons';

type TabKey = 'home' | 'markets' | 'portfolio' | 'profile';

function activeKey(pathname: string): TabKey | null {
  if (pathname === APP.INDEX) return 'home';
  if (pathname.startsWith(APP.MARKETS.INDEX)) return 'markets';
  if (pathname.startsWith(APP.PORTFOLIO.INDEX)) return 'portfolio';
  return null;
}

const MobileTabBar: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useAuthentication();
  const { user, avatar } = useUser();

  const signedIn = authState === AuthStatus.SignedIn;
  const active = activeKey(router.pathname);
  const profileHref = user?.username ? APP.PROFILE.USERNAME(user.username) : APP.AUTH.LOGIN;
  const profileActive =
    !!user?.username && router.pathname === APP.PROFILE.USERNAME(user.username);

  // Signed-out: preserve the legacy auth entry point.
  if (!signedIn) {
    return (
      <nav
        className="
          sm:hidden fixed inset-x-0 bottom-0 z-[55]
          bg-canvas/[0.92] backdrop-blur-[20px] backdrop-saturate-[180%]
          border-t border-line
          flex items-center justify-center
          px-4 py-3
        "
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <AuthButtons />
      </nav>
    );
  }

  return (
    <nav
      className="
        sm:hidden fixed inset-x-0 bottom-0 z-[55]
        bg-canvas/[0.92] backdrop-blur-[20px] backdrop-saturate-[180%]
        border-t border-line
        flex items-center justify-around gap-1
        px-3 pt-2
        font-display
      "
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <Tab href={APP.INDEX} label="Home" active={active === 'home'} icon={<I.home className="w-[22px] h-[22px]" />} />
      <Tab href={APP.MARKETS.INDEX} label="Markets" active={active === 'markets'} icon={<I.markets className="w-[22px] h-[22px]" />} />

      {/* Center compose FAB — same global modal the desktop LeftNav fires. */}
      <button
        type="button"
        aria-label="Post"
        onClick={() => dispatch(togglePostModal(true))}
        className="
          flex-none w-[54px] h-[54px] -translate-y-3 rounded-full
          bg-brand text-ink flex items-center justify-center
          shadow-[0_8px_24px_-4px_rgba(88,34,251,0.55),inset_0_1px_0_rgba(255,255,255,0.2)]
          active:brightness-110 transition
        "
      >
        <I.plus className="w-6 h-6" />
      </button>

      <Tab href={APP.PORTFOLIO.INDEX} label="Portfolio" active={active === 'portfolio'} icon={<I.bag className="w-[22px] h-[22px]" />} />

      {/* Profile uses the live avatar as its icon. */}
      <Tab
        href={profileHref}
        label="Profile"
        active={profileActive}
        icon={
          avatar ? (
            <img src={avatar} alt="" className="w-[22px] h-[22px] rounded-full object-cover" />
          ) : (
            <I.user className="w-[22px] h-[22px]" />
          )
        }
      />
    </nav>
  );
};

function Tab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <a
        className={[
          'flex-1 flex flex-col items-center gap-0.5 py-1.5 cursor-pointer',
          'transition-colors duration-150',
          active ? 'text-ink' : 'text-ink-3',
        ].join(' ')}
      >
        <span className={active ? 'text-brand-2' : ''}>{icon}</span>
        <span className="text-[10px] font-medium tracking-[0.01em]">{label}</span>
      </a>
    </Link>
  );
}

export default MobileTabBar;
