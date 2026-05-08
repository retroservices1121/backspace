import { SimpleDate } from 'types/documents';

export enum LoginFields {
  Email = 'email',
  Password = 'password',
  RememberMe = 'rememberMe',
}

export type LoginFormState = {
  [LoginFields.Email]: string;
  [LoginFields.Password]: string;
  [LoginFields.RememberMe]: boolean;
};


export enum RegisterFields {
  Email = 'email',
  Password = 'password',
}

export type RegisterFormState = {
  [RegisterFields.Email]: string;
  [RegisterFields.Password]: string;
};

export enum ForgotPasswordFields {
  Email = 'email',
}

export type ForgotPasswordState = {
  [ForgotPasswordFields.Email]: string;
};

export enum OnboardingFields {
  ProfilePic = 'profilePic',
  Username = 'username',
  Firstname = 'firstname',
  Lastname = 'lastname',
  DateOfBirth = 'dateOfBirth',
}

export type OnboardingFormState = {
  // Idk what type we'll use here yet
  [OnboardingFields.ProfilePic]: File | null;
  [OnboardingFields.Username]: string;
  [OnboardingFields.Firstname]: string;
  [OnboardingFields.Lastname]: string;
  [OnboardingFields.DateOfBirth]: SimpleDate | null;
};
