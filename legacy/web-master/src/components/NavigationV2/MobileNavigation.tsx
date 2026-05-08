import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Icons, { configIcon } from 'icons';
import { DefaultTheme } from 'styled-components';

import Search from 'components/Search';
import { ReactComponent as Logo } from 'graphics/branding/backspace_with_logo.svg';
import useRouting from 'hooks/useRouting';
import { APP } from 'pages';
import { isProduction } from 'shared/common_utils';
import { toggleDrawer } from 'store/appSlice';
import { RootState } from 'store/store';

import { MenuIcon, MobileNav } from './styled';

type NavProps = {
  onAuth: boolean;
};


export default function MobileNavigation({ onAuth }: NavProps) {
  const { drawerOpen } = useSelector((state: RootState) => state.app);
  const history = useRouting();
  const dispatch = useDispatch();
  const [isShowingSearch, setIsShowingSearch] = useState<boolean>(false);
  const logoColor : keyof DefaultTheme = isProduction() ? 'fontFocus' : 'error';

  return (
    <MobileNav>
      {/* Force Center Logo on Auth */}
      {onAuth && <div className="w-12 mx-3"/>}

      {/* Menu Button */}
      
        <div className={`${onAuth ? 'hidden' : 'static'}`}>
          
          <MenuIcon>
            {/* This weird history section is to put a different icon on the profile page */}
            {(  history.location.pathname.split('/').length != 2 ||  
                history.location.pathname.split('/')[1]?.length == 0) ?
              <>
                {drawerOpen ?
                  <Icons.Close onClick={() => {dispatch(toggleDrawer());}}/>
                  :
                  <Icons.Menu onClick={() => {dispatch(toggleDrawer());}} />
                }
              </>
              : <Icons.Back onClick={() => {history.goBack();}} /> 
            }
          </MenuIcon>
          
        </div>
      
      

      {/* Logo */}
      {isShowingSearch ?
          <div className="">
            <Search callback={(searchUser) => {history.navigateToProfile(`${searchUser.username}`);}} callbackText='Go To'/>
          </div>
        :
        <div className="cursor-pointer" onClick={() => history.navigate(APP.INDEX)}>
          {configIcon(Logo, { width: '150', height: '12', color: logoColor, className: 'h-12 mt-2' })}
        </div>
      }

      <div className="w-12 mx-3">
        <Icons.Search onClick={() => setIsShowingSearch(!isShowingSearch)} allowFill={false}/>
      </div>
    </MobileNav>
  );
}

