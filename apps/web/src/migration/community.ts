// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { ChannelType, ChannelType as fbChannelType, Community, MediaUse, Permissions, Prisma, StorageLocation } from '@prisma/client';
import { upsertMedia } from '@src/api2/media';
import { getFileExtension } from '@src/utils/common_utils';
import { collection, getDocs } from 'firebase/firestore';

import { createChannel, getChannels, updateChannel } from 'api2/channel';
import { createCommunity, getCommunities, updateCommunity } from 'api2/community';
import { createMember, getMembers, updateMember } from 'api2/members';
import { getUser } from 'api2/user';
import { ChannelDocument, Collections, CommunityDocument, MemberDocument, PermissionsType, WithId } from 'types/documents';
import { db } from 'utils/firebaseClient';

/**
 * Translates firebase permission to new prisma schema
 * @param  fbPermission permission level in firebase
 * @return enum value for new prisma schema
 */
function PermissionTranslator(fbPermission : number) : Permissions {
  switch (Number(fbPermission)) {
    case PermissionsType.Anyone:
      return Permissions.EVERYONE;
    case PermissionsType.Members:
      return Permissions.MEMBER;
    case PermissionsType.Subscribers:
      return Permissions.SUBSCRIBER;
    case PermissionsType.Moderators:
      return Permissions.MODERATOR;
    case PermissionsType.Admin:
      return Permissions.ADMIN;
    case 6: //Doesn't exist unless manually entered
      return Permissions.OWNER;
    default:
      return Permissions.EVERYONE;
  }
}

/**
 * Translates firebase channel type to new prisma schema
 * @param  fbType permission level in firebase
 * @return enum value for new prisma schema
 */
function channelTypeTranslator(fbType : string) : ChannelType {
  switch (fbType) {
    case fbChannelType.CHAT:
      return ChannelType.CHAT;
    case fbChannelType.POST:
      return ChannelType.POST;
    case fbChannelType.DISCUSSION:
      return ChannelType.DISCUSSION;
    case fbChannelType.LIBRARY:
      return ChannelType.LIBRARY;
    case fbChannelType.LIVESTREAM:
      return ChannelType.LIVESTREAM;
    default:
      return ChannelType.CHAT;
  }
}

/**
 * Clone communities from firebase to primsa DB. Note, this has poor feedback in the console when it is done. 
 */
//FIXME Add Community Media
export async function CloneCommunities() {

  // Copy user's public data to supabase
  const communityRef = collection(db, Collections.Communities);
  const communitiesSnap = await getDocs(communityRef);
  const communityArray : CommunityDocument[] = [];
  communitiesSnap.forEach(async (communitySnap) => {
    const communityData = communitySnap.data() as CommunityDocument;
    communityArray.push({ ...communityData, id: communitySnap.id });
  });
  for (const communityData of communityArray) {
    const matchedUser = await getUser({ authId: communityData.owner_id });
    let thisCommunity : Community = <Community>{};
    if (communityData && communityData.owner_id) {
      const supaCommunity : Prisma.CommunityCreateInput = {
        name: communityData.name == 'My Backchannel' ? (matchedUser?.name ? `${matchedUser.name}'s Space` : '')  : communityData.name,
        fbid: communityData.id,
        description: communityData.description,
        owner: {
          connect: {
            authId: communityData.owner_id,
          },
        },
      }; 
      const matchedCommunities = await getCommunities({ owner: { authId: communityData.owner_id } });
      let communityId : bigint = BigInt(0);
      if (matchedCommunities && matchedCommunities.length) {
        thisCommunity = await updateCommunity(matchedCommunities[0].id, { ...supaCommunity, owner: undefined });
        communityId = thisCommunity?.id;
      } else {
        thisCommunity = await createCommunity(supaCommunity);
        communityId = thisCommunity?.id;
      }
      if (communityId) {
        //Add Avatar
        if (communityData.image) {
          const newMedia : Prisma.MediaCreateInput = {
            type: MediaUse.COMMUNITY_AVATAR,
            host: StorageLocation.FIREBASE,
            path: communityData.image,
            fileExtension: getFileExtension(communityData.image),
            avatarCommunity: {
              connect: {
                id: communityId,
              },
            },
          };
          upsertMedia(newMedia.type, communityId, newMedia);
        }

        //Add Banner
        if (communityData.banner) {
          const newMedia : Prisma.MediaCreateInput = {
            type: MediaUse.COMMUNITY_BANNER,
            host: StorageLocation.FIREBASE,
            path: communityData.banner,
            fileExtension: getFileExtension(communityData.banner),
            bannerCommunity: {
              connect: {
                id: communityId,
              },
            },
          };
          upsertMedia(newMedia.type, communityId, newMedia);
        }

        //Migrate Channel info
        const channelsRef = collection(db, Collections.Communities, communityData.id, Collections.Channels);
        const channelsSnap = await getDocs(channelsRef);
        channelsSnap.forEach(async (channel) => {
          const channelData = channel.data() as ChannelDocument;
          if (!channelData.profile) { //Profile posts moved off of channels
            const supaChannel: Prisma.ChannelCreateInput = {
              type: channelTypeTranslator(channelData.type),
              hidden: channelData.profile ? true : false,
              name: channelData.name,
              description: channelData.description,
              fbId: channelData.id,
              community: {
                connect: {
                  id: communityId,
                },
              },
              readPermission: PermissionTranslator(channelData.access),
              writePermission: PermissionTranslator(channelData.permissions),
            };
            const matchedChannel = await getChannels({ fbId: channelData.id, communityId: communityId });
            if (matchedCommunities && matchedChannel.length) {
              updateChannel(matchedChannel[0].id, { ...supaChannel, community: undefined });
            } else {
              createChannel(supaChannel);
            }
          }
        });

        //Migrate Membership info
        // const membersRef = collection(db, Collections.Communities, communityData.id, Collections.Members);
        // const membersSnap = await getDocs(membersRef);
        // const memberArray : MemberDocument[] = [];
        // membersSnap.forEach(async (member) => {
        //   const memberData = member.data() as MemberDocument;
        //   memberArray.push(memberData);
        // });
        // for (const memberData of memberArray) {
        //   if (matchedUser) {
        //     const supaMember: Prisma.MemberCreateInput = {
        //       user: {
        //         connect: {
        //           authId: memberData.uid,
        //         },
        //       },
        //       community: {
        //         connect: {
        //           id: communityId,
        //         },
        //       },
        //       role: PermissionTranslator(memberData.role),
        //     };
        //     const matchedMember = await getMembers({ userId: matchedUser.id, communityId: communityId });
        //     if (matchedMember && matchedMember.length > 0) {
        //       updateMember(matchedMember[0]?.userId, supaMember);
        //     } else {
        //       createMember(supaMember);
        //     }
        //   }
        // }
      } 
    }
  }
}