import { NavLink } from 'lib/routing';
import { APP } from 'pages';
import { User } from 'store/userSlice';
import { ClickableSpan } from 'styles/Buttons';
import { Row } from 'styles/Flex';
import { Space } from 'styles/layout';

type AuthButtonProps = {
  user: User;
};

export const AuthButtons = function ({ user }: AuthButtonProps) {
  if (user.isLoggedIn) {
    return (
      <Row $center>
        <NavLink exact to={APP.AUTH.LOGOUT}>
          <ClickableSpan> Logout </ClickableSpan>
        </NavLink>
      </Row>
    );
  } else {
    return (
      <Row $center>
        <NavLink exact to={APP.AUTH.REGISTER}>
          <ClickableSpan> Create Account </ClickableSpan>
        </NavLink>
        <Space />
        <NavLink exact to={APP.AUTH.LOGIN}>
          <ClickableSpan> Login </ClickableSpan>
        </NavLink>
      </Row>
    );
  }
};


