import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Dimensions,
  Switch,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import { WebView } from 'react-native-webview';
import OrderCard from '../components/OrderCard';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';
import { goOnline, goOffline, onNewOrder, onOrderAccepted } from '../services/socket';
import { useAuthStore } from '../store/authStore';

const { height } = Dimensions.get('window');

const HomeScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const rider = useAuthStore((s) => s.rider);

  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Socket listeners
  useEffect(() => {
    const unsubNew = onNewOrder((data: any) => {
      setOrders((prev) => {
        // Prevent duplicates
        if (prev.find((o) => o._id === data.order._id)) return prev;
        return [data.order, ...prev];
      });
    });

    const unsubAccepted = onOrderAccepted((data: any) => {
      setOrders((prev) => prev.filter((o) => o._id !== data.orderId));
    });

    return () => {
      unsubNew();
      unsubAccepted();
    };
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

  // Fetch nearby orders from API
  const fetchNearbyOrders = useCallback(async (lat: number, lng: number) => {
    setFetchingOrders(true);
    try {
      const { data } = await api.get('/orders/nearby', {
        params: { lat, lng, radius: 5000 },
      });
      setOrders(data.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setFetchingOrders(false);
    }
  }, []);

  // Fetch orders when going online or on pull-to-refresh
  useEffect(() => {
    if (isOnline && location) {
      fetchNearbyOrders(location.latitude, location.longitude);
    }
  }, [isOnline, location]);

  const handleToggleOnline = (value: boolean) => {
    setIsOnline(value);
    if (value && location) {
      goOnline(location.latitude, location.longitude);
      fetchNearbyOrders(location.latitude, location.longitude);
    } else {
      goOffline();
      setOrders([]);
    }
  };

  const onRefresh = async () => {
    if (!isOnline || !location) return;
    setRefreshing(true);
    await fetchNearbyOrders(location.latitude, location.longitude);
    setRefreshing(false);
  };

  const defaultLat = 26.2183;
  const defaultLng = 78.1828;
  const currentLat = location?.latitude || defaultLat;
  const currentLng = location?.longitude || defaultLng;

  // Build map HTML with order markers
  const orderMarkers = orders.map((o) => {
    const [lng, lat] = o.pickupLocation?.coordinates || [0, 0];
    return `L.marker([${lat}, ${lng}], {
      icon: L.divIcon({ className: '', html: '<div class="blinking-dot" style="background:#EA4335;color:#fff;padding:6px;border-radius:12px;font-size:12px;font-weight:bold;white-space:nowrap;box-shadow:0 0 10px #EA4335;">⚕️ ₹${o.totalPayout}</div>' })
    }).addTo(map).bindPopup('<b>${(o.pharmacyName || '').replace(/'/g, '')}</b><br/>Distance: ${o.distance}km');`;
  }).join('\n');

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <style>
          html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; background-color: transparent; }
          .leaflet-control-attribution { display: none !important; }
          
          /* Blinking animation for orders */
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 67, 53, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(234, 67, 53, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(234, 67, 53, 0); }
          }
          .blinking-dot {
            animation: pulse 1.5s infinite;
            display: inline-block;
            text-align: center;
          }

          .slider-wrapper {
            position: absolute;
            right: 15px;
            top: 50%;
            margin-top: -85px; 
            width: 44px;
            height: 140px;
            z-index: 1000;
            background: ${isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)'};
            border-radius: 22px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            display: flex;
            justify-content: center;
          }
          .slider-box {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-90deg);
            width: 100px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          input[type="range"] {
            -webkit-appearance: none;
            width: 80px;
            height: 4px;
            background: ${isDarkMode ? '#555' : '#E5E7EB'};
            border-radius: 2px;
            outline: none;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #2D88FF;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="slider-wrapper">
          <div style="position: absolute; top: 12px; font-weight: bold; font-family: sans-serif; color: ${isDarkMode ? '#888' : '#aaa'}; font-size: 16px; pointer-events: none;">+</div>
          <div class="slider-box">
            <input type="range" id="zoom-slider" min="5" max="19" step="0.1" value="14" />
          </div>
          <div style="position: absolute; bottom: 12px; font-weight: bold; font-family: sans-serif; color: ${isDarkMode ? '#888' : '#aaa'}; font-size: 16px; pointer-events: none;">−</div>
        </div>
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <script>
          const map = L.map('map', { attributionControl: false, zoomControl: false }).setView([${currentLat}, ${currentLng}], 14);
          L.tileLayer('${isDarkMode ? "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" : "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"}', {
            maxZoom: 19,
          }).addTo(map);
          L.marker([${currentLat}, ${currentLng}]).addTo(map).bindPopup('My Location').openPopup();
          L.circle([${currentLat}, ${currentLng}], {
            radius: 2000,
            stroke: false,
            fillColor: '${isDarkMode ? 'rgba(45, 136, 255, 0.18)' : 'rgba(45, 136, 255, 0.12)'}',
            fillOpacity: 0.8,
          }).addTo(map);
          ${orderMarkers}
          
          // Sync Map and custom Slider
          const zoomSlider = document.getElementById('zoom-slider');
          zoomSlider.addEventListener('input', function(e) {
            map.setZoom(e.target.value);
          });
          map.on('zoom', function() {
            zoomSlider.value = map.getZoom();
          });
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Online/Offline Toggle */}
      <View style={[styles.statusBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#34A853' : '#EA4335' }]} />
          <Text style={[styles.statusText, { color: colors.text }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          {rider?.name ? (
            <Text style={[styles.riderName, { color: colors.textSecondary }]}> · {rider.name}</Text>
          ) : null}
        </View>
        <Switch
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={isOnline ? '#FFF' : '#f4f3f4'}
          onValueChange={handleToggleOnline}
          value={isOnline}
        />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.text, marginTop: 10 }}>Finding your location...</Text>
          </View>
        ) : (
          <WebView
            style={[styles.map, { backgroundColor: 'transparent' }]}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            bounces={false}
            source={{ html: mapHtml }}
          />
        )}
      </View>

      {/* Orders List */}
      <View style={[styles.listContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.dragHandle, { backgroundColor: isDarkMode ? '#555555' : '#D1D5DB' }]} />
        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isOnline ? 'Nearby Orders' : 'Go Online to See Orders'}
          </Text>
          {isOnline && (
            <Text style={[styles.orderCount, { backgroundColor: colors.card, color: colors.primary }]}>
              {' '}{orders.length}{' '}
            </Text>
          )}
          {fetchingOrders && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
        </View>

        {isOnline ? (
          <FlatList
            data={orders}
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => <OrderCard order={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              !fetchingOrders ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No nearby orders right now.{'\n'}Pull down to refresh.
                  </Text>
                </View>
              ) : null
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Toggle the switch above to start receiving delivery orders.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  riderName: { fontSize: 14 },
  mapContainer: {
    height: '45%',
    width: '100%',
    zIndex: 0,
  },
  map: { ...StyleSheet.absoluteFill },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  dragHandle: {
    width: 50,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  orderCount: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  listContent: { paddingBottom: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});

export default HomeScreen;
