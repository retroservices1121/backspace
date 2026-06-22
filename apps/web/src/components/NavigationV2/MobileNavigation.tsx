// Mobile top chrome (< sm). Translated from the Backspace_Mobile_App
// design prototype, same way DesktopShell came from /webui. Uses the
// monoline ShellIcons + Tailwind tokens so the mobile language matches
// the desktop shell.
//
// Two stacked bands inside one sticky header:
//   1. App bar  — brand (→ home) · search toggle · avatar (→ AccountDrawer)
//   2. Sub-tabs — feed filters (For you / Following / …), home route only
//
// The sub-tabs drive the SAME redux feed filter the desktop TopTabs use
// (via useFeed), so switching tabs on mobile and desktop stays in sync.
// Notifications aren't wired to a backend yet, so there's no bell here
// (the LeftNav notifications item is likewise disabled) — add it when a
// real unread signal ships, rather than faking a dot.

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/router';

import useUser from '@src/hooks/useUser';
import { useFeed } from '@src/hooks/useFeed';
import { FilterOptions } from '@src/store/feedSlice';

import { ShellIcons as I } from 'components/Shell/icons';
import { APP } from 'pages';
import { toggleAccountDrawer } from 'store/appSlice';

import UserSearch from '../Search/UserSearch';

type NavProps = {
  onAuth: boolean;
};

// Feed filter → label. Order mirrors Feed.tsx so the mobile strip and
// the desktop TopTabs read the same left-to-right.
const FEED_TABS: Array<{ key: FilterOptions; label: string }> = [
  { key: FilterOptions.ACCURACY, label: 'For you' },
  { key: FilterOptions.DISCOVER, label: 'Discover' },
  { key: FilterOptions.FOLLOWING, label: 'Following' },
  { key: FilterOptions.COMMUNITY, label: 'Communities' },
  { key: FilterOptions.MARKETS, label: 'Markets' },
  { key: FilterOptions.TOKENS, label: 'Tokens' },
];

export default function MobileNavigation({ onAuth }: NavProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, avatar } = useUser();
  const { filter, setFilter } = useFeed();
  const [isShowingSearch, setIsShowingSearch] = useState(false);

  // Only the home feed owns the filter sub-tabs — other routes
  // (markets, profile, …) bring their own headers.
  const onHome = router.pathname === APP.INDEX;

  return (
    <header
      className={[
        'sm:hidden z-[55]',
        // Pin only on Home, where this is the sole header and carries
        // the feed sub-tabs. On other routes it scrolls away so each
        // page's own sticky header (Portfolio, Markets, …) pins to the
        // top instead of colliding with this bar.
        onHome ? 'sticky top-0' : '',
        'bg-canvas/[0.85] backdrop-blur-[14px] backdrop-saturate-[160%]',
        'border-b border-line',
        'font-display text-ink',
      ].join(' ')}
    >
      {/* App bar */}
      <div className="flex items-center gap-3 px-4 h-14">
        {onAuth ? (
          // Auth routes render bare chrome — just the centered brand.
          <div className="flex-1 flex justify-center">
            <img src="/webui/backspace-icon.png" alt="" className="w-7 h-7 rounded-[7px]" />
          </div>
        ) : isShowingSearch ? (
          <div className="flex-1">
            <UserSearch
              callback={(searchUser) => {
                setIsShowingSearch(false);
                router.push(`/${searchUser.username}`);
              }}
              callbackText="Go To"
            />
          </div>
        ) : (
          <>
            {/* Brand */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push(APP.INDEX)}
            >
              <img
                src="/webui/backspace-icon.png"
                alt=""
                className="w-7 h-7 rounded-[7px]"
              />
              <span className="font-bold text-[16px] tracking-[-0.01em]">
                backspace
              </span>
            </div>

            <div className="flex-1" />

            {/* Search toggle */}
            <button
              type="button"
              aria-label="Search"
              onClick={() => setIsShowingSearch(true)}
              className="
                w-9 h-9 rounded-full flex items-center justify-center
                text-ink-2 hover:bg-hover hover:text-ink
                transition-colors duration-150
              "
            >
              <I.search className="w-[18px] h-[18px]" />
            </button>

            {/* Avatar → universal account drawer (X pattern). Falls
                back to the brand gradient while the avatar resolves. */}
            <button
              type="button"
              aria-label="Account menu"
              onClick={() => dispatch(toggleAccountDrawer())}
              className="w-8 h-8 rounded-full overflow-hidden flex-none ring-1 ring-line-2"
            >
              {avatar ? (
                <img src={avatar} alt="me" className="w-full h-full object-cover" />
              ) : (
                <span
                  className="block w-full h-full"
                  style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
                />
              )}
            </button>
          </>
        )}
      </div>

      {/* Sub-tabs — home route only, horizontally scrollable so the
          full filter set fits any phone width. */}
      {onHome && !isShowingSearch && (
        <nav
          className="flex items-stretch overflow-x-auto border-t border-line"
          style={{ scrollbarWidth: 'none' }}
        >
          {FEED_TABS.map((t) => {
            const active = filter === t.key;
            return (
              <button
                type="button"
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={[
                  'relative flex-none px-4 py-3 text-[13px] tracking-[-0.005em] whitespace-nowrap',
                  'transition-colors duration-150',
                  active ? 'text-ink font-semibold' : 'text-ink-3 font-medium',
                ].join(' ')}
              >
                {t.label}
                {active && (
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-[3px] rounded-t-full bg-brand-2" />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
