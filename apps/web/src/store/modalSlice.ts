// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createSlice } from '@reduxjs/toolkit';
import { PayloadAction } from '@reduxjs/toolkit';

/** Either string of number which are the two valid enum types */
export type ModalId = string | number;

type Modal = {
  open: boolean;
  id: ModalId;
};

type ModalState = {
  modals: {
    [name: ModalId]: Modal
  }
};

const NAMESPACE = 'modals';

const initialState: ModalState = {
  modals: {},
};

type RegisterModal = Omit<Modal, 'open'> & { open?: boolean };

const modalSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    /** Register a modal an ID and optionally default state. */
    registerModal(state, { payload: { id, open = false } }: PayloadAction<RegisterModal>) {
      state.modals[id] = { id, open };
    },
    /** Toggles a given modal, if it has been registered */
    toggle(state, { payload: { id, open } }: PayloadAction<{ id: ModalId; open?: boolean; }>) {
      if (state.modals[id]) {
        if (open === undefined) {
          state.modals[id].open = !state.modals[id].open;
        } else {
          state.modals[id].open = open;
        }
      } else {
        // eslint-disable-next-line no-console
        console.error(`Attempted to ${open ? 'open' : 'close'} the ${id} modal, which has not been registered`);
      }
    },
  },
});

export default modalSlice.reducer;
export const actions = modalSlice.actions;

/** Dispatch-able modal toggle */
export const toggleModal = (id: ModalId, open?: boolean) => actions.toggle(({ id, open }));
