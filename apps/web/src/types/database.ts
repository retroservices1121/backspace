import { supabase } from "utils/supabaseClient";
import { Stripe as StripeOfficial } from 'stripe';
import { SimpleDate } from "./date";


export enum Tables {
  Users = 'users',
  UsersPrivate = 'users_private',
  Community = 'communities'
}


export enum OnlinePresence {
  Online = 'Online',
  Offline = 'Offline',
  Idle = 'Idle',
  Away = 'Away',
  Busy = 'Busy',
  Invisible = 'Invisible',
}

type ISOString = string;

export type UserType = {
  /** user's universal id */
  id: string;
  /** username (unique) */
  username: string;
  /** whether user is fully onboarded */
  onboarded: boolean;
  /** account creation time as ISOString */
  created_at: ISOString;
  /** account last sign-in time as ISOString */
  last_signin_at: ISOString;
  /** community featured on profile */
  featured_community: string;
  /** Public profile image */
  avatar: string;
  /** Public banner/cover image */
  banner: string;
  /** public display name*/
  display_name: string;
  /** public user description */
  description: string;
  /** online if true */
  online: OnlinePresence;
  /** status update time as ISOString*/
  online_at: ISOString;
  /** alpha code for alpha access */
  access_code: string;
  access_code_valid: boolean;
  /** account is verified */
  verified: boolean;
};

export type UserPrivateType = {
  /** user's universal id */
  id: string;
  /** account creation time as ISOString */
  created_at: ISOString;
  /** user email (matches auth) */
  email: string | null;
  /** user verified email */
  email_verified: boolean;
  /** user phone number */
  phone: string;
  /** user's legal first name */
  first_name: string;
  /** user's legal last name */
  last_name: string;
  /** user's date of birth */
  dob: SimpleDate;
  /** Stripe Account Link (creators)*/
  account_link?: StripeOfficial.AccountLink
};