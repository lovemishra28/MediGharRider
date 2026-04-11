import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { ArrowLeft, MapPin, Navigation, Clock, Package } from 'lucide-react-native';
import api from '../services/api';

const OrderDetailsScreen = ({ route, navigation }: any) => {
  const { order } = route.params;
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  // Support both API and legacy field names
  const pharmacy = order.pharmacyName || order.pharmacy;
  const pickupAddress = order.pickupAddress || 'Pharmacy Location';
  const dropoff = order.dropoffAddress || order.dropoff;
  const payout = order.totalPayout || order.payout;
  const distance = order.distance;
  const estimatedTime = order.estimatedTime;
  const items = order.items || [];
  const orderId = order._id || order.id;

  const handleAcceptOrder = async () => {
    setLoading(true);
    try {
      await api.post(`/orders/${orderId}/accept`);
      Alert.alert(
        '✅ Order Accepted!',
        `Navigate to ${pharmacy} for pickup.`,
        [{
          text: 'Go to My Deliveries',
          onPress: () => {
            navigation.goBack();
            // Navigate to the Deliveries tab
            navigation.navigate('MainTabs', { screen: 'DeliveriesTab' });
          },
        }],
      );
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to accept order. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Pharmacy Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.pharmacyName, { color: colors.text }]}>{pharmacy}</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MapPin size={16} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pickup</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{pickupAddress}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Navigation size={16} color={colors.success} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Dropoff</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{dropoff}</Text>
            </View>
          </View>

          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.stat}>
              <Navigation size={14} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{distance} km</Text>
            </View>
            {estimatedTime && (
              <View style={styles.stat}>
                <Clock size={14} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{estimatedTime} min</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Card */}
        {items.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.itemsHeader}>
              <Package size={18} color={colors.primary} />
              <Text style={[styles.itemsTitle, { color: colors.text }]}>  Items ({items.length})</Text>
            </View>
            {items.map((item: any, idx: number) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemQty, { color: colors.textSecondary }]}>x{item.quantity}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Payout */}
        <View style={styles.payoutContainer}>
          <Text style={[styles.payoutLabel, { color: colors.textSecondary }]}>Estimated Payout</Text>
          <Text style={[styles.payoutAmount, { color: colors.success }]}>₹{payout}</Text>
        </View>
      </View>

      {/* Accept Button */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: colors.primary }]}
          onPress={handleAcceptOrder}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1,
  },
  backButton: { padding: 5, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  card: {
    borderRadius: 14, padding: 18, borderWidth: 1, marginBottom: 16,
  },
  pharmacyName: { fontSize: 20, fontWeight: 'bold', marginBottom: 14 },
  divider: { height: 1, marginBottom: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  detailIcon: { width: 28, paddingTop: 2 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row', gap: 24, paddingTop: 14, borderTopWidth: 1,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 14, fontWeight: '600' },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemsTitle: { fontSize: 16, fontWeight: 'bold' },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemName: { fontSize: 14 },
  itemQty: { fontSize: 14, fontWeight: '600' },
  payoutContainer: { alignItems: 'center', marginTop: 8 },
  payoutLabel: { fontSize: 16, marginBottom: 4 },
  payoutAmount: { fontSize: 36, fontWeight: 'bold' },
  footer: { padding: 20, borderTopWidth: 1 },
  acceptButton: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  acceptButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default OrderDetailsScreen;
