// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';
import { FallbackProps } from 'react-error-boundary';
import { useRouter } from 'next/router';

import { CenterPage, ErrorHeader, ErrorMessage } from 'components/errors/styled';
import { APP } from 'pages';
import { Button } from 'styles/Buttons';
import { OldCol } from 'styles/Flex';
import { Space } from 'styles/layout';

const DefaultError: React.FC<FallbackProps> = ({
  resetErrorBoundary, error,
}) => {
  const router = useRouter();

  const handleClick = () => {
    resetErrorBoundary();
    router.push(APP.INDEX);
    window.location.reload();
  };

  // useEffect(() => {
  //   router.push(APP.ERRORS.DEFAULT);
  // }, []);


  return (
    <>
      {/*<Redirect to={{ pathname: APP.ERRORS.DEFAULT, state: {} }}/>*/}
      <CenterPage $center>
        <OldCol centerY>
          <ErrorHeader>Oops, something went wrong.</ErrorHeader>

          <Space direction='column'/>

          {error.message && (
            <ErrorMessage>{error.message}</ErrorMessage>
          )}

          <Space direction='column'/>
          <Space direction='column'/>

          <Button
            onClick={handleClick}
          >
            Go Home
          </Button>
        </OldCol>
      </CenterPage>
    </>
  );
};

export default DefaultError;

