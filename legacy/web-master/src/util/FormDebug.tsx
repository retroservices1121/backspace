import React, { useEffect } from 'react';
import { useFormikContext } from 'formik';

import { debugColor } from 'styles/theme';


type Props = {
  name?: string
};

export const FormDebug: React.FC<Props> = ({
  name = 'FormDebug',
}) => {
  const { values } = useFormikContext();
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line
      console.log(`<%c${name}%c>`, `color: ${debugColor}`, '', values);
    }
  }, [values]);

  return null;
};