// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import React from 'react';
import { useDispatch } from 'react-redux';
import { toast, UpdateOptions } from 'react-toastify';

import { submitAccessCode } from 'api/accesscode';
import { setPageTitle } from 'store/appSlice';
import { setAccessCodeValid } from 'store/userSlice';

import PasscodeForm, { PasscodeFields, PasscodeState } from './PasscodeForm';
import { Container } from './styles';

type Props = {};

const Passcode: React.FC<Props> = ({}) => {
  const dispatch = useDispatch();
  dispatch(setPageTitle('Locked'));
  const submitPasscode = async (formState : PasscodeState) => {
    const toastId = toast.loading('Submitting Access Code');
    return submitAccessCode(formState[PasscodeFields.Code])
      .then((result) => {
        if (result.data == true) {
          dispatch(setAccessCodeValid());
          const update : UpdateOptions = {
            render: 'Success! Welcome to Backspace',
            type: 'success',
            isLoading: false,
            autoClose: 5000,
          };
          toast.update(toastId, update);
        } else {
          const update : UpdateOptions = {
            render: 'Error, Invalid Code.',
            type: 'error',
            isLoading: false,
            autoClose: 5000,
          };
          toast.update(toastId, update);
        }
      })
      .catch(() => {
        const update : UpdateOptions = {
          render: 'Error, Invalid Code.',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        };
        toast.update(toastId, update);
      });
  };

  return (
    <>
      <Container>
        <PasscodeForm 
          onSubmit={submitPasscode} />
      </Container>
    </>
  );
};

export default Passcode ;
