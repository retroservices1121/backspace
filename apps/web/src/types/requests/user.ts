// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Conversation, DirectMessage, Prisma, User } from '@prisma/client';

import { UserType } from '../database';


/** #### User API #### */
export type UserRequest = {
  id: bigint,
  username: string
  // value: string | string[]
  // key: 'id' | 'username'
};

export type CreateUserBody = Prisma.UserCreateInput;
export type CreatePrivateUserBody = Prisma.PrivateCreateInput;
export type CreateUserStateBody = Prisma.UserStateCreateInput;

export type UserResponse = {
  user: User | null;
};
