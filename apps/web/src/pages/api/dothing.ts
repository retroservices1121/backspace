// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History



import createHandler from '@src/lib/nextconnect';
import { Collections, PrivateUserDocument } from '@src/types/documents';
import { db } from '@src/utils/firebase';
import { collection, getDocs } from 'firebase/firestore';


// ----- This gets a list of all users and their emails for a mailing list
const handler = createHandler();

handler
  .get(async (req, res) => {    
    const userRef = collection(db, Collections.UsersPrivate);
    const usersSnap = await getDocs(userRef);
    const result : PrivateUserDocument[] = [];
    usersSnap.forEach((doc) => {
      result.push(doc.data() as PrivateUserDocument);
    });
    
    const list = result.map((each) => {
      return `${each.first_name}, ${each.last_name}, ${each.email}`;
    });

    return res.json(list);
  });

export default handler;