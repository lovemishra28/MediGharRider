import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Inbox, CheckCircle, MapPin, Truck, Flag, Package, X } from 'lucide-react-native';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_STEPS = [
  { key: 'accepted', label: 'Accepted', icon: CheckCircle },
  { key: 'at-pickup', label: 'At Pickup', icon: MapPin },
  { key: 'in-transit', label: 'In Transit', icon: Truck },
  { key: 'arrived', label: 'Arrived', icon: Flag },
  { key: 'delivered', label: 'Delivered', icon: Package },
];

const NEXT_STATUS: Record<string, string> = {
  'accepted': 'at-pickup',
  'at-pickup': 'in-transit',
  'in-transit': 'arrived',
  'arrived': 'delivered',
};

const MyDeliveriesScreen = () => {
  const { colors } = useTheme();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get('/orders/active'),
        api.get('/orders/history?limit=10'),
      ]);
      setActiveOrder(activeRes.data.data.order);
      setHistory(historyRes.data.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleUpdateStatus = async () => {
    if (!activeOrder) return;

    const nextStatus = NEXT_STATUS[activeOrder.status];
    if (!nextStatus) return;

    // If moving to delivered, show OTP modal instead
    if (nextStatus === 'delivered') {
      setShowOtpModal(true);
      return;
    }

    setUpdating(true);
    try {
      const { data } = await api.patch(`/orders/${activeOrder._id}/status`, {
        status: nextStatus,
      });
      setActiveOrder(data.data.order);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyDelivery = async () => {
    if (deliveryOtp.length !== 4) {
      Alert.alert('Invalid', 'Please enter the 4-digit delivery OTP.');
      return;
    }

    setUpdating(true);
    try {
      await api.post(`/orders/${activeOrder._id}/verify-delivery`, {
        otp: deliveryOtp,
      });
      Alert.alert('🎉 Delivery Complete!', 'Earnings have been credited to your wallet.');
      setShowOtpModal(false);
      setDeliveryOtp('');
      fetchData(); // Refresh to move order to history
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid OTP. Try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Delivery?',
      'Are you sure you want to cancel this delivery?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/orders/${activeOrder._id}/status`, {
                status: 'cancelled',
                cancellationReason: 'Cancelled by rider',
              });
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Cancel failed.');
            }
          },
        },
      ]
    );
  };

  const getCurrentStepIndex = () => {
    return STATUS_STEPS.findIndex((s) => s.key === activeOrder?.status);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Deliveries</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={() => (
          <>
            {/* Active Order */}
            {activeOrder ? (
              <View style={[styles.activeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.activeHeader}>
                  <Text style={[styles.activeLabel, { color: colors.primary }]}>ACTIVE DELIVERY</Text>
                  <Text style={[styles.orderNumber, { color: colors.textSecondary }]}>
                    #{activeOrder.orderNumber}
                  </Text>
                </View>

                <Text style={[styles.pharmacyName, { color: colors.text }]}>
                  {activeOrder.pharmacyName}
                </Text>
                <Text style={[styles.dropoffText, { color: colors.textSecondary }]}>
                  → {activeOrder.dropoffAddress}
                </Text>

                {/* Status Stepper */}
                <View style={styles.stepper}>
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = getCurrentStepIndex();
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    const Icon = step.icon;

                    return (
                      <View key={step.key} style={styles.stepItem}>
                        <View
                          style={[
                            styles.stepDot,
                            {
                              backgroundColor: isCompleted ? colors.primary : colors.border,
                              borderColor: isCurrent ? colors.primary : 'transparent',
                              borderWidth: isCurrent ? 2 : 0,
                            },
                          ]}
                        >
                          <Icon size={14} color={isCompleted ? '#FFF' : colors.textSecondary} />
                        </View>
                        <Text
                          style={[
                            styles.stepLabel,
                            { color: isCompleted ? colors.primary : colors.textSecondary },
                          ]}
                        >
                          {step.label}
                        </Text>
                        {idx < STATUS_STEPS.length - 1 && (
                          <View
                            style={[
                              styles.stepLine,
                              { backgroundColor: idx < currentIdx ? colors.primary : colors.border },
                            ]}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Payout */}
                <View style={[styles.payoutRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.payoutLabel, { color: colors.textSecondary }]}>Payout</Text>
                  <Text style={[styles.payoutValue, { color: colors.success }]}>
                    ₹{activeOrder.totalPayout}
                  </Text>
                </View>

                {/* Action Buttons */}
                {NEXT_STATUS[activeOrder.status] && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { borderColor: colors.border }]}
                      onPress={handleCancelOrder}
                    >
                      <Text style={[styles.cancelText, { color: '#EA4335' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.nextBtn, { backgroundColor: colors.primary }]}
                      onPress={handleUpdateStatus}
                      disabled={updating}
                    >
                      {updating ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.nextBtnText}>
                          {NEXT_STATUS[activeOrder.status] === 'delivered'
                            ? 'Verify & Deliver'
                            : `Mark: ${STATUS_STEPS.find((s) => s.key === NEXT_STATUS[activeOrder.status])?.label}`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noActiveContainer}>
                <Inbox size={40} color={colors.textSecondary} />
                <Text style={[styles.noActiveText, { color: colors.textSecondary }]}>
                  No active delivery
                </Text>
              </View>
            )}

            {/* History Header */}
            {history.length > 0 && (
              <Text style={[styles.historyTitle, { color: colors.text }]}>Recent History</Text>
            )}
          </>
        )}
        renderItem={({ item }) => (
          <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyPharmacy, { color: colors.text }]} numberOfLines={1}>
                  {item.pharmacyName}
                </Text>
                <Text style={[styles.historyDropoff, { color: colors.textSecondary }]} numberOfLines={1}>
                  → {item.dropoffAddress}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.historyPayout, { color: colors.success }]}>₹{item.totalPayout}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'delivered' ? colors.success + '20' : '#EA4335' + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: item.status === 'delivered' ? colors.success : '#EA4335' },
                    ]}
                  >
                    {item.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !activeOrder ? (
            <View style={styles.centered}>
              <Text style={[styles.noActiveText, { color: colors.textSecondary }]}>
                No delivery history yet.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      {/* OTP Verification Modal */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Verify Delivery</Text>
              <TouchableOpacity onPress={() => setShowOtpModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter the 4-digit OTP provided by the customer
            </Text>
            <TextInput
              style={[styles.otpInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter OTP"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={4}
              value={deliveryOtp}
              onChangeText={setDeliveryOtp}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.verifyBtn, { backgroundColor: colors.primary }]}
              onPress={handleVerifyDelivery}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.verifyBtnText}>Complete Delivery</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  listContent: { padding: 16 },

  // Active Order Card
  activeCard: { borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 20 },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  activeLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  orderNumber: { fontSize: 12 },
  pharmacyName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  dropoffText: { fontSize: 14, marginBottom: 16 },

  // Stepper
  stepper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  stepItem: { alignItems: 'center', flex: 1, position: 'relative' },
  stepDot: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  stepLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  stepLine: {
    position: 'absolute', top: 15, left: '60%', right: '-40%', height: 2,
  },

  // Payout
  payoutRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, paddingTop: 12, marginBottom: 12,
  },
  payoutLabel: { fontSize: 14 },
  payoutValue: { fontSize: 22, fontWeight: 'bold' },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600' },
  nextBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  // No Active
  noActiveContainer: { alignItems: 'center', paddingVertical: 30 },
  noActiveText: { fontSize: 15, marginTop: 8 },

  // History
  historyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 4 },
  historyCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyPharmacy: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  historyDropoff: { fontSize: 13 },
  historyPayout: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 14, marginBottom: 20 },
  otpInput: {
    height: 56, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16, fontSize: 24, fontWeight: 'bold',
    textAlign: 'center', letterSpacing: 8, marginBottom: 20,
  },
  verifyBtn: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  verifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default MyDeliveriesScreen;
