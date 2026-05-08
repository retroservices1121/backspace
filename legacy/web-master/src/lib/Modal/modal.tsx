// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/solid';
import { useTheme } from 'styled-components';

const backdrop = (
  <Transition.Child
    as={Fragment}
    enter="ease-out duration-300"
    enterFrom="opacity-0"
    enterTo="opacity-100"
    leave="ease-in duration-200"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
  >
    <div className="fixed inset-0 bg-black/75 transition-opacity" aria-hidden />
  </Transition.Child>
);

/* This element is to trick the browser into centering the modal contents. */
const center = (
  <div className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden> &#8203; </div>
);

export type ModalProps = {
  open: boolean;
  handleClose: () => void;
  children: JSX.Element;

  shouldCloseOnOverlayClick?: boolean;
  closeButton?: boolean;
};

// TODO no clue why transitions broke.

/**
 * Same modal as ModalV2 but without onAfterOpen and conditionally rendering children.
 * 
 * This should shift all responsibility over to the children. 
 */
const Modal: React.VFC<ModalProps> = ({
  handleClose,
  children,
  open = false,
  shouldCloseOnOverlayClick = true,
  closeButton = true,
}) => {
  const theme = useTheme();
  const onClose = shouldCloseOnOverlayClick ? handleClose : () => { };
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed z-10 inset-0 overflow-y-hidden" onClose={onClose}>
        <div className="flex items-center justify-center min-h-screen text-center sm:p-0">
          {backdrop}

          {center}

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-150"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              style={{ background: theme.backgroundNormal }}
              className="inline-block rounded-2xl text-left overflow-hidden shadow-xl sm:align-middle
              transform transition-all"
            >
              {closeButton && <XIcon className="absolute right-4 top-4 w-8 cursor-pointer" onClick={handleClose} />}
              {/* children doesn't render until modal is open */}
              {open && children}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default Modal;
