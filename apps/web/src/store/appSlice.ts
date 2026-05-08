// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { noop } from 'lodash';

import { Themes } from 'styles/theme';

const NAMESPACE = 'app';

enum ModalNames {
  appWelcome = 'appWelcome',
  postModalOpen = 'postModalOpen',
  editModalOpen = 'editModalOpen',
  postPreviewOpen = 'postPreviewOpen',
  communitySettingsModalOpen = 'communitySettingsModalOpen',
  subscribeModal = 'subscribeModal',
  createChannelModelOpen = 'createChannelModelOpen',
  drawerOpen = 'drawerOpen',
}

type BasicModals = {
  [name in ModalNames]: boolean;
};

type AppState = BasicModals & {
  pageTitle: string;
  theme: Themes;
  editChannelModal?: {
    id: string;
  }
};

const initialModalState: BasicModals = {
  appWelcome: false,
  subscribeModal: false,
  postModalOpen: false,
  editModalOpen: false,
  postPreviewOpen: false,
  createChannelModelOpen: false,
  communitySettingsModalOpen: false,
  drawerOpen: false,
};

const initialState: AppState = {
  ...initialModalState,
  pageTitle: 'backspace',
  theme: Themes.Dark,
};

function toggleModal(modalName: keyof BasicModals) {
  return (state: AppState, action: PayloadAction<boolean | undefined>) => {
    state[modalName] = action.payload || !state[modalName];
  };
}

const appSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    setPageTitle: (state, { payload }) => {state.pageTitle = payload;},
    toggleAppWelcome: toggleModal(ModalNames.appWelcome),
    togglePostModal: toggleModal(ModalNames.postModalOpen),
    toggleEditModal: toggleModal(ModalNames.editModalOpen),
    toggleCreateChannelModal: toggleModal(ModalNames.createChannelModelOpen),
    toggleCommunitySettingsModal: toggleModal(ModalNames.communitySettingsModalOpen),
    toggleDrawer: toggleModal(ModalNames.drawerOpen),
    toggleSubscribeModal: toggleModal(ModalNames.subscribeModal),
    toggleEditChannelModal(state, { payload }: PayloadAction<{ channelId: string } | undefined>) {
      if (typeof payload?.channelId === 'string') {
        state.editChannelModal = { id: payload?.channelId };
        return state;
      }
      delete state.editChannelModal;
    },
    /** If a theme is passed, that is used. Else we swap based on state. */
    toggleTheme(state, action: PayloadAction<Themes | undefined>) {
      let update = Themes.Dark;
      if (action.payload === Themes.Light) {
        update = Themes.Light;
      }
      state.theme = update;
    },
    /** Use this when navigating to make sure all modals get closed. */
    closeAllModals(state) {
      return {
        ...state,
        ...initialModalState,
      };
    },
  },
  extraReducers: {

  },
});

export default appSlice.reducer;
export const {
  setPageTitle,
  toggleAppWelcome,
  togglePostModal,
  toggleEditModal,
  toggleCreateChannelModal,
  toggleCommunitySettingsModal,
  toggleTheme,
  closeAllModals,
  toggleSubscribeModal,
  toggleEditChannelModal,
  toggleDrawer,
} = appSlice.actions;
