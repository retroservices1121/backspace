import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/solid';

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
  useEffect(() => {
    if (open && afterOpen) afterOpen();
  }, [open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      {/* TODO: Find a way to change this z-index to use global zindex */}
      <Dialog as="div" className="fixed z-10 inset-0 overflow-y-hidden" onClose={shouldCloseOnOverlayClick ? handleClose : () => {}}>
        <div className="flex items-center justify-center min-h-screen pt-4 sm:px-4 pb-20 text-center sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-canvas/80 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <div className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"> &#8203; </div>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-150"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="relative inline-block bg-surface border border-line rounded-2xl text-left overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] transform transition-all sm:align-middle font-display text-ink">
              {closeButton && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute right-3 top-3 z-10 w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:bg-hover hover:text-ink transition-colors"
                  aria-label="Close"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              )}
              {children}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
