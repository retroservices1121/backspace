// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';

import { subscribeConversations } from 'store/directMessageSlice';
import { RootState } from 'store/store';


function useInitConversations(dispatch: ThunkDispatch<RootState, void, AnyAction>) {
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  useEffect(() => {
    if (isLoggedIn) dispatch(subscribeConversations());
  }, [isLoggedIn]);
}


export default function useInitApp() {
  const dispatch = useDispatch();
  useInitConversations(dispatch);
}