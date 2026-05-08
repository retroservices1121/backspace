// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

type HasCreatedAt = {
  createdAt: string | Date;
};

type Order = 'asc' | 'desc';

export function sortByCreatedAt<T extends HasCreatedAt>(order: Order = 'asc') {
  return order === 'asc'
    ? (a: T, b: T) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    : (a: T, b: T) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
