import React from 'react';
import { useSelector } from 'react-redux';

import { logoutUser } from 'api/auth';
import { Redirect } from 'lib/routing';
import { APP } from 'pages';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';
import { Button } from 'styles/Buttons';

type Props = {
  user: User;
};

/**@deprecated Marked as deprecated since this is just for development */
const TemporaryLogout: React.FC<Props> = ({}) => {
  const authenticatedUser = useSelector((state: RootState) => state.user); 
  
  return (
    authenticatedUser.isLoggedIn ? (
      <div style={{ marginTop: '50px' }}>
        {authenticatedUser.username 
          ? 
        <>
          <h5 style={{ color: 'white' }}>Currently is signed in as:</h5>
          <div>{authenticatedUser.username}</div>
        </>
          :
        <div>Currently logged in.</div>
        }
        <br />
        <Button onClick={() => logoutUser()}>Logout</Button>
      </div>
    ) : (
      <Redirect to={APP.AUTH.LOGIN}/>
    )
  );
};

export default TemporaryLogout;
