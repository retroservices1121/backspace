// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { doc, getDoc } from 'firebase/firestore';

import { FollowDocument } from 'shared/types/documents';
import { db } from 'util/firebase';

//TODO move this to the proper spot
export const getFollowByPath = async (path: string) => {
  const docRef = doc(db, path);
  let document = await getDoc(docRef);
  if (document.exists()) {
    return document.data() as FollowDocument;
  } else {
    return {} as FollowDocument;
  }
};