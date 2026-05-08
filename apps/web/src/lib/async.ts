// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

type Error = {
  type: 'error';
  error: any;
};

type Success<R> = {
  type: 'success';
  data: R;
};

type GoResponse<R> = Error | Success<R>;

/**
 * No more try catch blocks
 *
 * Inspired by {@link [Golang's error handling](https://gabrieltanner.org/blog/golang-error-handling-definitive-guide)}
 * but using typescript's {@link [narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)}
 * to provide a type-safe DX.
 *
 * @example
 * const response = go(fetch(`api/user/${id}`))
 * if (response.type === 'error') {
 *  console.error(response.error)
 *  return; // or throw (required)
 * }
 * console.log(response.data) // No type-error claiming that data might be null
 */
export default async function go<R = any>(asyncFunc: Promise<R>): Promise<GoResponse<R>> {
  try {
    const data = await asyncFunc;
    return { type: 'success', data };
  } catch (error) {
    return { type: 'error', error };
  }
}
