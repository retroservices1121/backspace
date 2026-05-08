import { useDispatch, useSelector } from 'react-redux';
import useAuthentication from '@src/hooks/useAuthenticate';
import { useModal } from '@src/lib/Modal';
import { AuthStatus } from '@src/store/authSlice';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DefaultTheme } from 'styled-components';

import Search from 'components/Search';
import Icons, { configIcon } from 'icons';
import { APP } from 'pages';
import { toggleAppWelcome, toggleDrawer } from 'store/appSlice';
import { RootState } from 'store/store';
import { ClickableSpan } from 'styles/Buttons';
import { Space } from 'styles/layout';
import { isProduction } from 'utils/common_utils';
import { Modals, VERSION } from 'utils/constants';

import Logo from '../../../public/graphics/branding/backspace_with_logo.svg';
import UserSearch from '../Search/UserSearch';
import { AuthButtons } from './AuthButtons';
import { NavButtons } from './NavButtons';
import { HideOnMobile, MenuIcon, NavContainer } from './styled';

type NavigationProps = {
  handleOpenPostModal: () => void;
  postModalOpen: boolean;
};


export default function NavigationBar({ handleOpenPostModal, postModalOpen }: NavigationProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const authState = useAuthentication();
  const logoColor : keyof DefaultTheme = isProduction() ? 'fontFocus' : 'error';
  const WelcomeModal = useModal(Modals.AppWelcome);
  const { drawerOpen } = useSelector((state: RootState) => state.app);
  /*
	// TODO: Figure out how to hide the bar on regiser & login but nowhere else
  const onAuth = useRouteMatch({ path: APP.AUTH.INDEX });
  const onLogin = useRouteMatch({ path: APP.AUTH.LOGIN });
  const onRegister = useRouteMatch({ path: APP.AUTH.REGISTER });
  const showAuthButtons = (onLogin || onRegister) && onAuth ? true : false;
	*/

  return (
		<NavContainer className="sm:border-t-0 flex justify-center w-screen" >
			<div className="flex justify-between py-6 sm:w-4/6">
				<div className="hidden sm:flex justify-center items-center">
					{/* <div className={`${onAuth ? 'hidden' : 'static'}`}> */}
					{/* <MenuIcon className="mx-2 py-2 px-3 flex items-center cursor-pointer rounded-xl">
						{drawerOpen 
						  ? <Icons.Close onClick={() => {dispatch(toggleDrawer());}}/>
						  : <Icons.Menu onClick={() => {dispatch(toggleDrawer());}} />
						}
					</MenuIcon> */}
				</div>
				<div className="hidden sm:flex">
					<Link href={APP.INDEX}>
						<div className="cursor-pointer">
							{configIcon(Logo, { width: '150', height: '50', color: logoColor })}
						</div>
					</Link>
          <Space />
          <ClickableSpan className="my-auto" onClick={() => WelcomeModal.open()}>
            <h4>{VERSION}</h4>
          </ClickableSpan>
				</div>
				{authState != AuthStatus.SignedIn  
				  ? <AuthButtons />
				  :
					<>
						<HideOnMobile className="hidden sm:flex">
							<UserSearch />
							{/* <Search callback={(searchUser) => { router.push(`${searchUser.username}`);}} callbackText='Go To'/> */}
						</HideOnMobile>

						<NavButtons
							toggleCreatePost={handleOpenPostModal}
							createPostOpen={postModalOpen}
							user={user}
							path={router.pathname}
						/>
					</>
				}
			</div>

		</NavContainer>
  );
}

