import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Package, User, Wallet } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import MyDeliveriesScreen from '../screens/MyDeliveriesScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="DeliveriesTab"
        component={MyDeliveriesScreen}
        options={{ tabBarLabel: 'Deliveries', tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletScreen}
        options={{ tabBarLabel: 'Wallet', tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
