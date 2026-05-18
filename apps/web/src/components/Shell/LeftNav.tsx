// Left navigation (280px) — desktop only. Replaces the legacy
// horizontal NavigationBar inside the new DesktopShell layout.
// Mobile still uses MobileNavigation + AccountDrawer; this component
// is hidden below the `sm` breakpoint by its parent.
//
// Wiring notes:
// - Active state derived from router.pathname so any in-app nav
//   (Link, router.push) keeps the highlight in sync.
// - Post button dispatches togglePostModal — same global modal the
//   legacy NavButtons + AccountDrawer fire.

import React from 'react';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { APP } from 'pages';
import { togglePostModal } from 'store/appSlice';

import { ShellIcons as I } from './icons';

type NavKey =
  | 'home' | 'markets' | 'communities' | 'notifications'
  | 'messages' | 'bookmarks' | 'portfolio';

type Item = {
  key: NavKey;
  label: string;
  icon: (p: { className?: string }) => JSX.Element;
  href: string | null;
  badge?: string;
  disabled?: boolean;
};

function deriveActive(pathname: string): NavKey {
  if (pathname === APP.INDEX) return 'home';
  if (pathname.startsWith(APP.DISCOVER.INDEX)) return 'markets';
  if (pathname.startsWith(APP.COMMUNITY.INDEX)) return 'communities';
  if (pathname.startsWith(APP.MESSAGES.INDEX)) return 'messages';
  if (pathname.startsWith(APP.PORTFOLIO.INDEX)) return 'portfolio';
  return 'home';
}

const LeftNav: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const active = deriveActive(router.pathname);

  // Communities / Notifications / Bookmarks / More don't have shipping
  // routes yet — they render but go to '#' (no-op) so the visual
  // matches the design without dead 404s. Easy to wire as routes ship.
  const items: Item[] = [
    { key: 'home', label: 'Home', icon: I.home, href: APP.INDEX },
    { key: 'markets', label: 'Markets', icon: I.markets, href: APP.DISCOVER.INDEX, badge: 'LIVE' },
    { key: 'communities', label: 'Communities', icon: I.comm, href: APP.COMMUNITY.INDEX },
    { key: 'notifications', label: 'Notifications', icon: I.bell, href: null, disabled: true },
    { key: 'messages', label: 'Messages', icon: I.mail, href: APP.MESSAGES.INDEX },
    { key: 'bookmarks', label: 'Bookmarks', icon: I.bookmark, href: null, disabled: true },
    { key: 'portfolio', label: 'Portfolio', icon: I.bag, href: APP.PORTFOLIO.INDEX },
  ];

  return (
    <aside
      className="
        sticky top-0 h-screen overflow-y-auto
        border-r border-line bg-canvas
        flex flex-col gap-1.5
        px-4 py-4
        font-display
      "
    >
      <Link href={APP.INDEX}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-2 cursor-pointer">
          <img
            src="/webui/backspace-icon.png"
            alt=""
            className="w-[30px] h-[30px] rounded-[7px]"
          />
          <span className="font-bold text-[18px] tracking-[-0.01em] text-ink">
            backspace
          </span>
        </div>
      </Link>

      {items.map((it) => (
        <NavItem
          key={it.key}
          icon={it.icon}
          label={it.label}
          href={it.href}
          badge={it.badge}
          active={active === it.key}
          disabled={it.disabled}
        />
      ))}

      <button
        type="button"
        onClick={() => dispatch(togglePostModal(true))}
        className="
          mt-2.5 h-[46px] rounded-full
          bg-brand hover:bg-brand-2
          text-ink text-[15px] font-semibold tracking-[-0.005em]
          flex items-center justify-center gap-2
          transition-colors duration-150
          shadow-[0_12px_30px_-8px_rgba(88,34,251,0.6)]
        "
      >
        <I.plus className="w-4 h-4" />
        Post
      </button>

      <div className="flex-1" />
    </aside>
  );
};

function NavItem({
  icon: Icon,
  label,
  href,
  badge,
  active,
  disabled,
}: {
  icon: (p: { className?: string }) => JSX.Element;
  label: string;
  href: string | null;
  badge?: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const body = (
    <div
      className={[
        'flex items-center gap-3.5 px-3 py-2.5 rounded-[10px]',
        'text-[14.5px] font-medium tracking-[-0.005em]',
        'transition-colors duration-150 cursor-pointer',
        active
          ? 'bg-brand-soft text-ink font-semibold'
          : 'text-ink-2 hover:bg-hover hover:text-ink',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <span
        className={[
          'w-[22px] h-[22px] flex items-center justify-center flex-none',
          active ? 'text-brand-2' : 'text-ink-2',
        ].join(' ')}
      >
        <Icon className="w-[22px] h-[22px]" />
      </span>
      <span>{label}</span>
      {badge && (
        <span
          className="
            ml-auto text-[11px] font-mono tracking-[0.04em]
            bg-brand text-ink px-1.5 py-0.5 rounded-full
          "
        >
          {badge}
        </span>
      )}
    </div>
  );

  if (!href || disabled) return body;
  return <Link href={href}>{body}</Link>;
}

export default LeftNav;
