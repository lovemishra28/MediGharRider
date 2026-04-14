/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { useAuthStore } from './src/store/authStore';

// Global error handler to prevent hard crashes
const defaultErrorHandler = (global as any).ErrorUtils.getGlobalHandler();
(global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
  console.log('Caught global error:', error, 'isFatal:', isFatal);
  // Optionally, you can show a generic alert or log it
  if (!__DEV__) {
    // Prevent the app from exiting in production if possible
  }
  // Call the default behavior if needed, or swallow the error
  // defaultErrorHandler(error, isFatal);
});

AppRegistry.registerComponent(appName, () => App);

