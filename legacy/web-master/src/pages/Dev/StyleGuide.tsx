// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import ChatInput from 'components/Rich';
import RichRender from 'components/Rich/RichRender';
import Toggle from 'components/Toggle';
import { toggleTheme } from 'store/appSlice';
import { appTheme, getTheme } from 'store/selectors';
import { LargeTextButton, MediumTextButton, SmallTextButton } from 'styles/Buttons';
import { Separator } from 'styles/Dividers';
import { Flex, FlexSpaceBetween, Row } from 'styles/Flex';
import { Themes } from 'styles/theme';

// Using inline styles here because this page isn't worth the effort to make styled components

function printIcons() {
  console.log('Someone clever will figure this out');
  return <></>;
}

const Container = styled.div`
  height: 100%;
  overflow: auto;
`;

const Readable = styled.div`
  background: ${({ theme }) => theme.backgroundDark};
  border-radius: .4em;
  padding: .2em .8em;
`;

const StyleGuide: React.FC = () => {
  const currentTheme = useSelector(appTheme);
  const [chatMsg, setChatMsg] = useState<string>('');
  const theme = useSelector(getTheme);
  const dispatch = useDispatch();
  return (
    <Container>
      <h1 style={{ margin: '1em' }}>Backspace Style Guide</h1>
      <Flex $center>
        <h2>Toggle Theme</h2>
        <Toggle onChange={() => dispatch(toggleTheme())} checked={currentTheme === Themes.Dark}/>
      </Flex>
      <Separator>
        <h1>Text</h1>
      </Separator>
      <h1>Heading H1</h1>
      <h2>Heading H2</h2>
      <h3>Heading H3</h3>
      <h4>Heading H4</h4>
      <h5>Heading H5</h5>
      <p>Paragraph</p>
      <div>Div Text</div>
      <span>Span Text</span><br />
      <Separator>
        <h1>Colors</h1>
      </Separator>
      {Object.entries(theme)
        // Removing the transparent color...
        .filter(([key]) => key !== 'none')
        .map(([key, value]) => (
          <Flex $center style={{
            background: value,
            height: '3em',
            padding: '0 10em',
          }}>
            <FlexSpaceBetween style={{
              width: '100%',
            }}>
              <Readable>
                {key}
              </Readable>
              <Readable>
                {value}
              </Readable>
            </FlexSpaceBetween>

          </Flex>
        ))}
      <Separator>
        <h1>Buttons</h1>
      </Separator>

      <SmallTextButton color='primary'>
        Small
      </SmallTextButton>
      <MediumTextButton color='primary'>
        Medium
      </MediumTextButton>
      <LargeTextButton color='primary'>
        Large
      </LargeTextButton>

      <Separator>
        <h1>Icons</h1>
        <Row>
          {printIcons()}
        </Row>
      </Separator>
      <Separator>
        <h1>Chat Input</h1>
      </Separator>
      <RichRender value={chatMsg} />
      <ChatInput allowMedia onSubmit={function (text: string): Promise<void> {
        toast.info('submitted message');
        console.log(text);

        setChatMsg(text);
        return Promise.resolve();
      } } />
    </Container>
  );
};
export default StyleGuide;
