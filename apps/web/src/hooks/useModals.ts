// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { toggleDrawer, togglePostModal, toggleSubscribeModal } from 'store/appSlice';
import { useAppDispatch } from 'store/store';

// TODO Will become the new modal
export default function useModals() {
  const dispatch = useAppDispatch();
  // For now this is just linked up to the old api, so that we can start using this faster.

  return {
    toggleDrawer: () => dispatch(toggleDrawer()),
    togglePost: () => dispatch(togglePostModal()),
    toggleSubscribe: () => dispatch(toggleSubscribeModal()), 
  };
}