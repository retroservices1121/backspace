// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Destination as DestinationType } from 'pages/modals/PostModal/components/PostDestinationField';
import { PermissionsType } from 'shared/types/documents';

export enum Sort {
  Discover = 'discover',
  Following = 'following',
  Recent = 'timestamp',
  Memberships = 'memberships',
  Profile = 'profile',
}

export enum PostFormFields {
  Title = 'title',
  Caption = 'text',
  CommentsDisabled = 'commentsDisabled',
  PermissionsRequired = 'permissionsRequired',
  Tags = 'tags',
  Profile = 'profile',
  Destination = 'destination',
}

export type PostFormState = {
  [PostFormFields.Title]: string;
  [PostFormFields.Caption]: string;
  [PostFormFields.CommentsDisabled]: boolean;
  [PostFormFields.PermissionsRequired]: PermissionsType;
  [PostFormFields.Tags]: string[];
  [PostFormFields.Profile]: boolean;
  [PostFormFields.Destination]: DestinationType;
};

export enum Categories {
  All = '',
}

export const Subcategories = {
  [Categories.All]: [
    'Animals and Pets',
    'Arts and Culture',
    'Aviation',
    'Boating',
    'Business',
    'Buy and Sell',
    'Cars',
    'Cars and Motorcycles',
    'Crypto',
    'Dance',
    'Entrepreneurship',
    'Fashion',
    'Finance',
    'Fishing',
    'Food',
    'Friends',
    'Friends & Family',
    'Funny',
    'Games',
    'Health and Fitness',
    'Hobby and Leisure',
    'Home and Garden',
    'Identity and Relationships',
    'Lgbtqia+',
    'Local',
    'Motorsport',
    'Movies and TV',
    'Music',
    'NFT',
    'Neighborhood and Community',
    'Outdoor Activities',
    'Parenting',
    'Photography',
    'Professional Networking',
    'Racing',
    'Recommended',
    'Religion',
    'School and Education',
    'Science and Tech',
    'Spiritual and Inspirational',
    'Sports',
    'Stocks',
    'Style',
    'Support and Comfort',
    'Support group',
    'Travel and Places',
    'Trending Topics',
  ],
};
