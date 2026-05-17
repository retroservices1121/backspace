import { useDispatch, useSelector } from 'react-redux';
import Head from 'next/head';
import { useRouter } from 'next/router';

import LeftNav from 'components/Shell/LeftNav';
import RightRail from 'components/Shell/RightRail';

import { APP } from 'pages';
import { togglePostModal } from 'store/appSlice';
import { RootState } from 'store/store';
import { SafeArea } from 'styles/layout';

import AccountDrawer from './AccountDrawer';
import MobileNavigation from './MobileNavigation';
import NavigationBar from './NavigationBar';

const Navigation: React.FC = ({
  children,
}) => {
  const { postModalOpen } = useSelector((state: RootState) => state.app);
  const { pageTitle } = useSelector((state : RootState) => state.app);
  const router = useRouter();
  // All /auth/* routes render bare — login, register, forgot,
  // logout, onboarding. They own their own chrome (full-bleed
  // gradient, brand mark, etc.) so the desktop shell would
  // squish them into the 280/360 rails.
  const onAuth = router.pathname.startsWith(APP.AUTH.INDEX);
  const dispatch = useDispatch();

  const handleOpenPostModal = () => {
    dispatch(togglePostModal(true));
  };

  // Auth pages render bare — no chrome on top.
  if (onAuth) {
    return (
      <>
        <Head>
          <title>{pageTitle}</title>
          <meta name="backspace" content="backspace application" />
          <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
        </Head>
        <SafeArea className='flex h-screen flex-col'>
          {children}
        </SafeArea>
      </>
    );
  }

  // Single children mount with breakpoint-aware chrome. The mobile
  // chrome (MobileNavigation + AccountDrawer + bottom NavigationBar)
  // hides on sm+; the desktop LeftNav + RightRail hide on mobile.
  // Children render exactly once in the middle column — mounting
  // twice would double-fire effects and queries.
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="backspace" content="backspace application" />
        <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
      </Head>

      {/* Mobile-only top nav + drawer. MobileNavigation has its own
          sm:hidden internally; AccountDrawer manages its own
          visibility. Children mount EXACTLY once below — never
          duplicate them per-breakpoint or every page-level effect
          fires twice. */}
      <MobileNavigation onAuth={false}/>
      <AccountDrawer />

      {/* Shell. Mobile = single column (rails hidden); desktop =
          3-column grid with sticky rails. Body scrolls — the rails
          use the body as the sticky reference. */}
      <div
        className="
          relative isolate min-h-screen
          sm:grid sm:grid-cols-[280px_minmax(0,1fr)_360px]
          sm:bg-canvas sm:text-ink sm:font-display
        "
      >
        <div
          aria-hidden
          className="hidden sm:block pointer-events-none absolute left-1/2 -top-[15%] -translate-x-1/2 -z-10 w-[900px] h-[600px]"
          style={{
            background:
              'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(88,34,251,0.18) 0%, transparent 65%)',
          }}
        />

        <div className="hidden sm:block">
          <LeftNav />
        </div>

        <main className="min-w-0">{children}</main>

        <div className="hidden sm:block">
          <RightRail />
        </div>
      </div>

      {/* Mobile-only bottom nav. NavigationBar internally hides on
          desktop too, but the wrapper keeps the page tree quieter. */}
      <div className="sm:hidden">
        <NavigationBar handleOpenPostModal={handleOpenPostModal} postModalOpen={postModalOpen}/>
      </div>
    </>
  );
};

export default Navigation;
