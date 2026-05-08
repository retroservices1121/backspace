// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

export enum CommunityInfoFields {
  ProfilePic = 'profilePic',
  BannerPic = 'bannerPic',
  Name = 'name',
  Description = 'description',
}

export type CommunityInfoState = {
  [CommunityInfoFields.ProfilePic]?: File | string;
  [CommunityInfoFields.BannerPic]?: File | string;
  [CommunityInfoFields.Name]?: string;
  [CommunityInfoFields.Description]?: string;
};