import useAuthentication from '@src/hooks/useAuthenticate';
import { AuthStatus } from '@src/store/authSlice';
import Link from 'next/link';

import { APP } from 'pages';
import { ClickableSpan } from 'styles/Buttons';
import { OldRow } from 'styles/Flex';
import { Space } from 'styles/layout';

export const AuthButtons = function () {
  const authState = useAuthentication();
  if (authState === AuthStatus.SignedIn) {
    return (
      <OldRow $center>
        <Link href={APP.AUTH.LOGOUT}>
          <ClickableSpan> Logout </ClickableSpan>
        </Link>
      </OldRow>
    );
  } else {
    return (
      <OldRow $center>
        <Link href={APP.AUTH.REGISTER}>
          <ClickableSpan> Create Account </ClickableSpan>
        </Link>
        <Space />
        <Link href={APP.AUTH.LOGIN}>
          <ClickableSpan> Login </ClickableSpan>
        </Link>
      </OldRow>
    );
  }
};


