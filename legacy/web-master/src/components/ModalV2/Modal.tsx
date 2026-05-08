import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/solid';
import { useTheme } from 'styled-components';

import { CenterModalTrick } from './styled';

interface OwnProps {
  open: boolean,
  shouldCloseOnOverlayClick?: boolean,
  closeButton?: boolean,
  handleClose: () => void,
  afterOpen?: () => void,
  children: JSX.Element,
}

export default function Modal({
  open,
  handleClose,
  afterOpen,
  children,
  shouldCloseOnOverlayClick = true,
  closeButton = true,
}: OwnProps) {
  const theme = useTheme();

  useEffect(() => {
    if (open && afterOpen) afterOpen();
  }, [open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      {/* TODO: Find a way to change this z-index to use global zindex */}
      <Dialog as="div" className="fixed z-10 inset-0 overflow-y-hidden" onClose={shouldCloseOnOverlayClick ? handleClose : () => {}}>
        <div className="flex items-center justify-center min-h-screen pt-4 pb-20 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <CenterModalTrick aria-hidden="true"> &#8203; </CenterModalTrick>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-150"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div style={{ background: theme.backgroundNormal }} className="inline-block rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:align-middle">
              {closeButton && <XIcon className="absolute right-4 top-4 w-8 cursor-pointer" onClick={handleClose} />}
              {children}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
