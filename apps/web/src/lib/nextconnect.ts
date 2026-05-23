// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Author(s): See Git History
//
// Auth middleware. End-user access tokens are verified by whichever auth
// provider is configured at runtime:
//   - CDP   when CDP_API_KEY_ID is set (preferred; post-migration default)
//   - Privy when PRIVY_APP_ID is set   (legacy; pre-migration fallback)
//
// The selection is per-process, not per-request, so a Railway env-var
// flip is enough to switch providers. The User.authId column stores
// the provider's stable user id (Privy DID 'did:privy:...' or CDP
// end-user UUID); the rest of the codebase treats authId as opaque.

import { verifyCdpToken, verifyPrivyToken } from '@backspace/auth';
import chalk from 'chalk';
import HttpStatus from 'http-status-codes';
import { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import nc, { ErrorHandler, Middleware, NoMatchHandler, Options } from 'next-connect';

import { isDevelopment } from '@src/utils/common_utils';

const colorArray = [chalk.cyan, chalk.yellow, chalk.magenta];

type ExtReq = Req & {
  authId: string;
};

type RequestBase = {
  body?: any;
  query?: any;
};

export type Request<Params extends RequestBase> = Required<Params>;

// CDP creds take priority — if the project has migrated, the Privy
// env vars typically stay set during the rollout window but should
// be ignored.
const CDP_API_KEY_ID = process.env.CDP_API_KEY_ID;
const CDP_API_KEY_SECRET = process.env.CDP_API_KEY_SECRET;
const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;

const useCdp = Boolean(CDP_API_KEY_ID && CDP_API_KEY_SECRET);

const validate = async (token: string): Promise<string | null> => {
  if (useCdp) {
    try {
      const user = await verifyCdpToken(token, {
        apiKeyId: CDP_API_KEY_ID!,
        apiKeySecret: CDP_API_KEY_SECRET!,
      });
      return (user as { userId: string }).userId;
    } catch {
      console.warn('Not able to verify CDP token');
      return null;
    }
  }

  if (PRIVY_APP_ID && PRIVY_APP_SECRET) {
    try {
      const claims = await verifyPrivyToken(token, {
        appId: PRIVY_APP_ID,
        appSecret: PRIVY_APP_SECRET,
      });
      return claims.userId;
    } catch {
      console.warn('Not able to verify Privy token');
      return null;
    }
  }

  // Neither provider configured — every request 401s, surface it in the
  // log so an operator knows the env is incomplete rather than thinking
  // tokens are bad.
  console.warn(
    'Auth provider not configured: set CDP_API_KEY_ID+CDP_API_KEY_SECRET or PRIVY_APP_ID+PRIVY_APP_SECRET',
  );
  return null;
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
