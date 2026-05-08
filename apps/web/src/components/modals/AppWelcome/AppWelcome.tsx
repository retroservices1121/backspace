// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import ReactPlayer from 'react-player';
import { useRegisterModal } from '@src/lib/Modal';

import { ButtonLarge } from 'styles/Buttons';
import { OldCol } from 'styles/Flex';
import { Space } from 'styles/layout';
import { Modals, VERSION } from 'utils/constants';

import { Container, Content, Header } from './styles';

type Props = {};



const AppWelcome: React.FC<Props> = () => {
  const WelcomeModal = useRegisterModal(Modals.AppWelcome);

  const handleWelcomed = () => {
    // dispatch(setWelcomed()); 
    WelcomeModal.close();
  };

  return (
    <WelcomeModal>
      <Container>
        <Header>
          Backspace {VERSION} - Welcome
        </Header>
        <Content>
          <strong>Hello there!</strong><br />
          <br />
          We are so excited to introduce you to Backspace, 
          a new, simplier way to engage with your online communities.<br />
          <br />
          Since you're one of the first on the platform were counting on you to 
          report bugs you may encounter and submit new features ideas so we can 
          continue to improve and build the best product for you and your communities.
          <Space direction='column' size='sm' />
          <ReactPlayer width="100%" url='videos/backspace_intro.mp4' controls  />
          {/* <Image src={WelcomeImage} alt="welcome" /> */}
          <Space direction='column' size='sm' />
          <OldCol $center>
            <p>Contact support with any feature requests, issues or bugs.</p>
            <a href={'mailto: support@backspacethat.com'}>support@backspacethat.com</a>
            <Space direction='column' size='sm' />
            <p>You can return to this page by clicking the <strong>{VERSION}</strong> icon on the navigation bar.</p>
          </OldCol>
        </Content>
        <Space direction='column' size='sm' />
        <OldCol $center $full>
          <ButtonLarge color='primary' onClick={handleWelcomed}>Continue</ButtonLarge>
        </OldCol>
      </Container>
    </WelcomeModal>
  );
};
export default AppWelcome;
