// Copyright 2021 NewSocial Inc.
// Author(s): Samuele Zanca

import React from 'react';
import {
  NavLink as RRNavLink,
  Redirect as RRRedirect,
  RedirectProps as RRRedirectProps,
  // RR = ReactRouter
  Route as RRRoute,
  RouteProps as RRRouteProps,
  Switch as RRSwitch,
} from 'react-router-dom';

import { Override } from 'types/utilityTypes';

// All Proxies in this file follow the SOLID['O'] Principle
// If for whatever reason instead of extending, you modify something,

export type FractalRoute = string | { INDEX: string };


export function getPath(route: FractalRoute) {
  if (typeof route === 'string'){
    return route;
  } else {
    return route.INDEX;
  }
}


type RedirectProps = Override<RRRedirectProps, { to: FractalRoute }>;

export const Redirect: React.FC<RedirectProps> = ({ to, ...props }) => (
  <RRRedirect {...props} to={getPath(to)} />
);

type RouteProps = Override<RRRouteProps<string>, {
  path: FractalRoute;
  redirect?: FractalRoute;
}>;


export const Route: React.FC<RouteProps> = ({ path, redirect, ...props }) => (
  <RRRoute {...props} path={getPath(path)}>
    {redirect && <Redirect to={getPath(redirect)}/>}
  </RRRoute>
);

export const Switch: React.FC = ({ ...props }) => (
  <RRSwitch {...props}>
  </RRSwitch>
);





type NavLinkProps = Override<Parameters<RRNavLink>[0], { to: FractalRoute }>;

export const NavLink: React.FC<NavLinkProps> = ({ to, ...props }) => (
  <RRNavLink {...props} to={getPath(to)} />
);
