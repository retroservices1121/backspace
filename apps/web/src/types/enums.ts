// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions } from '@prisma/client';

//
/**
 * @description
 * Translates enum to a ranked number value for comparison. This helps with the logic 'at least a member'. 
 * Left room for some weird case where we need to really mess with the values.
 */
export const PermissionLevel = {
  [Permissions.BLOCKED]:    -1,
  [Permissions.EVERYONE]:       10,
  [Permissions.MEMBER]:     20,
  [Permissions.SUBSCRIBER]: 30,
  [Permissions.MODERATOR]:  40,
  [Permissions.ADMIN]:      50,
  [Permissions.OWNER]:      60,
};
