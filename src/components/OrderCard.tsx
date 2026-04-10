import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

const OrderCard = ({ order }: { order: any }) => {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('OrderDetails', { order })}
    >
      <View style={styles.topRow}>
        <Text style={styles.pharmacyName}>{order.pharmacy}</Text>
        <Text style={styles.distance}>{order.distance} km</Text>
      </View>

      <Text style={styles.dropoff}>To: {order.dropoff}</Text>

      <View style={styles.bottomRow}>
        <Text style={styles.payout}>₹{order.payout}</Text>
        <View style={styles.acceptBadge}>
          <Text style={styles.acceptText}>View & Accept</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacyName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  distance: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropoff: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  payout: {
    color: colors.success,
    fontSize: 18,
    fontWeight: 'bold',
  },
  acceptBadge: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  acceptText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OrderCard;
