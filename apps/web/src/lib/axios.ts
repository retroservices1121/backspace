// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import axios from 'axios';

import { getAuthCookie } from './cookies';

const instance = (token = getAuthCookie()) => {

  return axios.create({
    baseURL: '/api',
    headers:{
      'Content-Type':'application/json',
      'Access-Control-Allow-Origin':'*',
      'Authorization':`Bearer ${token}`,
      'Accept': 'application/json',
    },
    timeout: 30000,
  });
};

export default instance;
