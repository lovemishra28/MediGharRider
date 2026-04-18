import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { CommonActions } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }: any) => {
  const { colors } = useTheme();

  useEffect(() => {
    // Show splash screen for 3-4 seconds, then transition to App
    const timer = setTimeout(() => {
      // Navigate to AuthNavigator or MainTabNavigator based on state.
      // We'll let the Root navigator handle it by not blocking, 
      // but since we want to show it before the app starts...
      // Let's reset the stack to Auth if not logged in.
      // We need to coordinate with the global navigation structure.
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
  },
});

export default SplashScreen;
