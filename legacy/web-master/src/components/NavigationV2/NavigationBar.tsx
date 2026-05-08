import { useDispatch, useSelector } from 'react-redux';
import { configIcon } from 'icons';
import { DefaultTheme } from 'styled-components';

//import { useRouteMatch } from 'react-router-dom';
import Search from 'components/Search';
import { ReactComponent as Logo } from 'graphics/branding/backspace_with_logo.svg';
import useRouting from 'hooks/useRouting';
import { APP } from 'pages';
import { isProduction } from 'shared/common_utils';
import { toggleAppWelcome } from 'store/appSlice';
import { RootState } from 'store/store';
import { ClickableSpan } from 'styles/Buttons';
import { Space } from 'styles/layout';
import { VERSION } from 'util/constants';

import { AuthButtons } from './AuthButtons';
import { NavButtons } from './NavButtons';
import { HideOnMobile, NavContainer } from './styled';

type NavigationProps = {
  handleOpenPostModal: () => void;
  postModalOpen: boolean;
};


export default function NavigationBar({ handleOpenPostModal, postModalOpen }: NavigationProps) {
  const history = useRouting();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const logoColor : keyof DefaultTheme = isProduction() ? 'fontFocus' : 'error';
  /*
	// TODO: Figure out how to hide the bar on regiser & login but nowhere else
  const onAuth = useRouteMatch({ path: APP.AUTH.INDEX });
  const onLogin = useRouteMatch({ path: APP.AUTH.LOGIN });
  const onRegister = useRouteMatch({ path: APP.AUTH.REGISTER });
  const showAuthButtons = (onLogin || onRegister) && onAuth ? true : false;
	*/

  return (
		<NavContainer >
			<div className="flex justify-between py-6 sm:w-4/6">
				<HideOnMobile>
        <div className="cursor-pointer" onClick={() => history.navigate(APP.INDEX)}>
						{configIcon(Logo, { width: '150', height: '50', color: logoColor })}
					</div>
					<Space />
					<ClickableSpan onClick={() => dispatch(toggleAppWelcome(true))}>
						<h4>{VERSION}</h4>
					</ClickableSpan>
				</HideOnMobile>
				{/* Below line is for putting access code back in  */}
				{/* {user.isLoggedIn && user.access_code?.validated ? ( */}
				{user.isLoggedIn ? (
					<>
						<HideOnMobile>
							<Search callback={(searchUser) => {history.navigateToProfile(`${searchUser.username}`);}} callbackText='Go To'/>
						</HideOnMobile>

						<NavButtons
							toggleCreatePost={handleOpenPostModal}
							createPostOpen={postModalOpen}
							user={user}
							path={location.pathname}
						/>
					</>
				) : (
					<AuthButtons user={user}/>
				)}
			</div>
		</NavContainer>
  );
}

