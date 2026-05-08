// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions } from '@prisma/client';

// Theres probably a better place for this...
const rolePowerMap = Object.values(Permissions).reduce((acc, curr, index) => {
  acc[curr] = index;
  return acc;
}, {});

export const getPower = (role: Permissions) => rolePowerMap[role];


// After a quick sanity check https://gist.github.com/metruzanca/b66ada18d1b70585b455d7b9c7612d6a
// If you use !hasPermission(...) its as if you did user < required

export function hasPermission(user: Permissions, required: Permissions) {
  return rolePowerMap[user] >= rolePowerMap[required];
}