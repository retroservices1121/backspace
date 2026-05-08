// // Copyright 2022 NewSocial Inc. - All Rights Reserved
// // Unauthorized copying of this file, via any medium is strictly prohibited
// // Proprietary and confidential
// // Author(s): See Git History

import { getDownloadURL, getStorage, listAll, ref, StorageReference } from 'firebase/storage';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from 'utils/supabaseClient';

export {};

// type Data = {
//   user: any,
//   error?: string
// };

// function shipAvatarMedia(userId: string, storageRef: StorageReference) {
//   // download directly:
//   const xhr = new XMLHttpRequest();
//   xhr.responseType = 'blob';
//   xhr.onload = (event) => {
//     const blob = xhr.response;
//   };
//   //  xhr.open('GET', await getDownloadURL(storageRef));
//   xhr.send();

// // function shipAvatarMedia(userId: string, storageRef: StorageReference) {
// //   // download directly:
// //   const xhr = new XMLHttpRequest();
// //   xhr.responseType = 'blob';
// //   xhr.onload = (event) => {
// //     const blob = xhr.response;
// //   };
// //   xhr.open('GET', await getDownloadURL(storageRef));
// //   xhr.send();

// const media = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
//   const {
//     query, 
//     method,
//     body,
//   } = req;
//   console.log('Attempting to clone avatars over');

//   //** Clone avatars over */
//   const storage = getStorage();
//   const listRef = ref(storage, 'users');
//   listAll(listRef)
//     .then((result) => {
//       console.log(result);
//       result.prefixes.forEach((prefixRef) => {
//         listAll(prefixRef).then((resultNested) => {
//           const userId = prefixRef.name;
//           console.log('uid: ', userId);
//           resultNested.items.forEach((item) => {
//             console.log('cloning: ', item.fullPath);
//             shipAvatarMedia(userId, item);
//           });
//         });
//       });
//     });

//   //** Send to supabase */
//   // const avatarFile = event.target.files[0]
//   // const { data, error } = await supabase
//   //   .storage
//   //   .from('avatars')
//   //   .upload(`avatar1.png`, avatarFile, {
//   //     cacheControl: '3600',
//   //     upsert: false
//   //   })
  
// //   res.status(200);
  
// };
