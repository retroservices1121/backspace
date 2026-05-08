// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { getUserByUsername } from 'api/userAPI';
import useStripeCustomer from 'hooks/useStripeCustomer';
import go from 'lib/async';
import { isAdmin } from 'shared/common_utils';
import { Collections, PrivateUserDocument } from 'shared/types/documents';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';
import { ButtonLarge } from 'styles/Buttons';
import { Col, Row } from 'styles/Flex';
import { Space } from 'styles/layout';
import app, { db } from 'util/firebase';


function useAdminStripe() {
  const { customer } = useStripeCustomer();
  const [stripeStatus] = useState(!!customer.id);
  /** Fixes stripe objects for old users */
  const fixStripe = async (userId: string | undefined) => {
    if (userId) {
      const functions = getFunctions(app);
      const createNewStripeCustomer = httpsCallable(functions, 'NewStripeCustomer');
      const toastId = toast.loading('Creating Stripe Customer');
      const res = await go(createNewStripeCustomer({ uid: userId }));
      console.log('res', res);
      if (res.type === 'error') {
        console.error(res.error);
        toast.update(toastId, {
          render: 'ERROR creating stripe customer',
          isLoading: false,
          autoClose: 5000,
        });
      }

      if (res.type === 'success') {
        toast.update(toastId, {
          render: `Result: ${res?.data}`,
          isLoading: false,
          autoClose: 5000,
        });
      }
      // const stripeDocs = new FireDB<Stripe.Customer>(`${Collections.UsersPrivate}/${authId}/${Collections.Stripe}`);
      // NewStripeCustomer
    }
  };

  return {
    stripeStatus, fixStripe,
  };
}

type Props = {};

const index: React.FC<Props> = ({}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { id: uid } = useSelector((state: RootState) => state.user);
  const [foundUser, setFoundUser] = useState<User>();
  

  const findUser = async () => {
    const username = inputRef.current?.value;
    if (username) {
      const user = await getUserByUsername(username);
      if (!user) {
        setFoundUser(undefined);
        toast.warn('User not found');
      } else {
        console.log(user);
        setFoundUser(user);
      } 
    }
  };

  const checkEnter = async (event: any) => {
    if (event?.keyCode === 13) {
      findUser();
    }
  };

  const disableAuth = async (id: string, removeContent: boolean = false) => {
    const functions = getFunctions();
    const fbFunction = httpsCallable(functions, 'accountDisable');
    const toastId = toast.loading('Disabling User');
    return fbFunction({ uid: id, removeContent })
      .then((result) => toast.update(toastId, {
        render: `Result: ${result?.data}`,
        isLoading: false,
        autoClose: 5000,
      }))
      .catch((error) => {console.error(error); toast.error('Failed to disable account');});
  };

  const getAllEmails = async () => {
    const userRef = collection(db, Collections.UsersPrivate);
    const usersSnap = await getDocs(userRef);
    const result : PrivateUserDocument[] = [];
    usersSnap.forEach((doc) => {
      result.push(doc.data() as PrivateUserDocument);
    });
    
    let content = '';
    result.map((each) => {
      content += `${each.email}, ${each.first_name}, ${each.last_name}, \n`;
    });
    // any kind of extension (.txt,.cpp,.cs,.bat)
    let filename = 'emailList.txt';

    const file = new File([content], filename, {
      type: 'text/plain',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(file);
  
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const { fixStripe, stripeStatus } = useAdminStripe();

  return (
    <Col $center>
      {isAdmin(uid)
        ? <Col $center>
            <h1>Admin Access</h1>
            <Space direction="column" />
            <Row>
              <input ref={inputRef} placeholder='Search Username' onKeyDown={checkEnter}/>
              <Space />
              <ButtonLarge onClick={() => findUser() }>Search</ButtonLarge>
            </Row>
            <div className="flex flex-col m-5 p-5 border-2 rounded">
              <h3>id: {foundUser?.id}</h3>
              <p>username: {foundUser?.username}</p>
              <p>name: {foundUser?.display_name}</p>
              <p>creation: {foundUser?.creation && (foundUser.creation as Timestamp).toDate().toDateString()}</p>
              <p>last online: {foundUser?.online_last_update && (foundUser.online_last_update as Timestamp).toDate().toDateString()}</p>
              <p>Stripe: {stripeStatus ? 'ok' : 'Potentially busted'}</p>
            </div>
            <div className="flex flex-row m-5 p-5">
              <ButtonLarge disabled={!foundUser} className="mx-5" color={'error'}
                onClick={() => {if (foundUser) disableAuth(foundUser.id, true); }}>
                Disable and Remove All Content
              </ButtonLarge>
              <ButtonLarge disabled={!foundUser} className="mx-5" color={'error'}
                onClick={() => {if (foundUser) disableAuth(foundUser.id); }}>
                Disable Auth
              </ButtonLarge>
              <ButtonLarge disabled={!foundUser} className="mx-5" onClick={() => fixStripe(foundUser?.id)}>
                Fix Stripe
              </ButtonLarge>
            </div>
            <div className="flex flex-row m-5 p-5">
            </div>
            <div className="flex flex-row m-5 p-5">
              <ButtonLarge className='mx-auto my-5' onClick={getAllEmails}>Get All Emails</ButtonLarge>
            </div>
            
          </Col>
        : <h1>You are not an admin</h1>
      }
    </Col>
  );
};

export default index;
