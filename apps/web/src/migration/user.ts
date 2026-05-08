// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { MediaUse, Prisma, StorageLocation } from '@prisma/client';
import { upsertFollow } from '@src/api2/follow';
import { upsertUserState } from '@src/api2/userState';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import Stripe from 'stripe';

import { upsertMedia } from 'api2/media';
import { upcertPrivate } from 'api2/private';
import { upsertStripeAccount } from 'api2/stripeAccount';
import { upsertStripeCustomer } from 'api2/stripeCustomer';
import { createUser, findUserIdByAuthId, findUserIdByUsername, updateUser } from 'api2/user';
import { Collections, FollowDocument, PrivateUserDocument, UserDocument } from 'types/documents';
import { db } from 'utils/firebaseClient';

export async function CloneUsers() {

  // Copy user's public data to supabase
  const userRef = collection(db, Collections.Users);
  const usersSnap = await getDocs(userRef);
  const userArray : Array<UserDocument> = [];
  await usersSnap.forEach(async (userSnap) => {
    const user = userSnap.data() as UserDocument;
    userArray.push(user); 
  });
  for (const user of userArray) {
    try {
      if (user.username) { //Only migrate users that have a valid username
        const supaUser : Prisma.UserCreateInput = {
          username: user.username,
          name: user.display_name || user.username,       
          authId: user.id, 
          bio: user.description,
          verified: user.verified,
        }; 
        let foundUser = await findUserIdByUsername(user.username);
        if (foundUser) { //Update or create
          updateUser(BigInt(foundUser.id), supaUser);
        } else {
          foundUser = await createUser(supaUser);
        }
        if (!foundUser) continue;
        const supaStatus : Prisma.UserStateCreateInput = {
          onboarded: user.onboarded,
          user: {
            connect: {
              id: foundUser.id,
            },
          },
        };
        upsertUserState(foundUser.id, supaStatus, { ...supaStatus, user: undefined });
        if (user.profile_image) {

          const supaAvatar : Prisma.MediaCreateInput = {
            host: user.profile_image ? StorageLocation.FIREBASE : StorageLocation.NONE,
            path: user.profile_image,
            fileExtension: user.profile_image.split('.').pop() || '',
            avatarUser: {
              connect: {
                id: foundUser.id,
              },
            },
            type: MediaUse.AVATAR,
          };
          upsertMedia(supaAvatar.type, foundUser.id, supaAvatar);
        }
        if (user.banner_image) {
          const supaBanner : Prisma.MediaCreateInput = {
            host: user.banner_image ? StorageLocation.FIREBASE : StorageLocation.NONE,
            path: user.banner_image,
            fileExtension: user.banner_image.split('.').pop() || '',
            bannerUser: {
              connect: {
                id: foundUser.id,
              },
            },
            type: MediaUse.BANNER,
          };
          upsertMedia(supaBanner.type, foundUser.id, supaBanner);
        }
        
        
        //Clone this user's follows
        const followRef = collection(db, Collections.Network, user.id, Collections.Following);
        const followSnap = await getDocs(followRef);
        const followArray : Array<FollowDocument> = [];
        followSnap.forEach(async (each) => {
          const followData = each.data() as FollowDocument;
          followArray.push(followData);
        });
        for (const followData of followArray) {
          const account = await findUserIdByAuthId(followData.uid);
          if (account) {
            const supaFollow : Prisma.FollowCreateInput = {
              follower: {
                connect: {
                  id: foundUser.id,
                },
              },
              account: {
                connect: {
                  id: account.id,
                },
              },
            };
            upsertFollow(foundUser.id, account.id, supaFollow);
          } else {
            console.warn(`For follow, missing account ${followData.uid}`);
          }
        }
      } 
    } catch (error) {
      console.error(error);
    }
  }

  // Copy users private data to supabase
  const privateRef = collection(db, Collections.UsersPrivate);
  const usersPSnap = await getDocs(privateRef);
  const userPArray : Array<PrivateUserDocument> = [];
  await usersPSnap.forEach(async (userSnap) => {
    const user = userSnap.data() as PrivateUserDocument;
    userPArray.push(user);
  });
  for (const user of userPArray) {
    if (user.uid) {
      const foundUser = await findUserIdByAuthId(user.uid);
      if (foundUser?.id) {
        const supaPrivate : Prisma.PrivateCreateInput = {
          user: {
            connect: {
              id: foundUser.id,
            },
          },
          email: user.email,
          emailVerified: user.email_verified || false,
          phone: user.phone_number || undefined,
          firstName: user.first_name || undefined,
          lastName: user.last_name || undefined,
          dobMonth: user.dob?.month || undefined,
          dobDay: user.dob?.day || undefined,
          dobYear: user.dob?.year || undefined,
        }; 
        upcertPrivate(supaPrivate);

        //Clone billing/stripe over
        const accountRef = doc(db, Collections.UsersPrivate, user.uid, Collections.Stripe, 'account');
        const accountSnap = await getDoc(accountRef);
        const customerRef = doc(db, Collections.UsersPrivate, user.uid, Collections.Stripe, 'customer');
        const customerSnap = await getDoc(customerRef);
        if (accountSnap.exists()) { // User has a creator account
          const accountData = accountSnap.data() as Stripe.Account;
          const supaAccount: Prisma.StripeAccountCreateInput = {
            billing: {
              connectOrCreate: {
                where: {
                  userId: foundUser.id,
                },
                create: {
                  userId: foundUser.id,
                },
              },
            },
            accountId: accountData.id,
          };
          upsertStripeAccount(accountData.id, supaAccount);
        }
        if (customerSnap.exists()) { // User has a creator account
          const customerData = customerSnap.data() as Stripe.Account;
          const supaCustomer: Prisma.StripeCustomerCreateInput = {
            billing: {
              connectOrCreate: {
                where: {
                  userId: foundUser.id,
                },
                create: {
                  userId: foundUser.id,
                },
              },
            },
            customerId: customerData.id,
          };
          upsertStripeCustomer(customerData.id, supaCustomer);
        }
      }
    }
  }
  console.log('done cloning users');
  return;
}