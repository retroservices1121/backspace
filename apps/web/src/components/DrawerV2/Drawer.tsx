//import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { Transition } from '@headlessui/react';

//import { toggleDrawer } from 'store/appSlice';
import { RootState } from 'store/store';

import { Content, DrawerContainer, DrawerContent } from './styled';

type DrawerProps = {
  children?: any | any[],
};

export default function Drawer({ children }: DrawerProps) {
  const { drawerOpen } = useSelector((state: RootState) => state.app);
  //const dispatch = useDispatch();

  return (
    <DrawerContainer className="fixed h-full overflow-auto">

      {/* Background Overlay */}
      {/*
      <Transition
        show={drawerOpen}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div onClick={() => {dispatch(toggleDrawer());}} className="fixed bg-black z-0 bg-opacity-75 h-screen w-screen"/> 
      </Transition>
        */}

      {/* Drawer */}
      <Transition
        show={drawerOpen}
        enter="ease-out duration-300"
        enterFrom="opacity-0 -translate-x-96"
        enterTo="opacity-100 translate-y-0 sm:scale-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
        leaveTo="opacity-0 -translate-x-96"
      >
        <DrawerContent className="h-screen flex flex-col w-screen">
          <Content className="flex-grow pb-32 py-3 px-4 rounded-r-2xl transform transition-all">
            {children}
          </Content>
        </DrawerContent>
      </Transition>

    </DrawerContainer>
  );
}
