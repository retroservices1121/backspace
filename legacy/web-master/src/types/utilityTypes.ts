/**
 * Replaces all keys defined in override on the base type.
 */
export type Override<Base, Overrides> = Omit<Base, keyof Overrides> & Overrides;

/**
 * This type allows you to give a React Component types for autocompletion purposes
 * while also allowing other props to be passed to it.
 *
 * Avoid using this unless component is a Wrapper or HOC, which are
 * both types of components where this behaviour is expected.
 * */
export type WithRest<T = any> = T & { [prop: string]: any };

export type Tw = { className?: string };
