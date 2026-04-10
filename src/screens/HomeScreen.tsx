import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { colors } from '../theme/colors';
import OrderCard from '../components/OrderCard';

const MOCK_ORDERS = [
  { id: '1', pharmacy: 'City Health Pharma', dropoff: 'DD Mall Road', distance: '1.2', payout: '45' },
  { id: '2', pharmacy: 'Wellness Meds', dropoff: 'Maharaj Bada', distance: '2.5', payout: '60' },
  { id: '3', pharmacy: 'QuickCare Pharmacy', dropoff: 'City Center', distance: '3.1', payout: '75' },
  { id: '4', pharmacy: 'LifeLine Chemists', dropoff: 'Morar Cantt', distance: '4.0', payout: '85' },
  { id: '5', pharmacy: 'CureAll Pharmacy', dropoff: 'Phoolbagh', distance: '5.2', payout: '110' },
];

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'MediGhar Rider needs access to your location to find nearby orders.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.warn(err);
        setLoading(false);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location: ', error);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.locationLabel}>Current Location</Text>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}> Locating...</Text>
          </View>
        ) : (
          <Text style={styles.locationValue}>
            📍 Gwalior, Madhya Pradesh
          </Text>
        )}
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Nearby Orders ({MOCK_ORDERS.length})</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={MOCK_ORDERS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <OrderCard order={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  locationLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default HomeScreen;
