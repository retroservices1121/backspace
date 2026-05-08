// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions } from '@prisma/client';
import { capitalize } from 'lodash';

import { Transition } from 'components/ListTransition';

import { PermissionLabel } from './styles';

/** Component responsible for generating separators with role names in member list */
const RoleTransition: Transition<Permissions> = ({ current }) => (
  <PermissionLabel>{capitalize(current)}</PermissionLabel>
);

export default RoleTransition;
