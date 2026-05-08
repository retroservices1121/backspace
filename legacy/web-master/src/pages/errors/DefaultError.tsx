// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { FallbackProps } from 'react-error-boundary';
import { Redirect } from 'react-router-dom';

import useRouting from 'hooks/useRouting';
import { APP } from 'pages';
import { Button } from 'styles/Buttons';
import { Col } from 'styles/Flex';
import { Space } from 'styles/layout';

import { CenterPage, ErrorHeader, ErrorMessage } from './styled';

const DefaultError: React.FC<FallbackProps> = ({
  resetErrorBoundary, error,
}) => {
  const history = useRouting();

  const handleClick = () => {
    resetErrorBoundary();
    history.navigate(APP.INDEX);
    window.location.reload();
  };


  return (
    <>
      <Redirect to={{ pathname: APP.ERRORS.DEFAULT, state: {} }}/>
      <CenterPage $center>
        <Col centerY>
          <ErrorHeader>Oops, something went wrong 🤔</ErrorHeader>

          <Space direction='column'/>

          {error.message && (
            <ErrorMessage>{error.message}</ErrorMessage>
          )}

          <Space direction='column'/>
          <Space direction='column'/>
          <p>If the problem persists, try a different browser.<br /> Clearing your browser cache can also resolve errors.</p>
          <Space direction='column'/>
          <Space direction='column'/>

          <Button
            onClick={handleClick}
          >
            Go Home
          </Button>
        </Col>
      </CenterPage>
    </>
  );
};

export default DefaultError;

