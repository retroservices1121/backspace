import { useEffect } from 'react';

export default function useAttribution() {
  useEffect(() => {
    console.groupCollapsed('%c ©️ Copyright Attributions ©️ ', 'color: black; background: white;');
    console.log('Login/Register Lottie Animation Created by Bashir Ahmed.');
    console.groupEnd();
  }, []);
}