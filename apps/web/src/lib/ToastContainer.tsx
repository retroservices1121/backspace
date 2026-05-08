// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { ToastContainer as ToastifyContainer } from 'react-toastify';

import useTheme from 'hooks/useTheme';

import 'react-toastify/dist/ReactToastify.css';

const ToastContainer: React.FC<any> = () => {
  const { primary, backgroundLight } = useTheme();

  return (
    <ToastifyContainer
      position='bottom-center'
      autoClose={3500}
      theme='dark'
      progressStyle={{ background: primary }}
      toastStyle={{ background: backgroundLight }}
    />
  );
};
export default ToastContainer;
