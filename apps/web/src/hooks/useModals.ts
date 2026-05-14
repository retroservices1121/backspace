// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { toggleDrawer, toggleSubscribeModal } from 'store/appSlice';
import { toggleModal } from 'store/modalSlice';
import { useAppDispatch } from 'store/store';
import { Modals } from 'utils/constants';

// TODO Will become the new modal
export default function useModals() {
  const dispatch = useAppDispatch();
  // For now this is just linked up to the old api, so that we can start using this faster.

  return {
    toggleDrawer: () => dispatch(toggleDrawer()),
    // The CreatePost modal lives in the new modalSlice system (registered
    // by components/CreatePost/index.tsx via useRegisterModal). The old
    // appSlice.postModalOpen flag this used to dispatch was a dead end —
    // nothing rendered the composer off it, so the FAB did nothing.
    togglePost: () => dispatch(toggleModal(Modals.CreatePost, true)),
    toggleSubscribe: () => dispatch(toggleSubscribeModal()),
  };
}