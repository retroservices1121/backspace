// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

export const MESSAGES_PER_FETCH = 20;

type PaginationOptions = {
  order?: 'asc' | 'desc';
  take?: number;
};

// Prisma was complaining, so I had to make this type.
type PaginateReturn = (
  | {
    take: number;
    orderBy: { createdAt: 'asc' | 'desc' }
    cursor: { id: bigint }
    skip: number
  }
  | {
    take: number;
    orderBy: { createdAt: 'asc' | 'desc' }
  }
);

export function paginate(
  lastId?: string,
  {
    order = 'desc',
    take = MESSAGES_PER_FETCH,
  }: PaginationOptions = {},
): PaginateReturn {
  if (lastId) {
    return {
      take,
      orderBy: { createdAt: order },
      cursor: { id: BigInt(lastId) },
      skip: 1,
    };
  }
  return {
    take,
    orderBy: { createdAt: order },
  };
}