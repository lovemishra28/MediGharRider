/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Global error handler to prevent hard crashes from uncaught JavaScript errors.
const errorUtils = global.ErrorUtils;

if (errorUtils && typeof errorUtils.setGlobalHandler === 'function') {
  const defaultErrorHandler = errorUtils.getGlobalHandler();

  errorUtils.setGlobalHandler((error, isFatal) => {
    console.log('Caught global error:', error, 'isFatal:', isFatal);

    if (defaultErrorHandler) {
      defaultErrorHandler(error, isFatal);
    }
  });
}

AppRegistry.registerComponent(appName, () => App);

