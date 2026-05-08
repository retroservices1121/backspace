// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

/**
 * createCacheKeyFromArgs
 *
 * @desc Creates a cache key from fn's arguments.
 *
 * @param args Arguments from fn being memoized.
 * @return Returns a cache key.
 */
export const createCacheKeyFromArgs = (args: any[]) =>
  args.reduce((cacheKey, arg) => (cacheKey += `_${typeof arg === 'object' ? JSON.stringify(args) : `${arg}`}_`), '');


/**
* memoize
*
* @desc Creates a function that memoizes the result of fn.
* The arguments of the fn are used to create a cache key.
*
* @param fn The function to have its output memoized.
* @return Returns the new memoized function.
*/
function memoize<A extends unknown[], K, V>(
  fn: (...args: A) => Promise<V>) {
  let cache = new Map<K, V>();
  const cachedFunction = function (...args: Parameters<typeof fn>) : Promise<V> {
    const cacheKey = createCacheKeyFromArgs(Array.from(args));
    
    if (cache.has(cacheKey)) {
      return Promise.resolve(cache.get(cacheKey));
    }

    const asyncFn = fn.apply(this, args);
    cache.set(cacheKey, asyncFn);
    return asyncFn;
  };
  cachedFunction.clear = (...args: A) => {
    const cacheKey = createCacheKeyFromArgs(Array.from(args));
    cache.delete(cacheKey);
  };
  cachedFunction.clearAll = () => cache = new Map<K, V>();
  return cachedFunction;
}

export default memoize;





// For usage see https://runkit.com/metruzanca/61cb81df6179df0009a53248

const isAsync = (fn: Function) => fn.constructor.name === 'AsyncFunction';

const getHash = (firstArg: string ) => firstArg;

type AsyncMemoOptions = {
  hasher?: (...args: any[]) => string;
  initialCacheValue?: any;
};

const defaultOptions = {
  hasher: getHash,
  initialCacheValue: {},
};

/** This SYNC function returns an async function */
/** @deprecated use memoize */ 
export function memoizeAsync<R>(
  fn: (...args: any[]) => Promise<R>,
  options: AsyncMemoOptions = defaultOptions,
) {
  //FIXME find out why this is throwing when hosted
  if (!isAsync(fn)) console.error("The function you're trying to memoize is not async, use lodash.memoize instead.");

  let cache: Record<string, R> = options.initialCacheValue;
  const cachedFunction = async (...args: Parameters<typeof fn>) => {
    // @ts-ignore hasher has an initializer
    let hash = options.hasher(...args);
    if (hash in cache) {
      return cache[hash];
    } else {
      try {
        let result = await fn(...args);
        cache[hash] = result;
        return result;
      } catch (error) {
        //TODO rebind the this to the inner function using fn.bind() or fn.call(). Idk how this shit works -Sam
      }
    }
  };
  cachedFunction.clear = (key: string) => key
    ? delete cache[key]
    : cache = {};
  return cachedFunction;
}
