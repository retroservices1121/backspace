import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import NotificationPeek from 'components/NotificationPeek';
import { ReactComponent as ChannelIcon } from 'graphics/navigation/channel.svg';
import { ReactComponent as HomeIcon } from 'graphics/navigation/home.svg';
import { ReactComponent as MessageIcon } from 'graphics/navigation/message.svg';
import { ReactComponent as NotificationIcon } from 'graphics/navigation/notification.svg';
import { ReactComponent as PostIcon } from 'graphics/navigation/post.svg';
import placeholderProfile from 'graphics/placeholders/1.png';
import { NavLink } from 'lib/routing';
import { APP } from 'pages';
import { RootState } from 'store/store';
import { Row } from 'styles/Flex';
import { Icon } from 'styles/Globals';

import { Avatar, HomeButton, NavButton, NotificationIndicator } from './styled';

export const NavButtons = ({ toggleCreatePost, createPostOpen, user, path }: any) => {
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

