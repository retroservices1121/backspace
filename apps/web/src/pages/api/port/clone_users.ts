// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { CloneUsers } from 'migration/user';
import type { NextApiRequest, NextApiResponse } from 'next';
import { resolve } from 'path';

type Data = {
  user: any,
  error?: string
};

const user = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const {
    query, 
    method,
    body,
  } = req;
  
  CloneUsers();
  res.status(200).end();
  resolve();
  
};

export default user;
