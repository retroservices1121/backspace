import { Helmet } from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { APP } from 'pages';
import AppWelcome from 'pages/modals/AppWelcome';
import PostModal from 'pages/modals/PostModal';
import { togglePostModal } from 'store/appSlice';
import { RootState } from 'store/store';
import { SafeArea } from 'styles/layout';

import MobileNavigation from './MobileNavigation';
import NavigationBar from './NavigationBar';
import { HideOnDesktop, HideOnMobile } from './styled';

const Navigation: React.FC = ({
  children,
}) => {
  const { postModalOpen } = useSelector((state: RootState) => state.app);
  const { pageTitle } = useSelector((state : RootState) => state.app);
  const onAuth = useRouteMatch({ path: APP.AUTH.INDEX });
  const dispatch = useDispatch();

  const handleOpenPostModal = () => {
    dispatch(togglePostModal(true));
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="backspace" content="backspace application" />
      </Helmet>
      <SafeArea className='flex h-screen flex-col'>
        <MobileNavigation onAuth={onAuth ? true : false}/>

        {/* Primary Navigation */}
        <HideOnMobile>
          <NavigationBar handleOpenPostModal={handleOpenPostModal} postModalOpen={postModalOpen}/>
        </HideOnMobile>

        {/* ROTFA */}
        <div className="overflow-y-auto overflow-x-hidden h-screen">{children}</div>

        {/* Primary Navigation */}
        <HideOnDesktop>
          <NavigationBar handleOpenPostModal={handleOpenPostModal} postModalOpen={postModalOpen}/>
        </HideOnDesktop>
      </SafeArea>

      {/* App Wide Modals */}
      <AppWelcome/>
      <PostModal
        isOpen={postModalOpen}
        onRequestClose={() => dispatch(togglePostModal(false))}
      />
    </>
  );
};

export default Navigation;
