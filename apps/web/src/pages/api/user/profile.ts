// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { getUserByUsernameWithProfile } from '@src/api2/user';
import { NextApiRequest, NextApiResponse } from 'next/types';
import { resolve } from 'path';

//import { getUser, getUserByUsername } from 'lib/user';
//import { UserType } from 'types/database';
import { UserResponse } from 'types/requests/user';


const Profile = async (req: NextApiRequest, res: NextApiResponse<UserResponse>) => {

  /** Possible verbs POST, GET, PUT, PATCH, DELETE */
  switch (req.method) {
    case 'GET':
      const usernameFromRequest = req.query.username;
      console.log(usernameFromRequest);
      if (usernameFromRequest) {
        const user = await getUserByUsernameWithProfile(usernameFromRequest as string, false);

        //FIXME: Brenton is lazy
        //@ts-ignore
        res.status(200).json({ user: user });
        resolve();
      }


      break;
    case 'POST':
    case 'PUT':
    case 'DELETE':
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      //console.error(`Method ${method} Not Allowed`);
      //res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }

};

export default Profile;
