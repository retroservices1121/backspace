// Copyright 2021 - Samuele Zanca
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
