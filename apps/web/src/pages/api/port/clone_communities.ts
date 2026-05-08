// Next.js API route support: https://nextjs.org/docs/api-routes/introduction



import { CloneCommunities } from 'migration/community';
import type { NextApiRequest, NextApiResponse } from 'next';
import { resolve } from 'path';


type Data = {
  user: any,
  error?: string
};

const communities = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const {
    query, 
    method,
    body,
  } = req;
  
  CloneCommunities();
  res.status(200).end();
  resolve();
  
};

export default communities;
