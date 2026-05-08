// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

/** @deprecated */
export function buildAuthHeader(token: string) {
  return {
    'Context-Type': 'application/json',
    Authorization: JSON.stringify({ token: token }),
  };
}
