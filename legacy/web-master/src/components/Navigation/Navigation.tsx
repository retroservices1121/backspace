// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import NotificationPeek from 'components/NotificationPeek';
import Search from 'components/Search';
import { ReactComponent as ChannelIcon } from 'graphics/navigation/channel.svg';
import { ReactComponent as HomeIcon } from 'graphics/navigation/home.svg';
import { ReactComponent as Logo } from 'graphics/navigation/logo_banner_white.svg';
import { ReactComponent as MessageIcon } from 'graphics/navigation/message.svg';
import { ReactComponent as NotificationIcon } from 'graphics/navigation/notification.svg';
import { ReactComponent as PostIcon } from 'graphics/navigation/post.svg';
import placeholderProfile from 'graphics/placeholders/1.png';
import useRouting from 'hooks/useRouting';
import { NavLink } from 'lib/routing';
import { APP } from 'pages';
import AppWelcome from 'pages/modals/AppWelcome';
import PostModal from 'pages/modals/PostModal';
import { toggleAppWelcome, togglePostModal } from 'store/appSlice';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';
import { ClickableSpan } from 'styles/Buttons';
import { Row } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { Layout } from 'styles/layout';
import { Space } from 'styles/layout';
import { VERSION } from 'util/constants';
import { envType } from 'util/firebase';

import { Avatar, EnvTypeText, HideOnMobile, HomeButton, MobileNav, NavButton, NavContainer, NavTitle, NotificationIndicator } from './styled';

type AuthButtonProps = {
  user: User;
};

const AuthButtons = function ({ user }: AuthButtonProps) {
  if (user.isLoggedIn) {
    return (
      <Row $center>
        <NavLink exact to={APP.AUTH.LOGOUT}>
          <ClickableSpan> Logout </ClickableSpan>
        </NavLink>
      </Row>
    );
  } else {
    return (
      <Row $center>
        <NavLink exact to={APP.AUTH.REGISTER}>
          <ClickableSpan> Create Account </ClickableSpan>
        </NavLink>
        <Space />
        <NavLink exact to={APP.AUTH.LOGIN}>
          <ClickableSpan> Login </ClickableSpan>
        </NavLink>
      </Row>
    );
  }

};

const NavButtons = ({ toggleCreatePost, createPostOpen, user, path }: any) => {
  const { unreadIndicator } = useSelector((state : RootState) => state.notifications);
  const [openNotifications, setOpenNotifications] = useState(false);
  return (
    <Row $center>
      {/* Removed due to user feedback */}
      <HomeButton exact to={APP.INDEX} >
        <NavButton color='backgroundLight' selected={path === APP.INDEX} selectedColor='primary'>
          <Icon as={HomeIcon} $active={path === APP.INDEX} $activeColor='primary'/>
        </NavButton>
      </HomeButton>
      <NavButton color='backgroundLight' onClick={toggleCreatePost}>
        <Icon $solid as={PostIcon} $active={createPostOpen} $activeColor='primary'/>
      </NavButton>
      <NavLink exact to={APP.COMMUNITY.INDEX}>
        <NavButton color='backgroundLight' selected={path === APP.COMMUNITY.INDEX} selectedColor='primary'>
          <Icon $solid as={ChannelIcon} $active={path === APP.COMMUNITY.INDEX} $activeColor='primary'/>
        </NavButton>
      </NavLink>
      <NavLink to={APP.MESSAGES.INDEX}>
        <NavButton color='backgroundLight'selected={path === APP.MESSAGES.INDEX} selectedColor='primary' >
          <Icon as={MessageIcon} $active={path === APP.MESSAGES.INDEX} $activeColor='primary' />
        </NavButton>
      </NavLink>
      <>
        <NavButton color='backgroundLight'
          selected={openNotifications} selectedColor='primary'
          onClick={() => setOpenNotifications((current) => !current)}>
          {unreadIndicator && <NotificationIndicator />}
          <Icon as={NotificationIcon} $active={openNotifications} $activeColor='primary'/>
        </NavButton>
        <NotificationPeek open={openNotifications} onRequestClose={() => setOpenNotifications(false)}/>
      </>
      <NavLink exact to={APP.PROFILE.USERNAME(user.username)}>
        <NavButton selected={path === APP.PROFILE.USERNAME(user.username)} selectedColor='primary'>
          <Avatar src={user.avatar || placeholderProfile} alt="me" />
        </NavButton>
      </NavLink>
    </Row>
  );
};

type Props = {};

const Navigation: React.FC<Props> = ({}) => {
  const history = useRouting();
  const dispatch = useDispatch();
  const location = useLocation();
  const { postModalOpen } = useSelector((state: RootState) => state.app);
  const user = useSelector((state: RootState) => state.user);
  const { pageTitle } = useSelector((state : RootState) => state.app);

  const handleOpenPostModal = () => {
    dispatch(togglePostModal(true));
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="backspace" content="backspace application" />
      </Helmet>

      {/* Nav for Mobile */}
      <MobileNav>
        {envType == 'production' ?
          <EnvTypeText onClick={() => history.navigate(APP.INDEX)}>
            {envType?.toUpperCase()}
          </EnvTypeText>
          :
          <Logo onClick={() => history.navigate(APP.INDEX)} className="h-12 mt-2"/>
        }
        <div className="w-12 mx-3"/>
      </MobileNav>

      <NavContainer $center>
        <Layout as={Row}>
          <HideOnMobile>
            {envType != 'production' ?
              <EnvTypeText onClick={() => history.navigate(APP.INDEX)}>
                {envType?.toUpperCase()}
              </EnvTypeText>
              :
              <NavTitle as={Logo} onClick={() => history.navigate(APP.INDEX)} />
            }
            <ClickableSpan onClick={() => dispatch(toggleAppWelcome(true))}>
              <h4>Alpha {VERSION}</h4>
            </ClickableSpan>
            <Space />
          </HideOnMobile>
          {user.isLoggedIn && user.access_code?.validated ? (
            <>
              <Search callback={(searchUser) => {history.navigateToProfile(`${searchUser.username}`);}} callbackText='Go To'/>
              <NavButtons
                toggleCreatePost={() => handleOpenPostModal()}
                createPostOpen={postModalOpen}
                user= {user}
                path={location.pathname}
              />
            </>
          ) : (
            <AuthButtons user={user}/>
          )}
          <AppWelcome/>
          <PostModal
            isOpen={postModalOpen}
            onRequestClose={() => dispatch(togglePostModal(false))}
          />
        </Layout>
      </NavContainer>
    </>
  );
};

export default Navigation;
