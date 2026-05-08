
declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<
  SVGSVGElement
  > & { title?: string }>;

  const src: string;
  export default src;
}
declare module 'react-layout' {
  export type ReactLayoutComponentType<P = {}> = React.FC<P> & {
    Layout?: React.FC
  };
}

declare module 'next/app' {
  export type AppLayoutProps<P = {}> = AppProps & {
    Component: ReactLayoutComponentType;
  };
}