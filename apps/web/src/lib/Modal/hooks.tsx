// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';

import createParamSelector from 'hooks/createParamSelector';
import { useSingleton } from 'hooks/useSingleton';
import { RootState, useAppDispatch } from 'store/store';

import { actions, ModalId } from '../../store/modalSlice';
import Modal, { ModalProps } from './modal';

/** Exported for convenience, but prefer to use useModal instead of direct access */
export const useSelectModalById = createParamSelector((state: RootState, modalId: ModalId) => {
  return state.modals.modals[modalId];
});

type ControlledProps = Omit<ModalProps, 'open' | 'handleClose'>;

type ControlledModal = React.VFC<ControlledProps> & {
  open(): void;
  close(): void;
};

export function useRegisterModal(id: ModalId, open?: boolean, onClose?: () => void) {
  const dispatch = useAppDispatch();
  useSingleton(id.toString(), () => dispatch(actions.registerModal({ id, open })));
  const modal = useSelectModalById(id);

  /** Allow for clean up on close */
  const closeHandler = () => {
    if (onClose) {
      onClose();
    } else {
      HocModal.close();
    }
  };

  const HocModal: ControlledModal = (props) => (
    <Modal
      {...props}
      open={modal?.open || false} //Resolves a race condition to put ?.open
      handleClose={closeHandler}
    />
  );

  HocModal.open = () => {dispatch(actions.toggle({ id, open: true }));};
  HocModal.close = () => {dispatch(actions.toggle({ id, open: false }));};

  return HocModal;
}

export function useModal(id: ModalId) {
  const dispatch = useAppDispatch();
  return {
    toggle: (open: boolean) => {dispatch(actions.toggle({ id, open }));},
    open: () => {dispatch(actions.toggle({ id, open: true }));},
    close: () => {dispatch(actions.toggle({ id, open: false }));},
  };
}
