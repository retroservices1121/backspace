// X-style mobile slide-in account menu. Triggered by the mobile
// hamburger. Shows the current user's profile preview, follower
// counts, then a vertical menu (Profile / Markets / Portfolio /
// Communities / Wallet / Settings / etc.). A theme toggle and Logout
// sit at the bottom.
//
// Uses its own `accountDrawerOpen` flag (not the legacy `drawerOpen`)
// so the page-context drawers (community rooms list, etc.) can stay
// reachable via in-page CTAs without colliding with this menu.

import React from 'react';
import { Transition } from '@headlessui/react';
import {
  BookmarkIcon,
  BriefcaseIcon,
  ChatAlt2Icon,
  CogIcon,
  CreditCardIcon,
  HomeIcon,
  LogoutIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  UserGroupIcon,
  UserIcon,
  XIcon,
} from '@heroicons/react/outline';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import useLogout from 'hooks/useLogout';
import useUser from 'hooks/useUser';
import { APP } from 'pages';
import { toggleAccountDrawer, toggleTheme } from 'store/appSlice';
import { RootState } from 'store/store';
import { Themes } from 'styles/theme';
import { makeShortNumber } from 'utils/common_utils';

import Zindex from 'styles/zindex';

type ItemProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

const Item: React.FC<ItemProps> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-4 px-5 py-3 text-left text-fontFocus hover:bg-backgroundLight transition-colors"
  >
    <span className="text-fontFocus">{icon}</span>
    <span className="text-base">{label}</span>
  </button>
);

const AccountDrawer: React.FC = () => {
  const open = useSelector((s: RootState) => s.app.accountDrawerOpen);
  const theme = useSelector((s: RootState) => s.app.theme);
  const { user, avatar } = useUser();
  const dispatch = useDispatch();
  const router = useRouter();
  const logout = useLogout();

  const close = () => dispatch(toggleAccountDrawer(false));
  const go = (path: string) => {
    close();
    router.push(path);
  };
  const setMarkets = () => {
    close();
    // Land on the home feed; the user can then tap Markets in the
    // accuracy/discover/markets filter. The Markets filter lives on
    // home — there's no /markets page yet.
    router.push(APP.INDEX);
  };

  const isDark = theme === Themes.Dark;

  return (
    <>
      {/* Click-out overlay. Sits behind the panel. */}
      <Transition
        show={open}
        enter="transition-opacity duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          onClick={close}
          className="fixed inset-0 bg-black/60 sm:hidden"
          style={{ zIndex: Zindex.Drawer }}
        />
      </Transition>

      <Transition
        show={open}
        enter="transition-transform duration-200 ease-out"
        enterFrom="-translate-x-full"
        enterTo="translate-x-0"
        leave="transition-transform duration-150 ease-in"
        leaveFrom="translate-x-0"
        leaveTo="-translate-x-full"
      >
        <aside
          className="fixed inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-backgroundDark text-fontFocus shadow-2xl sm:hidden"
          style={{ zIndex: Zindex.Drawer + 1 }}
          aria-label="Account menu"
        >
          {/* Header — close + 'Account info' label */}
          <div className="flex items-center justify-between px-5 pt-4">
            <span className="text-lg font-bold">Account info</span>
            <button
              type="button"
              onClick={close}
              className="rounded-full p-1 hover:bg-backgroundLight"
              aria-label="Close menu"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Profile preview */}
          {user?.id && (
            <button
              type="button"
              onClick={() => go(APP.PROFILE.USERNAME(user.username))}
              className="mt-2 flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-backgroundLight transition-colors"
            >
              <Avatar
                type={AvatarTypes.Profile}
                size={48}
                circle={user.accountType !== 'ORG'}
                image={avatar}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {user.name || user.username}
                </div>
                <div className="text-sm text-fontTertiary truncate">
                  @{user.username}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <span>
                    <span className="font-semibold text-fontFocus">
                      {makeShortNumber((user as any)._count?.following ?? user.following?.length ?? 0)}
                    </span>
                    <span className="text-fontTertiary"> Following</span>
                  </span>
                  <span>
                    <span className="font-semibold text-fontFocus">
                      {makeShortNumber((user as any)._count?.followers ?? user.followers?.length ?? 0)}
                    </span>
                    <span className="text-fontTertiary"> Followers</span>
                  </span>
                </div>
              </div>
            </button>
          )}

          <div className="my-2 border-t border-dividerColor" />

          {/* Primary menu */}
          {user?.id && (
            <Item
              icon={<UserIcon className="w-6 h-6" />}
              label="Profile"
              onClick={() => go(APP.PROFILE.USERNAME(user.username))}
            />
          )}
          <Item
            icon={<HomeIcon className="w-6 h-6" />}
            label="Home"
            onClick={() => go(APP.INDEX)}
          />
          <Item
            icon={<ShieldCheckIcon className="w-6 h-6" />}
            label="Markets"
            onClick={setMarkets}
          />
          <Item
            icon={<BriefcaseIcon className="w-6 h-6" />}
            label="Portfolio"
            onClick={() => go(APP.PORTFOLIO.INDEX)}
          />
          <Item
            icon={<UserGroupIcon className="w-6 h-6" />}
            label="Communities"
            onClick={() => go(APP.COMMUNITY.INDEX)}
          />
          <Item
            icon={<ChatAlt2Icon className="w-6 h-6" />}
            label="Messages"
            onClick={() => go(APP.MESSAGES.INDEX)}
          />

          <div className="my-2 border-t border-dividerColor" />

          {/* Account & settings */}
          <Item
            icon={<CreditCardIcon className="w-6 h-6" />}
            label="Wallet"
            onClick={() => go(`${APP.SETTINGS.INDEX}/wallet`)}
          />
          <Item
            icon={<BookmarkIcon className="w-6 h-6" />}
            label="Billing"
            onClick={() => go(APP.SETTINGS.BILLING)}
          />
          <Item
            icon={<CogIcon className="w-6 h-6" />}
            label="Settings & privacy"
            onClick={() => go(APP.SETTINGS.INDEX)}
          />

          <div className="my-2 border-t border-dividerColor" />

          {/* Theme + logout */}
          <Item
            icon={isDark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            label={isDark ? 'Light mode' : 'Dark mode'}
            onClick={() => dispatch(toggleTheme(isDark ? Themes.Light : Themes.Dark))}
          />
          {user?.id && (
            <Item
              icon={<LogoutIcon className="w-6 h-6" />}
              label="Log out"
              onClick={() => { close(); logout('user logout from account drawer'); }}
            />
          )}

          <div className="h-8" />
        </aside>
      </Transition>
    </>
  );
};

export default AccountDrawer;
