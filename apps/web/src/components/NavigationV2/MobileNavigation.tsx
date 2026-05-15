import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { DefaultTheme } from 'styled-components';

import Search from 'components/Search';
import Icons, { configIcon } from 'icons';
import { APP } from 'pages';
import { toggleAccountDrawer } from 'store/appSlice';
import { RootState } from 'store/store';
import { isProduction } from 'utils/common_utils';

import Logo from '../../../public/graphics/branding/backspace_with_logo.svg';
import UserSearch from '../Search/UserSearch';
import { MenuIcon, MobileNav } from './styled';

type NavProps = {
  onAuth: boolean;
};


export default function MobileNavigation({ onAuth }: NavProps) {
  const { accountDrawerOpen } = useSelector((state: RootState) => state.app);
  const router = useRouter();
  const dispatch = useDispatch();
  const [isShowingSearch, setIsShowingSearch] = useState<boolean>(false);
  const logoColor : keyof DefaultTheme = isProduction() ? 'fontFocus' : 'error';

  return (
    <MobileNav className="sm:hidden py-3 flex justify-between items-center">
      {/* Force Center Logo on Auth */}
      {onAuth && <div className="w-12 mx-3"/>}

      {/* Menu Button — opens the X-style universal AccountDrawer. */}
      <div className={`${onAuth ? 'hidden' : 'static'}`}>
        <MenuIcon className="mx-2 py-2 px-3 flex items-center cursor-pointer rounded-xl">
          {accountDrawerOpen
            ? <Icons.Close onClick={() => dispatch(toggleAccountDrawer())} />
            : <Icons.Menu  onClick={() => dispatch(toggleAccountDrawer())} />
          }
        </MenuIcon>
      </div>

      {/* Logo */}
      {isShowingSearch ?
          <div className="">
            <UserSearch 
              callback={(searchUser) => {router.push(`${searchUser.username}`);}} 
              callbackText='Go To'/>
          </div>
        :
        <div className="cursor-pointer" onClick={() => router.push(APP.INDEX)}>
          {configIcon(Logo, { width: '150', height: '12', color: logoColor, className: 'h-12 mt-2' })}
        </div>
      }

      <div className="w-12 mx-3">
        <Icons.Search onClick={() => setIsShowingSearch(!isShowingSearch)} allowFill={false}/>
      </div>
    </MobileNav>
  );
}

