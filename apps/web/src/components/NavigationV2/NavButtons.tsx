import { useState } from 'react';
import { useSelector } from 'react-redux';
import useLogout from '@src/hooks/useLogout';
import useMedia from '@src/hooks/useMedia';
import useUser from '@src/hooks/useUser';
import Icons from '@src/icons';
import { useModal } from '@src/lib/Modal';
import { Row } from '@src/styles/Flex';
import { Modals } from '@src/utils/constants';
import Link from 'next/link';

import NotificationPeek from 'components/NotificationPeek';
import { APP } from 'pages';
import { RootState } from 'store/store';

import placeholderProfile from '../../../public/graphics/placeholders/1.png';
import { Avatar, NavButton, NotificationIndicator } from './styled';

export const NavButtons = ({ toggleCreatePost, createPostOpen, path }: any) => {
  const { user, avatar } = useUser();
  const CreatePostModal = useModal(Modals.CreatePost);
  const logout = useLogout();
  // const { unreadIndicator } = useSelector((state : RootState) => state.notifications);
  const [openNotifications, setOpenNotifications] = useState(false);
  return (
    <Row className='justify-center align-center'>
      <div className='sm:hidden'>
        <Link href={APP.INDEX}>
          <NavButton color='backgroundLight' selected={path === APP.INDEX} selectedColor='primary'>
            <Icons.Home active={path === APP.INDEX}/>
          </NavButton>
        </Link>
      </div>
      <NavButton disabled={!user.id} color='backgroundLight' onClick={CreatePostModal.open}>
        <Icons.PlusBox active={createPostOpen} color="fontPrimary" />
      </NavButton>
      <Link href={APP.COMMUNITY.INDEX}>
        <NavButton color='backgroundLight' selected={path === APP.COMMUNITY.INDEX} selectedColor='primary'>
          <Icons.Community active={path === APP.COMMUNITY.INDEX}/>
        </NavButton>
      </Link>
      <Link href={APP.MESSAGES.INDEX}>
        <NavButton color='backgroundLight'selected={path === APP.MESSAGES.INDEX} selectedColor='primary' >
          <Icons.Chat active={path === APP.MESSAGES.INDEX} />
        </NavButton>
      </Link>
      <Link href={APP.PORTFOLIO.INDEX}>
        <NavButton color='backgroundLight' selected={path === APP.PORTFOLIO.INDEX} selectedColor='primary'>
          <Icons.Portfolio active={path === APP.PORTFOLIO.INDEX} />
        </NavButton>
      </Link>
      <>
        <NavButton color='backgroundLight'
          selected={openNotifications} selectedColor='primary'
          onClick={() => setOpenNotifications((current) => !current)}>
          {/* FIXME implement notification indicator */}
          {false && <NotificationIndicator />}
          <Icons.Bell active={openNotifications} />
        </NavButton>
        <NotificationPeek open={openNotifications} onRequestClose={() => setOpenNotifications(false)}/>
      </>
      <Link href={APP.PROFILE.USERNAME(user.username)}>
        <NavButton selected={path === APP.PROFILE.USERNAME(user.username)} selectedColor='primary'>
          {/* Always render the avatar; fall back to the placeholder
              while it resolves or if it can't. Never an endless spinner. */}
          <Avatar src={avatar || placeholderProfile} alt="me" />
        </NavButton>
      </Link>
      <NavButton
        disabled={!user.id}
        color='backgroundLight'
        onClick={() => logout('user logout from nav')}>
        <Icons.Leave />
      </NavButton>
    </Row>
  );
};

