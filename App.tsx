import React, { useEffect } from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import OrderDetailsScreen from './src/screens/OrderDetailsScreen';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useAuthStore } from './src/store/authStore';
import { connectSocket } from './src/services/socket';
import ErrorBoundary from './src/components/ErrorBoundary';
import SplashScreen from './src/screens/SplashScreen';
import { useState } from 'react';

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
  const { isDarkMode, colors } = useTheme();
  const { isAuthenticated, isLoading, accessToken, rider, hydrate } = useAuthStore();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // Hydrate auth state from AsyncStorage on app start
  useEffect(() => {
    hydrate();
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Reconnect socket when app starts and user is authenticated
  useEffect(() => {
    if (!isSplashVisible && isAuthenticated && accessToken) {
      connectSocket(accessToken);
    }
  }, [isSplashVisible, isAuthenticated, accessToken]);

  const NavigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      primary: colors.primary,
      border: colors.border,
    },
  };

  // Show splash screen during hydration
  if (isLoading || isSplashVisible) {
    return <SplashScreen />;
  }

  // Determine if rider profile is complete (has name)
  const isProfileComplete = isAuthenticated && rider?.name;

  return (
    <NavigationContainer theme={NavigationTheme}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isProfileComplete ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
