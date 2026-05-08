// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import useConstructor from 'hooks/useConstructor';

import Modal, { ModalProps } from './modal';
import { actions, ModalId } from './modalSlice';
import { ModalState } from './modalSlice';

/** Exported for convenience, but prefer to use useModal instead of direct access */
const SelectModals = (state: { modals: ModalState }) => state.modals.modals;

type ControlledProps = Omit<ModalProps, 'open' | 'handleClose'> & {
  onBeforeClose?: () => void | Promise<void>;
};

type ControlledModal<InjectedProps = {}> = React.VFC<ControlledProps> & {
  open(): void;
  close(): void;
  props?: InjectedProps;
};

export function useRegisterModal<InjectedProps = {}>(id: ModalId, open?: boolean) {
  const dispatch = useDispatch();
  useConstructor(() => dispatch(actions.registerModal({ id, open })));
  const modal = useSelector(SelectModals)[id];

  const HocModal: ControlledModal<InjectedProps> = (props) => (
    <Modal
      {...props}
      open={modal?.open || false}
      handleClose={() => {
        props?.onBeforeClose?.();
        HocModal.close();
      }}
    />
  );

  HocModal.open = (props?: InjectedProps) => {dispatch(actions.toggle({ id, open: true, props }));};
  HocModal.close = () => {dispatch(actions.toggle({ id, open: false }));};
  HocModal.props = modal.props as InjectedProps;

  return HocModal;
}

export function useModal<InjectedProps = {}>(id: ModalId) {
  const dispatch = useDispatch();
  const modal = useSelector(SelectModals)?.[id];
  return {
    props: modal?.props as InjectedProps || {},
    toggle: (open: boolean) => {dispatch(actions.toggle({ id, open }));},
    open: (props?: InjectedProps) => {dispatch(actions.toggle({ id, open: true, props }));},
    close: () => {dispatch(actions.toggle({ id, open: false }));},
  };
}
