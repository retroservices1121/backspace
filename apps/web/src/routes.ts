// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { arg, createRouting, query, segment } from 'ts-routes';

const spaces = {
  ...segment`spaces/`,
  children: {
    space: segment`${arg('spaceId')}/`,
    room: segment`${arg('spaceId')}/${arg('roomId')}/`,
  },
};

//TODO this variable name seems off
const spaceTo = {
  ...segment`${arg('username')}`,
};

const user = {
  ...segment`user/`,
  children: {
    user: segment`${arg('userId')}/`,
  },
};

const routes = createRouting({
  fe: {
    ...segment`/`,
    children: { 
      spaces, 
      spaceTo, 
    },
  },
  api: {
    // Had to remove /api/ from here since its been added to axios and not everything uses routes yet...    
    ...segment`/`,
    children: { 
      spaces, 
      user, 
    },
  },
});

export default routes;

export const {
  fe, api,
} = routes;
