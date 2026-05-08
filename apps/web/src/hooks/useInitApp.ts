// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import { subscribeMessages } from '@src/store/messageSlice';
import { noop } from 'lodash';

import { RootState, useAppDispatch } from 'store/store';

export default function useInitApp() {
  noop();
  // const dispatch = useAppDispatch();
  // useInitConversations(dispatch);
}
