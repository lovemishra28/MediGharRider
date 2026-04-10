import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import { WebView } from 'react-native-webview';
import OrderCard from '../components/OrderCard';
import { useTheme } from '../theme/ThemeContext';

const MOCK_ORDERS = [
  { id: '1', pharmacy: 'City Health Pharma', dropoff: 'DD Mall Road', distance: '1.2', payout: '45' },
  { id: '2', pharmacy: 'Wellness Meds', dropoff: 'Maharaj Bada', distance: '2.5', payout: '60' },
  { id: '3', pharmacy: 'QuickCare Pharmacy', dropoff: 'City Center', distance: '3.1', payout: '75' },
];

const { height } = Dimensions.get('window');

const HomeScreen = () => {
  const { colors, isDarkMode } = useTheme();
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

  const defaultLat = 26.2183;
  const defaultLng = 78.1828;

  const currentLat = location?.latitude || defaultLat;
  const currentLng = location?.longitude || defaultLng;

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <script>
          const map = L.map('map').setView([${currentLat}, ${currentLng}], 13);
          L.tileLayer('${isDarkMode ? "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" : "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"}', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://carto.com">CartoDB</a> contributors'
          }).addTo(map);
          L.marker([${currentLat}, ${currentLng}]).addTo(map).bindPopup('My Location').openPopup();
          L.circle([${currentLat}, ${currentLng}], {
            radius: 2000,
            stroke: false,
            fillColor: '${isDarkMode ? 'rgba(45, 136, 255, 0.18)' : 'rgba(45, 136, 255, 0.12)'}',
            fillOpacity: 0.8,
          }).addTo(map);
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.text, marginTop: 10 }}>Finding your location...</Text>
          </View>
        ) : (
          <WebView
            style={styles.map}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            source={{ html: mapHtml }}
          />
        )}
      </View>

      <View style={[styles.listContainer, { backgroundColor: colors.background }]}> 
        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Orders</Text>
          <Text style={[styles.orderCount, { backgroundColor: colors.card, color: colors.primary }]}> {MOCK_ORDERS.length} </Text>
        </View>

        <FlatList
          data={MOCK_ORDERS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: height * 0.4,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerPin: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  markerText: {
    fontSize: 18,
  },
  listContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  orderCount: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default HomeScreen;
