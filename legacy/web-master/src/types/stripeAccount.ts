// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

export enum StripeCountries {
  Australia = 'AU',
  Canada = 'CA',
  Finland = 'FI',
  France = 'FR',
  Germany = 'DE',
  Ireland = 'IE',
  Italy = 'IT',
  Mexico = 'MX',
  Norway = 'NO',
  New_Zealand = 'NZ',
  Spain = 'ES',
  Switzerland = 'CH',
  Sweden = 'SE',
  United_Kingdom = 'GB',
  United_States = 'US',
}

export enum StripeCreateFields {
  country = 'country',
}

export type StripeCreateState = {
  [StripeCreateFields.country]: { value: StripeCountries, label: string };
};