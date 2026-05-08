// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import routes from '../src/routes';

// We're testing that the configuration is correct and what we expect.
// Not the library.

describe('App Routes', () => {
  it('Routes object is correctly configured', () => {
    // # FE
    expect(routes.fe()).toEqual('/');

    // ## backspace to username
    expect(routes.fe.spaceTo({ username: 'sam' })).toEqual('/sam');

    // ## Spaces
    expect(routes.fe.spaces()).toEqual('/spaces/');
    // open space
    expect(routes.fe.spaces.space({ spaceId: '1' })).toEqual('/spaces/1/');
    // open room in space
    expect(routes.fe.spaces.room({ spaceId: '1', roomId: '1' })).toEqual('/spaces/1/1/');
    
    const BASE_API_URL = '/'; // '/api/';

    // # API
    expect(routes.api()).toEqual(BASE_API_URL);

    // ## Spaces
    // get communities
    expect(routes.api.spaces()).toEqual(`${BASE_API_URL}spaces/`);
    // get community
    expect(routes.api.spaces.space({ spaceId: '1' })).toEqual(`${BASE_API_URL}spaces/1/`);
    // get room
    expect(routes.api.spaces.room({ spaceId: '1', roomId: '1' })).toEqual(`${BASE_API_URL}spaces/1/1/`);
  })
});
