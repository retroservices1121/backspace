// First-run profile setup. Runs after Privy sign-in but before
// the app shell unlocks — claims a handle, captures display
// name + dob, and (if a waitlist row exists for the email)
// honors the reservation.

import React, { useEffect } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { toast } from 'react-toastify';
import useConstructor from '@src/hooks/useConstructor';
import { useOnboarding } from '@src/hooks/useOnboarding';
import { fetchUser } from '@src/store/userSlice';
import AuthLayout from 'layouts/authLayout';
import { useRouter } from 'next/router';

import OnboardingForm from 'components/Auth/OnboardingForm';
import { logEventScreen, Screens } from 'lib/events';
import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { RootState, useAppDispatch, useAppSelector } from 'store/store';
import { OnboardingFormState } from 'types/auth';

const pageTitle = 'Finish setting up';

const Onboarding: ReactLayoutComponentType = ({}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const onboard = useOnboarding();
  const auth = useAppSelector((state: RootState) => state.auth);

  useConstructor(() => {
    dispatch(setPageTitle(pageTitle));
    logEventScreen(Screens.Onboarding);
  });

  const handleSubmitOnboarding = async (data: OnboardingFormState) => {
    const toastId = toast.loading('Checking Username');
    try {
      const usernameCheck = await onboard.checkUsername(data.username);
      if (!usernameCheck) {
        toast.update(toastId, {
          render: 'Username is taken :(',
          type: 'error',
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }
      toast.update(toastId, {
        render: 'Creating Account',
      });
      const success = await onboard.submit(data);
      if (success) {
        dispatch(fetchUser(auth?.authId));
        toast.update(toastId, {
          render: 'Account Created',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
        router.push(APP.INDEX);
      } else {
        toast.update(toastId, {
          render: 'An error occurred, please refresh the page and try again',
          type: 'error',
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (err) {
      // Any thrown error (a failed API call, etc.) must still resolve
      // the loading toast — otherwise it spins forever and the user is
      // stuck with no feedback. Surface the server's message when it
      // gave one (e.g. the private-beta waitlist gate's 403).
      console.error('Onboarding submit failed', err);
      const serverMessage =
        (err as any)?.response?.data?.message ??
        'An error occurred, please refresh the page and try again';
      toast.update(toastId, {
        render: serverMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  useEffect(() => {
    if (onboard.isOnboarded === false) {
      router.push(APP.INDEX);
    }
  }, [onboard.isOnboarded]);

  return (
    <>
      <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-ink">
        Finish setting up
      </h1>
      <p className="mt-2 text-[14px] text-ink-2 leading-snug">
        Claim your handle and a few basics. You can refine the rest from
        settings later.
      </p>

      <div className="mt-5">
        <OnboardingForm
          onSubmit={handleSubmitOnboarding}
          initialUsername={onboard.reservedUsername}
        />
      </div>
    </>
  );
};

Onboarding.Layout = AuthLayout;

export default Onboarding;
