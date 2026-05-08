import { SimpleDate } from 'types/documents';

export enum AccountFields {
  ProfilePic = 'profile_image',
  BannerPic = 'banner_image',
  Username = 'username',
  DisplayName = 'display_name',
  Description = 'description',
  // Private
  Lastname = 'last_name',
  Firstname = 'first_name',
  Email = 'email',
  PhoneNumber = 'phone_number',
  DateOfBirth = 'dob',
}

export type AccountFormState = {
  [AccountFields.ProfilePic]: File | null;
  [AccountFields.BannerPic]: File | null;
  [AccountFields.Username]: string;
  [AccountFields.DisplayName]: string;
  [AccountFields.Description]: string;
  // Private
  [AccountFields.Firstname]: string;
  [AccountFields.Lastname]: string;
  [AccountFields.Email]: string;
  [AccountFields.PhoneNumber]: string;
  [AccountFields.DateOfBirth]: SimpleDate | undefined;
};

export enum SecurityFields {
  CurrentPassword = 'current_password',
  NewPassword = 'new_password',
  ConfirmPassword = 'confirm_password',
}

export type SecurityFormState = {
  [SecurityFields.NewPassword] : string;
  [SecurityFields.ConfirmPassword] : string;
};
