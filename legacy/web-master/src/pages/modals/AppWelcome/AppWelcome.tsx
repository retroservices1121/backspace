// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import ReactPlayer from 'react-player';
import { useDispatch, useSelector } from 'react-redux';

import Modal from 'components/Modal';
import { toggleAppWelcome } from 'store/appSlice';
import { RootState } from 'store/store';
import { setWelcomed } from 'store/userSlice';
import { ButtonLarge } from 'styles/Buttons';
import { Col } from 'styles/Flex';
import { Space } from 'styles/layout';
import { VERSION } from 'util/constants';

import { ColoredSpan, Container, Content, Header } from './styles';


// These styles make the modal size itself based on the inner children
const simplifiedModalStyles = {
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    top: 'initial',
    left: 'initial',
    right: 'initial',
    bottom: 'initial',
  },
};

type Props = {};

const AppWelcome: React.FC<Props> = () => {
  const dispatch = useDispatch();
  const { appWelcome } = useSelector((state: RootState) => state.app);

  const handleWelcomed = () => {
    dispatch(setWelcomed()); 
    dispatch(toggleAppWelcome(false));
  };

  return (
    <Modal
      isOpen={appWelcome}
      onRequestClose={handleWelcomed}
      style={simplifiedModalStyles}
    >
      <Container>
        <Header>
          {VERSION} - Closed Access
        </Header>
        <Content>
          Welcome to <ColoredSpan>Backspace</ColoredSpan>,<br/>We're ecstatic to have you join us for our Beta with <a href='https://www.producthunt.com/products/backspace'>Product Hunt</a>.<br />
          <br />
          Here's an intro video that highlights some of the features of Backspace.
          <Space direction='column' size='sm' />
          <ReactPlayer width="100%" url='https://youtu.be/UGm4oLFqQUc' controls />
          <Col $center>  
            <p>Looking for more? Check out our evolving community <a href="https://docs.backspace.to">Knowledge Base</a></p>
            <Space direction='column' size='sm' />
            <p>Contact support with any feature requests, issues or bugs.</p>
            <a href={'mailto: support@backspacethat.com'}>support@backspacethat.com</a>
            <Space direction='column' size='sm' />
            <p>You can return to this page by clicking the <strong>{VERSION}</strong> icon on the navigation bar.</p>
          </Col>
        </Content>
        <Space direction='column' size='sm' />
        <Col $center $full>
          <ButtonLarge color='primary' onClick={handleWelcomed}>Continue</ButtonLarge>
        </Col>
      </Container>
    </Modal>
  );
};
export default AppWelcome;
