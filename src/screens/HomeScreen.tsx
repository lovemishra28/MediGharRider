import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  RefreshControl,
  AppState,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import { WebView } from 'react-native-webview';
import { Power, PowerOff, ChevronUp, ChevronDown, Plus } from 'lucide-react-native';
import OrderCard from '../components/OrderCard';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';
import { goOnline, goOffline, onNewOrder, onOrderAccepted } from '../services/socket';
import { useAuthStore } from '../store/authStore';

const { height } = Dimensions.get('window');

const HomeScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const rider = useAuthStore((s) => s.rider);

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const appStateRef = React.useRef(AppState.currentState);
  const webviewRef = useRef<any>(null);

  // Bottom Sheet animation
  const [isExpanded, setIsExpanded] = useState(true); // true = sheet up, false = sheet down
  const sheetAnim = React.useRef(new Animated.Value(height * 0.45)).current;  // height * 0.45 default top pos

  const toggleSheet = () => {
    Animated.spring(sheetAnim, {
      toValue: isExpanded ? height - 120 : height * 0.45,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
    setIsExpanded(!isExpanded);
  };

  // Track app state so permission requests are only attempted while active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  // Socket listeners
  useEffect(() => {
    const unsubNew = onNewOrder((data: any) => {
      setOrders((prev) => {
        // Prevent duplicates
        if (prev.find((o) => o.id === data.order.id)) return prev;
        return [data.order, ...prev];
      });
    });

    const unsubAccepted = onOrderAccepted((data: any) => {
      setOrders((prev) => prev.filter((o) => o.id !== data.orderId));
    });

    return () => {
      unsubNew();
      unsubAccepted();
    };
  }, []);

  const delayForPermission = () => {
    return new Promise<void>((resolve) => {
      if (typeof global.requestIdleCallback === 'function') {
        global.requestIdleCallback(() => resolve(), { timeout: 500 });
      } else {
        setTimeout(resolve, 500);
      }
    });
  };

  const requestLocationPermission = async (retryCount = 0) => {
    if (Platform.OS === 'android') {
      if (appStateRef.current !== 'active') {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (appStateRef.current !== 'active') {
          setLoading(false);
          return;
        }
      }

      try {
        await delayForPermission();

        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (hasPermission) {
          getCurrentLocation();
          return;
        }

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Medyghar Rider needs access to your location to find nearby orders.',
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
      } catch (err: any) {
        const msg = err?.message || String(err || '');
        if (
          retryCount < 2 &&
          msg.includes('not attached to an Activity')
        ) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          return requestLocationPermission(retryCount + 1);
        }

        console.warn(err);
        setLoading(false);
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    setTimeout(() => {
      Geolocation.getCurrentPosition(
        (position) => {
          let { latitude, longitude } = position.coords;
          // Override US coordinates (from Android emulator) to Gwalior, India for testing
          if (longitude < -50) {
            latitude = 26.2183;
            longitude = 78.1828;
          }
          setLocation({ ...position.coords, latitude, longitude });
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location: ', error);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    }, 80);
  };

  // Fetch nearby orders from API
  const fetchNearbyOrders = useCallback(async (lat: number, lng: number) => {
    setFetchingOrders(true);
    setOrdersError(null);
    try {
      const { data } = await api.get('/orders/nearby', {
        params: { lat, lng, radius: 5000 },
      });
      setOrders(data.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
      setOrdersError('Could not load nearby orders. Check internet/server and pull to refresh.');
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

  const handleToggleOnline = async (value: boolean) => {
    if (value) {
      if (!location) {
        setIsOnline(true);
        setFetchingOrders(true);
        await requestLocationPermission();
      } else {
        setIsOnline(true);
        goOnline(location.latitude, location.longitude);
        fetchNearbyOrders(location.latitude, location.longitude);
      }
    } else {
      setIsOnline(false);
      setFetchingOrders(false);
      goOffline();
      setOrders([]);
      setOrdersError(null);
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
      icon: L.divIcon({ className: '', html: '<div class="glowing-circle"></div>', iconSize: [14, 14], iconAnchor: [7, 7] })
    }).addTo(map).bindPopup('<b>${(o.pharmacyName || '').replace(/'/g, '')}</b><br/>Payout: ₹${o.totalPayout}<br/>Distance: ${o.distance}km');`;
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
          
          /* Glowing animation for orders */
          @keyframes glow {
            0% { box-shadow: 0 0 5px 0px ${isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}; transform: scale(0.9); }
            50% { box-shadow: 0 0 15px 5px ${isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'}; transform: scale(1.1); }
            100% { box-shadow: 0 0 5px 0px ${isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}; transform: scale(0.9); }
          }
          .glowing-circle {
            width: 14px;
            height: 14px;
            background-color: ${isDarkMode ? '#FFF' : '#111'};
            border-radius: 50%;
            border: 2px solid ${isDarkMode ? '#111' : '#FFF'};
            animation: glow 1.5s ease-in-out infinite;
          }
          .my-location-marker {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));
            animation: popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          .focus-ring {
            position: absolute;
            width: 120px;
            height: 120px;
            left: 50%;
            bottom: 0;
            margin-left: -60px;
            margin-bottom: -60px;
            border-radius: 50%;
            background-color: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
            border: 2px solid ${isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
            animation: compactRing 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
            pointer-events: none;
            z-index: -1;
          }
          @keyframes compactRing {
            0% { transform: scale(10); opacity: 0; }
            10% { opacity: 1; border-width: 0.5px; }
            100% { transform: scale(0.1); opacity: 0; border-width: 4px; }
          }
          @keyframes popIn {
            0% { transform: scale(0) translateY(-20px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <script>
          const map = L.map('map', { attributionControl: false, zoomControl: false }).setView([${currentLat - 0.035}, ${currentLng}], 13);
          L.tileLayer('${isDarkMode ? "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" : "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"}', {
            maxZoom: 19,
          }).addTo(map);
          L.marker([${currentLat}, ${currentLng}], {
            icon: L.divIcon({ 
              className: '', 
              html: '<div class="my-location-marker"><div class="focus-ring"></div><svg width="28" height="28" viewBox="0 0 24 24" fill="${isDarkMode ? '#000' : '#FFF'}" stroke="${isDarkMode ? '#FFF' : '#000'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>', 
              iconSize: [28, 28], 
              iconAnchor: [14, 28] 
            })
          }).addTo(map);
          L.circle([${currentLat}, ${currentLng}], {
            radius: 2000,
            stroke: false,
            fillColor: '${isDarkMode ? '#FFF' : '#000'}',
            fillOpacity: 0.05,
          }).addTo(map);
          ${orderMarkers}

          function zoomIn() {
            map.setZoom(Math.min(map.getZoom() + 1, 19));
          }
          function zoomOut() {
            map.setZoom(Math.max(map.getZoom() - 1, 5));
          }
          function resetView() {
            map.setView([${currentLat - 0.035}, ${currentLng}], 13);
          }
          window.zoomIn = zoomIn;
          window.zoomOut = zoomOut;
          window.resetView = resetView;
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.card }]}> 
      {/* Thin App Header */}
      <View style={[styles.appHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.appHeaderTitle, { color: colors.text }]}>Medyghar</Text>
      </View>

      <View style={[styles.screenContent, { backgroundColor: colors.background }]}> 
        {/* Map (Full Background) */}
        <View style={styles.mapBackground}>
          {loading ? (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.text} />
          </View>
        ) : (
          <>
            <WebView
              ref={webviewRef}
              style={[styles.map, { backgroundColor: 'transparent' }]}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              bounces={false}
              source={{ html: mapHtml }}
            />
            <View style={styles.mapControls}>
              <TouchableOpacity
                style={[styles.mapControlButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                activeOpacity={0.85}
                onPress={() => webviewRef.current?.injectJavaScript('zoomIn(); true;')}
              >
              <Text style={[styles.mapControlText, { color: colors.text }]}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapControlButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              activeOpacity={0.85}
              onPress={() => webviewRef.current?.injectJavaScript('zoomOut(); true;')}
            >
              <Text style={[styles.mapControlText, { color: colors.text }]}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapControlButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              activeOpacity={0.85}
              onPress={() => webviewRef.current?.injectJavaScript('resetView(); true;')}
            >
              <Text style={[styles.mapControlText, { color: colors.text, fontSize: 12 }]}>Reset</Text>
            </TouchableOpacity>
          </View>
          </>
        )}
      </View>

      </View>

      {/* Bottom Sheet / Section */}
      <Animated.View style={[ 
        styles.bottomSheet,
        { backgroundColor: colors.background, top: sheetAnim }
      ]}>
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={styles.dragArea}>
            <TouchableOpacity activeOpacity={0.9} onPress={toggleSheet} style={{ padding: 10, alignSelf: 'center', width: '100%', alignItems: 'center' }}>
              {isExpanded ? (
                <ChevronDown color={colors.textSecondary} size={24} />
              ) : (
                <ChevronUp color={colors.textSecondary} size={24} />
              )}
            </TouchableOpacity>
          </View>

          {/* Custom Online Toggle Button (Profile Style) */}
          <View style={styles.sheetHeaderWrapper}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                { backgroundColor: isOnline ? (isDarkMode ? '#FFF' : '#111') : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') }
              ]}
              activeOpacity={0.85}
              onPress={() => handleToggleOnline(!isOnline)}
            >
              <View style={[styles.toggleLeft, { justifyContent: 'center', flex: 1 }]}>
                {isOnline ? (
                  <Power size={22} color={isDarkMode ? '#000' : '#FFF'} />
                ) : (
                  <PowerOff size={22} color={colors.textSecondary} />
                )}
                <Text style={[
                  styles.toggleText,
                  { color: isOnline ? (isDarkMode ? '#000' : '#FFF') : colors.textSecondary }
                ]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.listHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isOnline ? 'Nearby Orders' : 'Go Online to See Orders'}
            </Text>
            {fetchingOrders && <ActivityIndicator size="small" color={colors.text} style={{ marginLeft: 8 }} />}
          </View>
          {ordersError ? (
            <Text style={[styles.fetchErrorText, { color: colors.textSecondary }]}>{ordersError}</Text>
          ) : null}

          {isOnline ? (
            <FlatList
              data={orders}
              keyExtractor={(item) => item.id || item.id}
              renderItem={({ item }) => <OrderCard order={item} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
              }
              ListEmptyComponent={
                !fetchingOrders ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No nearby orders right now. Pull down to refresh.
                    </Text>
                  </View>
                ) : null
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Toggle the button above to start receiving delivery orders.
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};const styles = StyleSheet.create({
  container: { flex: 1 },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    height: 56,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  screenContent: {
    flex: 1,
  },
  appHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  mapBackground: {
    ...StyleSheet.absoluteFill,
    top: 0,
    zIndex: 0,
  },
  map: { ...StyleSheet.absoluteFill },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    zIndex: 10,
    overflow: 'hidden',
  },
  dragArea: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetHeaderWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  toggleBtn: {
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '700',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  listContent: { paddingBottom: height * 0.5, paddingHorizontal: 20 },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20,
    alignItems: 'flex-end',
  },
  mapControlButton: {
    width: 54,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  mapControlText: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  fetchErrorText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20, marginBottom: 10 },
});

export default HomeScreen;



