// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';
import { ToastContainer as ToastifyContainer } from 'react-toastify';

import { getTheme } from 'store/selectors';

import 'react-toastify/dist/ReactToastify.css';

const ToastContainer: React.FC<any> = () => {
  const { primary, backgroundLight } = useSelector(getTheme);

  return (
    <ToastifyContainer
      position='bottom-center'
      className='py-[80px] sm:py-0'
      autoClose={3500}
      theme='dark'
      progressStyle={{ background: primary }}
      toastStyle={{ background: backgroundLight }}
    />
  );
};
export default ToastContainer;
