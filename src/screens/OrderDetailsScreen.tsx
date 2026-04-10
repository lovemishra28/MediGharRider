import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const OrderDetailsScreen = ({ route, navigation }: any) => {
  const { order } = route.params;

  const handleAcceptOrder = () => {
    Alert.alert(
      'Order Accepted!',
      `You have accepted the delivery for ${order.pharmacy}. Navigate to the pickup location.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.pharmacyName}>{order.pharmacy}</Text>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup:</Text>
            <Text style={styles.detailValue}>Current Location</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dropoff:</Text>
            <Text style={styles.detailValue}>{order.dropoff}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Distance:</Text>
            <Text style={styles.detailValue}>{order.distance} km</Text>
          </View>
        </View>

        <View style={styles.payoutContainer}>
          <Text style={styles.payoutLabel}>Estimated Payout</Text>
          <Text style={styles.payoutAmount}>₹{order.payout}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptOrder}>
          <Text style={styles.acceptButtonText}>Accept Order</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  pharmacyName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  detailValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  payoutContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  payoutLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 5,
  },
  payoutAmount: {
    color: colors.success,
    fontSize: 36,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderDetailsScreen;
