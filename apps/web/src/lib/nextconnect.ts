// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Author(s): See Git History
//
// Auth middleware. Migrated from Firebase Admin's verifyIdToken to Privy's
// verifyAuthToken (2026-05-08). The User.authId column now stores the Privy
// DID (`did:privy:...`) instead of the Firebase UID. Existing Firebase users
// claim their account via the email-link flow which mints them a Privy
// session and rewrites their authId in-place.

import { isDevelopment } from '@src/utils/common_utils';
import { verifyPrivyToken } from '@backspace/auth';
import chalk from 'chalk';
import HttpStatus from 'http-status-codes';
import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import nc, { ErrorHandler, Middleware, NoMatchHandler, Options } from 'next-connect';

const colorArray = [chalk.cyan, chalk.yellow, chalk.magenta];

type ExtReq = Req & {
  authId: string;
};

type RequestBase = {
  body?: any;
  query?: any;
};

export type Request<Params extends RequestBase> = Required<Params>;

const PRIVY_CFG = {
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
};

const validate = async (token: string): Promise<string | null> => {
  try {
    const claims = await verifyPrivyToken(token, PRIVY_CFG);
    return claims.userId;
  } catch (error) {
    console.warn('Not able to verify Privy token');
    return null;
  }
};

export const onError: ErrorHandler<ExtReq, Res> = (err, req, res, next) => {
  console.error(err);
  // res.end() only accepts a string/Buffer — passing the Error object
  // throws ERR_INVALID_ARG_TYPE *inside the error handler*, which
  // escapes uncaught and can crash the process (Cloudflare then 502s).
  // Serialize to a message and guard against double-send.
  if (res.headersSent) return;
  const message = err instanceof Error ? err.message : String(err);
  res.status(500).json({ error: message });
};

export const onNoMatch: NoMatchHandler<ExtReq, Res> = (req, res) => {
  res.status(404).end('Page is not found');
};

export const ncDefaults = {
  onNoMatch, onError,
};

export const requireAuthMiddleware: Middleware<ExtReq, Res> = (req, res, next) => {
  if (!req.authId) {
    const errorString = 'Missing user authorization. Middleware blocking request';
    console.error(errorString);
    res.status(401).end(errorString);
  } else {
    next();
  }
};

function isErrorStatus(str: string) {
  return str.startsWith('4') || str.startsWith('5');
}

export const createHandler = (options: Options<ExtReq, Res> = {}) => {
  const handler = nc<ExtReq, Res>({ onNoMatch, onError, ...options });

  handler.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7, authHeader.length);
      req.authId = token ? await validate(token) : undefined;
    } else if (authHeader) {
      throw new Error('malformed auth header');
    }
    next();
  });

  if (isDevelopment) {
    handler.use((req, res, next) => {
      const timestamp = Math.trunc(new Date().getTime()).toString();
      const requestID = timestamp.slice(timestamp.length - 5);

      const requestColor = colorArray[2];
      console.log(requestColor(`Start (${requestID}) ${req.method}:${req.url}`));

      res.on('finish', function () {
        const color = isErrorStatus(res.statusCode.toString()) ? chalk.red : chalk.green;
        console.log(color(`End (${requestID}) ${req.method}:${req.url}`));
        console.log(requestColor(`(${requestID}) Metadata`));
        console.log(color('\tSTATUS: ' + HttpStatus.getStatusText(res.statusCode) + '(' + res.statusCode + ')'));
        console.log('\tURL: ', req.url);
        console.log('\tMETHOD: ', req.method);
        console.log('\tQUERY: ', req.query);
        console.log('\tBODY: ', req.body);
        console.log('\tAUTHID: ', req.authId);
      });
      next();
    });
  }

  return handler;
};

export default createHandler;
