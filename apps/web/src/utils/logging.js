// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Redux User Slice (Redux store)

import { addDoc, collection, Timestamp } from 'firebase/firestore';
import log from 'loglevel';

// interface LogLevel {
//     TRACE: 0;
//     DEBUG: 1;
//     INFO: 2;
//     WARN: 3;
//     ERROR: 4;
//     SILENT: 5;
// }

// Setup server logging and google analytics
const originalFactory = log.methodFactory;
log.methodFactory = function (methodName, logLevel, loggerName = 'main') {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);

  return async (_message, _functionName = null) => {
    const message = _functionName ? `${methodName.toUpperCase()} -> ${_functionName}\n${_message}` : _message;
    rawMethod(message);
    // Write to database, all error log messages
    if (logLevel >= 4) {
      try {
        const docRef = await addDoc(collection(db, 'events'), {
          method_name: methodName,
          log_level: logLevel,
          message,
          createdAt: Timestamp.now(),
        });
        console.log('Document written with ID: ', docRef.id);
      } catch (e) {
        console.error('Error adding document: ', e);
      }
    }
  };
};
log.setLevel(log.getLevel()); // Be sure to call setLevel method in order to apply plugin

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  // dev code
  console.log('Configured for Debugging');
  log.setLevel('debug');
} else {
  // production code
  console.log('Configured for Production');
  log.disableAll();
}
