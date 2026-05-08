// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Rest } from 'types/utilityTypes';

export type Paginate = Rest<{ id: string; lastId: string; }>;

export type Send = Rest<string, {
  text: string;
  communityId: string;
  // TODO media needs some work
  // media?: Prisma.MediaCreateNestedManyWithoutMessageInput;
}>;
export type Edit = Rest<string, { id: number; text: string; }>;

export type Remove = Rest;
