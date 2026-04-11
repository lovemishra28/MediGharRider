import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Building2 } from 'lucide-react-native';

const OrderCard = ({ order }: { order: any }) => {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();

  // Support both API fields and legacy mock fields
  const pharmacy = order.pharmacyName || order.pharmacy;
  const dropoff = order.dropoffAddress || order.dropoff;
  const payout = order.totalPayout || order.payout;
  const distance = order.distance;
  const id = order._id || order.id;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isDarkMode ? colors.border : 'transparent',
          borderWidth: isDarkMode ? 1 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0 : 0.05,
          shadowRadius: 8,
          elevation: isDarkMode ? 0 : 3,
        },
      ]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('OrderDetails', { order })}
    >
      <View style={styles.topRow}>
        <View style={styles.pharmacyBadge}>
          <Building2 size={24} color={colors.primary} />
        </View>
        <View style={styles.pharmacyInfo}>
          <Text style={[styles.pharmacyName, { color: colors.text }]} numberOfLines={1}>
            {pharmacy}
          </Text>
          <Text style={[styles.dropoff, { color: colors.textSecondary }]}>Dropoff: {dropoff}</Text>
        </View>
        <Text style={[styles.distance, { color: colors.primary }]}>{distance} km</Text>
      </View>

      <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.payoutLabel, { color: colors.textSecondary }]}>Est. Payout</Text>
          <Text style={[styles.payout, { color: colors.success }]}>₹{payout}</Text>
        </View>

        <View style={[styles.acceptBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.acceptText}>Review Order</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pharmacyBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 136, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pharmacyInfo: {
    flex: 1,
    marginRight: 10,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  distance: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  dropoff: {
    fontSize: 13,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  payoutLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  payout: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  acceptBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  acceptText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OrderCard;
