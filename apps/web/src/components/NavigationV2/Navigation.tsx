import { useDispatch, useSelector } from 'react-redux';
import Head from 'next/head';
import { useRouter } from 'next/router';

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
  const onAuth = router.asPath === APP.AUTH.INDEX;
  const dispatch = useDispatch();

  const handleOpenPostModal = () => {
    dispatch(togglePostModal(true));
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="backspace" content="backspace application" />
        <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
      </Head>
      <SafeArea className='flex h-screen flex-col'>
        <MobileNavigation onAuth={onAuth ? true : false}/>
        {/* Universal mobile account drawer — sibling to MobileNavigation
            so it slides over the whole shell. Hidden on desktop. */}
        <AccountDrawer />

        {/* Desktop Primary Navigation */}
        <div className="hidden sm:flex items-center">
          <NavigationBar handleOpenPostModal={handleOpenPostModal} postModalOpen={postModalOpen}/>
        </div>

        {/* ROTFA */}
        <div className="overflow-y-auto overflow-x-hidden h-screen">{children}</div>

        {/* Mobile Primary Navigation */}
        <div className="flex sm:hidden overflow-y-hidden items-center">
          <NavigationBar handleOpenPostModal={handleOpenPostModal} postModalOpen={postModalOpen}/>
        </div>
      </SafeArea>
    </>
  );
};

export default Navigation;
